# Maquete 3D v2 do Residencial 04: medições e portão de qualidade

Não há arquivo 3D original (`_originais/3d/` não existe). Por isso esta é a opção 2: maquete gerada por `scripts/gerar-maquete.mjs`, refeita no estilo maquete de mesa.

## O que mudou da v1 para a v2
- **Base:** placa de madeira clara com cantos arredondados, calçada de concreto com juntas, meio-fio e trecho de rua em asfalto. Os muros laterais são baixos (0,9 m).
- **Texturas procedurais em PNG** (512×512, geradas em Node com zlib e convertidas para WebP pelo gltf-transform): pedra em filetes, concreto com juntas, grama, asfalto e madeira.
- **Detalhes que aparecem nas perspectivas:**
  - requadro e montante da janela;
  - porta com batente e maçaneta;
  - ripado e requadro das duas faixas de vidro;
  - luminária de parede (emissiva);
  - platibanda e lajes com espessura, e cobertura da garagem;
  - pilar de pedra;
  - árvore à esquerda e arbustos baixos.
- **Iluminação:** ambiente de estúdio próprio (`assets/3d/estudio.png`, 256×128, com luz principal e preenchimento), exposição 0,9, sombra 1 / 0,8 e tone mapping neutro.
- **Câmera:** começa em 3/4 frontal (`-25deg 74deg`), com zoom limitado e um giro lento de cerca de 3 s, desligado com movimento reduzido.
- **Rótulos (hotspots):** só "Garagem coberta" e "Área externa com muro".

## Pesos e rede
- `residencial-04.glb`: cerca de 113 KB com as texturas (limite pedido: 600 KB).
- `estudio.png`: 7,9 KB.
- `model-viewer.min.js`: 979 KB sem compressão, cerca de 260 KB com gzip/brotli.
- Pedidos a outro domínio: **nenhum**. As texturas aparecem como `blob:` do próprio visualizador.
- Erros de console: nenhum.
- Antes do clique: nenhum pedido de 3D.

## Lighthouse mobile de `/projetos/residencial-4/` antes do clique (3 rodadas cada)
| | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | Peso |
|---|---|---|---|---|---|---|
| `main` | 94 / 99 / 98 | 100 | 100 | 100 | 2,1 a 2,2 s | 205 KB |
| `maquete-3d-v2` | 99 / 99 / 99 | 100 | 100 | 100 | 2,1 s | 188 KB |

Não piora.

## Portão de qualidade
Capturas:
- `3d-v2-inicial.png` (vista inicial em 1440 px)
- `3d-v2-frente.png`, `3d-v2-lateral.png`, `3d-v2-aerea.png`, `3d-v2-mobile.png`, `3d-v2-hotspots.png`
- `3d-v2-lado-a-lado.png` (frente × `residencial4.webp`, no mesmo ângulo)

**As 3 rodadas:**
1. Montagem da cena v2.
2. Câmera mais próxima e pedra mais clara.
3. Cobertura da garagem, grama menos saturada e ajuste do ambiente de luz.

**Avaliação:** bem acima da v1. Tem material, base, rua, detalhes de caixilho e porta, e a casa é a mesma da perspectiva. **Mas não atinge o critério "parece trabalho profissional":**
- os brancos (lajes e moldura) saem acinzentados e com pouco contraste entre as faces, porque falta oclusão de ambiente e uma luz direcional real;
- a vegetação é de poucos polígonos e parece de brinquedo;
- as superfícies são planas demais perto do render;
- vista de frente, a maquete parece um modelo técnico, não uma maquete de apresentação.

**O que falta para passar:**
1. **De preferência, o arquivo original do projeto** (SketchUp, Revit etc.), exportado em GLB. A seção já está pronta para receber.
2. **Sem o arquivo:** assar iluminação (lightmap com oclusão de ambiente) num software 3D, como o Blender, e usar vegetação modelada. Isso já sai do que um script em Node puro faz bem.

Por isso o PR fica em **rascunho**. O João decide.
