import sys

path = "src/pages/Configuracoes.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old1 = """  useEffect(() => {
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/'); return }
      // Carregar configurações"""

new1 = """  const [meuUserId, setMeuUserId] = useState(null)
  useEffect(() => {
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/'); return }
      setMeuUserId(session.user.id)
      // Carregar configurações"""

old2 = """  async function toggleContaTeste(assocId, userId, atual, nome) {"""

new2 = """  async function toggleAdmin(userId, atual, nome) {
    if (userId === meuUserId) { msg('Por seguranca, voce nao pode conceder/revogar ADM da sua propria conta por aqui.'); return }
    const novoValor = !atual
    const aviso = novoValor
      ? ('Conceder acesso ADM (total) para "' + nome + '"?\\n\\nEssa pessoa passara a ter acesso irrestrito a todo o sistema.')
      : ('Revogar acesso ADM de "' + nome + '"?\\n\\nEssa pessoa perdera acesso administrativo total.')
    if (!window.confirm(aviso)) return
    const { error } = await supabase.from('perfis_acesso').update({ is_admin: novoValor }).eq('user_id', userId)
    if (error) msg('Erro ao alterar ADM: ' + error.message)
    else {
      msg(novoValor ? 'ADM concedido' : 'ADM revogado')
      setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, is_admin: novoValor } : p))
    }
  }
  async function toggleContaTeste(assocId, userId, atual, nome) {"""

old3 = """                      <div style={{ display:'flex', gap:8, marginTop:8 }}>
                        <button onClick={() => toggleContaTeste(p.associados?.id, p.user_id, !!p.associados?.conta_teste, p.associados?.nome_completo || 'este usuário')}
                          style={{ flex:1, padding:'6px 0', borderRadius:8, border:'none', background: p.associados?.conta_teste ? '#fee2e2' : '#f1f5f9', color: p.associados?.conta_teste ? '#b91c1c' : '#475569', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          {p.associados?.conta_teste ? '🧪 Remover conta de teste' : '🧪 Marcar como conta de teste'}
                        </button>
                      </div>"""

new3 = """                      <div style={{ display:'flex', gap:8, marginTop:8 }}>
                        <button onClick={() => toggleContaTeste(p.associados?.id, p.user_id, !!p.associados?.conta_teste, p.associados?.nome_completo || 'este usuário')}
                          style={{ flex:1, padding:'6px 0', borderRadius:8, border:'none', background: p.associados?.conta_teste ? '#fee2e2' : '#f1f5f9', color: p.associados?.conta_teste ? '#b91c1c' : '#475569', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          {p.associados?.conta_teste ? '🧪 Remover conta de teste' : '🧪 Marcar como conta de teste'}
                        </button>
                      </div>
                      {p.user_id !== meuUserId && (
                        <div style={{ display:'flex', gap:8, marginTop:8 }}>
                          <button onClick={() => toggleAdmin(p.user_id, !!p.is_admin, p.associados?.nome_completo || 'este usuário')}
                            style={{ flex:1, padding:'6px 0', borderRadius:8, border:'none', background: p.is_admin ? '#fef3c7' : '#e0e7ff', color: p.is_admin ? '#b45309' : '#3730a3', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            {p.is_admin ? '👑 Revogar ADM' : '👑 Conceder ADM'}
                          </button>
                        </div>
                      )}"""

erro = False
if old1 not in content:
    print("ERRO: bloco 1 nao encontrado")
    erro = True
if old2 not in content:
    print("ERRO: bloco 2 nao encontrado")
    erro = True
if old3 not in content:
    print("ERRO: bloco 3 nao encontrado")
    erro = True
if erro:
    sys.exit(1)

content = content.replace(old1, new1)
content = content.replace(old2, new2)
content = content.replace(old3, new3)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
