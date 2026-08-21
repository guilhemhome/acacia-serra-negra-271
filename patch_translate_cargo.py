path = "src/pages/GestaoCargos.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Patch 1: input de criar novo cargo
old1 = """              <input value={novoCargo} onChange={e => setNovoCargo(e.target.value)}
                placeholder="Nome do cargo..."
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }} />"""
new1 = """              <input value={novoCargo} onChange={e => setNovoCargo(e.target.value)}
                placeholder="Nome do cargo..." translate="no"
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }} />"""

# Patch 2: input de editar nome de cargo
old2 = """                      <input value={editNome} onChange={e => setEditNome(e.target.value)}
                        placeholder="Nome do cargo"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />"""
new2 = """                      <input value={editNome} onChange={e => setEditNome(e.target.value)}
                        placeholder="Nome do cargo" translate="no"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />"""

if old1 not in content:
    print("ERRO: trecho 1 (criar cargo) nao encontrado")
elif old2 not in content:
    print("ERRO: trecho 2 (editar cargo) nao encontrado")
else:
    content = content.replace(old1, new1)
    content = content.replace(old2, new2)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: ambos os patches aplicados")
