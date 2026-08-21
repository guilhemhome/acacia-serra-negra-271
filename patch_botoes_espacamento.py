path = "src/pages/Configuracoes.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = """                      <div style={{ display:'flex', gap:8, marginTop:8 }}>
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

new_str = """                      <div style={{ display:'flex', gap:8, marginTop:8 }}>
                        <button onClick={() => toggleContaTeste(p.associados?.id, p.user_id, !!p.associados?.conta_teste, p.associados?.nome_completo || 'este usuário')}
                          style={{ flex:1, padding:'6px 4px', borderRadius:8, border:'none', background: p.associados?.conta_teste ? '#fee2e2' : '#f1f5f9', color: p.associados?.conta_teste ? '#b91c1c' : '#475569', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          {p.associados?.conta_teste ? '🧪 Remover teste' : '🧪 Marcar teste'}
                        </button>
                        {p.user_id !== meuUserId && (
                          <button onClick={() => toggleAdmin(p.user_id, !!p.is_admin, p.associados?.nome_completo || 'este usuário')}
                            style={{ flex:1, padding:'6px 4px', borderRadius:8, border:'none', background: p.is_admin ? '#fef3c7' : '#e0e7ff', color: p.is_admin ? '#b45309' : '#3730a3', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            {p.is_admin ? '👑 Revogar ADM' : '👑 Conceder ADM'}
                          </button>
                        )}
                      </div>"""

if old_str not in content:
    print("ERRO")
else:
    content = content.replace(old_str, new_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK")
