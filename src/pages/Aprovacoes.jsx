import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const statusCores = {
  Pendente: 'bg-yellow-100 text-yellow-800',
  Aprovado: 'bg-green-100 text-green-800',
  Rejeitado: 'bg-red-100 text-red-800',
}

export default function Aprovacoes() {
  const [associados, setAssociados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('Pendente')
  const [selecionado, setSelecionado] = useState(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => { buscarAssociados() }, [filtro])

  const buscarAssociados = async () => {
    setCarregando(true)
    const { data } = await supabase
      .from('associados')
      .select('*')
      .eq('status_cadastro', filtro)
      .order('created_at', { ascending: false })
    setAssociados(data || [])
    setCarregando(false)
  }

  const atualizarStatus = async (id, novoStatus) => {
    setProcessando(true)
    await supabase
      .from('associados')
      .update({ status_cadastro: novoStatus })
      .eq('id', id)
    setProcessando(false)
    setSelecionado(null)
    buscarAssociados()
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Cabeçalho */}
      <div className="bg-[#1a1a2e] text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <span className="text-2xl">⚜️</span>
          <div>
            <h1 className="font-bold text-lg">Aprovações de Cadastro</h1>
            <p className="text-purple-300 text-sm">Acácia de Serra Negra Nº 271</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {['Pendente', 'Aprovado', 'Rejeitado'].map(s => (
            <button key={s}
              onClick={() => setFiltro(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filtro === s
                  ? 'bg-[#1a1a2e] text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* Lista */}
        {carregando ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : associados.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400">Nenhum cadastro {filtro.toLowerCase()} no momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {associados.map(a => (
              <div key={a.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-purple-200 transition"
                onClick={() => setSelecionado(a)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{a.nome_completo || 'Nome não informado'}</p>
                    <p className="text-sm text-gray-500">{a.email}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      {a.cim && <span>CIM: {a.cim}</span>}
                      <span>{a.grau_atual}</span>
                      <span>{a.tel_celular}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusCores[a.status_cadastro]}`}>
                      {a.status_cadastro}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalhe */}
      {selecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setSelecionado(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="bg-[#1a1a2e] text-white px-6 py-4 rounded-t-2xl">
              <h2 className="font-bold text-lg">{selecionado.nome_completo}</h2>
              <p className="text-purple-300 text-sm">{selecionado.grau_atual} · CIM {selecionado.cim || '—'}</p>
            </div>

            <div className="p-6 space-y-3">
              {[
                ['E-mail', selecionado.email],
                ['Celular', selecionado.tel_celular],
                ['CPF', selecionado.cpf],
                ['RG', selecionado.rg],
                ['Nascimento', selecionado.data_nascimento
                  ? new Date(selecionado.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')
                  : '—'],
                ['Cidade natal', selecionado.cidade_nascimento],
                ['Estado civil', selecionado.estado_civil],
                ['Tipo sanguíneo', selecionado.tipo_sanguineo],
                ['Profissão', selecionado.profissao],
                ['Formação', selecionado.formacao],
                ['Local de trabalho', selecionado.local_trabalho],
                ['Religião', selecionado.religiao],
                ['Rito', selecionado.rito],
                ['Filiação', selecionado.data_filiacao
                  ? new Date(selecionado.data_filiacao + 'T00:00:00').toLocaleDateString('pt-BR')
                  : '—'],
              ].map(([label, valor]) => valor ? (
                <div key={label} className="flex justify-between text-sm border-b pb-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{valor}</span>
                </div>
              ) : null)}
            </div>

            {selecionado.status_cadastro === 'Pendente' && (
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => atualizarStatus(selecionado.id, 'Rejeitado')}
                  disabled={processando}
                  className="flex-1 border-2 border-red-300 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition disabled:opacity-50">
                  ✗ Rejeitar
                </button>
                <button
                  onClick={() => atualizarStatus(selecionado.id, 'Aprovado')}
                  disabled={processando}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50">
                  ✓ Aprovar
                </button>
              </div>
            )}

            {selecionado.status_cadastro !== 'Pendente' && (
              <div className="px-6 pb-6">
                <button onClick={() => setSelecionado(null)}
                  className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}