import sys

path = "src/pages/Calendario.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old1 = """    const { data: irmaos } = await supabase.from('associados')
      .select('id, nome_completo, data_nascimento, tel_celular, data_casamento, bodes_asfalto, bodes_asfalto_data_admissao')
      .eq('status_cadastro','aprovado')
      .eq('situacao','ativo')"""

new1 = """    const { data: irmaos } = await supabase.from('associados')
      .select('id, nome_completo, data_nascimento, tel_celular, data_casamento, bodes_asfalto, bodes_asfalto_data_admissao')
      .eq('status_cadastro','aprovado')
      .eq('situacao','ativo')
      .eq('conta_teste', false)"""

old2 = """    const { data: deps } = await supabase.from('familiares')
      .select('nome, data_nascimento, parentesco, associado_id, associados(nome_completo, tel_celular)')
      .not('data_nascimento','is',null)
    const fam = (deps||[]).filter(d => d.data_nascimento && d.data_nascimento.split('-')[1] === mes)
      .sort((a,b) => Number(a.data_nascimento.split('-')[2]) - Number(b.data_nascimento.split('-')[2]))
    setFamiliares(fam)"""

new2 = """    const { data: deps } = await supabase.from('familiares')
      .select('nome, data_nascimento, parentesco, associado_id, associados(nome_completo, tel_celular, conta_teste)')
      .not('data_nascimento','is',null)
    const fam = (deps||[]).filter(d => {
      const assocD = Array.isArray(d.associados) ? d.associados[0] : d.associados
      return !assocD?.conta_teste && d.data_nascimento && d.data_nascimento.split('-')[1] === mes
    }).sort((a,b) => Number(a.data_nascimento.split('-')[2]) - Number(b.data_nascimento.split('-')[2]))
    setFamiliares(fam)"""

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
