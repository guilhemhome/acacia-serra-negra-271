import { useState, useEffect } from 'react'
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

const STATUS = {
  agendado:  { label:'Agendado',  cor:'#f59e0b', bg:'#fef3c7' },
  realizado: { label:'Realizado', cor:'#10b981', bg:'#d1fae5' },
  cancelado: { label:'Cancelado', cor:'#ef4444', bg:'#fee2e2' },
}

function formatarData(str) {
  if (!str) return ''
  const [a,m,d] = str.split('-')
  return d+'/'+m+'/'+a
}

function hoje() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

function mesAtual() {
  const d = new Date()
  const m = String(d.getMonth()+1).padStart(2,'0')
  return d.getFullYear()+'-'+m
}

export default function Calendario() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [filtroMes, setFiltroMes] = useState(mesAtual())
  const [modal, setModal] = useState(null) // null | 'novo' | evento
  const [form, setForm] = useState({ titulo:'', tipo:'sessao_ordinaria', data:'', hora:'', local:'', descricao:'', status:'agendado' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { carregar() }, [filtroMes])

  async function carregar() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: p } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', session.user.id).single()
      setPerfil(p?.perfil || 'membro')
    }
    const inicio = filtroMes + '-01'
    const [ano, mes] = filtroMes.split('-')
    const ultimo = new Date(ano, mes, 0).getDate()
    const fim = filtroMes + '-' + String(ultimo).padStart(2,'0')
    const { data } = await supabase.from('eventos').select('*').gte('data', inicio).lte('data', fim).order('data')
    setEventos(data || [])
    setLoading(false)
  }

  function abrirNovo() {
    setForm({ titulo:'', tipo:'sessao_ordinaria', data:'', hora:'', local:'', descricao:'', status:'agendado' })
    setErro('')
    setModal('novo')
  }

  function abrirEditar(ev) {
    setForm({ titulo:ev.titulo||'', tipo:ev.tipo||'outro', data:ev.data||'', hora:ev.hora||'', local:ev.local||'', descricao:ev.descricao||'', status:ev.status||'agendado' })
    setErro('')
    setModal(ev)
  }

  async function salvar() {
    if (!form.titulo || !form.data) { setErro('Título e data são obrigatórios.'); return }
    setSalvando(true); setErro('')
    if (modal === 'novo') {
      const { error } = await supabase.from('eventos').insert([form])
      if (error) setErro('Erro: ' + error.message)
    } else {
      const { error } = await supabase.from('eventos').update(form).eq('id', modal.id)
      if (error) setErro('Erro: ' + error.message)
    }
    setSalvando(false)
    if (!erro) { setModal(null); carregar() }
  }

  async function cancelarEvento(id) {
    await supabase.from('eventos').update({ status:'cancelado' }).eq('id', id)
    carregar()
  }

  async function marcarRealizado(id) {
    await supabase.from('eventos').update({ status:'realizado' }).eq('id', id)
    carregar()
  }

  const isAdm = perfil === 'adm' || perfil === 'secretario'
  const hj = hoje()
  const proximos = eventos.filter(e => e.data >= hj && e.status === 'agendado')
  const realizados = eventos.filter(e => e.status === 'realizado')
  const cancelados = eventos.filter(e => e.status === 'cancelado')

  function tipoInfo(val) { return TIPOS.find(t => t.value === val) || TIPOS[7] }

  const meses = []
  for (let i = -3; i <= 6; i++) {
    const d = new Date(); d.setMonth(d.getMonth() + i)
    const val = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')
    const label = d.toLocaleString('pt-BR',{month:'long',year:'numeric'})
    meses.push({ val, label })
  }

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

        {/* Filtro de mês */}
        <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ color:'rgba(255,255,255,0.8)', fontSize:14, whiteSpace:'nowrap' }}>📅 Período:</span>
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
            { label:'Próximos', valor:proximos.length, cor:'#f59e0b', emoji:'🟡' },
            { label:'Realizados', valor:realizados.length, cor:'#10b981', emoji:'🟢' },
            { label:'Cancelados', valor:cancelados.length, cor:'#ef4444', emoji:'🔴' },
          ].map(c => (
            <div key={c.label} style={{ background:'rgba(255,255,255,0.95)', borderRadius:12, padding:'14px 10px', textAlign:'center', borderTop:'4px solid '+c.cor }}>
              <div style={{ fontSize:22, fontWeight:800, color:c.cor }}>{c.valor}</div>
              <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:0.5 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Lista de eventos */}
        {loading ? (
          <div style={{ color:'#fff', textAlign:'center', padding:40 }}>Carregando...</div>
        ) : eventos.length === 0 ? (
          <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:32, textAlign:'center', color:'rgba(255,255,255,0.6)' }}>
            Nenhum evento neste período.{isAdm ? ' Clique em ➕ Novo para adicionar.' : ''}
          </div>
        ) : (
          eventos.map(ev => {
            const st = STATUS[ev.status] || STATUS.agendado
            const tp = tipoInfo(ev.tipo)
            const passado = ev.data < hj
            return (
              <div key={ev.id} style={{ background:'rgba(255,255,255,0.95)', borderRadius:12, padding:16, marginBottom:12, borderLeft:'5px solid '+st.cor }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:18 }}>{tp.emoji}</span>
                      <span style={{ fontWeight:700, color:'#1e293b', fontSize:15 }}>{ev.titulo}</span>
                    </div>
                    <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>
                      {tp.label}
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, fontSize:13, color:'#475569' }}>
                      <span>📅 {formatarData(ev.data)}</span>
                      {ev.hora && <span>🕐 {ev.hora}</span>}
                      {ev.local && <span>📍 {ev.local}</span>}
                    </div>
                    {ev.descricao && <p style={{ margin:'8px 0 0', fontSize:13, color:'#64748b', lineHeight:1.4 }}>{ev.descricao}</p>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                    <span style={{ background:st.bg, color:st.cor, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
                      {st.label}
                    </span>
                    {isAdm && (
                      <div style={{ display:'flex', gap:6, marginTop:4 }}>
                        <button onClick={() => abrirEditar(ev)}
                          style={{ background:'#e0f2fe', border:'none', borderRadius:6, color:'#0369a1', padding:'4px 10px', cursor:'pointer', fontSize:12, fontWeight:600 }}>✏️</button>
                        {ev.status === 'agendado' && passado && (
                          <button onClick={() => marcarRealizado(ev.id)}
                            style={{ background:'#d1fae5', border:'none', borderRadius:6, color:'#065f46', padding:'4px 8px', cursor:'pointer', fontSize:12, fontWeight:600 }}>✅</button>
                        )}
                        {ev.status === 'agendado' && (
                          <button onClick={() => cancelarEvento(ev.id)}
                            style={{ background:'#fee2e2', border:'none', borderRadius:6, color:'#dc2626', padding:'4px 8px', cursor:'pointer', fontSize:12, fontWeight:600 }}>✕</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Modal novo/editar */}
        {modal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
            <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
              <h3 style={{ margin:'0 0 20px', color:'#1a237e', fontSize:18 }}>
                {modal === 'novo' ? '➕ Novo Evento' : '✏️ Editar Evento'}
              </h3>

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Título *</label>
              <input value={form.titulo} onChange={e => setForm({...form, titulo:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:12, boxSizing:'border-box' }} />

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:12, boxSizing:'border-box' }}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Data *</label>
                  <input type="date" value={form.data} onChange={e => setForm({...form, data:e.target.value})}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Hora</label>
                  <input type="time" value={form.hora} onChange={e => setForm({...form, hora:e.target.value})}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, boxSizing:'border-box' }} />
                </div>
              </div>

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Local</label>
              <input value={form.local} onChange={e => setForm({...form, local:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:12, boxSizing:'border-box' }}
                placeholder="Ex: Templo da Loja Acácia" />

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Descrição</label>
              <textarea value={form.descricao} onChange={e => setForm({...form, descricao:e.target.value})} rows={3}
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:12, boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }}
                placeholder="Informações adicionais sobre o evento..." />

              <label style={{ display:'block', marginBottom:4, fontWeight:600, color:'#333', fontSize:14 }}>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status:e.target.value})}
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
                  style={{ flex:2, padding:'12px', borderRadius:10, border:'none', background: salvando ? '#90a4ae' : '#1a237e', color:'#fff', fontWeight:700, fontSize:15, cursor: salvando ? 'not-allowed' : 'pointer' }}>
                  {salvando ? 'Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
