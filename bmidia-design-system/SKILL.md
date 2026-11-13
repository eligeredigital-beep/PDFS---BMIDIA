---
name: "bmidia-design-system"
description: "Aplica a identidade visual da BMidia Digitais (agência de tráfego pago para confeitarias) em carrosséis, posts, apresentações, PDFs, resumos de reunião e qualquer peça da marca BMidia."
---

# BMidia Digitais — Design System

Use esta skill sempre que a peça for da **BMidia** (ou BMidia Digitais): carrossel de Instagram 1080×1350, post, story, apresentação, capa, PDF de resumo de reunião, proposta, página web ou impresso.

**Nome da marca: BMidia, sem S.** Nunca escrever "Bmidias". Handle: `@BMIDIADIGITAIS`.

## Arquivos da marca

Esta pasta é a fonte oficial. Ler direto dela:

- `tokens.css` — variáveis (`--bm-brown`, `--font-marca`, `--space-3`…). Em HTML, linkar este arquivo em vez de redefinir cores.
- `tokens.json` — os mesmos tokens com pares de cor aprovados.
- `DESIGN-SYSTEM.md` — guia completo (logo, cores, tipografia, layout) e histórico de atualizações.
- `logos/` — wordmark "Bmidia" + DIGITAIS em PNG: `bege`, `branco`, `marrom`, `marrom-escuro`, `preto-oliva`. Ícone "bm" em SVG: `verde`, `linho`, `marrom-b`, `marrom-m`, `preto`, `branco`.

Ainda fora desta pasta (ficam em `Documentos/BMidia-Design-System/` no computador do Riziel e no artefato Design System "BMidia Digitais" no claude.ai: https://claude.ai/artifact/5uKKsMhajnFXyzWXNjqi5h): `fonts/` (Nearo Rounded, Montserrat, Hanken Grotesk, Playfair Display), `assets/Elementos/` (arcos `arco-verde|oliva|bege|linho|marrom|grafite` e `pattern-01` a `06`), ícones `cinza-60` e `cinza-20`, e as prévias HTML `componentes/ResumoPDF/` e `componentes/Cover/`.

Para usar logos, ícones e fontes: leia desta pasta. Para fontes, arcos e patterns, use o artefato ou a pasta no computador (se conectada). Se nada estiver acessível, peça ao usuário para anexar; nunca redesenhe o logo à mão.

## Conceito e voz

- Assinatura: "A revolução do tráfego pago na confeitaria!"
- Manifesto: "Transformamos negócios, prosperamos pessoas, impactamos famílias. Isso é Bmidia!"
- Atributos: Autoridade · Especialização · Transformação · Estratégia · Segurança · Inovação · Impacto · Confiança.
- Voz próxima e segura, sem jargão. Resultado concreto, não promessa ("R$ 42 mil em faturamento atribuído").
- **Números primeiro:** se há resultado, ele é o maior elemento da peça (faixa de métrica ou cartão de número).
- **Títulos em dois tons:** linha leve + destaque em peso maior ou itálico ("Resumo da *reunião*").
- No máximo **uma palavra em `red`** por peça.
- Rodapé: `@BMIDIADIGITAIS` em caixa alta, pequeno, canto inferior esquerdo.

## Cor

Paleta oficial (guia de marca, Studio Sagi):

| Token | HEX | Uso |
|---|---|---|
| `verde-profundo` | #283C3A | fundos fortes, ícone verde |
| `olive` | #6D6A38 | capas, impressos, fundo alternativo |
| `beige` | #CABDAA | logo, ícone, arcos, filetes |
| `linho` | #E3DFD4 | fundos neutros, faixas suaves |
| `brown` | #876047 | fundo de marca principal, cabeçalho do PDF, cartões de número |
| `grafite` | #2F2D2E | texto escuro de marca, fundos dramáticos |

Complementares: `cream` #FFF8EF (fundo claro), `off-white` #F7F6F1, `brown-deep` #662900 (títulos sobre claro), `brown-text` #94430D (texto sobre cream), `sand` #DFD2C1 (filetes), `dark` #1B1B13 (overlay), `dark-brown` #61544F, `gold` #DFB956 (selo/botão, sempre com texto `brown-deep`), `red` #CD2438 (uma palavra), `alert-tint` #F3E6C9. Aplicação: `branco-marca` #F6F6F6, `preto-marca` #1D1D1B, `cinza-20` #DADADA, `cinza-60` #878787, `oliva-claro` #B7AD27 (só no arco oliva).

Pares aprovados para texto: `cream` sobre `verde-profundo`, `grafite`, `brown` ou `olive` · `grafite` sobre `linho` · `beige` sobre `verde-profundo` · `brown-text` sobre `cream`. Só em 24px+: `linho` sobre `brown`/`olive`, `sand` sobre `brown`. `beige` sobre `olive`/`brown` só para logo e arcos, nunca texto. Foto com texto claro leva overlay `dark` ou `grafite` a 60–70%.

## Tipografia

- **Marca (institucional, apresentações, capas):** Nearo Rounded nos títulos (Light 300 para H1 grande, Regular 400 para frases, SemiBold 600 para destaque) + Montserrat no texto.
- **Redes sociais:** Hanken Grotesk (HK Grotesk) Bold para números e cases; Helvetica Bold caixa alta nas faixas de impacto; Montserrat no corpo e CTAs.
- **Serifa editorial** (Tan Aegean → fallback Playfair Display): só nos carrosséis no estilo já produzido e no PDF de resumo. Peças institucionais novas usam Nearo Rounded.
- Rótulos espaçados em caixa alta: Montserrat SemiBold, tracking largo (como "DIGITAIS").

Escalas:
- Marca: H1 72/300 · H2 56/400 · H3 40/600 · texto 16 · rótulo 12/600.
- Carrossel 1080×1350: display 96 · H1 72 · H2 56 · H3 40 · corpo 32 · apoio 24 · legenda 20/600 caixa alta.
- PDF A4: título 32pt · seção 16pt `brown-deep` com filete `beige` · número 17–18pt Hanken Bold · corpo 9.5–10.5pt · rótulo 7pt caixa alta.

## Logo e ícone

- Wordmark (Logos): `bege`/`branco` sobre `brown`, `olive`, `verde-profundo`, `grafite` e fotos escurecidas; `marrom`/`marrom-escuro` sobre `cream`, `linho`, `off-white`; `preto-oliva` em uma cor.
- Ícone "bm": espaços quadrados ou pequenos (avatar, favicon, selo). `verde`/`marrom-*` sobre claro; `branco` sobre escuro.
- Respiro mínimo = altura do "B". Não distorcer, não recolorir fora das versões, não aplicar sombra, não separar "b" do "m".

## Elementos e layout

- Design minimalista, muito espaço em branco, geometria simples.
- **Arcos:** três faixas concêntricas, uma cor por peça, grandes e sangrando pela borda sobre fundo liso de outra cor da paleta.
- **Patterns:** fundos discretos, embalagens; nunca atrás de texto pequeno.
- Carrossel: margem lateral 96px; split 50/50 (bloco `brown` + foto); faixa de métrica sólida (`dark`, `brown-deep` ou `gold`); pill de CTA arredondada; prova social com prints de sombra suave sobre `brown`.
- Espaço base 8px: 8 · 16 · 24 · 40 · 64. Cantos: retos nos blocos do carrossel, 8px no PDF, 24px em cartões, pill (999px) em CTAs e selos.
- Imagem: confeitaria artesanal, cafés, interiores verde-sálvia e creme, luz suave, pouca saturação.
- Ícones de interface: traço fino arredondado 2px em `brown-deep`, `grafite` ou `cream`.

## Componente: Resumo de reunião (PDF A4)

Cabeçalho `brown` (só na 1ª página) com logo bege, nome do cliente em rótulo caixa alta, título "Resumo da *reunião*" (última palavra em itálico `sand`), data e participantes; filete `olive` embaixo. Corpo em seções com título `brown-deep` e filete `beige`:
- **Números:** cartões `brown`, valor Hanken Bold `cream`.
- **Metas:** cartões `off-white` com borda `brown`, valor `brown-deep`.
- **Tópicos:** lista numerada 01, 02… em serifa itálica `brown`.
- **Alertas:** faixa `alert-tint` com sublinhado `gold`.
- **Ações:** uma coluna por responsável (cabeçalho `brown-deep`, depois `olive`), checkbox e selo de prazo `gold`.
Páginas seguintes: margem 16mm no topo, rodapé com `@BMIDIADIGITAIS` e paginação. Números e listas curtas não quebram entre páginas.

## Checklist antes de entregar

1. Nome escrito "BMidia", handle `@BMIDIADIGITAIS`.
2. Só cores da paleta, pares de contraste aprovados.
3. Logo/ícone a partir dos arquivos oficiais, na versão certa para o fundo.
4. Um número em destaque quando houver resultado; no máximo uma palavra em `red`.
5. Fontes corretas para o tipo de peça (marca × redes × PDF).
