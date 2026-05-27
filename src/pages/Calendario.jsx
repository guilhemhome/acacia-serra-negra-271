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
  agendado:  { label:'Agendado',  cor:'#f59e0b', bg:'#fef3c7' },
  realizado: { label:'Realizado', cor:'#10b981', bg:'#d1fae5' },
  cancelado: { label:'Cancelado', cor:'#ef4444', bg:'#fee2e2' },
}

const RESPOSTAS = {
  confirmado: { label:'Confirmado', cor:'#10b981', bg:'#d1fae5', emoji:'✅' },
  ausente:    { label:'Não irei',   cor:'#ef4444', bg:'#fee2e2', emoji:'❌' },
  pendente:   { label:'Pendente',   cor:'#94a3b8', bg:'#f1f5f9', emoji:'⏳' },
}

function formatarData(str) {
  if (!str) return ''
  const [a,m,d] = str.split('-')
  return d+'/'+m+'/'+a
}

function hoje() {
  return new Date().toISOString().split('T')[0]
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
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [grauUsuario, setGrauUsuario] = useState(null)
  const [associadoId, setAssociadoId] = useState(null)
  const [filtroMes, setFiltroMes] = useState(mesAtual())
  const [modal, setModal] = useState(null)
  const [modalPresencas, setModalPresencas] = useState(null)
  const [presencas, setPresencas] = useState([])
  const [form, setForm] = useState({ titulo:'', tipo:'sessao_ordinaria', data_evento:'', hora:'', local:'', descricao:'', status:'agendado', visibilidade:'todos' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState('eventos') // 'eventos' | 'aniversarios'

  useEffect(() => { init() }, [])
  useEffect(() => { carregarEventos() }, [filtroMes])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: p } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', session.user.id).single()
    setPerfil(p?.perfil || 'membro')
    const { data: assoc } = await supabase.from('associados').select('id, grau:historico_graus(grau)').eq('user_id', session.user.id).single()
    if (assoc) {
      setAssociadoId(assoc.id)
      const graus = assoc.grau || []
      const temMestre = graus.some(g => g.grau === 'mestre')
      const temCompanheiro = graus.some(g => g.grau === 'companheiro')
      setGrauUsuario(temMestre ? 'mestre' : temCompanheiro ? 'companheiro' : 'aprendiz')
    } else {
      setAssociadoId(null)
    }
    await carregarAniversariantes()
  }

  async function carregarAniversariantes() {
    const mes = String(new Date().getMonth()+1).padStart(2,'0')
    const { data: irmãos } = await supabase.from('associados')
      .select('id, nome_completo, data_nascimento')
      .eq('status_cadastro','aprovado')
      .not('data_nascimento','is',null)
    const aniv = (irmãos||[]).filter(a => a.data_nascimento && a.data_nascimento.split('-')[1] === mes)
    setAniversariantes(aniv)
    const { data: deps } = await supabase.from('familiares')
      .select('nome, data_nascimento, parentesco, associado_id, associados(nome_completo)')
      .not('data_nascimento','is',null)
    const fam = (deps||[]).filter(d => d.data_nascimento && d.data_nascimento.split('-')[1] === mes)
    setFamiliares(fam)
  }

  async function carregarEventos() {
    setLoading(true)
    const inicio = filtroMes + '-01'
    const [ano, mes] = filtroMes.split('-')
    const ultimo = new Date(ano, mes, 0).getDate()
    const fim = filtroMes + '-' + String(ultimo).padStart(2,'0')
    const { data } = await supabase.from('eventos').select('*').gte('data_evento',inicio).lte('data_evento',fim).order('data_evento')
    
    // Filtrar por visibilidade
    const filtrados = (data||[]).filter(ev => {
      if (!perfil || perfil === 'adm' || perfil === 'secretario') return true
      if (ev.visibilidade === 'todos') return true
      if (ev.visibilidade === 'mestres' && grauUsuario === 'mestre') return true
      if (ev.visibilidade === 'companheiros' && (grauUsuario === 'mestre' || grauUsuario === 'companheiro')) return true
      return false
    })

    // Carregar presença do usuário para cada evento
    if (associadoId) {
      const ids = filtrados.map(e => e.id)
      if (ids.length > 0) {
        const { data: pres } = await supabase.from('eventos_presencas')
          .select('evento_id, resposta')
          .eq('associado_id', associadoId)
          .in('evento_id', ids)
        const presMap = {}
        ;(pres||[]).forEach(p => { presMap[p.evento_id] = p.resposta })
        setEventos(filtrados.map(ev => ({ ...ev, minhaResposta: presMap[ev.id] || 'pendente' })))
      } else {
        setEventos([])
      }
    } else {
      setEventos(filtrados)
    }
    setLoading(false)
  }

  async function responderPresenca(eventoId, resposta) {
    if (!associadoId) return
    await supabase.from('eventos_presencas').upsert(
      { evento_id: eventoId, associado_id: associadoId, resposta, updated_at: new Date().toISOString() },
      { onConflict: 'evento_id,associado_id' }
    )
    carregarEventos()
  }

  async function verPresencas(ev) {
    const { data } = await supabase.from('eventos_presencas')
      .select('resposta, associados(nome_completo)')
      .eq('evento_id', ev.id)
    setPresencas(data||[])
    setModalPresencas(ev)
  }

  function abrirNovo() {
    setForm({ titulo:'', tipo:'sessao_ordinaria', data_evento:'', hora:'', local:'', descricao:'', status:'agendado', visibilidade:'todos' })
    setErro('')
    setModal('novo')
  }

  function abrirEditar(ev) {
    setForm({ titulo:ev.titulo||'', tipo:ev.tipo||'outro', data_evento:ev.data_evento_evento||'', hora:ev.hora||'', local:ev.local||'', descricao:ev.descricao||'', status:ev.status||'agendado', visibilidade:ev.visibilidade||'todos' })
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

  const isAdm = perfil === 'adm' || perfil === 'secretario'
  const hj = hoje()
  const proximos = eventos.filter(e => e.data >= hj && e.status === 'agendado')
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
                    {ev.status === 'agendado' && !passado && (
                      <div style={{ marginTop:8 }}>
                        <p style={{ margin:'0 0 6px', fontSize:12, color:'#64748b', fontWeight:600 }}>Sua presença:</p>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => responderPresenca(ev.id,'confirmado')}
                            style={{ padding:'5px 12px', borderRadius:8, border:'2px solid', fontSize:12, fontWeight:700, cursor:'pointer',
                              borderColor:'#10b981', background: ev.minhaResposta==='confirmado' ? '#10b981' : '#fff',
                              color: ev.minhaResposta==='confirmado' ? '#fff' : '#10b981' }}>✅ Confirmar</button>
                          <button onClick={() => responderPresenca(ev.id,'ausente')}
                            style={{ padding:'5px 12px', borderRadius:8, border:'2px solid', fontSize:12, fontWeight:700, cursor:'pointer',
                              borderColor:'#ef4444', background: ev.minhaResposta==='ausente' ? '#ef4444' : '#fff',
                              color: ev.minhaResposta==='ausente' ? '#fff' : '#ef4444' }}>❌ Não irei</button>
                          {ev.minhaResposta !== 'pendente' && (
                            <button onClick={() => responderPresenca(ev.id,'pendente')}
                              style={{ padding:'5px 12px', borderRadius:8, border:'2px solid #94a3b8', fontSize:12, fontWeight:700, cursor:'pointer', background:'#fff', color:'#94a3b8' }}>⏳</button>
                          )}
                        </div>
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
                        {ev.status === 'agendado' && passado && (
                          <button onClick={() => supabase.from('eventos').update({status:'realizado'}).eq('id',ev.id).then(carregarEventos)}
                            style={{ background:'#d1fae5', border:'none', borderRadius:6, color:'#065f46', padding:'4px 8px', cursor:'pointer', fontSize:12, fontWeight:600 }}>✅ Realizado</button>
                        )}
                        {ev.status === 'agendado' && (
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
                    <a href={`https://wa.me/55${(a.tel_celular||'').replace(/\D/g,'')}?text=${encodeURIComponent('Feliz aniversário, Ir. '+a.nome_completo+'! 🎂')}`} target="_blank" rel="noreferrer"
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
                    <a href={`https://wa.me/55${(f.associados?.tel_celular||'').replace(/\D/g,'')}?text=${encodeURIComponent('Feliz aniversário, '+f.nome+'! 🎂')}`} target="_blank" rel="noreferrer"
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
                <option value="agendado">🟡 Agendado</option>
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

              {[
                { key:'confirmado', label:'✅ Confirmados' },
                { key:'ausente',    label:'❌ Não irão' },
                { key:'pendente',   label:'⏳ Sem resposta' },
              ].map(grupo => {
                const lista = presencas.filter(p => (p.resposta||'pendente') === grupo.key)
                return lista.length > 0 ? (
                  <div key={grupo.key} style={{ marginBottom:14 }}>
                    <p style={{ margin:'0 0 6px', fontWeight:700, color:'#333', fontSize:13 }}>{grupo.label} ({lista.length})</p>
                    {lista.map((p,i) => (
                      <div key={i} style={{ padding:'6px 12px', background:'#f8fafc', borderRadius:6, marginBottom:4, fontSize:14, color:'#1e293b' }}>
                        {p.associados?.nome_completo || '—'}
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
