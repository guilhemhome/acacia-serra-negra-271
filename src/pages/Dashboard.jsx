import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ ativos:0, pendentes:0, aniversarios:[] })
  const [eventos, setEventos] = useState([])
  const [usuario, setUsuario] = useState({ email:'', perfil:'membro', nome:'' })
  const [grauUsuario, setGrauUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [filtroEventos, setFiltroEventos] = useState('proximos') // 'proximos' | 'passados' | 'todos'

  useEffect(() => { buscarDados() }, [])
  useEffect(() => { if (grauUsuario !== null) buscarEventos() }, [filtroEventos, grauUsuario, usuario.perfil])

  function hoje() { return new Date().toISOString().split('T')[0] }
  function mesAtual() { return String(new Date().getMonth()+1).padStart(2,'0') }

  async function buscarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Perfil de acesso
    const { data: p } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', user.id).single()
    const perfil = p?.perfil || 'membro'

    // Nome do associado
    const { data: assoc } = await supabase.from('associados')
      .select('id, nome_completo, grau:historico_graus(grau)')
      .eq('user_id', user.id).single()
    const nome = assoc?.nome_completo || user.email.split('@')[0]
    const graus = assoc?.grau || []
    const temMestre = graus.some(g => g.grau === 'mestre')
    const temCompanheiro = graus.some(g => g.grau === 'companheiro')
    const grau = temMestre ? 'mestre' : temCompanheiro ? 'companheiro' : 'aprendiz'
    setGrauUsuario(grau)
    setUsuario({ email: user.email, perfil, nome })

    // Stats
    const mes = mesAtual()
    const [{ count: ativos }, { count: pendentes }, { data: irmãos }, { data: famAniv }] = await Promise.all([
      supabase.from('associados').select('*',{count:'exact',head:true}).eq('status_cadastro','aprovado'),
      supabase.from('associados').select('*',{count:'exact',head:true}).eq('status_cadastro','pendente'),
      supabase.from('associados').select('nome_completo, data_nascimento').eq('status_cadastro','aprovado'),
      supabase.from('familiares').select('nome, data_nascimento').not('data_nascimento','is',null)
    ])

    // Aniversariantes do mês — usando split, nunca new Date()
    const anivIrmaos = (irmãos||[]).filter(a => a.data_nascimento && a.data_nascimento.split('-')[1] === mes)
    const anivFam = (famAniv||[]).filter(f => f.data_nascimento && f.data_nascimento.split('-')[1] === mes)
    const totalAniv = anivIrmaos.length + anivFam.length

    setStats({ ativos: ativos||0, pendentes: pendentes||0, aniversarios: totalAniv })
    setCarregando(false)
  }

  async function buscarEventos() {
    const hj = hoje()
    let query = supabase.from('eventos').select('*').eq('status','agendado').order('data_evento')
    if (filtroEventos === 'proximos') query = query.gte('data_evento', hj)
    else if (filtroEventos === 'passados') query = query.lt('data_evento', hj)
    const { data } = await query
    // Filtrar por visibilidade
    const filtrados = (data||[]).filter(ev => {
      if (usuario.perfil === 'adm' || usuario.perfil === 'secretario') return true
      if (ev.visibilidade === 'todos') return true
      if (ev.visibilidade === 'mestres' && grauUsuario === 'mestre') return true
      if (ev.visibilidade === 'companheiros' && (grauUsuario === 'mestre' || grauUsuario === 'companheiro')) return true
      return false
    })
    setEventos(filtrados.slice(0, 5))
  }

  function formatarData(str) {
    if (!str) return ''
    const [a,m,d] = str.split('-')
    return d+'/'+m+'/'+a
  }

  const TIPOS_EMOJI = {
    sessao_ordinaria:'⚒️', sessao_magna:'🏛️', iniciacao:'⭐',
    grande_loja:'📜', festa:'🎉', diretoria:'📋', visita:'🤝', outro:'📌'
  }

  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const mesNome = meses[new Date().getMonth()]
  const primeiroNome = usuario.nome.split(' ')[0] || usuario.email.split('@')[0].split('.')[0]

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding:'24px 16px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:8 }}>
          <img src="/logo-acacia.png" alt="Logo" style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto' }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:500, fontSize:16 }}>
            {primeiroNome[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ color:'white', fontSize:16, fontWeight:500 }}>Olá, {primeiroNome}</div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>
              {usuario.perfil === 'adm' ? 'Administrador' : usuario.perfil === 'secretario' ? 'Secretário' : 'Membro'} · Acácia de Serra Negra Nº 271
            </div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/') }} title="Sair"
            style={{ marginLeft:'auto', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, width:36, height:36, cursor:'pointer', color:'white', fontSize:18 }}>↩</button>
        </div>

        {/* Cards estatísticas */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:24 }}>
          {[
            { label:'Membros Ativos', valor:stats.ativos, cor:'#fff', sub:'irmãos regulares' },
            { label:'Pendentes', valor:stats.pendentes, cor:'#fbbf24', sub:'aguardando aprovação' },
            { label:'Aniversários', valor:stats.aniversarios, cor:'#34d399', sub:'em '+mesNome },
          ].map(c => (
            <div key={c.label} style={{ background:'rgba(255,255,255,0.1)', borderRadius:16, padding:'16px 12px', textAlign:'center', backdropFilter:'blur(10px)' }}>
              <div style={{ color:c.cor, fontSize:32, fontWeight:800 }}>{carregando ? '...' : c.valor}</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:0.5, marginTop:4 }}>{c.label}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Próximos Eventos */}
        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:20, marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <p style={{ margin:0, fontWeight:700, color:'#1a237e', fontSize:15 }}>📅 Eventos</p>
            <div style={{ display:'flex', gap:6 }}>
              {[{v:'proximos',l:'Próximos'},{v:'passados',l:'Passados'},{v:'todos',l:'Todos'}].map(f => (
                <button key={f.v} onClick={() => setFiltroEventos(f.v)}
                  style={{ padding:'4px 10px', borderRadius:6, border:'none', fontSize:12, fontWeight:700, cursor:'pointer',
                    background: filtroEventos===f.v ? '#1a237e' : '#f1f5f9',
                    color: filtroEventos===f.v ? '#fff' : '#64748b' }}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>
          {eventos.length === 0 ? (
            <p style={{ color:'#94a3b8', textAlign:'center', fontSize:14 }}>Nenhum evento {filtroEventos === 'proximos' ? 'próximo' : filtroEventos === 'passados' ? 'passado' : ''} encontrado.</p>
          ) : eventos.map(ev => (
            <div key={ev.id} onClick={() => navigate('/calendario')}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#f8fafc', borderRadius:10, marginBottom:8, cursor:'pointer', borderLeft:'4px solid #1a237e' }}>
              <span style={{ fontSize:20 }}>{TIPOS_EMOJI[ev.tipo] || '📌'}</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontWeight:700, color:'#1e293b', fontSize:14 }}>{ev.titulo}</p>
                <p style={{ margin:0, fontSize:12, color:'#64748b' }}>
                  {formatarData(ev.data_evento)}{ev.hora ? ' · '+ev.hora : ''}{ev.local ? ' · '+ev.local : ''}
                </p>
              </div>
            </div>
          ))}
          <button onClick={() => navigate('/calendario')}
            style={{ width:'100%', marginTop:8, padding:'10px', borderRadius:8, border:'none', background:'#1a237e', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            Ver calendário completo →
          </button>
        </div>

        {/* Ações rápidas */}
        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:20 }}>
          <p style={{ margin:'0 0 14px', color:'#64748b', fontSize:13, textAlign:'center' }}>Ações rápidas</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { icon:'👥', label:'Aprovações', rota:'/aprovacoes' },
              { icon:'➕', label:'Novo cadastro', rota:'/cadastro' },
              { icon:'👨‍⚖️', label:'Ver membros', rota:'/membros' },
              { icon:'📅', label:'Calendário', rota:'/calendario' },
              { icon:'⚙️', label:'Configurações', rota:'/configuracoes' },
              { icon:'✏️', label:'Meu perfil', rota:'/editar-perfil' },
            ].map(a => (
              <button key={a.rota} onClick={() => navigate(a.rota)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, cursor:'pointer', fontSize:14, color:'#1e293b', fontWeight:500 }}>
                <span style={{ fontSize:20 }}>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
