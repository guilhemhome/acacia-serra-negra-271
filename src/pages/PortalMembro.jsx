import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PortalMembro() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [cargos, setCargos] = useState([])
  const [eventos, setEventos] = useState([])
  const [aniversarios, setAniversarios] = useState([])
  const [carregando, setCarregando] = useState(true)

  function hojeStr() { return new Date().toISOString().split('T')[0] }
  function fimMes() {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    d.setDate(0)
    return d.toISOString().split('T')[0]
  }
  function fmt(d) { return d ? d.split('T')[0].split('-').reverse().join('/') : '' }

  useEffect(() => { buscarDados() }, [])

  async function buscarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: assoc } = await supabase.from('associados')
      .select('id, nome_completo, grau:historico_graus(grau)').eq('user_id', user.id).single()
    const { data: perfil } = await supabase.from('perfis_acesso')
      .select('perfil').eq('user_id', user.id).single()

    setUsuario({ nome: assoc?.nome_completo || user.email.split('@')[0], perfil: perfil?.perfil || 'Membro' })

    // Cargos atuais
    const { data: ch } = await supabase.from('cargos_historico')
      .select('cargo, associados(nome_completo)').eq('em_exercicio', true)
    setCargos(ch || [])

    // Próximos eventos do mês
    const { data: evs } = await supabase.from('eventos')
      .select('*').eq('status', 'agendado')
      .gte('data_evento', hojeStr()).lte('data_evento', fimMes())
      .order('data_evento').limit(3)
    setEventos(evs || [])

    // Aniversariantes do mês
    const hoje = hojeStr()
    const fim = fimMes()
    const mesAtual = hoje.split('-')[1]
    const { data: irmaos } = await supabase.from('associados')
      .select('nome_completo, data_nascimento').eq('status_cadastro', 'aprovado')
    const anivs = (irmaos || []).filter(a => {
      if (!a.data_nascimento) return false
      const mes = a.data_nascimento.split('T')[0].split('-')[1]
      return mes === mesAtual
    }).slice(0, 5)
    setAniversarios(anivs)

    setCarregando(false)
  }

  const primeiroNome = usuario?.nome?.split(' ')[0] || ''
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

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

        {/* Cards de acesso rápido */}
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Acesso rápido</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { icon:'👤', label:'Meu Cadastro', sub:'Ver e editar perfil', rota:'/editar-perfil' },
            { icon:'⚒️', label:'Oficiais', sub:'Quadro de cargos', rota:null, acao:'cargos' },
            { icon:'📅', label:'Calendário', sub:'Próximos eventos', rota:'/calendario' },
            { icon:'✏️', label:'Meu Perfil', sub:'Dados pessoais', rota:'/editar-perfil' },
          ].map((c, i) => (
            <button key={i} onClick={() => c.rota ? navigate(c.rota) : document.getElementById('sec-'+c.acao)?.scrollIntoView({ behavior:'smooth' })}
              style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:16, padding:'16px 14px', cursor:'pointer', textAlign:'left' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>
              <div style={{ color:'#fff', fontSize:13, fontWeight:600, lineHeight:1.2 }}>{c.label}</div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:3 }}>{c.sub}</div>
            </button>
          ))}
        </div>

        {/* Próximos eventos */}
        {eventos.length > 0 && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>Próximos eventos</p>
              <button onClick={() => navigate('/calendario')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer', padding:0 }}>Ver todos →</button>
            </div>
            <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'4px 16px', marginBottom:20 }}>
              {eventos.map((ev, i) => (
                <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < eventos.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ textAlign:'center', minWidth:36, background:'#f1f5f9', borderRadius:8, padding:'6px 8px' }}>
                    <div style={{ fontSize:16, fontWeight:600, color:'#1a237e', lineHeight:1 }}>{ev.data_evento.split('-')[2]}</div>
                    <div style={{ fontSize:9, color:'#94a3b8', textTransform:'uppercase' }}>{MESES[parseInt(ev.data_evento.split('-')[1])-1]}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{ev.titulo}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{ev.hora || '20:00'}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Quadro de oficiais */}
        <p id="sec-cargos" style={{ color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px', scrollMarginTop:20 }}>Quadro de oficiais</p>
        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'4px 16px', marginBottom:20 }}>
          {cargos.length === 0 ? (
            <p style={{ color:'#94a3b8', textAlign:'center', fontSize:13, padding:'12px 0' }}>Nenhum cargo atribuído ainda.</p>
          ) : cargos.map((c, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i < cargos.length-1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#1a237e' }}>{c.cargo}</div>
                <div style={{ fontSize:12, color:'#475569' }}>{c.associados?.nome_completo || '—'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Aniversariantes do mês */}
        {aniversarios.length > 0 && (
          <>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Aniversariantes do mês</p>
            <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'4px 16px', marginBottom:20 }}>
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
