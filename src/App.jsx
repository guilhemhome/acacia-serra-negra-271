import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import CadastroPublico from './pages/CadastroPublico'
import Aprovacoes from './pages/Aprovacoes'

function RotaProtegida({ children }) {
  const [sessao, setSessao] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (sessao === undefined) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white', fontSize:'1.2rem' }}>Carregando...</div>
    </div>
  )

  return sessao ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<CadastroPublico />} />
        <Route path="/aprovacoes" element={
          <RotaProtegida>
            <Aprovacoes />
          </RotaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
