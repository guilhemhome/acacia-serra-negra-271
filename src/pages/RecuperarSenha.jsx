import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RecuperarSenha() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function enviarLink() {
    if (!email) { setErro('Digite seu e-mail.'); return }
    setEnviando(true)
    setErro('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://acacia-serra-negra-271.vercel.app/redefinir-senha'
    })
    if (error) setErro('Erro ao enviar: ' + error.message)
    else setEnviado(true)
    setEnviando(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <img src="/logo-acacia.png" alt="Logo" style={{ width:80, height:80, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.5)', objectFit:'cover', display:'block', margin:'0 auto 12px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.6rem', fontWeight:'bold', margin:0 }}>Recuperar Senha</h1>
          <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:14 }}>Acácia de Serra Negra Nº 271</p>
        </div>

        <div style={{ background:'#fff', borderRadius:16, padding:32, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ height:4, background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)', borderRadius:4, marginBottom:24 }} />

          {enviado ? (
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:48, margin:'0 0 16px' }}>📬</p>
              <h2 style={{ color:'#1e293b', fontWeight:700, margin:'0 0 8px' }}>E-mail enviado!</h2>
              <p style={{ color:'#64748b', fontSize:14, margin:'0 0 24px' }}>
                Verifique a caixa de entrada de <strong>{email}</strong> e clique no link para redefinir sua senha.
              </p>
              <p style={{ color:'#94a3b8', fontSize:12, margin:'0 0 24px' }}>
                Não recebeu? Verifique a pasta de spam.
              </p>
              <button onClick={() => navigate('/')}
                style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1a237e,#1565c0)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer' }}>
                Voltar ao Login
              </button>
            </div>
          ) : (
            <>
              <p style={{ color:'#64748b', fontSize:14, margin:'0 0 24px', textAlign:'center' }}>
                Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
              </p>

              {erro && (
                <div style={{ background:'#fee2e2', color:'#dc2626', padding:'10px 14px', borderRadius:8, marginBottom:16, fontSize:14 }}>
                  {erro}
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box', outline:'none' }} />
              </div>

              <button onClick={enviarLink} disabled={enviando}
                style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#1a237e,#1565c0)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', marginBottom:16 }}>
                {enviando ? 'Enviando...' : '📧 Enviar link de recuperação'}
              </button>

              <p onClick={() => navigate('/')}
                style={{ textAlign:'center', color:'#64748b', fontSize:14, cursor:'pointer', margin:0 }}>
                ← Voltar ao login
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
