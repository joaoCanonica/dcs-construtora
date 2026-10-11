# DCS Construtora e Incorporadora — site

Site estático: HTML, CSS e JavaScript puros, sem build, sem npm e sem banco de dados.

## Visualizar

- **Direto no navegador:** dê dois cliques em `index.html`. Todos os caminhos são relativos, então CSS, imagens e links funcionam também fora de um servidor.
- **Com servidor local (recomendado):** extensão Live Server do VS Code ou `python3 -m http.server 3000` nesta pasta, depois abra http://localhost:3000.

## Publicar na Vercel

1. Suba o conteúdo desta pasta para a raiz de um repositório no GitHub.
2. Na Vercel, importe o repositório. Framework Preset: **Other**. Build Command: vazio. Output Directory: `.`
3. Deploy. O `vercel.json` já define cache e cabeçalhos de segurança, e o `404.html` é usado automaticamente para páginas inexistentes.

A pasta `_originais/` (imagens originais em PNG) fica de fora do deploy pelo `.vercelignore`.

## Estrutura

```
index.html                 página inicial
projetos/index.html        portfólio com filtros
projetos/residencial-1..7  página de cada projeto, com galeria
como-construimos/          etapas, chave na mão e serviços
a-dcs/                     apresentação da empresa
contato/                   formulário (abre o WhatsApp), endereço, horário e mapa
privacidade/               política de privacidade (LGPD)
404.html                   página não encontrada
style.css                  estilos (cores e medidas em variáveis no :root)
app.js                     menu, carrossel, filtros, galeria, formulário e mapa
assets/                    imagens WebP, logo, ícones e fontes (Manrope e Archivo)
scripts/                   versionar-assets, check-site, gerar-sitemap, definir-dominio (Node puro)
docs/                      pendências, fontes da FAQ, sugestões de texto e capturas de QA
```

## Depois de editar CSS ou JS

`node scripts/versionar-assets.mjs` (atualiza o `?v=` de `style.css` e `app.js` em todas as páginas) e `node scripts/check-site.mjs` (confere SEO, links, imagens, JSON-LD, FAQ, sitemap, versões e contraste).

## Editar

- **Telefone/WhatsApp, endereço e horário** aparecem no cabeçalho, no rodapé e no contato de todas as páginas. Para trocar, use "Localizar e substituir em arquivos" do VS Code (Ctrl+Shift+H), por exemplo em `5549991277677`.
- **Novo projeto:** copie uma pasta `projetos/residencial-N`, troque textos e imagens e adicione o card em `projetos/index.html`. Use WebP de pelo menos 800 px de largura.
- **Cores:** variáveis `--navy`, `--blue` etc. no início do `style.css`.

- **Fonte dos títulos:** variável `--font-display` no `:root` do `style.css` (hoje Archivo; o texto corrido segue em Manrope).
- **Fontes `.woff2` têm cache de 1 ano (`immutable`).** Fonte nova ou alterada precisa sempre de **nome de arquivo novo**; nunca substitua um `.woff2` mantendo o nome.
- **Imagens** têm cache de 1 dia. Para trocar uma foto com efeito imediato, use um nome de arquivo novo.
- **Novo projeto ou página:** depois de criar, rode `node scripts/gerar-sitemap.mjs` e `node scripts/check-site.mjs`.

## Maquete 3D (Residencial 04)

`assets/3d/residencial-04.glb` e `assets/3d/estudio.png` são gerados por `node scripts/gerar-maquete.mjs` e otimizados com `npx @gltf-transform/cli optimize assets/3d/residencial-04-bruto.glb assets/3d/residencial-04.glb --texture-compress webp --texture-size 512` (depois apague o `-bruto.glb`). O visualizador (`assets/3d/model-viewer.min.js`, @google/model-viewer 4.1.0) e o modelo só carregam quando o visitante clica em "Explorar em 3D". Para usar o modelo original do projeto, exporte em GLB, salve no mesmo caminho e rode `node scripts/versionar-assets.mjs`.

## Ao definir o domínio

1. `node scripts/definir-dominio.mjs https://www.dominio-final.com.br` troca a origem em `canonical`, `og:*`, `twitter:*`, JSON-LD, `sitemap.xml`, `robots.txt` e `llms.txt` (links internos continuam relativos).
2. `node scripts/check-site.mjs`.
3. Cadastre o site no Google Search Console, envie o `sitemap.xml` e vincule ao Perfil da Empresa no Google.

Dados que ainda faltam (CNPJ, CREA, CEP etc.) estão em `docs/PENDENCIAS.md`.

## Créditos

Imagens dos Residenciais 02, 06 e 07: M9 Arquitetura (@m9arquitetura).
