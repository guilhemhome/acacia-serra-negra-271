path = 'src/pages/GestaoCargos.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

erros = 0
def aplicar(old, new, label):
    global content, erros
    if old not in content:
        print(f'ERRO: {label} nao encontrado')
        erros += 1
    else:
        content = content.replace(old, new)
        print(f'OK: {label}')

# 1. translate=no no nome da categoria no acordeao
aplicar(
    "<span style={{ flex:1, fontSize:16, fontWeight:700, color: aberto ? '#fff' : '#1a237e', letterSpacing:'0.01em' }}>{categoria}</span>",
    "<span translate=\"no\" style={{ flex:1, fontSize:16, fontWeight:700, color: aberto ? '#fff' : '#1a237e', letterSpacing:'0.01em' }}>{categoria}</span>",
    'translate=no na categoria do acordeao'
)

# 2. Juntar Categoria + Nivel de acesso na mesma linha no formulario EDITAR
aplicar(
    '''<label style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>Categoria</label>
                      <input value={editCategoria} onChange={e => setEditCategoria(e.target.value)}
                        list="lista-categorias" placeholder="Categoria"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                      <p style={{ margin:'-4px 0 0', fontSize:11, color:'#94a3b8' }}>💡 Digite para ver sugestões, ou escreva uma nova</p>
                      <label style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>Nível de acesso</label>
                      <input value={editPerfilAcesso} onChange={e => setEditPerfilAcesso(e.target.value)}
                        list="lista-perfis" placeholder="Nível de acesso"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                      <p style={{ margin:'-4px 0 0', fontSize:11, color:'#94a3b8' }}>💡 Digite para ver sugestões, ou escreva um novo</p>''',
    '''<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        <div>
                          <label style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>Categoria</label>
                          <input value={editCategoria} onChange={e => setEditCategoria(e.target.value)}
                            list="lista-categorias" placeholder="Categoria"
                            style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                          <p style={{ margin:'2px 0 0', fontSize:10, color:'#94a3b8' }}>💡 Digite para ver sugestões</p>
                        </div>
                        <div>
                          <label style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>Nível de acesso</label>
                          <input value={editPerfilAcesso} onChange={e => setEditPerfilAcesso(e.target.value)}
                            list="lista-perfis" placeholder="Nível de acesso"
                            style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                          <p style={{ margin:'2px 0 0', fontSize:10, color:'#94a3b8' }}>💡 Digite para ver sugestões</p>
                        </div>
                      </div>''',
    'juntar Categoria e Nivel na mesma linha'
)

if erros == 0:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Arquivo salvo com sucesso')
else:
    print('NADA foi salvo devido a erros acima')
