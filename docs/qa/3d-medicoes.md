# Maquete 3D do Residencial 04: medições e portão de qualidade

## Arquivos
- `assets/3d/residencial-04.glb`: 38,8 KB, 52 volumes, gerado por `node scripts/gerar-maquete.mjs` (sem textura e sem compressão de geometria, então o gltf-transform não é necessário).
- `assets/3d/model-viewer.min.js`: @google/model-viewer 4.1.0 fixado, 979 KB (cerca de 260 KB com gzip/brotli da Vercel), licença Apache-2.0 em `LICENSE-model-viewer.txt`.
- Poster: a própria `assets/residencial4.webp` (já está no cache de quem abriu a página, então não há download duplicado).

## Medições (local, Playwright + Chromium com SwiftShader)
- **Antes do clique:** nenhum pedido de 3D (`model-viewer` e `.glb`). Nenhuma outra página carrega nada de 3D.
- **No clique:** 1.018.851 bytes sem compressão (JS + GLB).
- **Tempo até o modelo carregar, 4G simulado** (latência 150 ms, cerca de 1,6 Mbps): 6,2 s, sem compressão. Na Vercel, com brotli no JS, deve cair para cerca de 2 s.
- **Pedidos a outro domínio:** nenhum (sem Draco/Meshopt; ambiente `neutral` embutido).
- **Erros de console:** nenhum.
- Fechar 3D volta ao poster. As setas do teclado giram o modelo.

## Lighthouse mobile em `/projetos/residencial-4/`, antes do clique (3 rodadas cada)
| | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | Peso |
|---|---|---|---|---|---|---|
| PR 1 (sem 3D) | 92 / 99 / 99 | 100 | 100 | 100 | 2,0 a 2,2 s | 205 KB |
| PR 2 (com 3D) | 99 / 98 / 99 | 100 | 100 | 100 | 2,1 s | 212 KB |

Não piora.

## Portão de qualidade (8.5)
Opção 2 (maquete volumétrica): não há arquivo original. Foram 3 rodadas de ajuste:
1. Volumes e posições.
2. Lateral cinza do volume alto, tom de cinza mais escuro, faixas na pedra.
3. Pilar de pedra e porta.

Capturas: `3d-frente.png`, `3d-lateral.png`, `3d-aerea.png`, `3d-mobile.png` e `3d-lado-a-lado.png`.

**Avaliação:** a casa é reconhecível. Estão lá a marquise branca sobre a garagem, o bloco de pedra na cobertura, o volume alto à direita com as duas faixas de vidro ripadas, a porta clara, a janela da fachada e o muro baixo. **Mas não está no nível das perspectivas:** não tem textura, vegetação nem iluminação de render, e os volumes são caixas simples. Por isso o PR fica em **rascunho**, como pede o item 8.5.2. Recomendação: publicar só com o arquivo 3D original do projeto (ver `docs/PENDENCIAS.md`). O gerador e a seção já estão prontos para trocar o GLB.
