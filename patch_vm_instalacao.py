path = "src/pages/EditarPerfil.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

erros = []

# 1) Novo estado
old1 = "  const [bodes, setBodes] = useState({ bodes_asfalto:false, bodes_asfalto_numero:'', bodes_asfalto_data_admissao:'' })"
new1 = "  const [bodes, setBodes] = useState({ bodes_asfalto:false, bodes_asfalto_numero:'', bodes_asfalto_data_admissao:'' })\n  const [vmInstalacao, setVmInstalacao] = useState({ data_instalacao_vm:'', loja_instalacao:'' })"
if old1 not in content:
    erros.append("1 (estado)")
else:
    content = content.replace(old1, new1)

# 2) Carregamento dos dados existentes
old2 = "        setBodes({ bodes_asfalto: assoc.bodes_asfalto||false, bodes_asfalto_numero: assoc.bodes_asfalto_numero||'', bodes_asfalto_data_admissao: assoc.bodes_asfalto_data_admissao||'', _eraBode: assoc.bodes_asfalto||false })"
new2 = old2 + "\n        setVmInstalacao({ data_instalacao_vm: assoc.data_instalacao_vm||'', loja_instalacao: assoc.loja_instalacao||'' })"
if old2 not in content:
    erros.append("2 (carregamento)")
else:
    content = content.replace(old2, new2)

# 3) Funcao de salvar
old3 = """  async function salvarBodes() {
    setSalvando(true)
    const { error } = await supabase.from('associados').update({
      bodes_asfalto: bodes.bodes_asfalto,
      bodes_asfalto_numero: bodes.bodes_asfalto_numero || null,
      bodes_asfalto_data_admissao: bodes.bodes_asfalto_data_admissao || null
    }).eq('id', associadoId)
    if (error) msg('Erro ao salvar: ' + error.message)
    else msg('Dados dos Bodes salvos! ✅')
    setSalvando(false)
  }"""
new3 = old3 + """
  async function salvarVmInstalacao() {
    setSalvando(true)
    const { error } = await supabase.from('associados').update({
      data_instalacao_vm: vmInstalacao.data_instalacao_vm || null,
      loja_instalacao: vmInstalacao.loja_instalacao || null
    }).eq('id', associadoId)
    if (error) msg('Erro ao salvar: ' + error.message)
    else msg('Dados de instalação salvos! ✅')
    setSalvando(false)
  }"""
if old3 not in content:
    erros.append("3 (funcao salvar)")
else:
    content = content.replace(old3, new3)

# 4) Campos no formulario (antes da secao Bodes do Asfalto)
old4 = """                {/* Bodes do Asfalto — visível para todos */}
                <>
                    <Secao titulo="🐐 Bodes do Asfalto" />"""
new4 = """                <Secao titulo="🎖️ Instalação como Venerável Mestre" />
                <DateInput label="Data de instalação" value={vmInstalacao.data_instalacao_vm} onChange={v => setVmInstalacao({...vmInstalacao, data_instalacao_vm:v})} />
                <Input label="Loja onde foi instalado" value={vmInstalacao.loja_instalacao} onChange={v => setVmInstalacao({...vmInstalacao, loja_instalacao:v})} />
                <BtnSalvar onClick={salvarVmInstalacao} />

                {/* Bodes do Asfalto — visível para todos */}
                <>
                    <Secao titulo="🐐 Bodes do Asfalto" />"""
if old4 not in content:
    erros.append("4 (formulario)")
else:
    content = content.replace(old4, new4)

if erros:
    print("ERRO: trechos nao encontrados: " + ", ".join(erros))
else:
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: patch aplicado")
