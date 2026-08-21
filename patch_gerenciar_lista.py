path = 'src/pages/GestaoCargos.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """                        <p style={{ margin:0, fontWeight:600, color:'#1e293b', fontSize:14 }}>{c.nome}</p>
                        <p style={{ margin:'2px 0 0', fontSize:11, color:'#94a3b8' }}>{c.categoria || 'Outros'} · {c.perfil_acesso || 'Membro'}</p>"""

new = """                        <p translate="no" style={{ margin:0, fontWeight:600, color:'#1e293b', fontSize:14 }}>{c.nome}</p>
                        <p translate="no" style={{ margin:'2px 0 0', fontSize:11, color:'#94a3b8' }}>{c.categoria || 'Outros'} · {c.perfil_acesso || 'Membro'}</p>"""

if old not in content:
    print('ERRO: trecho nao encontrado')
else:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: patch aplicado')
