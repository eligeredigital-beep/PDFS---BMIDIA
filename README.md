# PDFs BMidia Digitais

Gerador de PDFs de resumo de reunião no padrão visual da BMidia Digitais.

- `app/` — app web: cole o texto da reunião, veja a prévia A4 e baixe o PDF. Abra `app/index.html` no navegador (funciona offline).
- `bmidia-design-system/` — tokens de cor e tipografia, guia da marca e logos.
- `bmidia-pdf-template/` — template original em Python (`generate.py`, requer WeasyPrint) e exemplos de JSON.

## Como o texto vira PDF

Linhas `Cliente:`, `Data:` e `Participantes:` preenchem o cabeçalho. Cada título vira uma seção:
"Resultados" → cartões de número, "Decisões" → tópicos, "Metas" → metas, "Atenção" → alertas,
"Próximos passos" → colunas de ações por responsável (`ação — responsável — prazo`).
