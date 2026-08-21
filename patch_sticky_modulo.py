path = "src/pages/Configuracoes.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

erros = []

old1 = "<th style={{ padding:'10px 12px', textAlign:'left', color:'#fff', fontSize:12, fontWeight:600, minWidth:150 }}>Modulo</th>"
new1 = "<th style={{ padding:'10px 12px', textAlign:'left', color:'#fff', fontSize:12, fontWeight:600, minWidth:150, position:'sticky', left:0, background:'#1e293b', zIndex:2 }}>Modulo</th>"

if old1 not in content:
    erros.append("th")
else:
    content = content.replace(old1, new1)

old2 = "<td style={{ padding:'8px 12px', fontSize:13, fontWeight:500, color:'#1e293b' }}>{mod.nome}</td>"
new2 = "<td style={{ padding:'8px 12px', fontSize:13, fontWeight:500, color:'#1e293b', position:'sticky', left:0, background: mi % 2 === 0 ? '#f8fafc' : '#fff', zIndex:1 }}>{mod.nome}</td>"

if old2 not in content:
    erros.append("td")
else:
    content = content.replace(old2, new2)

if erros:
    print("ERRO:", erros)
else:
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK")
