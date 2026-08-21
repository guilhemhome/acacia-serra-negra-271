import sys

path = "src/pages/Configuracoes.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old1 = """        const { data: assocs } = await supabase
          .from('associados')
          .select('id, user_id, nome_completo, email, cpf, situacao')
          .in('user_id', ps.map(p => p.user_id))"""

new1 = """        const { data: assocs } = await supabase
          .from('associados')
          .select('id, user_id, nome_completo, email, cpf, situacao, conta_teste')
          .in('user_id', ps.map(p => p.user_id))"""

old2 = """  async function alterarPerfil(userId, novoPerfil) {
    const { error } = await supabase.from('perfis_acesso')
      .upsert({ user_id: userId, perfil: novoPerfil }, { onConflict: 'user_id' })
    if (error) msg('Erro ao alterar perfil: ' + error.message)
    else {
      msg('Perfil atualizado! ✅')
      setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, perfil: novoPerfil } : p))
    }
  }"""

new2 = """  async function alterarPerfil(userId, novoPerfil) {
    const { error } = await supabase.from('perfis_acesso')
      .upsert({ user_id: userId, perfil: novoPerfil }, { onConflict: 'user_id' })
    if (error) msg('Erro ao alterar perfil: ' + error.message)
    else {
      msg('Perfil atualizado! ✅')
      setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, perfil: novoPerfil } : p))
    }
  }
  async function toggleContaTeste(assocId, userId, atual, nome) {
    const novoValor = !atual
    const acao = novoValor ? 'MARCAR' : 'DESMARCAR'
    const aviso = novoValor
      ? `Marcar "${nome}" como CONTA DE TESTE?\\n\\nContas de teste somem das listas vistas pelos irmãos (aniversários, presenças, membros).`
      : `Remover "${nome}" da marcação de CONTA DE TESTE?\\n\\nEla voltará a aparecer normalmente em todas as listas.`
    if (!window.confirm(aviso)) return
    if (!assocId) { msg('Este usuário não tem associado vinculado.'); return }
    const { error } = await supabase.from('associados').update({ conta_teste: novoValor }).eq('id', assocId)
    if (error) msg('Erro ao ' + acao.toLowerCase() + ': ' + error.message)
    else {
      msg(novoValor ? 'Marcado como conta de teste ✅' : 'Removido da conta de teste ✅')
      setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, associados: { ...p.associados, conta_teste: novoValor } } : p))
    }
  }"""

old3 = """                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => p.associados?.id ? navigate('/perfil/' + p.associados.id) : msg('Associado sem perfil cadastrado.')}
                          style={{ flex:1, padding:'6px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#1a237e', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          Ver perfil
                        </button>
                        <button onClick={() => resetarSenha(p.associados?.email)}
                          style={{ flex:1, padding:'6px 0', borderRadius:8, border:'none', background:'#fef3c7', color:'#b45309', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          Resetar senha
                        </button>
                      </div>"""

new3 = """                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => p.associados?.id ? navigate('/perfil/' + p.associados.id) : msg('Associado sem perfil cadastrado.')}
                          style={{ flex:1, padding:'6px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#1a237e', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          Ver perfil
                        </button>
                        <button onClick={() => resetarSenha(p.associados?.email)}
                          style={{ flex:1, padding:'6px 0', borderRadius:8, border:'none', background:'#fef3c7', color:'#b45309', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          Resetar senha
                        </button>
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:8 }}>
                        <button onClick={() => toggleContaTeste(p.associados?.id, p.user_id, !!p.associados?.conta_teste, p.associados?.nome_completo || 'este usuário')}
                          style={{ flex:1, padding:'6px 0', borderRadius:8, border:'none', background: p.associados?.conta_teste ? '#fee2e2' : '#f1f5f9', color: p.associados?.conta_teste ? '#b91c1c' : '#475569', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          {p.associados?.conta_teste ? '🧪 Remover conta de teste' : '🧪 Marcar como conta de teste'}
                        </button>
                      </div>"""

erro = False
if old1 not in content:
    print("ERRO: bloco 1 nao encontrado")
    erro = True
if old2 not in content:
    print("ERRO: bloco 2 nao encontrado")
    erro = True
if old3 not in content:
    print("ERRO: bloco 3 nao encontrado")
    erro = True
if erro:
    sys.exit(1)

content = content.replace(old1, new1)
content = content.replace(old2, new2)
content = content.replace(old3, new3)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
