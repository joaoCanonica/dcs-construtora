// Atualiza style.css?v=<hash> e app.js?v=<hash> em todos os .html (inclusive 404.html).
// Uso: node scripts/versionar-assets.mjs   (idempotente: rodar de novo sem mudanças não altera nada)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ROOT, listarHtml, rel } from "./lib.mjs";

export const ASSETS = ["style.css", "app.js", "assets/3d/residencial-04.glb", "assets/3d/model-viewer.min.js", "assets/3d/estudio.png"];

export function hashDe(arquivo) {
  return crypto.createHash("sha1").update(fs.readFileSync(path.join(ROOT, arquivo))).digest("hex").slice(0, 8);
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

if (import.meta.url === `file://${process.argv[1]}`) {
  const hashes = Object.fromEntries(ASSETS.map((a) => [a, hashDe(a)]));
  let mudou = 0;
  for (const arq of listarHtml()) {
    const antes = fs.readFileSync(arq, "utf8");
    let depois = antes;
    for (const [a, h] of Object.entries(hashes)) {
      depois = depois.replace(new RegExp(`(${esc(a)})\\?v=[^"']*`, "g"), `$1?v=${h}`);
    }
    if (depois !== antes) {
      fs.writeFileSync(arq, depois);
      mudou++;
      console.log(`atualizado: ${rel(arq)}`);
    }
  }
  console.log(Object.entries(hashes).map(([a, h]) => `${a} -> ${h}`).join("  "));
  console.log(mudou ? `${mudou} arquivo(s) alterado(s).` : "Nada a mudar: versões já estão em dia.");
}
