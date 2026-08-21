path = "src/pages/Dashboard.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

erros = []

old1 = "supabase.from('mensagens_templates').select('chave, conteudo')"
new1 = "supabase.from('mensagens_templates').select('chave, mensagem')"
if old1 not in content:
    erros.append("old1")
else:
    content = content.replace(old1, new1)

old2 = "tObj[t.chave] = t.conteudo"
new2 = "tObj[t.chave] = t.mensagem"
if old2 not in content:
    erros.append("old2")
else:
    content = content.replace(old2, new2)

if erros:
    print("ERRO:", erros)
else:
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK")
