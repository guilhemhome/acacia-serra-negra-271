path = "src/pages/GestaoCargos.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = """          <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:'bold', margin:0 }}>Gestão de Cargos</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:14 }}>Acácia de Serra Negra Nº 271</p>"""

new_str = """          <h1 translate="no" style={{ color:'#fff', fontSize:'1.6rem', fontWeight:'bold', margin:0 }}>Gestão de Cargos</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:14 }}>Acácia de Serra Negra Nº 271</p>
          {nivelAcesso && (
            <span translate="no" style={{ display:'inline-block', background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:10, fontWeight:600, letterSpacing:0.5, padding:'2px 8px', borderRadius:6, margin:'4px 0 0', textTransform:'uppercase' }}>
              {nivelAcesso === 'ADM' ? 'Administrador' : nivelAcesso}
            </span>
          )}"""

if old_str not in content:
    print("ERRO")
else:
    content = content.replace(old_str, new_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK")
