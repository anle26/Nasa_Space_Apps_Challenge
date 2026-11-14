import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createReplay, routeFocus, routeOverview } from './mission-replay.js';
import { createDust } from './surface-effects.js';
import { createSiteTerrain } from './site-terrain.js';

const $ = id => document.getElementById(id);
const body = new URLSearchParams(location.search).get('body') === 'moon'
  ? await import('../moon/index.js')
  : await import('../mars/index.js');
const { bodyName, missions, modelDimensions, terrainSites, createOperation, loadModel, globeTexture, globeSource } = body;
const isMoon = bodyName === 'Mặt Trăng';
const asset = name => import.meta.env.BASE_URL + body.assetFolder + '/' + name;

const heading = document.querySelector('.stage-title h1');
const viewport = $('viewport');
const markerLayer = $('markers');
const message = $('message');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const savedModels = new Map();
let active = null;
let flight = null;
let model = null;

function showMessage(text = '') {
  message.textContent = text;
  message.hidden = !text;
}

try {
  document.title = 'Dấu vết trên ' + bodyName;
  document.querySelector('.stage').setAttribute('aria-label', 'Khám phá ' + bodyName + ' 3D');
  if (isMoon) {
    $('nav-mars').removeAttribute('aria-current');
    $('nav-moon').setAttribute('aria-current', 'page');
  }
  showGlobeHeading();
  start();
} catch (error) {
  showMessage('Không thể mở 3D. Hãy thử trình duyệt có hỗ trợ WebGL.');
  $('reset').disabled = true;
  console.error(error);
}

function showGlobeHeading() {
  heading.textContent = bodyName;
  document.querySelector('.stage-title .kicker').textContent = 'BẢN ĐỒ NHIỆM VỤ';
  const link = $('scene-source');
  link.href = globeSource;
  link.textContent = isMoon ? 'Ảnh bề mặt · NASA LRO ↗' : 'Ảnh bề mặt · NASA/JPL ↗';
}

function start() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  viewport.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.02, 160);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;

  const globe = new THREE.Scene();
  globe.background = new THREE.Color(0x0c0a11);
  const surface = new THREE.Scene();
  surface.background = new THREE.Color(0xa8674a);
  surface.fog = new THREE.FogExp2(0xa8674a, isMoon ? 0 : .035);
  const dust = createDust(surface, isMoon ? 0xa6a1a0 : undefined);
  const replay = createReplay(camera, controls, reduceMotion, dust, createOperation);

  const sphereMaterial = new THREE.MeshStandardMaterial({ color: isMoon ? 0x888585 : 0xa95433, roughness: 0.93 });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(2, 96, 64), sphereMaterial);
  globe.add(planet);
  new THREE.TextureLoader().load(asset(globeTexture), texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    sphereMaterial.map = texture;
    sphereMaterial.color.set(0xffffff);
    sphereMaterial.needsUpdate = true;
  }, undefined, () => showMessage('Không tải được ảnh bề mặt NASA. Các điểm nhiệm vụ vẫn dùng được.'));

  const stars = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i < 900; i++) {
    const y = 2 * random(i + 31) - 1;
    const angle = random(i + 1120) * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    points.push(55 * r * Math.cos(angle), 55 * y, 55 * r * Math.sin(angle));
  }
  stars.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  globe.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xcac7d5, size: 0.12 })));
  globe.add(new THREE.HemisphereLight(isMoon ? 0xe4e9ff : 0xffdfc8, isMoon ? 0x343642 : 0x8a4d32, isMoon ? 1.35 : 2));
  const sun = new THREE.DirectionalLight(isMoon ? 0xfff7eb : 0xffeee0, 2.4);
  sun.position.set(5, 4, 3);
  globe.add(sun);

  surface.add(new THREE.HemisphereLight(isMoon ? 0xf1f3ff : 0xffe5d2, isMoon ? 0x626369 : 0x966344, isMoon ? .65 : 1.15));
  const key = new THREE.DirectionalLight(isMoon ? 0xfff9f0 : 0xffe3bf, 2.45);
  key.position.set(-6, 8, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: .5, far: 24 });
  key.shadow.normalBias = .025;
  key.shadow.bias = -.0002;
  surface.add(key);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  surface.environment = pmrem.fromScene(room, 0.04).texture;
  surface.environmentIntensity = 0.45;
  room.dispose();
  pmrem.dispose();

  const siteCache = new Map();
  const draco = new DRACOLoader();
  draco.setDecoderPath(new URL(import.meta.env.BASE_URL + 'draco/', location.href).href);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const pins = missions.map(mission => {
    const vector = geo(mission.lat, mission.lon);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'marker';
    if (mission.markerOffset) button.style.transform = 'translate(calc(-50% + ' + mission.markerOffset + 'px), -50%)';
    button.setAttribute('aria-label', 'Khám phá ' + mission.name);
    const label = document.createElement('span');
    label.textContent = mission.name;
    button.append(label);
    button.addEventListener('click', () => select(mission, vector));
    markerLayer.append(button);

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'mission';
    const name = document.createElement('strong');
    name.textContent = mission.name;
    const site = document.createElement('small');
    site.textContent = mission.site;
    card.append(name, site);
    card.addEventListener('click', () => select(mission, vector));
    $('mission-list').append(card);
    return { vector, button };
  });
  const projection = new THREE.Vector3();
  const initial = (isMoon ? geo(10, 0) : geo(17, 42)).multiplyScalar(6.7);
  let globeView = initial.clone();

  function reset() {
    const span = active ? modelDimensions[active.model].meters : 3;
    const framing = model?.userData.framing ?? Math.max(.64, span / 3);
    controls.target.set(0, active ? modelFocusHeight() : 0, 0);
    controls.minDistance = active ? Math.max(.85, span * .7) : 4.4;
    controls.maxDistance = active ? Math.max(active.travel ? 26 : 12, span * 4) : 13;
    controls.maxPolarAngle = active ? 1.48 : Math.PI - 0.04;
    controls.minPolarAngle = 0.05;
    if (active?.travel) {
      controls.target.copy(routeFocus);
      camera.position.copy(routeOverview);
    } else if (active) {
      camera.position.set(4.3, 1.75, 5.1).multiplyScalar(framing).add(controls.target);
    } else {
      camera.position.copy(initial);
    }
    controls.update();
  }

  function modelFocusHeight() {
    return model ? model.userData.focusHeight : .6;
  }

  function select(mission, vector) {
    if (active || flight) return;
    globeView = camera.position.clone();
    markerLayer.hidden = true;
    $('catalog').inert = true;
    $('reset').disabled = true;
    controls.enabled = false;
    const direction = camera.position.clone().normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(direction, vector);
    flight = { mission, direction, rotation, distance: camera.position.length(), started: performance.now() };
    if (reduceMotion) openMission(mission);
  }

  function openMission(mission) {
    flight = null;
    active = mission;
    const site = terrainSites[mission.id];
    if (!siteCache.has(mission.id)) siteCache.set(mission.id, createSiteTerrain(mission.id, site, isMoon));
    const terrain = siteCache.get(mission.id);
    surface.add(terrain.group);
    surface.background.setHex(site.sky);
    surface.fog.color.setHex(site.sky);
    replay.setTerrain(terrain.groundOffset);
    controls.enabled = true;
    $('reset').disabled = false;
    $('back').hidden = false;
    $('catalog').hidden = true;
    $('details').hidden = false;
    $('detail-type').textContent = mission.type;
    $('detail-name').textContent = mission.name;
    $('detail-site').textContent = mission.site;
    $('detail-location').textContent = mission.location + ' trên quả cầu';
    $('detail-summary').textContent = mission.summary;
    const dimensions = modelDimensions[mission.model];
    $('model-size-label').textContent = dimensions.illustrative ? 'Tỷ lệ cảnh · ' : 'Kích thước tham chiếu · ';
    $('model-size').textContent = dimensions.label;
    $('model-size').href = dimensions.source;
    $('mission-source').href = mission.source;
    $('model-credit').textContent = 'Mô hình 3D · ' + mission.credit;
    $('model-source').hidden = !mission.modelSource;
    if (mission.modelSource) $('model-source').href = mission.modelSource;
    replay.open(mission);
    heading.textContent = mission.stageName ?? mission.name;
    document.querySelector('.stage-title .kicker').textContent = site.title;
    const link = $('scene-source');
    link.href = site.source;
    link.textContent = 'Địa hình dựng theo ảnh NASA ↗';
    $('terrain-note').textContent = site.note;
    $('detail-name').focus({ preventScroll: true });
    reset();
    showMessage('Đang tải mô hình 3D…');

    if (!savedModels.has(mission.model)) {
      savedModels.set(mission.model, loadModel(loader, asset, mission.model).catch(error => {
        savedModels.delete(mission.model);
        throw error;
      }));
    }
    savedModels.get(mission.model).then(result => {
      if (active !== mission || model) return;
      model = fitModel(result.scene, mission.model, dimensions);
      surface.add(model);
      replay.attach(model);
      reset();
      showMessage();
    }).catch(error => {
      if (active !== mission) return;
      showMessage('Không tải được mô hình. Hãy quay về quả cầu và thử lại.');
      console.error(error);
    });
  }

  $('back').addEventListener('click', () => {
    const previous = active;
    surface.remove(siteCache.get(previous.id).group);
    replay.close();
    if (model) surface.remove(model);
    model = null;
    active = null;
    reset();
    camera.position.copy(globeView);
    controls.update();
    $('back').hidden = true;
    $('details').hidden = true;
    $('catalog').hidden = false;
    $('catalog').inert = false;
    markerLayer.hidden = false;
    showGlobeHeading();
    showMessage();
    const index = missions.indexOf(previous);
    $('mission-list').children[index]?.focus({ preventScroll: true });
  });
  $('reset').addEventListener('click', () => {
    if (active) replay.reset();
    reset();
  });
  reset();

  new ResizeObserver(() => {
    const { clientWidth, clientHeight } = viewport;
    if (!clientWidth || !clientHeight) return;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
  }).observe(viewport);

  const step = new THREE.Quaternion();
  const facing = new THREE.Vector3();
  renderer.setAnimationLoop(now => {
    if (flight) {
      const t = Math.min(1, Math.max(0, (now - flight.started) / 950));
      const eased = t * t * (3 - 2 * t);
      step.identity().slerp(flight.rotation, eased);
      camera.position.copy(flight.direction).applyQuaternion(step).multiplyScalar(THREE.MathUtils.lerp(flight.distance, 2.52, eased));
      camera.lookAt(0, 0, 0);
      if (t === 1) openMission(flight.mission);
    } else {
      if (active) replay.animate(now);
      controls.update();
      if (active) replay.project();
    }

    if (!active && !flight) {
      camera.updateMatrixWorld();
      facing.copy(camera.position).normalize();
      for (const { vector, button } of pins) {
        projection.copy(vector).multiplyScalar(2.01).project(camera);
        button.hidden = vector.dot(facing) <= 2 / camera.position.length()
          || Math.abs(projection.x) > 1 || Math.abs(projection.y) > 1;
        if (!button.hidden) {
          button.style.left = (projection.x + 1) * 50 + '%';
          button.style.top = (1 - projection.y) * 50 + '%';
        }
      }
    }
    renderer.render(active ? surface : globe, camera);
  });
}

function random(seed) {
  const value = Math.sin(seed * 374.129) * 43758.5453;
  return value - Math.floor(value);
}

function geo(latitude, longitude) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lon = THREE.MathUtils.degToRad(longitude);
  return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
}

function fitModel(scene, filename, dimensions) {
  const { meters, height } = dimensions;
  const object = scene.clone(true);
  object.traverse(part => {
    if (!part.isMesh) return;
    part.castShadow = true;
    part.receiveShadow = true;
  });
  const box = new THREE.Box3().setFromObject(object, true);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  let ground = box.min.y;
  let referenceSpan = Math.max(size.x, size.z);
  if (filename === 'mer-articulated.glb') referenceSpan = size.x;
  if (filename === 'lrv-oldschool.glb') {
    const wheels = ['left_front', 'left_rear', 'right_front', 'right_rear']
      .map(name => object.getObjectByName('suspension_' + name + '_wheel'));
    const axles = wheels.map(wheel => wheel.getWorldPosition(new THREE.Vector3()).z);
    referenceSpan = (axles[0] - axles[1] + axles[2] - axles[3]) / 2;
    const metersPerUnit = meters / referenceSpan;
    for (const wheel of wheels) {
      const wheelSize = new THREE.Box3().setFromObject(wheel, true).getSize(new THREE.Vector3());
      const radial = dimensions.tireDiameter / (metersPerUnit * wheelSize.y);
      wheel.scale.set(dimensions.tireWidth / (metersPerUnit * wheelSize.x), radial, radial);
    }
    box.setFromObject(object, true);
    box.getSize(size);
    box.getCenter(center);
    ground = Math.min(...wheels.map(wheel => new THREE.Box3().setFromObject(wheel, true).min.y));
  }
  if (filename === 'eagle-nassp.glb') {
    const pads = new THREE.Box3().setFromObject(object.getObjectByName('Footpad'), true);
    pads.expandByObject(object.getObjectByName('FootpadAft'), true);
    referenceSpan = pads.max.z - pads.min.z;
    ground = pads.min.y;
  }
  if (filename === 'surveyor-nassp.glb') {
    const pads = new THREE.Box3().setFromObject(object.getObjectByName('Footpads'), true);
    referenceSpan = pads.max.x - pads.min.x;
    // The mesh is posed on a slope. Align its middle with the terrain.
    ground = pads.min.y + .23;
  }
  if (filename === 'alsep-nassp.glb') referenceSpan = meters;
  if (filename === 'ingenuity.glb') {
    const rotor = object.getObjectByName('rotors_01');
    const shaft = rotor.getWorldPosition(new THREE.Vector3());
    const vertex = new THREE.Vector3();
    let radius = 0;
    rotor.traverse(part => {
      if (!part.isMesh) return;
      const positions = part.geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i).applyMatrix4(part.matrixWorld);
        radius = Math.max(radius, Math.hypot(vertex.x - shaft.x, vertex.z - shaft.z));
      }
    });
    referenceSpan = radius * 2;
  }
  if (filename === 'insight-deployed.glb') {
    const arrays = new THREE.Box3().setFromObject(object.getObjectByName('panel_l_root'), true);
    arrays.expandByObject(object.getObjectByName('panel_r_root'), true);
    referenceSpan = arrays.max.x - arrays.min.x;
  }
  const scale = meters / referenceSpan;
  const verticalScale = height ? height / (box.max.y - (filename === 'surveyor-nassp.glb' ? box.min.y : ground)) : scale;
  const wrapper = new THREE.Group();
  object.position.sub(new THREE.Vector3(center.x, ground, center.z));
  wrapper.scale.set(scale, verticalScale, scale);
  wrapper.position.y = -.075;
  wrapper.userData.focusHeight = (box.max.y - ground) * verticalScale * .46;
  wrapper.userData.framing = Math.max(.64, (filename === 'lrv-oldschool.glb' ? Math.max(size.x, size.z) * scale : meters) / 3);
  wrapper.add(object);
  return wrapper;
}
