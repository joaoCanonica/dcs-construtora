// QA de layout e interação no navegador (Playwright). Sobe um servidor local próprio.
// Uso: node scripts/qa-layout.mjs [--capturas docs/qa/correcoes]
// Requer o Playwright instalado fora do repositório (global ou via NODE_PATH); nada entra no package.json.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { ROOT } from "./lib.mjs";

async function carregarPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const raizGlobal = process.env.NODE_PATH || "/opt/node22/lib/node_modules/";
    return createRequire(path.join(raizGlobal, "x.js"))("playwright");
  }
}
const { chromium } = await carregarPlaywright();

const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".glb": "model/gltf-binary", ".xml": "application/xml", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const arq = path.join(ROOT, p);
  if (!arq.startsWith(ROOT) || !fs.existsSync(arq)) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    return res.end(fs.readFileSync(path.join(ROOT, "404.html")));
  }
  res.writeHead(200, { "content-type": TIPOS[path.extname(arq)] || "application/octet-stream" });
  fs.createReadStream(arq).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const iCap = process.argv.indexOf("--capturas");
const CAP = iCap > -1 ? path.resolve(process.argv[iCap + 1]) : null;
if (CAP) fs.mkdirSync(CAP, { recursive: true });

const falhas = [];
const ok = (cond, msg) => {
  console.log(`${cond ? "ok  " : "FALHA"} ${msg}`);
  if (!cond) falhas.push(msg);
};
const MAPA_FALSO = `<!doctype html><title>mapa simulado</title><body style="margin:0;background:repeating-linear-gradient(45deg,#cde 0 20px,#bcd 20px 40px);font:20px sans-serif;display:grid;place-items:center;height:100vh">Mapa simulado (teste)</body>`;

const browser = await chromium.launch();
const LARGURAS = [1440, 1024, 768, 390];

/* 1. Mapa ocupa o quadro inteiro depois do clique */
for (const w of LARGURAS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  await ctx.route(/google\.com\/maps/, (r) => r.fulfill({ contentType: "text/html", body: MAPA_FALSO }));
  const p = await ctx.newPage();
  await p.goto(BASE + "contato/");
  await p.click("[data-load-map]");
  await p.waitForSelector(".map iframe");
  await p.waitForTimeout(400);
  const m = await p.evaluate(() => {
    const map = document.querySelector(".map"), f = map.querySelector("iframe");
    return { mw: map.offsetWidth, mh: map.offsetHeight, fw: f.offsetWidth, fh: f.offsetHeight, allow: f.allow, ref: f.getAttribute("referrerpolicy") };
  });
  ok(m.fw === m.mw && m.fh === m.mh && m.mw > 200, `mapa ${w}px: iframe ${m.fw}x${m.fh} = quadro ${m.mw}x${m.mh} (allow=${m.allow}, referrerpolicy=${m.ref})`);
  if (CAP) await p.locator(".map").screenshot({ path: path.join(CAP, `mapa-${w}.png`) });
  await ctx.close();
}

/* 2. Carrossel */
const ativo = (p) => p.evaluate(() => [...document.querySelectorAll(".slide")].findIndex((s) => s.classList.contains("is-active")));
async function home(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.w || 1440, height: 900 }, reducedMotion: opts.rm ? "reduce" : "no-preference", hasTouch: !!opts.touch, isMobile: !!opts.touch });
  const p = await ctx.newPage();
  await p.goto(BASE);
  return { ctx, p };
}
{
  const { ctx, p } = await home();
  const a = await ativo(p);
  await p.waitForTimeout(7000);
  ok((await ativo(p)) !== a, "carrossel (a): sem reduced-motion, troca sozinho em até 7 s");
  await ctx.close();
}
{
  const { ctx, p } = await home();
  await p.mouse.move(1100, 400); // mouse parado em cima da imagem
  const sobre = await p.evaluate(() => document.elementFromPoint(1100, 400)?.closest(".slideshow") !== null);
  const a = await ativo(p);
  await p.waitForTimeout(7000);
  ok(sobre && (await ativo(p)) !== a, "carrossel (b): com o mouse parado em cima, continua trocando");
  await ctx.close();
}
{
  const { ctx, p } = await home({ rm: true });
  const a = await ativo(p);
  await p.waitForTimeout(7000);
  const parado = (await ativo(p)) === a;
  const rotulo = await p.getAttribute(".slideshow__toggle", "aria-label");
  await p.click(".slideshow__arrow--next");
  const depois = await ativo(p);
  const trans = await p.evaluate(() => getComputedStyle(document.querySelector(".slide")).transitionDuration);
  ok(parado && depois === (a + 1) % 4 && rotulo === "Reproduzir carrossel", `carrossel (c): reduced-motion não troca sozinho; seta troca; botão diz "${rotulo}"; transição ${trans}`);
  await p.click(".slideshow__arrow--prev");
  ok((await ativo(p)) === a, "carrossel (c): seta anterior volta");
  await ctx.close();
}
{
  const { ctx, p } = await home({ w: 390, touch: true, rm: true });
  const a = await ativo(p);
  const box = await p.locator(".slideshow__frame").boundingBox();
  const y = box.y + box.height / 2;
  await p.evaluate(({ x0, x1, y }) => {
    const el = document.querySelector(".slideshow__frame");
    const t = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
    el.dispatchEvent(new TouchEvent("touchstart", { touches: [t(x0)], changedTouches: [t(x0)], bubbles: true }));
    el.dispatchEvent(new TouchEvent("touchend", { touches: [], changedTouches: [t(x1)], bubbles: true }));
  }, { x0: box.x + box.width - 40, x1: box.x + 60, y });
  ok((await ativo(p)) === (a + 1) % 4, "carrossel (d): swipe para a esquerda avança");
  await ctx.close();
}
{
  const { ctx, p } = await home({ rm: true });
  const a = await ativo(p);
  await p.focus(".slideshow__dots button");
  await p.keyboard.press("ArrowRight");
  ok((await ativo(p)) === (a + 1) % 4, "carrossel (e): seta → do teclado avança");
  await p.keyboard.press("ArrowLeft");
  ok((await ativo(p)) === a, "carrossel (e): seta ← do teclado volta");
  await ctx.close();
}
for (const w of [390, 360]) {
  const { ctx, p } = await home({ w, rm: true });
  await p.locator(".slideshow").scrollIntoViewIfNeeded();
  const r = await p.evaluate(() => {
    const rect = (s) => document.querySelector(s).getBoundingClientRect();
    const cruza = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const setas = [rect(".slideshow__arrow--prev"), rect(".slideshow__arrow--next")];
    const outros = { legenda: rect(".slideshow__caption"), pontinhos: rect(".slideshow__dots"), pausa: rect(".slideshow__toggle"), whatsapp: rect(".wa-float") };
    const bate = [];
    for (const s of setas) for (const [n, o] of Object.entries(outros)) if (cruza(s, o)) bate.push(n);
    return { bate, w: setas.map((s) => Math.round(s.width) + "x" + Math.round(s.height)) };
  });
  ok(!r.bate.length, `carrossel (f) ${w}px: setas ${r.w.join(", ")} sem sobrepor legenda, pontinhos, pausa ou WhatsApp${r.bate.length ? " (bate em " + r.bate.join(", ") + ")" : ""}`);
  if (CAP) await p.locator(".slideshow").screenshot({ path: path.join(CAP, `carrossel-${w}.png`) });
  await ctx.close();
}
{
  // imagens dos slides 2 a 4 já baixadas antes de aparecer
  const { ctx, p } = await home();
  await p.waitForTimeout(2500);
  const prontas = await p.evaluate(() => [...document.querySelectorAll(".slide img")].map((i) => i.complete && i.naturalWidth > 0));
  ok(prontas.every(Boolean), `carrossel: imagens pré-carregadas ${JSON.stringify(prontas)}`);
  if (CAP) await p.locator(".slideshow").screenshot({ path: path.join(CAP, "carrossel-1440.png") });
  await ctx.close();
}

/* 3. Alvos de toque e WhatsApp flutuante */
const PAGINAS = ["", "projetos/", "projetos/residencial-1/", "projetos/residencial-4/", "como-construimos/", "a-dcs/", "contato/", "privacidade/"];
for (const w of [390, 360]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 760 }, reducedMotion: "reduce" });
  for (const pg of PAGINAS) {
    const p = await ctx.newPage();
    await p.goto(BASE + pg);
    const r = await p.evaluate(() => {
      const pequenos = [];
      const sel = "main a, main button, .site-footer a, .breadcrumb a, .slideshow__dots button";
      document.querySelectorAll(sel).forEach((el) => {
        const b = el.getBoundingClientRect();
        if (!b.width || el.closest("p:not(.contact-info p)") && !el.closest(".contact-info")) return; // links dentro de texto corrido ficam de fora (WCAG 2.5.8)
        let h = b.height;
        for (const pse of ["::before", "::after"]) {
          const s = getComputedStyle(el, pse);
          if (s.content !== "none" && s.position === "absolute") h = Math.max(h, parseFloat(s.height) || 0);
        }
        if (h < 43.5) pequenos.push(`${(el.textContent.trim() || el.getAttribute("aria-label") || "").slice(0, 24)} (${Math.round(h)}px)`);
      });
      const fl = document.querySelector(".wa-float");
      const cobertos = [];
      if (fl) {
        const els = [...document.querySelectorAll("main a, main button, main input, main select, main textarea, .site-footer a")].filter((e) => e.offsetParent);
        for (const el of els) {
          for (const modo of ["centro", "fim"]) {
            if (modo === "centro") el.scrollIntoView({ block: "center" });
            else window.scrollTo(0, document.documentElement.scrollHeight);
            const r = el.getBoundingClientRect();
            const y = r.top + r.height / 2;
            if (y < 0 || y > innerHeight) continue;
            const hit = document.elementFromPoint(r.left + r.width / 2, y);
            if (hit && fl.contains(hit)) cobertos.push(modo + ":" + (el.textContent.trim() || el.name).slice(0, 24));
          }
        }
      }
      return { pequenos, cobertos: [...new Set(cobertos)], temFloat: !!fl };
    });
    ok(!r.pequenos.length, `alvos ${w}px /${pg}: ${r.pequenos.length ? r.pequenos.join("; ") : "todos ≥ 44 px"}`);
    if (pg === "contato/") ok(!r.temFloat, `WhatsApp flutuante escondido em /contato/ (${w}px)`);
    else ok(!r.cobertos.length, `WhatsApp flutuante ${w}px /${pg}: ${r.cobertos.length ? "cobre " + r.cobertos.join(" | ") : "não cobre nada"}`);
    if (pg === "contato/" && w === 390) {
      const hor = await p.evaluate(() => [...document.querySelectorAll(".hours .nowrap")].map((s) => s.getClientRects().length));
      ok(hor.every((n) => n === 1), `horário 390px: cada intervalo numa linha só (${JSON.stringify(hor)})`);
      if (CAP) await p.locator(".hours").screenshot({ path: path.join(CAP, "horario-390.png") });
    }
    await p.close();
  }
  await ctx.close();
}

/* 4. Lightbox: contador 1 / N sem duplicar a capa */
const ctxL = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
for (let n = 1; n <= 7; n++) {
  const p = await ctxL.newPage();
  await p.goto(BASE + `projetos/residencial-${n}/`);
  const unicas = await p.evaluate(() => new Set([...document.querySelectorAll("[data-lightbox]")].map((b) => b.dataset.lightbox)).size);
  await p.click(".project-cover");
  const cont = (await p.textContent(".lightbox__count")).replace(/\s/g, "");
  ok(cont === `01/${String(unicas).padStart(2, "0")}`, `lightbox residencial-${n}: contador "${cont}" para ${unicas} imagens únicas`);
  await p.close();
}
await ctxL.close();

await browser.close();
server.close();
console.log(falhas.length ? `\n${falhas.length} falha(s).` : "\nTudo certo.");
process.exit(falhas.length ? 1 : 0);
