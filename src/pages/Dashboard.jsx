import { useEffect, useState } from 'react'
import { DateInput } from '../components/DateInput'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ ativos:0, pendentes:0 })
  const [eventos, setEventos] = useState([])
  const [aniversarios, setAniversarios] = useState([])
  const [usuario, setUsuario] = useState({ email:'', perfil:'membro', nome:'' })
  const [grauUsuario, setGrauUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  function hojeStr() { return new Date().toISOString().split('T')[0] }
  function daqui30() {
    const d = new Date(); d.setDate(d.getDate()+30)
    return d.toISOString().split('T')[0]
  }

  const [dataInicio, setDataInicio] = useState(hojeStr)
  const [dataFim, setDataFim] = useState(daqui30)

  useEffect(() => { buscarDados() }, [])
  useEffect(() => { if (grauUsuario !== null) buscarEventosEAniv() }, [dataInicio, dataFim, grauUsuario, usuario.perfil])

  async function buscarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: p } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', user.id).single()
    console.log('PERFIL DO BANCO:', p, 'user_id:', user.id)
    const perfil = p?.perfil || 'membro'
    const { data: assoc } = await supabase.from('associados')
      .select('id, nome_completo, grau:historico_graus(grau)')
      .eq('user_id', user.id).single()
    const nome = assoc?.nome_completo || user.email.split('@')[0]
    const graus = assoc?.grau || []
    const temMestre = graus.some(g => g.grau === 'mestre')
    const temCompanheiro = graus.some(g => g.grau === 'companheiro')
    setGrauUsuario(temMestre ? 'mestre' : temCompanheiro ? 'companheiro' : 'aprendiz')
    setUsuario({ email: user.email, perfil, nome })
    const [{ count: ativos }, { count: pendentes }] = await Promise.all([
      supabase.from('associados').select('*',{count:'exact',head:true}).eq('status_cadastro','aprovado'),
      supabase.from('associados').select('*',{count:'exact',head:true}).eq('status_cadastro','pendente'),
    ])
    setStats({ ativos: ativos||0, pendentes: pendentes||0 })
    setCarregando(false)
  }

  async function buscarEventosEAniv() {
    if (!dataInicio || !dataFim) return

    // Eventos no período
    let query = supabase.from('eventos').select('*').eq('status','agendado')
      .gte('data_evento', dataInicio).lte('data_evento', dataFim).order('data_evento')
    const { data: evData } = await query
    const filtrados = (evData||[]).filter(ev => {
      if (['ADM','Venerável Mestre','Chanceler','Secretário'].includes(usuario.perfil)) return true
      if (ev.visibilidade === 'todos') return true
      if (ev.visibilidade === 'mestres' && grauUsuario === 'mestre') return true
      if (ev.visibilidade === 'companheiros' && (grauUsuario === 'mestre' || grauUsuario === 'companheiro')) return true
      return false
    })
    setEventos(filtrados)

    // Aniversários no período — comparar só mês e dia
    const [anoI, mesI, diaI] = dataInicio.split('-').map(Number)
    const [anoF, mesF, diaF] = dataFim.split('-').map(Number)
    const { data: irmãos } = await supabase.from('associados')
      .select('nome_completo, data_nascimento').eq('status_cadastro','aprovado')
    const { data: fams } = await supabase.from('familiares')
      .select('nome, data_nascimento, parentesco, associado_id, associados(nome_completo)')
      .not('data_nascimento','is',null)

    function dentroDoIntervalo(dataNasc) {
      if (!dataNasc) return false
      const [,mesN, diaN] = dataNasc.split('T')[0].split('-').map(Number)
      // Verificar para cada ano no período (caso período cruze anos)
      for (let ano = anoI; ano <= anoF; ano++) {
        const dataAniv = new Date(ano, mesN-1, diaN)
        const inicio = new Date(anoI, mesI-1, diaI)
        const fim = new Date(anoF, mesF-1, diaF)
        if (dataAniv >= inicio && dataAniv <= fim) return true
      }
      return false
    }

    function diaAniv(dataNasc) {
      if (!dataNasc) return ''
      const [,m,d] = dataNasc.split('T')[0].split('-')
      return d+'/'+m
    }

    const listAniv = []
    ;(irmãos||[]).forEach(a => {
      if (dentroDoIntervalo(a.data_nascimento))
        listAniv.push({ nome: a.nome_completo, detalhe: 'Irmão', dia: diaAniv(a.data_nascimento), data_nascimento: a.data_nascimento, tel: (a.tel_celular||'').replace(/\D/g,''), tipo: 'irmao' })
    })
    ;(fams||[]).forEach(f => {
      if (dentroDoIntervalo(f.data_nascimento))
        listAniv.push({ nome: f.nome, detalhe: f.parentesco+' do Ir. '+(f.associados?.nome_completo||''), dia: diaAniv(f.data_nascimento), data_nascimento: f.data_nascimento, tel: (f.associados?.tel_celular||'').replace(/\D/g,''), nomeIrmao: f.associados?.nome_completo||'', parentesco: f.parentesco||'', tipo: 'familiar' })
    })
    listAniv.sort((a,b) => {
      const [,mA,dA] = (a.data_nascimento||'').split('T')[0].split('-').map(Number)
      const [,mB,dB] = (b.data_nascimento||'').split('T')[0].split('-').map(Number)
      return mA !== mB ? mA-mB : dA-dB
    })
    setAniversarios(listAniv)
  }

  const TIPOS_EMOJI = {
    sessao_ordinaria:'⚒️', sessao_magna:'🏛️', iniciacao:'⭐',
    grande_loja:'📜', festa:'🎉', diretoria:'📋', visita:'🤝', outro:'📌'
  }

  const primeiroNome = usuario.nome.split(' ')[0] || usuario.email.split('@')[0].split('.')[0]
  const mesNome = new Date().toLocaleString('pt-BR',{month:'long'})

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
              {usuario.perfil === 'ADM' ? 'Administrador' : usuario.perfil === 'Venerável Mestre' ? 'Venerável Mestre' : usuario.perfil === 'Chanceler' ? 'Chanceler' : usuario.perfil === 'Secretário' ? 'Secretário' : 'Membro'} · Acácia de Serra Negra Nº 271
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
            { label:'Aniversários', valor:aniversarios.length, cor:'#34d399', sub:'no período' },
          ].map(c => (
            <div key={c.label} style={{ background:'rgba(255,255,255,0.1)', borderRadius:16, padding:'16px 12px', textAlign:'center' }}>
              <div style={{ color:c.cor, fontSize:32, fontWeight:800 }}>{carregando ? '...' : c.valor}</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:10, textTransform:'uppercase', letterSpacing:0.5, marginTop:4 }}>{c.label}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Filtro de período */}
        <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13, whiteSpace:'nowrap' }}>📆 Período:</span>
          <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.7)', whiteSpace:'nowrap' }}>De:</label>
            <DateInput value={dataInicio} onChange={v => setDataInicio(v)}
              style={{ flex:1, padding:'6px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', fontSize:12, background:'rgba(255,255,255,0.15)', color:'#fff' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.7)', whiteSpace:'nowrap' }}>Até:</label>
            <DateInput value={dataFim} onChange={v => setDataFim(v)}
              style={{ flex:1, padding:'6px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.4)', fontSize:12, background:'rgba(255,255,255,0.15)', color:'#fff' }} />
          </div>
        </div>

        {/* Eventos no período */}
        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:20, marginBottom:16 }}>
          <p style={{ margin:'0 0 12px', fontWeight:700, color:'#1a237e', fontSize:15 }}>📅 Eventos no Período</p>
          {eventos.length === 0 ? (
            <p style={{ color:'#94a3b8', textAlign:'center', fontSize:14 }}>Nenhum evento neste período.</p>
          ) : eventos.map(ev => (
            <div key={ev.id} onClick={() => navigate('/calendario')}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#f8fafc', borderRadius:10, marginBottom:8, cursor:'pointer', borderLeft:'4px solid #1a237e' }}>
              <span style={{ fontSize:20 }}>{TIPOS_EMOJI[ev.tipo]||'📌'}</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontWeight:700, color:'#1e293b', fontSize:14 }}>{ev.titulo}</p>
                <p style={{ margin:0, fontSize:12, color:'#64748b' }}>
                  {ev.data_evento ? ev.data_evento.split('-').reverse().join('/') : ''}{ev.hora ? ' · '+ev.hora : ''}{ev.local ? ' · '+ev.local : ''}
                </p>
              </div>
            </div>
          ))}
          <button onClick={() => navigate('/calendario')}
            style={{ width:'100%', marginTop:8, padding:'10px', borderRadius:8, border:'none', background:'#1a237e', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            Ver calendário completo →
          </button>
        </div>

        {/* Aniversários no período */}
        {['ADM','Venerável Mestre','Chanceler','Secretário'].includes(usuario.perfil) && (
        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:20, marginBottom:16 }}>
          <p style={{ margin:'0 0 12px', fontWeight:700, color:'#1a237e', fontSize:15 }}>🎂 Aniversários no Período</p>
          {aniversarios.length === 0 ? (
            <p style={{ color:'#94a3b8', textAlign:'center', fontSize:14 }}>Nenhum aniversário neste período.</p>
          ) : aniversarios.map((a,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 14px', background:'#f8fafc', borderRadius:10, marginBottom:6, gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                <span>🎂</span>
                <div style={{ minWidth:0 }}>
                  <span style={{ fontWeight:700, color:'#1e293b', fontSize:13 }}>{a.nome}</span>
                  <span style={{ fontSize:12, color:'#94a3b8', marginLeft:6 }}>· {a.detalhe}</span>
                </div>
              </div>
              <span style={{ fontWeight:700, color:'#1a237e', fontSize:13, whiteSpace:'nowrap' }}>{a.dia}</span>
              {a.tel && (
                <a href={`https://wa.me/55${a.tel}?text=${encodeURIComponent(
                  a.tipo==='irmao'
                    ? `🌿 A Loja Maçônica Acácia de Serra Negra Nº 271 saúda com fraternidade o Ir∴ ${a.nome} que hoje completa mais um ano de vida. Que o G∴A∴D∴U∴ ilumine sempre sua jornada! 🎂`
                    : `🌿 A Loja Maçônica Acácia de Serra Negra Nº 271 saúda o Ir∴ ${a.nomeIrmao} pelo aniversário de ${a.parentesco} ${a.nome}! Felicidades a toda a família! 🎂`
                )}`}
                  target="_blank" rel="noreferrer"
                  style={{ background:'#25d366', color:'#fff', borderRadius:8, padding:'5px 10px', fontSize:11, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap', minWidth:44, minHeight:44, display:'flex', alignItems:'center', flexShrink:0 }}>
                  📱 WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
        )}

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
