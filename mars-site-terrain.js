import * as THREE from 'three';
import { createSoilTexture } from './mars-surface-effects.js';

// Site-specific artistic reconstructions from surface imagery. Dimensions
// describe this scene in meters and are not a survey of the landing site.
export const terrainSites = {
  sojourner: {
    title: 'Ares Vallis', source: 'https://science.nasa.gov/resource/360-degree-panorama-in-3-d/',
    note: 'Đồng bằng nhiều sỏi đá với Barnacle Bill và Yogi. Vị trí đá và đường xe chạy trong cảnh là minh họa, hành trình được phát nhanh.',
    soil: 0xa47a60, rock: 0x746056, sky: 0xa78773, count: 470, radius: .13, flatness: .59, ripple: .04,
    height: (x, z) => .035 * Math.sin(x * .82 + z * .46) + .024 * Math.sin(z * .63),
    outcrops: [[-.44, -2.68, .19], [2.93, .60, .41], [-3.75, -2.8, .35], [4.3, -2.85, .56]],
  },
  ingenuity: {
    title: 'Valinor Hills', source: 'https://science.nasa.gov/photojournal/ingenuity-at-valinor-hills/',
    note: 'Cát mịn với các dải gợn song song và ít đá lớn.',
    soil: 0xad7856, rock: 0x69544a, sky: 0xa88571, count: 72, radius: .11, flatness: .66, ripple: 1,
    height: (x, z) => .075 * Math.sin((z + x * .34) * 5.3 + .55 * Math.sin(x)) + .14 * Math.sin(z * .48),
  },
  opportunity: {
    title: 'Perseverance Valley', source: 'https://science.nasa.gov/resource/opportunity-legacy-pan/',
    note: 'Rãnh nông trên sườn hố Endeavour, có các mảng đá lộ thiên.',
    soil: 0xa08069, rock: 0x70615b, sky: 0xa99586, count: 360, radius: .26, flatness: .34, ripple: .08,
    height: (x, z) => .045 * z + .24 * (1 - Math.exp(-Math.pow((x + .22 * z) / 2.8, 2))) + .052 * Math.sin(x * 1.3 + z * .46),
    outcrops: [[-3.7, -1.1, .75], [3.4, -3.2, .95], [-5.3, 3.2, .8], [5.2, 1.7, .6]],
  },
  spirit: {
    title: 'Troy, hố Gusev', source: 'https://www.jpl.nasa.gov/images/pia12202-calypso-panorama-of-spirits-view-from-troy-stereo/',
    note: 'Đất sẫm xen mảng đất sáng mềm ở Troy, cạnh rìa cao nguyên thấp Home Plate.',
    soil: 0x927361, rock: 0x66574e, sky: 0xaa8a73, count: 295, radius: .24, flatness: .47, ripple: .1,
    height: (x, z) => .85 * THREE.MathUtils.smoothstep(x + .22 * z, 3.4, 8.4) + .11 * Math.sin(z * .55)
      - .13 * Math.exp(-((x - .15) ** 2 + (z + 2.3) ** 2) / .85),
    outcrops: [[5.6, -.9, .85], [5.3, 3.8, .75], [6.5, -4.2, 1.05]],
  },
  insight: {
    title: 'Homestead Hollow', source: 'https://science.nasa.gov/resource/insight-sol-14-panorama/',
    note: 'Vùng trũng rất nông, nền khá bằng và ít đá lớn gần tàu.',
    soil: 0xaf8667, rock: 0x8b7260, sky: 0xb09a85, count: 165, radius: .13, flatness: .52, ripple: .04,
    height: (x, z) => .17 * Math.exp(-((Math.hypot(x + .7, z) - 10) ** 2) / 10)
      + .035 * Math.sin(x * .85) * Math.sin(z * .56),
  },
  'viking-1': {
    title: 'Chryse Planitia', source: 'https://photojournal.jpl.nasa.gov/catalog/PIA00567',
    note: 'Đồng bằng hơi lượn, có chỗ trũng nhỏ, đá rải rác và vài mảng nền đá sáng.',
    soil: 0xa4775d, rock: 0x76635a, sky: 0xb09584, count: 360, radius: .16, flatness: .65, ripple: .06,
    height: (x, z) => .084 * Math.sin(x * .47 + z * .30) - .14 * Math.exp(-((x + 3.4) ** 2 + (z + 1.7) ** 2) / 3),
    outcrops: [[-4.1, -2.4, .32], [5.7, -3.2, .52]],
  },
  'viking-2': {
    title: 'Utopia Planitia', source: 'https://www.jpl.nasa.gov/images/pia00396-viking-lander-2s-first-picture-on-the-surface-of-mars/',
    note: 'Nền hạt mịn phủ dày đá góc cạnh và đá dạng phiến, thường cỡ 10–20 cm.',
    soil: 0x9d6e57, rock: 0x79685f, sky: 0xb69385, count: 880, radius: .105, flatness: .55, ripple: .03,
    height: (x, z) => .11 * Math.sin(x * .31 - z * .31) + .047 * Math.cos(z * .76),
  },
};

export function createSiteTerrain(id) {
  const site = terrainSites[id];
  const group = new THREE.Group();
  const base = site.height(0, 0);
  const height = (x, z) => site.height(x, z) - base - .08;
  const mesh = new THREE.PlaneGeometry(64, 64, 220, 220);
  mesh.rotateX(-Math.PI / 2);
  const position = mesh.getAttribute('position');
  const color = new THREE.Color();
  const soilColor = new THREE.Color(site.soil);
  const lightSoil = new THREE.Color(0xc1a78a);
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i);
    position.setY(i, height(x, z));
    const patch = .06 * Math.sin(x * .7 + Math.cos(z * .9)) + .055 * Math.sin(x * 2.1 - z * .94);
    color.copy(soilColor).multiplyScalar(1 + patch + (random(i + 42) - .5) * .055);
    if (id === 'spirit') color.lerp(lightSoil, .73 * Math.exp(-((x - .15) ** 2 + (z + 2.3) ** 2) / 1.5));
    color.toArray(colors, i * 3);
  }
  mesh.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  mesh.computeVertexNormals();
  const soil = createSoilTexture(site.ripple);
  const floor = new THREE.Mesh(mesh, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 1, map: soil.color, bumpMap: soil.height, bumpScale: .025 + .028 * site.ripple,
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
  const clear = id === 'viking-2' ? 1.65 : 2.7;
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
