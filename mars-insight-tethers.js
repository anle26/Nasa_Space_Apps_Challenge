import { BufferAttribute, BufferGeometry, CatmullRomCurve3, DynamicDrawUsage,
  MathUtils, Mesh, MeshStandardMaterial, Triangle, Vector3 } from 'three';

const segments = 36;
const sides = 8;

export function createInsightTethers(model, seis, heatProbe, groundOffset) {
  const lander = model.getObjectByName('InSight_Deployed');
  const material = new MeshStandardMaterial({ color: 0x66341d, roughness: .85 });
  const start = new Vector3();
  const end = new Vector3();
  const point = new Vector3();
  const tangent = new Vector3();
  const across = new Vector3();
  const normal = new Vector3();
  const edge = new Vector3();
  const indices = [];
  const ring = Array.from({ length: sides }, (_, side) => {
    const angle = side * 2 * Math.PI / sides;
    return [Math.cos(angle), Math.sin(angle)];
  });
  for (let i = 0; i < segments; i++) {
    for (let side = 0; side < sides; side++) {
      const a = i * sides + side;
      const b = i * sides + (side + 1) % sides;
      indices.push(a, a + sides, b, b, a + sides, b + sides);
    }
  }

  const cables = [
    { instrument: seis, socket: [-.24, .12, 1.19], plug: [0, -.25, -.13], bend: -.15, halfWidth: .019 },
    { instrument: heatProbe, socket: [.20, .45, 1.04], plug: [-.08, -.32, -.20], bend: .13, halfWidth: .016 },
  ].map(cable => {
    const positions = new BufferAttribute(new Float32Array((segments + 1) * sides * 3), 3)
      .setUsage(DynamicDrawUsage);
    const geometry = new BufferGeometry().setAttribute('position', positions);
    geometry.setIndex(indices);
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    model.add(mesh);
    const plug = findConnector(cable.instrument, new Vector3(...cable.plug));
    const stowed = cable.instrument.localToWorld(plug.clone());
    return { ...cable, plug, stowed, mesh, positions };
  });

  const surface = (x, z) => -.075 + groundOffset(x, z) + .025;
  function update() {
    for (const { instrument, socket, plug, stowed, bend, halfWidth, mesh, positions } of cables) {
      lander.localToWorld(start.fromArray(socket));
      instrument.localToWorld(end.copy(plug));
      const slack = 1 - MathUtils.smoothstep(end.y - surface(end.x, end.z), .12, .62);
      const onDeck = 1 - MathUtils.smoothstep(end.distanceTo(stowed), .015, .32);
      const middle = start.clone().lerp(end, .64);
      middle.x += bend * slack;
      middle.y = MathUtils.lerp(middle.y - .10, surface(middle.x, middle.z), slack);
      middle.y += onDeck * .18;
      const approach = start.clone().lerp(end, .87);
      approach.x += bend * slack * .48;
      approach.y = MathUtils.lerp(approach.y - .04, surface(approach.x, approach.z), slack);
      approach.y += onDeck * .09;
      const curve = new CatmullRomCurve3([start, middle, approach, end]);
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        curve.getPoint(t, point);
        curve.getTangent(t, tangent);
        if (i > 0 && i < segments) point.y = Math.max(point.y, surface(point.x, point.z));
        across.set(-tangent.z, 0, tangent.x);
        if (across.lengthSq() < 1e-8) across.set(1, 0, 0);
        across.normalize();
        normal.crossVectors(across, tangent).normalize();
        for (const [side, [x, y]] of ring.entries()) {
          edge.copy(point).addScaledVector(across, x * halfWidth).addScaledVector(normal, y * .006);
          model.worldToLocal(edge);
          positions.setXYZ(i * sides + side, edge.x, edge.y, edge.z);
        }
      }
      positions.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }
  }

  update();
  return {
    update,
    dispose() {
      for (const { mesh } of cables) {
        mesh.removeFromParent();
        mesh.geometry.dispose();
      }
      material.dispose();
    },
  };
}

// Snap the end to the actual instrument mesh, then let it overlap slightly
// so there is no visible gap at the connection as the model moves.
function findConnector(instrument, localHint) {
  instrument.updateWorldMatrix(true, true);
  const hint = instrument.localToWorld(localHint.clone());
  const closest = hint.clone();
  const candidate = new Vector3();
  const triangle = new Triangle();
  const corners = [triangle.a, triangle.b, triangle.c];
  let distance = Infinity;
  instrument.traverse(part => {
    if (!part.isMesh) return;
    const position = part.geometry.getAttribute('position');
    const index = part.geometry.getIndex();
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      for (const [offset, corner] of corners.entries()) {
        corner.fromBufferAttribute(position, index ? index.getX(i + offset) : i + offset);
        corner.applyMatrix4(part.matrixWorld);
      }
      triangle.closestPointToPoint(hint, candidate);
      const separation = candidate.distanceToSquared(hint);
      if (separation < distance) {
        distance = separation;
        closest.copy(candidate);
      }
    }
  });
  return instrument.worldToLocal(closest).lerp(localHint, .035);
}
