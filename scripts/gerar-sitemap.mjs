// Gera sitemap.xml com as páginas indexáveis (sem 404 e sem noindex).
// lastmod = data do último commit do arquivo (ou hoje, se o arquivo tem mudança ainda não commitada).
// Uso: node scripts/gerar-sitemap.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, listarHtml, rel } from "./lib.mjs";

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
const hoje = new Date().toISOString().slice(0, 10);
const urls = [];
for (const arq of listarHtml()) {
  const html = fs.readFileSync(arq, "utf8");
  if (/name="robots" content="[^"]*noindex/.test(html)) continue;
  const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!canon) continue;
  const r = rel(arq);
  let data = "";
  try {
    data = git("status", "--porcelain", "--", r) ? hoje : git("log", "-1", "--format=%cs", "--", r);
  } catch {}
  urls.push(`  <url>\n    <loc>${canon}</loc>\n    <lastmod>${data || hoje}</lastmod>\n  </url>`);
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
console.log(`sitemap.xml: ${urls.length} URLs`);
