path = 'src/pages/Configuracoes.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_str = '''<select value={p.perfil} onClick={e => e.stopPropagation()} onChange={e => alterarPerfil(p.user_id, e.target.value)}
                      style={{ padding:'5px 8px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:12, background:'#fff', cursor:'pointer', flexShrink:0 }}>'''

new_str = '''<select value={p.perfil} translate="no" onClick={e => e.stopPropagation()} onChange={e => alterarPerfil(p.user_id, e.target.value)}
                      style={{ padding:'5px 8px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:12, background:'#fff', cursor:'pointer', flexShrink:0 }}>'''

if old_str not in content:
    print('ERRO: trecho nao encontrado')
else:
    content = content.replace(old_str, new_str)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: patch aplicado')
