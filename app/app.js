/* Gerador de resumos — interface. Depende de engine.js (window.BM). */
(function () {
  const $ = (id) => document.getElementById(id);
  const src = $('src'), frame = $('doc'), wrap = $('wrap'), stage = $('stage');
  const fields = { cliente: $('cliente'), data: $('data'), titulo: $('titulo'), participantes: $('participantes') };
  const dirty = {};
  let overrides = {};
  let docHeight = 1123;

  const SAMPLE = `Cliente: Doce Ateliê Confeitaria
Data: 21/10/2026
Participantes: Riziel Francys — Gestor de tráfego; Maria Souza — Proprietária

Contexto:
Alinhamento mensal para revisar os resultados das campanhas de tráfego pago de setembro e definir as ações do próximo ciclo, com foco nas encomendas de fim de ano.

Resultados:
- Faturamento atribuído: R$ 42 mil
- Retorno sobre o investimento: 8,4x
- Pedidos no período: 312

Decisões:
- Orçamento: aumentar em 20% o diário das campanhas de melhor desempenho
- Criativos: testar novos vídeos com foco nos kits de Natal
- Remarketing: manter o público ativo durante todo o mês

Metas para novembro:
- Faturamento: R$ 55 mil
- Pedidos: 400

Atenção:
- Qualquer ajuste de orçamento será comunicado antes de ser aplicado
- Fotos dos novos produtos precisam chegar até 24/10 para não atrasar as campanhas

Próximos passos:
- Subir novos criativos em Reels — BMidia — 25/10
- Ajustar públicos de remarketing — BMidia — 26/10
- Enviar fotos dos kits de Natal — Cliente — 24/10
- Confirmar preços da tabela de fim de ano — Cliente — 28/10`;

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
  const aiCurrent = () => ai && ai.text === src.value;

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
    if (doc && doc.body) {
      frame.style.height = '0px';
      const h = doc.documentElement.scrollHeight;
      docHeight = Math.max(1123, h);
      // A4 útil ≈ 297mm − margens (16 + 20mm) ≈ 986px por página; a 1ª não tem margem de topo.
      const pages = h <= 1047 ? 1 : Math.ceil((h - 1047) / 986) + 1;
      $('pages').textContent = pages === 1 ? '1 página' : `cerca de ${pages} páginas`;
    }
    const avail = stage.clientWidth - parseFloat(getComputedStyle(stage).paddingLeft) * 2;
    const scale = Math.min(1, avail / 794);
    frame.style.height = docHeight + 'px';
    frame.style.transform = `scale(${scale})`;
    wrap.style.width = 794 * scale + 'px';
    wrap.style.height = docHeight * scale + 'px';
  }

  let renderT;
  function update() {
    const text = src.value;
    store.set('text', text);
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

    const blocos = sections.filter((s) => (overrides[s.id] || s.auto) !== 'omitir').map((s) => s.ai || BM.build(s, overrides[s.id] || s.auto));
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
    frame.contentWindow.focus();
    frame.contentWindow.print();
  });

  function renderAiStatus() {
    const st = $('ai-status');
    if (aiCurrent()) st.textContent = `Organizado pela IA (${(ai.modelo || '').split('/').pop()}). Confira antes de baixar.`;
    else if (ai && src.value.trim()) st.textContent = 'O texto mudou desde a última organização. Organize de novo para atualizar.';
    else st.textContent = 'Sem IA, o texto é lido pelos títulos e marcadores.';
  }

  const aiBtn = $('ai');
  async function organize() {
    if (!src.value.trim()) { toast('Cole o texto da reunião primeiro.'); src.focus(); return; }
    aiBtn.disabled = true;
    aiBtn.classList.add('loading');
    aiBtn.querySelector('.lbl').textContent = 'Organizando…';
    wrap.classList.add('busy');
    try {
      const headers = { 'Content-Type': 'application/json' };
      const code = store.get('code');
      if (code) headers['x-access-code'] = code;
      const r = await fetch('/api/resumo', { method: 'POST', headers, body: JSON.stringify({ texto: src.value }) });
      if (r.status === 401) {
        const c = prompt(code ? 'Código de acesso incorreto. Digite de novo:' : 'Digite o código de acesso do gerador:');
        if (c) { store.set('code', c.trim()); return organize(); }
        throw new Error('Sem o código de acesso, a IA não pode ser usada.');
      }
      if (r.status === 404 || r.status === 405) throw new TypeError('sem função');
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || !j.resumo) throw new Error((j && j.erro) || `Erro ${r.status} ao organizar o resumo.`);
      ai = { text: src.value, resumo: BM.sanitize(j.resumo), modelo: j.modelo };
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

  const loadSample = () => {
    for (const k in fields) { fields[k].value = ''; dirty[k] = false; }
    overrides = {};
    ai = null;
    store.set('ai', '');
    src.value = SAMPLE;
    update();
    setTab('preview');
  };
  $('sample').addEventListener('click', loadSample);
  $('sample2').addEventListener('click', loadSample);
  $('clear').addEventListener('click', () => {
    src.value = '';
    for (const k in fields) { fields[k].value = ''; dirty[k] = false; }
    overrides = {};
    ai = null;
    store.set('ai', '');
    update();
    src.focus();
  });

  let inputT;
  src.addEventListener('input', () => { clearTimeout(inputT); inputT = setTimeout(update, 250); });
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
  update();
})();
