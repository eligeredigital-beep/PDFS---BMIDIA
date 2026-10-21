/* POST /api/resumo  { texto } -> { resumo, modelo }
   Pede à NVIDIA (build.nvidia.com, API compatível com OpenAI) que organize o texto da reunião
   no formato de blocos do PDF. A chave fica só na Vercel, em NVIDIA_API_KEY.
   Opcionais: NVIDIA_MODEL (padrão abaixo) e ACCESS_CODE (exige o cabeçalho x-access-code). */
const BM = require('../app/engine.js');

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
// Melhor resultado nos testes (~25 s). Mais rápido e um pouco mais simples: nvidia/nemotron-3.5-lightning-30b-a3b (~10 s).
// O llama-3.3-70b foi aposentado pela NVIDIA em 08/2026; troque por NVIDIA_MODEL sem mexer no código.
const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
const FAST_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
const MAX_CHARS = 40000;

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
- Use apenas fatos e números que estão no texto. Nunca invente valores, metas, prazos, nomes ou meses (se o texto diz "primeiros 30 dias", não escreva "setembro").
- Títulos de bloco FIXOS, exatamente assim: "Objetivo da reunião", "Principais alinhamentos", "Meta combinada", "Pontos de atenção", "Checklist final". Em "metricas" use "Resultados do período" (ou "Resultados de <mês>" se o texto citar o mês).
- NÃO omita nem junte assuntos: cada assunto, decisão ou alinhamento citado no texto vira um item próprio. Se o texto lista 10, devolva 10.
- Todos os alinhamentos e decisões ficam em UM ÚNICO bloco "cards" ("Principais alinhamentos"), um item por assunto. Nunca crie vários blocos "cards" nem agrupe por tema. Só o "titulo" de cada item (2 a 5 palavras) sai do assunto.
- Colunas da checklist: "Responsabilidades do cliente" e "Responsabilidades do time / gestores".
- Sem meta numérica combinada no texto, não crie o bloco "meta". Sem prazo citado, não crie "tag".
- Um número citado num alinhamento pode aparecer também em "metricas" ou "destaque".
- Português do Brasil, frases curtas e claras, sem emojis e sem markdown.
- "cliente": nome do cliente ou da empresa. "titulo": "Resumo da reunião", salvo se o texto disser outro.
- Omita blocos sem conteúdo.`;

// Modo fiel: o texto já está no modelo de resumo. O app mantém o texto como foi escrito;
// a IA faz duas coisas pequenas, em chamadas separadas e em paralelo: extrair números e dar título curto aos itens sem título.
const SISTEMA_NUMEROS = `Você extrai números de resumos de reunião da agência BMidia Digitais (tráfego pago).
Responda APENAS com um objeto JSON válido, sem texto antes ou depois e sem crases.

Formato: {"blocos": [bloco]}

Blocos possíveis (omita os que não se aplicam):
- "metricas": {"tipo":"metricas","titulo":"Resultados do período","itens":[{"valor","rotulo"}]} — números do período (investimento, conversas, vendas, alcance, seguidores). 3 a 6 itens. "valor" curto (até 12 caracteres: "R$ 1.015", "59", "26 mil", "+200"); detalhes vão no "rotulo". Use "Resultados de <mês>" no título só se o texto citar o mês.
- "destaque": {"tipo":"destaque","itens":[{"valor","rotulo"}]} — 1 ou 2 resultados mais marcantes (melhor criativo, recorde, virada). Sem título.
- "meta": {"tipo":"meta","titulo":"Meta combinada","itens":[{"valor","rotulo"}]} — só se o texto trouxer uma meta numérica combinada.

Regras: use somente números que estão no texto, exatamente como aparecem. Nunca invente, some ou converta valores. Português do Brasil, sem emojis.`;

// Para partes coladas como um parágrafo só: a IA apenas CORTA o trecho em itens. O app confere que,
// juntos, os itens são exatamente o texto original; se não forem, divide por frase.
const SISTEMA_DIVIDIR = `Você divide um trecho de resumo de reunião em itens de uma lista.
Responda APENAS com JSON: {"itens": [string]}.
Regras:
- Copie o texto EXATAMENTE: não mude, não tire e não acrescente nenhuma palavra, número ou pontuação.
- Cada item é um pedaço contínuo do trecho, na ordem original; juntos, os itens formam o trecho inteiro.
- Um item por assunto. Frases que continuam o mesmo assunto ficam no mesmo item (por exemplo, "Estratégia: ..." logo depois de "Melhor criativo: ..." é do mesmo item; "Perfil passou de ... seguidores." logo depois de um resultado é do mesmo item).
- Um item novo começa quando muda o assunto, muitas vezes numa frase como "Assunto: ...".`;

const sistemaTitulos = (n) => `Você dá títulos curtos a itens de um resumo de reunião de tráfego pago.
Responda APENAS com JSON: {"titulos": [string]} com exatamente ${n} títulos, na ordem dos itens.
Cada título: de 1 a 4 palavras, é um RÓTULO do assunto (como "Entrega", "Cardápio", "Melhor criativo"), nunca uma frase. Não comece copiando o item e não termine com ponto. Use só palavras e fatos do item.`;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

// Fecha chaves e colchetes que o modelo esqueceu no fim (acontece com respostas longas).
function closeJson(s) {
  const stack = [];
  let inStr = false, esc = false;
  for (const ch of s) {
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']');
    else if (ch === '}' || ch === ']') stack.pop();
  }
  return s + (inStr ? '"' : '') + stack.reverse().join('');
}

function extractJson(content) {
  const s = String(content || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/g, '').trim();
  const a = s.indexOf('{');
  if (a < 0) return null;
  const b = s.lastIndexOf('}');
  for (const cand of [b > a ? s.slice(a, b + 1) : null, closeJson(s.slice(a)), b > a ? closeJson(s.slice(a, b + 1)) : null]) {
    if (!cand) continue;
    try { return JSON.parse(cand); } catch {}
  }
  return null;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '{}');
}

/* Uma chamada à NVIDIA. Devolve { obj } com o JSON da resposta ou { erro, status, detalhe }. */
async function chamar(key, { model, system, user, maxTokens, timeoutMs = 55000 }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let r;
  try {
    r = await fetch(NVIDIA_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        // Sem isso, os modelos que "pensam" gastam todos os tokens raciocinando e passam de 60 s.
        chat_template_kwargs: { enable_thinking: false },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      }),
    });
  } catch (e) {
    return { status: 504, erro: e.name === 'AbortError' ? 'A NVIDIA demorou demais para responder. Tente de novo.' : 'Não foi possível falar com a NVIDIA.' };
  } finally {
    clearTimeout(timer);
  }
  if (!r.ok) {
    const detalhe = (await r.text().catch(() => '')).slice(0, 300);
    const erro = r.status === 401 || r.status === 403 ? 'A NVIDIA recusou a chave. Confira NVIDIA_API_KEY na Vercel.'
      : r.status === 429 ? 'Limite de uso da NVIDIA atingido. Espere um pouco e tente de novo.'
      : `A NVIDIA respondeu com erro ${r.status}.`;
    return { status: 502, erro, detalhe };
  }
  const data = await r.json().catch(() => null);
  const obj = extractJson(data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content);
  if (!obj) return { status: 502, erro: 'A IA não devolveu um resumo no formato esperado. Tente de novo.' };
  return { obj };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { erro: 'Use POST.' });

  const code = process.env.ACCESS_CODE;
  if (code && req.headers['x-access-code'] !== code) return send(res, 401, { erro: 'Código de acesso inválido.' });

  const key = process.env.NVIDIA_API_KEY;
  if (!key) return send(res, 500, { erro: 'A chave NVIDIA_API_KEY não está configurada (na Vercel ou, no teste local, no arquivo .env.local).' });

  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { erro: 'Corpo da requisição inválido.' }); }
  const texto = typeof body.texto === 'string' ? body.texto.trim() : '';
  if (!texto) return send(res, 400, { erro: 'Cole o texto da reunião antes de organizar.' });
  if (texto.length > MAX_CHARS) return send(res, 413, { erro: `O texto passou de ${MAX_CHARS.toLocaleString('pt-BR')} caracteres. Envie um resumo menor.` });

  const fiel = BM.isTemplate(texto);

  if (!fiel) {
    const r = await chamar(key, {
      model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
      system: SISTEMA,
      user: `Organize este texto de reunião:\n\n${texto}`,
      maxTokens: 4096,
    });
    if (r.erro) return send(res, r.status, { erro: r.erro, detalhe: r.detalhe });
    const resumo = BM.sanitize(r.obj);
    if (!resumo.blocos.length) return send(res, 502, { erro: 'A IA devolveu um resumo vazio. Tente de novo.' });
    return send(res, 200, { resumo, modelo: process.env.NVIDIA_MODEL || DEFAULT_MODEL, modo: 'livre' });
  }

  // Modo fiel: chamadas pequenas e separadas. O modelo rápido basta (menos de 15 s no total).
  const modelo = process.env.NVIDIA_MODEL_NUMEROS || FAST_MODEL;
  const numP = chamar(key, { model: modelo, system: SISTEMA_NUMEROS, user: `Extraia os números deste resumo de reunião:\n\n${texto}`, maxTokens: 1500 });
  // 1) Partes coladas como parágrafo único: a IA corta em itens (em paralelo com os números).
  const trechos = BM.parse(texto).blocos.filter((b) => b.tipo !== 'checklist').map((b) => b.texto);
  const divs = await Promise.all(trechos.map((b) =>
    // Cortar por assunto exige o modelo grande: nos testes, o rápido variava entre 10 e 14 itens; o grande dava sempre o mesmo.
    chamar(key, { model: process.env.NVIDIA_MODEL_DIVISAO || DEFAULT_MODEL, system: SISTEMA_DIVIDIR, user: b, maxTokens: 3000, timeoutMs: 40000 })
      .then((r) => [BM.chaveBloco(b), r.obj && r.obj.itens, BM.validarDivisao(b, r.obj && r.obj.itens) ? 1 : 0])));
  const divisoes = Object.fromEntries(divs.filter((d) => Array.isArray(d[1])).map((d) => [d[0], d[1]]));
  // 2) Itens que ficaram sem "Assunto:" ganham título curto.
  const semTitulo = BM.itensSemTitulo(texto, divisoes);
  const [num, tit] = await Promise.all([
    numP,
    semTitulo.length
      ? chamar(key, { model: process.env.NVIDIA_MODEL_TITULOS || modelo, system: sistemaTitulos(semTitulo.length), user: semTitulo.map((t, i) => `${i + 1}. ${t.replace(/\s+/g, ' ')}`).join('\n'), maxTokens: 500, timeoutMs: 30000 })
      : Promise.resolve({ obj: { titulos: [] } }),
  ]);
  // Os números são opcionais: sem eles o resumo sai igual, só sem os cartões de resultado. Erro de chave ou limite, não.
  if (num.erro && (num.status === 502 && /chave|Limite/.test(num.erro))) return send(res, num.status, { erro: num.erro, detalhe: num.detalhe });
  const numeros = num.obj ? BM.sanitize(num.obj).blocos : [];
  const titulos = tit.obj && Array.isArray(tit.obj.titulos) ? tit.obj.titulos : [];
  const resumo = BM.compor(texto, numeros, titulos, divisoes);
  if (!resumo.blocos.length) return send(res, 502, { erro: 'A IA devolveu um resumo vazio. Tente de novo.' });
  return send(res, 200, {
    resumo, modelo, modo: 'fiel',
    titulosDaIA: titulos.length, itensSemTitulo: semTitulo.length,
    trechosDivididos: divs.reduce((n, d) => n + d[2], 0), trechos: trechos.length,
  });
};
