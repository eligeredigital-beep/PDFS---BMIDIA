/* Gerador de resumos — interface. Depende de engine.js (window.BM). */
(function () {
  const $ = (id) => document.getElementById(id);
  const src = $('src'), frame = $('doc'), wrap = $('wrap'), stage = $('stage');
  const q = [$('q1'), $('q2'), $('q3'), $('q4')];
  let mode = 'parts'; // 'parts' (4 quadros) ou 'single' (texto único)

  /* Cada quadro vira uma seção do modelo. Se a pessoa não colou o título da seção, ele é acrescentado. */
  const PARTES = [
    null, // 1: cabeçalho + objetivo: vem completo, com os próprios títulos
    { re: /^\W*(principais\s+alinhamentos|alinhamentos|decis[õo]es)/i, titulo: 'Principais alinhamentos' },
    { re: /^\W*(pontos?\s+de\s+aten[cç][aã]o|aten[cç][aã]o|riscos|alertas)/i, titulo: 'Pontos de atenção' },
    { re: /^\W*(check-?list|pr[oó]ximos\s+passos|a[cç][õo]es)/i, titulo: 'Checklist final' },
  ];
  function partText(i, v) {
    v = (v || '').trim();
    if (!v) return '';
    const p = PARTES[i];
    if (!p) return v;
    const first = v.split('\n').find((l) => l.trim()) || '';
    const semEmoji = first.replace(/^[\p{Extended_Pictographic}‍️\s]+/u, '');
    return p.re.test(semEmoji.replace(/[*_#]/g, '')) ? v : `## ${p.titulo}\n\n${v}`;
  }
  const getText = () => (mode === 'parts' ? q.map((el, i) => partText(i, el.value)).filter(Boolean).join('\n\n') : src.value);
  const fields = { cliente: $('cliente'), data: $('data'), titulo: $('titulo'), participantes: $('participantes') };
  const dirty = {};
  let overrides = {};
  let docHeight = 1123;

  // Exemplo no modelo de resumo, um texto por quadro (cliente fictício).
  const SAMPLE_PARTES = [
`*Resumo da Reunião – Doce Ateliê Confeitaria (Maria)*

📅 *Data:* 21/10/2026
👥 *Participantes:* Riziel, Maria

🎯 *Objetivo da Reunião*

Fazer o balanço dos primeiros 30 dias de campanhas e alinhar o cardápio digital.`,
`🔑 *Principais Alinhamentos*

• Campanhas iniciadas em 24/09: investimento de R$ 1.015 sem impostos (R$ 1.139 com impostos), abaixo do combinado por pausas na troca de cardápio.

• Resultado do período: 59 conversas no WhatsApp e alcance de mais de 26.000 pessoas.

• Melhor criativo: vídeos da Maria montando o bolo (18 conversas, custo de R$ 9,95 por mensagem).

• Entrega: começa com entregador do bairro e, na falta dele, entrega sob demanda.`,
`⚠️ *Pontos de Atenção*

• Falta de tempo da Maria para produzir conteúdo é o principal gargalo.

• Frete alto na entrega sob demanda faz clientes desistirem.`,
`✅ *CHECKLIST FINAL*

🧑‍💼 *Responsabilidades do Cliente*

• Gravar mais vídeos de bolos para stories e feed — sem prazo definido.

• Retornar ao Riziel sobre o cardápio — hoje (21/10).

🧑‍💻 *Responsabilidades do Time / Gestores*

• Subir os criativos nas campanhas — hoje ou amanhã (21/10 ou 22/10).

• Enviar vídeo explicando as respostas rápidas do WhatsApp — sem prazo definido.`,
  ];

  const today = () => new Date().toLocaleDateString('pt-BR');
  const store = {
    get(k) { try { return localStorage.getItem('bm-resumo:' + k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem('bm-resumo:' + k, v); } catch {} },
  };

  let toastT;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 5200);
  }

  const ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const ICON_UNDO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2"/></svg>';

  function countLabel(s) {
    if (s.ai) {
      const b = s.ai;
      const n = b.paras ? b.paras.length : b.colunas ? b.colunas.reduce((t, c) => t + c.itens.length, 0) : b.itens.length;
      return b.paras ? (n === 1 ? '1 parágrafo' : n + ' parágrafos') : n === 1 ? '1 item' : n + ' itens';
    }
    const n = s.lines.filter(Boolean).length;
    return n === 1 ? '1 linha' : n + ' linhas';
  }

  // Resultado da IA: vale enquanto o texto colado for o mesmo que foi enviado.
  let ai = null;
  try {
    const saved = JSON.parse(store.get('ai') || 'null');
    if (saved && saved.text && saved.resumo) ai = { text: saved.text, resumo: BM.sanitize(saved.resumo), modelo: saved.modelo };
  } catch {}
  const aiCurrent = () => ai && ai.text === getText();

  function renderSecs(sections) {
    const ol = $('secs');
    $('secs-empty').hidden = sections.length > 0;
    const focusedId = document.activeElement?.closest?.('.sec')?.dataset.id;
    ol.innerHTML = '';
    for (const s of sections) {
      const tipo = overrides[s.id] || s.auto;
      const off = tipo === 'omitir';
      const li = document.createElement('li');
      li.className = 'sec' + (off ? ' off' : '');
      li.dataset.id = s.id;
      const opts = Object.entries(BM.TIPOS).map(([k, v]) => `<option value="${k}"${k === tipo ? ' selected' : ''}>${v}</option>`).join('');
      li.innerHTML = `<div class="sec-name"></div>
        <select aria-label="Formato da seção"${off || s.ai ? ' disabled' : ''}${s.ai ? ' title="Formato escolhido pela IA"' : ''}>${opts}</select>
        <button class="icon-btn" aria-label="${off ? 'Incluir seção de novo' : 'Tirar seção do PDF'}" title="${off ? 'Incluir de novo' : 'Tirar do PDF'}">${off ? ICON_UNDO : ICON_X}</button>`;
      const name = li.querySelector('.sec-name');
      name.textContent = s.titulo;
      const c = document.createElement('span');
      c.className = 'sec-count';
      c.textContent = off ? 'Fora do PDF' : countLabel(s);
      name.append(c);
      li.querySelector('select').addEventListener('change', (e) => { overrides[s.id] = e.target.value; update(); });
      li.querySelector('button').addEventListener('click', () => {
        overrides[s.id] = off ? s.auto : 'omitir';
        update();
        ol.querySelector(`[data-id="${CSS.escape(s.id)}"] button`)?.focus();
      });
      ol.append(li);
    }
    if (focusedId) ol.querySelector(`[data-id="${CSS.escape(focusedId)}"] select`)?.focus();
  }

  function fitPaper() {
    if (!stage.clientWidth) return; // painel escondido (aba Texto no celular)
    const doc = frame.contentDocument;
    const avail = stage.clientWidth - parseFloat(getComputedStyle(stage).paddingLeft) * 2;
    const scale = Math.min(1, avail / 794);
    if (doc && doc.body) {
      // Mede a altura real da página (sem redução) para contar as páginas.
      doc.documentElement.style.zoom = '';
      doc.documentElement.style.overflow = 'hidden'; // a página rola no painel, não dentro dela
      frame.style.width = '794px';
      frame.style.height = '0px';
      const h = doc.documentElement.scrollHeight;
      docHeight = Math.max(1123, h);
      // A4 útil ≈ 297mm − margens (16 + 20mm) ≈ 986px por página; a 1ª não tem margem de topo.
      const pages = h <= 1047 ? 1 : Math.ceil((h - 1047) / 986) + 1;
      $('pages').textContent = pages === 1 ? '1 página' : `cerca de ${pages} páginas`;
      // Reduz com zoom (o navegador redesenha o texto nítido) em vez de transform (que embaça).
      doc.documentElement.style.zoom = String(scale);
    }
    frame.style.width = 794 * scale + 'px';
    frame.style.height = docHeight * scale + 'px';
    wrap.style.width = 794 * scale + 'px';
    wrap.style.height = docHeight * scale + 'px';
  }

  let renderT;
  /* O que cada quadro entendeu, mostrado assim que a pessoa cola. */
  function partStatus() {
    const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
    q.forEach((el, i) => {
      const s = $('s' + (i + 1));
      const txt = partText(i, el.value);
      s.className = 'part-status';
      if (!txt) { s.textContent = ''; return; }
      const { meta, sections } = BM.parse(txt);
      let msg = '';
      if (i === 0) {
        const got = [meta.cliente && 'cliente', meta.data && 'data', meta.participantes && plural(meta.participantes.length, 'participante', 'participantes')].filter(Boolean);
        const obj = sections.some((x) => x.auto === 'texto');
        msg = [got.join(', '), obj && 'objetivo'].filter(Boolean).join(' · ');
        if (!msg) { s.textContent = 'Não achei cliente, data nem objetivo'; return; }
      } else {
        const sec = sections.find((x) => x.lines.some(Boolean));
        if (!sec) { s.textContent = 'Não achei itens'; return; }
        const b = BM.build(sec, i === 3 ? 'checklist' : i === 2 ? 'atencao' : 'cards');
        const n = b.itens ? b.itens.length : b.colunas.reduce((t, c) => t + c.itens.length, 0);
        msg = i === 3 ? `${plural(n, 'item', 'itens')} em ${plural(b.colunas.length, 'coluna', 'colunas')}` : plural(n, 'item', 'itens');
      }
      s.textContent = '✓ ' + msg;
      s.classList.add('ok');
    });
  }

  /* Texto único: mostra as mesmas 4 partes dos quadros, achadas dentro do texto colado. */
  function singleStatus(text) {
    const ul = $('single-status');
    ul.innerHTML = '';
    if (!text.trim()) return;
    const { meta, sections, blocos } = BM.parse(text);
    const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
    const conta = (tipo) => {
      const s = sections.find((x) => x.auto === tipo && x.lines.some(Boolean));
      if (!s) return '';
      const b = BM.build(s, tipo);
      return tipo === 'checklist'
        ? `${plural(b.colunas.reduce((t, c) => t + c.itens.length, 0), 'item', 'itens')} em ${plural(b.colunas.length, 'coluna', 'colunas')}`
        : plural(b.itens.length, 'item', 'itens');
    };
    const cab = [meta.cliente && 'cliente', meta.data && 'data', meta.participantes && 'participantes', sections.some((x) => x.auto === 'texto') && 'objetivo'].filter(Boolean).join(', ');
    const linhas = [['1. Cabeçalho e objetivo', cab], ['2. Principais alinhamentos', conta('cards')], ['3. Pontos de atenção', conta('atencao')], ['4. Checklist final', conta('checklist')]];
    for (const [nome, v] of linhas) {
      const li = document.createElement('li');
      li.innerHTML = '<b></b><span></span>';
      li.firstChild.textContent = nome;
      li.lastChild.textContent = v ? '✓ ' + v : 'não encontrado';
      if (v) li.lastChild.className = 'ok';
      ul.append(li);
    }
    if (blocos.length) {
      const li = document.createElement('li');
      li.className = 'aviso';
      li.textContent = 'Parte do texto veio sem quebras de linha, então separei os itens por frase. “Organizar com IA” separa por assunto; para ficar idêntico ao original, cole com as quebras de linha.';
      ul.append(li);
    }
  }

  function update() {
    const text = getText();
    store.set('text', src.value);
    store.set('parts', JSON.stringify(q.map((el) => el.value)));
    store.set('mode', mode);
    if (mode === 'parts') partStatus(); else singleStatus(text);
    const useAi = aiCurrent();
    let meta, sections;
    if (useAi) {
      meta = ai.resumo;
      sections = ai.resumo.blocos.map((b, i) => ({ id: 'ai:' + i, titulo: b.titulo || BM.TIPOS[b.tipo], auto: b.tipo, ai: b }));
    } else {
      ({ meta, sections } = BM.parse(text));
    }
    renderAiStatus();

    // Campos que a pessoa não editou acompanham o texto colado.
    for (const k of ['cliente', 'data', 'titulo']) if (!dirty[k]) fields[k].value = meta[k] || '';
    if (!dirty.participantes) fields.participantes.value = (meta.participantes || []).join('\n');
    if (!fields.data.value) fields.data.value = today();

    renderSecs(sections);
    const has = text.trim().length > 0;
    $('empty').hidden = has;
    wrap.hidden = !has;
    $('download').disabled = !has;
    if (!has) { $('pages').textContent = ''; return; }

    // Mesmos títulos fixos do modelo, com ou sem IA.
    const blocos = BM.sanitize({ blocos: sections.filter((s) => (overrides[s.id] || s.auto) !== 'omitir').map((s) => s.ai || BM.build(s, overrides[s.id] || s.auto)) }).blocos;
    const d = {
      cliente: fields.cliente.value.trim(),
      data: fields.data.value.trim(),
      titulo: fields.titulo.value.trim() || 'Resumo da reunião',
      participantes: fields.participantes.value.split('\n').map((x) => x.trim()).filter(Boolean),
      blocos,
    };
    const base = new URL('.', location.href).href;
    wrap.classList.add('busy');
    clearTimeout(renderT);
    renderT = setTimeout(() => { frame.srcdoc = BM.buildDoc(d, base); }, 120);
  }

  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    const measure = () => {
      fitPaper();
      wrap.classList.remove('busy');
    };
    doc.fonts ? doc.fonts.ready.then(measure) : measure();
  });

  $('download').addEventListener('click', () => {
    if (!frame.contentWindow) return;
    toast('Na janela que abrir, escolha “Salvar como PDF” como destino.');
    const root = frame.contentDocument.documentElement;
    const zoom = root.style.zoom;
    root.style.zoom = ''; // o PDF sai em tamanho real, não no zoom da prévia
    frame.contentWindow.focus();
    frame.contentWindow.print();
    root.style.zoom = zoom;
  });

  function renderAiStatus() {
    const st = $('ai-status');
    if (aiCurrent()) st.textContent = `Organizado pela IA (${(ai.modelo || '').split('/').pop()}). Confira antes de baixar.`;
    else if (ai && getText().trim()) st.textContent = 'O texto mudou desde a última organização. Organize de novo para atualizar.';
    else st.textContent = 'Sem IA, o texto é lido pelos títulos e marcadores.';
  }

  const aiBtn = $('ai');
  async function organize() {
    const texto = getText();
    if (!texto.trim()) { toast('Cole o texto da reunião primeiro.'); (mode === 'parts' ? q[0] : src).focus(); return; }
    aiBtn.disabled = true;
    aiBtn.classList.add('loading');
    aiBtn.querySelector('.lbl').textContent = 'Organizando…';
    wrap.classList.add('busy');
    try {
      const headers = { 'Content-Type': 'application/json' };
      const code = store.get('code');
      if (code) headers['x-access-code'] = code;
      const r = await fetch('/api/resumo', { method: 'POST', headers, body: JSON.stringify({ texto }) });
      if (r.status === 401) {
        const c = prompt(code ? 'Código de acesso incorreto. Digite de novo:' : 'Digite o código de acesso do gerador:');
        if (c) { store.set('code', c.trim()); return organize(); }
        throw new Error('Sem o código de acesso, a IA não pode ser usada.');
      }
      if (r.status === 404 || r.status === 405) throw new TypeError('sem função');
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || !j.resumo) throw new Error((j && j.erro) || `Erro ${r.status} ao organizar o resumo.`);
      ai = { text: texto, resumo: BM.sanitize(j.resumo), modelo: j.modelo };
      store.set('ai', JSON.stringify(ai));
      overrides = {};
      update();
      setTab('preview');
      toast('Resumo organizado pela IA. Confira os números antes de baixar.');
    } catch (e) {
      wrap.classList.remove('busy');
      toast(location.protocol === 'file:' || e instanceof TypeError
        ? 'A IA só funciona pelo endereço da Vercel. Aberto direto do computador, o app usa a leitura automática.'
        : e.message);
    } finally {
      aiBtn.disabled = false;
      aiBtn.classList.remove('loading');
      aiBtn.querySelector('.lbl').textContent = 'Organizar com IA';
    }
  }
  aiBtn.addEventListener('click', organize);

  function setMode(m) {
    mode = m;
    $('parts').hidden = m !== 'parts';
    $('single').hidden = m !== 'single';
    $('m-parts').setAttribute('aria-selected', String(m === 'parts'));
    $('m-single').setAttribute('aria-selected', String(m === 'single'));
  }
  $('m-parts').addEventListener('click', () => { setMode('parts'); update(); });
  $('m-single').addEventListener('click', () => { setMode('single'); update(); });

  const resetAll = () => {
    for (const k in fields) { fields[k].value = ''; dirty[k] = false; }
    overrides = {};
    ai = null;
    store.set('ai', '');
  };
  const loadSample = () => {
    resetAll();
    q.forEach((el, i) => { el.value = SAMPLE_PARTES[i]; });
    setMode('parts');
    update();
    setTab('preview');
  };
  $('sample').addEventListener('click', loadSample);
  $('sample2').addEventListener('click', loadSample);
  $('clear').addEventListener('click', () => {
    resetAll();
    src.value = '';
    q.forEach((el) => { el.value = ''; });
    update();
    (mode === 'parts' ? q[0] : src).focus();
  });

  let inputT;
  for (const el of [src, ...q]) el.addEventListener('input', () => { clearTimeout(inputT); inputT = setTimeout(update, 250); });
  for (const [k, el] of Object.entries(fields)) {
    el.addEventListener('input', () => { dirty[k] = el.value.trim() !== ''; clearTimeout(inputT); inputT = setTimeout(update, 250); });
  }

  function setTab(tab) {
    document.body.dataset.tab = tab;
    document.querySelectorAll('.bar-tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    requestAnimationFrame(fitPaper);
  }
  document.querySelectorAll('.bar-tabs button').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));

  new ResizeObserver(fitPaper).observe(stage);
  setTab('edit');
  src.value = store.get('text') || '';
  try { (JSON.parse(store.get('parts') || '[]') || []).slice(0, 4).forEach((v, i) => { q[i].value = String(v || ''); }); } catch {}
  setMode(store.get('mode') === 'single' ? 'single' : 'parts');
  update();
})();
