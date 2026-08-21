path = "src/pages/Configuracoes.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = """                  <thead>
                    <tr style={{ background:'#1e293b' }}>
                      <th style={{ padding:'10px 12px', textAlign:'left', color:'#fff', fontSize:12, fontWeight:600, minWidth:150, position:'sticky', left:0, background:'#1e293b', zIndex:2 }}>Modulo</th>
                      <th style={{ padding:'10px 8px', textAlign:'center', color:'#fff', fontSize:11, fontWeight:600, minWidth:70 }}>ADM</th>
                      {perfisEditaveis.map(p => (
                        <th key={p} translate="no" style={{ padding:'10px 8px', textAlign:'center', color:'#fff', fontSize:11, fontWeight:600, minWidth:100, whiteSpace:'nowrap' }}>{p}</th>
                      ))}
                    </tr>
                  </thead>"""

new_str = """                  <thead>
                    <tr style={{ background:'#1e293b' }}>
                      <th style={{ padding:'10px 12px', textAlign:'left', color:'#fff', fontSize:12, fontWeight:600, minWidth:150, position:'sticky', left:0, top:0, background:'#1e293b', zIndex:3 }}>Modulo</th>
                      <th style={{ padding:'10px 8px', textAlign:'center', color:'#fff', fontSize:11, fontWeight:600, minWidth:70, position:'sticky', top:0, background:'#1e293b', zIndex:2 }}>ADM</th>
                      {perfisEditaveis.map(p => (
                        <th key={p} translate="no" style={{ padding:'10px 8px', textAlign:'center', color:'#fff', fontSize:11, fontWeight:600, minWidth:100, whiteSpace:'nowrap', position:'sticky', top:0, background:'#1e293b', zIndex:2 }}>{p}</th>
                      ))}
                    </tr>
                  </thead>"""

if old_str not in content:
    print("ERRO: trecho original nao encontrado")
else:
    content = content.replace(old_str, new_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: patch aplicado")
