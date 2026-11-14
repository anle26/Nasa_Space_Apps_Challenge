import { Box3, Group, MathUtils, Quaternion, Vector3 } from 'three';
import insightPoses from './insight-poses.json';

export function createLanderOperation(model, mission) {
  if (mission.id === 'insight') return createSeismometerDeployment(model);
  if (mission.model === 'viking.glb') return createSoilSampling(model);
  return null;
}

function createSeismometerDeployment(model) {
  const instrument = model.getObjectByName('SEIS');
  const grapple = model.getObjectByName('grapple');
  if (!instrument || !grapple) return null;
  const stowed = instrument.position.clone();
  const tool = new Vector3();
  const target = new Vector3();
  model.updateWorldMatrix(true, true);
  const offset = instrument.getWorldPosition(new Vector3()).y - new Box3().setFromObject(instrument, true).min.y;
  const release = model.worldToLocal(grapple.getWorldPosition(new Vector3()));
  release.x -= .45 / model.scale.x;
  release.y = offset / model.scale.y;
  const nodes = new Map();
  model.traverse(part => {
    if (part.userData.name) nodes.set(part.userData.name, part);
  });
  const arm = capturePose(insightPoses.open, nodes);
  const panels = capturePose(Object.fromEntries(Object.entries(insightPoses.folded)
    .filter(([name]) => !(name in insightPoses.open))), nodes);
  const poseVector = new Vector3();
  const poseRotation = new Quaternion();

  function blendPose(parts, amount) {
    for (const { part, pose, position, rotation, scale } of parts) {
      part.position.copy(position).lerp(poseVector.fromArray(pose[0]), amount);
      part.quaternion.copy(rotation).slerp(poseRotation.fromArray(pose[1]), amount);
      part.scale.copy(scale).lerp(poseVector.fromArray(pose[2]), amount);
    }
  }

  return {
    prepare(step) {
      blendPose(arm, 1);
      blendPose(panels, step <= 1 ? 1 : 0);
      if (step === 3) this.update(1);
    },
    openPanels(t) {
      blendPose(panels, 1 - MathUtils.smoothstep(t, .08, .94));
    },
    update(t) {
      const reach = MathUtils.smoothstep(t, 0, .38) * (1 - MathUtils.smoothstep(t, .79, 1));
      blendPose(arm, 1 - reach);
      model.updateWorldMatrix(true, true);
      const pickup = MathUtils.smoothstep(t, .2, .41);
      const lower = MathUtils.smoothstep(t, .47, .79);
      grapple.getWorldPosition(tool);
      tool.y -= .14;
      instrument.parent.worldToLocal(tool);
      target.copy(release);
      model.localToWorld(target);
      instrument.parent.worldToLocal(target);
      instrument.position.lerpVectors(stowed, tool, pickup).lerp(target, lower);
    },
    reset() {
      instrument.position.copy(stowed);
      blendPose(arm, 0);
      blendPose(panels, 0);
    },
    dispose() {},
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
