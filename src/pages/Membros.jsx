import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STATUS_LABELS = {
  aprovado: { label: 'Aprovado', color: '#16a34a', bg: '#dcfce7' },
  pendente: { label: 'Pendente', color: '#d97706', bg: '#fef9c3' },
  rejeitado: { label: 'Rejeitado', color: '#dc2626', bg: '#fee2e2' },
}

const FILTROS = ['todos', 'aprovado', 'pendente', 'rejeitado']

export default function Membros() {
  const navigate = useNavigate()
  const [membros, setMembros] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function verificarLogin() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/'); return }
      buscarMembros()
    }
    verificarLogin()
  }, [])

  async function buscarMembros() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('associados')
      .select('*')
      .order('nome_completo', { ascending: true })
    if (!error) setMembros(data || [])
    setCarregando(false)
  }

  const membrosFiltrados = membros.filter(m => {
    const nomeOk = m.nome_completo?.toLowerCase().includes(busca.toLowerCase())
    const statusOk = filtroStatus === 'todos' || m.status_cadastro === filtroStatus
    return nomeOk && statusOk
  })

  const contagem = {
    todos: membros.length,
    aprovado: membros.filter(m => m.status_cadastro === 'aprovado').length,
    pendente: membros.filter(m => m.status_cadastro === 'pendente').length,
    rejeitado: membros.filter(m => m.status_cadastro === 'rejeitado').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ position: 'relative', textAlign: 'center', marginBottom: 24 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 14px', cursor: 'pointer', fontSize: 18 }}>
            ←
          </button>
          <img src="/logo-acacia.png" alt="Logo Acácia" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', objectFit: 'cover', display: 'block', margin: '0 auto 8px' }} />
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>Irmãos da Loja</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: 14 }}>Acácia de Serra Negra Nº 271</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ height: 4, background: 'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
          <div style={{ padding: 24 }}>

            <input
              type="text"
              placeholder="🔍  Buscar por nome..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 15, marginBottom: 16, boxSizing: 'border-box', outline: 'none' }}
            />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {FILTROS.map(f => (
                <button key={f} onClick={() => setFiltroStatus(f)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, border: '1.5px solid',
                    borderColor: filtroStatus === f ? '#4f46e5' : '#e2e8f0',
                    background: filtroStatus === f ? '#4f46e5' : '#f8fafc',
                    color: filtroStatus === f ? '#fff' : '#475569',
                    fontWeight: filtroStatus === f ? 600 : 400,
                    cursor: 'pointer', fontSize: 13
                  }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({contagem[f]})
                </button>
              ))}
            </div>

            {carregando ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Carregando irmãos...</p>
            ) : membrosFiltrados.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Nenhum irmão encontrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {membrosFiltrados.map(m => {
                  const st = STATUS_LABELS[m.status_cadastro] || STATUS_LABELS['pendente']
                  return (
                    <div key={m.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }} onClick={() => navigate(`/perfil/${m.id}`)}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(79,70,229,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                          {m.nome_completo?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: '#1e293b', fontSize: 15 }}>{m.nome_completo}</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{m.email}</p>
                        </div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
