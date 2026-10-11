// Gera assets/3d/residencial-04.glb: maquete volumétrica ilustrativa do Residencial 04,
// montada a partir das perspectivas do projeto (residencial4.webp, 4.1 e 4.2). Node puro, sem dependências.
// Medidas em metros (escala real para realidade aumentada). Eixos: X para a direita da fachada, Y para cima, Z para a rua.
// Uso: node scripts/gerar-maquete.mjs
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.mjs";

const MAT = {
  branco: { cor: [0.93, 0.93, 0.92], rug: 0.85 },
  cinza: { cor: [0.42, 0.41, 0.4], rug: 0.9 },
  pedra: { cor: [0.2, 0.2, 0.21], rug: 0.95 },
  pedraClara: { cor: [0.34, 0.34, 0.35], rug: 0.95 },
  vidro: { cor: [0.72, 0.78, 0.82], rug: 0.25 },
  piso: { cor: [0.62, 0.62, 0.6], rug: 0.95 },
  grama: { cor: [0.3, 0.45, 0.22], rug: 1 },
  muro: { cor: [0.3, 0.3, 0.31], rug: 0.95 },
};
const caixas = Object.fromEntries(Object.keys(MAT).map((k) => [k, []]));
// caixa por limites: x0..x1, y0..y1, z0..z1
const box = (m, x0, x1, y0, y1, z0, z1) => caixas[m].push([x0, x1, y0, y1, z0, z1]);

/* Terreno (lote 13 x 25 m) e calçada da frente */
box("grama", -6.5, 6.5, -0.05, 0, -16, 6);
box("piso", -6.5, 6.5, -0.04, 0.01, 6, 8); // calçada
box("piso", -6.5, -0.6, -0.04, 0.02, -1, 6); // pátio da garagem
box("piso", -0.6, 1.1, -0.04, 0.02, 0.6, 6); // caminho até a porta

/* Muros laterais baixos (cortados na altura de 1 m para não esconder a casa) */
box("muro", -6.5, -6.3, 0, 1.0, -16, 6);
box("muro", 6.3, 6.5, 0, 1.0, -16, 6);
box("muro", -6.5, 6.5, 0, 1.0, -16.2, -16);

/* Corpo principal (cinza), térreo */
const H = 3.0;
box("cinza", -3.4, 2.4, 0, H, -12, 0.6);
// platibanda/beiral branco sobre o corpo principal
box("branco", -3.6, 2.6, H, H + 0.35, -12.2, 0.6);

/* Garagem coberta: marquise branca em L com pilar branco à esquerda */
box("branco", -6.0, 1.2, H - 0.05, H + 0.45, -1.0, 2.4); // laje da marquise (avança para a rua)
box("branco", -6.0, -5.2, 0, H - 0.05, 0.6, 2.4); // pilar/parede branca esquerda
box("cinza", -5.9, -3.4, 0, H, -8, -1.0); // fundo da garagem

/* Pilar de pedra entre a garagem e a porta */
box("pedra", 0.75, 1.05, 0, H - 0.05, 0.6, 2.2);

/* Janela da fachada (sob a marquise) */
box("branco", -2.9, -1.3, 1.0, 2.25, 0.6, 0.7);
box("vidro", -2.8, -1.4, 1.1, 2.15, 0.62, 0.72);

/* Porta clara */
box("branco", 1.3, 2.2, 0, 2.3, 0.6, 0.72);

/* Volume alto à direita: moldura branca + painel cinza + duas faixas de vidro com ripado */
const HA = 3.9;
box("branco", 2.4, 7.4, HA - 0.4, HA, -12, 1.4); // laje superior (beiral branco)
box("branco", 6.8, 7.4, 0, HA, 0.2, 1.4); // moldura branca da fachada (só na frente)
box("cinza", 2.4, 7.3, 0, HA - 0.4, -12, 0.9); // volume (lateral cinza, como na perspectiva 4.1)
box("vidro", 2.75, 3.45, 0.05, HA - 0.45, 0.9, 1.0);
box("vidro", 5.75, 6.45, 0.05, HA - 0.45, 0.9, 1.0);
for (const x0 of [2.75, 5.75]) for (let y = 0.7; y < HA - 0.5; y += 0.7) box("branco", x0, x0 + 0.7, y, y + 0.05, 0.95, 1.05);

/* Faixas da pedra (lembra o filete do render) */
for (let y = 0.25; y < H - 0.2; y += 0.3) box("pedraClara", 0.73, 1.07, y, y + 0.08, 0.58, 2.22);
for (let y = H + 0.5; y < H + 1.3; y += 0.3) box("pedraClara", -2.92, 0.42, y, y + 0.08, -4.52, -1.98);

/* Bloco de pedra sobre a cobertura (caixa d'água) */
box("pedra", -2.9, 0.4, H + 0.35, H + 1.35, -4.5, -2.0);

/* Janelas laterais (lado direito, visíveis na perspectiva 4.1) */
for (const [z0, z1] of [[-3.5, -2.0], [-7.0, -5.5]]) {
  box("branco", 7.4, 7.48, 1.0, 2.3, z0 - 0.08, z1 + 0.08);
  box("vidro", 7.42, 7.5, 1.08, 2.22, z0, z1);
}
/* Janelas dos fundos (perspectiva 4.2) */
for (const [x0, x1] of [[-2.8, -1.3], [0.2, 1.7], [3.4, 4.6]]) {
  box("branco", x0 - 0.08, x1 + 0.08, 1.0, 2.3, -12.08, -12.0);
  box("vidro", x0, x1, 1.08, 2.22, -12.1, -12.02);
}

/* ---------- escrita do glTF binário ---------- */
function malha(lista) {
  const pos = [], nor = [], idx = [];
  for (const [x0, x1, y0, y1, z0, z1] of lista) {
    const faces = [
      [[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]],
      [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]],
      [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]],
      [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]],
      [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]],
      [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]],
    ];
    for (const [n, vs] of faces) {
      const b = pos.length / 3;
      for (const v of vs) pos.push(...v), nor.push(...n);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), idx: new Uint16Array(idx) };
}

const gltf = { asset: { version: "2.0", generator: "DCS gerar-maquete.mjs" }, scene: 0, scenes: [{ nodes: [0] }],
  nodes: [{ name: "Residencial 04", children: [] }], meshes: [], materials: [], accessors: [], bufferViews: [], buffers: [] };
const partes = [];
let off = 0;
const addView = (arr, target) => {
  const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  const pad = (4 - (buf.length % 4)) % 4;
  gltf.bufferViews.push({ buffer: 0, byteOffset: off, byteLength: buf.length, target });
  partes.push(buf, Buffer.alloc(pad));
  off += buf.length + pad;
  return gltf.bufferViews.length - 1;
};
for (const [nome, lista] of Object.entries(caixas)) {
  if (!lista.length) continue;
  const m = malha(lista);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < m.pos.length; i += 3) for (let k = 0; k < 3; k++) (min[k] = Math.min(min[k], m.pos[i + k])), (max[k] = Math.max(max[k], m.pos[i + k]));
  const vp = addView(m.pos, 34962), vn = addView(m.nor, 34962), vi = addView(m.idx, 34963);
  const a = gltf.accessors.length;
  gltf.accessors.push(
    { bufferView: vp, componentType: 5126, count: m.pos.length / 3, type: "VEC3", min, max },
    { bufferView: vn, componentType: 5126, count: m.nor.length / 3, type: "VEC3" },
    { bufferView: vi, componentType: 5123, count: m.idx.length, type: "SCALAR" }
  );
  gltf.materials.push({ name: nome, pbrMetallicRoughness: { baseColorFactor: [...MAT[nome].cor, 1], metallicFactor: 0, roughnessFactor: MAT[nome].rug } });
  gltf.meshes.push({ name: nome, primitives: [{ attributes: { POSITION: a, NORMAL: a + 1 }, indices: a + 2, material: gltf.materials.length - 1 }] });
  gltf.nodes.push({ name: nome, mesh: gltf.meshes.length - 1 });
  gltf.nodes[0].children.push(gltf.nodes.length - 1);
}
const bin = Buffer.concat(partes);
gltf.buffers.push({ byteLength: bin.length });
let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
const chunk = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
const glb = Buffer.concat([header, chunk(json.length, 0x4e4f534a), json, chunk(bin.length, 0x004e4942), bin]);
const out = path.join(ROOT, "assets/3d/residencial-04.glb");
fs.writeFileSync(out, glb);
console.log(`assets/3d/residencial-04.glb: ${(glb.length / 1024).toFixed(1)} KB, ${Object.values(caixas).flat().length} volumes`);
