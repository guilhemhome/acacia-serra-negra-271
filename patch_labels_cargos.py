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

# 1. translate=no no nome do cargo exibido na lista
aplicar(
    '<span style={{ fontSize:14, fontWeight:700, color:\'#0f172a\', flexShrink:0 }}>{cargo.nome}</span>',
    '<span translate="no" style={{ fontSize:14, fontWeight:700, color:\'#0f172a\', flexShrink:0 }}>{cargo.nome}</span>',
    'translate=no no nome do cargo'
)

# 2. Labels + dica no formulario CRIAR
aplicar(
    '''<p style={{ margin:'0 0 10px', fontWeight:700, color:'#1a237e' }}>➕ Criar novo cargo</p>
              <input value={novoCargo} onChange={e => setNovoCargo(e.target.value)}
                placeholder="Nome do cargo..."
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }} />
              <input value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)}
                list="lista-categorias" placeholder="Categoria (ex: Administração) — digite uma nova se quiser"
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }} />
              <input value={novoPerfilAcesso} onChange={e => setNovoPerfilAcesso(e.target.value)}
                list="lista-perfis" placeholder="Nível de acesso (ex: Administrativo)"
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }} />''',
    '''<p style={{ margin:'0 0 10px', fontWeight:700, color:'#1a237e' }}>➕ Criar novo cargo</p>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:4 }}>Nome do cargo</label>
              <input value={novoCargo} onChange={e => setNovoCargo(e.target.value)}
                placeholder="Nome do cargo..."
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }} />
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:4 }}>Categoria</label>
              <input value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)}
                list="lista-categorias" placeholder="Categoria (ex: Administração)"
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
              <p style={{ margin:'4px 0 8px', fontSize:11, color:'#94a3b8' }}>💡 Digite para ver sugestões existentes, ou escreva uma categoria nova</p>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:4 }}>Nível de acesso</label>
              <input value={novoPerfilAcesso} onChange={e => setNovoPerfilAcesso(e.target.value)}
                list="lista-perfis" placeholder="Nível de acesso (ex: Administrativo)"
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
              <p style={{ margin:'4px 0 8px', fontSize:11, color:'#94a3b8' }}>💡 Digite para ver sugestões existentes, ou escreva um nível novo</p>''',
    'labels no formulario Criar'
)

# 3. Labels + dica no formulario EDITAR
aplicar(
    '''<input value={editNome} onChange={e => setEditNome(e.target.value)}
                        placeholder="Nome do cargo"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                      <input value={editCategoria} onChange={e => setEditCategoria(e.target.value)}
                        list="lista-categorias" placeholder="Categoria"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                      <input value={editPerfilAcesso} onChange={e => setEditPerfilAcesso(e.target.value)}
                        list="lista-perfis" placeholder="Nível de acesso"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />''',
    '''<label style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>Nome do cargo</label>
                      <input value={editNome} onChange={e => setEditNome(e.target.value)}
                        placeholder="Nome do cargo"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                      <label style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>Categoria</label>
                      <input value={editCategoria} onChange={e => setEditCategoria(e.target.value)}
                        list="lista-categorias" placeholder="Categoria"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                      <p style={{ margin:'-4px 0 0', fontSize:11, color:'#94a3b8' }}>💡 Digite para ver sugestões, ou escreva uma nova</p>
                      <label style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>Nível de acesso</label>
                      <input value={editPerfilAcesso} onChange={e => setEditPerfilAcesso(e.target.value)}
                        list="lista-perfis" placeholder="Nível de acesso"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                      <p style={{ margin:'-4px 0 0', fontSize:11, color:'#94a3b8' }}>💡 Digite para ver sugestões, ou escreva um novo</p>''',
    'labels no formulario Editar'
)

if erros == 0:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Arquivo salvo com sucesso')
else:
    print('NADA foi salvo devido a erros acima')
