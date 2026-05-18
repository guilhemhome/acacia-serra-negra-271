import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Aprovacoes() {
  const [cadastros, setCadastros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('Pendente')
  const [selecionado, setSelecionado] = useState(null)
  const [processando, setProcessando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => { buscarCadastros() }, [aba])

  async function buscarCadastros() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('associados')
      .select('*')
      .eq('status_cadastro', aba)
      .order('created_at', { ascending: false })
    if (!error) setCadastros(data || [])
    setCarregando(false)
  }

  async function aprovar(id) {
    setProcessando(true)
    await supabase.from('associados').update({ status_cadastro: 'Aprovado' }).eq('id', id)
    setMensagem('Cadastro aprovado!'); setSelecionado(null); buscarCadastros()
    setProcessando(false); setTimeout(() => setMensagem(''), 3000)
  }

  async function rejeitar(id) {
    setProcessando(true)
    await supabase.from('associados').update({ status_cadastro: 'Rejeitado' }).eq('id', id)
    setMensagem('Cadastro rejeitado.'); setSelecionado(null); buscarCadastros()
    setProcessando(false); setTimeout(() => setMensagem(''), 3000)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding:'24px 16px' }}>
      <div style={{ textAlign:'center', marginBottom:'32px' }}>
        <img src="/logo-acacia.png" alt="Acácia" style={{ width:'72px', height:'72px', objectFit:'contain', marginBottom:'12px' }} />
        <h1 style={{ color:'white', fontSize:'1.8rem', fontWeight:'bold', margin:0 }}>Aprovações de Cadastro</h1>
        <p style={{ color:'rgba(255,255,255,0.7)', marginTop:'4px' }}>Acácia de Serra Negra Nº 271</p>
      </div>
      {mensagem && (
        <div style={{ maxWidth:'600px', margin:'0 auto 16px', background: mensagem.includes('Erro')?'#fee2e2':'#dcfce7', color: mensagem.includes('Erro')?'#991b1b':'#166534', padding:'12px 16px', borderRadius:'12px', textAlign:'center', fontWeight:'600' }}>{mensagem}</div>
      )}
      <div style={{ maxWidth:'700px', margin:'0 auto', background:'white', borderRadius:'24px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ height:'6px', background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
        <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', padding:'0 24px' }}>
          {['Pendente','Aprovado','Rejeitado'].map(s => (
            <button key={s} onClick={() => setAba(s)} style={{ padding:'16px 20px', fontWeight:'600', border:'none', background:'none', cursor:'pointer', color: aba===s?'#1e40af':'#6b7280', borderBottom: aba===s?'2px solid #1e40af':'2px solid transparent', marginBottom:'-1px' }}>{s}</button>
          ))}
        </div>
        <div style={{ padding:'24px' }}>
          {carregando ? (
            <div style={{ textAlign:'center', padding:'40px', color:'#6b7280' }}>Carregando...</div>
          ) : cadastros.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px', color:'#6b7280' }}><div style={{ fontSize:'2.5rem' }}>📭</div>Nenhum cadastro {aba.toLowerCase()} no momento.</div>
          ) : cadastros.map(c => (
            <div key={c.id} onClick={() => setSelecionado(selecionado?.id===c.id?null:c)} style={{ border:'1px solid #e5e7eb', borderRadius:'12px', padding:'16px', cursor:'pointer', background: selecionado?.id===c.id?'#eff6ff':'white', marginBottom:'12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:'700', color:'#111827' }}>{c.nome_completo || '(sem nome)'}</div>
                  <div style={{ color:'#6b7280', fontSize:'0.875rem' }}>{c.email} · {c.id_acacia}</div>
                </div>
                <span style={{ background: aba==='Pendente'?'#fef3c7':aba==='Aprovado'?'#dcfce7':'#fee2e2', color: aba==='Pendente'?'#92400e':aba==='Aprovado'?'#166534':'#991b1b', padding:'4px 12px', borderRadius:'999px', fontSize:'0.8rem', fontWeight:'600' }}>{aba}</span>
              </div>
              {selecionado?.id === c.id && aba === 'Pendente' && (
                <div style={{ marginTop:'16px', borderTop:'1px solid #e5e7eb', paddingTop:'16px', display:'flex', gap:'8px' }}>
                  <button onClick={(e) => { e.stopPropagation(); aprovar(c.id) }} disabled={processando} style={{ flex:1, padding:'10px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'white', fontWeight:'700', cursor:'pointer' }}>✓ Aprovar</button>
                  <button onClick={(e) => { e.stopPropagation(); rejeitar(c.id) }} disabled={processando} style={{ flex:1, padding:'10px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', fontWeight:'700', cursor:'pointer' }}>✗ Rejeitar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
