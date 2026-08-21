import sys

path = "src/pages/Membros.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """    const { data, error } = await supabase
      .from('associados')
      .select('*')
      .order('nome_completo', { ascending: true })
    if (!error) setMembros(data || [])"""

new = """    const { data, error } = await supabase
      .from('associados')
      .select('*')
      .eq('conta_teste', false)
      .order('nome_completo', { ascending: true })
    if (!error) setMembros(data || [])"""

if old not in content:
    print("ERRO: bloco nao encontrado")
    sys.exit(1)

content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
