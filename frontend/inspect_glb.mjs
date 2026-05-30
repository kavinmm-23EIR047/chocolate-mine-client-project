/**
 * inspect_glb.mjs  —  Parse GLB files and report meshes, materials, nodes, textures
 * Usage:  node inspect_glb.mjs
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const glbDir = join(process.cwd(), 'src', 'assets', '3d images');

const files = ['teddy-tier1.glb', 'teddy-tier2.glb'];

for (const file of files) {
  const filePath = join(glbDir, file);
  console.log('\n' + '='.repeat(80));
  console.log(`FILE: ${file}`);
  console.log('='.repeat(80));

  let buf;
  try {
    buf = readFileSync(filePath);
  } catch (e) {
    console.log('  ❌ Could not read:', e.message);
    continue;
  }

  // GLB header: magic(4) + version(4) + length(4)
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546C67) { // 'glTF'
    console.log('  ❌ Not a valid GLB file');
    continue;
  }
  const version = buf.readUInt32LE(4);
  const totalLength = buf.readUInt32LE(8);
  console.log(`  GLB version: ${version}  |  Total size: ${(totalLength / 1024 / 1024).toFixed(2)} MB`);

  // First chunk should be JSON
  const chunk0Length = buf.readUInt32LE(12);
  const chunk0Type = buf.readUInt32LE(16);
  if (chunk0Type !== 0x4E4F534A) { // 'JSON'
    console.log('  ❌ First chunk is not JSON');
    continue;
  }

  const jsonStr = buf.toString('utf8', 20, 20 + chunk0Length);
  let gltf;
  try {
    gltf = JSON.parse(jsonStr);
  } catch (e) {
    console.log('  ❌ Failed to parse glTF JSON:', e.message);
    continue;
  }

  // ── Asset info ──
  if (gltf.asset) {
    console.log(`\n  📋 Asset: generator="${gltf.asset.generator || 'unknown'}"  version="${gltf.asset.version || '?'}"`);
  }

  // ── Scenes ──
  console.log(`\n  🌍 Scenes: ${(gltf.scenes || []).length}`);
  (gltf.scenes || []).forEach((s, i) => {
    console.log(`     [${i}] name="${s.name || '(unnamed)'}"  rootNodes=[${(s.nodes || []).join(', ')}]`);
  });

  // ── Nodes (hierarchy) ──
  const nodes = gltf.nodes || [];
  console.log(`\n  🔗 Nodes: ${nodes.length}`);
  nodes.forEach((n, i) => {
    const parts = [];
    parts.push(`name="${n.name || '(unnamed)'}"`);
    if (n.mesh !== undefined) parts.push(`mesh=${n.mesh}`);
    if (n.children && n.children.length) parts.push(`children=[${n.children.join(', ')}]`);
    if (n.translation) parts.push(`pos=[${n.translation.map(v => v.toFixed(3)).join(', ')}]`);
    if (n.rotation) parts.push(`rot=[${n.rotation.map(v => v.toFixed(3)).join(', ')}]`);
    if (n.scale) parts.push(`scale=[${n.scale.map(v => v.toFixed(3)).join(', ')}]`);
    if (n.skin !== undefined) parts.push(`skin=${n.skin}`);
    console.log(`     [${i}] ${parts.join('  ')}`);
  });

  // ── Meshes ──
  const meshes = gltf.meshes || [];
  console.log(`\n  🧊 Meshes: ${meshes.length}`);
  meshes.forEach((m, i) => {
    console.log(`     [${i}] name="${m.name || '(unnamed)'}"`);
    (m.primitives || []).forEach((prim, pi) => {
      const attrs = Object.keys(prim.attributes || {});
      const matIdx = prim.material;
      const hasIndices = prim.indices !== undefined;
      console.log(`        primitive[${pi}]:  material=${matIdx !== undefined ? matIdx : 'NONE'}  attributes=[${attrs.join(', ')}]  indexed=${hasIndices}`);
      
      // If we can, get vertex count from accessor
      if (prim.attributes.POSITION !== undefined && gltf.accessors) {
        const acc = gltf.accessors[prim.attributes.POSITION];
        if (acc) console.log(`          → vertex count: ${acc.count}  type: ${acc.type}  componentType: ${acc.componentType}`);
        
        // Show bounding box if available
        if (acc.min && acc.max) {
          console.log(`          → bbox min: [${acc.min.map(v => v.toFixed(4)).join(', ')}]`);
          console.log(`          → bbox max: [${acc.max.map(v => v.toFixed(4)).join(', ')}]`);
        }
      }
      
      // Index count
      if (hasIndices && gltf.accessors) {
        const idxAcc = gltf.accessors[prim.indices];
        if (idxAcc) console.log(`          → index count: ${idxAcc.count}  (triangles ≈ ${Math.floor(idxAcc.count / 3)})`);
      }
    });
  });

  // ── Materials ──
  const materials = gltf.materials || [];
  console.log(`\n  🎨 Materials: ${materials.length}`);
  materials.forEach((mat, i) => {
    const parts = [`name="${mat.name || '(unnamed)'}"`];
    if (mat.pbrMetallicRoughness) {
      const pbr = mat.pbrMetallicRoughness;
      if (pbr.baseColorFactor) {
        const c = pbr.baseColorFactor;
        parts.push(`baseColor=[${c.map(v => v.toFixed(3)).join(', ')}]`);
      }
      if (pbr.baseColorTexture) parts.push(`baseColorTex=tex[${pbr.baseColorTexture.index}]`);
      if (pbr.metallicFactor !== undefined) parts.push(`metallic=${pbr.metallicFactor}`);
      if (pbr.roughnessFactor !== undefined) parts.push(`roughness=${pbr.roughnessFactor}`);
      if (pbr.metallicRoughnessTexture) parts.push(`metalRoughTex=tex[${pbr.metallicRoughnessTexture.index}]`);
    }
    if (mat.normalTexture) parts.push(`normalTex=tex[${mat.normalTexture.index}]`);
    if (mat.emissiveFactor) parts.push(`emissive=[${mat.emissiveFactor.join(', ')}]`);
    if (mat.doubleSided) parts.push('doubleSided');
    if (mat.alphaMode) parts.push(`alpha=${mat.alphaMode}`);
    console.log(`     [${i}] ${parts.join('  ')}`);
  });

  // ── Textures ──
  const textures = gltf.textures || [];
  console.log(`\n  🖼️  Textures: ${textures.length}`);
  textures.forEach((tex, i) => {
    const img = (gltf.images || [])[tex.source];
    const sampler = (gltf.samplers || [])[tex.sampler];
    const parts = [];
    if (img) {
      if (img.uri) parts.push(`uri="${img.uri}"`);
      if (img.mimeType) parts.push(`mime="${img.mimeType}"`);
      if (img.bufferView !== undefined) parts.push(`bufferView=${img.bufferView}`);
      if (img.name) parts.push(`name="${img.name}"`);
    }
    console.log(`     [${i}] ${parts.join('  ')}`);
  });

  // ── Images ──
  const images = gltf.images || [];
  console.log(`\n  📸 Images: ${images.length}`);
  images.forEach((img, i) => {
    const parts = [];
    if (img.name) parts.push(`name="${img.name}"`);
    if (img.uri) parts.push(`uri="${img.uri}"`);
    if (img.mimeType) parts.push(`mime="${img.mimeType}"`);
    if (img.bufferView !== undefined) {
      const bv = (gltf.bufferViews || [])[img.bufferView];
      if (bv) parts.push(`size=${(bv.byteLength / 1024).toFixed(1)} KB`);
    }
    console.log(`     [${i}] ${parts.join('  ')}`);
  });

  // ── Accessors summary ──
  const accessors = gltf.accessors || [];
  console.log(`\n  📊 Accessors: ${accessors.length}`);

  // ── Buffers ──
  const buffers = gltf.buffers || [];
  console.log(`\n  💾 Buffers: ${buffers.length}`);
  buffers.forEach((b, i) => {
    console.log(`     [${i}] byteLength=${(b.byteLength / 1024 / 1024).toFixed(2)} MB`);
  });

  // ── Summary ──
  console.log('\n  ─── SUMMARY ───');
  console.log(`  Nodes: ${nodes.length}  |  Meshes: ${meshes.length}  |  Materials: ${materials.length}  |  Textures: ${textures.length}  |  Images: ${images.length}`);
  
  const totalVerts = meshes.reduce((sum, m) => {
    return sum + (m.primitives || []).reduce((ps, p) => {
      if (p.attributes.POSITION !== undefined && gltf.accessors) {
        return ps + (gltf.accessors[p.attributes.POSITION]?.count || 0);
      }
      return ps;
    }, 0);
  }, 0);
  console.log(`  Total vertices: ${totalVerts.toLocaleString()}`);
  
  // Check if meshes have meaningful names
  const namedMeshes = meshes.filter(m => m.name && m.name !== '');
  console.log(`  Named meshes: ${namedMeshes.length} / ${meshes.length}`);
  if (namedMeshes.length > 0) {
    console.log(`  Mesh names: ${namedMeshes.map(m => `"${m.name}"`).join(', ')}`);
  }
  
  const namedNodes = nodes.filter(n => n.name && n.name !== '');
  console.log(`  Named nodes: ${namedNodes.length} / ${nodes.length}`);
  if (namedNodes.length > 0) {
    console.log(`  Node names: ${namedNodes.map(n => `"${n.name}"`).join(', ')}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('DONE');
console.log('='.repeat(80));
