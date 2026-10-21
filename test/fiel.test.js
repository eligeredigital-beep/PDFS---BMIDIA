/* Modo fiel: no modelo estruturado de resumo, o texto sai exatamente como foi escrito.
   A IA só entra para extrair números e destaques. Rodar: node test/fiel.test.js */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const BM = require('../app/engine.js');

const gouter = fs.readFileSync(path.join(__dirname, 'gouter.txt'), 'utf8');
let falhas = 0;
const t = (nome, fn) => { try { fn(); console.log('ok  ', nome); } catch (e) { falhas++; console.log('FALHOU', nome, '\n     ', e.message.split('\n')[0]); } };

// o que a IA devolve no modo fiel: só números
const numeros = BM.sanitize({ blocos: [
  { tipo: 'metricas', titulo: 'Resultados do período', itens: [{ valor: 'R$ 1.015', rotulo: 'Investimento' }, { valor: '59', rotulo: 'Conversas' }, { valor: '26 mil', rotulo: 'Alcance' }] },
  { tipo: 'destaque', itens: [{ valor: 'R$ 9,95', rotulo: 'Custo por mensagem' }] },
] }).blocos;

t('reconhece o modelo estruturado', () => assert.strictEqual(BM.isTemplate(gouter), true));
t('texto solto não é modelo', () => assert.strictEqual(BM.isTemplate('A reunião foi boa e falamos de vários assuntos com a cliente.'), false));

const r = BM.compor(gouter, numeros);
const cards = r && r.blocos.find((b) => b.tipo === 'cards');
const original = gouter.split('Principais Alinhamentos')[1].split('Pontos de Atenção')[0].split('\n').filter((l) => l.startsWith('•'));

t('todos os alinhamentos entram (8 de 8)', () => assert.strictEqual(cards.itens.length, original.length));
t('texto dos alinhamentos é o original, sem resumir', () => {
  const sem = (s) => s.replace(/^•\s*/, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const juntos = cards.itens.map((i) => sem((i.titulo ? i.titulo + ': ' : '') + i.texto));
  original.forEach((o, n) => assert.strictEqual(juntos[n], sem(o), `item ${n + 1}`));
});
t('ordem e títulos fixos do modelo', () => assert.deepStrictEqual(r.blocos.map((b) => b.tipo + ':' + (b.titulo || '')), [
  'texto:Objetivo da reunião', 'metricas:Resultados do período', 'destaque:',
  'cards:Principais alinhamentos', 'atencao:Pontos de atenção', 'checklist:Checklist final',
]));
t('cabeçalho vem do texto', () => {
  assert.strictEqual(r.cliente, 'Gouter Brigaderia (Fernanda)');
  assert.strictEqual(r.data, '21/10/2026');
  assert.deepStrictEqual(r.participantes, ['Riziel', 'Fernanda']);
});
t('checklist: itens e colunas do original', () => {
  const c = r.blocos.find((b) => b.tipo === 'checklist');
  assert.deepStrictEqual(c.colunas.map((x) => x.titulo), ['Responsabilidades do cliente', 'Responsabilidades do time / gestores']);
  assert.deepStrictEqual(c.colunas.map((x) => x.itens.length), [5, 4]);
});
t('números da IA entram depois do objetivo', () => assert.deepStrictEqual(r.blocos.slice(0, 3).map((b) => b.tipo), ['texto', 'metricas', 'destaque']));

console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
