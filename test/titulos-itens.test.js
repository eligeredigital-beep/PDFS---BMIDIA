/* Alinhamentos sem "Assunto:" na frente ganham um título curto; o texto do item não muda.
   Rodar: node test/titulos-itens.test.js */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const BM = require('../app/engine.js');

const gouter = fs.readFileSync(path.join(__dirname, 'gouter.txt'), 'utf8');
let falhas = 0;
const ok = (nome, fn) => { try { fn(); console.log('ok  ', nome); } catch (e) { falhas++; console.log('FALHOU', nome, '\n     ', e.message.split('\n')[0]); } };
const cards = (r) => r.blocos.find((b) => b.tipo === 'cards').itens;

const sem = BM.itensSemTitulo ? BM.itensSemTitulo(gouter) : null;

ok('lista os alinhamentos que não têm título (3 no texto da Gouter)', () => {
  assert.ok(Array.isArray(sem), 'BM.itensSemTitulo não existe');
  assert.strictEqual(sem.length, 3);
  assert.ok(sem[0].startsWith('Fernanda fechou'));
  assert.ok(sem[1].startsWith('Cerca de 20'));
  assert.ok(sem[2].startsWith('Legendas atuais'));
});

const titulos = ['Vendas pelos anúncios', 'Teste de pronta entrega', 'Legendas'];
ok('aplica os títulos só aos itens sem título, na ordem', () => {
  const c = cards(BM.compor(gouter, [], titulos));
  assert.strictEqual(c.length, 8);
  assert.ok(c.every((i) => i.titulo), 'ainda há cartão sem título: ' + c.filter((i) => !i.titulo).map((i) => i.texto.slice(0, 30)));
  assert.strictEqual(c[2].titulo, 'Vendas pelos anúncios');
  assert.strictEqual(c[4].titulo, 'Teste de pronta entrega');
  assert.strictEqual(c[7].titulo, 'Legendas');
});
ok('títulos que já existiam ficam como estavam', () => {
  const c = cards(BM.compor(gouter, [], titulos));
  assert.strictEqual(c[0].titulo, 'Campanhas iniciadas em 24/09');
  assert.strictEqual(c[3].titulo, 'Melhor criativo');
});
ok('o texto dos itens não muda', () => {
  const a = cards(BM.compor(gouter, [], [])).map((i) => i.texto);
  const b = cards(BM.compor(gouter, [], titulos)).map((i) => i.texto);
  assert.deepStrictEqual(b, a);
});
ok('título longo ou com ponto final é limpo (até 6 palavras)', () => {
  const c = cards(BM.compor(gouter, [], ['Um título gigante demais para caber no cartão do resumo.', 'Ok.', '']));
  assert.ok(c[2].titulo.split(/\s+/).length <= 6, c[2].titulo);
  assert.ok(!/[.!?]$/.test(c[4].titulo), c[4].titulo);
  assert.strictEqual(c[7].titulo || '', '', 'título vazio não deve inventar nada');
});
ok('faltando títulos, o resto fica sem título (nada de chute)', () => {
  const c = cards(BM.compor(gouter, [], ['Só um']));
  assert.strictEqual(c[2].titulo, 'Só um');
  assert.strictEqual(c[4].titulo || '', '');
});

console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
