import { useState } from 'react'
import { supabase } from '../lib/supabase'

const graus = ['Aprendiz', 'Companheiro', 'Mestre']
const ritos = ['REAA', 'York', 'Emulação', 'Schröder', 'Escocês Retificado', 'Brasileiro']
const tiposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const estadosCivis = ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União Estável']

export default function CadastroPublico() {
  const [etapa, setEtapa] = useState(1)
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    // Maçônico
    cim: '',
    grau_atual: 'Mestre',
    rito: 'REAA',
    data_filiacao: '',
    // Pessoal
    nome_completo: '',
    data_nascimento: '',
    cpf: '',
    rg: '',
    rg_orgao: '',
    cidade_nascimento: '',
    uf_nascimento: '',
    estado_civil: '',
    religiao: '',
    tipo_sanguineo: '',
    // Contato
    email: '',
    tel_celular: '',
    tel_residencial: '',
    // Profissional
    profissao: '',
    formacao: '',
    local_trabalho: '',
  })

  const atualizar = (campo, valor) =>
    setForm(f => ({ ...f, [campo]: valor }))

  const handleSubmit = async () => {
    setErro('')
    if (!form.nome_completo || !form.email || !form.tel_celular) {
      setErro('Por favor preencha nome, e-mail e telefone celular.')
      return
    }
    setCarregando(true)
    const { error } = await supabase.from('associados').insert([{
      ...form,
      loja_atual: 'Acácia de Serra Negra',
      status_cadastro: 'Pendente',
    }])
    setCarregando(false)
    if (error) {
      if (error.code === '23505') {
        setErro('Este e-mail ou CIM já está cadastrado no sistema.')
      } else {
        setErro('Ocorreu um erro ao enviar. Tente novamente.')
      }
    } else {
      setEnviado(true)
    }
  }

  if (enviado) return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Cadastro enviado!</h2>
        <p className="text-gray-600">
          Seu cadastro foi recebido e está aguardando aprovação do Secretário.
          Você receberá um e-mail quando for aprovado.
        </p>
        <p className="mt-4 text-sm text-gray-400">Acácia de Serra Negra Nº 271</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-4">
      <div className="max-w-xl mx-auto">

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <img src="/logo-acacia.png" alt="Acácia" className="w-24 h-24 mx-auto mb-2 rounded-full" />
          <h1 className="text-white text-xl font-bold">Acácia de Serra Negra</h1>
          <p className="text-purple-300 text-sm">Loja Maçônica Nº 271 — GLESP</p>
        </div>

        {/* Indicador de etapas */}
        <div className="flex justify-center gap-2 mb-6">
          {[1,2,3].map(n => (
            <div key={n} className={`h-2 rounded-full transition-all ${
              etapa === n ? 'bg-purple-400 w-8' : 
              etapa > n ? 'bg-green-400 w-8' : 'bg-gray-600 w-4'
            }`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">

          {/* ETAPA 1 — Dados Maçônicos */}
          {etapa === 1 && (
            <div>
              <h2 className="text-lg font-bold text-[#1a1a2e] mb-1">Dados Maçônicos</h2>
              <p className="text-gray-400 text-sm mb-4">Informações da sua situação na Ordem</p>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                CIM Nº <span className="text-gray-400 font-normal">(Cadastro de Identidade Maçônica)</span>
              </label>
              <input className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Ex: 609" value={form.cim}
                onChange={e => atualizar('cim', e.target.value)} />

              <label className="block text-sm font-medium text-gray-700 mb-1">Grau atual</label>
              <select className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.grau_atual} onChange={e => atualizar('grau_atual', e.target.value)}>
                {graus.map(g => <option key={g}>{g}</option>)}
              </select>

              <label className="block text-sm font-medium text-gray-700 mb-1">Rito</label>
              <select className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.rito} onChange={e => atualizar('rito', e.target.value)}>
                {ritos.map(r => <option key={r}>{r}</option>)}
              </select>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de filiação à Acácia
              </label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.data_filiacao} onChange={e => atualizar('data_filiacao', e.target.value)} />

              <button onClick={() => setEtapa(2)}
                className="w-full bg-[#1a1a2e] text-white py-3 rounded-xl font-semibold hover:bg-purple-800 transition">
                Próximo →
              </button>
            </div>
          )}

          {/* ETAPA 2 — Dados Pessoais */}
          {etapa === 2 && (
            <div>
              <h2 className="text-lg font-bold text-[#1a1a2e] mb-1">Dados Pessoais</h2>
              <p className="text-gray-400 text-sm mb-4">Suas informações pessoais</p>

              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
              <input className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Nome completo" value={form.nome_completo}
                onChange={e => atualizar('nome_completo', e.target.value)} />

              <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={form.data_nascimento} onChange={e => atualizar('data_nascimento', e.target.value)} />

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="000.000.000-00" value={form.cpf}
                    onChange={e => atualizar('cpf', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="00.000.000-0" value={form.rg}
                    onChange={e => atualizar('rg', e.target.value)} />
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Órgão Expedidor do RG</label>
              <input className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Ex: SSP-SP" value={form.rg_orgao}
                onChange={e => atualizar('rg_orgao', e.target.value)} />

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                  <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.estado_civil} onChange={e => atualizar('estado_civil', e.target.value)}>
                    <option value="">Selecione</option>
                    {estadosCivis.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Sanguíneo</label>
                  <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.tipo_sanguineo} onChange={e => atualizar('tipo_sanguineo', e.target.value)}>
                    <option value="">Selecione</option>
                    {tiposSanguineos.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1">Religião</label>
              <input className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Ex: Católico" value={form.religiao}
                onChange={e => atualizar('religiao', e.target.value)} />

              <div className="flex gap-3">
                <button onClick={() => setEtapa(1)}
                  className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
                  ← Voltar
                </button>
                <button onClick={() => setEtapa(3)}
                  className="flex-1 bg-[#1a1a2e] text-white py-3 rounded-xl font-semibold hover:bg-purple-800 transition">
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 3 — Contato e Profissional */}
          {etapa === 3 && (
            <div>
              <h2 className="text-lg font-bold text-[#1a1a2e] mb-1">Contato e Profissão</h2>
              <p className="text-gray-400 text-sm mb-4">Como podemos te encontrar</p>

              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
              <input type="email" className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="seu@email.com" value={form.email}
                onChange={e => atualizar('email', e.target.value)} />

              <label className="block text-sm font-medium text-gray-700 mb-1">Celular *</label>
              <input type="tel" className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="(19) 99999-9999" value={form.tel_celular}
                onChange={e => atualizar('tel_celular', e.target.value)} />

              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone residencial</label>
              <input type="tel" className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="(19) 3333-3333" value={form.tel_residencial}
                onChange={e => atualizar('tel_residencial', e.target.value)} />

              <label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label>
              <input className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Ex: Engenheiro" value={form.profissao}
                onChange={e => atualizar('profissao', e.target.value)} />

              <label className="block text-sm font-medium text-gray-700 mb-1">Formação</label>
              <input className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Ex: Engenharia Civil" value={form.formacao}
                onChange={e => atualizar('formacao', e.target.value)} />

              <label className="block text-sm font-medium text-gray-700 mb-1">Local de trabalho</label>
              <input className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Ex: São Paulo" value={form.local_trabalho}
                onChange={e => atualizar('local_trabalho', e.target.value)} />

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
                  {erro}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setEtapa(2)}
                  className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
                  ← Voltar
                </button>
                <button onClick={handleSubmit} disabled={carregando}
                  className="flex-1 bg-purple-700 text-white py-3 rounded-xl font-semibold hover:bg-purple-800 transition disabled:opacity-50">
                  {carregando ? 'Enviando...' : 'Enviar cadastro ✓'}
                </button>
              </div>
            </div>
          )}

        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          Fundada em 15/11/1983 · Serra Negra, SP
        </p>
      </div>
    </div>
  )
}