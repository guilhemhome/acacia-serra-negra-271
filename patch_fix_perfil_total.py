path = "src/App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = "if (perfilAtual === 'ADM') { setNivel('total'); return }"
new_str = "if (perfilAtual === 'ADM' || perfilAtual === 'Total') { setNivel('total'); return }"

if old_str not in content:
    print("ERRO")
else:
    content = content.replace(old_str, new_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK")
