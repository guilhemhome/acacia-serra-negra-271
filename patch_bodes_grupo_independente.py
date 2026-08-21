import shutil

arquivo = 'src/pages/GestaoCargos.jsx'
shutil.copy(arquivo, arquivo + '.bak2')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

# --- Trecho 1: inicio de atribuir(), ate o insert ---
antigo_1 = """  async function atribuir() {
    if (!formAtribuir.associado_id || !formAtribuir.data_inicio) { setMsg('Preencha o irmão e a data de início.'); return }
    // Verificar se o irmão já ocupa algum cargo
    const cargoAtual = exercicio.find(e => e.associado_id === formAtribuir.associado_id)
    if (cargoAtual) {
      setAlertaCargo({ cargoAtual: cargoAtual.cargo, associado_id: formAtribuir.associado_id, data_inicio: formAtribuir.data_inicio, cargo: atribuindo })
      return
    }
    const cargo = atribuindo
    const assocSelecionado = associados.find(a => a.id === formAtribuir.associado_id)
    const ehTeste = assocSelecionado?.conta_teste === true
    const jaOcupa = exercicio.find(e => e.cargo === cargo && (e.associados?.conta_teste === true) === ehTeste)
    if (jaOcupa) {
      await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: formAtribuir.data_inicio }).eq('id', jaOcupa.id)
    }
    const cargoAnteriorAssoc = exercicio.find(e => e.associado_id === formAtribuir.associado_id)
    if (cargoAnteriorAssoc) {
      await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: formAtribuir.data_inicio }).eq('id', cargoAnteriorAssoc.id)
    }
    // Garantia extra: desativar qualquer duplicata remanescente
    await supabase.from('cargos_historico').update({ em_exercicio: false }).eq('cargo', cargo).eq('em_exercicio', true)
    await supabase.from('cargos_historico').update({ em_exercicio: false }).eq('associado_id', formAtribuir.associado_id).eq('em_exercicio', true)
    await supabase.from('cargos_historico').insert({
      associado_id: formAtribuir.associado_id,
      cargo,
      data_inicio: formAtribuir.data_inicio,
      em_exercicio: true
    })"""

novo_1 = """  async function atribuir() {
    if (!formAtribuir.associado_id || !formAtribuir.data_inicio) { setMsg('Preencha o irmão e a data de início.'); return }
    // Cargos da loja e cargos dos Bodes do Asfalto sao grupos independentes: um irmao pode
    // ocupar 1 cargo da loja E 1 cargo dos Bodes ao mesmo tempo, sem um encerrar o outro.
    const novoCargoObj = cargos.find(c => c.nome === atribuindo)
    const novoEhBodes = novoCargoObj?.categoria === 'Bodes do Asfalto'
    const mesmoGrupo = (nomeCargo) => {
      const cat = cargos.find(c => c.nome === nomeCargo)?.categoria
      return (cat === 'Bodes do Asfalto') === novoEhBodes
    }
    // Verificar se o irmão já ocupa algum cargo NO MESMO GRUPO (loja ou Bodes)
    const cargoAtual = exercicio.find(e => e.associado_id === formAtribuir.associado_id && mesmoGrupo(e.cargo))
    if (cargoAtual) {
      setAlertaCargo({ cargoAtual: cargoAtual.cargo, associado_id: formAtribuir.associado_id, data_inicio: formAtribuir.data_inicio, cargo: atribuindo })
      return
    }
    const cargo = atribuindo
    const assocSelecionado = associados.find(a => a.id === formAtribuir.associado_id)
    const ehTeste = assocSelecionado?.conta_teste === true
    const jaOcupa = exercicio.find(e => e.cargo === cargo && (e.associados?.conta_teste === true) === ehTeste)
    if (jaOcupa) {
      await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: formAtribuir.data_inicio }).eq('id', jaOcupa.id)
    }
    // Encerrar cargo anterior do MESMO GRUPO (loja ou Bodes) apenas — nao mexe no outro grupo
    const cargoAnteriorAssoc = exercicio.find(e => e.associado_id === formAtribuir.associado_id && mesmoGrupo(e.cargo))
    if (cargoAnteriorAssoc) {
      await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: formAtribuir.data_inicio }).eq('id', cargoAnteriorAssoc.id)
    }
    // Garantia extra: desativar qualquer duplicata remanescente do MESMO cargo especifico
    await supabase.from('cargos_historico').update({ em_exercicio: false }).eq('cargo', cargo).eq('em_exercicio', true)
    await supabase.from('cargos_historico').insert({
      associado_id: formAtribuir.associado_id,
      cargo,
      data_inicio: formAtribuir.data_inicio,
      em_exercicio: true
    })"""

if antigo_1 not in conteudo:
    print('ERRO: trecho 1 (inicio de atribuir) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_1, novo_1)

# --- Trecho 2: confirmarAlerta() ---
antigo_2 = """  async function confirmarAlerta() {
    const { cargo, associado_id, data_inicio } = alertaCargo
    setAlertaCargo(null)
    const assocSelecionado = associados.find(a => a.id === associado_id)
    const ehTeste = assocSelecionado?.conta_teste === true
    const jaOcupa = exercicio.find(e => e.cargo === cargo && (e.associados?.conta_teste === true) === ehTeste)
    if (jaOcupa) await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: data_inicio }).eq('id', jaOcupa.id)
    const cargoAnterior = exercicio.find(e => e.associado_id === associado_id)
    if (cargoAnterior) await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: data_inicio }).eq('id', cargoAnterior.id)
    await supabase.from('cargos_historico').insert({ associado_id, cargo, data_inicio, em_exercicio: true })"""

novo_2 = """  async function confirmarAlerta() {
    const { cargo, associado_id, data_inicio } = alertaCargo
    setAlertaCargo(null)
    const cargoObjNovo = cargos.find(c => c.nome === cargo)
    const novoEhBodes = cargoObjNovo?.categoria === 'Bodes do Asfalto'
    const mesmoGrupo = (nomeCargo) => {
      const cat = cargos.find(c => c.nome === nomeCargo)?.categoria
      return (cat === 'Bodes do Asfalto') === novoEhBodes
    }
    const assocSelecionado = associados.find(a => a.id === associado_id)
    const ehTeste = assocSelecionado?.conta_teste === true
    const jaOcupa = exercicio.find(e => e.cargo === cargo && (e.associados?.conta_teste === true) === ehTeste)
    if (jaOcupa) await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: data_inicio }).eq('id', jaOcupa.id)
    // Encerrar cargo anterior do MESMO GRUPO (loja ou Bodes) apenas
    const cargoAnterior = exercicio.find(e => e.associado_id === associado_id && mesmoGrupo(e.cargo))
    if (cargoAnterior) await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: data_inicio }).eq('id', cargoAnterior.id)
    await supabase.from('cargos_historico').insert({ associado_id, cargo, data_inicio, em_exercicio: true })"""

if antigo_2 not in conteudo:
    print('ERRO: trecho 2 (confirmarAlerta) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_2, novo_2)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: GestaoCargos.jsx (patch 2) atualizado com sucesso. Backup em', arquivo + '.bak2')