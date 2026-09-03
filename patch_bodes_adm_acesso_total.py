import shutil

arquivo = 'src/pages/BodesAsfalto.jsx'
shutil.copy(arquivo, arquivo + '.bak3')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

antigo = """    const { data: assoc } = await supabase.from('associados')
      .select('id, bodes_asfalto').eq('user_id', session.user.id).maybeSingle()
    if (!assoc) { navigate('/membro'); return }
    setMeuAssocId(assoc.id)
    const { data: cargosBodes } = await supabase.from('cargos').select('nome').eq('categoria', 'Bodes do Asfalto')
    const nomesCargos = (cargosBodes || []).map(c => c.nome)
    let cargoAtivo = ''
    if (nomesCargos.length > 0) {
      const { data: meuCargo } = await supabase.from('cargos_historico')
        .select('cargo').eq('associado_id', assoc.id).eq('em_exercicio', true)
        .in('cargo', nomesCargos).maybeSingle()
      cargoAtivo = meuCargo?.cargo || ''
    }
    setMeuCargoBodes(cargoAtivo)
    setEhGestor(!!cargoAtivo)
    if (cargoAtivo) {"""

novo = """    const { data: assoc } = await supabase.from('associados')
      .select('id, bodes_asfalto').eq('user_id', session.user.id).maybeSingle()
    if (!assoc) { navigate('/membro'); return }
    setMeuAssocId(assoc.id)
    // ADM do sistema tem acesso total a todos os modulos, incluindo Bodes do Asfalto,
    // independente de possuir cargo especifico dos Bodes.
    const { data: perfilAcesso } = await supabase.from('perfis_acesso')
      .select('is_admin').eq('user_id', session.user.id).maybeSingle()
    const souAdmSistema = perfilAcesso?.is_admin === true
    const { data: cargosBodes } = await supabase.from('cargos').select('nome').eq('categoria', 'Bodes do Asfalto')
    const nomesCargos = (cargosBodes || []).map(c => c.nome)
    let cargoAtivo = ''
    if (nomesCargos.length > 0) {
      const { data: meuCargo } = await supabase.from('cargos_historico')
        .select('cargo').eq('associado_id', assoc.id).eq('em_exercicio', true)
        .in('cargo', nomesCargos).maybeSingle()
      cargoAtivo = meuCargo?.cargo || ''
    }
    setMeuCargoBodes(cargoAtivo || (souAdmSistema ? 'Administrador' : ''))
    setEhGestor(!!cargoAtivo || souAdmSistema)
    if (cargoAtivo || souAdmSistema) {"""

if antigo not in conteudo:
    print('ERRO: trecho nao encontrado. Nada foi alterado.')
    raise SystemExit(1)

conteudo = conteudo.replace(antigo, novo)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: BodesAsfalto.jsx atualizado — ADM do sistema agora tem acesso total ao modulo. Backup em', arquivo + '.bak3')
