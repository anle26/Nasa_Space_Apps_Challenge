import {
  BufferAttribute, BufferGeometry, CanvasTexture, Color, MathUtils, Points,
  PointsMaterial, RepeatWrapping, SRGBColorSpace,
} from 'three';

function canvas(size) {
  const image = document.createElement('canvas');
  image.width = image.height = size;
  return image.getContext('2d');
}

export function createSoilTexture(rippleStrength) {
  const size = 256;
  const pigment = canvas(size);
  const relief = canvas(size);
  const pixels = pigment.createImageData(size, size);
  const heights = relief.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const u = x / size * Math.PI * 2;
      const v = y / size * Math.PI * 2;
      const grain = Math.random() * 52;
      const ripple = rippleStrength * Math.sin(u * 3 + v * 5 + 2 * Math.sin(u - v));
      const mottling = Math.sin(u * 7 - v * 3) * Math.cos(v * 4) + Math.cos(u + 2 * v);
      const shade = 185 + grain + 10 * ripple + 12 * mottling;
      pixels.data.set([shade, shade * .94, shade * .86, 255], i);
      const h = 130 + grain + 14 * ripple + 15 * mottling;
      heights.data.set([h, h, h, 255], i);
    }
  }
  pigment.putImageData(pixels, 0, 0);
  relief.putImageData(heights, 0, 0);
  const color = new CanvasTexture(pigment.canvas);
  const height = new CanvasTexture(relief.canvas);
  color.colorSpace = SRGBColorSpace;
  for (const texture of [color, height]) {
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(44, 44);
    texture.anisotropy = 4;
  }
  return { color, height };
}

export function createDust(scene) {
  const sprite = canvas(64);
  const gradient = sprite.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,.85)');
  gradient.addColorStop(.55, 'rgba(255,255,255,.25)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  sprite.fillStyle = gradient;
  sprite.fillRect(0, 0, 64, 64);

  const count = 74;
  const positions = new Float32Array(count * 3);
  const particles = Array.from({ length: count }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: .45 + Math.random() * 1.15,
    lift: Math.random(),
  }));
  const geometry = new BufferGeometry();
  const position = new BufferAttribute(positions, 3);
  geometry.setAttribute('position', position);
  const material = new PointsMaterial({
    color: new Color(0xc38b61), map: new CanvasTexture(sprite.canvas),
    size: .23, transparent: true, depthWrite: false,
  });
  const cloud = new Points(geometry, material);
  cloud.frustumCulled = false;
  cloud.visible = false;
  scene.add(cloud);

  return {
    hide() {
      cloud.visible = false;
    },
    update(origin, phase, strength, groundOffset) {
      cloud.visible = strength > .01;
      if (!cloud.visible) return;
      cloud.position.set(origin.x, groundOffset, origin.z);
      material.opacity = MathUtils.clamp(strength, 0, 1) * .42;
      for (const [i, particle] of particles.entries()) {
        const radius = .18 + particle.speed * phase * 1.8;
        position.setXYZ(i, Math.cos(particle.angle) * radius,
          .035 + particle.lift * (.07 + phase * .3), Math.sin(particle.angle) * radius);
      }
      position.needsUpdate = true;
    },
  };
}
