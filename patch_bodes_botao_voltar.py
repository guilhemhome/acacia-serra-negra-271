import shutil

arquivo = 'src/pages/BodesAsfalto.jsx'
shutil.copy(arquivo, arquivo + '.bak5')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

def aplicar(conteudo, antigo, novo, nome):
    ocorrencias = conteudo.count(antigo)
    if ocorrencias != 1:
        print(f'ERRO no passo "{nome}": encontrado {ocorrencias} vez(es) (esperado 1). Nada foi alterado a partir daqui.')
        raise SystemExit(1)
    return conteudo.replace(antigo, novo)

# Passo 1: novo estado para guardar o destino correto do botao voltar
conteudo = aplicar(
    conteudo,
    "  const [ehGestor, setEhGestor] = useState(false)",
    "  const [ehGestor, setEhGestor] = useState(false)\n  const [destinoVoltar, setDestinoVoltar] = useState('/membro')",
    "passo1-estado-destino"
)

# Passo 2: buscar tambem o perfil (nao so is_admin) e calcular destino correto
conteudo = aplicar(
    conteudo,
    """    const { data: perfilAcesso } = await supabase.from('perfis_acesso')
      .select('is_admin').eq('user_id', session.user.id).maybeSingle()
    const souAdmSistema = perfilAcesso?.is_admin === true""",
    """    const { data: perfilAcesso } = await supabase.from('perfis_acesso')
      .select('perfil, is_admin').eq('user_id', session.user.id).maybeSingle()
    const souAdmSistema = perfilAcesso?.is_admin === true
    const PERFIS_MEMBRO = ['Membro', 'Ritualística', 'Hospitalaria']
    const meuPerfilLoja = perfilAcesso?.perfil || 'Membro'
    setDestinoVoltar(souAdmSistema || !PERFIS_MEMBRO.includes(meuPerfilLoja) ? '/dashboard' : '/membro')""",
    "passo2-calcular-destino"
)

# Passo 3: botao voltar usa o destino calculado, nao mais fixo em /membro
conteudo = aplicar(
    conteudo,
    "<button onClick={() => navigate('/membro')}",
    "<button onClick={() => navigate(destinoVoltar)}",
    "passo3-botao-voltar"
)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: BodesAsfalto.jsx atualizado — botao voltar agora respeita o perfil (ADM/gestor vai para /dashboard). Backup em', arquivo + '.bak5')
