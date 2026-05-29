import { useEffect, useState } from 'react'
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

export default function Oficiais() {
  const navigate = useNavigate()
  const [cargos, setCargos] = useState([])
  const [gruposAbertos, setGruposAbertos] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { buscarCargos() }, [])

  async function buscarCargos() {
    const { data } = await supabase.from('cargos_historico')
      .select('cargo, associados(nome_completo)').eq('em_exercicio', true)
    setCargos(data || [])
    setCarregando(false)
  }

  function titular(nomeCargo) { return cargos.find(c => c.cargo === nomeCargo) }

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
          <button onClick={() => navigate('/membro')}
            style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:18, minWidth:44, minHeight:44 }}>←</button>
          <img src="/logo-acacia.png" alt="Logo" style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto 8px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:'bold', margin:0 }}>Quadro de Oficiais</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:14 }}>Acácia de Serra Negra Nº 271</p>
        </div>

        {/* Grupos colapsáveis */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {GRUPOS_CARGOS.map(grupo => {
            const cargosDoGrupo = grupo.id === 'outros'
              ? cargos.filter(c => !GRUPOS_CARGOS.slice(0,-1).flatMap(g => g.cargos).includes(c.cargo))
              : grupo.cargos.map(nome => cargos.find(c => c.cargo === nome)).filter(Boolean)
            if (cargosDoGrupo.length === 0) return null
            const aberto = gruposAbertos.includes(grupo.id)
            return (
              <div key={grupo.id} style={{ borderRadius:12, overflow:'hidden', border:'1px solid #cbd5e1' }}>
                <div onClick={() => setGruposAbertos(prev => prev.includes(grupo.id) ? prev.filter(x => x !== grupo.id) : [...prev, grupo.id])}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer', background: aberto ? '#1a237e' : '#f8fafc' }}>
                  <span style={{ flex:1, fontSize:15, fontWeight:700, color: aberto ? '#fff' : '#1a237e' }}>{grupo.label}</span>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background: aberto ? 'rgba(255,255,255,0.2)' : '#dbeafe', color: aberto ? '#fff' : '#1d4ed8', fontWeight:600 }}>{cargosDoGrupo.length} oficial{cargosDoGrupo.length>1?'is':''}</span>
                  <span style={{ color: aberto ? '#fff' : '#94a3b8', fontSize:16, display:'inline-block', transform: aberto ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▾</span>
                </div>
                {aberto && (
                  <div style={{ background:'#fff' }}>
                    {cargosDoGrupo.map((c, idx) => (
                      <div key={idx} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderTop:'1px solid #f1f5f9', borderLeft:'4px solid #1a237e' }}>
                        <div style={{ flex:1 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{c.cargo}</span>
                          <span style={{ fontSize:12, color:'#1a237e', fontWeight:500, marginLeft:8 }}>{c.associados?.nome_completo || '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
