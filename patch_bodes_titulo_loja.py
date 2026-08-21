import shutil

arquivo = 'src/pages/PortalMembro.jsx'
shutil.copy(arquivo, arquivo + '.bak3')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

antigo = """    const { data: cargosProprio } = await supabase.from('cargos_historico')
      .select('cargo').eq('associado_id', assoc.id).eq('em_exercicio', true).maybeSingle()
    setMeuCargo(cargosProprio?.cargo || '')"""

novo = """    // Titulo da saudacao reflete apenas cargo da LOJA, nunca cargo dos Bodes do Asfalto
    // (que tem sua propria exibicao dentro do modulo). Usa lista (nao maybeSingle) porque
    // uma pessoa pode ter 1 cargo de loja + 1 cargo dos Bodes ativos ao mesmo tempo.
    const { data: meusCargosAtivos } = await supabase.from('cargos_historico')
      .select('cargo').eq('associado_id', assoc.id).eq('em_exercicio', true)
    const { data: cargosBodesList } = await supabase.from('cargos').select('nome').eq('categoria', 'Bodes do Asfalto')
    const nomesBodes = new Set((cargosBodesList || []).map(c => c.nome))
    const cargoLojaAtivo = (meusCargosAtivos || []).find(c => !nomesBodes.has(c.cargo))
    setMeuCargo(cargoLojaAtivo?.cargo || '')"""

if antigo not in conteudo:
    print('ERRO: trecho (cargo proprio) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo, novo)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: PortalMembro.jsx (patch 3) atualizado com sucesso. Backup em', arquivo + '.bak3')