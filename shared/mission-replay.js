import { Box3, MathUtils, Vector3 } from 'three';

const pins = [[-4.4, .55, 1.2], [0, .7, -4.8], [4.4, .55, 1.4]].map(p => new Vector3(...p));
export const routeOverview = new Vector3(2, 11, 15);
export const routeFocus = new Vector3(0, .4, -.8);
const views = [[4.2, 2.8, 5], [3.3, 2.3, 4.2], [2.9, 2.6, 5.15]];
const restHeight = -.075;
const wheelAxis = new Vector3(1, 0, 0);

export function createReplay(camera, controls, reducedMotion, dust, createOperation) {
  const element = id => document.getElementById(id);
  const layer = element('replay-markers');
  const play = element('replay-play');
  const previous = element('replay-prev');
  const next = element('replay-next');
  const caption = element('replay-caption');
  const rate = element('replay-rate');
  const projection = new Vector3();
  let mission, model, motion;
  let operation;
  let stationary;
  let wheels = [];
  let entries = [];
  let index = -1;
  let playing = false;
  let advanceAt = Infinity;
  let pausedAt = null;
  let groundOffset = () => 0;

  function refresh() {
    play.disabled = !model;
    rate.disabled = Boolean(motion) || playing;
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
    pausedAt = null;
    advanceAt = Infinity;
    refresh();
  }

  function cancelMotion() {
    motion = null;
    stop();
    dust.hide();
    operation?.clearEffects?.();
    if (model) model.position.y = restHeight + groundOffset(model.position.x, model.position.z);
  }

  function resetPose() {
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
    if (!stationary) destination.set(pins[i].x, restHeight, pins[i].z);
    if (stationary) {
      resetPose();
      operation?.prepare?.(i);
    }
    const from = model.position.clone();
    from.y = restHeight;
    const distance = from.distanceTo(destination);
    const deploy = stationary && i === 1;
    const landing = stationary && i === 0 && mission.landing !== false;
    const setup = i === 0 && Boolean(operation?.setup);
    const drive = rover && distance > .01;
    const cruise = drive ? distance / mission.travel.speed * 1000 : 0;
    const pace = Number(rate.value);
    const transfer = cruise ? cruise / pace : 0;
    const duration = cruise ? 1800 + transfer : deploy ? 4300 : landing || setup ? 2700 : 1300;
    motion = {
      start: now,
      duration,
      deploy,
      landing,
      setup,
      drive,
      distance,
      cruise: cruise / pace,
      wheelStart: wheels.map(wheel => wheel.part.quaternion.clone()),
      heading: drive ? Math.atan2(destination.x - from.x, destination.z - from.z) : 0,
      headingFrom: model.rotation.y,
      cameraFrom: camera.position.clone(),
      targetFrom: controls.target.clone(),
      modelFrom: from,
      cameraTo: new Vector3(...(views[i] ?? views[2])).multiplyScalar(model.userData.framing)
        .add(new Vector3(destination.x, model.userData.focusHeight - .9, destination.z)),
      targetTo: new Vector3(destination.x, model.userData.focusHeight, destination.z),
      destination,
    };
    advanceAt = playing ? now + (reducedMotion ? 1200 : Math.max(3200, duration + 1200)) : Infinity;
    caption.textContent = 'Mốc ' + (i + 1) + ' / ' + entries.length + ' · ' + mission.titles[i];
    refresh();
    if (reducedMotion) animate(now);
  }

  function animate(now) {
    if (pausedAt !== null) return;
    if (motion) {
      const elapsed = reducedMotion ? motion.duration : now - motion.start;
      const t = MathUtils.clamp(elapsed / motion.duration, 0, 1);
      const eased = MathUtils.smoothstep(t, 0, 1);
      const travelOverview = motion.cruise > 0;
      if (travelOverview && elapsed < motion.duration - 900) {
        const widen = MathUtils.smoothstep(elapsed, 0, 900);
        camera.position.lerpVectors(motion.cameraFrom, routeOverview, widen);
        controls.target.lerpVectors(motion.targetFrom, routeFocus, widen);
      } else {
        const frame = travelOverview ? MathUtils.smoothstep(elapsed, motion.duration - 900, motion.duration) : eased;
        camera.position.lerpVectors(travelOverview ? routeOverview : motion.cameraFrom, motion.cameraTo, frame);
        controls.target.lerpVectors(travelOverview ? routeFocus : motion.targetFrom, motion.targetTo, frame);
      }
      const movingTime = elapsed - 900;
      const travel = travelOverview ? MathUtils.clamp(movingTime / motion.cruise, 0, 1) : eased;
      model.position.lerpVectors(motion.modelFrom, motion.destination, travel);
      const surfaceY = groundOffset(model.position.x, model.position.z);
      model.position.y += surfaceY;
      controls.target.y += surfaceY;
      if (motion.drive) {
        const turn = Math.atan2(Math.sin(motion.heading - motion.headingFrom), Math.cos(motion.heading - motion.headingFrom));
        model.rotation.y = motion.headingFrom + turn * MathUtils.smoothstep(elapsed, 0, 900);
        for (const [i, wheel] of wheels.entries()) {
          wheel.part.quaternion.copy(motion.wheelStart[i]);
          wheel.part.rotateOnAxis(wheelAxis, travel * motion.distance / wheel.radius);
        }
      }
      if (motion.landing) model.position.y += 1.65 * (1 - MathUtils.smoothstep(t, 0, .85));

      if (!reducedMotion && motion.landing) {
        const contact = MathUtils.smoothstep(t, .72, .86) * (1 - MathUtils.smoothstep(t, .89, 1));
        dust.update(model.position, MathUtils.smoothstep(t, .72, 1), contact * .58, surfaceY);
      } else if (!reducedMotion && motion.drive) {
        dust.update(model.position, travel * .45, mission.travel.speed > 1 ? Math.sin(Math.PI * travel) * .34 : 0, surfaceY);
      }

      if (motion.setup) operation.setup(t);
      if (motion.deploy) {
        const followHeight = operation?.update(t) ?? 0;
        controls.target.y += followHeight;
        camera.position.y += followHeight * .45;
      }
      if (t === 1) {
        model.position.copy(motion.destination);
        model.position.y += groundOffset(model.position.x, model.position.z);
        motion = null;
        dust.hide();
        refresh();
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
      pausedAt = performance.now();
      playing = false;
      refresh();
    } else if (pausedAt !== null) {
      const delay = performance.now() - pausedAt;
      if (motion) motion.start += delay;
      advanceAt += delay;
      pausedAt = null;
      playing = true;
      refresh();
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
      stationary = mission.stationary ?? mission.type === 'Tàu đổ bộ';
      element('travel-rate').hidden = element('travel-note').hidden = !mission.travel;
      rate.value = '1';
      if (mission.travel) {
        const source = element('travel-source');
        source.href = mission.travel.source;
        source.textContent = 'Tốc độ ở chế độ 1× · ' + mission.travel.label;
      }
      index = -1;
      caption.textContent = selectionHint();
      entries = mission.timeline.map(([date, event, source], i) => {
        const title = mission.titles[i];
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
      operation = createOperation(model, mission);
      model.updateWorldMatrix(true, true);
      model.traverse(part => {
        if (!/^suspension_(left|right)_(front|middle|rear)_wheel$/.test(part.name)) return;
        const radius = new Box3().setFromObject(part, true).getSize(new Vector3()).y / 2;
        if (!radius) return;
        wheels.push({ part, rest: part.quaternion.clone(), radius });
      });
      refresh();
    },
    close() {
      cancelMotion();
      operation?.dispose();
      operation = null;
      model = null;
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
