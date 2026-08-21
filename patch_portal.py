import sys

path = "src/pages/PortalMembro.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """    const { data: irmaos } = await supabase.from('associados')
      .select('nome_completo, data_nascimento').eq('status_cadastro','aprovado').eq('situacao','ativo')
    setAniversarios((irmaos||[]).filter(a => a.data_nascimento && a.data_nascimento.split('T')[0].split('-')[1] === mesAtual).slice(0,5))"""

new = """    const { data: irmaos } = await supabase.from('associados')
      .select('nome_completo, data_nascimento').eq('status_cadastro','aprovado').eq('situacao','ativo').eq('conta_teste', false)
    setAniversarios((irmaos||[]).filter(a => a.data_nascimento && a.data_nascimento.split('T')[0].split('-')[1] === mesAtual).slice(0,5))"""

if old not in content:
    print("ERRO: bloco nao encontrado")
    sys.exit(1)

content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
