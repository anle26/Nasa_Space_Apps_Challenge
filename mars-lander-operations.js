import { Box3, Group, MathUtils, Quaternion, Vector3 } from 'three';
import insightPoses from './insight-poses.json';
import { createInsightTethers } from './mars-insight-tethers.js';

export function createLanderOperation(model, mission, groundOffset) {
  if (mission.id === 'insight') return createInstrumentDeployment(model, groundOffset);
  if (mission.model === 'viking.glb') return createSoilSampling(model);
  return null;
}

function createInstrumentDeployment(model, groundOffset) {
  const shoulder = model.getObjectByName('arm_02');
  const elbow = model.getObjectByName('arm_03');
  const grapple = model.getObjectByName('grapple');
  const payloads = ['SEIS', 'WTS', 'HP3_v3d_baked'].map(name => model.getObjectByName(name));
  if (!shoulder || !elbow || !grapple || payloads.some(part => !part)) return null;
  const nodes = new Map();
  model.traverse(part => {
    if (part.userData.name) nodes.set(part.userData.name, part);
  });
  const arm = capturePose(insightPoses.open, nodes);
  const panels = capturePose(Object.fromEntries(Object.entries(insightPoses.folded)
    .filter(([name]) => !(name in insightPoses.open))), nodes);
  const poseVector = new Vector3();
  const poseRotation = new Quaternion();
  const down = new Vector3(0, -1, 0);
  const up = new Vector3(0, 1, 0);
  const clawCenter = new Vector3();
  const fingers = grapple.children.filter(part => part.name.startsWith('claw_'));
  for (const finger of fingers) clawCenter.add(finger.position);
  clawCenter.divideScalar(fingers.length).multiplyScalar(1.14);
  const toolRotation = new Quaternion().setFromUnitVectors(clawCenter.clone().normalize(), down);
  const toolOffset = clawCenter.clone().applyQuaternion(toolRotation).multiplyScalar(model.scale.x);
  const shoulderRotation = new Quaternion();
  const elbowRotation = new Quaternion();
  const grip = new Vector3();
  const target = new Vector3();
  const shoulderPoint = new Vector3();
  const wristPoint = new Vector3();
  const elbowPoint = new Vector3();
  const direction = new Vector3();
  const pole = new Vector3();
  const parentRotation = new Quaternion();
  const turn = new Quaternion();
  const carryLift = .40;

  model.updateWorldMatrix(true, true);
  const instruments = payloads.map((part, i) => {
    const origin = part.getWorldPosition(new Vector3());
    if (i === 1) {
      // The two source meshes overlap at ground level. Adjust the shield's
      // vertical clearance while keeping its feet on the original deck plane.
      const bottom = new Box3().setFromObject(part, true).min.y;
      const padding = (origin.y - bottom) * .40;
      part.scale.y *= 1.40;
      origin.y += padding;
      part.position.copy(part.parent.worldToLocal(origin.clone()));
    }
    const bounds = new Box3().setFromObject(part, true);
    return {
      part, stowed: part.position.clone(),
      baseOffset: origin.y - bounds.min.y,
      handleHeight: bounds.max.y - origin.y,
      // WTS shares the SEIS footprint. HP³ sits beside it.
      x: i === 2 ? .43 : -.60,
      z: i === 2 ? 1.29 : 1.37,
    };
  });
  const tethers = createInsightTethers(model, payloads[0], payloads[2], groundOffset);

  function blendPose(parts, amount) {
    for (const { part, pose, position, rotation, scale } of parts) {
      part.position.copy(position).lerp(poseVector.fromArray(pose[0]), amount);
      part.quaternion.copy(rotation).slerp(poseRotation.fromArray(pose[1]), amount);
      part.scale.copy(scale).lerp(poseVector.fromArray(pose[2]), amount);
    }
  }

  function aimBone(bone, rest, childOffset, from, to) {
    bone.parent.getWorldQuaternion(parentRotation).invert();
    const desired = to.clone().sub(from).normalize().applyQuaternion(parentRotation);
    turn.setFromUnitVectors(childOffset.clone().normalize().applyQuaternion(rest), desired);
    bone.quaternion.copy(turn).multiply(rest);
  }

  function aimArm(point, amount) {
    shoulderRotation.copy(shoulder.quaternion);
    elbowRotation.copy(elbow.quaternion);
    const grappleRotation = grapple.quaternion.clone();
    shoulder.getWorldPosition(shoulderPoint);
    wristPoint.copy(point).sub(toolOffset);
    direction.subVectors(wristPoint, shoulderPoint).normalize();
    const upper = elbow.position.length() * model.scale.x;
    const lower = grapple.position.length() * model.scale.x;
    const reach = MathUtils.clamp(shoulderPoint.distanceTo(wristPoint), Math.abs(upper - lower) + .001, upper + lower - .001);
    wristPoint.copy(shoulderPoint).addScaledVector(direction, reach);
    const along = (upper ** 2 - lower ** 2 + reach ** 2) / (2 * reach);
    pole.copy(up).addScaledVector(direction, -up.dot(direction)).normalize();
    elbowPoint.copy(shoulderPoint).addScaledVector(direction, along)
      .addScaledVector(pole, Math.sqrt(Math.max(0, upper ** 2 - along ** 2)));
    aimBone(shoulder, shoulderRotation, elbow.position, shoulderPoint, elbowPoint);
    aimBone(elbow, elbowRotation, grapple.position, elbowPoint, wristPoint);
    grapple.parent.getWorldQuaternion(parentRotation).invert();
    grapple.quaternion.copy(parentRotation).multiply(toolRotation);
    shoulder.quaternion.slerp(shoulderRotation, 1 - amount);
    elbow.quaternion.slerp(elbowRotation, 1 - amount);
    grapple.quaternion.slerp(grappleRotation, 1 - amount);
  }

  function place(item, worldPosition) {
    item.part.position.copy(item.part.parent.worldToLocal(worldPosition));
  }

  function deployment(t) {
    blendPose(arm, 1);
    const activeIndex = Math.min(Math.floor(t * instruments.length), instruments.length - 1);
    const progress = t * instruments.length - activeIndex;
    for (const [index, item] of instruments.entries()) {
      item.part.position.copy(item.stowed);
      if (index > activeIndex) continue;

      const pick = item.part.getWorldPosition(new Vector3());
      const drop = new Vector3(item.x, -.075 + groundOffset(item.x, item.z) + item.baseOffset, item.z);
      if (index < activeIndex || progress >= .82) {
        place(item, drop.clone());
      } else if (progress >= .28) {
        const lift = MathUtils.smoothstep(progress, .28, .42);
        const cross = MathUtils.smoothstep(progress, .42, .66);
        const lower = MathUtils.smoothstep(progress, .66, .82);
        target.lerpVectors(pick, drop, cross);
        target.y = MathUtils.lerp(pick.y, Math.max(pick.y, drop.y) + carryLift, lift);
        target.y = MathUtils.lerp(target.y, drop.y, lower);
        place(item, target.clone());
      }
      if (index !== activeIndex) continue;

      item.part.getWorldPosition(grip);
      grip.y += item.handleHeight
        + .23 * (1 - MathUtils.smoothstep(progress, .12, .28))
        + .32 * MathUtils.smoothstep(progress, .84, .96);
      aimArm(grip, MathUtils.smoothstep(progress, 0, .12) * (1 - MathUtils.smoothstep(progress, .93, 1)));
    }
    tethers.update();
  }

  return {
    prepare(step) {
      blendPose(arm, 1);
      blendPose(panels, step <= 1 ? 1 : 0);
      if (step === 3) deployment(1);
    },
    openPanels(t) {
      blendPose(panels, 1 - MathUtils.smoothstep(t, .08, .94));
    },
    update: deployment,
    reset() {
      for (const { part, stowed } of instruments) part.position.copy(stowed);
      blendPose(arm, 0);
      blendPose(panels, 0);
      tethers.update();
    },
    dispose: tethers.dispose,
  };
}

function capturePose(pose, nodes) {
  return Object.entries(pose).flatMap(([name, value]) => {
    const part = nodes.get(name);
    return part ? [{
      part, pose: value, position: part.position.clone(), rotation: part.quaternion.clone(), scale: part.scale.clone(),
    }] : [];
  });
}

function createSoilSampling(model) {
  const chassis = model.getObjectByName('polySurfa1');
  // These two primitives contain the existing boom and collector in the NASA GLB.
  const parts = chassis?.children.filter(part => ['blinn6SG', 'blinn2SG'].includes(part.material?.name));
  if (parts?.length !== 2) return null;

  // Model coordinates before the lander's root rotation: +X along the boom,
  // +Y toward the ground. Rotate about the mounting point on the deck.
  const pivot = new Group();
  pivot.position.set(2.61, -4.1, .25);
  chassis.add(pivot);
  for (const part of parts) {
    pivot.add(part);
    part.position.sub(pivot.position);
  }

  return {
    update(t) {
      const lower = MathUtils.smoothstep(t, .12, .50);
      const raise = MathUtils.smoothstep(t, .62, .94);
      pivot.rotation.z = .30 * lower * (1 - raise);
    },
    reset() { pivot.rotation.z = 0; },
    dispose() {},
  };
}
