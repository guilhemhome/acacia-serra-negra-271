import { useEffect, useState } from 'react'
import MonitorContexto from '../components/MonitorContexto'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const Input = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)}
      style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box', outline:'none' }} />
  </div>
)

export default function Configuracoes() {
  const navigate = useNavigate()
  const [config, setConfig] = useState({
    nome_loja: 'Acácia de Serra Negra',
    numero_loja: '271',
    potencia: 'GLESP',
    rito: 'REAA',
    data_fundacao: '1983-11-15',
    cidade: 'Serra Negra',
    estado: 'SP',
  })
  const [stats, setStats] = useState({ total:0, aprovados:0, pendentes:0, rejeitados:0 })
  const [perfis, setPerfis] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/'); return }

      // Carregar configurações
      const { data: cfgs } = await supabase.from('configuracoes').select('*')
      if (cfgs && cfgs.length > 0) {
        const map = {}
        cfgs.forEach(c => { map[c.chave] = c.valor })
        setConfig(prev => ({ ...prev, ...map }))
      }

      // Carregar estatísticas
      const { data: assocs } = await supabase.from('associados').select('status_cadastro')
      if (assocs) {
        setStats({
          total: assocs.length,
          aprovados: assocs.filter(a => a.status_cadastro === 'aprovado').length,
          pendentes: assocs.filter(a => a.status_cadastro === 'pendente').length,
          rejeitados: assocs.filter(a => a.status_cadastro === 'rejeitado').length,
        })
      }

      // Carregar perfis de acesso — todos os usuários com login
      const { data: ps } = await supabase.from('perfis_acesso').select('*')
      if (ps && ps.length > 0) {
        const { data: assocs } = await supabase
          .from('associados')
          .select('id, user_id, nome_completo, email, cpf')
          .in('user_id', ps.map(p => p.user_id))
        const perfisComNome = ps.map(p => ({
          ...p,
          associados: assocs?.find(a => a.user_id === p.user_id) || null
        }))
        perfisComNome.sort((a, b) => (a.associados?.nome_completo || '').localeCompare(b.associados?.nome_completo || ''))
        setPerfis(perfisComNome)
      }
    }
    carregar()
  }, [])

  function msg(texto) { setMensagem(texto); setTimeout(() => setMensagem(''), 3000) }

  async function salvarConfig() {
    setSalvando(true)
    const entradas = Object.entries(config).map(([chave, valor]) => ({ chave, valor, descricao: chave }))
    const { error } = await supabase.from('configuracoes').upsert(entradas, { onConflict: 'chave' })
    if (error) msg('Erro ao salvar: ' + error.message)
    else msg('Configurações salvas! ✅')
    setSalvando(false)
  }

  async function resetarSenha(email) {
    if (!email) { msg('Este usuário não tem e-mail cadastrado.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/'
    })
    if (error) msg('Erro ao enviar e-mail: ' + error.message)
    else msg('E-mail de redefinição enviado para ' + email + ' ✅')
  }

  async function alterarPerfil(userId, novoPerfil) {
    const { error } = await supabase.from('perfis_acesso')
      .upsert({ user_id: userId, perfil: novoPerfil }, { onConflict: 'user_id' })
    if (error) msg('Erro ao alterar perfil: ' + error.message)
    else {
      msg('Perfil atualizado! ✅')
      setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, perfil: novoPerfil } : p))
    }
  }

  const StatCard = ({ label, valor, cor }) => (
    <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', textAlign: 'center', borderLeft: `4px solid ${cor}` }}>
      <p style={{ margin:0, fontSize: 32, fontWeight: 800, color: cor }}>{valor}</p>
      <p style={{ margin:0, fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding:'24px 16px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>

        {/* Cabeçalho */}
        <div style={{ position:'relative', textAlign:'center', marginBottom:24 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:18 }}>←</button>
          <img src="/logo-acacia.png" alt="Logo" style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto 8px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:'bold', margin:0 }}>Configurações</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:14 }}>Acácia de Serra Negra Nº 271</p>
        </div>

        {mensagem && (
          <div style={{ background: mensagem.includes('Erro') ? '#fee2e2' : '#dcfce7', color: mensagem.includes('Erro') ? '#dc2626' : '#16a34a', padding:'12px 16px', borderRadius:10, marginBottom:16, textAlign:'center', fontWeight:600 }}>
            {mensagem}
          </div>
        )}

        {/* Estatísticas */}
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:16 }}>
          <div style={{ height:4, background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
          <div style={{ padding:24 }}>
            <p style={{ margin:'0 0 16px', fontWeight:700, color:'#4f46e5', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>Estatísticas da Loja</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <StatCard label="Total de Irmãos" valor={stats.total} cor="#4f46e5" />
              <StatCard label="Aprovados" valor={stats.aprovados} cor="#16a34a" />
              <StatCard label="Pendentes" valor={stats.pendentes} cor="#d97706" />
              <StatCard label="Rejeitados" valor={stats.rejeitados} cor="#dc2626" />
            </div>
          </div>
        </div>

        {/* Dados da Loja */}
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:16 }}>
          <div style={{ height:4, background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
          <div style={{ padding:24 }}>
            <p style={{ margin:'0 0 16px', fontWeight:700, color:'#4f46e5', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>Dados da Loja</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
              <Input label="Nome da Loja" value={config.nome_loja} onChange={v => setConfig({...config, nome_loja:v})} />
              <Input label="Número" value={config.numero_loja} onChange={v => setConfig({...config, numero_loja:v})} />
              <Input label="Potência" value={config.potencia} onChange={v => setConfig({...config, potencia:v})} />
              <Input label="Rito" value={config.rito} onChange={v => setConfig({...config, rito:v})} />
              <Input label="Cidade" value={config.cidade} onChange={v => setConfig({...config, cidade:v})} />
              <Input label="Estado" value={config.estado} onChange={v => setConfig({...config, estado:v})} />
            </div>
            <Input label="Data de Fundação" value={config.data_fundacao} onChange={v => setConfig({...config, data_fundacao:v})} />
            <button onClick={salvarConfig} disabled={salvando}
              style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              {salvando ? 'Salvando...' : '💾 Salvar Configurações'}
            </button>
          </div>
        </div>

        {/* Perfis de Acesso */}
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:16 }}>
          <div style={{ height:4, background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
          <div style={{ padding:24 }}>
            <p style={{ margin:'0 0 16px', fontWeight:700, color:'#4f46e5', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>Perfis de Acesso</p>
            {perfis.length === 0 ? (
              <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhum perfil configurado.</p>
            ) : perfis.map((p, i) => (
              <div key={i} style={{ background:'#f8fafc', borderRadius:10, padding:'14px 16px', marginBottom:10, border:'1px solid #e2e8f0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:'0 0 2px', fontWeight:700, color:'#1e293b', fontSize:14 }}>{p.associados?.nome_completo || '—'}</p>
                    <p style={{ margin:'0 0 1px', fontSize:12, color:'#64748b' }}>CPF: {p.associados?.cpf || '—'}</p>
                    <p style={{ margin:0, fontSize:12, color:'#64748b' }}>E-mail: {p.associados?.email || '—'}</p>
                  </div>
                  <select value={p.perfil} onChange={e => alterarPerfil(p.user_id, e.target.value)}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:13, background:'#fff', cursor:'pointer', flexShrink:0 }}>
                    <option value="Membro">Membro</option>
                    <option value="Ritualística">Ritualística</option>
                    <option value="Hospitalaria">Hospitalaria</option>
                    <option value="Secretário">Secretário</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Venerável Mestre">Venerável Mestre</option>
                    <option value="Total">Total</option>
                    <option value="ADM">ADM</option>
                  </select>
                </div>
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <button onClick={() => p.associados?.id ? navigate('/perfil/' + p.associados.id) : msg('Associado sem perfil cadastrado.')}
                    style={{ flex:1, padding:'6px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#1a237e', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    👤 Ver perfil
                  </button>
                  <button onClick={() => resetarSenha(p.associados?.email)}
                    style={{ flex:1, padding:'6px 0', borderRadius:8, border:'none', background:'#fef3c7', color:'#b45309', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    🔑 Resetar senha
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Templates de Mensagens */}
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:16 }}>
          <div style={{ height:4, background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
          <div style={{ padding:24 }}>
            <p style={{ margin:'0 0 16px', fontWeight:700, color:'#4f46e5', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>Mensagens</p>
            <button onClick={() => navigate('/gestao-cargos')}
              style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1a237e,#283593)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', marginBottom:10 }}>
              ⚒️ Gestão de Cargos
            </button>
            <button onClick={() => navigate('/templates-mensagens')}
              style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1e40af,#4f46e5)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              ✉️ Editar Templates de Aniversário
            </button>
          </div>
        </div>
        <MonitorContexto />
      </div>
    </div>
  )
}
