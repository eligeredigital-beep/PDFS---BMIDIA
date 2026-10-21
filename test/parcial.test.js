/* Texto parcial (um quadro de cada vez) também é lido ao pé da letra, sem passar pela IA livre.
   Rodar: node test/parcial.test.js */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const BM = require('../app/engine.js');

const t = fs.readFileSync(path.join(__dirname, 'gouter.txt'), 'utf8');
const i2 = t.indexOf('🔑'), i3 = t.indexOf('⚠️'), i4 = t.indexOf('✅');
const Q = [t.slice(0, i2), t.slice(i2, i3), t.slice(i3, i4), t.slice(i4)].map((x) => x.trim());
let falhas = 0;
const ok = (nome, fn) => { try { fn(); console.log('ok  ', nome); } catch (e) { falhas++; console.log('FALHOU', nome, '\n     ', e.message.split('\n')[0]); } };
const cards = (txt) => { const b = BM.compor(txt, []).blocos.find((x) => x.tipo === 'cards'); return b ? b.itens.length : 0; };

ok('só o quadro 2 é lido pelo leitor fiel', () => assert.strictEqual(BM.isTemplate(Q[1]), true));
ok('só o quadro 2: 8 de 8 alinhamentos', () => assert.strictEqual(cards(Q[1]), 8));
ok('quadros 1+2: 8 de 8', () => { assert.strictEqual(BM.isTemplate(Q[0] + '\n\n' + Q[1]), true); assert.strictEqual(cards(Q[0] + '\n\n' + Q[1]), 8); });
ok('quadros 1+2+3 (sem checklist): 8 de 8', () => { const x = Q.slice(0, 3).join('\n\n'); assert.strictEqual(BM.isTemplate(x), true); assert.strictEqual(cards(x), 8); });
ok('só o quadro 3 (atenção)', () => assert.strictEqual(BM.isTemplate(Q[2]), true));
ok('só o quadro 4 (checklist)', () => assert.strictEqual(BM.isTemplate(Q[3]), true));
ok('12 alinhamentos sem o título da seção, só os itens, não são "modelo"', () =>
  assert.strictEqual(BM.isTemplate('• a\n\n• b\n\n• c'), false));
ok('transcrição solta continua indo para a IA livre', () =>
  assert.strictEqual(BM.isTemplate('Conversamos sobre as campanhas e a Fernanda disse que está sem tempo para gravar.'), false));

ok('resumo longo: 40 alinhamentos, 25 atenção e 30 ações não são cortados', () => {
  const n = (k, f) => Array.from({ length: k }, (_, i) => f(i + 1));
  const lista = (k, nome) => n(k, (i) => `• ${nome} ${i}.`).join('\n\n');
  const txt = ['## Principais alinhamentos', lista(40, 'Alinhamento'),
    '## Pontos de atenção', lista(25, 'Atenção'),
    '## Checklist final', '### Responsabilidades do cliente', lista(30, 'Ação')].join('\n\n');
  const r = BM.compor(txt, []);
  assert.strictEqual(r.blocos.find((b) => b.tipo === 'cards').itens.length, 40);
  assert.strictEqual(r.blocos.find((b) => b.tipo === 'atencao').itens.length, 25);
  assert.strictEqual(r.blocos.find((b) => b.tipo === 'checklist').colunas[0].itens.length, 30);
});

console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo certo');
process.exit(falhas ? 1 : 0);
