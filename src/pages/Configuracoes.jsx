import { useEffect, useState } from 'react'
import MonitorContexto from '../components/MonitorContexto'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const Input = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ display:'block', fontSize:10, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.5, marginBottom:3 }}>{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)}
      style={{ width:'100%', padding:'7px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:13, boxSizing:'border-box', outline:'none' }} />
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
  const [abaAtiva, setAbaAtiva] = useState('geral')
  const [permissoes, setPermissoes] = useState({})
  const [salvandoPerm, setSalvandoPerm] = useState(false)
  const [secaoAberta, setSecaoAberta] = useState(null) // 'stats' | 'dados' | 'mensagens' | 'perfis'
  const [irmaoExpandido, setIrmaoExpandido] = useState(null)

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

      const { data: perms } = await supabase.from('permissoes_perfil').select('*')
      if (perms) {
        const map = {}
        perms.forEach(p => {
          if (!map[p.perfil]) map[p.perfil] = {}
          map[p.perfil][p.modulo] = p.nivel
        })
        setPermissoes(map)
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

  async function salvarPermissoes() {
    setSalvandoPerm(true)
    const entradas = []
    Object.entries(permissoes).forEach(([perfil, modulos]) => {
      Object.entries(modulos).forEach(([modulo, nivel]) => {
        entradas.push({ perfil, modulo, nivel })
      })
    })
    const { error } = await supabase.from('permissoes_perfil')
      .upsert(entradas, { onConflict: 'perfil,modulo' })
    if (error) msg('Erro ao salvar permissoes: ' + error.message)
    else msg('Permissoes salvas!')
    setSalvandoPerm(false)
  }

  function alterarNivel(perfil, modulo, nivel) {
    setPermissoes(prev => ({
      ...prev,
      [perfil]: { ...prev[perfil], [modulo]: nivel }
    }))
  }


  const MODULOS = [
    { chave: '/dashboard', nome: 'Dashboard' },
    { chave: '/membros', nome: 'Lista de Membros' },
    { chave: '/perfil/:id', nome: 'Perfil do Irmão' },
    { chave: 'presencas', nome: 'Presenças (painel)' },
    { chave: '/aprovacoes', nome: 'Aprovações' },
    { chave: '/calendario', nome: 'Calendário' },
    { chave: '/configuracoes', nome: 'Configurações' },
    { chave: '/membro', nome: 'Portal do Membro' },
    { chave: '/templates-mensagens', nome: 'Templates Mensagens' },
    { chave: '/editar-perfil', nome: 'Editar Perfil' },
  ]
  const PERFIS_EDITAVEIS = ['Venerável Mestre','Secretário','Financeiro','Administrativo','Membro','Ritualística','Hospitalaria']
  const COR_NIVEL = { total: '#16a34a', leitura: '#1d4ed8', bloqueado: '#dc2626' }
  const BG_NIVEL = { total: '#dcfce7', leitura: '#dbeafe', bloqueado: '#fee2e2' }

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

          {/* Barra de abas */}
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {[
              { id:'geral', label:'Geral' },
              { id:'usuarios', label:'Usuarios' },
              { id:'permissoes', label:'Permissoes' },
            ].map(aba => (
              <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                style={{ padding:'10px 20px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
                  background: abaAtiva === aba.id ? '#fff' : 'rgba(255,255,255,0.15)',
                  color: abaAtiva === aba.id ? '#1e40af' : '#fff',
                  boxShadow: abaAtiva === aba.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}>
                {aba.label}
              </button>
            ))}
          </div>

          {abaAtiva === 'geral' && <>

        {/* Estatísticas — acordeao */}
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:12 }}>
          <div onClick={() => setSecaoAberta(secaoAberta === 'stats' ? null : 'stats')}
            style={{ padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
            <span style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>📊 Estatísticas da Loja</span>
            <span style={{ fontSize:13, color:'#94a3b8', transform: secaoAberta === 'stats' ? 'rotate(180deg)' : 'none', transition:'transform 0.15s' }}>▾</span>
          </div>
          {secaoAberta === 'stats' && (
            <div style={{ padding:'0 24px 20px' }}>
              <div style={{ display:'flex', border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                {[
                  { label:'Total', valor:stats.total, cor:'#4f46e5' },
                  { label:'Aprovados', valor:stats.aprovados, cor:'#16a34a' },
                  { label:'Pendentes', valor:stats.pendentes, cor:'#d97706' },
                  { label:'Rejeitados', valor:stats.rejeitados, cor:'#dc2626' },
                ].map((s, i) => (
                  <div key={s.label} style={{ flex:1, textAlign:'center', padding:'10px 4px', borderRight: i < 3 ? '1px solid #e2e8f0' : 'none' }}>
                    <div style={{ fontSize:18, fontWeight:800, color:s.cor }}>{s.valor}</div>
                    <div style={{ fontSize:9.5, color:'#64748b', textTransform:'uppercase', letterSpacing:0.3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dados da Loja — acordeao */}
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:12 }}>
          <div onClick={() => setSecaoAberta(secaoAberta === 'dados' ? null : 'dados')}
            style={{ padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
            <span style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>🏛️ Dados da Loja</span>
            <span style={{ fontSize:13, color:'#94a3b8', transform: secaoAberta === 'dados' ? 'rotate(180deg)' : 'none', transition:'transform 0.15s' }}>▾</span>
          </div>
          {secaoAberta === 'dados' && (
            <div style={{ padding:'0 24px 20px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'0 10px' }}>
                <Input label="Nome da Loja" value={config.nome_loja} onChange={v => setConfig({...config, nome_loja:v})} />
                <Input label="Número" value={config.numero_loja} onChange={v => setConfig({...config, numero_loja:v})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0 10px' }}>
                <Input label="Potência" value={config.potencia} onChange={v => setConfig({...config, potencia:v})} />
                <Input label="Rito" value={config.rito} onChange={v => setConfig({...config, rito:v})} />
                <Input label="Estado" value={config.estado} onChange={v => setConfig({...config, estado:v})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 10px' }}>
                <Input label="Cidade" value={config.cidade} onChange={v => setConfig({...config, cidade:v})} />
                <Input label="Data de Fundação" value={config.data_fundacao} onChange={v => setConfig({...config, data_fundacao:v})} />
              </div>
              <button onClick={salvarConfig} disabled={salvando}
                style={{ width:'100%', padding:'10px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', marginTop:4 }}>
                {salvando ? 'Salvando...' : '💾 Salvar Configurações'}
              </button>
            </div>
          )}
        </div>

        {/* Mensagens — acordeao */}
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:12 }}>
          <div onClick={() => setSecaoAberta(secaoAberta === 'mensagens' ? null : 'mensagens')}
            style={{ padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
            <span style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>💬 Mensagens</span>
            <span style={{ fontSize:13, color:'#94a3b8', transform: secaoAberta === 'mensagens' ? 'rotate(180deg)' : 'none', transition:'transform 0.15s' }}>▾</span>
          </div>
          {secaoAberta === 'mensagens' && (
            <div style={{ padding:'0 24px 24px' }}>
              <button onClick={() => navigate('/gestao-cargos')}
                style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1a237e,#283593)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', marginBottom:10 }}>
                Gestao de Cargos
              </button>
              <button onClick={() => navigate('/templates-mensagens')}
                style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1e40af,#4f46e5)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>
                Editar Templates de Aniversario
              </button>
            </div>
          )}
        </div>

        </>}

        {abaAtiva === 'usuarios' && <>
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:16 }}>
          <div onClick={() => setSecaoAberta(secaoAberta === 'perfis' ? null : 'perfis')}
            style={{ padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
            <span style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>👥 Perfis de Acesso <span style={{ color:'#94a3b8', fontWeight:400 }}>({perfis.length} {perfis.length === 1 ? 'irmão' : 'irmãos'})</span></span>
            <span style={{ fontSize:13, color:'#94a3b8', transform: secaoAberta === 'perfis' ? 'rotate(180deg)' : 'none', transition:'transform 0.15s' }}>▾</span>
          </div>
          {secaoAberta === 'perfis' && (
            <div style={{ padding:'0 24px 24px' }}>
              {perfis.length === 0 ? (
                <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhum perfil configurado.</p>
              ) : perfis.map((p, i) => {
                const expandido = irmaoExpandido === (p.user_id || i)
                return (
                <div key={i} style={{ background:'#f8fafc', borderRadius:8, marginBottom:5, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                  <div onClick={() => setIrmaoExpandido(expandido ? null : (p.user_id || i))}
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, padding:'7px 12px', cursor:'pointer' }}>
                    <span style={{ fontWeight:600, color:'#1e293b', fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, minWidth:0 }}>
                      {p.associados?.nome_completo || '—'}
                    </span>
                    <select value={p.perfil} onClick={e => e.stopPropagation()} onChange={e => alterarPerfil(p.user_id, e.target.value)}
                      style={{ padding:'5px 8px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:12, background:'#fff', cursor:'pointer', flexShrink:0 }}>
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
                    <span style={{ fontSize:11, color:'#94a3b8', transform: expandido ? 'rotate(180deg)' : 'none', flexShrink:0 }}>▾</span>
                  </div>
                  {expandido && (
                    <div style={{ padding:'0 14px 12px' }}>
                      <p style={{ margin:'0 0 8px', fontSize:12, color:'#64748b' }}>
                        🪪 {p.associados?.cpf || '—'} <span style={{ margin:'0 4px', color:'#cbd5e1' }}>·</span> 📧 {p.associados?.email || '—'}
                      </p>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => p.associados?.id ? navigate('/perfil/' + p.associados.id) : msg('Associado sem perfil cadastrado.')}
                          style={{ flex:1, padding:'6px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#1a237e', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          Ver perfil
                        </button>
                        <button onClick={() => resetarSenha(p.associados?.email)}
                          style={{ flex:1, padding:'6px 0', borderRadius:8, border:'none', background:'#fef3c7', color:'#b45309', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          Resetar senha
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>
        </>}

        {abaAtiva === 'permissoes' && (
          <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', marginBottom:16 }}>
            <div style={{ height:4, background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
            <div style={{ padding:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
                <p style={{ margin:0, fontWeight:700, color:'#4f46e5', fontSize:13, textTransform:'uppercase', letterSpacing:1 }}>Permissoes por Perfil</p>
                <button onClick={salvarPermissoes} disabled={salvandoPerm}
                  style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  {salvandoPerm ? 'Salvando...' : 'Salvar Permissoes'}
                </button>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:750 }}>
                  <thead>
                    <tr style={{ background:'#1e293b' }}>
                      <th style={{ padding:'10px 12px', textAlign:'left', color:'#fff', fontSize:12, fontWeight:600, minWidth:150 }}>Modulo</th>
                      <th style={{ padding:'10px 8px', textAlign:'center', color:'#fff', fontSize:11, fontWeight:600, minWidth:70 }}>ADM</th>
                      {PERFIS_EDITAVEIS.map(p => (
                        <th key={p} style={{ padding:'10px 8px', textAlign:'center', color:'#fff', fontSize:11, fontWeight:600, minWidth:100, whiteSpace:'nowrap' }}>{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULOS.map((mod, mi) => (
                      <tr key={mod.chave} style={{ background: mi % 2 === 0 ? '#f8fafc' : '#fff', borderBottom:'1px solid #e2e8f0' }}>
                        <td style={{ padding:'8px 12px', fontSize:13, fontWeight:500, color:'#1e293b' }}>{mod.nome}</td>
                        <td style={{ padding:'6px 8px', textAlign:'center' }}>
                          <span style={{ background:'#dcfce7', color:'#16a34a', padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:600 }}>Total</span>
                        </td>
                        {PERFIS_EDITAVEIS.map(perf => {
                          const bloqueadoFixo = mod.chave === '/configuracoes'
                          const nivel = bloqueadoFixo ? 'bloqueado' : (permissoes[perf]?.[mod.chave] || 'bloqueado')
                          return (
                            <td key={perf} style={{ padding:'5px 6px', textAlign:'center' }}>
                              <select
                                disabled={bloqueadoFixo}
                                value={nivel}
                                onChange={e => alterarNivel(perf, mod.chave, e.target.value)}
                                style={{
                                  width:'100%', padding:'4px', borderRadius:6, fontSize:11,
                                  cursor: bloqueadoFixo ? 'not-allowed' : 'pointer',
                                  border: '1.5px solid ' + COR_NIVEL[nivel],
                                  background: BG_NIVEL[nivel],
                                  color: COR_NIVEL[nivel],
                                  fontWeight:600,
                                  opacity: bloqueadoFixo ? 0.5 : 1,
                                }}>
                                <option value="total">Total</option>
                                <option value="leitura">Leitura</option>
                                <option value="bloqueado">Bloqueado</option>
                              </select>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ margin:'12px 0 0', fontSize:11, color:'#94a3b8', textAlign:'center' }}>
                Configuracoes sempre bloqueado para nao-ADM.
              </p>
            </div>
          </div>
        )}

        <MonitorContexto />
      </div>
    </div>
  )
}
