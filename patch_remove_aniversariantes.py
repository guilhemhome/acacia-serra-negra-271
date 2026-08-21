import re

path = "src/pages/PortalMembro.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = """        {/* Aniversariantes do mês */}
        {aniversarios.length > 0 && (
          <>
            <p style={sec}>🎂 Aniversariantes do mês</p>
            <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'4px 16px' }}>
              {aniversarios.map((a, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i < aniversarios.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#7c3aed', flexShrink:0 }}>
                    {a.nome_completo.split(' ').map(p => p[0]).slice(0,2).join('')}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>{a.nome_completo}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>🎂 {fmt(a.data_nascimento).slice(0,5)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
"""

if old_str not in content:
    print("ERRO")
else:
    content = content.replace(old_str, "")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK")
