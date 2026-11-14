import { createLunarOperation, prepareLunarModel } from './moon-models.js';

export {
  moonDimensions as modelDimensions,
  moonMissions as missions,
  moonTerrainSites as terrainSites,
  moonTextureSource as globeSource,
} from './moon-missions-data.js';

export const bodyName = 'Mặt Trăng';
export const assetFolder = 'moon';
export const globeTexture = 'moon.jpg';

export async function loadModel(loader, asset, filename) {
  const model = await loader.loadAsync(asset(filename));
  prepareLunarModel(model.scene, filename);
  return model;
}

export function createOperation(model, mission) {
  return createLunarOperation(model, mission.id);
}
