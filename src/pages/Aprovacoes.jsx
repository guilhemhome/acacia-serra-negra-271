import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Aprovacoes() {
  const navigate = useNavigate()
  const [cadastros, setCadastros] = useState([])
  const [aba, setAba] = useState('Pendente')
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [processando, setProcessando] = useState(null)

  useEffect(() => {
    async function verificarLogin() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/'); return }
      buscarCadastros()
    }
    verificarLogin()
  }, [])

  async function buscarCadastros() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('associados')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setCadastros(data || [])
    setCarregando(false)
  }

  async function aprovar(id) {
    setProcessando(id)
    const { error } = await supabase
      .from('associados')
      .update({ status_cadastro: 'aprovado' })
      .eq('id', id)
    if (error) setMensagem('Erro ao aprovar.')
    else { setMensagem('Cadastro aprovado!'); buscarCadastros() }
    setProcessando(null)
    setTimeout(() => setMensagem(''), 3000)
  }

  async function rejeitar(id) {
    setProcessando(id)
    const { error } = await supabase
      .from('associados')
      .update({ status_cadastro: 'rejeitado' })
      .eq('id', id)
    if (error) setMensagem('Erro ao rejeitar.')
    else { setMensagem('Cadastro rejeitado.'); buscarCadastros() }
    setProcessando(null)
    setTimeout(() => setMensagem(''), 3000)
  }

  const filtrados = cadastros.filter(c => c.status_cadastro === aba.toLowerCase())

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding: '24px 16px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        <div style={{ position: 'relative', textAlign: 'center', marginBottom: 24 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 14px', cursor: 'pointer', fontSize: 18 }}>
            ←
          </button>
          <img src="/logo-acacia.png" alt="Logo Acácia" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', objectFit: 'cover', display: 'block', margin: '0 auto 8px' }} />
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>Aprovações de Cadastro</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: 14 }}>Acácia de Serra Negra Nº 271</p>
        </div>

        {mensagem && (
          <div style={{ marginBottom: 16, background: mensagem.includes('Erro') ? '#fee2e2' : '#dcfce7', color: mensagem.includes('Erro') ? '#991b1b' : '#166534', padding: '12px 16px', borderRadius: 12, textAlign: 'center', fontWeight: 600 }}>
            {mensagem}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ height: 6, background: 'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
            {['Pendente', 'Aprovado', 'Rejeitado'].map(s => (
              <button key={s} onClick={() => setAba(s)} style={{ padding: '16px 20px', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: aba === s ? '#1e40af' : '#6b7280', borderBottom: aba === s ? '2px solid #1e40af' : '2px solid transparent', marginBottom: -1 }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>
            {carregando ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Carregando...</div>
            ) : filtrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: '2.5rem' }}>📭</div>
                Nenhum cadastro {aba.toLowerCase()} no momento.
              </div>
            ) : (
              filtrados.map(c => (
                <div key={c.id} style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: '0 0 4px' }}>{c.nome_completo}</p>
                      <p style={{ color: '#6b7280', margin: '0 0 2px', fontSize: '0.9rem' }}>{c.email}</p>
                      <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>{c.telefone}</p>
                    </div>
                    {aba === 'Pendente' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); aprovar(c.id) }} disabled={processando === c.id}
                          style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                          ✓ Aprovar
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); rejeitar(c.id) }} disabled={processando === c.id}
                          style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                          ✗ Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
