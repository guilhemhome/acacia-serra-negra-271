import sys

path = "src/pages/Dashboard.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old1 = """      supabase.from('associados').select('nome_completo, data_nascimento, tel_celular').eq('status_cadastro', 'aprovado').eq('situacao', 'ativo'),
      supabase.from('familiares').select('nome, data_nascimento, parentesco, associados(nome_completo, tel_celular)').not('data_nascimento', 'is', null),"""

new1 = """      supabase.from('associados').select('nome_completo, data_nascimento, tel_celular').eq('status_cadastro', 'aprovado').eq('situacao', 'ativo').eq('conta_teste', false),
      supabase.from('familiares').select('nome, data_nascimento, parentesco, associados(nome_completo, tel_celular, conta_teste)').not('data_nascimento', 'is', null),"""

old2 = """    fams.forEach(f => {
      if (dentroIntervalo(f.data_nascimento)) {
        const assocF = Array.isArray(f.associados) ? f.associados[0] : f.associados
        list.push({ nome: f.nome, detalhe: f.parentesco, dia: diaAniv(f.data_nascimento), data_nascimento: f.data_nascimento, tel: (assocF?.tel_celular || '').replace(/D/g, ''), nomeIrmao: assocF?.nome_completo || '', parentesco: f.parentesco || '', tipo: 'familiar', diasRestantes: diasParaAniv(f.data_nascimento) })
      }
    })"""

new2 = """    fams.forEach(f => {
      const assocF = Array.isArray(f.associados) ? f.associados[0] : f.associados
      if (assocF?.conta_teste) return
      if (dentroIntervalo(f.data_nascimento)) {
        list.push({ nome: f.nome, detalhe: f.parentesco, dia: diaAniv(f.data_nascimento), data_nascimento: f.data_nascimento, tel: (assocF?.tel_celular || '').replace(/D/g, ''), nomeIrmao: assocF?.nome_completo || '', parentesco: f.parentesco || '', tipo: 'familiar', diasRestantes: diasParaAniv(f.data_nascimento) })
      }
    })"""

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
