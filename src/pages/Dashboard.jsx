import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ ativos: 0, pendentes: 0, aniversarios: [] })
  const [usuario, setUsuario] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { buscarDados() }, [])

  async function buscarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUsuario(user.email)
    const mesAtual = new Date().getMonth() + 1
    const [{ count: ativos }, { count: pendentes }, { data: aniversarios }] = await Promise.all([
      supabase.from('associados').select('*', { count: 'exact', head: true }).eq('status_cadastro', 'Aprovado'),
      supabase.from('associados').select('*', { count: 'exact', head: true }).eq('status_cadastro', 'Pendente'),
      supabase.from('associados').select('nome_completo, data_nascimento').eq('status_cadastro', 'Aprovado')
    ])
    const anivMes = (aniversarios || []).filter(a => a.data_nascimento && new Date(a.data_nascimento).getMonth() + 1 === mesAtual).map(a => ({ nome: a.nome_completo, dia: new Date(a.data_nascimento).getDate() })).sort((a, b) => a.dia - b.dia)
    setStats({ ativos: ativos || 0, pendentes: pendentes || 0, aniversarios: anivMes })
    setCarregando(false)
  }

  async function sair() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const nomeUsuario = usuario.split('@')[0].split('.')[0]
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const mesNome = meses[new Date().getMonth()]

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding:'24px 16px' }}>
      <div style={{ textAlign:'center', marginBottom:'8px' }}>
          <img src="/logo-acacia.png" alt="Logo Acácia" style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto' }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'500', fontSize:'16px' }}>
          {nomeUsuario[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ color:'white', fontSize:'16px', fontWeight:'500' }}>Olá, {nomeUsuario}</div>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px' }}>Administrador · Acácia de Serra Negra Nº 271</div>
        </div>
        <button onClick={sair} title="Sair" style={{ marginLeft:'auto', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', width:'36px', height:'36px', cursor:'pointer', color:'white', fontSize:'18px' }}>↩</button>
      </div>
      {carregando ? (
        <div style={{ textAlign:'center', color:'rgba(255,255,255,0.7)', padding:'40px' }}>Carregando...</div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
            {[
              { label:'MEMBROS ATIVOS', valor:stats.ativos, cor:'white', sub:'irmãos regulares' },
              { label:'PENDENTES', valor:stats.pendentes, cor:'#fbbf24', sub:'aguardando aprovação' },
              { label:'ANIVERSÁRIOS', valor:stats.aniversarios.length, cor:'#34d399', sub:'em '+mesNome },
            ].map(c => (
              <div key={c.label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:'12px', padding:'14px', border:'0.5px solid rgba(255,255,255,0.2)' }}>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'10px', marginBottom:'6px' }}>{c.label}</div>
                <div style={{ color:c.cor, fontSize:'28px', fontWeight:'500' }}>{c.valor}</div>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'10px', marginTop:'2px' }}>{c.sub}</div>
              </div>
            ))}
          </div>
          {stats.aniversarios.length > 0 && (
            <div style={{ background:'white', borderRadius:'16px', overflow:'hidden', marginBottom:'16px' }}>
              <div style={{ height:'4px', background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
              <div style={{ padding:'16px' }}>
                <div style={{ fontSize:'13px', fontWeight:'600', color:'#111827', marginBottom:'12px' }}>Aniversários de {mesNome}</div>
                {stats.aniversarios.map((a, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px', background:'#f9fafb', borderRadius:'8px', marginBottom:'8px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'600', color:'#1d4ed8' }}>{a.nome?.split(' ').map(n => n[0]).slice(0,2).join('')}</div>
                      <div style={{ fontSize:'13px', color:'#111827' }}>{a.nome}</div>
                    </div>
                    <div style={{ fontSize:'12px', background:'#dbeafe', color:'#1e40af', padding:'3px 8px', borderRadius:'6px' }}>{String(a.dia).padStart(2,'0')}/{String(new Date().getMonth()+1).padStart(2,'0')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ background:'white', borderRadius:'16px', overflow:'hidden' }}>
            <div style={{ height:'4px', background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
            <div style={{ padding:'16px' }}>
              <div style={{ fontSize:'13px', fontWeight:'600', color:'#111827', marginBottom:'12px' }}>Ações rápidas</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                {[
                  { icon:'👥', label:'Aprovações', bg:'#eff6ff', action: () => navigate('/aprovacoes') },
                  { icon:'➕', label:'Novo cadastro', bg:'#f0fdf4', action: () => navigate('/cadastro') },
                  { icon:'👥', label:'Ver membros', bg:'#eff6ff', action: () => navigate('/membros') },
                  { icon:'📅', label:'Calendário', bg:'#fdf4ff', action: () => navigate('/calendario') },
                  { icon:'⚙️', label:'Configurações', bg:'#f0f9ff', action: () => navigate('/configuracoes') },
                  { icon:'✏️', label:'Meu perfil', bg:'#f0f9ff', action: () => navigate('/editar-perfil') },
                ].map(b => (
                  <div key={b.label} onClick={b.action} style={{ padding:'12px', border:'0.5px solid #e5e7eb', borderRadius:'10px', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
                    <div style={{ width:'32px', height:'32px', background:b.bg, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>{b.icon}</div>
                    <div style={{ fontSize:'13px', color:'#111827' }}>{b.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
