path = "src/pages/EditarPerfil.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Select 1: criar novo familiar (linhas ~344-346)
old1 = '''<option value="">Selecione...</option>
                    <option value="esposa">Esposa</option>
                    <option value="filho">Filho</option>
                    <option value="filha">Filha</option>
                  </select>'''
new1 = '''<option value="">Selecione...</option>
                    <option value="esposa">Esposa</option>
                    <option value="filho">Filho</option>
                    <option value="filha">Filha</option>
                    <option value="enteado">Enteado</option>
                    <option value="enteada">Enteada</option>
                  </select>'''

# Select 2: editar familiar (linhas ~364-370)
old2 = '''<option value="">Selecione...</option>
                          <option value="esposa">Esposa</option>
                          <option value="esposo">Esposo</option>
                          <option value="filho">Filho</option>
                          <option value="filha">Filha</option>
                          <option value="pai">Pai</option>
                          <option value="mãe">Mãe</option>
                          <option value="outro">Outro</option>
                        </select>'''
new2 = '''<option value="">Selecione...</option>
                          <option value="esposa">Esposa</option>
                          <option value="esposo">Esposo</option>
                          <option value="filho">Filho</option>
                          <option value="filha">Filha</option>
                          <option value="enteado">Enteado</option>
                          <option value="enteada">Enteada</option>
                          <option value="pai">Pai</option>
                          <option value="mãe">Mãe</option>
                          <option value="outro">Outro</option>
                        </select>'''

erros = []
if old1 not in content:
    erros.append("ERRO: select 1 (criar familiar) não encontrado")
if old2 not in content:
    erros.append("ERRO: select 2 (editar familiar) não encontrado")

if erros:
    for e in erros:
        print(e)
else:
    content = content.replace(old1, new1).replace(old2, new2)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: patch aplicado nos dois selects")
