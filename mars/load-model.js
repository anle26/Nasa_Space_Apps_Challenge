export async function loadMarsModel(loader, asset, filename) {
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
    const onFixedArm = vertex => {
      const x = positions.getX(vertex);
      return x >= -.62 && x <= -.22 && positions.getY(vertex) > .53 && positions.getZ(vertex) > .85;
    };
    for (let i = 0; i < count; i += 3) {
      const a = index ? index.getX(i) : i;
      const b = index ? index.getX(i + 1) : i + 1;
      const c = index ? index.getX(i + 2) : i + 2;
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
