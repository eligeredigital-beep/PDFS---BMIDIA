/* Os 4 quadros somados dão o mesmo resumo que o texto inteiro. Rodar: node test/partes.test.js */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const BM = require('../app/engine.js');

const t = fs.readFileSync(path.join(__dirname, 'gouter.txt'), 'utf8');
const i2 = t.indexOf('🔑'), i3 = t.indexOf('⚠️'), i4 = t.indexOf('✅');
const quadros = [t.slice(0, i2), t.slice(i2, i3), t.slice(i3, i4), t.slice(i4)].map((x) => x.trim());
const juntos = quadros.join('\n\n');

const a = BM.compor(t, []);
const b = BM.compor(juntos, []);
assert.deepStrictEqual(b, a, 'quadros colados separados devem dar o mesmo resultado');
assert.strictEqual(b.blocos.find((x) => x.tipo === 'cards').itens.length, 8);
// cada quadro, sozinho, é entendido
const conta = (txt, tipo) => { const { sections } = BM.parse(txt); const s = sections.find((x) => x.lines.some(Boolean)); const r = BM.build(s, tipo); return r.itens ? r.itens.length : r.colunas.reduce((n, c) => n + c.itens.length, 0); };
assert.strictEqual(conta(quadros[1], 'cards'), 8);
assert.strictEqual(conta(quadros[2], 'atencao'), 4);
assert.strictEqual(conta(quadros[3], 'checklist'), 9);
console.log('ok   4 quadros = texto inteiro (8 alinhamentos, 4 atenção, 9 ações)');
