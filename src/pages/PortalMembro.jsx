import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const GRUPOS_CARGOS = [
  { id:'direcao', label:'Direção', cargos:['Venerável Mestre','1º Vigilante','2º Vigilante'] },
  { id:'admin', label:'Administração', cargos:['Secretário','Tesoureiro','Chanceler'] },
  { id:'juridico', label:'Jurídico', cargos:['Orador'] },
  { id:'ritual', label:'Ritual', cargos:['Mestre de Cerimônias','1º Diácono','2º Diácono','1º Experto','2º Experto','Mestre de Harmonia'] },
  { id:'assistencia', label:'Assistência', cargos:['Hospitaleiro','Mestre de Banquetes'] },
  { id:'guarda', label:'Guarda', cargos:['Cobridor Interno','Cobridor Externo','Porta-Bandeira','Porta-Estandarte','Porta-Espada'] },
  { id:'outros', label:'Outros', cargos:[] },
]

export default function PortalMembro() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [cargos, setCargos] = useState([])
  const [eventos, setEventos] = useState([])
  const [aniversarios, setAniversarios] = useState([])
  const [avisos, setAvisos] = useState([])
  const [ehBode, setEhBode] = useState(false)
  const [gruposAbertos, setGruposAbertos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [presencas, setPresencas] = useState({})
  const [justificativaAberta, setJustificativaAberta] = useState(null)
  const [textoJustificativa, setTextoJustificativa] = useState('')
  const [salvandoPresenca, setSalvandoPresenca] = useState(false)
  const [associadoId, setAssociadoId] = useState(null)
  const associadoIdRef = React.useRef(null)

  function hojeStr() { return new Date().toISOString().split('T')[0] }
  function fimMes() { const d = new Date(); d.setMonth(d.getMonth()+1); d.setDate(0); return d.toISOString().split('T')[0] }
  function fmt(d) { return d ? d.split('T')[0].split('-').reverse().join('/') : '' }

  useEffect(() => { buscarDados() }, [])

  async function buscarDados() {
    try {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    console.log('USER:', user?.email)
    if (!user) { setCarregando(false); return }

    const { data: assoc } = await supabase.from('associados')
      .select('id, nome_completo, bodes_asfalto, bodes_asfalto_numero, bodes_asfalto_data_admissao').eq('user_id', user.id).maybeSingle()
    const { data: perfil } = await supabase.from('perfis_acesso')
      .select('perfil').eq('user_id', user.id).maybeSingle()

    setUsuario({ nome: assoc?.nome_completo || user.email.split('@')[0], perfil: perfil?.perfil || 'Membro' })
    setAssociadoId(assoc?.id || null)
    associadoIdRef.current = assoc?.id || null
    setEhBode(assoc?.bodes_asfalto === true)

    const { data: ch } = await supabase.from('cargos_historico')
      .select('cargo, associados(nome_completo)').eq('em_exercicio', true)
    setCargos(ch || [])

    const { data: evs } = await supabase.from('eventos')
      .select('*').eq('status','ativo')
      .gte('data_evento', hojeStr())
      .order('data_evento').limit(1)
    setEventos(evs || [])

      if (assoc?.id && evs && evs.length > 0) {
        const eventIds = evs.map(e => e.id)
        const { data: pres } = await supabase.from('eventos_presencas')
          .select('evento_id, resposta, justificativa')
          .eq('associado_id', assoc.id)
          .in('evento_id', eventIds)
        const mapa = {}
        ;(pres || []).forEach(p => { mapa[p.evento_id] = { resposta: p.resposta, justificativa: p.justificativa } })
        setPresencas(mapa)
      }

    const mesAtual = hojeStr().split('-')[1]
    const { data: irmaos } = await supabase.from('associados')
      .select('nome_completo, data_nascimento').eq('status_cadastro','aprovado')
    setAniversarios((irmaos||[]).filter(a => a.data_nascimento && a.data_nascimento.split('T')[0].split('-')[1] === mesAtual).slice(0,5))

    // tabela avisos ainda não implementada — ignorar erro
    try {
      const { data: avs } = await supabase.from('avisos')
        .select('*, associados(nome_completo)').eq('ativo', true).order('created_at', { ascending: false }).limit(5)
      setAvisos(avs || [])
    } catch(e) { setAvisos([]) }

    setCarregando(false)
  } catch(err) { console.error('ERRO PORTAL:', err); setCarregando(false); }
  }

  function titular(nomeCargo) { return cargos.find(c => c.cargo === nomeCargo) }

  async function confirmarPresenca(eventoId, resposta, justificativa) {
    const aid = associadoIdRef.current
    if (!aid) { console.warn('associadoId nulo'); return }
    setSalvandoPresenca(eventoId + resposta)
    try {
      await supabase.from('eventos_presencas').upsert({
        evento_id: eventoId,
        associado_id: aid,
        resposta: resposta,
        justificativa: justificativa || null,
        confirmado_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'evento_id,associado_id' })
      setPresencas(prev => ({ ...prev, [eventoId]: { resposta, justificativa } }))
      setJustificativaAberta(null)
      setTextoJustificativa('')
    } catch(err) { console.error('Erro ao salvar presença:', err) }
    setSalvandoPresenca(false)
  }

  const primeiroNome = usuario?.nome?.split(' ')[0] || ''
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const sec = { color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }

  if (carregando) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white', fontSize:'1.2rem' }}>Carregando...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding:'24px 16px 40px' }}>
      <div style={{ maxWidth:480, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ position:'relative', textAlign:'center', marginBottom:24 }}>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
            style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 12px', cursor:'pointer', fontSize:16, minWidth:44, minHeight:44 }}>↩</button>
          <img src="/logo-acacia.png" alt="Logo" style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto 8px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.4rem', fontWeight:500, margin:'0 0 2px' }}>Olá, {primeiroNome}</h1>
          <p style={{ color:'rgba(255,255,255,0.65)', margin:0, fontSize:13 }}>{usuario?.perfil} · Acácia de Serra Negra Nº 271</p>
        </div>

        {/* Cards acesso rápido */}
        <p style={sec}>Acesso rápido</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { icon:'👤', label:'Meu Cadastro', sub:'Ver e editar dados', rota:'/editar-perfil' },
            { icon:'⚒️', label:'Quadro de Oficiais', sub:'Cargos da loja', rota:'/oficiais' },
            { icon:'📅', label:'Calendário', sub:'Próximos eventos', rota:'/calendario' },
            { icon:'💰', label:'Financeiro', sub:'Minha situação', rota:null, emBreve:true },
            ...(ehBode ? [{ icon:'🏍️', label:'Bodes do Asfalto', sub:'Área do motoclub', rota:null, emBreve:true }] : []),
          ].map((c, i) => (
            <button key={i} onClick={() => !c.emBreve && c.rota && navigate(c.rota)}
              style={{ background: c.emBreve ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)', border:'none', borderRadius:16, padding:'16px 14px', cursor: c.emBreve ? 'default' : 'pointer', textAlign:'left', position:'relative' }}>
              {c.emBreve && <span style={{ position:'absolute', top:8, right:8, fontSize:9, background:'rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.6)', borderRadius:10, padding:'2px 6px' }}>em breve</span>}
              <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>
              <div style={{ color: c.emBreve ? 'rgba(255,255,255,0.5)' : '#fff', fontSize:13, fontWeight:600, lineHeight:1.2 }}>{c.label}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:3 }}>{c.sub}</div>
            </button>
          ))}
        </div>

        {/* Avisos */}
        {avisos.length > 0 && (
          <>
            <p style={sec}>📢 Avisos</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {avisos.map((av, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.95)', borderRadius:14, padding:'14px 16px', borderLeft:'4px solid #f59e0b' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1e293b', marginBottom:4 }}>{av.titulo}</div>
                  <div style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>{av.conteudo}</div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
                    {av.associados?.nome_completo} · {fmt(av.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Banner pendencia de presenca */}
        {eventos.length > 0 && !presencas[eventos[0].id]?.resposta && (
          <div style={{ background:'#fff3e0', borderRadius:14, padding:'12px 16px', marginBottom:16, borderLeft:'4px solid #f59e0b', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:20 }}>⚠️</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#e65100' }}>Manifestação pendente</div>
              <div style={{ fontSize:12, color:'#bf360c' }}>Confirme sua presença nos próximos eventos da loja.</div>
            </div>
          </div>
        )}

        {/* Próximos eventos */}
        {eventos.length > 0 && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <p style={{ ...sec, margin:0 }}>Próximo evento</p>
              <button onClick={() => navigate('/calendario')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer', padding:0 }}>Ver todos →</button>
            </div>
            <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'4px 16px', marginBottom:20 }}>
              {eventos.map((ev, i) => (
                <div key={ev.id} style={{ padding:'12px 0', borderBottom: i < eventos.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ textAlign:'center', minWidth:36, background:'#f1f5f9', borderRadius:8, padding:'6px 8px', flexShrink:0 }}>
                      <div style={{ fontSize:16, fontWeight:600, color:'#1a237e', lineHeight:1 }}>{ev.data_evento.split('-')[2]}</div>
                      <div style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase' }}>{MESES[parseInt(ev.data_evento.split('-')[1])-1]}</div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.titulo}</div>
                      <div style={{ fontSize:11, color:'#64748b' }}>{ev.hora || '20:00'}</div>
                    </div>
                  </div>
                  {presencas[ev.id] ? (
                    <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
                      {presencas[ev.id].resposta === 'presente' ? (
                        <span style={{ fontSize:12, color:'#2e7d32', background:'#e8f5e9', borderRadius:20, padding:'4px 12px', fontWeight:600 }}>Presença confirmada</span>
                      ) : (
                        <span style={{ fontSize:12, color:'#c62828', background:'#ffebee', borderRadius:20, padding:'4px 12px', fontWeight:600 }}>Ausência justificada</span>
                      )}
                      <button onClick={() => { setPresencas(prev => { const copia = { ...prev }; delete copia[ev.id]; return copia }) }}
                        style={{ fontSize:11, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', padding:0 }}>alterar</button>
                    </div>
                  ) : justificativaAberta === ev.id ? (
                    <div style={{ marginTop:8 }}>
                      <textarea
                        placeholder="Informe sua justificativa (obrigatório)..."
                        value={textoJustificativa}
                        onChange={e => setTextoJustificativa(e.target.value)}
                        style={{ width:'100%', borderRadius:8, border:'1px solid #e2e8f0', padding:'8px 10px', fontSize:12, resize:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                        rows={3}
                      />
                      <div style={{ display:'flex', gap:8, marginTop:6 }}>
                        <button
                          onClick={() => textoJustificativa.trim() && confirmarPresenca(ev.id, 'ausente', textoJustificativa.trim())}
                          disabled={!textoJustificativa.trim() || salvandoPresenca === ev.id + 'ausente'}
                          style={{ flex:1, background: textoJustificativa.trim() ? '#c62828' : '#e2e8f0', color: textoJustificativa.trim() ? '#fff' : '#94a3b8', border:'none', borderRadius:8, padding:'8px 0', fontSize:12, fontWeight:600, cursor: textoJustificativa.trim() ? 'pointer' : 'default' }}>
                          {salvandoPresenca === ev.id + 'ausente' ? 'Salvando...' : 'Confirmar ausência'}
                        </button>
                        <button onClick={() => { setJustificativaAberta(null); setTextoJustificativa('') }}
                          style={{ background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:8, padding:'8px 14px', fontSize:12, cursor:'pointer' }}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <button onClick={() => confirmarPresenca(ev.id, 'presente', null)}
                        disabled={salvandoPresenca === ev.id + 'presente'}
                        style={{ flex:1, background:'#e8f5e9', color:'#2e7d32', border:'1px solid #a5d6a7', borderRadius:8, padding:'7px 0', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        {salvandoPresenca === ev.id + 'presente' ? 'Salvando...' : 'Confirmar presença'}
                      </button>
                      <button onClick={() => setJustificativaAberta(ev.id)}
                        style={{ flex:1, background:'#ffebee', color:'#c62828', border:'1px solid #ef9a9a', borderRadius:8, padding:'7px 0', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        Não irei
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Aniversariantes do mês */}
        {aniversarios.length > 0 && (
          <>
            <p style={sec}>🎂 Aniversariantes do mês</p>
            <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'4px 16px' }}>
              {aniversarios.map((a, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i < aniversarios.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#7c3aed', flexShrink:0 }}>
                    {a.nome_completo.split(' ').map(p => p[0]).slice(0,2).join('')}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>{a.nome_completo}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>🎂 {fmt(a.data_nascimento).slice(0,5)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
