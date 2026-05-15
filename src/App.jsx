import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import CadastroPublico from './pages/CadastroPublico'
import Aprovacoes from './pages/Aprovacoes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<CadastroPublico />} />
        <Route path="/aprovacoes" element={<Aprovacoes />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App