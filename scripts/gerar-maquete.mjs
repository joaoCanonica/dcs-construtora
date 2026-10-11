// Gera a maquete volumétrica ilustrativa do Residencial 04, no estilo maquete de mesa de escritório de arquitetura:
//   assets/3d/residencial-04-bruto.glb  (GLB com texturas PNG procedurais; depois otimizado para residencial-04.glb)
//   assets/3d/estudio.png              (ambiente de estúdio equirretangular 256x128 para reflexos e volume)
// Tudo em Node puro (PNG com zlib, glTF escrito à mão). Medidas em metros, escala real (para realidade aumentada).
// Eixos: X para a direita da fachada, Y para cima, Z para a rua.
// Uso: node scripts/gerar-maquete.mjs   e depois   npx @gltf-transform/cli optimize assets/3d/residencial-04-bruto.glb assets/3d/residencial-04.glb --texture-compress webp --texture-size 512
// A forma da casa segue as perspectivas do projeto (assets/residencial4.webp, 4.1 e 4.2). Nada de cômodos internos.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { ROOT } from "./lib.mjs";

/* ---------- PNG e ruído ---------- */
const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
function png(w, h, px /* (x,y) => [r,g,b] 0..255 */) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b] = px(x, y);
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = Math.max(0, Math.min(255, r));
      raw[o + 1] = Math.max(0, Math.min(255, g));
      raw[o + 2] = Math.max(0, Math.min(255, b));
    }
  }
  const chunk = (tipo, dados) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(dados.length);
    const td = Buffer.concat([Buffer.from(tipo), dados]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
// ruído determinístico e periódico (para a textura repetir sem emenda)
let semente = 7;
const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
function ruido(n) {
  const g = Array.from({ length: n * n }, rnd);
  const at = (i, j) => g[((j % n) + n) % n * n + (((i % n) + n) % n)];
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * sx;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * sx;
    return a + (b - a) * sy;
  };
}
const fbm = (ns, x, y) => ns.reduce((s, n, k) => s + n(x * 2 ** k, y * 2 ** k) / 2 ** (k + 1), 0);
const S = 512;
const oct = (base) => [ruido(base), ruido(base * 2), ruido(base * 4)];

// pedra: filetes horizontais de pedra natural (como o revestimento do render), 1 m de altura por textura
function texPedra() {
  const n = oct(16), m = ruido(32);
  const fiadas = [];
  for (let y = 0; y < S; ) {
    const h = 18 + Math.floor(rnd() * 22);
    fiadas.push([y, h, 0.75 + rnd() * 0.5]);
    y += h;
  }
  return png(S, S, (x, y) => {
    const f = fiadas.find(([y0, h]) => y >= y0 && y < y0 + h) || fiadas[fiadas.length - 1];
    const borda = y - f[0] < 2 ? 0.55 : 1;
    const seg = Math.floor((x + f[0] * 7) / (60 + (f[0] % 50))) % 2 ? 0.92 : 1;
    const v = (78 + 52 * fbm(n, (x / S) * 16, (y / S) * 16) + 18 * m((x / S) * 32, (y / S) * 32)) * f[2] * borda * seg;
    return [v, v, v * 1.04];
  });
}
// concreto com juntas a cada 1 m (textura = 2 m)
function texConcreto() {
  const n = oct(8);
  return png(S, S, (x, y) => {
    const junta = x % 256 < 2 || y % 256 < 2;
    const v = 168 + 34 * fbm(n, (x / S) * 8, (y / S) * 8) - (junta ? 46 : 0);
    return [v, v * 0.99, v * 0.96];
  });
}
function texGrama() {
  const n = oct(16), fino = ruido(128);
  return png(S, S, (x, y) => {
    const a = fbm(n, (x / S) * 16, (y / S) * 16), b = fino((x / S) * 128, (y / S) * 128);
    return [74 + 28 * a + 18 * b, 104 + 34 * a + 20 * b, 62 + 16 * a];
  });
}
function texAsfalto() {
  const fino = ruido(128), n = oct(8);
  return png(S, S, (x, y) => {
    const v = 62 + 16 * fbm(n, (x / S) * 8, (y / S) * 8) + 18 * fino((x / S) * 128, (y / S) * 128);
    return [v, v, v * 1.03];
  });
}
// base de madeira clara (veio no sentido X)
function texMadeira() {
  const n = ruido(8), m = ruido(64);
  return png(S, S, (x, y) => {
    const veio = Math.sin(((y / S) * 40 + 3 * n((x / S) * 8, (y / S) * 8)) * Math.PI) * 0.5 + 0.5;
    const v = 0.82 + 0.1 * veio + 0.05 * m((x / S) * 64, (y / S) * 8);
    return [222 * v, 196 * v, 158 * v];
  });
}
// ambiente de estúdio: gradiente claro + duas fontes de luz suaves (softbox) e piso neutro
function texEstudio() {
  const W = 256, H = 128;
  // luz principal alta à esquerda-frente, preenchimento fraco à direita, horizonte médio e piso escuro
  const luzes = [[0.3, 0.22, 0.07, 1.4], [0.78, 0.36, 0.1, 0.3]];
  return png(W, H, (x, y) => {
    const u = x / W, v = y / H;
    let c = v < 0.5 ? 185 + 50 * (0.5 - v) : 130 - 60 * (v - 0.5);
    for (const [lu, lv, r, k] of luzes) {
      const du = Math.min(Math.abs(u - lu), 1 - Math.abs(u - lu)), dv = v - lv;
      c += 255 * k * Math.exp(-(du * du + dv * dv) / (2 * r * r));
    }
    return [c, c, c * 1.02];
  });
}

/* ---------- geometria ---------- */
const MAT = {
  branco: { cor: [0.94, 0.94, 0.93], rug: 0.78 },
  cinza: { cor: [0.47, 0.46, 0.45], rug: 0.88 },
  pedra: { cor: [1, 1, 1], rug: 0.9, tex: "pedra", tile: 1.0 },
  vidro: { cor: [0.55, 0.66, 0.74], rug: 0.06, metal: 0.35 },
  caixilho: { cor: [0.96, 0.96, 0.96], rug: 0.5 },
  concreto: { cor: [1, 1, 1], rug: 0.92, tex: "concreto", tile: 2.0 },
  grama: { cor: [1, 1, 1], rug: 1, tex: "grama", tile: 3.0 },
  asfalto: { cor: [1, 1, 1], rug: 0.95, tex: "asfalto", tile: 3.0 },
  meiofio: { cor: [0.8, 0.8, 0.78], rug: 0.9 },
  muro: { cor: [0.36, 0.36, 0.37], rug: 0.92 },
  base: { cor: [1, 1, 1], rug: 0.7, tex: "madeira", tile: 6.0 },
  baseBorda: { cor: [0.78, 0.68, 0.53], rug: 0.7 },
  folha: { cor: [0.26, 0.42, 0.2], rug: 0.95 },
  tronco: { cor: [0.36, 0.27, 0.19], rug: 0.95 },
  metal: { cor: [0.15, 0.15, 0.16], rug: 0.35, metal: 0.8 },
  luz: { cor: [1, 0.93, 0.8], rug: 0.4, emissivo: [1, 0.85, 0.6] },
};
const geo = Object.fromEntries(Object.keys(MAT).map((k) => [k, { pos: [], nor: [], uv: [], idx: [] }]));

function quad(m, vs, n) {
  const g = geo[m], t = MAT[m].tile || 1, b = g.pos.length / 3;
  // projeção UV pelo eixo dominante da normal, em metros / tamanho da textura
  const ax = Math.abs(n[0]) > 0.5 ? [2, 1] : Math.abs(n[1]) > 0.5 ? [0, 2] : [0, 1];
  for (const v of vs) {
    g.pos.push(...v);
    g.nor.push(...n);
    g.uv.push(v[ax[0]] / t, -v[ax[1]] / t);
  }
  g.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
}
function box(m, x0, x1, y0, y1, z0, z1) {
  quad(m, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0]);
  quad(m, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]);
  quad(m, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0]);
  quad(m, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]);
  quad(m, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]);
  quad(m, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1]);
}
// placa com cantos arredondados (base da maquete)
function placaArredondada(mTopo, mBorda, x0, x1, z0, z1, y0, y1, r, seg = 6) {
  const pts = [];
  const cantos = [[x1 - r, z1 - r, 0], [x1 - r, z0 + r, -90], [x0 + r, z0 + r, 180], [x0 + r, z1 - r, 90]];
  for (const [cx, cz, a0] of cantos)
    for (let i = 0; i <= seg; i++) {
      const a = ((a0 - (90 * i) / seg) * Math.PI) / 180;
      pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
    }
  const g = geo[mTopo], t = MAT[mTopo].tile || 1, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const c = g.pos.length / 3;
  g.pos.push(cx, y1, cz), g.nor.push(0, 1, 0), g.uv.push(cx / t, -cz / t);
  for (const [x, z] of pts) g.pos.push(x, y1, z), g.nor.push(0, 1, 0), g.uv.push(x / t, -z / t);
  for (let i = 0; i < pts.length; i++) g.idx.push(c, c + 1 + ((i + 1) % pts.length), c + 1 + i);
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
    const nx = bz - az, nz = -(bx - ax), l = Math.hypot(nx, nz);
    quad(mBorda, [[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az]].reverse(), [-nx / l, 0, -nz / l]);
  }
}
// esfera de poucos polígonos (arbustos e copa da árvore)
function esfera(m, cx, cy, cz, rx, ry, rz, aneis = 6, setores = 9) {
  const g = geo[m], b = g.pos.length / 3;
  for (let i = 0; i <= aneis; i++) {
    const th = (Math.PI * i) / aneis;
    for (let j = 0; j <= setores; j++) {
      const ph = (2 * Math.PI * j) / setores;
      const nx = Math.sin(th) * Math.cos(ph), ny = Math.cos(th), nz = Math.sin(th) * Math.sin(ph);
      const w = 1 + 0.12 * Math.sin(3 * ph + i); // leve irregularidade
      g.pos.push(cx + rx * nx * w, cy + ry * ny, cz + rz * nz * w), g.nor.push(nx, ny, nz), g.uv.push(j / setores, i / aneis);
    }
  }
  for (let i = 0; i < aneis; i++)
    for (let j = 0; j < setores; j++) {
      const a = b + i * (setores + 1) + j, c = a + setores + 1;
      g.idx.push(a, a + 1, c, a + 1, c + 1, c);
    }
}

/* ---------- a cena ---------- */
// Base de maquete: placa de madeira clara com cantos arredondados, 15 x 22 m, 0,35 m de espessura
placaArredondada("base", "baseBorda", -8, 8, -15, 8.6, -0.4, -0.05, 0.6);
// rua e meio-fio na frente
box("asfalto", -7.6, 7.6, -0.05, 0.0, 6.4, 8.2);
box("meiofio", -7.6, 7.6, -0.05, 0.14, 6.2, 6.4);
// calçada e piso da garagem (concreto com juntas)
box("concreto", -7.6, 7.6, -0.05, 0.12, 4.6, 6.2);
box("concreto", -6.0, 0.7, -0.05, 0.1, -6.0, 4.6);
box("concreto", 0.7, 2.4, -0.05, 0.1, 0.6, 4.6); // acesso à porta
// grama do lote (frente direita, laterais e fundos)
box("grama", 2.4, 7.0, -0.05, 0.06, 1.4, 4.6);
box("grama", -7.0, 7.0, -0.05, 0.06, -14.2, -6.0);
box("grama", 7.4, 7.6, -0.05, 0.06, -14.2, 4.6);
box("grama", 2.4, 7.0, -0.05, 0.06, -12.0, 1.4);
box("grama", -7.0, -6.0, -0.05, 0.06, -6.0, 4.6);
// muros baixos (0,9 m) nas laterais e nos fundos, para não esconder a casa
box("muro", -7.6, -7.4, 0, 0.9, -14.4, 4.6);
box("muro", 7.4, 7.6, 0, 0.9, -14.4, 4.6);
box("muro", -7.6, 7.6, 0, 0.9, -14.6, -14.4);

/* Corpo principal (cinza) com platibanda branca */
const H = 3.0;
box("cinza", -3.4, 2.4, 0.1, H, -12, 0.6);
box("branco", -3.55, 2.45, H, H + 0.4, -12.15, 0.75); // platibanda (espessura visível)

/* Garagem coberta: marquise branca com espessura e pilar/parede branca à esquerda */
box("branco", -6.1, 1.25, H - 0.1, H + 0.42, -1.0, 2.5);
box("branco", -6.1, -5.45, 0.1, H - 0.1, -6.0, 2.5);
box("cinza", -5.45, -3.4, 0.1, H - 0.1, -6.2, -5.9); // fundo da garagem
box("branco", -6.1, -3.4, H - 0.1, H + 0.42, -6.2, -1.0); // cobertura da garagem

/* Pilar de pedra entre a garagem e a porta (estreito na frente, profundo na lateral) */
box("pedra", 0.72, 1.06, 0.1, H - 0.1, 0.6, 2.25);

/* Janela da fachada: requadro branco, vidro, montante central e peitoril */
box("caixilho", -2.95, -1.25, 0.95, 2.3, 0.6, 0.7);
box("vidro", -2.83, -1.37, 1.07, 2.18, 0.62, 0.72);
box("caixilho", -2.13, -2.07, 1.07, 2.18, 0.62, 0.74);
box("caixilho", -3.0, -1.2, 0.9, 0.97, 0.6, 0.78);

/* Porta clara com batente e maçaneta */
box("caixilho", 1.25, 2.25, 0.1, 2.35, 0.6, 0.66);
box("branco", 1.32, 2.18, 0.1, 2.28, 0.62, 0.7);
box("metal", 2.02, 2.08, 1.0, 1.3, 0.7, 0.75);

/* Volume alto à direita: laje e moldura brancas, painel cinza, duas faixas de vidro com ripado e requadro */
const HA = 3.9;
box("branco", 2.4, 7.4, HA - 0.42, HA, -12, 1.4);
box("branco", 6.8, 7.4, 0.1, HA - 0.42, 0.25, 1.4);
box("cinza", 2.4, 7.3, 0.1, HA - 0.42, -12, 0.9);
for (const x0 of [2.75, 5.65]) {
  const x1 = x0 + 0.72;
  box("vidro", x0, x1, 0.15, HA - 0.5, 0.88, 0.98);
  box("caixilho", x0 - 0.06, x0, 0.12, HA - 0.47, 0.88, 1.04);
  box("caixilho", x1, x1 + 0.06, 0.12, HA - 0.47, 0.88, 1.04);
  for (let y = 0.65; y < HA - 0.6; y += 0.62) box("caixilho", x0, x1, y, y + 0.05, 0.94, 1.04);
}
/* Luminária de parede entre as faixas de vidro */
box("metal", 5.12, 5.3, 1.95, 2.35, 0.9, 1.0);
box("luz", 5.14, 5.28, 1.98, 2.32, 1.0, 1.02);

/* Bloco de pedra sobre a cobertura (caixa d'água revestida) */
box("pedra", -2.9, 0.4, H + 0.4, H + 1.45, -4.5, -2.0);

/* Janelas laterais (perspectiva 4.1) e dos fundos (4.2), com requadro */
for (const [z0, z1] of [[-3.6, -2.0], [-7.2, -5.6]]) {
  box("caixilho", 7.3, 7.38, 0.95, 2.3, z0 - 0.08, z1 + 0.08);
  box("vidro", 7.32, 7.4, 1.05, 2.2, z0, z1);
}
for (const [x0, x1] of [[-2.8, -1.3], [0.2, 1.7], [3.4, 4.6], [5.2, 5.7], [6.0, 6.5]]) {
  box("caixilho", x0 - 0.08, x1 + 0.08, 0.95, 2.3, -12.08, -12.0);
  box("vidro", x0, x1, 1.05, 2.2, -12.1, -12.02);
}

/* Vegetação simples: árvore à esquerda (como no render) e arbustos baixos no jardim da frente */
box("tronco", -6.85, -6.65, 0.06, 1.9, 3.5, 3.7);
esfera("folha", -6.75, 2.6, 3.6, 1.0, 0.95, 1.0);
for (const [x, z, r] of [[3.0, 4.1, 0.38], [4.0, 4.2, 0.32], [6.3, 4.1, 0.4], [6.6, 2.2, 0.34]]) esfera("folha", x, 0.06 + r * 0.7, z, r, r * 0.75, r, 5, 8);

/* ---------- glTF binário ---------- */
const TEX = { pedra: texPedra(), concreto: texConcreto(), grama: texGrama(), asfalto: texAsfalto(), madeira: texMadeira() };
const gltf = {
  asset: { version: "2.0", generator: "DCS gerar-maquete.mjs v2" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: "Residencial 04", children: [] }],
  meshes: [], materials: [], textures: [], images: [], samplers: [{ wrapS: 10497, wrapT: 10497, magFilter: 9729, minFilter: 9987 }],
  accessors: [], bufferViews: [], buffers: [],
};
const partes = [];
let off = 0;
const addView = (buf, target) => {
  const pad = (4 - (buf.length % 4)) % 4;
  gltf.bufferViews.push({ buffer: 0, byteOffset: off, byteLength: buf.length, ...(target ? { target } : {}) });
  partes.push(buf, Buffer.alloc(pad));
  off += buf.length + pad;
  return gltf.bufferViews.length - 1;
};
const B = (a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength);
const texIndex = {};
for (const [nome, dados] of Object.entries(TEX)) {
  gltf.images.push({ name: nome, mimeType: "image/png", bufferView: addView(dados) });
  gltf.textures.push({ sampler: 0, source: gltf.images.length - 1 });
  texIndex[nome] = gltf.textures.length - 1;
}
for (const [nome, g] of Object.entries(geo)) {
  if (!g.idx.length) continue;
  const pos = new Float32Array(g.pos), nor = new Float32Array(g.nor), uv = new Float32Array(g.uv);
  const idx = g.pos.length / 3 > 65535 ? new Uint32Array(g.idx) : new Uint16Array(g.idx);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) (min[k] = Math.min(min[k], pos[i + k])), (max[k] = Math.max(max[k], pos[i + k]));
  const a = gltf.accessors.length;
  gltf.accessors.push(
    { bufferView: addView(B(pos), 34962), componentType: 5126, count: pos.length / 3, type: "VEC3", min, max },
    { bufferView: addView(B(nor), 34962), componentType: 5126, count: nor.length / 3, type: "VEC3" },
    { bufferView: addView(B(uv), 34962), componentType: 5126, count: uv.length / 2, type: "VEC2" },
    { bufferView: addView(B(idx), 34963), componentType: idx instanceof Uint32Array ? 5125 : 5123, count: idx.length, type: "SCALAR" }
  );
  const M = MAT[nome];
  const mat = { name: nome, pbrMetallicRoughness: { baseColorFactor: [...M.cor, 1], metallicFactor: M.metal || 0, roughnessFactor: M.rug } };
  if (M.tex) mat.pbrMetallicRoughness.baseColorTexture = { index: texIndex[M.tex] };
  if (M.emissivo) mat.emissiveFactor = M.emissivo;
  gltf.materials.push(mat);
  gltf.meshes.push({ name: nome, primitives: [{ attributes: { POSITION: a, NORMAL: a + 1, TEXCOORD_0: a + 2 }, indices: a + 3, material: gltf.materials.length - 1 }] });
  gltf.nodes.push({ name: nome, mesh: gltf.meshes.length - 1 });
  gltf.nodes[0].children.push(gltf.nodes.length - 1);
}
const bin = Buffer.concat(partes);
gltf.buffers.push({ byteLength: bin.length });
let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
const ch = (len, tipo) => {
  const b = Buffer.alloc(8);
  b.writeUInt32LE(len, 0);
  b.writeUInt32LE(tipo, 4);
  return b;
};
const glb = Buffer.concat([header, ch(json.length, 0x4e4f534a), json, ch(bin.length, 0x004e4942), bin]);
const dir = path.join(ROOT, "assets/3d");
fs.writeFileSync(path.join(dir, "residencial-04-bruto.glb"), glb);
fs.writeFileSync(path.join(dir, "estudio.png"), texEstudio());
console.log(`residencial-04-bruto.glb: ${(glb.length / 1024).toFixed(0)} KB · estudio.png: ${(fs.statSync(path.join(dir, "estudio.png")).size / 1024).toFixed(1)} KB`);
console.log("Agora: npx @gltf-transform/cli optimize assets/3d/residencial-04-bruto.glb assets/3d/residencial-04.glb --texture-compress webp --texture-size 512 && rm assets/3d/residencial-04-bruto.glb");
