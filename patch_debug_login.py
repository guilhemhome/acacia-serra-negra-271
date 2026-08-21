path = "src/pages/Login.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = """      const { data: p } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', uid).single()
      const perfil = p?.perfil || 'Membro'
      const perfisMembro = ['Membro', 'Ritualística', 'Hospitalaria']
      navigate(perfisMembro.includes(perfil) ? '/membro' : '/dashboard')"""

new_str = """      const { data: p, error: perfilErr } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', uid).single()
      console.log('DEBUG LOGIN - uid:', uid)
      console.log('DEBUG LOGIN - p:', p)
      console.log('DEBUG LOGIN - perfilErr:', perfilErr)
      const perfil = p?.perfil || 'Membro'
      console.log('DEBUG LOGIN - perfil final:', perfil)
      const perfisMembro = ['Membro', 'Ritualística', 'Hospitalaria']
      console.log('DEBUG LOGIN - vai para:', perfisMembro.includes(perfil) ? '/membro' : '/dashboard')
      navigate(perfisMembro.includes(perfil) ? '/membro' : '/dashboard')"""

if old_str not in content:
    print("ERRO: trecho não encontrado")
else:
    content = content.replace(old_str, new_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: debug adicionado")
