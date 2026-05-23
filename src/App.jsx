import TemplatesMensagens from './pages/TemplatesMensagens'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import CadastroPublico from './pages/CadastroPublico'
import Aprovacoes from './pages/Aprovacoes'
import Configuracoes from './pages/Configuracoes'
import Calendario from './pages/Calendario'
import RecuperarSenha from './pages/RecuperarSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import Membros from './pages/Membros'
import PerfilIrmao from './pages/PerfilIrmao'
import EditarPerfil from './pages/EditarPerfil'
import Dashboard from './pages/Dashboard'

function RotaProtegida({ children }) {
  const [sessao, setSessao] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s))
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
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/dashboard" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
        <Route path="/aprovacoes" element={<RotaProtegida><Aprovacoes /></RotaProtegida>} />
        <Route path="/membros" element={<RotaProtegida><Membros /></RotaProtegida>} />
        <Route path="/perfil/:id" element={<RotaProtegida><PerfilIrmao /></RotaProtegida>} />
        <Route path="/editar-perfil" element={<RotaProtegida><EditarPerfil /></RotaProtegida>} />
        <Route path="/configuracoes" element={<RotaProtegida><Configuracoes /></RotaProtegida>} />
        <Route path="/templates-mensagens" element={<RotaProtegida><TemplatesMensagens /></RotaProtegida>} />
          <Route path="/calendario" element={<RotaProtegida><Calendario /></RotaProtegida>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
