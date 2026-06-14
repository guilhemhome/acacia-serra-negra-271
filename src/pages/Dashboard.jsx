import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ ativos: 0, pendentes: 0 })
  const [proximoEvento, setProximoEvento] = useState(null)
  const [resumoPresencas, setResumoPresencas] = useState(null)
  const [aniversarios, setAniversarios] = useState([])
  const [anivHoje, setAnivHoje] = useState(0)
  const [usuario, setUsuario] = useState({ email: '', perfil: 'Membro', nome: '' })
  const [grauUsuario, setGrauUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [templates, setTemplates] = useState({})

  function hojeStr() { return new Date().toISOString().split('T')[0] }
  function daqui30() { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0] }

  function diasParaData(dataStr) {
    if (!dataStr) return null
    const [a, m, d] = dataStr.split('T')[0].split('-').map(Number)
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
    return Math.ceil((new Date(a, m - 1, d) - hoje) / 86400000)
  }

  const CACHE_KEY = 'dashboard_cache'
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  useEffect(() => { buscarTudo() }, [])

  async function buscarTudo() {
    console.log('buscarTudo iniciado')
    // Verificar cache
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const { ts, dados } = JSON.parse(raw)
        if (Date.now() - ts < CACHE_TTL) {
          const { usuario, grau, stats, proximoEvento, templates, aniversarios, anivHoje } = dados
          setUsuario(usuario)
          setGrauUsuario(grau)
          setStats(stats)
          setProximoEvento(proximoEvento)
          setTemplates(templates)
          setAniversarios(aniversarios)
          setAnivHoje(anivHoje)
          setCarregando(false)
          // Buscar presencas sempre ao vivo (nao cachear)
          if (proximoEvento) {
            supabase.from('eventos_presencas')
              .select('resposta').eq('evento_id', proximoEvento.id)
              .then(({ data: pres }) => {
                const confirmados = (pres||[]).filter(p => p.resposta === 'presente').length
                const ausentes = (pres||[]).filter(p => p.resposta === 'ausente').length
                setResumoPresencas({ confirmados, ausentes, total: stats.ativos || 0 })
              })
          }
          return
        }
      }
    } catch(e) {}

    let user
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      user = u
    } catch(e) {}
    if (!user) { setCarregando(false); return }

    try {
    // Paralelizar todas as queries independentes
    const [
      { data: p },
      { data: assoc },
      { count: ativos },
      { count: pendentes },
      { data: evs },
      { data: tmpl },
      { data: irmaos },
      { data: fams }
    ] = await Promise.all([
      supabase.from('perfis_acesso').select('perfil').eq('user_id', user.id).maybeSingle(),
      supabase.from('associados').select('nome_completo, id_acacia, email, grau:historico_graus(grau)').eq('user_id', user.id).single(),
      supabase.from('associados').select('*', { count: 'exact', head: true }).eq('status_cadastro', 'aprovado').eq('situacao', 'ativo'),
      supabase.from('associados').select('*', { count: 'exact', head: true }).eq('status_cadastro', 'pendente'),
      supabase.from('eventos').select('*').eq('status', 'ativo').gte('data_evento', hojeStr()).order('data_evento').limit(10),
      supabase.from('mensagens_templates').select('tipo, conteudo').in('tipo', ['aniversario_irmao_whatsapp', 'aniversario_dependente_whatsapp']),
      supabase.from('associados').select('nome_completo, data_nascimento, tel_celular').eq('status_cadastro', 'aprovado').eq('situacao', 'ativo'),
      supabase.from('familiares').select('nome, data_nascimento, parentesco, associados(nome_completo, tel_celular)').not('data_nascimento', 'is', null),
    ])

    const perfil = p?.perfil || 'Membro'
    const nome = assoc?.nome_completo || user.email.split('@')[0]
    const graus = assoc?.grau || []
    const temMestre = graus.some(g => g.grau === 'mestre')
    const temCompanheiro = graus.some(g => g.grau === 'companheiro')
    const grau = temMestre ? 'mestre' : temCompanheiro ? 'companheiro' : 'aprendiz'
    const usuarioObj = { email: user.email, perfil, nome, id_acacia: assoc?.id_acacia || '', email_assoc: assoc?.email || user.email }
    setGrauUsuario(grau)
    setUsuario(usuarioObj)
    setStats({ ativos: ativos || 0, pendentes: pendentes || 0 })

    const filtEvs = (evs || []).filter(ev => {
      if (['ADM', 'Venerável Mestre', 'Administrativo', 'Total'].includes(perfil)) return true
      if (ev.visibilidade === 'todos') return true
      if (ev.visibilidade === 'mestres' && grau === 'mestre') return true
      if (ev.visibilidade === 'companheiros' && (grau === 'mestre' || grau === 'companheiro')) return true
      return false
    })
    const proxEvento = filtEvs[0] || null
    setProximoEvento(proxEvento)

    // Buscar resumo de presencas do proximo evento
    if (proxEvento) {
      const { data: pres } = await supabase.from('eventos_presencas')
        .select('resposta, associados(nome_completo)')
        .eq('evento_id', proxEvento.id)
      const confirmados = (pres||[]).filter(p => p.resposta === 'presente').length
      const ausentes = (pres||[]).filter(p => p.resposta === 'ausente').length
      setResumoPresencas({ confirmados, ausentes, total: ativos || 0 })
    }

    const tObj = {}
    ;(tmpl || []).forEach(t => { tObj[t.tipo] = t.conteudo })
    setTemplates(tObj)

    // Processar aniversários com os dados já buscados
    const anivData = processarAniversarios(irmaos || [], fams || [])
    setAnivHoje(anivData.anivHoje)
    setAniversarios(anivData.lista)

    } catch(queryErr) {
      console.error('Erro ao carregar dashboard:', queryErr)
      alert('Erro: ' + queryErr.message)
      setCarregando(false)
    } finally {
      setCarregando(false)
    }

    // Salvar cache
    try { // inner try para cache
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        dados: { usuario: usuarioObj, grau, stats: { ativos: ativos || 0, pendentes: pendentes || 0 }, proximoEvento: proxEvento, templates: tObj, aniversarios: anivData.lista, anivHoje: anivData.anivHoje }
      }))
    } catch(e) {}

    setCarregando(false)
  }

  function processarAniversarios(irmaos, fams) {
    const hoje = hojeStr()
    const fim = daqui30()
    const [anoI, mesI, diaI] = hoje.split('-').map(Number)
    const [anoF, mesF, diaF] = fim.split('-').map(Number)

    function dentroIntervalo(dataNasc) {
      if (!dataNasc) return false
      const [, mesN, diaN] = dataNasc.split('T')[0].split('-').map(Number)
      for (let ano = anoI; ano <= anoF; ano++) {
        const aniv = new Date(ano, mesN - 1, diaN)
        if (aniv >= new Date(anoI, mesI - 1, diaI) && aniv <= new Date(anoF, mesF - 1, diaF)) return true
      }
      return false
    }
    function diasParaAniv(dataNasc) {
      if (!dataNasc) return 999
      const hj = new Date(); hj.setHours(0, 0, 0, 0)
      const [, mesN, diaN] = dataNasc.split('T')[0].split('-').map(Number)
      const anoAtual = hj.getFullYear()
      let aniv = new Date(anoAtual, mesN - 1, diaN)
      if (aniv < hj) aniv = new Date(anoAtual + 1, mesN - 1, diaN)
      return Math.ceil((aniv - hj) / 86400000)
    }
    function diaAniv(dataNasc) {
      if (!dataNasc) return ''
      const [, m, d] = dataNasc.split('T')[0].split('-')
      return d + '/' + m
    }
    const list = []
    irmaos.forEach(a => {
      if (dentroIntervalo(a.data_nascimento))
        list.push({ nome: a.nome_completo, detalhe: 'Nascimento', dia: diaAniv(a.data_nascimento), data_nascimento: a.data_nascimento, tel: (a.tel_celular || '').replace(/D/g, ''), tipo: 'irmao', diasRestantes: diasParaAniv(a.data_nascimento) })
    })
    fams.forEach(f => {
      if (dentroIntervalo(f.data_nascimento)) {
        const assocF = Array.isArray(f.associados) ? f.associados[0] : f.associados
        list.push({ nome: f.nome, detalhe: f.parentesco, dia: diaAniv(f.data_nascimento), data_nascimento: f.data_nascimento, tel: (assocF?.tel_celular || '').replace(/D/g, ''), nomeIrmao: assocF?.nome_completo || '', parentesco: f.parentesco || '', tipo: 'familiar', diasRestantes: diasParaAniv(f.data_nascimento) })
      }
    })
    list.sort((a, b) => a.diasRestantes - b.diasRestantes)
    return { lista: list.slice(0, 5), anivHoje: list.filter(a => a.diasRestantes === 0).length }
  }



  function msgWhatsApp(a) {
    const loja = 'Acácia de Serra Negra Nº 271'
    if (a.tipo === 'irmao') {
      const t = templates['aniversario_irmao_whatsapp']
      return t ? t.replace('{nome}', a.nome).replace('{loja}', loja)
        : `🌿 A Loja Maçônica ${loja} saúda com fraternidade o Ir∴ ${a.nome} que hoje completa mais um ano de vida. Que o G∴A∴D∴U∴ ilumine sempre sua jornada! 🎂`
    }
    const t = templates['aniversario_dependente_whatsapp']
    return t ? t.replace('{nome_irmao}', a.nomeIrmao).replace('{parentesco}', a.parentesco).replace('{nome_dependente}', a.nome).replace('{loja}', loja)
      : `🌿 A Loja Maçônica ${loja} saúda o Ir∴ ${a.nomeIrmao} pelo aniversário de ${a.parentesco} ${a.nome}! Felicidades a toda a família! 🎂`
  }

  const primeiroNome = usuario.nome.split(' ')[0] || usuario.email.split('@')[0].split('.')[0]
  const labelPerfil = { 'ADM': 'Administrador', 'Venerável Mestre': 'Venerável Mestre', 'Administrativo': 'Administrativo', 'Financeiro': 'Tesoureiro', 'Hospitalaria': 'Hospitaleiro', 'Total': 'Acesso Total' }[usuario.perfil] || 'Membro'
  const podeVerAniv = ['ADM', 'Venerável Mestre', 'Administrativo', 'Total'].includes(usuario.perfil)
  const diasEvento = proximoEvento ? diasParaData(proximoEvento.data_evento) : null
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const TIPOS = { sessao_ordinaria: 'Sessão Ordinária', sessao_magna: 'Sessão Magna', sessao_administrativa: 'Sessão Administrativa', evento_social: 'Evento Social' }

  const card = { background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 14px', cursor: 'pointer', position: 'relative', border: 'none', textAlign: 'left', width: '100%' }
  const sec = { color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px', fontWeight: 500 }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding: '24px 16px 40px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: 24 }}>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/') }}
            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 12px', cursor: 'pointer', fontSize: 16, minWidth: 44, minHeight: 44 }}>↩</button>
          <img src="/logo-acacia.png" alt="Logo" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', objectFit: 'cover', display: 'block', margin: '0 auto 8px' }} />
          <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 500, margin: '0 0 2px' }}>Olá, {usuario.nome}</h1>
          {usuario.id_acacia && <p style={{ color:'rgba(255,255,255,0.75)', fontSize:12, margin:'0 0 1px' }}>Nº {usuario.id_acacia}</p>}
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:11, margin:0 }}>{usuario.email_assoc || usuario.email}</p>
          <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 13 }}>{labelPerfil} · Acácia de Serra Negra Nº 271</p>
        </div>

        {/* Cards visão geral */}
        <p style={sec}>Visão geral</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>

          <button onClick={() => navigate('/membros')} style={card}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>Membros ativos</div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 500, lineHeight: 1 }}>{carregando ? '…' : stats.ativos}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>irmãos regulares</div>
          </button>

          <button onClick={() => navigate('/aprovacoes')} style={card}>
            {stats.pendentes > 0 && (
              <span style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '2px 7px' }}>{stats.pendentes}</span>
            )}
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>Aprovações</div>
            <div style={{ color: stats.pendentes > 0 ? '#fbbf24' : '#fff', fontSize: 28, fontWeight: 500, lineHeight: 1 }}>{carregando ? '…' : stats.pendentes}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>pendentes</div>
          </button>

          {podeVerAniv && (
            <button onClick={() => navigate('/calendario?aba=aniversarios')} style={card}>
              {anivHoje > 0 && (
                <span style={{ position: 'absolute', top: 10, right: 10, background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '2px 7px' }}>hoje</span>
              )}
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>Aniversários</div>
              <div style={{ color: anivHoje > 0 ? '#34d399' : '#fff', fontSize: 28, fontWeight: 500, lineHeight: 1 }}>{carregando ? '…' : aniversarios.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>próximos 30 dias</div>
            </button>
          )}

          <button onClick={() => navigate('/calendario')} style={card}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>Próx. sessão</div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 500, lineHeight: 1 }}>{carregando ? '…' : diasEvento !== null ? diasEvento : '—'}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>{diasEvento === 0 ? 'hoje!' : diasEvento === 1 ? 'amanhã' : 'dias restantes'}</div>
          </button>

        </div>

        {/* Próximo evento compacto */}
        {proximoEvento && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ ...sec, margin: 0 }}>Próximo evento</p>
              <button onClick={() => navigate('/calendario')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', padding: 0 }}>Ver calendário →</button>
            </div>
            <div onClick={() => navigate('/calendario')} style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
              <div style={{ textAlign: 'center', minWidth: 44, background: '#f1f5f9', borderRadius: 10, padding: '8px 10px' }}>
                <div style={{ fontSize: 20, fontWeight: 500, color: '#1a237e', lineHeight: 1 }}>
                  {proximoEvento.data_evento.split('T')[0].split('-')[2]}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {MESES[parseInt(proximoEvento.data_evento.split('T')[0].split('-')[1]) - 1]}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{TIPOS[proximoEvento.tipo] || proximoEvento.titulo}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proximoEvento.hora || '20:00'}{proximoEvento.local ? ' · ' + proximoEvento.local : ''}</p>
              </div>
              <span style={{ fontSize: 11, color: '#1a237e', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {diasEvento === 0 ? 'hoje' : diasEvento === 1 ? 'amanhã' : `em ${diasEvento} dias`}
              </span>
            </div>
          </>
        )}



        {/* Resumo presencas proximo evento */}
        {proximoEvento && resumoPresencas && (
          <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:16, padding:'14px 16px', marginBottom:20 }}>
            <p style={{ margin:'0 0 10px', fontSize:12, fontWeight:700, color:'#1a237e', textTransform:'uppercase', letterSpacing:'0.05em' }}>Presenças — {proximoEvento.titulo}</p>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1, textAlign:'center', background:'#e8f5e9', borderRadius:10, padding:'10px 4px' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#2e7d32' }}>{resumoPresencas.confirmados}</div>
                <div style={{ fontSize:11, color:'#2e7d32' }}>Confirmados</div>
              </div>
              <div style={{ flex:1, textAlign:'center', background:'#ffebee', borderRadius:10, padding:'10px 4px' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#c62828' }}>{resumoPresencas.ausentes}</div>
                <div style={{ fontSize:11, color:'#c62828' }}>Ausentes</div>
              </div>
              <div style={{ flex:1, textAlign:'center', background:'#f1f5f9', borderRadius:10, padding:'10px 4px' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#64748b' }}>{resumoPresencas.total - resumoPresencas.confirmados - resumoPresencas.ausentes}</div>
                <div style={{ fontSize:11, color:'#64748b' }}>Pendentes</div>
              </div>
            </div>
            <button onClick={() => navigate('/calendario')}
              style={{ width:'100%', marginTop:10, padding:'8px', borderRadius:8, border:'none', background:'#1a237e', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              Ver lista completa →
            </button>
          </div>
        )}

        {/* Ações rápidas */}
        <p style={sec}>Ações rápidas</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '👥', label: 'Aprovações', rota: '/aprovacoes' },
            { icon: '➕', label: 'Novo cadastro', rota: '/cadastro' },
            { icon: '👨‍⚖️', label: 'Ver membros', rota: '/membros' },
            { icon: '📅', label: 'Calendário', rota: '/calendario' },
            { icon: '🎂', label: 'Aniversários', rota: '/calendario?aba=aniversarios' },
            { icon: '🗓️', label: 'Eventos', rota: '/calendario' },
            { icon: '⚙️', label: 'Configurações', rota: '/configuracoes' },
            { icon: '✏️', label: 'Meu perfil', rota: '/editar-perfil' },
          ].map(a => (
            <button key={a.rota} onClick={() => navigate(a.rota)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', fontSize: 14, color: '#1e293b', fontWeight: 500, minHeight: 44 }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
