import shutil

arquivo = 'src/pages/BodesAsfalto.jsx'
shutil.copy(arquivo, arquivo + '.bak')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

# --- Patch 1: trazer cidade na consulta ---
antigo_1 = """    const { data: loja } = await supabase.from('associados')
      .select('id, nome_completo, bodes_asfalto_numero, bodes_asfalto_data_admissao')
      .eq('bodes_asfalto', true).eq('status_cadastro', 'aprovado').eq('situacao', 'ativo')
      .order('nome_completo')
    setMembrosLoja(loja || [])"""
novo_1 = """    const { data: loja } = await supabase.from('associados')
      .select('id, nome_completo, cidade, bodes_asfalto_numero, bodes_asfalto_data_admissao')
      .eq('bodes_asfalto', true).eq('status_cadastro', 'aprovado').eq('situacao', 'ativo')
      .order('nome_completo')
    setMembrosLoja(loja || [])"""

if antigo_1 not in conteudo:
    print('ERRO: patch 1 (select cidade) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_1, novo_1)

# --- Patch 2: exibir cidade na aba Membros (visao gestor) ---
antigo_2 = """                  {membrosLoja.map(m => (
                    <div key={m.id} style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:8, fontSize:13, color:'#1e293b', display:'flex', justifyContent:'space-between' }}>
                      <span>{m.nome_completo}</span>
                      <span style={{ color:'#94a3b8', fontSize:11 }}>{m.bodes_asfalto_numero ? '#'+m.bodes_asfalto_numero : ''}</span>
                    </div>
                  ))}"""
novo_2 = """                  {membrosLoja.map(m => (
                    <div key={m.id} style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:8, fontSize:13, color:'#1e293b', display:'flex', justifyContent:'space-between' }}>
                      <span>{m.nome_completo} {m.cidade ? <span style={{ fontSize:11, color:'#94a3b8' }}>· {m.cidade}</span> : null}</span>
                      <span style={{ color:'#94a3b8', fontSize:11 }}>{m.bodes_asfalto_numero ? '#'+m.bodes_asfalto_numero : ''}</span>
                    </div>
                  ))}"""

if antigo_2 not in conteudo:
    print('ERRO: patch 2 (exibir cidade aba membros) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_2, novo_2)

# --- Patch 3: exibir cidade na visao simplificada tambem ---
antigo_3 = """                {membrosLoja.map(m => (
                  <div key={'l'+m.id} style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:8, fontSize:13, color:'#1e293b' }}>
                    {m.nome_completo} <span style={{ fontSize:10, color:'#64748b' }}>· Loja</span>
                  </div>
                ))}"""
novo_3 = """                {membrosLoja.map(m => (
                  <div key={'l'+m.id} style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:8, fontSize:13, color:'#1e293b' }}>
                    {m.nome_completo} <span style={{ fontSize:10, color:'#64748b' }}>· Loja{m.cidade ? ' · ' + m.cidade : ''}</span>
                  </div>
                ))}"""

if antigo_3 not in conteudo:
    print('ERRO: patch 3 (exibir cidade visao simplificada) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_3, novo_3)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: BodesAsfalto.jsx atualizado com sucesso. Backup em', arquivo + '.bak')