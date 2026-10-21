#!/usr/bin/env python3
"""PDF de resumo de reunião no padrão BMidia Digitais.
Uso: python3 generate.py resumo.json saida.pdf
Blocos: texto, metricas, destaque, cards, meta, atencao, checklist"""
import json, sys, html, pathlib
from weasyprint import HTML
base = pathlib.Path(__file__).parent.resolve()
d = json.load(open(sys.argv[1], encoding='utf-8'))
out = sys.argv[2] if len(sys.argv) > 2 else 'resumo.pdf'
e = lambda s: html.escape(str(s))
H2 = lambda t: f'<h2>{e(t)}</h2>' if t else ''

def stat(m, cls='metric'):
    return f'<div class="{cls}"><b>{e(m["valor"])}</b><span>{e(m["rotulo"])}</span></div>'

def render(b):
    t = b['tipo']
    if t == 'texto':
        return f'<section>{H2(b.get("titulo"))}<p class="lead">{e(b["texto"])}</p></section>'
    if t == 'metricas':
        return f'<section>{H2(b.get("titulo"))}<div class="grid3">{"".join(stat(m) for m in b["itens"])}</div></section>'
    if t == 'destaque':
        return f'<section><div class="grid2">{"".join(stat(m,"band") for m in b["itens"])}</div></section>'
    if t == 'meta':
        return f'<section class="keep">{H2(b.get("titulo"))}<div class="grid2">{"".join(stat(m,"goal") for m in b["itens"])}</div></section>'
    if t == 'cards':
        cs = ''.join(f'<div class="card"><i>{i+1:02d}</i><div><h3>{e(c["titulo"])}</h3><p>{e(c["texto"])}</p></div></div>' for i, c in enumerate(b['itens']))
        return f'<section>{H2(b.get("titulo"))}{cs}</section>'
    if t == 'atencao':
        li = ''.join(f'<li>{e(x)}</li>' for x in b['itens'])
        return f'<section class="keep attn">{H2(b.get("titulo"))}<ul>{li}</ul></section>'
    if t == 'checklist':
        cols = ''
        for c in b['colunas']:
            li = ''.join(f'<li><span class="box"></span><div>{e(i["t"])}{f"<em>{e(i["tag"])}</em>" if i.get("tag") else ""}</div></li>' for i in c['itens'])
            cols += f'<div class="col"><h3>{e(c["titulo"])}</h3><ul>{li}</ul></div>'
        return f'<section class="pbreak">{H2(b.get("titulo"))}<div class="cols">{cols}</div></section>'
    return ''

body = ''.join(render(b) for b in d['blocos'])
parts = '<br>'.join(e(x) for x in d.get('participantes', []))
titulo = d.get('titulo', 'Resumo da <i>reunião</i>')

doc = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face{{font-family:Montserrat;font-weight:400;src:url(assets/fonts/montserrat-latin-400-normal.woff)}}
@font-face{{font-family:Montserrat;font-weight:600;src:url(assets/fonts/montserrat-latin-600-normal.woff)}}
@font-face{{font-family:Montserrat;font-weight:700;src:url(assets/fonts/montserrat-latin-700-normal.woff)}}
@font-face{{font-family:Playfair;font-weight:400;src:url(assets/fonts/playfair-display-latin-400-normal.woff)}}
@font-face{{font-family:Playfair;font-style:italic;font-weight:400;src:url(assets/fonts/playfair-display-latin-400-italic.woff)}}
@font-face{{font-family:Hanken;font-weight:700;src:url(assets/fonts/hanken-grotesk-latin-700-normal.woff)}}
:root{{--brown:#876047;--deep:#662900;--text:#94430D;--olive:#6C6948;--beige:#CABDAA;--sand:#DFD2C1;--cream:#FFF8EF;--off:#F7F6F1;--dark:#1B1B13;--gold:#DFB956}}
@page{{size:A4;margin:16mm 0 20mm;background:var(--cream);
 @bottom-left{{content:"@BMIDIADIGITAIS";font:600 7pt Montserrat;letter-spacing:.15em;color:var(--brown);margin-left:18mm}}
 @bottom-right{{content:counter(page) " / " counter(pages);font:600 7pt Montserrat;color:var(--brown);margin-right:18mm}}}}
@page:first{{margin-top:0}}
body{{margin:0;font:400 9.5pt/1.55 Montserrat;color:var(--dark)}}
header{{background:var(--brown);color:var(--cream);padding:15mm 18mm 13mm;position:relative}}
header::after{{content:"";position:absolute;left:0;right:0;bottom:0;height:3mm;background:var(--olive)}}
header img{{height:14mm;display:block}}
.kicker{{margin-top:10mm;font:600 8pt Montserrat;letter-spacing:.22em;text-transform:uppercase;color:var(--sand)}}
h1{{font:400 32pt/1 Playfair;margin:3mm 0 0;color:var(--cream)}}
h1 i{{font-style:italic;color:var(--sand)}}
.meta{{display:flex;gap:14mm;margin-top:6mm}}
.meta div{{font-size:8.5pt;color:var(--sand)}}
.meta b{{display:block;font:700 7pt Montserrat;letter-spacing:.16em;text-transform:uppercase;color:var(--beige);margin-bottom:1mm}}
main{{padding:10mm 18mm 0}}
section{{margin-bottom:8mm}}
.keep{{break-inside:avoid}}
.pbreak{{break-before:page}}
h2{{font:400 16pt Playfair;color:var(--deep);margin:0 0 3.5mm;padding-bottom:2mm;border-bottom:.4mm solid var(--beige)}}
p{{margin:0;color:#3a2a20}}
.lead{{font-size:10.5pt;line-height:1.6}}
.grid3,.grid2{{display:flex;flex-wrap:wrap;gap:3.5mm}}
.grid3 .metric{{width:calc(33.33% - 2.4mm)}}
.grid2 > div{{width:calc(50% - 1.8mm)}}
.metric{{background:var(--brown);color:var(--cream);padding:5mm 4.5mm;border-radius:2mm;box-sizing:border-box}}
.metric b{{display:block;font:700 17pt Hanken;color:var(--cream)}}
.metric span,.band span,.goal span{{display:block;font-size:7.8pt;line-height:1.4;margin-top:1mm}}
.metric span{{color:var(--sand)}}
.band{{background:var(--deep);color:var(--cream);padding:5mm;border-radius:2mm;box-sizing:border-box}}
.band b{{font:700 18pt Hanken;color:var(--gold)}} .band span{{color:var(--sand)}}
.goal{{background:var(--off);border:.4mm solid var(--brown);padding:5mm;border-radius:2mm;box-sizing:border-box}}
.goal b{{font:700 18pt Hanken;color:var(--deep)}} .goal span{{color:var(--text)}}
.card{{display:flex;gap:5mm;padding:3.8mm 0;border-bottom:.2mm solid var(--sand);break-inside:avoid}}
.card i{{font:400 italic 17pt Playfair;color:var(--brown);width:11mm;flex:none;line-height:1}}
.card h3{{font:700 9.5pt Montserrat;color:var(--deep);margin:0 0 1mm}}
.attn ul{{margin:0;padding:0;list-style:none}}
.attn li{{background:#F3E6C9;border-left:1.2mm solid var(--gold);padding:3.5mm 5mm;margin-bottom:2.5mm;border-radius:0 2mm 2mm 0;color:#4a3a1c;break-inside:avoid}}
.cols{{display:flex;gap:6mm;align-items:flex-start}}
.col{{flex:1}}
.col h3{{background:var(--deep);color:var(--cream);font:700 7.5pt Montserrat;letter-spacing:.12em;text-transform:uppercase;padding:3mm 4mm;margin:0;border-radius:2mm 2mm 0 0}}
.col:nth-child(2) h3{{background:var(--olive)}}
.col ul{{margin:0;padding:0;list-style:none;background:var(--off);border-radius:0 0 2mm 2mm}}
.col li{{display:flex;gap:3mm;padding:3mm 4mm;border-bottom:.2mm solid var(--sand);font-size:8.8pt;line-height:1.45;break-inside:avoid}}
.box{{flex:none;width:3.4mm;height:3.4mm;border:.4mm solid var(--brown);border-radius:.8mm;margin-top:.5mm}}
.col em{{display:inline-block;margin-left:2mm;font:700 6.5pt Montserrat;font-style:normal;letter-spacing:.08em;text-transform:uppercase;background:var(--gold);color:var(--deep);padding:.6mm 2mm;border-radius:5mm;white-space:nowrap}}
</style></head><body>
<header>
 <img src="assets/logos/bmidia-logo-bege.png">
 <div class="kicker">{e(d["cliente"])}</div>
 <h1>{titulo}</h1>
 <div class="meta"><div><b>Data</b>{e(d["data"])}</div><div><b>Participantes</b>{parts}</div></div>
</header>
<main>{body}</main>
</body></html>'''
HTML(string=doc, base_url=str(base)).write_pdf(out)
print('OK', out)
