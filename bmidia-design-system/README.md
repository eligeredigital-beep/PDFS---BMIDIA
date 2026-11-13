# BMidia Digitais — Design System + Skill

Identidade visual da BMidia (nome da marca: **BMidia**, sem S) empacotada como **skill do Claude**. Instalada, o Claude passa a aplicar logo, cores, fontes e layouts da marca sozinho em qualquer peça: carrossel, post, apresentação, PDF de resumo de reunião, proposta, página web.

## O que tem aqui

```
bmidia-design-system/
├── SKILL.md            ← a skill (instruções que o Claude lê)
├── DESIGN-SYSTEM.md    ← guia completo da marca + histórico de atualizações
├── tokens.css          ← variáveis CSS (cores, fontes, espaços) para HTML/PDF
├── tokens.json         ← os mesmos tokens em JSON, com pares de cor aprovados
├── logos/
│   ├── bmidia-logo-*.png     wordmark: bege, branco, marrom, marrom-escuro, preto-oliva
│   └── bmidia-icone-*.svg    ícone "bm": verde, linho, marrom-b, marrom-m, preto, branco
└── README.md           ← este guia
```

Na raiz do repositório: `releases/bmidia-design-system.zip` (a skill pronta para instalar) e `empacotar-skill.sh` (gera o zip de novo).

## Instalar a skill

### No Claude (claude.ai / app desktop)

1. Baixe `releases/bmidia-design-system.zip` deste repositório.
2. No Claude, abra as configurações de **Skills** (em Configurações → Capacidades; o caminho exato muda conforme a versão) e envie o `.zip`.
3. Ative a skill **bmidia-design-system**.

Cada pessoa da equipe repete esses 3 passos com o mesmo zip, e todos produzem peças no mesmo padrão.

### No Claude Code

Copie a pasta inteira para o diretório de skills:

```bash
# só para você
cp -r bmidia-design-system ~/.claude/skills/bmidia-design-system

# ou só para um projeto
cp -r bmidia-design-system SEU-PROJETO/.claude/skills/bmidia-design-system
```

## Usar no dia a dia

Peça normalmente, citando a BMidia. A skill entra sozinha quando o pedido é de uma peça da marca. Para garantir, escreva "use a skill bmidia-design-system".

| Você pede | O Claude entrega |
|---|---|
| "Carrossel de 8 slides da BMidia sobre o case da Tayna" | Slides 1080×1350, serifa editorial, faixa de métrica, rodapé `@BMIDIADIGITAIS` |
| "Post de resultado: R$ 42 mil em faturamento atribuído" | Número como maior elemento da peça, paleta oficial |
| "Capa de apresentação institucional da BMidia" | Nearo Rounded nos títulos, logo na versão certa para o fundo |
| "Gera o PDF do resumo dessa reunião" | PDF A4 com cabeçalho marrom, cards de número, checklist por responsável |
| "Landing page da BMidia" | HTML linkando `tokens.css`, sem cor ou fonte inventada |

Dica: envie o texto pronto. A skill define o visual; a copy continua sendo sua.

## Usar os tokens em código

```html
<link rel="stylesheet" href="bmidia-design-system/tokens.css">

<section style="background: var(--bm-brown); color: var(--bm-cream); font-family: var(--font-body)">
  <img src="bmidia-design-system/logos/bmidia-logo-bege.png" alt="BMidia" height="40">
  <h1 style="font-family: var(--font-marca); font-weight: 300">Resumo da <em>reunião</em></h1>
</section>
```

Variáveis principais: `--bm-brown`, `--bm-brown-deep`, `--bm-olive`, `--bm-beige`, `--bm-linho`, `--bm-cream`, `--bm-gold`, `--bm-red`; fontes `--font-marca`, `--font-body`, `--font-social`, `--font-display`; espaços `--space-1` a `--space-5`.

## Qual logo usar

| Fundo | Wordmark | Ícone "bm" |
|---|---|---|
| Marrom, oliva, verde-profundo, grafite, foto escurecida | `bege` ou `branco` | `branco` |
| Creme, linho, off-white | `marrom` ou `marrom-escuro` | `verde`, `marrom-b`, `marrom-m` |
| Uma cor só (impresso) | `preto-oliva` | `preto` |

Respiro mínimo = altura do "B". Não distorcer, não recolorir, não aplicar sombra.

## Regras que nunca mudam

1. Escrever **BMidia**, nunca "Bmidias". Handle: `@BMIDIADIGITAIS`.
2. Só cores da paleta e pares de contraste aprovados (`tokens.json` → `pairings`).
3. Logo sempre dos arquivos de `logos/`, nunca redesenhado.
4. Resultado concreto em destaque; no máximo **uma** palavra em vermelho por peça.
5. Fonte certa para cada tipo de peça: Nearo Rounded (marca), Hanken Grotesk/Montserrat (redes), serifa editorial (carrossel e PDF de resumo).

## Atualizar a skill

1. Edite os arquivos desta pasta (`SKILL.md`, `tokens.*`, `logos/`).
2. Rode `./empacotar-skill.sh` na raiz do repositório para gerar `releases/bmidia-design-system.zip`.
3. Faça commit e push.
4. Reenvie o zip nas configurações de Skills (cada pessoa que usa).

## Pendências

Ainda não estão neste repositório, e a skill avisa quando precisa deles:

- `fonts/` — Nearo Rounded (fonte comercial), Montserrat, Hanken Grotesk e Playfair Display. Sem os `.woff2` da Nearo, `tokens.css` cai para Montserrat.
- `assets/Elementos/` — arcos em 6 cores e patterns 01 a 06.
- Ícones `cinza-60` e `cinza-20`.
- Prévias HTML `componentes/ResumoPDF/` e `componentes/Cover/`.

Esses arquivos estão em `Documentos/BMidia-Design-System/` no computador do Riziel e no artefato "BMidia Digitais" no claude.ai. Para trazê-los: copie as pastas para dentro de `bmidia-design-system/`, rode o `empacotar-skill.sh` e faça commit.

## Relação com o gerador de PDFs

O app em `app/` e o template em `bmidia-pdf-template/` usam a mesma identidade. Os valores atuais (paleta oficial, ícones, regras) estão nesta pasta; o template mantém uma cópia própria de `tokens.css` em `bmidia-pdf-template/bmidia-pdf/assets/` com as fontes já embutidas.
