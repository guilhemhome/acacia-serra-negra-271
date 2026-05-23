import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Calendario() {
  const navigate = useNavigate()
  const [aniversariantesMes, setAniversariantesMes] = useState([])
  const [proximosAniversarios, setProximosAniversarios] = useState([])
  const [aniversariantesDependentes, setAniversariantesDependentes] = useState([])
  const [eventos, setEventos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [copiado, setCopiado] = useState(null)
  const [templates, setTemplates] = useState({})

  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1
  const diaAtual = hoje.getDate()

  useEffect(() => {
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/'); return }
      const { data: tmpl } = await supabase.from('mensagens_templates').select('*')
      if (tmpl) {
        const map = {}
        tmpl.forEach(t => { map[t.chave] = t.mensagem })
        setTemplates(map)
      }
      const { data: assocs } = await supabase.from('associados').select('id, nome_completo, data_nascimento').eq('status_cadastro', 'aprovado').not('data_nascimento', 'is', null)
      if (assocs) {
        const doMes = []
        const proximos = []
        assocs.forEach(a => {
          const [ano, mes, dia] = a.data_nascimento.split('T')[0].split('-').map(Number)
          const idade = hoje.getFullYear() - ano
          if (mes === mesAtual) doMes.push({ ...a, dia, mes, idade })
          const anivEsteAno = new Date(hoje.getFullYear(), mes - 1, dia)
          if (anivEsteAno < hoje) anivEsteAno.setFullYear(hoje.getFullYear() + 1)
          const diff = Math.ceil((anivEsteAno - hoje) / (1000 * 60 * 60 * 24))
          if (diff <= 30 && diff > 0) proximos.push({ ...a, dia, mes, idade, diff })
        })
        doMes.sort((a, b) => a.dia - b.dia)
        proximos.sort((a, b) => a.diff - b.diff)
        setAniversariantesMes(doMes)
        setProximosAniversarios(proximos)
      }
      const { data: fams } = await supabase.from('familiares').select('*, associados(nome_completo)').not('data_nascimento', 'is', null)
      if (fams) {
        const depMes = fams.filter(f => parseInt(f.data_nascimento.split('T')[0].split('-')[1]) === mesAtual)
          .map(f => ({ ...f, dia: parseInt(f.data_nascimento.split('T')[0].split('-')[2]) }))
          .sort((a, b) => a.dia - b.dia)
        setAniversariantesDependentes(depMes)
      }
      const { data: evts } = await supabase.from('eventos').select('*').gte('data_evento', hoje.toISOString().split('T')[0]).order('data_evento').limit(10)
      if (evts) setEventos(evts)
      setCarregando(false)
    }
    carregar()
  }, [])

  function fmt(dia, mes) { return `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}` }
  function isHoje(dia, mes) { return dia === diaAtual && mes === mesAtual }

  function copiarWhatsApp(irmao) {
    const msg = (templates['aniversario_irmao_whatsapp'] || '').replace('{nome}', irmao.nome_completo)
    navigator.clipboard.writeText(msg)
    setCopiado(irmao.id)
    setTimeout(() => setCopiado(null), 3000)
  }

  function copiarWhatsAppDep(dep) {
    const msg = (templates['aniversario_dependente_whatsapp'] || '')
      .replace('{nome_irmao}', dep.associados?.nome_completo || '')
      .replace('{parentesco}', dep.parentesco || '')
      .replace('{nome_dependente}', dep.nome)
    navigator.clipboard.writeText(msg)
    setCopiado(dep.id)
    setTimeout(() => setCopiado(null), 3000)
  }

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding:'24px 16px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <div style={{ position:'relative', textAlign:'center', marginBottom:24 }}>
          <button onClick={() => navigate('/dashboard')} style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:18 }}>←</button>
          <img src="/logo-acacia.png" alt="Logo" style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto 8px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:'bold', margin:0 }}>Calendário</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:14 }}>Acácia de Serra Negra Nº 271</p>
        </div>
        {carregando ? <p style={{ textAlign:'center', color:'#fff' }}>Carregando...</p> : (
          <>
            <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:16 }}>
              <div style={{ height:4, background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
              <div style={{ padding:24 }}>
                <p style={{ margin:'0 0 16px', fontWeight:700, color:'#4f46e5', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>🎂 Aniversariantes de {MESES[mesAtual-1]}</p>
                {aniversariantesMes.length === 0 ? <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhum aniversariante este mês.</p>
                : aniversariantesMes.map(a => (
                  <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background: isHoje(a.dia, a.mes) ? '#fef9c3' : '#f8fafc', borderRadius:10, marginBottom:8, border: isHoje(a.dia, a.mes) ? '2px solid #d97706' : '1px solid #e2e8f0' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700 }}>{a.nome_completo.charAt(0)}</div>
                      <div>
                        <p style={{ margin:0, fontWeight:600, color:'#1e293b', fontSize:14 }}>{isHoje(a.dia, a.mes) && '🎉 '}{a.nome_completo}</p>
                        <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{fmt(a.dia, a.mes)} — {a.idade} anos</p>
                      </div>
                    </div>
                    <button onClick={() => copiarWhatsApp(a)} style={{ padding:'8px 12px', borderRadius:8, border:'none', background: copiado === a.id ? '#16a34a' : '#25d366', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                      {copiado === a.id ? '✅ Copiado!' : '📋 WhatsApp'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {aniversariantesDependentes.length > 0 && (
              <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:16 }}>
                <div style={{ height:4, background:'linear-gradient(90deg,#16a34a,#15803d)' }} />
                <div style={{ padding:24 }}>
                  <p style={{ margin:'0 0 16px', fontWeight:700, color:'#16a34a', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>👨‍👩‍👧 Familiares Aniversariantes</p>
                  {aniversariantesDependentes.map(f => (
                    <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'#f8fafc', borderRadius:10, marginBottom:8, border:'1px solid #e2e8f0' }}>
                      <div>
                        <p style={{ margin:0, fontWeight:600, color:'#1e293b', fontSize:14 }}>{f.nome}</p>
                        <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{f.parentesco} do Ir∴ {f.associados?.nome_completo} — {fmt(f.dia, mesAtual)}</p>
                      </div>
                      <button onClick={() => copiarWhatsAppDep(f)} style={{ padding:'8px 12px', borderRadius:8, border:'none', background: copiado === f.id ? '#16a34a' : '#25d366', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                        {copiado === f.id ? '✅ Copiado!' : '📋 WhatsApp'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {proximosAniversarios.length > 0 && (
              <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:16 }}>
                <div style={{ height:4, background:'linear-gradient(90deg,#d97706,#b45309)' }} />
                <div style={{ padding:24 }}>
                  <p style={{ margin:'0 0 16px', fontWeight:700, color:'#d97706', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>📅 Próximos 30 Dias</p>
                  {proximosAniversarios.map(a => (
                    <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'#f8fafc', borderRadius:10, marginBottom:8, border:'1px solid #e2e8f0' }}>
                      <div>
                        <p style={{ margin:0, fontWeight:600, color:'#1e293b', fontSize:14 }}>{a.nome_completo}</p>
                        <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{fmt(a.dia, a.mes)} — em {a.diff} dias</p>
                      </div>
                      <button onClick={() => copiarWhatsApp(a)} style={{ padding:'8px 12px', borderRadius:8, border:'none', background: copiado === a.id ? '#16a34a' : '#25d366', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                        {copiado === a.id ? '✅ Copiado!' : '📋 WhatsApp'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:16 }}>
              <div style={{ height:4, background:'linear-gradient(90deg,#dc2626,#b91c1c)' }} />
              <div style={{ padding:24 }}>
                <p style={{ margin:'0 0 16px', fontWeight:700, color:'#dc2626', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>📆 Próximos Eventos</p>
                {eventos.length === 0 ? <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhum evento cadastrado.</p>
                : eventos.map(e => (
                  <div key={e.id} style={{ padding:'12px 14px', background:'#f8fafc', borderRadius:10, marginBottom:8, border:'1px solid #e2e8f0' }}>
                    <p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{e.titulo}</p>
                    <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{e.data_evento.split('-').reverse().join('/')}</p>
                    {e.descricao && <p style={{ margin:'4px 0 0', fontSize:13, color:'#475569' }}>{e.descricao}</p>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
