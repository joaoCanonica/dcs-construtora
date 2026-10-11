// Checagem estática do site. Falha (exit 1) se encontrar problema.
// Uso: node scripts/check-site.mjs            (opcional: --css caminho.css para medir o contraste de outra folha)
import fs from "node:fs";
import path from "node:path";
import { ROOT, listarHtml, rel } from "./lib.mjs";
import { ASSETS, hashDe } from "./versionar-assets.mjs";

const erros = [];
const avisos = [];
const falha = (arq, msg) => erros.push(`${arq}: ${msg}`);

const decode = (s) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const texto = (html) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const attr = (tag, nome) => {
  const m = tag.match(new RegExp(`\\s${nome}="([^"]*)"`));
  return m ? m[1] : null;
};
const meta = (html, chave) => {
  const m = html.match(new RegExp(`<meta (?:name|property)="${chave}" content="([^"]*)"`));
  return m ? m[1] : null;
};

/* Contraste WCAG */
function lum(hex) {
  const v = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contraste(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
// pares de cores de :root usados como texto sobre fundo (mín.: 4,5 texto normal; 3 texto grande)
const PARES = [
  ["ink", "paper", 4.5], ["text", "paper", 4.5], ["text", "paper-2", 4.5], ["text", "white", 4.5],
  ["muted", "paper", 4.5], ["muted", "paper-2", 4.5], ["muted", "white", 4.5],
  ["blue-dark", "paper", 4.5], ["blue-dark", "paper-2", 4.5], ["blue-dark", "white", 4.5],
  ["white", "blue-dark", 4.5], ["white", "navy", 4.5],
  ["steel-text", "paper", 3], ["steel-text", "paper-2", 3],
];
function checarContraste(cssPath) {
  const css = fs.readFileSync(cssPath, "utf8");
  const raiz = css.match(/:root\s*{([^}]*)}/)[1];
  const tokens = Object.fromEntries([...raiz.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));
  const linhas = [];
  for (const [fg, bg, min] of PARES) {
    if (!tokens[fg] || !tokens[bg]) continue;
    const r = contraste(tokens[fg], tokens[bg]);
    const ok = r >= min;
    linhas.push(`  ${ok ? "ok " : "RUIM"} --${fg} ${tokens[fg]} sobre --${bg} ${tokens[bg]}: ${r.toFixed(2)}:1 (mín. ${min})`);
    if (!ok) falha(rel(cssPath), `contraste --${fg} sobre --${bg} ${r.toFixed(2)}:1 < ${min}`);
  }
  return linhas;
}

const cssArg = process.argv.indexOf("--css");
const relContraste = checarContraste(cssArg > -1 ? path.resolve(process.argv[cssArg + 1]) : path.join(ROOT, "style.css"));

/* CSS e JS íntegros: sem marcas de conflito de merge e com chaves equilibradas no CSS */
for (const a of ["style.css", "app.js"]) {
  const t = fs.readFileSync(path.join(ROOT, a), "utf8");
  if (/^(<{7}|={7}|>{7})( |$)/m.test(t)) falha(a, "marca de conflito de merge (<<<<<<< ======= >>>>>>>)");
}
{
  const css = fs.readFileSync(path.join(ROOT, "style.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/"[^"]*"/g, "");
  let nivel = 0, linha = 1;
  for (const c of css) {
    if (c === "\n") linha++;
    if (c === "{") nivel++;
    if (c === "}" && --nivel < 0) { falha("style.css", `chave } sobrando perto da linha ${linha}`); nivel = 0; }
  }
  if (nivel > 0) falha("style.css", `${nivel} chave(s) { sem fechar (uma @media aberta engole as regras seguintes)`);
}

/* Páginas */
const hashes = Object.fromEntries(ASSETS.map((a) => [a, hashDe(a)]));
const paginas = listarHtml();
let ldCount = 0;
for (const arq of paginas) {
  const r = rel(arq);
  const html = fs.readFileSync(arq, "utf8");
  const indexavel = !/name="robots" content="[^"]*noindex/.test(html);
  const titulo = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const desc = meta(html, "description") || "";

  if (indexavel) {
    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (!canon || !/^https:\/\//.test(canon) || !canon.endsWith("/")) falha(r, `canonical ausente ou inválido (${canon})`);
    if (meta(html, "og:url") !== canon) falha(r, "og:url ausente ou diferente do canonical");
    for (const k of ["og:image", "twitter:image"]) if (!/^https:\/\//.test(meta(html, k) || "")) falha(r, `${k} ausente ou relativo`);
    if (titulo.length > 60) falha(r, `título com ${titulo.length} caracteres (máx. 60)`);
    if (desc.length < 120 || desc.length > 160) falha(r, `descrição com ${desc.length} caracteres (120 a 160)`);
  } else if (/rel="canonical"/.test(html)) falha(r, "página noindex não deve ter canonical");

  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    ldCount++;
    let dados;
    try {
      dados = JSON.parse(m[1]);
    } catch (e) {
      falha(r, `JSON-LD não parseia: ${e.message}`);
      continue;
    }
    const grafo = dados["@graph"] || [dados];
    const faq = grafo.find((n) => n["@type"] === "FAQPage");
    if (faq) {
      const sec = (html.split('id="faq-title"')[1] || "").split("</section>")[0];
      const visivel = [...sec.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((x) => [texto(x[1]), texto(x[2])]);
      const ld = faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
      if (JSON.stringify(visivel) !== JSON.stringify(ld)) falha(r, "FAQ do JSON-LD diferente da FAQ visível");
    }
    if (/"(Review|AggregateRating|priceRange|geo)"/.test(m[1])) falha(r, "JSON-LD com tipo/propriedade proibida (Review, AggregateRating, priceRange, geo)");
  }

  // versões de CSS/JS
  for (const [a, h] of Object.entries(hashes)) {
    const semLd = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
    const refs = [...semLd.matchAll(new RegExp(`${a.replace(".", "\\.")}(\\?v=([^"']*))?["']`, "g"))];
    if (!refs.length) continue;
    for (const ref of refs) if (ref[2] !== h) falha(r, `${a}?v= ausente ou desatualizado (${ref[2] || "sem v"} ≠ ${h}). Rode: node scripts/versionar-assets.mjs`);
  }

  // imagens
  for (const tag of html.match(/<img\b[^>]*>/g) || []) {
    if (!attr(tag, "src")) falha(r, `<img> sem src: ${tag.slice(0, 80)}`);
    if (attr(tag, "alt") === null) falha(r, `<img> sem alt: ${tag.slice(0, 80)}`);
  }

  // links e recursos internos
  for (const m of html.matchAll(/\s(?:href|src|data-lightbox)="([^"]+)"/g)) {
    let u = decode(m[1]);
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(u)) continue;
    u = u.split("#")[0].split("?")[0];
    if (!u) continue;
    let alvo = u.startsWith("/") ? path.join(ROOT, u) : path.resolve(path.dirname(arq), u);
    if (u.endsWith("/")) alvo = path.join(alvo, "index.html");
    if (!fs.existsSync(alvo)) falha(r, `link interno quebrado: ${m[1]}`);
  }

  // travessão longo no texto visível
  const corpo = (html.split("<body")[1] || "").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  if (/—|&mdash;/.test(texto(corpo))) falha(r, "travessão longo (—) no texto visível");

  if ((html.match(/<h1[\s>]/g) || []).length !== 1) falha(r, "precisa ter exatamente 1 <h1>");
}

/* Sitemap */
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const origem = (fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/<link rel="canonical" href="(https:\/\/[^/"]+)\//) || [])[1];
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const loc of locs) {
  if (!loc.startsWith(origem + "/")) falha("sitemap.xml", `URL fora da origem ${origem}: ${loc}`);
  const arq = path.join(ROOT, loc.slice(origem.length), "index.html");
  if (!fs.existsSync(arq)) falha("sitemap.xml", `URL sem arquivo correspondente: ${loc}`);
}
const indexaveis = paginas.filter((p) => !/noindex/.test(fs.readFileSync(p, "utf8")));
if (locs.length !== indexaveis.length) falha("sitemap.xml", `${locs.length} URLs, mas há ${indexaveis.length} páginas indexáveis`);
if (!fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8").includes(`Sitemap: ${origem}/sitemap.xml`)) falha("robots.txt", "sem linha Sitemap com a origem atual");

console.log(`Páginas: ${paginas.length} · JSON-LD: ${ldCount} blocos · sitemap: ${locs.length} URLs · origem: ${origem}`);
console.log("Contraste (tokens de :root):");
console.log(relContraste.join("\n"));
if (avisos.length) console.log("Avisos:\n  " + avisos.join("\n  "));
if (erros.length) {
  console.log(`\n${erros.length} problema(s):\n  ` + erros.join("\n  "));
  process.exit(1);
}
console.log("\nTudo certo.");
