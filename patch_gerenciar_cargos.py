path = "src/pages/GestaoCargos.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = "{[['atual','⚒️ Cargos Atuais'],['gerenciar','⚙️ Gerenciar Lista']].map(([k,l]) => ("
new_str = "{[['atual','⚒️ Cargos Atuais'],['gerenciar','⚙️ Gerenciar Cargos']].map(([k,l]) => ("

if old_str not in content:
    print("ERRO: trecho não encontrado")
else:
    content = content.replace(old_str, new_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: patch aplicado")
