import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CATEGORIAS_FIN = ['contribuicao', 'doacao', 'vaquinha', 'evento', 'despesa', 'outro']
const LABEL_CATEGORIA = {
  contribuicao: 'Contribuição', doacao: 'Doação', vaquinha: 'Vaquinha',
  evento: 'Evento', despesa: 'Despesa', outro: 'Outro'
}

export default function BodesAsfalto() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [meuAssocId, setMeuAssocId] = useState(null)
  const [ehGestor, setEhGestor] = useState(false)
  const [meuCargoBodes, setMeuCargoBodes] = useState('')
  const [aba, setAba] = useState('membros')
  const [msg, setMsg] = useState('')

  // Membros
  const [membrosLoja, setMembrosLoja] = useState([])
  const [membrosExternos, setMembrosExternos] = useState([])
  const [novoExterno, setNovoExterno] = useState({ nome:'', telefone:'', cidade:'', email:'', cargo_bodes:'Membro' })
  const [mostrarFormExterno, setMostrarFormExterno] = useState(false)

  // Financeiro
  const [lancamentos, setLancamentos] = useState([])
  const [novoLancamento, setNovoLancamento] = useState({ tipo:'entrada', categoria:'contribuicao', descricao:'', valor:'', data: new Date().toISOString().split('T')[0] })

  // Atas & Presenca
  const [atas, setAtas] = useState([])
  const [novaAta, setNovaAta] = useState({ data: new Date().toISOString().split('T')[0], tipo:'reuniao', local:'', pauta:'' })
  const [mostrarFormAta, setMostrarFormAta] = useState(false)
  const [ataExpandida, setAtaExpandida] = useState(null)
  const [presencasPorAta, setPresencasPorAta] = useState({})
  const [statusPresenca, setStatusPresenca] = useState([])

  // Config
  const [minimoPresencas, setMinimoPresencas] = useState('2')

  // Status pessoal (visao leitura)
  const [meuStatus, setMeuStatus] = useState(null)

  function hojeStr() { return new Date().toISOString().split('T')[0] }
  function anoAtual() { return hojeStr().split('-')[0] }
  function fmt(d) { return d ? d.split('T')[0].split('-').reverse().join('/') : '—' }

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/'); return }

    const { data: assoc } = await supabase.from('associados')
      .select('id, bodes_asfalto').eq('user_id', session.user.id).maybeSingle()
    if (!assoc) { navigate('/membro'); return }
    setMeuAssocId(assoc.id)

    const { data: cargosBodes } = await supabase.from('cargos').select('nome').eq('categoria', 'Bodes do Asfalto')
    const nomesCargos = (cargosBodes || []).map(c => c.nome)
    let cargoAtivo = ''
    if (nomesCargos.length > 0) {
      const { data: meuCargo } = await supabase.from('cargos_historico')
        .select('cargo').eq('associado_id', assoc.id).eq('em_exercicio', true)
        .in('cargo', nomesCargos).maybeSingle()
      cargoAtivo = meuCargo?.cargo || ''
    }
    setMeuCargoBodes(cargoAtivo)
    setEhGestor(!!cargoAtivo)

    if (cargoAtivo) {
      await carregarMembros()
      await carregarFinanceiro()
      await carregarAtas()
      await carregarConfig()
    } else {
      await carregarStatusPessoal(assoc.id)
      await carregarMembros() // lista somente leitura
    }
    setCarregando(false)
  }

  function msgTemp(t) { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  // ---------- MEMBROS ----------
  async function carregarMembros() {
    const { data: loja } = await supabase.from('associados')
      .select('id, nome_completo, cidade, bodes_asfalto_numero, bodes_asfalto_data_admissao')
      .eq('bodes_asfalto', true).eq('status_cadastro', 'aprovado').eq('situacao', 'ativo')
      .order('nome_completo')
    setMembrosLoja(loja || [])

    const { data: externos } = await supabase.from('bodes_externos')
      .select('*').order('nome')
    setMembrosExternos(externos || [])
  }

  async function adicionarExterno() {
    if (!novoExterno.nome.trim()) { msgTemp('Preencha ao menos o nome.'); return }
    const { error } = await supabase.from('bodes_externos').insert({
      nome: novoExterno.nome.trim(),
      telefone: novoExterno.telefone.trim() || null,
      cidade: novoExterno.cidade.trim() || null,
      email: novoExterno.email.trim() || null,
      cargo_bodes: novoExterno.cargo_bodes,
      status: 'aprovado', ativo: true
    })
    if (error) { msgTemp('Erro: ' + error.message); return }
    setNovoExterno({ nome:'', telefone:'', cidade:'', email:'', cargo_bodes:'Membro' })
    setMostrarFormExterno(false)
    msgTemp('✅ Membro externo adicionado!')
    await carregarMembros()
  }

  async function toggleAtivoExterno(id, atual) {
    const { error } = await supabase.from('bodes_externos').update({ ativo: !atual }).eq('id', id)
    if (error) { msgTemp('Erro: ' + error.message); return }
    await carregarMembros()
  }

  // ---------- FINANCEIRO ----------
  async function carregarFinanceiro() {
    const { data } = await supabase.from('bodes_financeiro').select('*').order('data', { ascending: false })
    setLancamentos(data || [])
  }

  const saldo = lancamentos.reduce((acc, l) => acc + (l.tipo === 'entrada' ? Number(l.valor) : -Number(l.valor)), 0)

  async function salvarLancamento() {
    if (!novoLancamento.valor || Number(novoLancamento.valor) <= 0) { msgTemp('Informe um valor válido.'); return }
    const { error } = await supabase.from('bodes_financeiro').insert({
      tipo: novoLancamento.tipo, categoria: novoLancamento.categoria,
      descricao: novoLancamento.descricao.trim() || null,
      valor: Number(novoLancamento.valor), data: novoLancamento.data,
      membro_tipo: 'geral'
    })
    if (error) { msgTemp('Erro: ' + error.message); return }
    setNovoLancamento({ tipo:'entrada', categoria:'contribuicao', descricao:'', valor:'', data: hojeStr() })
    msgTemp('✅ Lançamento registrado!')
    await carregarFinanceiro()
  }

  // ---------- ATAS & PRESENCA ----------
  async function carregarAtas() {
    const { data } = await supabase.from('bodes_atas').select('*').order('data', { ascending: false })
    setAtas(data || [])
    await calcularStatusPresenca(data || [])
  }

  async function carregarConfig() {
    const { data } = await supabase.from('bodes_config').select('valor').eq('chave', 'presencas_minimas_ano').maybeSingle()
    setMinimoPresencas(data?.valor || '2')
  }

  async function salvarMinimoPresencas() {
    const { error } = await supabase.from('bodes_config')
      .upsert({ chave: 'presencas_minimas_ano', valor: String(minimoPresencas) }, { onConflict: 'chave' })
    if (error) { msgTemp('Erro: ' + error.message); return }
    msgTemp('✅ Configuração salva!')
    await calcularStatusPresenca(atas)
  }

  async function criarAta() {
    if (!novaAta.local.trim() || !novaAta.pauta.trim()) { msgTemp('Preencha local e pauta.'); return }
    const { error } = await supabase.from('bodes_atas').insert({
      data: novaAta.data, tipo: novaAta.tipo, local: novaAta.local.trim(), pauta: novaAta.pauta.trim()
    })
    if (error) { msgTemp('Erro: ' + error.message); return }
    setNovaAta({ data: hojeStr(), tipo:'reuniao', local:'', pauta:'' })
    setMostrarFormAta(false)
    msgTemp('✅ Ata registrada! Agora marque a presença dos participantes.')
    await carregarAtas()
  }

  async function carregarPresencasDaAta(ataId) {
    const { data } = await supabase.from('bodes_presencas').select('membro_tipo, membro_id').eq('ata_id', ataId)
    const marcados = new Set((data || []).map(p => p.membro_tipo + ':' + p.membro_id))
    setPresencasPorAta(prev => ({ ...prev, [ataId]: marcados }))
  }

  async function togglePresenca(ataId, membroTipo, membroId) {
    const chave = membroTipo + ':' + membroId
    const jaMarcado = presencasPorAta[ataId]?.has(chave)
    if (jaMarcado) {
      await supabase.from('bodes_presencas').delete()
        .eq('ata_id', ataId).eq('membro_tipo', membroTipo).eq('membro_id', membroId)
    } else {
      await supabase.from('bodes_presencas').insert({ ata_id: ataId, membro_tipo: membroTipo, membro_id: membroId })
    }
    await carregarPresencasDaAta(ataId)
    await calcularStatusPresenca(atas)
  }

  async function calcularStatusPresenca(listaAtas) {
    const ano = anoAtual()
    const atasDoAno = listaAtas.filter(a => a.data?.startsWith(ano))
    const atasIds = atasDoAno.map(a => a.id)
    let presencasTodas = []
    if (atasIds.length > 0) {
      const { data } = await supabase.from('bodes_presencas').select('membro_tipo, membro_id').in('ata_id', atasIds)
      presencasTodas = data || []
    }
    const contagem = {}
    presencasTodas.forEach(p => {
      const chave = p.membro_tipo + ':' + p.membro_id
      contagem[chave] = (contagem[chave] || 0) + 1
    })
    const { data: cfg } = await supabase.from('bodes_config').select('valor').eq('chave', 'presencas_minimas_ano').maybeSingle()
    const minimo = parseInt(cfg?.valor || '2', 10)

    const { data: loja } = await supabase.from('associados')
      .select('id, nome_completo').eq('bodes_asfalto', true).eq('status_cadastro', 'aprovado').eq('situacao', 'ativo')
    const { data: externos } = await supabase.from('bodes_externos').select('id, nome').eq('ativo', true)

    const lista = [
      ...(loja || []).map(m => ({ tipo:'associado', id:m.id, nome:m.nome_completo, origem:'Loja' })),
      ...(externos || []).map(m => ({ tipo:'externo', id:m.id, nome:m.nome, origem:'Externo' })),
    ].map(m => {
      const qtd = contagem[m.tipo + ':' + m.id] || 0
      return { ...m, presencas: qtd, minimo, regular: qtd >= minimo }
    }).sort((a, b) => a.nome.localeCompare(b.nome))

    setStatusPresenca(lista)
  }

  // ---------- STATUS PESSOAL (visao leitura) ----------
  async function carregarStatusPessoal(assocId) {
    const ano = anoAtual()
    const { data: atasAno } = await supabase.from('bodes_atas')
      .select('id').gte('data', `${ano}-01-01`).lte('data', `${ano}-12-31`)
    const atasIds = (atasAno || []).map(a => a.id)
    let presencas = 0
    if (atasIds.length > 0) {
      const { count } = await supabase.from('bodes_presencas')
        .select('id', { count: 'exact', head: true })
        .eq('membro_tipo', 'associado').eq('membro_id', assocId).in('ata_id', atasIds)
      presencas = count || 0
    }
    const { data: cfg } = await supabase.from('bodes_config').select('valor').eq('chave', 'presencas_minimas_ano').maybeSingle()
    const minimo = parseInt(cfg?.valor || '2', 10)
    setMeuStatus({ presencas, minimo })
  }

  const inputStyle = { width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:13, boxSizing:'border-box' }
  const labelStyle = { display:'block', fontSize:10, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.5, marginBottom:3 }
  const btnPrimario = { padding:'10px', borderRadius:8, border:'none', background:'#1a237e', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }

  if (carregando) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white', fontSize:'1.2rem' }}>Carregando...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding:'24px 16px 40px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ position:'relative', textAlign:'center', marginBottom:24 }}>
          <button onClick={() => navigate('/membro')}
            style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:18 }}>←</button>
          <div style={{ fontSize:40, marginBottom:4 }}>🏍️</div>
          <h1 style={{ color:'#fff', fontSize:'1.5rem', fontWeight:'bold', margin:0 }}>Bodes do Asfalto</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:13 }}>
            {ehGestor ? meuCargoBodes : 'Subsede Acácia de Serra Negra'}
          </p>
        </div>

        {msg && <div style={{ background:'rgba(255,255,255,0.15)', color:'#fff', borderRadius:10, padding:'10px 16px', marginBottom:16, textAlign:'center', fontWeight:600 }}>{msg}</div>}

        {!ehGestor ? (
          // ===================== VISAO SIMPLIFICADA (leitura) =====================
          <div>
            {meuStatus && (
              <div style={{ background: meuStatus.presencas >= meuStatus.minimo ? '#e8f5e9' : '#fff3e0', borderRadius:14, padding:'16px 18px', marginBottom:16, borderLeft:`4px solid ${meuStatus.presencas >= meuStatus.minimo ? '#43a047' : '#f59e0b'}` }}>
                <div style={{ fontSize:14, fontWeight:700, color: meuStatus.presencas >= meuStatus.minimo ? '#2e7d32' : '#e65100' }}>
                  Suas presenças este ano: {meuStatus.presencas}/{meuStatus.minimo}
                </div>
                <div style={{ fontSize:12, color: meuStatus.presencas >= meuStatus.minimo ? '#388e3c' : '#bf360c', marginTop:4 }}>
                  {meuStatus.presencas >= meuStatus.minimo
                    ? 'Situação regular conforme o estatuto.'
                    : `Faltam ${meuStatus.minimo - meuStatus.presencas} presença(s) para ficar em dia.`}
                </div>
              </div>
            )}
            <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
              <p style={{ margin:'0 0 12px', fontWeight:700, color:'#1a237e', fontSize:14 }}>👥 Membros dos Bodes ({membrosLoja.length + membrosExternos.length})</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:400, overflowY:'auto' }}>
                {membrosLoja.map(m => (
                  <div key={'l'+m.id} style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:8, fontSize:13, color:'#1e293b' }}>
                    {m.nome_completo} <span style={{ fontSize:10, color:'#64748b' }}>· Loja{m.cidade ? ' · ' + m.cidade : ''}</span>
                  </div>
                ))}
                {membrosExternos.filter(m => m.ativo).map(m => (
                  <div key={'e'+m.id} style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:8, fontSize:13, color:'#1e293b' }}>
                    {m.nome} <span style={{ fontSize:10, color:'#64748b' }}>· Externo{m.cidade ? ' · ' + m.cidade : ''}</span>
                  </div>
                ))}
              </div>
              <p style={{ margin:'14px 0 0', fontSize:11, color:'#94a3b8', textAlign:'center' }}>
                Acesso completo (financeiro, atas, edição) restrito ao Coordenador, Coordenador Adjunto, Secretário e Tesoureiro dos Bodes.
              </p>
            </div>
          </div>
        ) : (
          // ===================== VISAO COMPLETA (gestor) =====================
          <>
            {/* Abas */}
            <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
              {[['membros','👥 Membros'],['financeiro','💰 Financeiro'],['atas','📋 Atas & Presença'],['config','⚙️ Config']].map(([k,l]) => (
                <button key={k} onClick={() => setAba(k)}
                  style={{ padding:'9px 16px', borderRadius:10, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer',
                    background: aba===k ? '#fff' : 'rgba(255,255,255,0.15)', color: aba===k ? '#1a237e' : '#fff' }}>{l}</button>
              ))}
            </div>

            {/* ---------- ABA MEMBROS ---------- */}
            {aba === 'membros' && (
              <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
                <p style={{ margin:'0 0 4px', fontWeight:700, color:'#1a237e', fontSize:14 }}>Da loja ({membrosLoja.length})</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
                  {membrosLoja.map(m => (
                    <div key={m.id} style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:8, fontSize:13, color:'#1e293b', display:'flex', justifyContent:'space-between' }}>
                      <span>{m.nome_completo} {m.cidade ? <span style={{ fontSize:11, color:'#94a3b8' }}>· {m.cidade}</span> : null}</span>
                      <span style={{ color:'#94a3b8', fontSize:11 }}>{m.bodes_asfalto_numero ? '#'+m.bodes_asfalto_numero : ''}</span>
                    </div>
                  ))}
                  {membrosLoja.length === 0 && <p style={{ color:'#94a3b8', fontSize:13 }}>Nenhum membro da loja marcado ainda.</p>}
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <p style={{ margin:0, fontWeight:700, color:'#1a237e', fontSize:14 }}>Externos ({membrosExternos.length})</p>
                  <button onClick={() => setMostrarFormExterno(!mostrarFormExterno)}
                    style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #86efac', background:'#f0fdf4', color:'#15803d', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {mostrarFormExterno ? 'Cancelar' : '＋ Adicionar'}
                  </button>
                </div>

                {mostrarFormExterno && (
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:14, marginBottom:12, display:'flex', flexDirection:'column', gap:8 }}>
                    <div><label style={labelStyle}>Nome</label>
                      <input style={inputStyle} value={novoExterno.nome} onChange={e => setNovoExterno({...novoExterno, nome:e.target.value})} /></div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      <div><label style={labelStyle}>Telefone</label>
                        <input style={inputStyle} value={novoExterno.telefone} onChange={e => setNovoExterno({...novoExterno, telefone:e.target.value})} /></div>
                      <div><label style={labelStyle}>Cidade</label>
                        <input style={inputStyle} value={novoExterno.cidade} onChange={e => setNovoExterno({...novoExterno, cidade:e.target.value})} /></div>
                    </div>
                    <div><label style={labelStyle}>E-mail</label>
                      <input style={inputStyle} value={novoExterno.email} onChange={e => setNovoExterno({...novoExterno, email:e.target.value})} /></div>
                    <button onClick={adicionarExterno} style={btnPrimario}>💾 Salvar membro externo</button>
                  </div>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {membrosExternos.map(m => (
                    <div key={m.id} style={{ padding:'8px 12px', background: m.ativo ? '#f8fafc' : '#fef2f2', borderRadius:8, fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ color: m.ativo ? '#1e293b' : '#94a3b8' }}>
                        {m.nome} {m.cidade ? <span style={{ fontSize:11, color:'#94a3b8' }}>· {m.cidade}</span> : null}
                      </span>
                      <button onClick={() => toggleAtivoExterno(m.id, m.ativo)}
                        style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer', background: m.ativo ? '#fee2e2' : '#dcfce7', color: m.ativo ? '#dc2626' : '#16a34a' }}>
                        {m.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---------- ABA FINANCEIRO ---------- */}
            {aba === 'financeiro' && (
              <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
                <div style={{ background: saldo >= 0 ? '#e8f5e9' : '#fff3e0', borderRadius:12, padding:'16px', textAlign:'center', marginBottom:16 }}>
                  <p style={{ margin:0, fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:1 }}>Saldo atual</p>
                  <p style={{ margin:0, fontSize:28, fontWeight:800, color: saldo >= 0 ? '#16a34a' : '#dc2626' }}>
                    R$ {saldo.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <p style={{ margin:'0 0 8px', fontWeight:700, color:'#1a237e', fontSize:14 }}>➕ Novo lançamento</p>
                <div style={{ background:'#f8fafc', borderRadius:10, padding:14, marginBottom:16, display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div><label style={labelStyle}>Tipo</label>
                      <select style={inputStyle} value={novoLancamento.tipo} onChange={e => setNovoLancamento({...novoLancamento, tipo:e.target.value})}>
                        <option value="entrada">Entrada</option><option value="saida">Saída</option>
                      </select></div>
                    <div><label style={labelStyle}>Categoria</label>
                      <select style={inputStyle} value={novoLancamento.categoria} onChange={e => setNovoLancamento({...novoLancamento, categoria:e.target.value})}>
                        {CATEGORIAS_FIN.map(c => <option key={c} value={c}>{LABEL_CATEGORIA[c]}</option>)}
                      </select></div>
                  </div>
                  <div><label style={labelStyle}>Descrição</label>
                    <input style={inputStyle} value={novoLancamento.descricao} onChange={e => setNovoLancamento({...novoLancamento, descricao:e.target.value})} /></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div><label style={labelStyle}>Valor (R$)</label>
                      <input type="number" step="0.01" style={inputStyle} value={novoLancamento.valor} onChange={e => setNovoLancamento({...novoLancamento, valor:e.target.value})} /></div>
                    <div><label style={labelStyle}>Data</label>
                      <input type="date" style={inputStyle} value={novoLancamento.data} onChange={e => setNovoLancamento({...novoLancamento, data:e.target.value})} /></div>
                  </div>
                  <button onClick={salvarLancamento} style={btnPrimario}>💾 Registrar lançamento</button>
                </div>

                <p style={{ margin:'0 0 8px', fontWeight:700, color:'#1a237e', fontSize:14 }}>Histórico</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:400, overflowY:'auto' }}>
                  {lancamentos.map(l => (
                    <div key={l.id} style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:8, fontSize:12.5, display:'flex', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ fontWeight:600, color:'#1e293b' }}>{l.descricao || LABEL_CATEGORIA[l.categoria]}</div>
                        <div style={{ color:'#94a3b8', fontSize:11 }}>{fmt(l.data)} · {LABEL_CATEGORIA[l.categoria]}</div>
                      </div>
                      <div style={{ fontWeight:700, color: l.tipo === 'entrada' ? '#16a34a' : '#dc2626', alignSelf:'center' }}>
                        {l.tipo === 'entrada' ? '+' : '-'} R$ {Number(l.valor).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  ))}
                  {lancamentos.length === 0 && <p style={{ color:'#94a3b8', fontSize:13 }}>Nenhum lançamento ainda.</p>}
                </div>
              </div>
            )}

            {/* ---------- ABA ATAS & PRESENCA ---------- */}
            {aba === 'atas' && (
              <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <p style={{ margin:0, fontWeight:700, color:'#1a237e', fontSize:14 }}>📋 Atas ({atas.length})</p>
                  <button onClick={() => setMostrarFormAta(!mostrarFormAta)}
                    style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #86efac', background:'#f0fdf4', color:'#15803d', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {mostrarFormAta ? 'Cancelar' : '＋ Nova ata'}
                  </button>
                </div>

                {mostrarFormAta && (
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:14, marginBottom:16, display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      <div><label style={labelStyle}>Data</label>
                        <input type="date" style={inputStyle} value={novaAta.data} onChange={e => setNovaAta({...novaAta, data:e.target.value})} /></div>
                      <div><label style={labelStyle}>Tipo</label>
                        <select style={inputStyle} value={novaAta.tipo} onChange={e => setNovaAta({...novaAta, tipo:e.target.value})}>
                          <option value="reuniao">Reunião</option><option value="evento">Evento</option>
                        </select></div>
                    </div>
                    <div><label style={labelStyle}>Local</label>
                      <input style={inputStyle} value={novaAta.local} onChange={e => setNovaAta({...novaAta, local:e.target.value})} /></div>
                    <div><label style={labelStyle}>Pauta / itens principais</label>
                      <textarea rows={3} style={{...inputStyle, resize:'none', fontFamily:'inherit'}} value={novaAta.pauta} onChange={e => setNovaAta({...novaAta, pauta:e.target.value})} /></div>
                    <button onClick={criarAta} style={btnPrimario}>💾 Registrar ata</button>
                  </div>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                  {atas.map(a => {
                    const aberta = ataExpandida === a.id
                    return (
                      <div key={a.id} style={{ border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                        <div onClick={() => { setAtaExpandida(aberta ? null : a.id); if (!aberta && !presencasPorAta[a.id]) carregarPresencasDaAta(a.id) }}
                          style={{ padding:'10px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc' }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>{fmt(a.data)} · {a.tipo === 'reuniao' ? 'Reunião' : 'Evento'}</div>
                            <div style={{ fontSize:11, color:'#64748b' }}>{a.local}</div>
                          </div>
                          <span style={{ fontSize:12, color:'#94a3b8', transform: aberta ? 'rotate(180deg)' : 'none' }}>▾</span>
                        </div>
                        {aberta && (
                          <div style={{ padding:14 }}>
                            <p style={{ margin:'0 0 10px', fontSize:12.5, color:'#475569', whiteSpace:'pre-wrap' }}>{a.pauta}</p>
                            <p style={{ margin:'0 0 6px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>Marcar presença</p>
                            <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:280, overflowY:'auto' }}>
                              {membrosLoja.map(m => {
                                const marcado = presencasPorAta[a.id]?.has('associado:' + m.id)
                                return (
                                  <label key={'l'+m.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background: marcado ? '#e8f5e9' : '#fff', borderRadius:6, fontSize:12.5, cursor:'pointer' }}>
                                    <input type="checkbox" checked={!!marcado} onChange={() => togglePresenca(a.id, 'associado', m.id)} />
                                    {m.nome_completo} <span style={{ fontSize:10, color:'#94a3b8' }}>(loja)</span>
                                  </label>
                                )
                              })}
                              {membrosExternos.filter(m => m.ativo).map(m => {
                                const marcado = presencasPorAta[a.id]?.has('externo:' + m.id)
                                return (
                                  <label key={'e'+m.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background: marcado ? '#e8f5e9' : '#fff', borderRadius:6, fontSize:12.5, cursor:'pointer' }}>
                                    <input type="checkbox" checked={!!marcado} onChange={() => togglePresenca(a.id, 'externo', m.id)} />
                                    {m.nome} <span style={{ fontSize:10, color:'#94a3b8' }}>(externo)</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {atas.length === 0 && <p style={{ color:'#94a3b8', fontSize:13 }}>Nenhuma ata registrada ainda.</p>}
                </div>

                <p style={{ margin:'0 0 8px', fontWeight:700, color:'#1a237e', fontSize:14 }}>Status de presença ({anoAtual()})</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:320, overflowY:'auto' }}>
                  {statusPresenca.map(m => (
                    <div key={m.tipo+m.id} style={{ padding:'8px 12px', background: m.regular ? '#f0fdf4' : '#fff7ed', borderRadius:8, fontSize:12.5, display:'flex', justifyContent:'space-between' }}>
                      <span>{m.nome} <span style={{ fontSize:10, color:'#94a3b8' }}>({m.origem})</span></span>
                      <span style={{ fontWeight:700, color: m.regular ? '#16a34a' : '#ea580c' }}>{m.presencas}/{m.minimo}</span>
                    </div>
                  ))}
                  {statusPresenca.length === 0 && <p style={{ color:'#94a3b8', fontSize:13 }}>Sem dados ainda.</p>}
                </div>
              </div>
            )}

            {/* ---------- ABA CONFIG ---------- */}
            {aba === 'config' && (
              <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
                <p style={{ margin:'0 0 8px', fontWeight:700, color:'#1a237e', fontSize:14 }}>⚙️ Regra de presença mínima</p>
                <p style={{ margin:'0 0 12px', fontSize:12, color:'#64748b' }}>
                  Número mínimo de presenças por ano civil (jan–dez) exigido pelo estatuto do moto clube. Vale para todos os membros, da loja ou externos.
                </p>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                  <div style={{ flex:1 }}>
                    <label style={labelStyle}>Presenças mínimas / ano</label>
                    <input type="number" min="0" style={inputStyle} value={minimoPresencas} onChange={e => setMinimoPresencas(e.target.value)} />
                  </div>
                  <button onClick={salvarMinimoPresencas} style={{ ...btnPrimario, padding:'10px 18px' }}>💾 Salvar</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

