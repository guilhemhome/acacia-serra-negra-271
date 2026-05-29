import TemplatesMensagens from './pages/TemplatesMensagens'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import CadastroPublico from './pages/CadastroPublico'
import Aprovacoes from './pages/Aprovacoes'
import Configuracoes from './pages/Configuracoes'
import Calendario from './pages/Calendario'
import GestaoCargos from './pages/GestaoCargos'
import RecuperarSenha from './pages/RecuperarSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import Membros from './pages/Membros'
import PerfilIrmao from './pages/PerfilIrmao'
import EditarPerfil from './pages/EditarPerfil'
import Dashboard from './pages/Dashboard'
import PortalMembro from './pages/PortalMembro'

const PERFIS_ADM = ['ADM', 'Total', 'Venerável Mestre', 'Administrativo', 'Financeiro', 'Hospitalaria', 'Ritualística']
const PERFIS_GESTAO = ['ADM', 'Total', 'Venerável Mestre', 'Administrativo']
const PERFIS_CARGOS = ['ADM', 'Venerável Mestre']

function RotaProtegida({ children, perfisPermitidos }) {
  const [sessao, setSessao] = useState(undefined)
  const [perfil, setPerfil] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSessao(data.session)
      if (data.session) {
        const { data: p } = await supabase.from('perfis_acesso')
          .select('perfil').eq('user_id', data.session.user.id).single()
        setPerfil(p?.perfil || 'Membro')
      } else {
        setPerfil(null)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSessao(s)
      if (s) {
        const { data: p } = await supabase.from('perfis_acesso')
          .select('perfil').eq('user_id', s.user.id).single()
        setPerfil(p?.perfil || 'Membro')
      } else {
        setPerfil(null)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (sessao === undefined || perfil === undefined) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white', fontSize:'1.2rem' }}>Carregando...</div>
    </div>
  )

  if (!sessao) return <Navigate to="/" replace />

  if (perfisPermitidos && !perfisPermitidos.includes(perfil)) {
    // Membro vai para portal, resto vai para dashboard
    return <Navigate to={PERFIS_ADM.includes(perfil) ? '/dashboard' : '/membro'} replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<CadastroPublico />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />

        {/* Portal do Membro */}
        <Route path="/membro" element={<RotaProtegida><PortalMembro /></RotaProtegida>} />

        {/* Rotas para todos os perfis logados */}
        <Route path="/editar-perfil" element={<RotaProtegida><EditarPerfil /></RotaProtegida>} />
        <Route path="/calendario" element={<RotaProtegida><Calendario /></RotaProtegida>} />
        <Route path="/perfil/:id" element={<RotaProtegida><PerfilIrmao /></RotaProtegida>} />

        {/* Rotas restritas a perfis ADM+ */}
        <Route path="/dashboard" element={<RotaProtegida perfisPermitidos={PERFIS_ADM}><Dashboard /></RotaProtegida>} />
        <Route path="/aprovacoes" element={<RotaProtegida perfisPermitidos={PERFIS_GESTAO}><Aprovacoes /></RotaProtegida>} />
        <Route path="/membros" element={<RotaProtegida perfisPermitidos={PERFIS_ADM}><Membros /></RotaProtegida>} />
        <Route path="/configuracoes" element={<RotaProtegida perfisPermitidos={PERFIS_GESTAO}><Configuracoes /></RotaProtegida>} />
        <Route path="/templates-mensagens" element={<RotaProtegida perfisPermitidos={PERFIS_GESTAO}><TemplatesMensagens /></RotaProtegida>} />
        <Route path="/gestao-cargos" element={<RotaProtegida perfisPermitidos={PERFIS_CARGOS}><GestaoCargos /></RotaProtegida>} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
