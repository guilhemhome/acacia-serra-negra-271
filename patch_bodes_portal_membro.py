import shutil

arquivo = 'src/pages/PortalMembro.jsx'
shutil.copy(arquivo, arquivo + '.bak')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

# --- Patch 1: card aponta para rota real, sem "em breve" ---
antigo_1 = """            ...(ehBode ? [{ icon:'🏍️', label:'Bodes do Asfalto', sub:'Área do motoclub', rota:null, emBreve:true }] : []),"""
novo_1 = """            ...(ehBode ? [{ icon:'🏍️', label:'Bodes do Asfalto', sub:'Área do motoclube', rota:'/bodes-asfalto' }] : []),"""

if antigo_1 not in conteudo:
    print('ERRO: patch 1 (card) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_1, novo_1)

# --- Patch 2: novo estado bodesStatus ---
antigo_2 = """  const [bannerAniv, setBannerAniv] = useState(null)"""
novo_2 = """  const [bannerAniv, setBannerAniv] = useState(null)
  const [bodesStatus, setBodesStatus] = useState(null)"""

if antigo_2 not in conteudo:
    print('ERRO: patch 2 (estado) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_2, novo_2)

# --- Patch 3: buscar status de presenca apos setEhBode ---
antigo_3 = """    setEhBode(assoc?.bodes_asfalto === true)"""
novo_3 = """    setEhBode(assoc?.bodes_asfalto === true)

    // Status pessoal de presenca nos Bodes do Asfalto (somente para quem tem bodes_asfalto=true)
    if (assoc?.bodes_asfalto === true && assoc?.id) {
      try {
        const anoAtualBodes = hojeStr().split('-')[0]
        const { data: atasAno } = await supabase.from('bodes_atas')
          .select('id').gte('data', `${anoAtualBodes}-01-01`).lte('data', `${anoAtualBodes}-12-31`)
        const atasIds = (atasAno || []).map(a => a.id)
        let presencasCount = 0
        if (atasIds.length > 0) {
          const { count } = await supabase.from('bodes_presencas')
            .select('id', { count: 'exact', head: true })
            .eq('membro_tipo', 'associado').eq('membro_id', assoc.id).in('ata_id', atasIds)
          presencasCount = count || 0
        }
        const { data: cfgMin } = await supabase.from('bodes_config').select('valor').eq('chave', 'presencas_minimas_ano').maybeSingle()
        const minimoBodes = parseInt(cfgMin?.valor || '2', 10)
        setBodesStatus({ presencas: presencasCount, minimo: minimoBodes })
      } catch(e) { console.error('Erro ao calcular status Bodes:', e) }
    }"""

if antigo_3 not in conteudo:
    print('ERRO: patch 3 (busca status) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_3, novo_3)

# --- Patch 4: renderizar card de status ---
antigo_4 = """          ))}
        </div>

        {/* Avisos */}"""
novo_4 = """          ))}
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

if antigo_4 not in conteudo:
    print('ERRO: patch 4 (render status) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_4, novo_4)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: PortalMembro.jsx atualizado com sucesso. Backup em', arquivo + '.bak')