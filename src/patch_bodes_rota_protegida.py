import shutil

arquivo = 'src/App.jsx'
shutil.copy(arquivo, arquivo + '.bak')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

antigo = """        if (!ativo) return
        setPerfil(perfilAtual)
        if (perfilAtual === 'ADM' || perfilAtual === 'Total') { setNivel('total'); return }
        if (!modulo) { setNivel('total'); return }
        const { data: perm } = await supabase.from('permissoes_perfil')
          .select('nivel').eq('perfil', perfilAtual).eq('modulo', modulo).maybeSingle()
        if (!ativo) return
        setNivel(perm?.nivel || 'bloqueado')"""

novo = """        if (!ativo) return
        setPerfil(perfilAtual)
        if (perfilAtual === 'ADM' || perfilAtual === 'Total') { setNivel('total'); return }
        if (!modulo) { setNivel('total'); return }
        const { data: perm } = await supabase.from('permissoes_perfil')
          .select('nivel').eq('perfil', perfilAtual).eq('modulo', modulo).maybeSingle()
        if (!ativo) return
        let nivelFinal = perm?.nivel || 'bloqueado'

        // Modulo Bodes do Asfalto: acesso aditivo via cargo, sem depender do perfil principal
        // (que rege o acesso a loja). Um irmao pode ter perfil de loja bloqueado nesse modulo
        // e ainda assim ter acesso total por ocupar um dos cargos dos Bodes.
        if (modulo === '/bodes-asfalto' && nivelFinal === 'bloqueado') {
          const { data: cargosBodes } = await supabase.from('cargos').select('nome').eq('categoria', 'Bodes do Asfalto')
          const nomesCargosBodes = (cargosBodes || []).map(c => c.nome)
          if (!ativo) return
          if (nomesCargosBodes.length > 0) {
            const { data: meuAssoc } = await supabase.from('associados').select('id').eq('user_id', session.user.id).maybeSingle()
            if (!ativo) return
            if (meuAssoc?.id) {
              const { data: meuCargoBodes } = await supabase.from('cargos_historico')
                .select('id').eq('associado_id', meuAssoc.id).eq('em_exercicio', true)
                .in('cargo', nomesCargosBodes).maybeSingle()
              if (!ativo) return
              if (meuCargoBodes) nivelFinal = 'total'
            }
          }
        }

        setNivel(nivelFinal)"""

if antigo not in conteudo:
    print('ERRO: trecho nao encontrado em App.jsx. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo, novo)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: App.jsx atualizado com sucesso. Backup em', arquivo + '.bak')