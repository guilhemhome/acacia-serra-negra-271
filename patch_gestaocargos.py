path = 'src/pages/GestaoCargos.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_str = """    const { data: perfil } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', user.id).maybeSingle()
    if (!perfil || !['ADM','Venerável Mestre'].includes(perfil.perfil)) { navigate('/dashboard'); return }
    setNivelAcesso(perfil.perfil)"""

new_str = """    const { data: perfil } = await supabase.from('perfis_acesso').select('perfil, is_admin').eq('user_id', user.id).maybeSingle()
    const ehAdmin = perfil?.is_admin === true
    const ehVeneravel = perfil?.perfil === 'Venerável Mestre'
    if (!perfil || (!ehAdmin && !ehVeneravel)) { navigate('/dashboard'); return }
    setNivelAcesso(ehAdmin ? 'ADM' : perfil.perfil)"""

if old_str not in content:
    print('ERRO: trecho original nao encontrado')
else:
    content = content.replace(old_str, new_str)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: patch aplicado')
