import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function TemplatesMensagens() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data, error } = await supabase
      .from('mensagens_templates')
      .select('*')
      .order('titulo')
    if (!error) setTemplates(data || [])
    setLoading(false)
  }

  function selecionar(t) {
    setSelecionado(t)
    setTitulo(t.titulo)
    setMensagem(t.mensagem)
    setFeedback(null)
  }

  async function salvar() {
    if (!selecionado) return
    setSalvando(true)
    setFeedback(null)
    const { error } = await supabase
      .from('mensagens_templates')
      .update({ titulo, mensagem, updated_at: new Date().toISOString() })
      .eq('id', selecionado.id)
    if (error) {
      setFeedback({ tipo: 'erro', msg: 'Erro ao salvar: ' + error.message })
    } else {
      setFeedback({ tipo: 'ok', msg: 'Template salvo com sucesso!' })
      await carregar()
      const atualizado = templates.find(t => t.id === selecionado.id)
      if (atualizado) setSelecionado({ ...atualizado, titulo, mensagem })
    }
    setSalvando(false)
  }

  const variaveis = [
    { var: '{nome}', desc: 'Nome do aniversariante' },
    { var: '{data}', desc: 'Data de nascimento' },
    { var: '{loja}', desc: 'Nome da loja' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 60%,#1565c0 100%)', padding:'24px 16px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ position:'relative', textAlign:'center', marginBottom:24 }}>
          <button onClick={() => navigate('/configuracoes')}
            style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:18 }}>←</button>
          <img src="/logo-acacia.png" alt="Logo" style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto 8px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:'bold', margin:0 }}>Templates de Mensagens</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:14 }}>Acácia de Serra Negra Nº 271</p>
        </div>

        {loading ? (
          <div style={{ color:'#fff', textAlign:'center', padding:40 }}>Carregando...</div>
        ) : (
          <>
            {/* Lista de templates */}
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:12, padding:16, marginBottom:20 }}>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:'0 0 12px' }}>Selecione um template para editar:</p>
              {templates.map(t => (
                <div key={t.id} onClick={() => selecionar(t)}
                  style={{ background: selecionado?.id === t.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    border: selecionado?.id === t.id ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
                    borderRadius:10, padding:'12px 16px', marginBottom:8, cursor:'pointer', transition:'all 0.2s' }}>
                  <div style={{ color:'#fff', fontWeight:'bold', fontSize:15 }}>{t.titulo}</div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:2 }}>chave: {t.chave}</div>
                </div>
              ))}
            </div>

            {/* Editor */}
            {selecionado && (
              <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:12, padding:20 }}>
                <h3 style={{ margin:'0 0 16px', color:'#1a237e', fontSize:16 }}>✏️ Editando: {selecionado.titulo}</h3>

                {/* Variáveis disponíveis */}
                <div style={{ background:'#e8f4fd', borderRadius:8, padding:12, marginBottom:16 }}>
                  <p style={{ margin:'0 0 8px', fontSize:13, color:'#1565c0', fontWeight:'bold' }}>📌 Variáveis disponíveis:</p>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {variaveis.map(v => (
                      <span key={v.var} style={{ background:'#1565c0', color:'#fff', borderRadius:6, padding:'3px 10px', fontSize:12, cursor:'pointer' }}
                        onClick={() => setMensagem(m => m + v.var)}
                        title={'Clique para inserir: ' + v.desc}>
                        {v.var} — {v.desc}
                      </span>
                    ))}
                  </div>
                </div>

                <label style={{ display:'block', marginBottom:6, fontWeight:'bold', color:'#333', fontSize:14 }}>Título</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:15, marginBottom:16, boxSizing:'border-box' }} />

                <label style={{ display:'block', marginBottom:6, fontWeight:'bold', color:'#333', fontSize:14 }}>Mensagem</label>
                <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={6}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ccc', fontSize:14, marginBottom:16, boxSizing:'border-box', resize:'vertical', fontFamily:'inherit', lineHeight:1.5 }} />

                {feedback && (
                  <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:12,
                    background: feedback.tipo === 'ok' ? '#e8f5e9' : '#ffebee',
                    color: feedback.tipo === 'ok' ? '#2e7d32' : '#c62828', fontSize:14 }}>
                    {feedback.tipo === 'ok' ? '✅' : '❌'} {feedback.msg}
                  </div>
                )}

                <button onClick={salvar} disabled={salvando}
                  style={{ width:'100%', padding:'12px', borderRadius:10, border:'none',
                    background: salvando ? '#90a4ae' : '#1a237e', color:'#fff', fontSize:16,
                    fontWeight:'bold', cursor: salvando ? 'not-allowed' : 'pointer' }}>
                  {salvando ? 'Salvando...' : '💾 Salvar Template'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
