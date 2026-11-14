import { Box3, CatmullRomCurve3, Color, DoubleSide, InstancedMesh, MathUtils, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, PointLight, TubeGeometry, Vector3 } from 'three';

function bottom(part) {
  return new Box3().setFromObject(part, true).min.y;
}

export function prepareLunarModel(scene, filename) {
  if (filename === 'lrv-oldschool.glb') {
    const front = scene.getObjectByName('suspension_left_front_wheel');
    const rear = scene.getObjectByName('suspension_left_rear_wheel');
    const direction = front.getWorldPosition(new Vector3()).sub(rear.getWorldPosition(new Vector3()));
    scene.rotation.y -= Math.atan2(direction.x, direction.z);
    const fender = new MeshStandardMaterial({ color: 0xa65d32, roughness: .76, side: DoubleSide });
    scene.traverse(part => {
      if (part.isMesh && part.material.name === 'Wheel_Covers') part.material = fender;
    });
  }
  if (filename === 'eagle-nassp.glb') {
    // The long contact probes fold out of the way at touchdown.
    const stage = scene.getObjectByName('eagle-descent-stage');
    for (const part of [...stage.children]) {
      if (part.name.startsWith('Probes2')) part.removeFromParent();
    }
  }
  if (filename !== 'alsep-nassp.glb') return;
  const station = scene.getObjectByName('lunar-central-station');
  const sensor = scene.getObjectByName('lunar-seismometer');
  const rtg = scene.getObjectByName('lunar-rtg');
  // The source meshes use meters. Adjust the shroud and generator independently.
  const skirt = scene.getObjectByName('PSE_Skirt');
  const skirtSize = new Box3().setFromObject(skirt, true).getSize(new Vector3());
  skirt.scale.set(1.524 / skirtSize.x, 1, 1.524 / skirtSize.z);
  const generator = scene.getObjectByName('RTG');
  const generatorBounds = new Box3().setFromObject(generator, true);
  const generatorSize = generatorBounds.getSize(new Vector3());
  generator.scale.y *= .4572 / generatorSize.y;
  generator.position.y += (generatorBounds.min.y - bottom(generator));
  const stationBounds = new Box3().setFromObject(scene.getObjectByName('CentralStation_ElecBox'), true);
  const stationCenter = stationBounds.getCenter(new Vector3());
  const sensorCenter = new Box3().setFromObject(scene.getObjectByName('PSE'), true).getCenter(new Vector3());
  const rtgCenter = new Box3().setFromObject(generator, true).getCenter(new Vector3());
  sensor.position.x += stationCenter.x + 3.048 - sensorCenter.x;
  sensor.position.z += stationCenter.z - sensorCenter.z;
  rtg.position.x += stationCenter.x - 3.048 - rtgCenter.x;
  rtg.position.z += stationCenter.z - rtgCenter.z;
  for (const part of [station, sensor, rtg]) part.position.y -= bottom(part);
  for (const [part, offset] of [[sensor, .18], [rtg, -.15]]) {
    const start = new Vector3(stationCenter.x, .055, stationCenter.z + offset);
    const end = new Vector3(stationCenter.x + (part === sensor ? 3.048 : -3.048), .055, stationCenter.z);
    const curve = new CatmullRomCurve3([
      start, start.clone().lerp(end, .3).setY(.015),
      start.clone().lerp(end, .65).add(new Vector3(0, -.04, .08)), end,
    ]);
    const cable = new Mesh(new TubeGeometry(curve, 24, .009, 6, false), new MeshStandardMaterial({ color: 0xa48044 }));
    cable.name = part === sensor ? 'lunar-sensor-cable' : 'lunar-rtg-cable';
    scene.add(cable);
  }
}

function createEagleLaunch(model) {
  const smooth = MathUtils.smoothstep;
  const stage = model.getObjectByName('eagle-ascent-stage');
  const rest = stage.position.y;
  const deck = new Box3().setFromObject(model.getObjectByName('BodyTop'), true);
  const origin = deck.getCenter(new Vector3());
  origin.y = deck.max.y;
  model.worldToLocal(origin);

  const flash = new PointLight(0xffd396, 0, 5, 2);
  flash.position.copy(origin);
  flash.position.y += .45;
  model.add(flash);

  const geometry = new PlaneGeometry(1, 1);
  const material = new MeshStandardMaterial({ side: DoubleSide, metalness: .53, roughness: .45 });
  const foil = new InstancedMesh(geometry, material, 38);
  foil.frustumCulled = false;
  model.add(foil);
  const fragment = new Object3D();
  const shades = [0xe8af4d, 0xb87225, 0xffd487, 0xc1b5a0].map(color => new Color(color));
  const pieces = Array.from({ length: foil.count }, (_, i) => {
    foil.setColorAt(i, shades[i % shades.length]);
    return {
      angle: i * 2.399963,
      speed: 1.25 + (i * 17 % 29) * .095,
      lift: .65 + (i * 7 % 19) * .105,
      size: .035 + (i * 13 % 23) * .004,
    };
  });
  function clearEffects() {
    flash.intensity = 0;
    foil.visible = false;
  }
  clearEffects();

  return {
    reset() {
      stage.visible = true;
      stage.position.y = rest;
      stage.rotation.x = 0;
      clearEffects();
    },
    prepare(step) { stage.visible = step !== 2; },
    clearEffects,
    update(t) {
      const ignition = .12;
      const ascent = Math.max(0, (t - ignition) / (1 - ignition));
      const rise = 15 * ascent ** 2;
      stage.position.y = rest + rise / model.scale.y;
      stage.rotation.x = .12 * smooth(ascent, .35, .85);
      stage.visible = t < .95;
      flash.intensity = 30 * smooth(t, ignition - .035, ignition + .025) * (1 - smooth(t, .18, .31));
      foil.visible = t > ignition && t < .82;
      if (foil.visible) {
        const seconds = (t - ignition) * 4.3;
        for (const [i, piece] of pieces.entries()) {
          const radius = .45 + piece.speed * seconds;
          fragment.position.set(
            origin.x + Math.cos(piece.angle) * radius,
            origin.y + piece.lift * seconds - .81 * seconds ** 2,
            origin.z + Math.sin(piece.angle) * radius,
          );
          fragment.rotation.set(seconds * (2 + i % 5), piece.angle + seconds * 2, seconds * 3);
          const size = piece.size * smooth(fragment.position.y, 0, .25) * (1 - smooth(t, .69, .82));
          fragment.scale.set(size, size * .63, 1);
          fragment.updateMatrix();
          foil.setMatrixAt(i, fragment.matrix);
        }
        foil.instanceMatrix.needsUpdate = true;
      }
      return rise * .47 * (1 - smooth(t, .72, 1));
    },
    dispose() {
      foil.removeFromParent();
      flash.removeFromParent();
      foil.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}

export function createLunarOperation(model, id) {
  const smooth = MathUtils.smoothstep;
  if (id === 'eagle') {
    return createEagleLaunch(model);
  }
  if (id === 'surveyor-3') {
    const scoop = model.getObjectByName('surveyor-scoop');
    const camera = model.getObjectByName('surveyor-camera');
    return {
      reset() { scoop.visible = camera.visible = true; scoop.rotation.set(0, 0, 0); },
      prepare(step) { scoop.visible = camera.visible = step !== 2; },
      update(t) {
        scoop.rotation.x = .29 * smooth(t, .06, .45) * (1 - smooth(t, .67, 1));
        scoop.rotation.y = .18 * smooth(t, .39, .64) * (1 - smooth(t, .68, 1));
      },
      dispose() {},
    };
  }
  if (id === 'apollo12-alsep') {
    const sensor = model.getObjectByName('lunar-seismometer');
    const cable = model.getObjectByName('lunar-sensor-cable');
    const rest = sensor.position.y;
    const foil = model.getObjectByName('PSE_Skirt');
    foil.material = foil.material.clone();
    foil.material.emissive.setHex(0xffb940);
    foil.material.emissiveIntensity = 0;
    return {
      reset() { foil.material.emissiveIntensity = 0; sensor.position.y = rest; cable.visible = true; },
      prepare(step) {
        if (step === 0) { sensor.position.y = rest + .34; cable.visible = false; }
      },
      setup(t) {
        sensor.position.y = rest + .34 * (1 - smooth(t, 0, .85));
        cable.visible = t >= .85;
      },
      update(t) {
        foil.material.emissiveIntensity = .8 * Math.sin(t * Math.PI * 5) ** 2 * (1 - t);
      },
      dispose() { foil.material.dispose(); },
    };
  }
}
