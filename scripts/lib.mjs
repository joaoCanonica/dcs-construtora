// Utilitários comuns dos scripts do site (Node puro, sem dependências)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IGNORAR = new Set([".git", "node_modules", "_originais", "docs", "scripts"]);

export function listarHtml(dir = ROOT) {
  const out = [];
  for (const nome of fs.readdirSync(dir)) {
    if (IGNORAR.has(nome)) continue;
    const p = path.join(dir, nome);
    if (fs.statSync(p).isDirectory()) out.push(...listarHtml(p));
    else if (nome.endsWith(".html")) out.push(p);
  }
  return out.sort();
}

export const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
