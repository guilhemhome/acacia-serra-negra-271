
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CARGOS_REAA = [
  'Venerável Mestre','1º Vigilante','2º Vigilante','Orador','Secretário',
  'Tesoureiro','Chanceler','Hospitaleiro','Mestre de Cerimônias',
  '1º Diácono','2º Diácono','1º Experto','2º Experto','Porta-Bandeira',
  'Porta-Estandarte','Porta-Espada','Cobridor Interno','Cobridor Externo',
  'Mestre de Banquetes','Mestre de Harmonia','Bibliotecário','Arquiteto'
]

const ICONES_CATEGORIA = {
  'Direção': '👑',
  'Administração': '📋',
  'Jurídico': '⚖️',
  'Ritual': '🕯️',
  'Assistência': '🏥',
  'Guarda': '🛡️',
  'Outros': '📚',
}
const ORDEM_CATEGORIAS = ['Direção','Administração','Jurídico','Ritual','Assistência','Guarda','Outros']
const PERFIS_SUGERIDOS = ['Administrativo','Financeiro','Secretário','Hospitalaria','Ritualística','Venerável Mestre','Membro']

export default function GestaoCargos() {
  const navigate = useNavigate()
  const [nivelAcesso, setNivelAcesso] = useState(null)
  const [cargos, setCargos] = useState([])
  const [exercicio, setExercicio] = useState([])
  const [associados, setAssociados] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [atribuindo, setAtribuindo] = useState(null)
  const [formAtribuir, setFormAtribuir] = useState({ associado_id:'', data_inicio:'' })
  const [novoCargo, setNovoCargo] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('')
  const [novoPerfilAcesso, setNovoPerfilAcesso] = useState('')
  const [editandoCargo, setEditandoCargo] = useState(null)
  const [editNome, setEditNome] = useState('')
  const [editCategoria, setEditCategoria] = useState('')
  const [editPerfilAcesso, setEditPerfilAcesso] = useState('')
  const [aba, setAba] = useState('atual')
  const [abasAbertas, setAbasAbertas] = useState([])
  const [alertaCargo, setAlertaCargo] = useState(null)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return navigate('/')
    const { data: perfil } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', user.id).maybeSingle()
    if (!perfil || !['ADM','Venerável Mestre'].includes(perfil.perfil)) { navigate('/dashboard'); return }
    setNivelAcesso(perfil.perfil)
    await garantirCargosIniciais()
    await carregar()
  }

  async function garantirCargosIniciais() {
    const { data } = await supabase.from('cargos').select('id').limit(1)
    if (data && data.length === 0) {
      await supabase.from('cargos').insert(CARGOS_REAA.map(nome => ({ nome, categoria:'Outros', perfil_acesso:'Membro' })))
    }
  }

  async function carregar() {
    setLoading(true)
    const [{ data: c }, { data: e }, { data: a }] = await Promise.all([
      supabase.from('cargos').select('*').order('nome'),
      supabase.from('cargos_historico').select('*, associados(nome_completo, email, conta_teste)').eq('em_exercicio', true),
      supabase.from('associados').select('id, nome_completo, email, conta_teste').eq('status_cadastro','aprovado').eq('situacao','ativo').order('nome_completo')
    ])
    setCargos(c || [])
    setExercicio(e || [])
    setAssociados(a || [])
    setLoading(false)
  }

  function titular(nomeCargo) {
    return exercicio.find(e => e.cargo === nomeCargo)
  }

  function categoriasExistentes() {
    return [...new Set(cargos.map(c => c.categoria).filter(Boolean))].sort()
  }

  function perfisExistentes() {
    return [...new Set([...PERFIS_SUGERIDOS, ...cargos.map(c => c.perfil_acesso).filter(Boolean)])]
  }

  async function atribuir() {
    if (!formAtribuir.associado_id || !formAtribuir.data_inicio) { setMsg('Preencha o irmão e a data de início.'); return }
    // Verificar se o irmão já ocupa algum cargo
    const cargoAtual = exercicio.find(e => e.associado_id === formAtribuir.associado_id)
    if (cargoAtual) {
      setAlertaCargo({ cargoAtual: cargoAtual.cargo, associado_id: formAtribuir.associado_id, data_inicio: formAtribuir.data_inicio, cargo: atribuindo })
      return
    }
    const cargo = atribuindo
    const assocSelecionado = associados.find(a => a.id === formAtribuir.associado_id)
    const ehTeste = assocSelecionado?.conta_teste === true
    const jaOcupa = exercicio.find(e => e.cargo === cargo && (e.associados?.conta_teste === true) === ehTeste)
    if (jaOcupa) {
      await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: formAtribuir.data_inicio }).eq('id', jaOcupa.id)
    }
    const cargoAnteriorAssoc = exercicio.find(e => e.associado_id === formAtribuir.associado_id)
    if (cargoAnteriorAssoc) {
      await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: formAtribuir.data_inicio }).eq('id', cargoAnteriorAssoc.id)
    }
    // Garantia extra: desativar qualquer duplicata remanescente
    await supabase.from('cargos_historico').update({ em_exercicio: false }).eq('cargo', cargo).eq('em_exercicio', true)
    await supabase.from('cargos_historico').update({ em_exercicio: false }).eq('associado_id', formAtribuir.associado_id).eq('em_exercicio', true)
    await supabase.from('cargos_historico').insert({
      associado_id: formAtribuir.associado_id,
      cargo,
      data_inicio: formAtribuir.data_inicio,
      em_exercicio: true
    })
    // Atualizar nível de acesso automaticamente (usando perfil_acesso cadastrado no cargo)
    const cargoObj = cargos.find(c => c.nome === cargo)
    const novoPerfil = cargoObj?.perfil_acesso || 'Membro'
    const { data: assocUser } = await supabase.from('associados').select('user_id').eq('id', formAtribuir.associado_id).maybeSingle()
    if (assocUser?.user_id) {
      const { data: perfilAtual } = await supabase.from('perfis_acesso').select('is_admin').eq('user_id', assocUser.user_id).maybeSingle()
      if (!perfilAtual?.is_admin) {
        await supabase.from('perfis_acesso').upsert({ user_id: assocUser.user_id, perfil: novoPerfil }, { onConflict: 'user_id' })
      }
    }
    setMsg('✅ Cargo atribuído com sucesso! Nível de acesso atualizado para: ' + novoPerfil)
    setAtribuindo(null)
    setFormAtribuir({ associado_id:'', data_inicio:'' })
    await carregar()
    setTimeout(() => setMsg(''), 3000)
  }

  async function confirmarAlerta() {
    const { cargo, associado_id, data_inicio } = alertaCargo
    setAlertaCargo(null)
    const assocSelecionado = associados.find(a => a.id === associado_id)
    const ehTeste = assocSelecionado?.conta_teste === true
    const jaOcupa = exercicio.find(e => e.cargo === cargo && (e.associados?.conta_teste === true) === ehTeste)
    if (jaOcupa) await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: data_inicio }).eq('id', jaOcupa.id)
    const cargoAnterior = exercicio.find(e => e.associado_id === associado_id)
    if (cargoAnterior) await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: data_inicio }).eq('id', cargoAnterior.id)
    await supabase.from('cargos_historico').insert({ associado_id, cargo, data_inicio, em_exercicio: true })
    const cargoObj = cargos.find(c => c.nome === cargo)
    const novoPerfil = cargoObj?.perfil_acesso || 'Membro'
    const { data: assocUser } = await supabase.from('associados').select('user_id').eq('id', associado_id).maybeSingle()
    if (assocUser?.user_id) {
      const { data: perfilAtual } = await supabase.from('perfis_acesso').select('is_admin').eq('user_id', assocUser.user_id).maybeSingle()
      if (!perfilAtual?.is_admin) {
        await supabase.from('perfis_acesso').upsert({ user_id: assocUser.user_id, perfil: novoPerfil }, { onConflict: 'user_id' })
      }
    }
    setMsg('Cargo atribuido! Nivel de acesso: ' + novoPerfil)
    setAtribuindo(null)
    setFormAtribuir({ associado_id: '', data_inicio: '' })
    await carregar()
    setTimeout(() => setMsg(''), 3000)
  }

  async function encerrar(item) {
    if (!confirm(`Encerrar o cargo de ${item.cargo} de ${item.associados?.nome_completo}?`)) return
    const hoje = new Date().toISOString().split('T')[0]
    await supabase.from('cargos_historico').update({ em_exercicio: false, data_fim: hoje }).eq('id', item.id)
    setMsg('Cargo encerrado.')
    await carregar()
    setTimeout(() => setMsg(''), 3000)
  }

  async function criarCargo() {
    if (!novoCargo.trim()) return
    await supabase.from('cargos').insert({
      nome: novoCargo.trim(),
      categoria: novaCategoria.trim() || 'Outros',
      perfil_acesso: novoPerfilAcesso.trim() || 'Membro'
    })
    setNovoCargo('')
    setNovaCategoria('')
    setNovoPerfilAcesso('')
    setMsg('✅ Cargo criado!')
    await carregar()
    setTimeout(() => setMsg(''), 3000)
  }

  function iniciarEdicao(c) {
    setEditandoCargo(c.id)
    setEditNome(c.nome)
    setEditCategoria(c.categoria || '')
    setEditPerfilAcesso(c.perfil_acesso || '')
  }

  async function salvarEdicao(id) {
    if (!editNome.trim()) return
    await supabase.from('cargos').update({
      nome: editNome.trim(),
      categoria: editCategoria.trim() || 'Outros',
      perfil_acesso: editPerfilAcesso.trim() || 'Membro'
    }).eq('id', id)
    setEditandoCargo(null)
    setMsg('✅ Cargo atualizado!')
    await carregar()
    setTimeout(() => setMsg(''), 3000)
  }

  async function excluirCargo(id, nome) {
    if (!confirm(`Excluir o cargo "${nome}"? O histórico será mantido.`)) return
    await supabase.from('cargos').delete().eq('id', id)
    setMsg('Cargo excluído.')
    await carregar()
    setTimeout(() => setMsg(''), 3000)
  }

  const fmt = d => d ? d.split('T')[0].split('-').reverse().join('/') : '—'

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e,#283593)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#fff', fontSize:18 }}>Carregando...</p>
    </div>
  )

  const categoriasPresentes = [...new Set(cargos.map(c => c.categoria || 'Outros'))].sort((a,b) => {
    const ia = ORDEM_CATEGORIAS.indexOf(a), ib = ORDEM_CATEGORIAS.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e,#283593)', padding:'24px 16px' }}>
      {alertaCargo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, maxWidth:360, width:'100%' }}>
            <div style={{ textAlign:'center', marginBottom:12 }}><span style={{ fontSize:40 }}>⚠️</span></div>
            <h3 style={{ margin:'0 0 8px', color:'#1e293b', fontSize:16, fontWeight:700, textAlign:'center' }}>Irmão já tem cargo</h3>
            <p style={{ margin:'0 0 20px', color:'#64748b', fontSize:14, textAlign:'center', lineHeight:1.5 }}>
              Este irmão já ocupa <strong style={{ color:'#1a237e' }}>"{alertaCargo.cargoAtual}"</strong>. Deseja atribuir <strong style={{ color:'#1a237e' }}>"{alertaCargo.cargo}"</strong> mesmo assim? O cargo anterior será encerrado automaticamente.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setAlertaCargo(null)} style={{ flex:1, padding:'12px', borderRadius:10, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#64748b', fontWeight:700, fontSize:14, cursor:'pointer', minHeight:44 }}>Cancelar</button>
              <button onClick={confirmarAlerta} style={{ flex:1, padding:'12px', borderRadius:10, border:'none', background:'#1a237e', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', minHeight:44 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ maxWidth:600, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ position:'relative', textAlign:'center', marginBottom:24 }}>
          <button onClick={() => navigate('/configuracoes')}
            style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:18 }}>←</button>
          <img src="/logo-acacia.png" alt="Logo" style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto 8px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:'bold', margin:0 }}>Gestão de Cargos</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:14 }}>Acácia de Serra Negra Nº 271</p>
        </div>

        {msg && <div style={{ background:'rgba(255,255,255,0.15)', color:'#fff', borderRadius:10, padding:'10px 16px', marginBottom:16, textAlign:'center', fontWeight:600 }}>{msg}</div>}

        {/* Abas */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {[['atual','⚒️ Cargos Atuais'],['gerenciar','⚙️ Gerenciar Lista']].map(([k,l]) => (
            <button key={k} onClick={() => setAba(k)}
              style={{ flex:1, padding:'10px', borderRadius:10, border:'none', fontWeight:700, fontSize:14, cursor:'pointer',
                background: aba===k ? '#fff' : 'rgba(255,255,255,0.15)',
                color: aba===k ? '#1a237e' : '#fff' }}>{l}</button>
          ))}
        </div>

        {/* ABA: CARGOS ATUAIS */}
        {aba === 'atual' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {categoriasPresentes.map(categoria => {
              const cargosDoGrupo = cargos.filter(c => (c.categoria || 'Outros') === categoria)
              if (cargosDoGrupo.length === 0) return null
              const icone = ICONES_CATEGORIA[categoria] || '📌'
              const preenchidos = cargosDoGrupo.filter(c => titular(c.nome)).length
              const vagos = cargosDoGrupo.length - preenchidos
              const aberto = abasAbertas.includes(categoria)
              return (
                <div key={categoria} style={{ borderRadius:12, overflow:'hidden', border:'1px solid #cbd5e1' }}>
                  <div onClick={() => setAbasAbertas(prev => prev.includes(categoria) ? prev.filter(x => x !== categoria) : [...prev, categoria])}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer', background: aberto ? '#1a237e' : '#f8fafc' }}>
                    <span style={{ fontSize:16 }}>{icone}</span>
                    <span style={{ flex:1, fontSize:16, fontWeight:700, color: aberto ? '#fff' : '#1a237e', letterSpacing:'0.01em' }}>{categoria}</span>
                    {preenchidos > 0 && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background: aberto ? 'rgba(255,255,255,0.2)' : '#dbeafe', color: aberto ? '#fff' : '#1d4ed8', fontWeight:600 }}>{preenchidos} ✓</span>}
                    {vagos > 0 && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background: aberto ? 'rgba(255,255,255,0.1)' : '#f1f5f9', color: aberto ? 'rgba(255,255,255,0.7)' : '#64748b', fontWeight:600 }}>{vagos} vagos</span>}
                    <span style={{ color: aberto ? '#fff' : '#94a3b8', fontSize:16, transform: aberto ? 'rotate(180deg)' : 'none', display:'inline-block', transition:'transform 0.2s' }}>▾</span>
                  </div>
                  {aberto && (
                    <div style={{ background:'#fff' }}>
                      {cargosDoGrupo.map((cargo, idx) => {
                        const t = titular(cargo.nome)
                        return (
                          <div key={cargo.id}>
                            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderTop:'1px solid #f1f5f9', borderLeft: t ? '4px solid #1a237e' : '4px solid #e2e8f0', background: t ? '#f8faff' : '#fff' }}>
                              <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:8, flexWrap:'nowrap', overflow:'hidden' }}>
                                <span style={{ fontSize:14, fontWeight:700, color:'#0f172a', flexShrink:0 }}>{cargo.nome}</span>
                                {t
                                  ? <span style={{ fontSize:12, color:'#1a237e', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.associados?.nome_completo} · <span style={{ color:'#475569' }}>desde {fmt(t.data_inicio)}</span></span>
                                  : <span style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic', flexShrink:0 }}>Cargo vago</span>
                                }
                              </div>
                              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                                {t ? (
                                  <>
                                    <button onClick={() => { setAtribuindo(cargo.nome); setFormAtribuir({ associado_id:'', data_inicio:'' }) }}
                                      style={{ background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:8, color:'#1d4ed8', padding:'6px 10px', cursor:'pointer', fontSize:13, minWidth:36, minHeight:36 }}>✏️</button>
                                    <button onClick={() => encerrar(t)}
                                      style={{ background:'#fff1f2', border:'1px solid #fca5a5', borderRadius:8, color:'#dc2626', padding:'6px 10px', cursor:'pointer', fontSize:13, minWidth:36, minHeight:36 }}>✕</button>
                                  </>
                                ) : (
                                  <button onClick={() => { setAtribuindo(cargo.nome); setFormAtribuir({ associado_id:'', data_inicio:'' }) }}
                                    style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, color:'#15803d', padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600, minHeight:36 }}>＋ Atribuir</button>
                                )}
                              </div>
                            </div>
                            {atribuindo === cargo.nome && (
                              <div style={{ background:'#f8fafc', padding:'12px 16px', borderTop:'1px solid #f1f5f9', borderLeft:'4px solid #1a237e' }}>
                                <select value={formAtribuir.associado_id} onChange={e => setFormAtribuir({...formAtribuir, associado_id:e.target.value})}
                                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }}>
                                  <option value="">Selecione o irmão...</option>
                                  {associados.map(a => <option key={a.id} value={a.id}>{a.nome_completo}</option>)}
                                </select>
                                <input type="date" value={formAtribuir.data_inicio} onChange={e => setFormAtribuir({...formAtribuir, data_inicio:e.target.value})}
                                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }} />
                                <div style={{ display:'flex', gap:8 }}>
                                  <button onClick={atribuir} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#1a237e', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', minHeight:44 }}>💾 Confirmar</button>
                                  <button onClick={() => setAtribuindo(null)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#64748b', fontWeight:700, fontSize:14, cursor:'pointer', minHeight:44 }}>Cancelar</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

                {/* ABA: GERENCIAR LISTA */}
        {aba === 'gerenciar' && (
          <div>
            {/* Criar novo */}
            <div style={{ background:'#fff', borderRadius:12, padding:16, marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
              <p style={{ margin:'0 0 10px', fontWeight:700, color:'#1a237e' }}>➕ Criar novo cargo</p>
              <input value={novoCargo} onChange={e => setNovoCargo(e.target.value)}
                placeholder="Nome do cargo..."
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }} />
              <input value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)}
                list="lista-categorias" placeholder="Categoria (ex: Administração) — digite uma nova se quiser"
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }} />
              <input value={novoPerfilAcesso} onChange={e => setNovoPerfilAcesso(e.target.value)}
                list="lista-perfis" placeholder="Nível de acesso (ex: Administrativo)"
                style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:8, boxSizing:'border-box' }} />
              <datalist id="lista-categorias">
                {categoriasExistentes().map(cat => <option key={cat} value={cat} />)}
              </datalist>
              <datalist id="lista-perfis">
                {perfisExistentes().map(p => <option key={p} value={p} />)}
              </datalist>
              <button onClick={criarCargo}
                style={{ width:'100%', padding:'10px 18px', borderRadius:8, border:'none', background:'#1a237e', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', minHeight:44 }}>＋ Criar Cargo</button>
            </div>

            {/* Lista */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {cargos.map(c => (
                <div key={c.id} style={{ background:'#fff', borderRadius:12, padding:'12px 14px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
                  {editandoCargo === c.id ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <input value={editNome} onChange={e => setEditNome(e.target.value)}
                        placeholder="Nome do cargo"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                      <input value={editCategoria} onChange={e => setEditCategoria(e.target.value)}
                        list="lista-categorias" placeholder="Categoria"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                      <input value={editPerfilAcesso} onChange={e => setEditPerfilAcesso(e.target.value)}
                        list="lista-perfis" placeholder="Nível de acesso"
                        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => salvarEdicao(c.id)}
                          style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#1a237e', color:'#fff', fontWeight:700, cursor:'pointer', minHeight:44 }}>💾 Salvar</button>
                        <button onClick={() => setEditandoCargo(null)}
                          style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#64748b', fontWeight:700, cursor:'pointer', minHeight:44 }}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <p style={{ margin:0, fontWeight:600, color:'#1e293b', fontSize:14 }}>{c.nome}</p>
                        <p style={{ margin:'2px 0 0', fontSize:11, color:'#94a3b8' }}>{c.categoria || 'Outros'} · {c.perfil_acesso || 'Membro'}</p>
                      </div>
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <button onClick={() => iniciarEdicao(c)}
                          style={{ background:'#e0f2fe', border:'none', borderRadius:8, color:'#0369a1', padding:'8px 12px', cursor:'pointer', fontSize:15, minWidth:44, minHeight:44 }}>✏️</button>
                        <button onClick={() => excluirCargo(c.id, c.nome)}
                          style={{ background:'#fee2e2', border:'none', borderRadius:8, color:'#dc2626', padding:'8px 12px', cursor:'pointer', fontSize:15, minWidth:44, minHeight:44 }}>🗑️</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
