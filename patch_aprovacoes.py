import sys

path = "src/pages/Aprovacoes.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """      const { data: p } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', session.user.id).maybeSingle()
      setPerfilLogado(p?.perfil || 'Membro')"""

new = """      const { data: p } = await supabase.from('perfis_acesso').select('perfil, is_admin').eq('user_id', session.user.id).maybeSingle()
      setPerfilLogado(p?.is_admin === true ? 'ADM' : (p?.perfil || 'Membro'))"""

if old not in content:
    print("ERRO: bloco nao encontrado")
    sys.exit(1)

content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
