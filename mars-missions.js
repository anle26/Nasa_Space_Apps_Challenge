import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { missions, modelDimensions } from './mars-missions-data.js';
import { createReplay } from './mars-mission-replay.js';
import { createDust } from './mars-surface-effects.js';
import { createSiteTerrain, terrainSites } from './mars-site-terrain.js';
import { articulateSojourner } from './mars-sojourner.js';

const $ = id => document.getElementById(id);
const asset = name => import.meta.env.BASE_URL + 'mars-assets/' + name;
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
  start();
} catch (error) {
  showMessage('Không thể mở 3D. Hãy thử trình duyệt có hỗ trợ WebGL.');
  $('reset').disabled = true;
  console.error(error);
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
  surface.fog = new THREE.FogExp2(0xa8674a, 0.035);
  const dust = createDust(surface);
  const replay = createReplay(camera, controls, reduceMotion, dust);

  const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xa95433, roughness: 0.93 });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(2, 96, 64), sphereMaterial);
  globe.add(planet);
  new THREE.TextureLoader().load(asset('mars.jpg'), texture => {
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
  globe.add(new THREE.HemisphereLight(0xffdfc8, 0x8a4d32, 2));
  const sun = new THREE.DirectionalLight(0xffeee0, 2.4);
  sun.position.set(5, 4, 3);
  globe.add(sun);

  surface.add(new THREE.HemisphereLight(0xffe5d2, 0x966344, 1.15));
  const key = new THREE.DirectionalLight(0xffe3bf, 2.45);
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
  draco.setDecoderPath(new URL('draco/', new URL(asset('mars.jpg'), location.href)).href);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  async function loadMissionModel(filename) {
    if (filename === 'sojourner-dan.glb') {
      const { scene } = await loader.loadAsync(asset(filename));
      return { scene: articulateSojourner(scene) };
    }
    if (filename !== 'insight-deployed.glb') return loader.loadAsync(asset(filename));
    const [deployed, instruments] = await Promise.all([
      loader.loadAsync(asset(filename)),
      loader.loadAsync(asset('insight.glb')),
    ]);
    // Strip the fixed payloads, solar arrays and arm baked into the body.
    // The named arm and panel hierarchies supply the moving parts.
    const body = deployed.scene.getObjectByName('InSight_Deployed');
    for (const mesh of body.children.filter(child => child.isMesh && !child.name.startsWith('arm_'))) {
      if (mesh.material.name === 'InSIGHT_AO_08') {
        mesh.removeFromParent();
        continue;
      }
      const geometry = mesh.geometry;
      const positions = geometry.getAttribute('position');
      const index = geometry.getIndex();
      const kept = [];
      const count = index?.count ?? positions.count;
      const armTrim = ['InSIGHT_tex_01', 'InSIGHT_tex_02'].includes(mesh.material.name);
      const hasBakedTethers = mesh.material.name === 'InSIGHT_tex_02' && positions.count === 4811;
      const onFixedArm = vertex => {
        const x = positions.getX(vertex);
        return x >= -.62 && x <= -.22 && positions.getY(vertex) > .53 && positions.getZ(vertex) > .85;
      };
      for (let i = 0; i < count; i += 3) {
        const a = index ? index.getX(i) : i;
        const b = index ? index.getX(i + 1) : i + 1;
        const c = index ? index.getX(i + 2) : i + 2;
        // These two connected vertex ranges in the NASA Deployed GLB are the
        // baked tethers. The deployment animation supplies their replacements.
        if (hasBakedTethers && ((a >= 1890 && a <= 2255) || (a >= 3403 && a <= 3890))) continue;
        const outermostX = Math.max(Math.abs(positions.getX(a)), Math.abs(positions.getX(b)), Math.abs(positions.getX(c)));
        if (outermostX <= 1.4 && Math.max(positions.getZ(a), positions.getZ(b), positions.getZ(c)) <= 1.5
          && !(armTrim && (onFixedArm(a) || onFixedArm(b) || onFixedArm(c)))) {
          kept.push(a, b, c);
        }
      }
      if (kept.length !== count) {
        geometry.setIndex(kept);
        geometry.boundingBox = null;
        geometry.boundingSphere = null;
      }
    }
    // Both NASA assets use the same axes and deck origin. Copy only the
    // science payload, keeping the Deployed body, solar arrays and robot arm.
    for (const name of ['SEIS', 'WTS', 'HP3_v3d_baked']) {
      const instrument = instruments.scene.getObjectByName(name);
      if (!instrument) throw new Error('Missing InSight instrument: ' + name);
      deployed.scene.add(instrument.clone(true));
    }
    return deployed;
  }
  const pins = missions.map(mission => {
    const vector = geo(mission.lat, mission.lon);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'marker';
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
  const initial = geo(17, 42).multiplyScalar(6.7);
  let globeView = initial.clone();

  function reset() {
    const dimensions = active ? modelDimensions[active.model] : null;
    const span = dimensions?.meters ?? 3;
    const framing = dimensions?.framing ?? Math.max(.64, span / 3);
    controls.target.set(0, active ? modelFocusHeight() : 0, 0);
    controls.minDistance = active ? Math.max(.85, span * .7) : 4.4;
    controls.maxDistance = active ? Math.max(12, span * 4) : 13;
    controls.maxPolarAngle = active ? 1.48 : Math.PI - 0.04;
    controls.minPolarAngle = 0.05;
    if (active) {
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
    if (!siteCache.has(mission.id)) siteCache.set(mission.id, createSiteTerrain(mission.id));
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
    $('model-size').textContent = dimensions.label;
    $('model-size').href = dimensions.source;
    $('mission-source').href = mission.source;
    $('model-credit').textContent = 'Mô hình 3D · ' + mission.credit;
    const modelReference = $('model-reference');
    modelReference.hidden = !mission.modelReference;
    if (mission.modelReference) modelReference.href = mission.modelReference;
    const modelLicense = $('model-license');
    modelLicense.hidden = !mission.modelLicense;
    if (mission.modelLicense) modelLicense.href = mission.modelLicense;
    replay.open(mission);
    document.querySelector('.stage-title h1').textContent = mission.name;
    document.querySelector('.stage-title .kicker').textContent = site.title;
    const link = $('scene-source');
    link.href = site.source;
    link.textContent = 'Địa hình dựng theo ảnh NASA ↗';
    $('terrain-note').textContent = site.note;
    $('detail-name').focus({ preventScroll: true });
    reset();
    showMessage('Đang tải mô hình 3D…');

    if (!savedModels.has(mission.model)) {
      savedModels.set(mission.model, loadMissionModel(mission.model).catch(error => {
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
    document.querySelector('.stage-title h1').textContent = 'Sao Hỏa';
    document.querySelector('.stage-title .kicker').textContent = 'BẢN ĐỒ NHIỆM VỤ';
    const link = $('scene-source');
    link.href = 'https://science.nasa.gov/3d-resources/mars/';
    link.textContent = 'Ảnh bề mặt · NASA/JPL ↗';
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

function fitModel(scene, filename, { meters, framing }) {
  const object = scene.clone(true);
  object.traverse(part => {
    if (!part.isMesh) return;
    part.castShadow = true;
    part.receiveShadow = true;
  });
  const box = new THREE.Box3().setFromObject(object, true);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  let referenceSpan = Math.max(size.x, size.z);
  if (filename === 'mer-articulated.glb') referenceSpan = size.x;
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
  const wrapper = new THREE.Group();
  object.position.sub(new THREE.Vector3(center.x, box.min.y, center.z));
  wrapper.scale.setScalar(scale);
  wrapper.position.y = -.075;
  wrapper.userData.focusHeight = size.y * scale * .46;
  wrapper.userData.framing = framing ?? Math.max(.64, meters / 3);
  wrapper.add(object);
  return wrapper;
}
