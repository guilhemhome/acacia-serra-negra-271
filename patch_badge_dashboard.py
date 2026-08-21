path = "src/pages/Dashboard.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = """          {usuario.perfil === 'ADM' && (
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, padding: '2px 8px', borderRadius: 6, margin: '4px 0 4px', textTransform: 'uppercase' }}>Administrador</span>
          )}
          {usuario.perfil === 'ADM' && usuario.cargoMaconico && <p style={{ color:'rgba(255,255,255,0.55)', fontSize:11, margin:'0' }}>Cargo na loja: {usuario.cargoMaconico}</p>}"""

new_str = """          {usuario.perfil && (
            <span translate="no" style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 10, fontWeight: 600, letterSpacing: 0.5, padding: '2px 8px', borderRadius: 6, margin: '4px 0 4px', textTransform: 'uppercase' }}>{usuario.perfil === 'ADM' ? 'Administrador' : usuario.perfil}</span>
          )}
          {usuario.cargoMaconico && <p translate="no" style={{ color:'rgba(255,255,255,0.55)', fontSize:11, margin:'0' }}>Cargo na loja: {usuario.cargoMaconico}</p>}"""

if old_str not in content:
    print("ERRO: trecho não encontrado")
else:
    content = content.replace(old_str, new_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: patch aplicado")
