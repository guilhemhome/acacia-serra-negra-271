import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ABAS = ['👤 Pessoal', '👨‍👩‍👧 Familiares', '🏠 Endereço', '⚒️ Maçônico', '📜 Filosófico']

export default function EditarPerfil() {
  const navigate = useNavigate()
  const [aba, setAba] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [associadoId, setAssociadoId] = useState(null)

  const [pessoal, setPessoal] = useState({ nome_completo:'', email:'', telefone:'', data_nascimento:'', nome_pai:'', nome_mae:'', profissao:'', empresa:'' })
  const [endereco, setEndereco] = useState({ tipo:'residencial', logradouro:'', numero:'', complemento:'', bairro:'', cidade:'', estado:'', cep:'' })
  const [enderecoComercial, setEnderecoComercial] = useState({ logradouro:'', numero:'', complemento:'', bairro:'', cidade:'', estado:'', cep:'' })
  const [familiares, setFamiliares] = useState([])
  const [novoFamiliar, setNovoFamiliar] = useState({ nome:'', parentesco:'', data_nascimento:'' })
  const [graus, setGraus] = useState({ aprendiz:{ data:'', loja:'' }, companheiro:{ data:'', loja:'' }, mestre:{ data:'', loja:'' } })
  const [filosoficos, setFilosoficos] = useState([])
  const [novoFilosofico, setNovoFilosofico] = useState({ grau:'', loja:'', data_concessao:'', observacoes:'' })

  useEffect(() => {
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/'); return }
      const uid = session.user.id
      const { data: assoc } = await supabase.from('associados').select('*').eq('user_id', uid).single()
      if (assoc) {
        setAssociadoId(assoc.id)
        setPessoal({ nome_completo: assoc.nome_completo||'', email: assoc.email||'', telefone: assoc.telefone||'', data_nascimento: assoc.data_nascimento||'', nome_pai: assoc.nome_pai||'', nome_mae: assoc.nome_mae||'', profissao: assoc.profissao||'', empresa: assoc.empresa||'' })
        const { data: fams } = await supabase.from('familiares').select('*').eq('associado_id', assoc.id)
        if (fams) setFamiliares(fams)
        const { data: ends } = await supabase.from('enderecos').select('*').eq('associado_id', assoc.id)
        if (ends) {
          const res = ends.find(e => e.tipo === 'residencial')
          const com = ends.find(e => e.tipo === 'comercial')
          if (res) setEndereco(res)
          if (com) setEnderecoComercial(com)
        }
        const { data: hg } = await supabase.from('historico_graus').select('*').eq('associado_id', assoc.id)
        if (hg) {
          const ap = hg.find(g => g.grau === 'aprendiz')
          const cm = hg.find(g => g.grau === 'companheiro')
          const mm = hg.find(g => g.grau === 'mestre')
          setGraus({ aprendiz: ap ? { data: ap.data_concessao||'', loja: ap.loja||'' } : { data:'', loja:'' }, companheiro: cm ? { data: cm.data_concessao||'', loja: cm.loja||'' } : { data:'', loja:'' }, mestre: mm ? { data: mm.data_concessao||'', loja: mm.loja||'' } : { data:'', loja:'' } })
        }
        const { data: fil } = await supabase.from('graus_filosoficos').select('*').eq('associado_id', assoc.id)
        if (fil) setFilosoficos(fil)
      }
    }
    carregar()
  }, [])

  function msg(texto) { setMensagem(texto); setTimeout(() => setMensagem(''), 3000) }

  async function salvarPessoal() {
    setSalvando(true)
    const { error } = await supabase.from('associados').update(pessoal).eq('id', associadoId)
    if (error) msg('Erro ao salvar.')
    else msg('Dados pessoais salvos! ✅')
    setSalvando(false)
  }

  async function salvarEndereco() {
    setSalvando(true)
    await supabase.from('enderecos').upsert({ ...endereco, tipo:'residencial', associado_id: associadoId }, { onConflict: 'associado_id,tipo' })
    await supabase.from('enderecos').upsert({ ...enderecoComercial, tipo:'comercial', associado_id: associadoId }, { onConflict: 'associado_id,tipo' })
    msg('Endereços salvos! ✅')
    setSalvando(false)
  }

  async function adicionarFamiliar() {
    if (!novoFamiliar.nome) return
    const { data, error } = await supabase.from('familiares').insert([{ ...novoFamiliar, associado_id: associadoId }]).select()
    if (!error && data) { setFamiliares([...familiares, data[0]]); setNovoFamiliar({ nome:'', parentesco:'', data_nascimento:'' }) }
  }

  async function removerFamiliar(id) {
    await supabase.from('familiares').delete().eq('id', id)
    setFamiliares(familiares.filter(f => f.id !== id))
  }

  async function salvarGraus() {
    setSalvando(true)
    for (const [grau, val] of Object.entries(graus)) {
      await supabase.from('historico_graus').upsert({ associado_id: associadoId, grau, data_concessao: val.data||null, loja: val.loja }, { onConflict: 'associado_id,grau' })
    }
    msg('Graus salvos! ✅')
    setSalvando(false)
  }

  async function adicionarFilosofico() {
    if (!novoFilosofico.grau) return
    const { data, error } = await supabase.from('graus_filosoficos').insert([{ ...novoFilosofico, associado_id: associadoId }]).select()
    if (!error && data) { setFilosoficos([...filosoficos, data[0]]); setNovoFilosofico({ grau:'', loja:'', data_concessao:'', observacoes:'' }) }
  }

  async function removerFilosofico(id) {
    await supabase.from('graus_filosoficos').delete().eq('id', id)
    setFilosoficos(filosoficos.filter(f => f.id !== id))
  }

  const Input = ({ label, value, onChange, type='text' }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box', outline:'none' }} />
    </div>
  )

  const Secao = ({ titulo }) => (
    <p style={{ fontWeight:700, color:'#4f46e5', fontSize:12, textTransform:'uppercase', letterSpacing:1, margin:'20px 0 12px' }}>{titulo}</p>
  )

  const BtnSalvar = ({ onClick }) => (
    <button onClick={onClick} disabled={salvando}
      style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', marginTop:8 }}>
      {salvando ? 'Salvando...' : '💾 Salvar'}
    </button>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding:'24px 16px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>

        <div style={{ position:'relative', textAlign:'center', marginBottom:24 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:18 }}>←</button>
          <img src="/logo-acacia.png" alt="Logo" style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto 8px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:'bold', margin:0 }}>Meu Perfil</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:14 }}>Acácia de Serra Negra Nº 271</p>
        </div>

        {mensagem && <div style={{ marginBottom:16, background:'#dcfce7', color:'#166534', padding:'12px 16px', borderRadius:12, textAlign:'center', fontWeight:600 }}>{mensagem}</div>}

        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ height:4, background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />

          <div style={{ display:'flex', overflowX:'auto', borderBottom:'1px solid #e2e8f0', padding:'0 8px' }}>
            {ABAS.map((a, i) => (
              <button key={i} onClick={() => setAba(i)}
                style={{ padding:'12px 16px', border:'none', background:'none', cursor:'pointer', whiteSpace:'nowrap', fontWeight: aba===i ? 700 : 400, color: aba===i ? '#4f46e5' : '#64748b', borderBottom: aba===i ? '2px solid #4f46e5' : '2px solid transparent', fontSize:13 }}>
                {a}
              </button>
            ))}
          </div>

          <div style={{ padding:24 }}>

            {aba === 0 && (
              <div>
                <Secao titulo="Dados Pessoais" />
                <Input label="Nome completo" value={pessoal.nome_completo} onChange={v => setPessoal({...pessoal, nome_completo:v})} />
                <Input label="E-mail" value={pessoal.email} onChange={v => setPessoal({...pessoal, email:v})} />
                <Input label="Telefone" value={pessoal.telefone} onChange={v => setPessoal({...pessoal, telefone:v})} />
                <Input label="Data de nascimento" type="date" value={pessoal.data_nascimento} onChange={v => setPessoal({...pessoal, data_nascimento:v})} />
                <Input label="Nome do pai" value={pessoal.nome_pai} onChange={v => setPessoal({...pessoal, nome_pai:v})} />
                <Input label="Nome da mãe" value={pessoal.nome_mae} onChange={v => setPessoal({...pessoal, nome_mae:v})} />
                <Secao titulo="Profissão" />
                <Input label="Profissão" value={pessoal.profissao} onChange={v => setPessoal({...pessoal, profissao:v})} />
                <Input label="Empresa" value={pessoal.empresa} onChange={v => setPessoal({...pessoal, empresa:v})} />
                <BtnSalvar onClick={salvarPessoal} />
              </div>
            )}

            {aba === 1 && (
              <div>
                <Secao titulo="Adicionar familiar" />
                <Input label="Nome" value={novoFamiliar.nome} onChange={v => setNovoFamiliar({...novoFamiliar, nome:v})} />
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>Parentesco</label>
                  <select value={novoFamiliar.parentesco} onChange={e => setNovoFamiliar({...novoFamiliar, parentesco:e.target.value})}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }}>
                    <option value="">Selecione...</option>
                    <option value="esposa">Esposa</option>
                    <option value="filho">Filho</option>
                    <option value="filha">Filha</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <Input label="Data de nascimento" type="date" value={novoFamiliar.data_nascimento} onChange={v => setNovoFamiliar({...novoFamiliar, data_nascimento:v})} />
                <button onClick={adicionarFamiliar}
                  style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', fontWeight:700, cursor:'pointer', marginBottom:20 }}>
                  + Adicionar familiar
                </button>
                <Secao titulo="Familiares cadastrados" />
                {familiares.length === 0 ? <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhum familiar cadastrado.</p> : familiares.map(f => (
                  <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#f8fafc', borderRadius:8, marginBottom:8, border:'1px solid #e2e8f0' }}>
                    <div>
                      <p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{f.nome}</p>
                      <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{f.parentesco} {f.data_nascimento ? '· '+new Date(f.data_nascimento).toLocaleDateString('pt-BR') : ''}</p>
                    </div>
                    <button onClick={() => removerFamiliar(f.id)} style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:18 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {aba === 2 && (
              <div>
                <Secao titulo="Endereço Residencial" />
                <Input label="CEP" value={endereco.cep} onChange={v => setEndereco({...endereco, cep:v})} />
                <Input label="Logradouro" value={endereco.logradouro} onChange={v => setEndereco({...endereco, logradouro:v})} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
                  <Input label="Número" value={endereco.numero} onChange={v => setEndereco({...endereco, numero:v})} />
                  <Input label="Complemento" value={endereco.complemento} onChange={v => setEndereco({...endereco, complemento:v})} />
                </div>
                <Input label="Bairro" value={endereco.bairro} onChange={v => setEndereco({...endereco, bairro:v})} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
                  <Input label="Cidade" value={endereco.cidade} onChange={v => setEndereco({...endereco, cidade:v})} />
                  <Input label="Estado" value={endereco.estado} onChange={v => setEndereco({...endereco, estado:v})} />
                </div>
                <Secao titulo="Endereço Comercial" />
                <Input label="CEP" value={enderecoComercial.cep} onChange={v => setEnderecoComercial({...enderecoComercial, cep:v})} />
                <Input label="Logradouro" value={enderecoComercial.logradouro} onChange={v => setEnderecoComercial({...enderecoComercial, logradouro:v})} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
                  <Input label="Número" value={enderecoComercial.numero} onChange={v => setEnderecoComercial({...enderecoComercial, numero:v})} />
                  <Input label="Complemento" value={enderecoComercial.complemento} onChange={v => setEnderecoComercial({...enderecoComercial, complemento:v})} />
                </div>
                <Input label="Bairro" value={enderecoComercial.bairro} onChange={v => setEnderecoComercial({...enderecoComercial, bairro:v})} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
                  <Input label="Cidade" value={enderecoComercial.cidade} onChange={v => setEnderecoComercial({...enderecoComercial, cidade:v})} />
                  <Input label="Estado" value={enderecoComercial.estado} onChange={v => setEnderecoComercial({...enderecoComercial, estado:v})} />
                </div>
                <BtnSalvar onClick={salvarEndereco} />
              </div>
            )}

            {aba === 3 && (
              <div>
                {[['aprendiz','⚒️ Aprendiz'],['companheiro','⚒️⚒️ Companheiro'],['mestre','⚒️⚒️⚒️ Mestre Maçom']].map(([g, label]) => (
                  <div key={g}>
                    <Secao titulo={label} />
                    <Input label="Data de iniciação/elevação/exaltação" type="date" value={graus[g].data} onChange={v => setGraus({...graus, [g]:{...graus[g], data:v}})} />
                    <Input label="Loja onde recebeu o grau" value={graus[g].loja} onChange={v => setGraus({...graus, [g]:{...graus[g], loja:v}})} />
                  </div>
                ))}
                <BtnSalvar onClick={salvarGraus} />
              </div>
            )}

            {aba === 4 && (
              <div>
                <Secao titulo="Adicionar grau filosófico" />
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>Grau</label>
                  <select value={novoFilosofico.grau} onChange={e => setNovoFilosofico({...novoFilosofico, grau:e.target.value})}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }}>
                    <option value="">Selecione...</option>
                    <option value="Capitular">Capitular</option>
                    <option value="Filosófico">Filosófico</option>
                    <option value="Areopago">Areopago</option>
                  </select>
                </div>
                <Input label="Loja/Capítulo onde recebeu" value={novoFilosofico.loja} onChange={v => setNovoFilosofico({...novoFilosofico, loja:v})} />
                <Input label="Data de concessão" type="date" value={novoFilosofico.data_concessao} onChange={v => setNovoFilosofico({...novoFilosofico, data_concessao:v})} />
                <Input label="Observações" value={novoFilosofico.observacoes} onChange={v => setNovoFilosofico({...novoFilosofico, observacoes:v})} />
                <button onClick={adicionarFilosofico}
                  style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', fontWeight:700, cursor:'pointer', marginBottom:20 }}>
                  + Adicionar grau filosófico
                </button>
                <Secao titulo="Graus filosóficos cadastrados" />
                {filosoficos.length === 0 ? <p style={{ color:'#94a3b8', textAlign:'center' }}>Nenhum grau filosófico cadastrado.</p> : filosoficos.map(f => (
                  <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#f8fafc', borderRadius:8, marginBottom:8, border:'1px solid #e2e8f0' }}>
                    <div>
                      <p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{f.grau}</p>
                      <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{f.loja} {f.data_concessao ? '· '+new Date(f.data_concessao).toLocaleDateString('pt-BR') : ''}</p>
                    </div>
                    <button onClick={() => removerFilosofico(f.id)} style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:18 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
