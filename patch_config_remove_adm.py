import sys

path = "src/pages/Configuracoes.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """                      <option value="Total">Total</option>
                      <option value="ADM">ADM</option>
                    </select>"""

new = """                      <option value="Total">Total</option>
                    </select>"""

if old not in content:
    print("ERRO: bloco nao encontrado")
    sys.exit(1)

content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
