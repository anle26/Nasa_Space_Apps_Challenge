import { Box3, MathUtils, Quaternion, Vector3 } from 'three';
import { replayTitles } from './mars-missions-data.js';
import { createLanderOperation } from './mars-lander-operations.js';

const pins = [[-2.15, .55, .65], [0, .7, -2.3], [2.15, .55, .85]].map(p => new Vector3(...p));
const views = [[4.2, 2.8, 5], [3.3, 2.3, 4.2], [2.9, 2.6, 5.15]];
const restHeight = -.075;
const shaftAxis = new Vector3(1, 0, 0);
const wheelAxis = new Vector3(0, 0, 1);
const flightOverview = new Vector3(4.7, 3.7, 6.4);
const flightFocus = new Vector3(0, .65, 0);

export function createReplay(camera, controls, reducedMotion, dust) {
  const element = id => document.getElementById(id);
  const layer = element('replay-markers');
  const play = element('replay-play');
  const previous = element('replay-prev');
  const next = element('replay-next');
  const caption = element('replay-caption');
  const projection = new Vector3();
  let mission, model, motion;
  let operation;
  let stationary;
  let joints = [];
  let wheels = [];
  let entries = [];
  let index = -1;
  let playing = false;
  let advanceAt = Infinity;
  let groundOffset = () => 0;

  function refresh() {
    play.disabled = !model;
    play.textContent = playing ? 'Ⅱ Tạm dừng' : '▶ Phát hành trình';
    previous.disabled = !model || index <= 0;
    next.disabled = !model || index >= entries.length - 1;
    for (const [i, { pin, button, description }] of entries.entries()) {
      pin.disabled = button.disabled = !model;
      pin.setAttribute('aria-pressed', String(i === index));
      button.setAttribute('aria-pressed', String(i === index));
      description.hidden = i !== index;
    }
  }

  function stop() {
    playing = false;
    advanceAt = Infinity;
    refresh();
  }

  function cancelMotion() {
    stop();
    motion = null;
    dust.hide();
    if (model) model.position.y = restHeight + groundOffset(model.position.x, model.position.z);
  }

  function resetPose() {
    for (const { part, rest } of joints) part.quaternion.copy(rest);
    for (const wheel of wheels) wheel.part.quaternion.copy(wheel.rest);
    model.rotation.set(0, 0, 0);
    operation?.reset();
  }

  function selectionHint() {
    return stationary ? 'Chọn một hoạt động trong danh sách.' : 'Chọn một mốc trong cảnh 3D hoặc trong danh sách.';
  }

  function select(i, now = performance.now()) {
    if (!model || !entries[i]) return;
    index = i;
    const destination = new Vector3(0, restHeight, 0);
    const rover = mission.type === 'Xe tự hành';
    const helicopter = mission.id === 'ingenuity';
    if (!stationary) destination.set(pins[i].x, restHeight, pins[i].z);
    if (stationary) {
      resetPose();
      operation?.prepare?.(i);
    }
    const from = model.position.clone();
    from.y = restHeight;
    const distance = from.distanceTo(destination);
    const takeoff = helicopter && distance > .01;
    const solar = mission.id === 'insight' && i === 1;
    const deploy = stationary && i === (mission.id === 'insight' ? 2 : 1);
    const landing = stationary && i === 0;
    const drive = rover && distance > .01;
    const duration = takeoff ? 4600 : deploy || solar ? 4300 : landing || drive ? 2700 : 1300;
    motion = {
      start: now,
      duration,
      takeoff,
      solar,
      deploy,
      landing,
      drive,
      distance,
      wheelStart: wheels.map(wheel => wheel.part.quaternion.clone()),
      failedWheel: mission.id === 'spirit' && i > 0,
      heading: drive || takeoff ? Math.atan2(destination.x - from.x, destination.z - from.z) : 0,
      headingFrom: model.rotation.y,
      cameraFrom: camera.position.clone(),
      targetFrom: controls.target.clone(),
      modelFrom: from,
      cameraTo: new Vector3(...(views[i] ?? views[2])).multiplyScalar(model.userData.framing)
        .add(new Vector3(destination.x, model.userData.focusHeight - .9, destination.z)),
      targetTo: new Vector3(destination.x, model.userData.focusHeight, destination.z),
      destination,
    };
    advanceAt = playing ? now + Math.max(5200, duration + 1200) : Infinity;
    caption.textContent = 'Mốc ' + (i + 1) + ' / ' + entries.length + ' · ' + replayTitles[mission.id][i];
    refresh();
    if (reducedMotion) animate(now);
  }

  function animate(now) {
    if (motion) {
      const t = reducedMotion ? 1 : MathUtils.clamp((now - motion.start) / motion.duration, 0, 1);
      const eased = MathUtils.smoothstep(t, 0, 1);
      const travelOverview = motion.takeoff || motion.drive;
      if (travelOverview && t < .84) {
        // Keep the departure and destination visible during the flight.
        const widen = MathUtils.smoothstep(t, 0, .22);
        camera.position.lerpVectors(motion.cameraFrom, flightOverview, widen);
        controls.target.lerpVectors(motion.targetFrom, flightFocus, widen);
      } else {
        const frame = travelOverview ? MathUtils.smoothstep(t, .84, 1) : eased;
        camera.position.lerpVectors(travelOverview ? flightOverview : motion.cameraFrom, motion.cameraTo, frame);
        controls.target.lerpVectors(travelOverview ? flightFocus : motion.targetFrom, motion.targetTo, frame);
      }
      const travel = motion.takeoff ? MathUtils.smoothstep(t, .31, .72)
        : motion.drive ? MathUtils.smoothstep(t, .25, 1) : eased;
      model.position.lerpVectors(motion.modelFrom, motion.destination, travel);
      const surfaceY = groundOffset(model.position.x, model.position.z);
      model.position.y += surfaceY;
      controls.target.y += surfaceY;
      if (motion.drive) {
        const turn = Math.atan2(Math.sin(motion.heading - motion.headingFrom), Math.cos(motion.heading - motion.headingFrom));
        model.rotation.y = motion.headingFrom + turn * MathUtils.smoothstep(t, 0, .35);
        const roll = Math.sin(travel * motion.distance * 9) * Math.sin(Math.PI * travel);
        model.rotation.z = roll * .035;
        model.position.y += Math.abs(roll) * .025;
        for (const [i, wheel] of wheels.entries()) {
          wheel.part.quaternion.copy(motion.wheelStart[i]);
          if (!motion.failedWheel || !wheel.frontRight) {
            wheel.part.rotateOnAxis(wheelAxis, wheel.sign * travel * motion.distance / wheel.radius);
          }
        }
      }
      if (motion.takeoff) {
        const altitude = MathUtils.smoothstep(t, .15, .32) * (1 - MathUtils.smoothstep(t, .72, .88));
        model.position.y += altitude * 1.35;
        const turn = Math.atan2(Math.sin(motion.heading - motion.headingFrom), Math.cos(motion.heading - motion.headingFrom));
        model.rotation.y = motion.headingFrom + turn * MathUtils.smoothstep(t, .14, .38);
        model.rotation.x = .14 * Math.sin(Math.PI * travel);
      }
      if (motion.landing) model.position.y += 1.65 * (1 - MathUtils.smoothstep(t, 0, .85));

      if (!reducedMotion && motion.takeoff) {
        const nearGround = 1 - MathUtils.smoothstep(model.position.y - restHeight - surfaceY, .05, .72);
        const rotorPower = MathUtils.smoothstep(t, .06, .22) * (1 - MathUtils.smoothstep(t, .86, 1));
        dust.update(model.position, .25 + t * .55, nearGround * rotorPower, surfaceY);
      } else if (!reducedMotion && motion.landing) {
        const contact = MathUtils.smoothstep(t, .72, .86) * (1 - MathUtils.smoothstep(t, .89, 1));
        dust.update(model.position, MathUtils.smoothstep(t, .72, 1), contact * .58, surfaceY);
      } else if (!reducedMotion && motion.drive) {
        dust.update(model.position, travel * .45, Math.sin(Math.PI * travel) * .34, surfaceY);
      }

      for (const [i, { part, rest }] of joints.entries()) {
        part.quaternion.copy(rest);
        if (motion.takeoff) {
          // The GLB stores both rotors along their parent's local X axis.
          const angle = 88 * (t - Math.sin(2 * Math.PI * t) / (2 * Math.PI));
          part.rotateOnWorldAxis(shaftAxis, (i === 0 ? 1 : -1) * angle);
        }
      }
      if (motion.solar) operation?.openPanels(t);
      if (motion.deploy) operation?.update(t);
      if (t === 1) {
        model.position.copy(motion.destination);
        model.position.y += groundOffset(model.position.x, model.position.z);
        motion = null;
        dust.hide();
      }
    }
    if (playing && now >= advanceAt) {
      if (index < entries.length - 1) select(index + 1, now);
      else stop();
    }
  }

  function manual(i) {
    stop();
    select(i);
  }

  play.addEventListener('click', () => {
    if (playing) {
      cancelMotion();
    } else {
      playing = true;
      select(index < 0 || index === entries.length - 1 ? 0 : index);
    }
  });
  previous.addEventListener('click', () => manual(index - 1));
  next.addEventListener('click', () => manual(index + 1));
  controls.addEventListener('start', () => {
    if (model) cancelMotion();
  });

  return {
    setTerrain(height) { groundOffset = height; },
    open(selectedMission) {
      mission = selectedMission;
      stationary = mission.type === 'Tàu đổ bộ';
      index = -1;
      caption.textContent = selectionHint();
      entries = mission.timeline.map(([date, event, source], i) => {
        const title = replayTitles[mission.id][i];
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'replay-pin';
        pin.textContent = i + 1;
        pin.title = title;
        pin.setAttribute('aria-label', 'Mốc ' + (i + 1) + ' · ' + title);
        pin.addEventListener('click', () => manual(i));
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'replay-step';
        const number = document.createElement('span');
        number.textContent = i + 1;
        const heading = document.createElement('strong');
        heading.textContent = title + ' · ' + date;
        button.append(number, heading);
        button.addEventListener('click', () => manual(i));
        const description = document.createElement('p');
        description.className = 'replay-event';
        description.textContent = event;
        if (source) {
          const link = document.createElement('a');
          link.href = source;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = 'Tư liệu NASA ↗';
          description.append(' ', link);
        }
        const item = document.createElement('li');
        item.append(button, description);
        return { pin, button, description, item };
      });
      layer.replaceChildren(...entries.map(entry => entry.pin));
      element('timeline').replaceChildren(...entries.map(entry => entry.item));
      layer.hidden = stationary;
      refresh();
    },
    attach(loadedModel) {
      model = loadedModel;
      operation = createLanderOperation(model, mission);
      model.updateWorldMatrix(true, true);
      model.traverse(part => {
        if (!/^suspension_(left|right)_(front|middle|rear)_wheel$/.test(part.name)) return;
        const radius = new Box3().setFromObject(part, true).getSize(new Vector3()).y / 2;
        if (!radius) return;
        const axis = wheelAxis.clone().transformDirection(part.matrixWorld);
        wheels.push({ part, rest: part.quaternion.clone(), radius, sign: Math.sign(axis.x),
          frontRight: part.name === 'suspension_right_front_wheel' });
      });
      const names = mission.id === 'ingenuity' ? ['rotors_01', 'rotors_02'] : [];
      joints = names.map(name => model.getObjectByName(name)).filter(Boolean)
        .map(part => ({ part, rest: new Quaternion().copy(part.quaternion) }));
      refresh();
    },
    close() {
      cancelMotion();
      operation?.dispose();
      operation = null;
      model = null;
      joints = [];
      wheels = [];
      layer.hidden = true;
    },
    reset() {
      cancelMotion();
      model?.position.set(0, restHeight, 0);
      if (model) resetPose();
      index = -1;
      caption.textContent = selectionHint();
      refresh();
    },
    animate,
    project() {
      if (stationary) return;
      camera.updateMatrixWorld();
      for (const [i, { pin }] of entries.entries()) {
        projection.copy(pins[i]);
        projection.y += groundOffset(projection.x, projection.z);
        projection.project(camera);
        pin.hidden = Math.abs(projection.x) > .96 || Math.abs(projection.y) > .92 || Math.abs(projection.z) > 1;
        if (pin.hidden) continue;
        pin.style.left = (projection.x + 1) * 50 + '%';
        pin.style.top = (1 - projection.y) * 50 + '%';
      }
    },
  };
}
