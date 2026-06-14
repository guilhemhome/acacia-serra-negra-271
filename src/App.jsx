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
import Oficiais from './pages/Oficiais'

const PERFIS_MEMBRO = ['Membro', 'Ritualística', 'Hospitalaria']

function RotaProtegida({ children, modulo, apenasAdm }) {
  const [sessao, setSessao] = useState(undefined)
  const [perfil, setPerfil] = useState(undefined)
  const [nivel, setNivel] = useState(undefined)

  useEffect(() => {
    async function verificar() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSessao(session)
        if (!session) { setPerfil(null); setNivel(null); return }
        const { data: p } = await supabase.from('perfis_acesso')
          .select('perfil').eq('user_id', session.user.id).maybeSingle()
        const perfilAtual = p?.perfil || 'Membro'
        setPerfil(perfilAtual)
        if (perfilAtual === 'ADM') { setNivel('total'); return }
        if (!modulo) { setNivel('total'); return }
        const { data: perm } = await supabase.from('permissoes_perfil')
          .select('nivel').eq('perfil', perfilAtual).eq('modulo', modulo).maybeSingle()
        setNivel(perm?.nivel || 'bloqueado')
      } catch(e) {
        console.error('RotaProtegida erro:', e.message)
        setSessao(s => s === undefined ? null : s)
        setPerfil(p => p === undefined ? 'Membro' : p)
        setNivel(n => n === undefined ? 'bloqueado' : n)
      }
    }
    verificar()

    const { data: listener } = supabase.auth.onAuthStateChange(() => verificar())
    return () => listener.subscription.unsubscribe()
  }, [modulo])

  if (sessao === undefined || perfil === undefined || nivel === undefined) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white', fontSize:'1.2rem' }}>Carregando...</div>
    </div>
  )

  if (!sessao) return <Navigate to="/" replace />

  if (apenasAdm && perfil !== 'ADM') {
    return <Navigate to={PERFIS_MEMBRO.includes(perfil) ? '/membro' : '/dashboard'} replace />
  }

  if (modulo && nivel === 'bloqueado') {
    return <Navigate to={PERFIS_MEMBRO.includes(perfil) ? '/membro' : '/dashboard'} replace />
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
        <Route path="/membro" element={<RotaProtegida modulo="/membro"><PortalMembro /></RotaProtegida>} />
        <Route path="/oficiais" element={<RotaProtegida><Oficiais /></RotaProtegida>} />

        {/* Rotas para todos os perfis logados */}
        <Route path="/editar-perfil" element={<RotaProtegida modulo="/editar-perfil"><EditarPerfil /></RotaProtegida>} />
        <Route path="/calendario" element={<RotaProtegida modulo="/calendario"><Calendario /></RotaProtegida>} />
        <Route path="/perfil/:id" element={<RotaProtegida modulo="/perfil/:id"><PerfilIrmao /></RotaProtegida>} />

        {/* Rotas por permissao no banco */}
        <Route path="/dashboard" element={<RotaProtegida modulo="/dashboard"><Dashboard /></RotaProtegida>} />
        <Route path="/aprovacoes" element={<RotaProtegida modulo="/aprovacoes"><Aprovacoes /></RotaProtegida>} />
        <Route path="/membros" element={<RotaProtegida modulo="/membros"><Membros /></RotaProtegida>} />
        <Route path="/templates-mensagens" element={<RotaProtegida modulo="/templates-mensagens"><TemplatesMensagens /></RotaProtegida>} />
        <Route path="/gestao-cargos" element={<RotaProtegida apenasAdm><GestaoCargos /></RotaProtegida>} />

        {/* Configuracoes somente ADM */}
        <Route path="/configuracoes" element={<RotaProtegida apenasAdm><Configuracoes /></RotaProtegida>} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
