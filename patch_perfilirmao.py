import sys

path = "src/pages/PerfilIrmao.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """      const { data: perfilLogado } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', userId).maybeSingle()
      if (perfilLogado?.perfil === 'ADM') setIsAdm(true)"""

new = """      const { data: perfilLogado } = await supabase.from('perfis_acesso').select('perfil, is_admin').eq('user_id', userId).maybeSingle()
      if (perfilLogado?.is_admin === true || perfilLogado?.perfil === 'ADM') setIsAdm(true)"""

if old not in content:
    print("ERRO: bloco nao encontrado")
    sys.exit(1)

content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
