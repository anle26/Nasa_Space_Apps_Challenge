import * as THREE from 'three';
import { createSoilTexture } from './surface-effects.js';

export function createSiteTerrain(site) {
  const group = new THREE.Group();
  const base = site.height(0, 0);
  const height = (x, z) => site.height(x, z) - base - .08;
  const mesh = new THREE.PlaneGeometry(64, 64, 220, 220);
  mesh.rotateX(-Math.PI / 2);
  const position = mesh.getAttribute('position');
  const color = new THREE.Color();
  const soilColor = new THREE.Color(site.soil);
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i);
    position.setY(i, height(x, z));
    const patch = .06 * Math.sin(x * .7 + Math.cos(z * .9)) + .055 * Math.sin(x * 2.1 - z * .94);
    color.copy(soilColor).multiplyScalar(1 + patch + (random(i + 42) - .5) * .055);
    color.toArray(colors, i * 3);
  }
  mesh.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  mesh.computeVertexNormals();
  const soil = createSoilTexture(site.ripple);
  const floor = new THREE.Mesh(mesh, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 1, map: soil.color, bumpMap: soil.height, bumpScale: .009,
  }));
  floor.receiveShadow = true;
  group.add(floor);

  const deposits = site.outcrops ?? [];
  const rockShape = new THREE.IcosahedronGeometry(1, 1);
  const vertices = rockShape.getAttribute('position');
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const scale = .83 + .22 * Math.sin(x * 12 + y * 7 + z * 9);
    vertices.setXYZ(i, x * scale + y * .13, Math.max(-.48, y * scale), z * scale);
  }
  rockShape.computeVertexNormals();
  const stones = new THREE.InstancedMesh(rockShape, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), site.count + deposits.length);
  stones.castShadow = stones.receiveShadow = true;
  const stone = new THREE.Object3D();
  const rockColor = new THREE.Color(site.rock);
  const clear = 2.7;
  for (let i = 0; i < stones.count; i++) {
    const angle = random(i + 5000) * Math.PI * 2;
    const radius = clear + Math.pow(random(i + 5100), 1.65) * 22;
    const randomSize = site.radius * (.24 + .76 * Math.pow(random(i + 5200), 1.6));
    const [x, z, size] = deposits[i - site.count] ?? [Math.cos(angle) * radius, Math.sin(angle) * radius, randomSize];
    stone.position.set(x, height(x, z) + size * site.flatness * .29, z);
    stone.scale.set(size * (1.05 + .5 * random(i + 8300)), size * site.flatness, size);
    stone.rotation.set(.12 * Math.sin(angle), angle, .18 * Math.cos(angle));
    stone.updateMatrix();
    stones.setMatrixAt(i, stone.matrix);
    stones.setColorAt(i, color.copy(rockColor).multiplyScalar(.68 + .62 * random(i + 3900)));
  }
  group.add(stones);
  return { group, groundOffset: (x, z) => height(x, z) + .08 };
}

function random(seed) {
  const n = Math.sin(seed * 374.129) * 43758.5453;
  return n - Math.floor(n);
}
