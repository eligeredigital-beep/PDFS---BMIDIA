/* POST /api/resumo  { texto } -> { resumo, modelo }
   Pede à NVIDIA (build.nvidia.com, API compatível com OpenAI) que organize o texto da reunião
   no formato de blocos do PDF. A chave fica só na Vercel, em NVIDIA_API_KEY.
   Opcionais: NVIDIA_MODEL (padrão abaixo) e ACCESS_CODE (exige o cabeçalho x-access-code). */
const BM = require('../app/engine.js');

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'meta/llama-3.3-70b-instruct';
const MAX_CHARS = 40000;

const EXEMPLO = {
  cliente: 'Doce Ateliê Confeitaria',
  titulo: 'Resumo da reunião',
  data: '21/10/2026',
  participantes: ['Riziel', 'Maria'],
  blocos: [
    { tipo: 'texto', titulo: 'Objetivo da reunião', texto: 'Revisar os resultados de setembro e definir as ações do próximo ciclo.' },
    { tipo: 'metricas', titulo: 'Resultados de setembro', itens: [
      { valor: 'R$ 1.330', rotulo: 'Investidos (R$ 1.491 com imposto)' },
      { valor: '312', rotulo: 'Pedidos no período' },
      { valor: '20 mil', rotulo: 'Pessoas alcançadas' },
    ] },
    { tipo: 'destaque', itens: [
      { valor: 'R$ 33 mil', rotulo: 'Faturamento da loja em setembro, o melhor fora de temporada' },
      { valor: '2 → 14', rotulo: 'Pedidos mensais no iFood' },
    ] },
    { tipo: 'cards', titulo: 'Principais alinhamentos', itens: [
      { titulo: 'Criativos de melhor desempenho', texto: 'Vídeos com a dona aparecendo e vídeos de produto funcionam melhor.' },
      { titulo: 'Migração para o cardápio web', texto: 'O pixel da Meta é conectado e os links das campanhas são trocados após a validação.' },
    ] },
    { tipo: 'meta', titulo: 'Meta combinada', itens: [
      { valor: 'ROAS ≥ 3', rotulo: 'Nos primeiros 15 dias com o cardápio web' },
    ] },
    { tipo: 'atencao', titulo: 'Pontos de atenção', itens: [
      'Baixa adição ao carrinho é o principal gargalo e depende do novo cardápio.',
    ] },
    { tipo: 'checklist', titulo: 'Checklist final', colunas: [
      { titulo: 'Responsabilidades do cliente', itens: [
        { t: 'Enviar o acesso do cardápio web', tag: 'Hoje · 21/10' },
        { t: 'Gravar vídeos de produto toda semana' },
      ] },
      { titulo: 'Responsabilidades do time / gestores', itens: [
        { t: 'Conectar o pixel da Meta ao cardápio web' },
      ] },
    ] },
  ],
};

const SISTEMA = `Você organiza resumos de reunião da agência BMidia Digitais (tráfego pago) para virar um PDF.
Responda APENAS com um objeto JSON válido, sem texto antes ou depois e sem crases.

Formato:
{"cliente": string, "titulo": string, "data": "dd/mm/aaaa", "participantes": [string], "blocos": [bloco]}

Tipos de bloco, nesta ordem quando existirem:
- "texto": {"tipo":"texto","titulo","texto"} — objetivo ou contexto, 1 a 3 frases.
- "metricas": {"tipo":"metricas","titulo","itens":[{"valor","rotulo"}]} — números do período (investimento, conversas, vendas, alcance, seguidores). 3 a 6 itens. "valor" curto (até 12 caracteres: "R$ 1.015", "59", "26 mil", "+200"); detalhes vão no "rotulo".
- "destaque": {"tipo":"destaque","itens":[{"valor","rotulo"}]} — 1 ou 2 resultados mais marcantes (melhor criativo, recorde, virada). Sem título.
- "cards": {"tipo":"cards","titulo","itens":[{"titulo","texto"}]} — alinhamentos e decisões. Título de 2 a 5 palavras; texto de 1 a 2 frases.
- "meta": {"tipo":"meta","titulo","itens":[{"valor","rotulo"}]} — só se houver meta numérica combinada.
- "atencao": {"tipo":"atencao","titulo","itens":[string]} — riscos, gargalos e pendências.
- "checklist": {"tipo":"checklist","titulo":"Checklist final","colunas":[{"titulo","itens":[{"t","tag"}]}]} — uma coluna por responsável (cliente; time/gestores). "t" começa com verbo no infinitivo. "tag" só quando houver prazo ("Hoje · 21/10", "Até 25/10"); sem prazo, omita "tag".

Regras:
- Use apenas fatos e números que estão no texto. Nunca invente valores, metas, prazos ou nomes.
- Um número citado num alinhamento pode aparecer também em "metricas" ou "destaque".
- Português do Brasil, frases curtas e claras, sem emojis e sem markdown.
- "cliente": nome do cliente ou da empresa. "titulo": "Resumo da reunião", salvo se o texto disser outro.
- Omita blocos sem conteúdo.

Exemplo de saída (dados fictícios):
${JSON.stringify(EXEMPLO)}`;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function extractJson(content) {
  const s = String(content || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/g, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '{}');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { erro: 'Use POST.' });

  const code = process.env.ACCESS_CODE;
  if (code && req.headers['x-access-code'] !== code) return send(res, 401, { erro: 'Código de acesso inválido.' });

  const key = process.env.NVIDIA_API_KEY;
  if (!key) return send(res, 500, { erro: 'A chave NVIDIA_API_KEY não está configurada na Vercel.' });

  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { erro: 'Corpo da requisição inválido.' }); }
  const texto = typeof body.texto === 'string' ? body.texto.trim() : '';
  if (!texto) return send(res, 400, { erro: 'Cole o texto da reunião antes de organizar.' });
  if (texto.length > MAX_CHARS) return send(res, 413, { erro: `O texto passou de ${MAX_CHARS.toLocaleString('pt-BR')} caracteres. Envie um resumo menor.` });

  const modelo = process.env.NVIDIA_MODEL || DEFAULT_MODEL;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55000);
  let r;
  try {
    r = await fetch(NVIDIA_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        model: modelo,
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: SISTEMA },
          { role: 'user', content: `Organize este texto de reunião:\n\n${texto}` },
        ],
      }),
    });
  } catch (e) {
    return send(res, 504, { erro: e.name === 'AbortError' ? 'A NVIDIA demorou demais para responder. Tente de novo.' : 'Não foi possível falar com a NVIDIA.' });
  } finally {
    clearTimeout(timer);
  }

  if (!r.ok) {
    const detalhe = (await r.text().catch(() => '')).slice(0, 300);
    const erro = r.status === 401 || r.status === 403 ? 'A NVIDIA recusou a chave. Confira NVIDIA_API_KEY na Vercel.'
      : r.status === 429 ? 'Limite de uso da NVIDIA atingido. Espere um pouco e tente de novo.'
      : `A NVIDIA respondeu com erro ${r.status}.`;
    return send(res, 502, { erro, detalhe });
  }

  const data = await r.json().catch(() => null);
  const obj = extractJson(data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content);
  if (!obj) return send(res, 502, { erro: 'A IA não devolveu um resumo no formato esperado. Tente de novo.' });

  const resumo = BM.sanitize(obj);
  if (!resumo.blocos.length) return send(res, 502, { erro: 'A IA devolveu um resumo vazio. Tente de novo.' });
  return send(res, 200, { resumo, modelo });
};
