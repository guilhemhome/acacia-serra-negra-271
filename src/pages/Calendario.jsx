import { useState, useEffect } from 'react'
import { DateInput } from '../components/DateInput'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TIPOS = [
  { value:'sessao_ordinaria', label:'Sessão Ordinária', emoji:'⚒️' },
  { value:'sessao_magna', label:'Sessão Magna', emoji:'🏛️' },
  { value:'iniciacao', label:'Iniciação / Elevação / Exaltação', emoji:'⭐' },
  { value:'grande_loja', label:'Informe da Grande Loja', emoji:'📜' },
  { value:'festa', label:'Festa / Confraternização', emoji:'🎉' },
  { value:'diretoria', label:'Reunião de Diretoria', emoji:'📋' },
  { value:'visita', label:'Visita a Outra Loja', emoji:'🤝' },
  { value:'outro', label:'Outro', emoji:'📌' },
]

const VISIBILIDADE = [
  { value:'todos', label:'Todos os Irmãos', emoji:'🌐' },
  { value:'mestres', label:'Somente Mestres', emoji:'⭐' },
  { value:'companheiros', label:'Companheiros e acima', emoji:'🔵' },
  { value:'diretoria', label:'Somente Diretoria', emoji:'🔒' },
]

const STATUS_EV = {
  ativo:     { label:'Agendado',  cor:'#f59e0b', bg:'#fef3c7' },
  agendado:  { label:'Agendado',  cor:'#f59e0b', bg:'#fef3c7' },
  realizado: { label:'Realizado', cor:'#10b981', bg:'#d1fae5' },
  cancelado: { label:'Cancelado', cor:'#ef4444', bg:'#fee2e2' },
}

const RESPOSTAS = {
  presente:   { label:'Confirmado', cor:'#10b981', bg:'#d1fae5', emoji:'✅' },
  ausente:    { label:'Não irei',   cor:'#ef4444', bg:'#fee2e2', emoji:'❌' },
  pendente:   { label:'Pendente',   cor:'#94a3b8', bg:'#f1f5f9', emoji:'⏳' },
}

function formatarData(str) {
  if (!str) return ''
  const [a,m,d] = str.split('-')
  return d+'/'+m+'/'+a
}

function hoje() {
  const d = new Date()
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
}

function mesAtual() {
  const d = new Date()
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')
}

export default function Calendario() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState([])
  const [aniversariantes, setAniversariantes] = useState([])
  const [familiares, setFamiliares] = useState([])
  const [casamentos, setCasamentos] = useState([])
  const [datasMaconicas, setDatasMaconicas] = useState([])
  const [tplIrmao, setTplIrmao] = useState('🌿 A Loja Maçônica Acácia de Serra Negra Nº 271 saúda com fraternidade o Ir∴ {nome} que hoje completa mais um ano de vida. Que o G∴A∴D∴U∴ ilumine sempre sua jornada! 🎂')
  const [tplDependente, setTplDependente] = useState('🌿 A Loja Maçônica Acácia de Serra Negra Nº 271 saúda o Ir∴ {nome_irmao} pelo aniversário de {parentesco} {nome_dependente}! Felicidades a toda a família! 🎂')
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [grauUsuario, setGrauUsuario] = useState(null)
  const [associadoId, setAssociadoId] = useState(null)
  const [filtroMes, setFiltroMes] = useState(mesAtual())
  const [modal, setModal] = useState(null)
  const [modalPresencas, setModalPresencas] = useState(null)
  const [presencas, setPresencas] = useState([])
  const [form, setForm] = useState({ titulo:'', tipo:'sessao_ordinaria', data_evento:'', hora:'', local:'', descricao:'', status:'ativo', visibilidade:'todos' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [justifAberta, setJustifAberta] = useState(null)
  const [textoJustif, setTextoJustif] = useState('')
  const [aba, setAba] = useState('eventos') // 'eventos' | 'aniversarios'

  useEffect(() => { init() }, [])
  useEffect(() => { carregarEventos() }, [filtroMes])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: p } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', session.user.id).single()
    const perfilAtual = p?.perfil || 'membro'
    setPerfil(perfilAtual)
    const { data: assoc } = await supabase.from('associados').select('id, grau:historico_graus(grau)').eq('user_id', session.user.id).single()
    let aid = null
    let grauAtual = 'aprendiz'
    if (assoc) {
      aid = assoc.id
      setAssociadoId(aid)
      const graus = assoc.grau || []
      const temMestre = graus.some(g => g.grau === 'mestre')
      const temCompanheiro = graus.some(g => g.grau === 'companheiro')
      grauAtual = temMestre ? 'mestre' : temCompanheiro ? 'companheiro' : 'aprendiz'
      setGrauUsuario(grauAtual)
    } else {
      setAssociadoId(null)
    }
    await carregarAniversariantes()
    await carregarEventos(aid, perfilAtual, grauAtual)
  }

  async function carregarAniversariantes() {
    const { data: tpls } = await supabase.from('mensagens_templates')
      .select('chave, mensagem')
      .in('chave', ['aniversario_irmao_whatsapp', 'aniversario_dependente_whatsapp'])
    if (tpls) {
      const ti = tpls.find(t => t.chave === 'aniversario_irmao_whatsapp')
      const td = tpls.find(t => t.chave === 'aniversario_dependente_whatsapp')
      if (ti) { console.log('TEMPLATE IRMAO:', ti.mensagem); setTplIrmao(ti.mensagem) }
      if (td) setTplDependente(td.mensagem)
    }
    const mes = String(new Date().getMonth()+1).padStart(2,'0')
    const { data: irmaos } = await supabase.from('associados')
      .select('id, nome_completo, data_nascimento, tel_celular, data_casamento, bodes_asfalto, bodes_asfalto_data_admissao')
      .eq('status_cadastro','aprovado')
    // Buscar iniciações sem join — cruzar com irmaos pelo associado_id
    let iniciacoes = []
    try {
      const { data: ini } = await supabase.from('historico_graus')
        .select('associado_id, data_concessao')
        .eq('grau','aprendiz')
        .not('data_concessao','is',null)
      // Enriquecer com dados do associado
      const irmaosMap = {}
      ;(irmaos||[]).forEach(a => { irmaosMap[a.id] = a })
      iniciacoes = (ini||[]).map(ini => ({
        ...ini,
        associados: irmaosMap[ini.associado_id] || null
      }))
    } catch(e) { iniciacoes = [] }
    const aniv = (irmaos||[]).filter(a => a.data_nascimento && a.data_nascimento.split('-')[1] === mes)
    setAniversariantes(aniv)
    const cas = (irmaos||[]).filter(a => a.data_casamento && a.data_casamento.split('-')[1] === mes)
    setCasamentos(cas)
    const mac = []
    ;(iniciacoes||[]).forEach(ini => {
      if (ini.data_concessao && ini.data_concessao.split('-')[1] === mes) {
        const anos = new Date().getFullYear() - Number(ini.data_concessao.split('-')[0])
        const assoc = Array.isArray(ini.associados) ? ini.associados[0] : ini.associados
        if (assoc) mac.push({ id: ini.associado_id, nome: assoc.nome_completo, tel_celular: assoc.tel_celular, data: ini.data_concessao, tipo: 'Iniciação Maçônica', anos })
      }
    })
    ;(irmaos||[]).forEach(a => {
      if (a.bodes_asfalto && a.bodes_asfalto_data_admissao && a.bodes_asfalto_data_admissao.split('-')[1] === mes) {
        const anos = new Date().getFullYear() - Number(a.bodes_asfalto_data_admissao.split('-')[0])
        mac.push({ id: a.id + '_bodes', nome: a.nome_completo, tel_celular: a.tel_celular, data: a.bodes_asfalto_data_admissao, tipo: 'Bodes do Asfalto', anos })
      }
    })
    mac.sort((x,y) => Number(x.data.split('-')[2]) - Number(y.data.split('-')[2]))
    setDatasMaconicas(mac)
    const { data: deps } = await supabase.from('familiares')
      .select('nome, data_nascimento, parentesco, associado_id, associados(nome_completo, tel_celular)')
      .not('data_nascimento','is',null)
    const fam = (deps||[]).filter(d => d.data_nascimento && d.data_nascimento.split('-')[1] === mes)
    setFamiliares(fam)
  }

  async function carregarEventos(aidParam, perfilParam, grauParam) {
    setLoading(true)
    const aid = aidParam !== undefined ? aidParam : associadoId
    const perf = perfilParam !== undefined ? perfilParam : perfil
    const grau = grauParam !== undefined ? grauParam : grauUsuario
    const inicio = filtroMes + '-01'
    const [ano, mes] = filtroMes.split('-')
    const ultimo = new Date(ano, mes, 0).getDate()
    const fim = filtroMes + '-' + String(ultimo).padStart(2,'0')
    const { data } = await supabase.from('eventos').select('*').gte('data_evento',inicio).lte('data_evento',fim).order('data_evento')

    const filtrados = (data||[]).filter(ev => {
      if (!perf || perf === 'ADM' || perf === 'Secretário') return true
      if (ev.visibilidade === 'todos') return true
      if (ev.visibilidade === 'mestres' && grau === 'mestre') return true
      if (ev.visibilidade === 'companheiros' && (grau === 'mestre' || grau === 'companheiro')) return true
      return false
    })

    if (aid) {
      const ids = filtrados.map(e => e.id)
      if (ids.length > 0) {
        const { data: pres } = await supabase.from('eventos_presencas')
          .select('evento_id, resposta, justificativa')
          .eq('associado_id', aid)
          .in('evento_id', ids)
        const presMap = {}
        ;(pres||[]).forEach(p => { presMap[p.evento_id] = { resposta: p.resposta, justificativa: p.justificativa } })
        setEventos(filtrados.map(ev => ({ ...ev, minhaResposta: presMap[ev.id]?.resposta || 'pendente', minhaJustificativa: presMap[ev.id]?.justificativa || '' })))
      } else {
        setEventos([])
      }
    } else {
      setEventos(filtrados)
    }
    setLoading(false)
  }

  async function removerPresenca(eventoId) {
    if (!associadoId) return
    await supabase.from('eventos_presencas')
      .delete()
      .eq('evento_id', eventoId)
      .eq('associado_id', associadoId)
    carregarEventos()
  }

  async function responderPresenca(eventoId, resposta, justificativa) {
    if (!associadoId) return
    await supabase.from('eventos_presencas').upsert(
      { evento_id: eventoId, associado_id: associadoId, resposta, justificativa: justificativa||null, confirmado_em: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: 'evento_id,associado_id' }
    )
    carregarEventos()
  }

  async function verPresencas(ev) {
    const { data } = await supabase.from('eventos_presencas')
      .select('resposta, justificativa, associados(nome_completo)')
      .eq('evento_id', ev.id)
    setPresencas(data||[])
    setModalPresencas(ev)
  }

  function abrirNovo() {
    setForm({ titulo:'', tipo:'sessao_ordinaria', data_evento:'', hora:'', local:'', descricao:'', status:'ativo', visibilidade:'todos' })
    setErro('')
    setModal('novo')
  }

  function abrirEditar(ev) {
    setForm({ titulo:ev.titulo||'', tipo:ev.tipo||'outro', data_evento:ev.data_evento_evento||'', hora:ev.hora||'', local:ev.local||'', descricao:ev.descricao||'', status:ev.status||'ativo', visibilidade:ev.visibilidade||'todos' })
    setErro('')
    setModal(ev)
  }

  async function salvar() {
    if (!form.titulo || !form.data_evento) { setErro('Título e data são obrigatórios.'); return }
    setSalvando(true); setErro('')
    let error
    if (modal === 'novo') {
      ({ error } = await supabase.from('eventos').insert([form]))
    } else {
      ({ error } = await supabase.from('eventos').update(form).eq('id', modal.id))
    }
    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModal(null); carregarEventos()
  }

  const isAdm = perfil === 'ADM' || perfil === 'Secretário'
  const hj = hoje()
  const proximos = eventos.filter(e => e.data_evento >= hj && e.status === 'ativo')
  const realizados = eventos.filter(e => e.status === 'realizado')
  const cancelados = eventos.filter(e => e.status === 'cancelado')

  function tipoInfo(val) { return TIPOS.find(t => t.value === val) || TIPOS[7] }
  function visInfo(val) { return VISIBILIDADE.find(v => v.value === val) || VISIBILIDADE[0] }

  const meses = []
  for (let i = -2; i <= 6; i++) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()+i)
    const val = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')
    const label = d.toLocaleString('pt-BR',{month:'long',year:'numeric'})
    meses.push({ val, label })
  }

  const mesNome = new Date().toLocaleString('pt-BR',{month:'long'})

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 60%,#1565c0 100%)', padding:'24px 16px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ position:'relative', textAlign:'center', marginBottom:24 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:18 }}>←</button>
          <img src="/logo-acacia.png" alt="Logo" style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto 8px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:'bold', margin:0 }}>Calendário</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:14 }}>Acácia de Serra Negra Nº 271</p>
        </div>

        {/* Abas */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[{id:'eventos',label:'📅 Eventos'},{id:'aniversarios',label:'🎂 Aniversários'}].map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              style={{ flex:1, padding:'10px', borderRadius:10, border:'none', fontWeight:700, fontSize:14, cursor:'pointer',
                background: aba===a.id ? '#fff' : 'rgba(255,255,255,0.15)',
                color: aba===a.id ? '#1a237e' : '#fff' }}>
              {a.label}
            </button>
          ))}
        </div>

        {/* ABA EVENTOS */}
        {aba === 'eventos' && (<>
          {/* Filtro */}
          <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ color:'rgba(255,255,255,0.8)', fontSize:14, whiteSpace:'nowrap' }}>📅</span>
            <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
              style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'none', fontSize:14, background:'#fff', cursor:'pointer' }}>
              {meses.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
            {isAdm && (
              <button onClick={abrirNovo}
                style={{ background:'#10b981', border:'none', borderRadius:8, color:'#fff', padding:'8px 16px', cursor:'pointer', fontWeight:'bold', fontSize:14, whiteSpace:'nowrap' }}>
                ➕ Novo
              </button>
            )}
          </div>

          {/* Cards resumo */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              { label:'Próximos', valor:proximos.length, cor:'#f59e0b' },
              { label:'Realizados', valor:realizados.length, cor:'#10b981' },
              { label:'Cancelados', valor:cancelados.length, cor:'#ef4444' },
            ].map(c => (
              <div key={c.label} style={{ background:'rgba(255,255,255,0.95)', borderRadius:12, padding:'14px 10px', textAlign:'center', borderTop:'4px solid '+c.cor }}>
                <div style={{ fontSize:22, fontWeight:800, color:c.cor }}>{c.valor}</div>
                <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:0.5 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Lista */}
          {loading ? (
            <div style={{ color:'#fff', textAlign:'center', padding:40 }}>Carregando...</div>
          ) : eventos.length === 0 ? (
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:32, textAlign:'center', color:'rgba(255,255,255,0.6)' }}>
              Nenhum evento neste período.{isAdm ? ' Clique em ➕ Novo para adicionar.' : ''}
            </div>
          ) : eventos.map(ev => {
            const st = STATUS_EV[ev.status] || STATUS_EV.agendado
            const tp = tipoInfo(ev.tipo)
            const vis = visInfo(ev.visibilidade)
            const resp = RESPOSTAS[ev.minhaResposta] || RESPOSTAS.pendente
            const passado = ev.data_evento < hj
            return (
              <div key={ev.id} style={{ background:'rgba(255,255,255,0.95)', borderRadius:12, padding:16, marginBottom:12, borderLeft:'5px solid '+st.cor }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                      <span style={{ fontSize:18 }}>{tp.emoji}</span>
                      <span style={{ fontWeight:700, color:'#1e293b', fontSize:15 }}>{ev.titulo}</span>
                      <span style={{ fontSize:11, color:'#94a3b8' }}>{vis.emoji} {vis.label}</span>
                    </div>
                    <div style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>{tp.label}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, fontSize:13, color:'#475569', marginBottom:8 }}>
                      <span>📅 {formatarData(ev.data_evento)}</span>
                      {ev.hora && <span>🕐 {ev.hora}</span>}
                      {ev.local && <span>📍 {ev.local}</span>}
                    </div>
                    {ev.descricao && <p style={{ margin:'0 0 10px', fontSize:13, color:'#64748b', lineHeight:1.4 }}>{ev.descricao}</p>}

                    {/* Confirmação de presença */}
                    {ev.status === 'ativo' && !passado && (
                      <div style={{ marginTop:8 }}>
                        <p style={{ margin:'0 0 6px', fontSize:12, color:'#64748b', fontWeight:600 }}>Sua presença:</p>

                        {/* Estado: já respondeu e não está editando */}
                        {ev.minhaResposta !== 'pendente' && justifAberta !== ev.id && (
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                            {ev.minhaResposta === 'presente' ? (
                              <span style={{ fontSize:12, color:'#2e7d32', background:'#e8f5e9', borderRadius:20, padding:'4px 12px', fontWeight:600 }}>✅ Presença confirmada</span>
                            ) : (
                              <div>
                                <span style={{ fontSize:12, color:'#c62828', background:'#ffebee', borderRadius:20, padding:'4px 12px', fontWeight:600 }}>❌ Ausência justificada</span>
                                {ev.minhaJustificativa && (
                                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:4, fontStyle:'italic' }}>"{ev.minhaJustificativa}"</div>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => { setJustifAberta(ev.id); setTextoJustif('') }}
                              style={{ fontSize:11, color:'#94a3b8', background:'none', border:'1px solid #e2e8f0', borderRadius:8, padding:'3px 10px', cursor:'pointer' }}>
                              alterar
                            </button>
                          </div>
                        )}

                        {/* Estado: pendente — mostrar botões */}
                        {ev.minhaResposta === 'pendente' && justifAberta !== ev.id && (
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={() => responderPresenca(ev.id,'presente')}
                              style={{ padding:'5px 12px', borderRadius:8, border:'2px solid #10b981', fontSize:12, fontWeight:700, cursor:'pointer', background:'#fff', color:'#10b981' }}>
                              Confirmar
                            </button>
                            <button onClick={() => { setJustifAberta(ev.id); setTextoJustif('') }}
                              style={{ padding:'5px 12px', borderRadius:8, border:'2px solid #ef4444', fontSize:12, fontWeight:700, cursor:'pointer', background:'#fff', color:'#ef4444' }}>
                              Não irei
                            </button>
                          </div>
                        )}

                        {/* Estado: editando */}
                        {justifAberta === ev.id && (
                          <div style={{ marginTop:4 }}>
                            <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                              <button
                                onClick={() => {
                                  if (ev.minhaResposta === 'presente') {
                                    removerPresenca(ev.id)
                                  } else {
                                    responderPresenca(ev.id,'presente')
                                  }
                                  setJustifAberta(null); setTextoJustif('')
                                }}
                                style={{ flex:1, padding:'5px 10px', borderRadius:8, border:'2px solid #10b981', fontSize:12, fontWeight:700, cursor:'pointer',
                                  background: ev.minhaResposta==='presente' ? '#10b981' : '#fff',
                                  color: ev.minhaResposta==='presente' ? '#fff' : '#10b981' }}>
                                ✅ Confirmado
                              </button>
                              <button
                                onClick={() => { if(textoJustif.trim()) { responderPresenca(ev.id,'ausente',textoJustif.trim()); setJustifAberta(null); setTextoJustif('') } }}
                                disabled={!textoJustif.trim()}
                                style={{ flex:1, padding:'5px 10px', borderRadius:8, border:'2px solid #ef4444', fontSize:12, fontWeight:700,
                                  cursor: textoJustif.trim() ? 'pointer' : 'default',
                                  background: ev.minhaResposta==='ausente' ? '#ef4444' : '#fff',
                                  color: ev.minhaResposta==='ausente' ? '#fff' : '#ef4444' }}>
                                ❌ Não irei
                              </button>
                            </div>
                            <textarea
                              placeholder="Justificativa para ausência (obrigatório para Não irei)..."
                              value={textoJustif}
                              onChange={e => setTextoJustif(e.target.value)}
                              style={{ width:'100%', borderRadius:8, border:'1px solid #e2e8f0', padding:'8px 10px', fontSize:12, resize:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                              rows={2}
                            />
                            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
                              <button onClick={() => { setJustifAberta(null); setTextoJustif('') }}
                                style={{ padding:'4px 14px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:12, cursor:'pointer', background:'#fff', color:'#64748b' }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                    <span style={{ background:st.bg, color:st.cor, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
                      {st.label}
                    </span>
                    {isAdm && (
                      <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:4 }}>
                        <button onClick={() => abrirEditar(ev)}
                          style={{ background:'#e0f2fe', border:'none', borderRadius:6, color:'#0369a1', padding:'4px 10px', cursor:'pointer', fontSize:12, fontWeight:600 }}>✏️ Editar</button>
                        <button onClick={() => verPresencas(ev)}
                          style={{ background:'#f0fdf4', border:'none', borderRadius:6, color:'#166534', padding:'4px 10px', cursor:'pointer', fontSize:12, fontWeight:600 }}>👥 Presenças</button>
                        {ev.status === 'ativo' && passado && (
                          <button onClick={() => supabase.from('eventos').update({status:'realizado'}).eq('id',ev.id).then(carregarEventos)}
                            style={{ background:'#d1fae5', border:'none', borderRadius:6, color:'#065f46', padding:'4px 8px', cursor:'pointer', fontSize:12, fontWeight:600 }}>✅ Realizado</button>
                        )}
                        {ev.status === 'ativo' && (
                          <button onClick={() => supabase.from('eventos').update({status:'cancelado'}).eq('id',ev.id).then(carregarEventos)}
                            style={{ background:'#fee2e2', border:'none', borderRadius:6, color:'#dc2626', padding:'4px 8px', cursor:'pointer', fontSize:12, fontWeight:600 }}>✕ Cancelar</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </>)}

        {/* ABA ANIVERSÁRIOS */}
        {aba === 'aniversarios' && (
          <div>
            <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:12, padding:20, marginBottom:16 }}>
              <p style={{ margin:'0 0 14px', fontWeight:700, color:'#1a237e', textTransform:'uppercase', fontSize:13, letterSpacing:1 }}>
                🎂 Irmãos Aniversariantes — {mesNome}
              </p>
              {aniversariantes.length === 0 ? (
                <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhum aniversariante este mês.</p>
              ) : aniversariantes.map(a => {
                const [,m,d] = (a.data_nascimento||'').split('-')
                return (
                  <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#f8fafc', borderRadius:8, marginBottom:8 }}>
                    <div>
                      <p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{a.nome_completo}</p>
                      <p style={{ margin:0, fontSize:12, color:'#64748b' }}>Dia {d}/{m}</p>
                    </div>
                    <a href={`https://wa.me/55${(a.tel_celular||'').replace(/\D/g,'')}?text=${encodeURIComponent(tplIrmao.replace('{nome}', a.nome_completo).replace('{loja}','Acácia de Serra Negra Nº 271'))}`} target="_blank" rel="noreferrer"
                      style={{ background:'#25d366', color:'#fff', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, textDecoration:'none' }}>
                      WhatsApp
                    </a>
                  </div>
                )
              })}
            </div>

            <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:12, padding:20 }}>
              <p style={{ margin:'0 0 14px', fontWeight:700, color:'#1a237e', textTransform:'uppercase', fontSize:13, letterSpacing:1 }}>
                👨‍👩‍👧 Familiares Aniversariantes — {mesNome}
              </p>
              {familiares.length === 0 ? (
                <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhum familiar aniversariante este mês.</p>
              ) : familiares.map((f,i) => {
                const [,m,d] = (f.data_nascimento||'').split('-')
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#f8fafc', borderRadius:8, marginBottom:8 }}>
                    <div>
                      <p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{f.nome}</p>
                      <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{f.parentesco} do Ir. {f.associados?.nome_completo} — Dia {d}/{m}</p>
                    </div>
                    <a href={`https://wa.me/55${(Array.isArray(f.associados) ? f.associados[0]?.tel_celular : f.associados?.tel_celular||'').replace(/\D/g,'')}?text=${encodeURIComponent(tplDependente.replace('{nome_irmao}', Array.isArray(f.associados)?f.associados[0]?.nome_completo:f.associados?.nome_completo||'').replace('{parentesco}',f.parentesco||'').replace('{nome_dependente}',f.nome||'').replace('{loja}','Acácia de Serra Negra Nº 271'))}`} target="_blank" rel="noreferrer"
                      style={{ background:'#25d366', color:'#fff', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, textDecoration:'none' }}>
                      WhatsApp
                    </a>
                  </div>
                )
              })}
            </div>

            <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:12, padding:20, marginTop:16 }}>
              <p style={{ margin:'0 0 14px', fontWeight:700, color:'#1a237e', textTransform:'uppercase', fontSize:13, letterSpacing:1 }}>
                💍 Aniversários de Casamento — {mesNome}
              </p>
              {casamentos.length === 0 ? (
                <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhum aniversário de casamento este mês.</p>
              ) : casamentos.map(a => {
                const [ano,m,d] = (a.data_casamento||'').split('-')
                const anos = new Date().getFullYear() - Number(ano)
                return (
                  <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#f8fafc', borderRadius:8, marginBottom:8 }}>
                    <div>
                      <p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{a.nome_completo}</p>
                      <p style={{ margin:0, fontSize:12, color:'#64748b' }}>Dia {d}/{m} — {anos} {anos === 1 ? 'ano' : 'anos'} de união</p>
                    </div>
                    <a href={`https://wa.me/55${(a.tel_celular||'').replace(/\D/g,'')}?text=${encodeURIComponent('🌿 A Loja Acácia de Serra Negra Nº 271 parabeniza o Ir∴ ' + a.nome_completo + ' e sua cunhada pelos ' + anos + ' anos de união! Que o G∴A∴D∴U∴ abençoe sempre a família! 💍')}`} target="_blank" rel="noreferrer"
                      style={{ background:'#25d366', color:'#fff', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, textDecoration:'none' }}>
                      WhatsApp
                    </a>
                  </div>
                )
              })}
            </div>

            <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:12, padding:20, marginTop:16 }}>
              <p style={{ margin:'0 0 14px', fontWeight:700, color:'#1a237e', textTransform:'uppercase', fontSize:13, letterSpacing:1 }}>
                ⚒️ Datas Maçônicas — {mesNome}
              </p>
              {datasMaconicas.length === 0 ? (
                <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhuma data maçônica este mês.</p>
              ) : datasMaconicas.map((item,i) => {
                const [,m,d] = (item.data||'').split('-')
                const emoji = item.tipo === 'Bodes do Asfalto' ? '🏍️' : '⚒️'
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#f8fafc', borderRadius:8, marginBottom:8 }}>
                    <div>
                      <p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{item.nome}</p>
                      <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{emoji} {item.tipo} — Dia {d}/{m} — {item.anos} {item.anos === 1 ? 'ano' : 'anos'}</p>
                    </div>
                    <a href={`https://wa.me/55${(item.tel_celular||'').replace(/\D/g,'')}?text=${encodeURIComponent(emoji + ' A Loja Acácia de Serra Negra Nº 271 saúda o Ir∴ ' + item.nome + ' pelos ' + item.anos + ' anos de ' + item.tipo + '! Que o G∴A∴D∴U∴ ilumine sempre sua jornada fraterna! ⚒️')}`} target="_blank" rel="noreferrer"
                      style={{ background:'#25d366', color:'#fff', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, textDecoration:'none' }}>
                      WhatsApp
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal Novo/Editar */}
        {modal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
            <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
              <h3 style={{ margin:'0 0 20px', color:'#1a237e', fontSize:18 }}>
                {modal === 'novo' ? '➕ Novo Evento' : '✏️ Editar Evento'}
              </h3>

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Título *</label>
              <input value={form.titulo} onChange={e => setForm({...form,titulo:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:12, boxSizing:'border-box' }} />

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({...form,tipo:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:12, boxSizing:'border-box' }}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Visível para</label>
              <select value={form.visibilidade} onChange={e => setForm({...form,visibilidade:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:12, boxSizing:'border-box' }}>
                {VISIBILIDADE.map(v => <option key={v.value} value={v.value}>{v.emoji} {v.label}</option>)}
              </select>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Data *</label>
                  <DateInput value={form.data_evento} onChange={v => setForm({...form,data_evento:v})}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Hora</label>
                  <input type="time" value={form.hora} onChange={e => setForm({...form,hora:e.target.value})}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, boxSizing:'border-box' }} />
                </div>
              </div>

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Local</label>
              <input value={form.local} onChange={e => setForm({...form,local:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:12, boxSizing:'border-box' }}
                placeholder="Ex: Templo da Loja Acácia" />

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Descrição</label>
              <textarea value={form.descricao} onChange={e => setForm({...form,descricao:e.target.value})} rows={3}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:12, boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }}
                placeholder="Informações adicionais..." />

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:16, boxSizing:'border-box' }}>
                <option value="ativo">🟡 Agendado</option>
                <option value="realizado">🟢 Realizado</option>
                <option value="cancelado">🔴 Cancelado</option>
              </select>

              {erro && <div style={{ background:'#fee2e2', color:'#dc2626', padding:'10px 14px', borderRadius:8, marginBottom:12, fontSize:14 }}>❌ {erro}</div>}

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setModal(null)}
                  style={{ flex:1, padding:'12px', borderRadius:10, border:'2px solid #e2e8f0', background:'#fff', color:'#64748b', fontWeight:700, fontSize:15, cursor:'pointer' }}>
                  Cancelar
                </button>
                <button onClick={salvar} disabled={salvando}
                  style={{ flex:2, padding:'12px', borderRadius:10, border:'none', background:salvando?'#90a4ae':'#1a237e', color:'#fff', fontWeight:700, fontSize:15, cursor:salvando?'not-allowed':'pointer' }}>
                  {salvando ? 'Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Presenças */}
        {modalPresencas && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
            <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:420, maxHeight:'80vh', overflowY:'auto' }}>
              <h3 style={{ margin:'0 0 4px', color:'#1a237e' }}>👥 Presenças</h3>
              <p style={{ margin:'0 0 16px', color:'#64748b', fontSize:14 }}>{modalPresencas.titulo}</p>

              {/* Contadores */}
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                <div style={{ flex:1, textAlign:'center', background:'#e8f5e9', borderRadius:10, padding:'10px 4px' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#2e7d32' }}>{presencas.filter(p => p.resposta === 'presente').length}</div>
                  <div style={{ fontSize:11, color:'#2e7d32' }}>Confirmados</div>
                </div>
                <div style={{ flex:1, textAlign:'center', background:'#ffebee', borderRadius:10, padding:'10px 4px' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#c62828' }}>{presencas.filter(p => p.resposta === 'ausente').length}</div>
                  <div style={{ fontSize:11, color:'#c62828' }}>Ausentes</div>
                </div>
                <div style={{ flex:1, textAlign:'center', background:'#f1f5f9', borderRadius:10, padding:'10px 4px' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#64748b' }}>{presencas.filter(p => !p.resposta || p.resposta === 'pendente').length}</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>Sem resposta</div>
                </div>
              </div>

              {[
                { key:'presente', label:'Confirmados', cor:'#2e7d32' },
                { key:'ausente',  label:'Ausentes',    cor:'#c62828' },
              ].map(grupo => {
                const lista = presencas.filter(p => p.resposta === grupo.key)
                return lista.length > 0 ? (
                  <div key={grupo.key} style={{ marginBottom:14 }}>
                    <p style={{ margin:'0 0 6px', fontWeight:700, color:grupo.cor, fontSize:13 }}>{grupo.label} ({lista.length})</p>
                    {lista.map((p,i) => (
                      <div key={i} style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:8, marginBottom:4 }}>
                        <div style={{ fontSize:14, color:'#1e293b', fontWeight:500 }}>{p.associados?.nome_completo || '-'}</div>
                        {p.justificativa && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Justificativa: {p.justificativa}</div>}
                      </div>
                    ))}
                  </div>
                ) : null
              })}

              {presencas.length === 0 && <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhuma resposta ainda.</p>}

              <button onClick={() => setModalPresencas(null)}
                style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'#1a237e', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', marginTop:8 }}>
                Fechar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
