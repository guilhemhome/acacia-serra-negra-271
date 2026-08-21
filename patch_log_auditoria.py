path = 'src/pages/Configuracoes.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_toggle_admin = """    const { error } = await supabase.from('perfis_acesso').update({ is_admin: novoValor }).eq('user_id', userId)
    if (error) msg('Erro ao alterar ADM: ' + error.message)
    else {
      msg(novoValor ? 'ADM concedido' : 'ADM revogado')
      setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, is_admin: novoValor } : p))
    }
  }"""

new_toggle_admin = """    const { error } = await supabase.from('perfis_acesso').update({ is_admin: novoValor }).eq('user_id', userId)
    if (error) msg('Erro ao alterar ADM: ' + error.message)
    else {
      msg(novoValor ? 'ADM concedido' : 'ADM revogado')
      setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, is_admin: novoValor } : p))
      const { data: { user: userAtual } } = await supabase.auth.getUser()
      await supabase.from('log_alteracoes_acesso').insert({
        user_id: userId, nome: nome, campo: 'is_admin',
        valor_anterior: atual, valor_novo: novoValor,
        alterado_por_user_id: userAtual?.id || null,
        alterado_por_nome: userAtual?.email || null
      })
    }
  }"""

old_toggle_teste = """    const { error } = await supabase.from('associados').update({ conta_teste: novoValor }).eq('id', assocId)
    if (error) msg('Erro ao ' + acao.toLowerCase() + ': ' + error.message)
    else {
      msg(novoValor ? 'Marcado como conta de teste ✅' : 'Removido da conta de teste ✅')
      setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, associados: { ...p.associados, conta_teste: novoValor } } : p))
    }
  }"""

new_toggle_teste = """    const { error } = await supabase.from('associados').update({ conta_teste: novoValor }).eq('id', assocId)
    if (error) msg('Erro ao ' + acao.toLowerCase() + ': ' + error.message)
    else {
      msg(novoValor ? 'Marcado como conta de teste ✅' : 'Removido da conta de teste ✅')
      setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, associados: { ...p.associados, conta_teste: novoValor } } : p))
      const { data: { user: userAtual } } = await supabase.auth.getUser()
      await supabase.from('log_alteracoes_acesso').insert({
        associado_id: assocId, user_id: userId, nome: nome, campo: 'conta_teste',
        valor_anterior: atual, valor_novo: novoValor,
        alterado_por_user_id: userAtual?.id || null,
        alterado_por_nome: userAtual?.email || null
      })
    }
  }"""

erros = 0
for old, new, label in [(old_toggle_admin, new_toggle_admin, 'toggleAdmin'), (old_toggle_teste, new_toggle_teste, 'toggleContaTeste')]:
    if old not in content:
        print(f'ERRO: bloco {label} nao encontrado')
        erros += 1
    else:
        content = content.replace(old, new)
        print(f'OK: bloco {label} aplicado')

if erros == 0:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Arquivo salvo com sucesso')
else:
    print('NADA foi salvo devido a erros acima')
