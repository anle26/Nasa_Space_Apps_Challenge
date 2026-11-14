import { missions as marsMissions, replayTitles } from './mars-missions-data.js';

export { modelDimensions } from './mars-missions-data.js';
export { terrainSites } from './terrain-data.js';
export { createLanderOperation as createOperation } from './mars-lander-operations.js';
export { loadMarsModel as loadModel } from './load-model.js';

export const bodyName = 'Sao Hỏa';
export const assetFolder = 'mars';
export const globeTexture = 'mars.jpg';
export const globeSource = 'https://science.nasa.gov/3d-resources/mars/';
export const missions = marsMissions.map(mission => ({ ...mission, titles: replayTitles[mission.id] }));
