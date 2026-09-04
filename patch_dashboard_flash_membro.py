import shutil

arquivo = 'src/pages/Dashboard.jsx'
shutil.copy(arquivo, arquivo + '.bak')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

antigo = "const [usuario, setUsuario] = useState({ email: '', perfil: 'Membro', nome: '', apelido: '', cargoAtual: '', cargoMaconico: '' })"
novo = "const [usuario, setUsuario] = useState({ email: '', perfil: '', nome: '', apelido: '', cargoAtual: '', cargoMaconico: '' })"

ocorrencias = conteudo.count(antigo)
if ocorrencias != 1:
    print(f'ERRO: encontrado {ocorrencias} vez(es) (esperado 1). Nada foi alterado.')
    raise SystemExit(1)

conteudo = conteudo.replace(antigo, novo)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: Dashboard.jsx atualizado — badge de perfil nao aparece mais errado durante o carregamento. Backup em', arquivo + '.bak')
