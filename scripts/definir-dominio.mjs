// Troca a origem absoluta do site (canonical, og:*, twitter:*, JSON-LD, sitemap, robots, llms.txt).
// Links internos continuam relativos. Uso: node scripts/definir-dominio.mjs https://www.dominio-final.com.br
import fs from "node:fs";
import path from "node:path";
import { ROOT, listarHtml, rel } from "./lib.mjs";

const nova = (process.argv[2] || "").replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(nova)) {
  console.error("Uso: node scripts/definir-dominio.mjs https://www.dominio-final.com.br");
  process.exit(1);
}
const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const atual = (index.match(/<link rel="canonical" href="(https:\/\/[^/"]+)\//) || [])[1];
if (!atual) {
  console.error("Não achei o canonical em index.html para descobrir a origem atual.");
  process.exit(1);
}
if (atual === nova) {
  console.log(`A origem já é ${nova}. Nada a fazer.`);
  process.exit(0);
}
const alvos = [...listarHtml(), ...["sitemap.xml", "robots.txt", "llms.txt"].map((f) => path.join(ROOT, f))];
for (const arq of alvos) {
  if (!fs.existsSync(arq)) continue;
  const antes = fs.readFileSync(arq, "utf8");
  const depois = antes.split(atual + "/").join(nova + "/").split(`"${atual}"`).join(`"${nova}"`);
  if (depois !== antes) {
    fs.writeFileSync(arq, depois);
    console.log(`atualizado: ${rel(arq)}`);
  }
}
console.log(`Origem: ${atual} -> ${nova}. Rode depois: node scripts/check-site.mjs`);
