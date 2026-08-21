path = "src/pages/Configuracoes.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = "    { chave: '/configuracoes', nome: 'Configurações' },\n"
new_str = ""

if old_str not in content:
    print("ERRO: trecho original nao encontrado")
else:
    content = content.replace(old_str, new_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: patch aplicado")
