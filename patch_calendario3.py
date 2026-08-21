import sys

path = "src/pages/Calendario.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """    const { data: p } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', session.user.id).maybeSingle()
    const perfilAtual = p?.perfil || 'membro'
    setPerfil(perfilAtual)"""

new = """    const { data: p } = await supabase.from('perfis_acesso').select('perfil, is_admin').eq('user_id', session.user.id).maybeSingle()
    const perfilAtual = p?.is_admin === true ? 'ADM' : (p?.perfil || 'membro')
    setPerfil(perfilAtual)"""

if old not in content:
    print("ERRO: bloco nao encontrado")
    sys.exit(1)

content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
