import shutil

arquivo = 'src/pages/BodesAsfalto.jsx'
shutil.copy(arquivo, arquivo + '.bak4')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

def aplicar(conteudo, antigo, novo, nome):
    ocorrencias = conteudo.count(antigo)
    if ocorrencias != 1:
        print(f'ERRO no passo "{nome}": encontrado {ocorrencias} vez(es) (esperado 1). Nada foi alterado a partir daqui.')
        raise SystemExit(1)
    return conteudo.replace(antigo, novo)

# Passo 1: buscar perfis_acesso logo apos setMeuAssocId
conteudo = aplicar(
    conteudo,
    "setMeuAssocId(assoc.id)",
    """setMeuAssocId(assoc.id)
    const { data: perfilAcesso } = await supabase.from('perfis_acesso')
      .select('is_admin').eq('user_id', session.user.id).maybeSingle()
    const souAdmSistema = perfilAcesso?.is_admin === true""",
    "passo1-buscar-admin"
)

# Passo 2: setMeuCargoBodes considera admin
conteudo = aplicar(
    conteudo,
    "setMeuCargoBodes(cargoAtivo)",
    "setMeuCargoBodes(cargoAtivo || (souAdmSistema ? 'Administrador' : ''))",
    "passo2-cargo-exibido"
)

# Passo 3: setEhGestor considera admin
conteudo = aplicar(
    conteudo,
    "setEhGestor(!!cargoAtivo)",
    "setEhGestor(!!cargoAtivo || souAdmSistema)",
    "passo3-eh-gestor"
)

# Passo 4: bloco de carregamento considera admin
conteudo = aplicar(
    conteudo,
    "if (cargoAtivo) {",
    "if (cargoAtivo || souAdmSistema) {",
    "passo4-bloco-carregamento"
)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: BodesAsfalto.jsx atualizado em 4 passos — ADM do sistema agora tem acesso total ao modulo. Backup em', arquivo + '.bak4')
