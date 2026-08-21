import sys

path = "src/pages/Dashboard.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old1 = """            Promise.all([
              supabase.from('eventos_presencas').select('resposta, justificativa, associados(id, nome_completo, apelido)').eq('evento_id', proximoEvento.id),
              supabase.from('cargos_historico').select('associado_id, cargo').eq('em_exercicio', true)
            ]).then(([{ data: pres }, { data: cargosAtivos }]) => {
                const cargoMap = {}
                ;(cargosAtivos||[]).forEach(c => { cargoMap[c.associado_id] = c.cargo })
                function nomeModal(p) {
                  const assoc = p.associados
                  const apelido = assoc?.apelido || assoc?.nome_completo?.split(' ')[0] || '?'
                  const cargo = cargoMap[assoc?.id]
                  return cargo ? `${cargo} ${apelido}` : `Ir\\u2234 ${apelido}`
                }
                const confirmados = (pres||[]).filter(p => p.resposta === 'presente').length
                const ausentes = (pres||[]).filter(p => p.resposta === 'ausente').length
                setResumoPresencas({ confirmados, ausentes, total: stats.ativos || 0 })
                const confList = (pres||[]).filter(p => p.resposta === 'presente').map(p => ({ nome: nomeModal(p) }))
                const ausList = (pres||[]).filter(p => p.resposta === 'ausente').map(p => ({ nome: nomeModal(p), motivo: p.justificativa || '' }))
                setListaPresencas({ confirmados: confList, ausentes: ausList, pendentes: [] })
              })"""

new1 = """            Promise.all([
              supabase.from('eventos_presencas').select('resposta, justificativa, associados(id, nome_completo, apelido, situacao, conta_teste)').eq('evento_id', proximoEvento.id),
              supabase.from('cargos_historico').select('associado_id, cargo').eq('em_exercicio', true)
            ]).then(([{ data: pres }, { data: cargosAtivos }]) => {
                const presReal = (pres||[]).filter(p => p.associados?.situacao === 'ativo' && !p.associados?.conta_teste)
                const cargoMap = {}
                ;(cargosAtivos||[]).forEach(c => { cargoMap[c.associado_id] = c.cargo })
                function nomeModal(p) {
                  const assoc = p.associados
                  const apelido = assoc?.apelido || assoc?.nome_completo?.split(' ')[0] || '?'
                  const cargo = cargoMap[assoc?.id]
                  return cargo ? `${cargo} ${apelido}` : `Ir\\u2234 ${apelido}`
                }
                const confirmados = presReal.filter(p => p.resposta === 'presente').length
                const ausentes = presReal.filter(p => p.resposta === 'ausente').length
                setResumoPresencas({ confirmados, ausentes, total: stats.ativos || 0 })
                const confList = presReal.filter(p => p.resposta === 'presente').map(p => ({ nome: nomeModal(p) }))
                const ausList = presReal.filter(p => p.resposta === 'ausente').map(p => ({ nome: nomeModal(p), motivo: p.justificativa || '' }))
                setListaPresencas({ confirmados: confList, ausentes: ausList, pendentes: [] })
              })"""

old2 = """      const { data: pres } = await supabase.from('eventos_presencas')
        .select('resposta, justificativa, associados(id, nome_completo, apelido)')
        .eq('evento_id', proxEvento.id)
      const { data: cargosAtivos } = await supabase.from('cargos_historico').select('associado_id, cargo').eq('em_exercicio', true)
      const { data: todosAtivos } = await supabase.from('associados').select('id, nome_completo, apelido').eq('status_cadastro', 'aprovado').eq('situacao', 'ativo')
      const cargoMap = {}
      ;(cargosAtivos||[]).forEach(c => { cargoMap[c.associado_id] = c.cargo })
      function nomeModal(p) {
        const assoc = p.associados
        const apelido = assoc?.apelido || assoc?.nome_completo?.split(' ')[0] || '?'
        const cargo = cargoMap[assoc?.id]
        return cargo ? `${cargo} ${apelido}` : `Ir\\u2234 ${apelido}`
      }
      const confirmados = (pres||[]).filter(p => p.resposta === 'presente').length
      const ausentes = (pres||[]).filter(p => p.resposta === 'ausente').length
      setResumoPresencas({ confirmados, ausentes, total: ativos || 0 })
      const confList = (pres||[]).filter(p => p.resposta === 'presente').map(p => ({ nome: nomeModal(p) }))
      const ausList = (pres||[]).filter(p => p.resposta === 'ausente').map(p => ({ nome: nomeModal(p), motivo: p.justificativa || '' }))
      const respondidoIds = new Set((pres||[]).map(p => p.associados?.id).filter(Boolean))
      const pendList = (todosAtivos||[]).filter(m => !respondidoIds.has(m.id)).map(m => ({ nome: nomeModal({ associados: m }) }))
      setListaPresencas({ confirmados: confList, ausentes: ausList, pendentes: pendList })
      const minhaResp = (pres||[]).find(p => p.associados?.id === assoc?.id)
      setMinhaPresenca(minhaResp ? { resposta: minhaResp.resposta, justificativa: minhaResp.justificativa } : null)"""

new2 = """      const { data: pres } = await supabase.from('eventos_presencas')
        .select('resposta, justificativa, associados(id, nome_completo, apelido, situacao, conta_teste)')
        .eq('evento_id', proxEvento.id)
      const { data: cargosAtivos } = await supabase.from('cargos_historico').select('associado_id, cargo').eq('em_exercicio', true)
      const { data: todosAtivos } = await supabase.from('associados').select('id, nome_completo, apelido').eq('status_cadastro', 'aprovado').eq('situacao', 'ativo').eq('conta_teste', false)
      const presReal = (pres||[]).filter(p => p.associados?.situacao === 'ativo' && !p.associados?.conta_teste)
      const cargoMap = {}
      ;(cargosAtivos||[]).forEach(c => { cargoMap[c.associado_id] = c.cargo })
      function nomeModal(p) {
        const assoc = p.associados
        const apelido = assoc?.apelido || assoc?.nome_completo?.split(' ')[0] || '?'
        const cargo = cargoMap[assoc?.id]
        return cargo ? `${cargo} ${apelido}` : `Ir\\u2234 ${apelido}`
      }
      const confirmados = presReal.filter(p => p.resposta === 'presente').length
      const ausentes = presReal.filter(p => p.resposta === 'ausente').length
      setResumoPresencas({ confirmados, ausentes, total: ativos || 0 })
      const confList = presReal.filter(p => p.resposta === 'presente').map(p => ({ nome: nomeModal(p) }))
      const ausList = presReal.filter(p => p.resposta === 'ausente').map(p => ({ nome: nomeModal(p), motivo: p.justificativa || '' }))
      const respondidoIds = new Set(presReal.map(p => p.associados?.id).filter(Boolean))
      const pendList = (todosAtivos||[]).filter(m => !respondidoIds.has(m.id)).map(m => ({ nome: nomeModal({ associados: m }) }))
      setListaPresencas({ confirmados: confList, ausentes: ausList, pendentes: pendList })
      const minhaResp = (pres||[]).find(p => p.associados?.id === assoc?.id)
      setMinhaPresenca(minhaResp ? { resposta: minhaResp.resposta, justificativa: minhaResp.justificativa } : null)"""

erro = False
if old1 not in content:
    print("ERRO: bloco 1 nao encontrado")
    erro = True
if old2 not in content:
    print("ERRO: bloco 2 nao encontrado")
    erro = True

if erro:
    sys.exit(1)

content = content.replace(old1, new1)
content = content.replace(old2, new2)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
