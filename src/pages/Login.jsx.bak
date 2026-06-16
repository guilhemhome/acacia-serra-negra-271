import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const bg = {background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)'}
const inp = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50'

export default function Login() {
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  function formatCpf(v) {
    return v.replace(/\D/g,'').slice(0,11)
      .replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d)/,'$1.$2')
      .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    try {
      const cpfLimpo = cpf.replace(/\D/g,'')
      if (cpfLimpo.length !== 11) {
        setErro('CPF inválido.')
        setCarregando(false)
        return
      }
      // Buscar email pelo CPF
      const { data: assocData, error: assocErr } = await supabase
        .from('associados').select('id, email, user_id').eq('cpf', cpfLimpo).single()
      if (assocErr || !assocData?.email) {
        setErro('CPF não encontrado.')
        setCarregando(false)
        return
      }
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: assocData.email, password: senha
      })
      if (authErr) {
        setErro('Senha incorreta.')
        setCarregando(false)
        return
      }
      const uid = authData.user.id
      // Vincular user_id se necessário
      if (!assocData.user_id) {
        supabase.from('associados').update({ user_id: uid }).eq('id', assocData.id)
      }
      const { data: p } = await supabase.from('perfis_acesso').select('perfil').eq('user_id', uid).single()
      const perfil = p?.perfil || 'Membro'
      const perfisMembro = ['Membro', 'Ritualística', 'Hospitalaria']
      navigate(perfisMembro.includes(perfil) ? '/membro' : '/dashboard')
    } catch(err) {
      setErro('Erro inesperado. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={bg}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <img src="/logo-acacia.png" alt="Acácia"
            className="w-28 h-28 mx-auto mb-4 rounded-full shadow-lg border-4 border-white/30"/>
          <h1 style={{color:'white', fontSize:'1.8rem', fontWeight:'bold'}}>Acácia de Serra Negra</h1>
          <p className="text-blue-200 text-sm mt-1">Loja Maçônica Nº 271 — GLESP</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"/>
          <div className="p-6">

            <h2 className="text-xl font-bold text-gray-800 mb-1">Entrar</h2>
            <p className="text-gray-500 text-sm mb-5">Acesse o sistema da loja</p>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={inp}
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={e => setCpf(formatCpf(e.target.value))}
                  maxLength={14}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    className={inp}
                    placeholder="••••••••"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8', padding: 0, lineHeight: 1 }}>
                    {mostrarSenha ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 mt-2">
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-4 cursor-pointer hover:text-gray-600">
              <span onClick={() => navigate('/recuperar-senha')} style={{ cursor:'pointer', color:'#6366f1' }}>Esqueci minha senha</span>
            </p>

          </div>
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-6">
          Fundada em 15/11/1983 · Serra Negra, SP
        </p>
      </div>
    </div>
  )
}
