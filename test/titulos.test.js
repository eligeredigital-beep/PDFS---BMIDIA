/* Garante os títulos fixos do modelo BMidia, qualquer que seja o título que a IA devolva.
   Rodar: node test/titulos.test.js */
const assert = require('assert');
const BM = require('../app/engine.js');

const titulos = (r) => r.blocos.map((b) => b.tipo + ':' + (b.titulo || '-'));
let falhas = 0;
const t = (nome, fn) => { try { fn(); console.log('ok  ', nome); } catch (e) { falhas++; console.log('FALHOU', nome, '\n     ', e.message.split('\n')[0]); } };

// Caso real: o Ultra devolveu 3 blocos "cards" com títulos inventados.
const ultra = {
  cliente: 'X', blocos: [
    { tipo: 'texto', titulo: 'Objetivo', texto: 'a' },
    { tipo: 'cards', titulo: 'Estratégia de criativos', itens: [{ titulo: 'A', texto: 'a1' }, { titulo: 'B', texto: 'b1' }] },
    { tipo: 'cards', titulo: 'Cardápio digital', itens: [{ titulo: 'C', texto: 'c1' }] },
    { tipo: 'cards', titulo: 'Migração cardápio web', itens: [{ titulo: 'D', texto: 'd1' }] },
    { tipo: 'atencao', titulo: 'Riscos', itens: ['r'] },
    { tipo: 'checklist', titulo: 'Próximos passos', colunas: [
      { titulo: 'Cliente', itens: [{ t: 'x' }] },
      { titulo: 'BMidia / Gestores', itens: [{ t: 'y' }] },
    ] },
  ],
};

t('alinhamentos viram UM bloco com título fixo', () => {
  const r = BM.sanitize(ultra);
  const cards = r.blocos.filter((b) => b.tipo === 'cards');
  assert.strictEqual(cards.length, 1, 'esperado 1 bloco cards, veio ' + cards.length);
  assert.strictEqual(cards[0].titulo, 'Principais alinhamentos');
  assert.deepStrictEqual(cards[0].itens.map((i) => i.titulo), ['A', 'B', 'C', 'D']);
});

t('títulos fixos de objetivo, atenção e checklist', () => {
  const r = BM.sanitize(ultra);
  assert.deepStrictEqual(titulos(r).filter((x) => !x.startsWith('cards')),
    ['texto:Objetivo da reunião', 'atencao:Pontos de atenção', 'checklist:Checklist final']);
});

t('colunas da checklist com nome fixo', () => {
  const c = BM.sanitize(ultra).blocos.find((b) => b.tipo === 'checklist');
  assert.deepStrictEqual(c.colunas.map((x) => x.titulo), ['Responsabilidades do cliente', 'Responsabilidades do time / gestores']);
});

t('resultados mantêm o título dado (ex.: "Resultados de setembro")', () => {
  const r = BM.sanitize({ blocos: [{ tipo: 'metricas', titulo: 'Resultados de setembro', itens: [{ valor: '1', rotulo: 'a' }] }] });
  assert.strictEqual(r.blocos[0].titulo, 'Resultados de setembro');
});

t('resultados sem título ganham "Resultados do período"', () => {
  const r = BM.sanitize({ blocos: [{ tipo: 'metricas', itens: [{ valor: '1', rotulo: 'a' }] }] });
  assert.strictEqual(r.blocos[0].titulo, 'Resultados do período');
});

t('o resumo-kellen.json segue igual', () => {
  const r = BM.sanitize(require('../bmidia-pdf-template/bmidia-pdf/resumo-kellen.json'));
  assert.deepStrictEqual(titulos(r).map((x) => x.split(':')[0]), ['texto', 'metricas', 'destaque', 'cards', 'meta', 'atencao', 'checklist']);
  assert.strictEqual(r.blocos.find((b) => b.tipo === 'cards').titulo, 'Principais alinhamentos');
});

console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
