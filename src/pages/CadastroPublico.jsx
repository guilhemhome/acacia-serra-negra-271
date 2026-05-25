import { useState } from 'react'
import { DateInput } from '../components/DateInput'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'



const graus = ['Aprendiz', 'Companheiro', 'Mestre']
const ritos = ['REAA', 'York', 'Emulação', 'Schröder', 'Escocês Retificado', 'Brasileiro']
const tipos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const civis = ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União Estável']
const inp = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50'
const bg = {background:'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)'}

function Campo({label, children}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function CadastroPublico() {
  const navigate = useNavigate()
  const [etapa, setEtapa] = useState(1)
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    cim:'', grau_atual:'Mestre', rito:'REAA', data_filiacao:'',
    nome_completo:'', data_nascimento:'', cpf:'', rg:'', rg_orgao:'',
    estado_civil:'', religiao:'', tipo_sanguineo:'',
    email:'', tel_celular:'',
    profissao:'', formacao:'', local_trabalho:'',
  })

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const submit = async () => {
    setErro('')
    if (!form.nome_completo || !form.email || !form.tel_celular) {
      setErro('Preencha nome, e-mail e celular.'); return
    }
    setCarregando(true)
    await supabase.auth.signInAnonymously();
    const {error} = await supabase.from('associados').insert([{
      ...form, loja_atual: 'Acácia de Serra Negra', status_cadastro: 'pendente'
    }])
    setCarregando(false)
    if (error) { setErro(error.code === '23505' ? 'E-mail ou CIM já cadastrado.' : 'Erro ao enviar.') }
    else { setEnviado(true) }
  }

  if (enviado) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={bg}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Cadastro enviado!</h2>
        <p className="text-gray-500 text-sm">Aguardando aprovação do Secretário.</p>
        <p className="text-xs text-gray-400 mt-6 pt-4 border-t">Acácia de Serra Negra Nº 271 · GLESP</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={bg}>
      <div className="max-w-lg mx-auto px-4 py-8">

        <div className="text-center mb-6">
          <img src="/logo-acacia.png" alt="Acácia" className="w-28 h-28 mx-auto mb-4 rounded-full shadow-lg border-4 border-white/30"/>
          <h1 style={{color:'white', fontSize:'1.8rem', fontWeight:'bold'}}>Acácia de Serra Negra</h1>
          <p className="text-blue-200 text-sm mt-1">Loja Maçônica Nº 271 — GLESP</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[1,2,3].map(n => (
            <div key={n} className={`h-2 rounded-full transition-all ${etapa===n ? 'bg-white w-10' : etapa>n ? 'bg-green-400 w-6' : 'bg-white/30 w-6'}`}/>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"/>
          <div className="p-6">

            {etapa === 1 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Dados Maçônicos</h2>
                <p className="text-gray-500 text-sm mb-5">Sua situação na Ordem</p>

                <Campo label="CIM Nº — Cadastro de Identidade Maçônica">
                  <input className={inp} placeholder="Ex: 609"
                    value={form.cim} onChange={e => set('cim', e.target.value)}/>
                </Campo>

                <Campo label="Grau atual">
                  <select className={inp} value={form.grau_atual} onChange={e => set('grau_atual', e.target.value)}>
                    {graus.map(g => <option key={g}>{g}</option>)}
                  </select>
                </Campo>

                <Campo label="Rito">
                  <select className={inp} value={form.rito} onChange={e => set('rito', e.target.value)}>
                    {ritos.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Campo>

                <Campo label="Data de filiação à Acácia">
                  <DateInput className={inp} value={form.data_filiacao} onChange={v => set('data_filiacao', v)}/>
                </Campo>

                <button onClick={() => setEtapa(2)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg mt-2">
                  Próximo →
                </button>
              </div>
            )}

            {etapa === 2 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Dados Pessoais</h2>
                <p className="text-gray-500 text-sm mb-5">Suas informações pessoais</p>

                <Campo label="Nome completo *">
                  <input className={inp} placeholder="Seu nome completo"
                    value={form.nome_completo} onChange={e => set('nome_completo', e.target.value)}/>
                </Campo>

                <Campo label="Data de nascimento">
                  <DateInput className={inp} value={form.data_nascimento} onChange={v => set('data_nascimento', v)}/>
                </Campo>

                <div className="grid grid-cols-2 gap-3">
                  <Campo label="CPF">
                    <input className={inp} placeholder="000.000.000-00" value={form.cpf} onChange={e => set('cpf', e.target.value)}/>
                  </Campo>
                  
                </div>

                

                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Estado Civil">
                    <select className={inp} value={form.estado_civil} onChange={e => set('estado_civil', e.target.value)}>
                      <option value="">Selecione</option>
                      {civis.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Campo>
                  <Campo label="Tipo Sanguíneo">
                    <select className={inp} value={form.tipo_sanguineo} onChange={e => set('tipo_sanguineo', e.target.value)}>
                      <option value="">Selecione</option>
                      {tipos.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Campo>
                </div>

                

                <div className="flex gap-3 mt-2">
                  <button onClick={() => setEtapa(1)} className="flex-1 border-2 border-gray-200 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-50 transition">← Voltar</button>
                  <button onClick={() => setEtapa(3)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold transition shadow-lg">Próximo →</button>
                </div>
              </div>
            )}

            {etapa === 3 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Contato e Profissão</h2>
                <p className="text-gray-500 text-sm mb-5">Como podemos te encontrar</p>

                <Campo label="E-mail *">
                  <input type="email" className={inp} placeholder="seu@email.com"
                    value={form.email} onChange={e => set('email', e.target.value)}/>
                </Campo>

                <Campo label="Celular *">
                  <input type="tel" className={inp} placeholder="(19) 99999-9999"
                    value={form.tel_celular} onChange={e => set('tel_celular', e.target.value)}/>
                </Campo>

                

                <Campo label="Profissão">
                  <input className={inp} placeholder="Ex: Engenheiro"
                    value={form.profissao} onChange={e => set('profissao', e.target.value)}/>
                </Campo>

                <Campo label="Formação">
                  <input className={inp} placeholder="Ex: Engenharia Civil"
                    value={form.formacao} onChange={e => set('formacao', e.target.value)}/>
                </Campo>

                <Campo label="Local de trabalho">
                  <input className={inp} placeholder="Ex: São Paulo"
                    value={form.local_trabalho} onChange={e => set('local_trabalho', e.target.value)}/>
                </Campo>

                {erro && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">{erro}</div>
                )}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => setEtapa(2)} className="flex-1 border-2 border-gray-200 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-50 transition">← Voltar</button>
                  <button onClick={submit} disabled={carregando} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold transition shadow-lg disabled:opacity-50">
                    {carregando ? 'Enviando...' : 'Enviar cadastro'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-6">Fundada em 15/11/1983 · Serra Negra, SP</p>
            <p onClick={() => navigate('/')} style={{ color:'rgba(255,255,255,0.7)', fontSize:13, cursor:'pointer', marginTop:8 }}>Já tem cadastro? <span style={{ color:'#fff', fontWeight:600, textDecoration:'underline' }}>Entrar</span></p>
      </div>
    </div>
  )
}
