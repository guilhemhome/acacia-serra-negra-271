path = 'src/pages/Configuracoes.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_str = '''<th key={p} style={{ padding:'10px 8px', textAlign:'center', color:'#fff', fontSize:11, fontWeight:600, minWidth:100, whiteSpace:'nowrap' }}>{p}</th>'''

new_str = '''<th key={p} translate="no" style={{ padding:'10px 8px', textAlign:'center', color:'#fff', fontSize:11, fontWeight:600, minWidth:100, whiteSpace:'nowrap' }}>{p}</th>'''

if old_str not in content:
    print('ERRO: trecho nao encontrado')
else:
    content = content.replace(old_str, new_str)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: patch aplicado')
