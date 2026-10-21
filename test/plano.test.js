/* Texto copiado sem formatação (sem emoji, negrito nem marcadores) é lido igual ao formatado.
   Rodar: node test/plano.test.js */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const BM = require('../app/engine.js');

const original = fs.readFileSync(path.join(__dirname, 'gouter.txt'), 'utf8');
// o mesmo texto como sai de um Google Docs / Word / PDF: sem emojis, sem *negrito*, sem "•"
const plano = original
  .replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '')
  .replace(/\*/g, '')
  .replace(/^•\s*/gm, '')
  .replace(/^[ \t]+/gm, '');

let falhas = 0;
const ok = (nome, fn) => { try { fn(); console.log('ok  ', nome); } catch (e) { falhas++; console.log('FALHOU', nome, '\n     ', e.message.split('\n')[0]); } };
const a = BM.compor(original, []);
const b = BM.compor(plano, []);
const tipos = (r) => r.blocos.map((x) => x.tipo + ':' + (x.titulo || ''));

ok('reconhece o resumo sem formatação', () => assert.strictEqual(BM.isTemplate(plano), true));
ok('mesmos blocos e títulos do texto formatado', () => assert.deepStrictEqual(tipos(b), tipos(a)));
ok('8 alinhamentos como cartões, não um parágrafo', () => assert.strictEqual((b.blocos.find((x) => x.tipo === 'cards') || { itens: [] }).itens.length, 8));
ok('4 pontos de atenção', () => assert.strictEqual((b.blocos.find((x) => x.tipo === 'atencao') || { itens: [] }).itens.length, 4));
ok('checklist em 2 colunas (5 e 4 itens)', () => {
  const c = b.blocos.find((x) => x.tipo === 'checklist');
  assert.deepStrictEqual(c.colunas.map((x) => x.itens.length), [5, 4]);
});
ok('cabeçalho: cliente, data e participantes', () => {
  assert.strictEqual(b.cliente, 'Gouter Brigaderia (Fernanda)');
  assert.strictEqual(b.data, '21/10/2026');
  assert.deepStrictEqual(b.participantes, ['Riziel', 'Fernanda']);
});
ok('conteúdo igual ao do texto formatado', () => assert.deepStrictEqual(b.blocos, a.blocos));
ok('uma frase comum que começa com "pontos" não vira título', () =>
  assert.strictEqual(BM.isTemplate('Pontos importantes sobre o cardápio foram discutidos hoje com a cliente.'), false));

ok('linha com ":" ou ponto final nunca vira título vazio (nada some)', () => {
  for (const linha of ['Meta combinada: 80 conversas.', 'Resultados de setembro: 59 conversas.', 'Responsabilidades do cliente foram combinadas.']) {
    const p = BM.parse('## Principais alinhamentos\n\n• a\n\n' + linha);
    const tudo = p.sections.flatMap((s) => s.lines).join(' ');
    assert.ok(tudo.includes(linha.split(':')[1] ? linha.split(':')[1].trim() : linha), 'sumiu: ' + linha);
  }
});

console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
