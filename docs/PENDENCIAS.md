# Pendências (dados que só a DCS tem)

Nada desta lista vai para o HTML até a informação chegar, confirmada por escrito.

- [ ] **CNPJ** da DCS.
- [ ] **CREA-SC** da empresa e **nome e número do CREA do responsável técnico**. Quando vierem, entram no rodapé, na página "A DCS" e no JSON-LD (`identifier`, `employee`). Confirmar com o responsável técnico se a publicidade de engenharia exige essa menção no site.
- [ ] **CEP** do escritório (para completar o `PostalAddress` do JSON-LD).
- [ ] **Incorporação:** se a DCS vende unidades em construção, o número do registro de incorporação precisa constar nos anúncios. Consultar o jurídico/contador antes de qualquer oferta de unidade no site. (Hoje o site só diz que a DCS desenvolve empreendimentos próprios e que a presença no portfólio não indica imóvel à venda.)
- [ ] **Domínio próprio.** Depois de registrado e apontado na Vercel: `node scripts/definir-dominio.mjs https://www.dominio.com.br`, depois `node scripts/check-site.mjs`.
- [ ] **Perfil da Empresa no Google** com nome, endereço e telefone idênticos ao site, e cadastro no **Google Search Console** (enviar `sitemap.xml`).
- [ ] **Fotos reais das obras.** Hoje só o Residencial 03 é fotografia; os demais são perspectivas de projeto. Para SEO local e confiança, fotos de obra valem muito.
- [ ] **Autorização da M9 Arquitetura** para continuar usando as imagens dos Residenciais 02, 06 e 07, com crédito.
- [ ] **Arquivo 3D original** do Residencial 04 (SketchUp, Revit, Archicad, Lumion ou Blender), em `_originais/3d/`. Dos outros projetos também, se quiserem mais modelos.
- [ ] **Depoimentos de clientes:** não adicionar até haver autorização por escrito de cada cliente.

## Itens levantados na FAQ que precisariam de confirmação

Nenhuma afirmação nova foi colocada na FAQ. Se a DCS quiser respostas mais completas, faltam:

- Se a primeira conversa/visita ao terreno tem custo.
- Se o orçamento é entregue por escrito e em quanto tempo (a FAQ não fala de prazo de propósito).
- Quais bancos/linhas de financiamento a DCS já atendeu além da Caixa (citada no Residencial 06).
