/* Motor: texto colado -> seções -> HTML do PDF (padrão BMidia Digitais). Sem dependências. */
(function () {
  // No navegador é window; na função da Vercel (Node) é globalThis.
  const root = typeof window !== 'undefined' ? window : globalThis;
  const TIPOS = {
    texto: 'Texto corrido',
    metricas: 'Números',
    meta: 'Metas',
    destaque: 'Destaques',
    cards: 'Tópicos',
    atencao: 'Alertas',
    checklist: 'Ações',
  };

  const KEYWORDS = [
    ['checklist', /^(pr[oó]ximos?\s+passos?|a[cç][õo]es?|tarefas?|encaminhamentos?|pend[eê]ncias?|to-?do|plano de a[cç][aã]o|responsabilidades?|check-?list)/i],
    ['atencao', /^(aten[cç][aã]o|observa[cç][õo]es?|alertas?|riscos?|importante|cuidados?|lembretes?|pontos de aten[cç][aã]o)/i],
    ['metricas', /^(resultados?|m[eé]tricas?|n[uú]meros?|desempenho|kpis?|indicadores?)/i],
    ['meta', /^(metas?|objetivos? (de|para|do)|previs[õo]es?|proje[cç][õo]es?)/i],
    ['cards', /^(decis[õo]es|decis[aã]o|combinados?|defini[cç][õo]es|aprendizados?|pontos|discuss[aã]o|discutido|insights?|destaques?|estrat[eé]gias?|t[oó]picos?|principais)/i],
    ['texto', /^(contexto|resumo|objetivo( da reuni[aã]o)?|pauta|introdu[cç][aã]o|vis[aã]o geral|panorama|sobre a reuni[aã]o)/i],
  ];
  const BULLET = /^\s*(?:[-•*–·▪]|\d{1,2}[.)])\s+/;
  const SEP = /\s+[—–-]\s+|\s*\|\s*/;
  const DATE_LIKE = /\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|amanh[ãa]|hoje|semana|at[eé]\s+\w+|segunda|ter[cç]a|quarta|quinta|sexta|s[áa]bado|domingo/i;
  const NO_DATE = /^sem prazo/i;
  const VALUE_LIKE = /^(?:R\$\s?)?[+\-]?\d[\d.,]*\s?(?:%|x|k|mil|mi|milh[ãa]o|milh[õo]es|pp)?$/i;
  // Emojis no início da linha (📅, 👥, ✅, 🧑‍💼…), comuns em resumos enviados por WhatsApp.
  const EMOJI = /^[\p{Extended_Pictographic}‍️⃣\s]+/u;

  const strip = (s) => s.replace(EMOJI, '').replace(/[*_`]+/g, '').replace(/^#{1,6}\s*/, '').trim();
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function tipoFor(title) {
    const t = title.toLowerCase();
    for (const [tipo, re] of KEYWORDS) if (re.test(t)) return tipo;
    return null;
  }

  function isHeading(raw) {
    const line = raw.trim().replace(EMOJI, '');
    if (!line || BULLET.test(line)) return null;
    // ## Título, **Título** ou *Título* / _Título_ (negrito e itálico do WhatsApp)
    const md = /^#{1,6}\s+/.test(line) || (line.length <= 90 && /^(\*{1,2}[^*]+\*{1,2}|_[^_]+_):?$/.test(line));
    const plain = strip(line);
    const colon = /:$/.test(plain) && plain.length <= 60;
    const caps = plain.length <= 40 && /[A-ZÀ-Ú]{3}/.test(plain) && plain === plain.toUpperCase() && !/\d{3,}/.test(plain);
    if (md || colon || caps) {
      const t = plain.replace(/:$/, '');
      return { title: caps ? cap(t.toLowerCase()) : cap(t), rest: '' };
    }
    const m = plain.match(/^([^:]{3,40}):\s+(.+)$/);
    if (m && tipoFor(m[1])) return { title: cap(m[1]), rest: m[2] };
    return null;
  }

  /* texto -> { meta, sections } */
  function parse(text) {
    const meta = {};
    const sections = [];
    let cur = null;
    const start = (title, tipo) => {
      cur = { id: sections.length + ':' + title.toLowerCase(), titulo: title, auto: tipo, lines: [] };
      sections.push(cur);
    };
    const lines = text.replace(/\r/g, '').split('\n');
    for (const raw of lines) {
      const clean = strip(raw.replace(BULLET, ''));
      if (!raw.trim()) { if (cur) cur.lines.push(''); continue; }
      let m;
      if ((m = clean.match(/^(cliente|empresa|projeto)\s*[:\-–]\s*(.+)$/i))) { meta.cliente = m[2].trim(); continue; }
      if ((m = clean.match(/^(t[ií]tulo|assunto)\s*[:\-–]\s*(.+)$/i))) { meta.titulo = m[2].trim(); continue; }
      if ((m = clean.match(/^data(?: da reuni[aã]o)?\s*[:\-–]\s*(.+)$/i))) { meta.data = m[1].trim(); continue; }
      if ((m = clean.match(/^(participantes|presentes)\s*[:\-–]\s*(.+)$/i))) {
        meta.participantes = m[2].split(/\s*[;,]\s*|\s+e\s+/).map((x) => x.trim()).filter(Boolean);
        continue;
      }
      const h = isHeading(raw);
      if (h) {
        const tipo = tipoFor(h.title);
        if (/^(participantes|presentes)$/i.test(h.title)) { cur = { participantes: true, lines: [] }; meta._pend = cur; continue; }
        start(h.title, tipo);
        if (h.rest) cur.lines.push(h.rest);
        continue;
      }
      if (cur && cur.participantes) { cur.lines.push(clean); continue; }
      if (!cur) start('Contexto', 'texto');
      cur.lines.push(BULLET.test(raw) ? '• ' + clean : clean);
    }
    if (meta._pend) {
      const p = meta._pend.lines.filter(Boolean);
      if (p.length) meta.participantes = p;
      delete meta._pend;
    }
    for (const s of sections) {
      while (s.lines.length && !s.lines[s.lines.length - 1]) s.lines.pop();
      while (s.lines.length && !s.lines[0]) s.lines.shift();
    }
    // Um título vazio logo no topo ("## Reunião X — Cliente") é o título do documento.
    const top = sections[0];
    if (top && !top.lines.length && top.auto !== 'checklist' && !meta.titulo) {
      const [t, c] = top.titulo.split(/\s+[—–-]\s+/);
      meta.titulo = t;
      if (c && !meta.cliente) meta.cliente = c;
    }
    const real = groupChecklists(sections).filter((s) => s.lines.length);
    for (const s of real) s.auto = s.auto || (s.lines.some((l) => l.startsWith('• ')) ? 'cards' : 'texto');
    return { meta, sections: real };
  }

  /* "CHECKLIST FINAL" + "Responsabilidades do Cliente" + "Responsabilidades do Time"
     viram UM bloco de ações, com uma coluna por subtítulo. */
  function groupChecklists(sections) {
    const has = (s) => s && s.auto === 'checklist' && s.lines.some(Boolean);
    const out = [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const parent = s.auto === 'checklist' && !s.lines.some(Boolean) ? s : null;
      let j = parent ? i + 1 : i;
      const cols = [];
      while (has(sections[j])) cols.push(sections[j++]);
      if (s.auto === 'checklist' && (cols.length >= 2 || (parent && cols.length))) {
        out.push({
          id: s.id,
          titulo: parent ? parent.titulo : 'Próximos passos',
          auto: 'checklist',
          lines: cols.flatMap((c) => c.lines),
          cols: cols.map((c) => ({ titulo: c.titulo, lines: c.lines })),
        });
        i = j - 1;
        continue;
      }
      out.push(s);
    }
    return out;
  }

  /* "Ação — responsável — prazo", "Responsável: ação (25/10)", "Ação — sem prazo definido." */
  function parseAction(l, knownResp) {
    let line = l.replace(/\.\s*$/, '');
    let parts = line.split(SEP).map((x) => x.trim()).filter(Boolean);
    let acao = parts.shift() || line, resp = '', prazo = '';
    if (!parts.length) {
      const par = acao.match(/\s*\(([^)]+)\)$/);
      if (par) { acao = acao.slice(0, par.index); parts = par[1].split(/\s*[,;]\s*/); }
    }
    if (!knownResp) {
      const pre = acao.match(/^([^:]{2,28}):\s+(.+)$/);
      if (pre) { resp = pre[1]; acao = pre[2]; }
    }
    for (const p of parts) {
      if (NO_DATE.test(p)) continue;
      if (!prazo && DATE_LIKE.test(p)) prazo = p;
      else if (!resp && !knownResp && p.length <= 32) resp = p;
    }
    return { t: cap(acao.trim()), tag: prazo, resp };
  }

  const items = (s) => s.lines.filter(Boolean).map((l) => l.replace(/^•\s*/, ''));

  /* seção + tipo -> bloco */
  function build(s, tipo) {
    const titulo = s.titulo;
    const it = items(s);
    if (tipo === 'metricas' || tipo === 'meta' || tipo === 'destaque') {
      const out = [];
      for (const l of it) {
        const parts = l.split(/\s*:\s+|\s+[—–-]\s+|\s*\|\s*/).map((x) => x.trim()).filter(Boolean);
        let valor, rotulo;
        if (parts.length >= 2) {
          const [a, b] = [parts[0], parts.slice(1).join(' — ')];
          if (VALUE_LIKE.test(b) || (/\d/.test(b) && b.length <= 18 && !/\d/.test(a))) { valor = b; rotulo = a; }
          else if (VALUE_LIKE.test(a) || (/\d/.test(a) && a.length <= 18)) { valor = a; rotulo = b; }
        } else {
          const NUM = '((?:R\\$\\s?)?[+\\-]?\\d[\\d.,]*\\s?(?:%|x|k|mil|mi|milh[ãa]o|milh[õo]es)?)';
          const m = l.match(new RegExp('^' + NUM + '\\s+(.+)$', 'i'));
          const n = !m && l.match(new RegExp('^(.+?)\\s+' + NUM + '$', 'i'));
          if (m) { valor = m[1]; rotulo = m[2]; }
          else if (n) { valor = n[2]; rotulo = n[1]; }
        }
        if (!valor) return build(s, 'cards');
        out.push({ valor, rotulo: cap(rotulo) });
      }
      return { tipo, titulo, itens: out };
    }
    if (tipo === 'checklist') {
      if (s.cols) {
        const colunas = s.cols.map((c) => ({
          titulo: cap(c.titulo.replace(/^responsabilidades?\s+(?:d[aoe]s?\s+)?/i, '')),
          itens: items(c).map((l) => parseAction(l, true)),
        }));
        return { tipo, titulo, colunas };
      }
      const groups = new Map();
      for (const l of it) {
        const a = parseAction(l, false);
        const key = a.resp || 'A definir';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(a);
      }
      const keys = [...groups.keys()];
      const colunas = keys.length === 1 && keys[0] === 'A definir'
        ? [{ titulo: 'Ações', itens: groups.get(keys[0]) }]
        : keys.map((k) => ({ titulo: k, itens: groups.get(k) }));
      return { tipo, titulo, colunas };
    }
    if (tipo === 'atencao') return { tipo, titulo, itens: it.map(cap) };
    if (tipo === 'cards') {
      const cards = [];
      for (const l of it) {
        const m = l.match(/^([^:.]{3,48}):\s+(.+)$/);
        if (m) cards.push({ titulo: cap(m[1]), texto: cap(m[2]) });
        else cards.push({ titulo: '', texto: cap(l) });
      }
      return { tipo, titulo, itens: cards };
    }
    const paras = s.lines.join('\n').split(/\n{2,}/).map((p) => p.replace(/^•\s*/gm, '').replace(/\n/g, ' ').trim()).filter(Boolean);
    return { tipo: 'texto', titulo, paras };
  }

  /* ---------- HTML do PDF ---------- */
  const H2 = (t) => (t ? `<h2>${esc(t)}</h2>` : '');
  const stat = (m, cls) => `<div class="${cls}"><b>${esc(m.valor)}</b><span>${esc(m.rotulo)}</span></div>`;

  function renderBlock(b) {
    switch (b.tipo) {
      case 'texto':
        return `<section>${H2(b.titulo)}${b.paras.map((p) => `<p class="lead">${esc(p)}</p>`).join('')}</section>`;
      case 'metricas':
        return `<section class="keep">${H2(b.titulo)}<div class="grid3">${b.itens.map((m) => stat(m, 'metric')).join('')}</div></section>`;
      case 'meta':
        return `<section class="keep">${H2(b.titulo)}<div class="grid2">${b.itens.map((m) => stat(m, 'goal')).join('')}</div></section>`;
      case 'destaque':
        return `<section class="keep">${H2(b.titulo)}<div class="grid2">${b.itens.map((m) => stat(m, 'band')).join('')}</div></section>`;
      case 'cards':
        return `<section>${H2(b.titulo)}${b.itens.map((c, i) => `<div class="card"><i>${String(i + 1).padStart(2, '0')}</i><div>${c.titulo ? `<h3>${esc(c.titulo)}</h3>` : ''}<p>${esc(c.texto)}</p></div></div>`).join('')}</section>`;
      case 'atencao':
        return `<section class="keep attn">${H2(b.titulo)}<ul>${b.itens.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
      case 'checklist': {
        // Listas curtas ficam inteiras na mesma página; longas começam numa página nova, como no template original.
        const total = b.colunas.reduce((n, c) => n + c.itens.length, 0);
        return `<section class="${total <= 14 ? 'keep' : 'pbreak'}">${H2(b.titulo)}<div class="cols">${b.colunas.map((c) => `<div class="col"><h3>${esc(c.titulo)}</h3><ul>${c.itens.map((i) => `<li><span class="box"></span><div>${esc(i.t)}${i.tag ? ` <em>${esc(i.tag)}</em>` : ''}</div></li>`).join('')}</ul></div>`).join('')}</div></section>`;
      }
    }
    return '';
  }

  const font = (n) => (root.BM_FONTS && root.BM_FONTS[n]) || `assets/fonts/${n}.woff`;
  const FONT_CSS = () => `
@font-face{font-family:Montserrat;font-weight:400;src:url(${font('montserrat-latin-400-normal')})}
@font-face{font-family:Montserrat;font-weight:600;src:url(${font('montserrat-latin-600-normal')})}
@font-face{font-family:Montserrat;font-weight:700;src:url(${font('montserrat-latin-700-normal')})}
@font-face{font-family:Playfair;font-weight:400;src:url(${font('playfair-display-latin-400-normal')})}
@font-face{font-family:Playfair;font-style:italic;font-weight:400;src:url(${font('playfair-display-latin-400-italic')})}
@font-face{font-family:Hanken;font-weight:700;src:url(${font('hanken-grotesk-latin-700-normal')})}`;

  const PDF_CSS = `
:root{--brown:#876047;--deep:#662900;--text:#94430D;--olive:#6C6948;--beige:#CABDAA;--sand:#DFD2C1;--cream:#FFF8EF;--off:#F7F6F1;--dark:#1B1B13;--gold:#DFB956}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
@page{size:A4;margin:16mm 0 20mm;background:var(--cream);
 @bottom-left{content:"@BMIDIADIGITAIS";font:600 7pt Montserrat;letter-spacing:.15em;color:var(--brown);margin-left:18mm}
 @bottom-right{content:counter(page) " / " counter(pages);font:600 7pt Montserrat;color:var(--brown);margin-right:18mm}}
@page:first{margin-top:0}
html{background:var(--cream)}
body{margin:0;font:400 9.5pt/1.55 Montserrat;color:var(--dark);background:var(--cream)}
header{background:var(--brown);color:var(--cream);padding:15mm 18mm 13mm;position:relative}
header::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3mm;background:var(--olive)}
header img{height:14mm;display:block}
.kicker{margin-top:10mm;font:600 8pt Montserrat;letter-spacing:.22em;text-transform:uppercase;color:var(--cream)}
h1{font:400 32pt/1.02 Playfair;margin:3mm 0 0;color:var(--cream)}
h1 i{font-style:italic;color:var(--sand)}
.meta{display:flex;gap:14mm;margin-top:6mm}
.meta div{font-size:8.5pt;color:var(--cream)}
.meta b{display:block;font:700 7pt Montserrat;letter-spacing:.16em;text-transform:uppercase;color:var(--cream);opacity:.92;margin-bottom:1mm}
main{padding:10mm 18mm 0}
section{margin-bottom:8mm}
.keep{break-inside:avoid}
.pbreak{break-before:page}
h2{font:400 16pt Playfair;color:var(--deep);margin:0 0 3.5mm;padding-bottom:2mm;border-bottom:.4mm solid var(--beige);break-after:avoid}
p{margin:0;color:#3a2a20}
.lead{font-size:10.5pt;line-height:1.6}
.lead+.lead{margin-top:3mm}
.grid3,.grid2{display:flex;flex-wrap:wrap;gap:3.5mm}
.grid3 .metric{width:calc(33.33% - 2.4mm)}
.grid2>div{width:calc(50% - 1.8mm)}
.metric{background:var(--brown);color:var(--cream);padding:5mm 4.5mm;border-radius:2mm}
.metric b{display:block;font:700 17pt Hanken;color:var(--cream)}
.metric span,.goal span{display:block;font-size:7.8pt;line-height:1.4;margin-top:1mm}
.metric span{color:var(--cream)}
.goal{background:var(--off);border:.4mm solid var(--brown);padding:5mm;border-radius:2mm}
.goal b{font:700 18pt Hanken;color:var(--deep)}
.goal span{color:var(--text)}
.band{background:var(--deep);color:var(--cream);padding:5mm;border-radius:2mm}
.band b{display:block;font:700 18pt Hanken;color:var(--gold)}
.band span{display:block;font-size:7.8pt;line-height:1.4;margin-top:1mm;color:var(--cream)}
.card{display:flex;gap:5mm;padding:3.8mm 0;border-bottom:.2mm solid var(--sand);break-inside:avoid}
.card i{font:400 italic 17pt Playfair;color:var(--brown);width:11mm;flex:none;line-height:1}
.card h3{font:700 9.5pt Montserrat;color:var(--deep);margin:0 0 1mm}
.attn ul{margin:0;padding:0;list-style:none}
.attn li{background:#F3E6C9;padding:3.5mm 5mm;margin-bottom:2.5mm;border-radius:2mm;color:#4a3a1c;break-inside:avoid;box-shadow:inset 0 -.6mm 0 var(--gold)}
.cols{display:flex;gap:6mm;align-items:flex-start}
.col{flex:1;min-width:0}
.col h3{background:var(--deep);color:var(--cream);font:700 7.5pt Montserrat;letter-spacing:.12em;text-transform:uppercase;padding:3mm 4mm;margin:0;border-radius:2mm 2mm 0 0;break-after:avoid}
.col:nth-child(2n) h3{background:var(--olive)}
.col ul{margin:0;padding:0;list-style:none;background:var(--off);border-radius:0 0 2mm 2mm}
.col li{display:flex;gap:3mm;padding:3mm 4mm;border-bottom:.2mm solid var(--sand);font-size:8.8pt;line-height:1.45;break-inside:avoid}
.box{flex:none;width:3.4mm;height:3.4mm;border:.4mm solid var(--brown);border-radius:.8mm;margin-top:.5mm}
.col em{display:inline-block;font:700 6.5pt Montserrat;font-style:normal;letter-spacing:.08em;text-transform:uppercase;background:var(--gold);color:var(--deep);padding:.6mm 2mm;border-radius:5mm;white-space:nowrap}
`;

  function titleHtml(t) {
    const words = esc(t).split(' ');
    if (words.length > 1) words[words.length - 1] = `<i>${words[words.length - 1]}</i>`;
    return words.join(' ');
  }

  function buildDoc(d, base) {
    const body = d.blocos.map(renderBlock).join('');
    const parts = (d.participantes || []).map(esc).join('<br>');
    const metaBits = [d.data ? `<div><b>Data</b>${esc(d.data)}</div>` : '', parts ? `<div><b>Participantes</b>${parts}</div>` : ''].join('');
    const nome = `${d.titulo || 'Resumo da reunião'} — ${d.cliente || 'BMidia'}${d.data ? ' — ' + d.data.replace(/\//g, '-') : ''}`;
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><base href="${base}"><title>${esc(nome)}</title><style>${FONT_CSS()}${PDF_CSS}</style></head><body>
<header><img src="assets/logos/bmidia-logo-bege.png" alt="BMidia Digitais">
${d.cliente ? `<div class="kicker">${esc(d.cliente)}</div>` : ''}
<h1>${titleHtml(d.titulo || 'Resumo da reunião')}</h1>
${metaBits ? `<div class="meta">${metaBits}</div>` : ''}</header>
<main>${body}</main></body></html>`;
  }

  /* JSON vindo da IA (formato do resumo-kellen.json) -> resumo seguro para desenhar.
     Tudo que não for do formato é descartado; textos longos são cortados. */
  function sanitize(o) {
    o = o && typeof o === 'object' ? o : {};
    const S = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : typeof v === 'number' ? String(v) : '');
    const list = (v) => (Array.isArray(v) ? v : []);
    const stats = (v) => list(v).map((m) => ({ valor: S(m && m.valor, 40), rotulo: S(m && m.rotulo, 180) })).filter((m) => m.valor).slice(0, 9);
    const blocos = [];
    for (const b of list(o.blocos).slice(0, 16)) {
      if (!b || !TIPOS[b.tipo]) continue;
      const titulo = S(b.titulo, 90);
      let out = null;
      if (b.tipo === 'texto') {
        const paras = (Array.isArray(b.paras) ? b.paras : S(b.texto, 5000).split(/\n{2,}/)).map((p) => S(p, 2500)).filter(Boolean);
        if (paras.length) out = { tipo: 'texto', titulo, paras };
      } else if (b.tipo === 'metricas' || b.tipo === 'meta' || b.tipo === 'destaque') {
        const itens = stats(b.itens);
        if (itens.length) out = { tipo: b.tipo, titulo, itens };
      } else if (b.tipo === 'cards') {
        const itens = list(b.itens).map((c) => (typeof c === 'string' ? { titulo: '', texto: S(c, 900) } : { titulo: S(c && c.titulo, 90), texto: S(c && c.texto, 900) })).filter((c) => c.texto).slice(0, 20);
        if (itens.length) out = { tipo: 'cards', titulo, itens };
      } else if (b.tipo === 'atencao') {
        const itens = list(b.itens).map((x) => S(x, 600)).filter(Boolean).slice(0, 12);
        if (itens.length) out = { tipo: 'atencao', titulo, itens };
      } else if (b.tipo === 'checklist') {
        const colunas = list(b.colunas).map((c) => ({
          titulo: S(c && c.titulo, 60),
          itens: list(c && c.itens).map((i) => {
            const t = typeof i === 'string' ? S(i, 400) : S(i && i.t, 400);
            const tag = typeof i === 'string' ? '' : S(i && i.tag, 40);
            return { t, tag: NO_DATE.test(tag) ? '' : tag };
          }).filter((i) => i.t).slice(0, 20),
        })).filter((c) => c.itens.length).slice(0, 3);
        if (colunas.length) out = { tipo: 'checklist', titulo, colunas };
      }
      if (out) blocos.push(out);
    }
    return {
      cliente: S(o.cliente, 90),
      titulo: S(o.titulo, 90),
      data: S(o.data, 30),
      participantes: list(o.participantes).map((p) => S(p, 90)).filter(Boolean).slice(0, 12),
      blocos,
    };
  }

  root.BM = { TIPOS, parse, build, buildDoc, sanitize };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.BM;
})();
