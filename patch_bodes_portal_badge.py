import shutil

arquivo = 'src/pages/PortalMembro.jsx'
shutil.copy(arquivo, arquivo + '.bak2')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

# --- Patch 1: card com badge de status, em vez de so a rota ---
antigo_1 = """            ...(ehBode ? [{ icon:'🏍️', label:'Bodes do Asfalto', sub:'Área do motoclube', rota:'/bodes-asfalto' }] : []),"""
novo_1 = """            ...(ehBode ? [{ icon:'🏍️', label:'Bodes do Asfalto', sub:'Área do motoclube', rota:'/bodes-asfalto',
              badge: bodesStatus ? `${bodesStatus.presencas}/${bodesStatus.minimo}` : null,
              badgeOk: bodesStatus ? bodesStatus.presencas >= bodesStatus.minimo : true }] : []),"""

if antigo_1 not in conteudo:
    print('ERRO: patch 1 (card com badge) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_1, novo_1)

# --- Patch 2: renderizar o badge no botao do card ---
antigo_2 = """              {c.emBreve && <span style={{ position:'absolute', top:8, right:8, fontSize:9, background:'rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.6)', borderRadius:10, padding:'2px 6px' }}>em breve</span>}
              <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>"""
novo_2 = """              {c.emBreve && <span style={{ position:'absolute', top:8, right:8, fontSize:9, background:'rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.6)', borderRadius:10, padding:'2px 6px' }}>em breve</span>}
              {c.badge && <span style={{ position:'absolute', top:8, right:8, fontSize:9, fontWeight:700, background: c.badgeOk ? 'rgba(67,160,71,0.9)' : 'rgba(245,158,11,0.9)', color:'#fff', borderRadius:10, padding:'2px 7px' }}>{c.badge}</span>}
              <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>"""

if antigo_2 not in conteudo:
    print('ERRO: patch 2 (render badge) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_2, novo_2)

# --- Patch 3: remover o banner grande de status (fica so dentro do modulo agora) ---
antigo_3 = """          ))}
        </div>

        {/* Status pessoal de presenca nos Bodes do Asfalto */}
        {bodesStatus && (
          <div style={{ background: bodesStatus.presencas >= bodesStatus.minimo ? '#e8f5e9' : '#fff3e0', borderRadius:14, padding:'14px 16px', marginBottom:20, borderLeft: `4px solid ${bodesStatus.presencas >= bodesStatus.minimo ? '#43a047' : '#f59e0b'}`, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:24 }}>🏍️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color: bodesStatus.presencas >= bodesStatus.minimo ? '#2e7d32' : '#e65100' }}>
                Presenças nos Bodes este ano: {bodesStatus.presencas}/{bodesStatus.minimo}
              </div>
              <div style={{ fontSize:11, color: bodesStatus.presencas >= bodesStatus.minimo ? '#388e3c' : '#bf360c' }}>
                {bodesStatus.presencas >= bodesStatus.minimo
                  ? 'Situação regular conforme o estatuto.'
                  : `Faltam ${bodesStatus.minimo - bodesStatus.presencas} presença(s) para ficar em dia.`}
              </div>
            </div>
          </div>
        )}

        {/* Avisos */}"""
novo_3 = """          ))}
        </div>

        {/* Avisos */}"""

if antigo_3 not in conteudo:
    print('ERRO: patch 3 (remover banner) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_3, novo_3)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: PortalMembro.jsx (patch 2) atualizado com sucesso. Backup em', arquivo + '.bak2')