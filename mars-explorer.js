import { TilesRenderer } from '3d-tiles-renderer';
import {
  AmbientLight, DirectionalLight, Group, PerspectiveCamera, Scene, WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const viewer = document.querySelector('#viewer');
const status = document.querySelector('#status');
const resetButton = document.querySelector('#reset');
const dataset = 'https://raw.githubusercontent.com/NASA-AMMOS/3DTilesSampleData/master/msl-dingo-gap/0528_0260184_to_s64o256_colorize';

try {
  startViewer();
} catch (error) {
  status.hidden = false;
  status.textContent = 'Không thể mở cảnh 3D. Hãy thử trình duyệt có hỗ trợ WebGL.';
  resetButton.disabled = true;
  console.error(error);
}

function startViewer() {
  const scene = new Scene();
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xd8cec0);
  viewer.append(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Cảnh 3D Dingo Gap');

  const camera = new PerspectiveCamera(60, 1, 1, 4000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minDistance = 12;
  controls.maxDistance = 62;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.38;

  const light = new DirectionalLight(0xffffff);
  light.position.set(1, 2, 3);
  scene.add(light, new AmbientLight(0xffffff, 0.2));

  const surface = new Group();
  surface.rotation.x = Math.PI / 2;
  scene.add(surface);

  const ground = new TilesRenderer(dataset + '/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize_tileset.json');
  const sky = new TilesRenderer(dataset + '/0528_0260184_to_s64o256_sky/0528_0260184_to_s64o256_sky_tileset.json');
  ground.errorTarget = 6;
  sky.lruCache = ground.lruCache;
  surface.add(ground.group, sky.group);
  const layers = [ground, sky];

  ground.addEventListener('load-model', () => {
    status.hidden = true;
  });
  ground.addEventListener('load-error', () => {
    if (!status.hidden) status.textContent = 'Không tải được một phần địa hình NASA. Hãy kiểm tra mạng hoặc tải lại trang.';
  });

  function resetView() {
    controls.reset();
    controls.update();
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = viewer;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    for (const layer of layers) {
      layer.setResolutionFromRenderer(camera, renderer);
    }
  }

  camera.position.set(20, 10, 20);
  controls.update();
  controls.saveState();
  resetButton.addEventListener('click', resetView);
  window.addEventListener('resize', resize);
  resetView();
  for (const layer of layers) layer.setCamera(camera);
  resize();

  renderer.setAnimationLoop(() => {
    controls.update();
    camera.updateMatrixWorld();
    for (const layer of layers) layer.update();
    renderer.render(scene, camera);
  });
}
