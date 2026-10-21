/* Texto único colado de uma vez, mesmo sem quebras de linha, é dividido nas partes do modelo e lido
   como no modo "Por partes". Rodar: node test/unico.test.js */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const BM = require('../app/engine.js');

const original = fs.readFileSync(path.join(__dirname, 'gouter.txt'), 'utf8');
const plano = original.replace(/[\p{Extended_Pictographic}‍️]/gu, '').replace(/\*/g, '').replace(/^•\s*/gm, '');
const umaLinha = plano.replace(/\s*\n\s*/g, ' ').trim(); // como no print: tudo numa linha só
const norm = (s) => s.replace(/\s+/g, ' ').trim();

let falhas = 0;
const ok = (nome, fn) => { try { fn(); console.log('ok  ', nome); } catch (e) { falhas++; console.log('FALHOU', nome, '\n     ', e.message.split('\n')[0]); } };
const bloco = (r, tipo) => r.blocos.find((b) => b.tipo === tipo);
const ref = BM.compor(original, []);

// A divisão certa em itens (o que a IA deve devolver): as linhas do texto original de cada parte.
const divisoes = {};
for (const s of BM.parse(original).sections) {
  for (const parte of s.cols || [s]) {
    if (!['cards', 'atencao', 'checklist'].includes(s.auto)) continue;
    const itens = parte.lines.filter(Boolean).map((l) => l.replace(/^•\s*/, ''));
    divisoes[norm(itens.join(' '))] = itens;
  }
}

ok('acha as partes do modelo mesmo sem quebras de linha', () => assert.strictEqual(BM.isTemplate(umaLinha), true));
ok('lista os trechos que precisam ser divididos em itens', () => {
  const t = BM.parse(umaLinha).blocos;
  assert.ok(Array.isArray(t), 'parse não devolve "blocos"');
  assert.strictEqual(t.length, 4, 'esperado: alinhamentos, atenção e as 2 colunas do checklist; veio ' + t.length);
});

const r = BM.compor(umaLinha, [], [], divisoes);
ok('com a divisão certa, dá o mesmo resumo do modo por partes', () => assert.deepStrictEqual(r.blocos, ref.blocos));
ok('cabeçalho: título e cliente', () => {
  assert.strictEqual(r.titulo, 'Resumo da Reunião');
  assert.strictEqual(r.cliente, 'Gouter Brigaderia (Fernanda)');
  assert.strictEqual(r.data, '21/10/2026');
  assert.deepStrictEqual(r.participantes, ['Riziel', 'Fernanda']);
});

ok('divisão que muda palavras é recusada (cai na divisão por frases)', () => {
  const ruim = {};
  for (const [k, v] of Object.entries(divisoes)) ruim[k] = v.map((x) => x.replace('Fernanda', 'Fê'));
  const c = bloco(BM.compor(umaLinha, [], [], ruim), 'cards');
  assert.ok(!c.itens.some((i) => (i.titulo + ' ' + i.texto).includes('Fê')), 'aceitou texto alterado');
});

ok('sem IA: nada se perde, cada frase vira item', () => {
  const s = BM.compor(umaLinha, []);
  const c = bloco(s, 'cards');
  // sem diferenciar maiúsculas: o app já põe maiúscula na primeira letra depois de "Assunto:"
  const junto = norm(c.itens.map((i) => (i.titulo ? i.titulo + ': ' : '') + i.texto).join(' ')).toLowerCase();
  const esperado = norm(Object.keys(divisoes)[0]).toLowerCase();
  assert.strictEqual(junto, esperado);
  assert.deepStrictEqual(bloco(s, 'checklist').colunas.map((x) => x.itens.length), [5, 4]);
});

ok('marcadores "•" na mesma linha viram itens sem IA', () => {
  const comBullets = original.replace(/[\p{Extended_Pictographic}‍️]/gu, '').replace(/\*/g, '').replace(/\s*\n\s*/g, ' ');
  assert.strictEqual(bloco(BM.compor(comBullets, []), 'cards').itens.length, 8);
});

ok('espaço especial (NBSP) nos títulos não atrapalha', () => {
  const nbsp = plano.replace(/Principais Alinhamentos/, 'Principais Alinhamentos').replace(/Pontos de Atenção/, 'Pontos de Atenção');
  assert.deepStrictEqual(BM.compor(nbsp, []).blocos.map((b) => b.tipo), ref.blocos.map((b) => b.tipo));
});

ok('checklist numa linha: cada ação é uma frase, mesmo que a IA junte duas', () => {
  const juntou = {};
  for (const [k, v] of Object.entries(divisoes)) juntou[k] = v.length > 1 ? [v.join(' ')] : v; // IA juntando tudo
  assert.deepStrictEqual(bloco(BM.compor(umaLinha, [], [], juntou), 'checklist').colunas.map((x) => x.itens.length), [5, 4]);
});

ok('"meta" inventada pela IA some quando o texto não fala em meta', () => {
  const numeros = BM.sanitize({ blocos: [{ tipo: 'meta', titulo: 'Meta', itens: [{ valor: '59', rotulo: 'Conversas totais' }] }] }).blocos;
  assert.strictEqual(bloco(BM.compor(umaLinha, numeros), 'meta'), undefined);
  assert.ok(bloco(BM.compor(umaLinha + ' Meta combinada: 80 conversas.', numeros), 'meta'), 'texto com meta deve manter o bloco');
});

ok('frase comum que cita "pontos de atenção" não é cortada', () => {
  const prosa = 'Conversamos sobre os pontos de atenção da cliente e sobre o checklist final da campanha.';
  assert.strictEqual(BM.isTemplate(prosa), false);
});

console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
