import { Group, Mesh } from 'three';

// The Sketchfab export groups both sides by material. The six tires are
// separate shells within these two meshes, in the original GLB coordinates.
const tireMeshes = [
  { name: 'pCylinder21_UV1001_0', side: 'left', x: -35.633 },
  { name: 'pCylinder21_UV1003_0', side: 'right', x: 35.348 },
];
const axleHeight = 17.38;
const axles = [
  ['front', -22.593],
  ['middle', 21.59],
  ['rear', 53.574],
];

export function articulateSojourner(scene) {
  for (const { name, side, x } of tireMeshes) {
    const source = scene.getObjectByName(name);
    const geometry = source.geometry;
    const positions = geometry.getAttribute('position');
    const index = geometry.index;
    const tireIndices = axles.map(() => []);
    const bodyIndices = [];

    for (let i = 0; i < index.count; i += 3) {
      const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
      const axle = axles.findIndex(([, z]) => triangle.every(vertex =>
        Math.abs(positions.getX(vertex) - x) < 6.8
        && Math.abs(positions.getY(vertex) - axleHeight) < 9.8
        && Math.abs(positions.getZ(vertex) - z) < 9.8));
      (axle < 0 ? bodyIndices : tireIndices[axle]).push(...triangle);
    }

    const body = geometry.clone();
    body.setIndex(bodyIndices);
    source.geometry = body.toNonIndexed();
    for (const [i, [location, z]] of axles.entries()) {
      const wheel = new Group();
      wheel.name = 'suspension_' + side + '_' + location + '_wheel';
      wheel.position.set(x, axleHeight, z);
      wheel.rotation.y = Math.PI / 2;

      const tire = geometry.clone();
      tire.setIndex(tireIndices[i]);
      const mesh = new Mesh(tire.toNonIndexed().translate(-x, -axleHeight, -z), source.material);
      mesh.rotation.y = -Math.PI / 2;
      wheel.add(mesh);
      source.add(wheel);
    }
  }

  // The Dan model's front faces -Z, while the replay drives toward local +Z.
  scene.rotation.y = Math.PI;
  const rover = new Group();
  rover.add(scene);
  return rover;
}
