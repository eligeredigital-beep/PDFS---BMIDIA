# PDFs BMidia Digitais

Gerador de PDFs de resumo de reunião no padrão visual da BMidia Digitais.

- `app/` — app web: cole o texto da reunião, veja a prévia A4 e baixe o PDF. Abra `app/index.html` no navegador (funciona offline).
- `bmidia-design-system/` — tokens de cor e tipografia, guia da marca e logos.
- `bmidia-pdf-template/` — template original em Python (`generate.py`, requer WeasyPrint) e exemplos de JSON.

## Organizar com IA (NVIDIA)

O botão **Organizar com IA** envia o texto para `api/resumo.js`, uma função da Vercel que chama a API da
NVIDIA (build.nvidia.com) e devolve o resumo no formato de blocos do PDF (o mesmo de `resumo-kellen.json`):
números, destaques, alinhamentos com título, metas, pontos de atenção e checklist por responsável.

Configuração na Vercel (Settings → Environment Variables):

| Variável | Obrigatória | O que é |
|---|---|---|
| `NVIDIA_API_KEY` | sim | chave criada em build.nvidia.com (começa com `nvapi-`) |
| `NVIDIA_MODEL` | não | modelo para texto solto; padrão `nvidia/nemotron-3-ultra-550b-a55b` (~25 s) |
| `NVIDIA_MODEL_NUMEROS` | não | modelo para extrair números de resumos já no modelo; padrão `nvidia/nemotron-3.5-lightning-30b-a3b` (~6 s) |
| `NVIDIA_MODEL_TITULOS` | não | modelo que dá o título curto aos alinhamentos escritos sem "Assunto:"; padrão igual ao dos números (~1 s) |
| `NVIDIA_MODEL_DIVISAO` | não | modelo que separa em itens as partes coladas sem quebras de linha; padrão igual ao `NVIDIA_MODEL` |
| `ACCESS_CODE` | recomendada | código que o app pede uma vez; sem ele, qualquer pessoa com o link gasta a sua chave |

**Colar por partes:** o app tem 4 quadros (cabeçalho e objetivo, alinhamentos, pontos de atenção, checklist). Cada um é lido na hora e ao pé da letra; se faltar o título de uma seção, ele é acrescentado. No modo "Texto único" o texto inteiro é colado de uma vez e dividido nas mesmas 4 partes pelos títulos do modelo, mesmo sem quebras de linha. Com quebras de linha o resultado é idêntico ao "Por partes"; sem elas, a IA separa os itens por assunto (o app confere que nenhuma palavra muda), ou cada frase vira um item.

**Teste local com a IA:** copie `.env.example` para `.env.local`, coloque a chave em `NVIDIA_API_KEY` e rode
`node dev-server.js` (abre em http://localhost:5180). O `.env.local` fica fora do Git.

Aberto direto pelo arquivo `app/index.html`, o app funciona só com a leitura automática abaixo.

## Como o texto vira PDF (leitura automática)

Linhas `Cliente:`, `Data:` e `Participantes:` preenchem o cabeçalho. Cada título vira uma seção:
"Resultados" → cartões de número, "Decisões" → tópicos, "Metas" → metas, "Atenção" → alertas,
"Próximos passos" → colunas de ações por responsável (`ação — responsável — prazo`).
