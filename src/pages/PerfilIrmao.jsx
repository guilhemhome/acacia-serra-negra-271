import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PerfilIrmao() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [irmao, setIrmao] = useState(null)
  const [familiares, setFamiliares] = useState([])
  const [enderecos, setEnderecos] = useState([])
  const [graus, setGraus] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/'); return }
      const [{ data: a }, { data: f }, { data: e }, { data: g }] = await Promise.all([
        supabase.from('associados').select('*').eq('id', id).single(),
        supabase.from('familiares').select('*').eq('associado_id', id),
        supabase.from('enderecos').select('*').eq('associado_id', id),
        supabase.from('historico_graus').select('*').eq('associado_id', id).order('data_concessao'),
      ])
      if (a) setIrmao(a)
      setFamiliares(f || [])
      setEnderecos(e || [])
      setGraus(g || [])
      setCarregando(false)
    }
    carregar()
  }, [id])

  const STATUS = {
    aprovado: { label: 'Aprovado', color: '#16a34a', bg: '#dcfce7' },
    pendente: { label: 'Pendente', color: '#d97706', bg: '#fef9c3' },
    rejeitado: { label: 'Rejeitado', color: '#dc2626', bg: '#fee2e2' },
  }
  const GRAUS = { aprendiz: 'Aprendiz', companheiro: 'Companheiro', mestre: 'Mestre Maçom' }

  function fmt(data) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }
  function Campo({ label, valor }) {
    return (
      <div style={{ marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#1e293b' }}>{valor || '—'}</p>
      </div>
    )
  }
  function Secao({ titulo }) {
    return (
      <>
        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />
        <p style={{ margin: '0 0 16px', fontWeight: 700, color: '#4f46e5', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{titulo}</p>
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a237e 0%,#283593 50%,#1565c0 100%)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: 24 }}>
          <button onClick={() => navigate('/membros')} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 14px', cursor: 'pointer', fontSize: 18 }}>←</button>
          <img src="/logo-acacia.png" alt="Logo" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', objectFit: 'cover', display: 'block', margin: '0 auto 8px' }} />
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>Perfil do Irmão</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: 14 }}>Acácia de Serra Negra Nº 271</p>
        </div>
        {carregando ? <p style={{ textAlign: 'center', color: '#fff' }}>Carregando...</p> : !irmao ? <p style={{ textAlign: 'center', color: '#fff' }}>Irmão não encontrado.</p> : (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ height: 4, background: 'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)' }} />
            <div style={{ padding: 24, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 24, flexShrink: 0 }}>
                {irmao.nome_completo?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' }}>{irmao.nome_completo}</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>{irmao.email}</p>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: STATUS[irmao.status_cadastro]?.color, background: STATUS[irmao.status_cadastro]?.bg }}>
                {STATUS[irmao.status_cadastro]?.label}
              </span>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ margin: '0 0 16px', fontWeight: 700, color: '#4f46e5', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Dados Pessoais</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                <Campo label="Telefone" valor={irmao.tel_celular} />
                <Campo label="Data de Nascimento" valor={fmt(irmao.data_nascimento)} />
                <Campo label="CPF" valor={irmao.cpf} />
                <Campo label="Profissão" valor={irmao.profissao} />
                <Campo label="Nome do Pai" valor={irmao.nome_pai} />
                <Campo label="Nome da Mãe" valor={irmao.nome_mae} />
              </div>
              <Secao titulo="Dados Maçônicos" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                <Campo label="CIM Nº" valor={irmao.cim} />
                <Campo label="Rito" valor={irmao.rito} />
                <Campo label="ID Acácia" valor={irmao.id_acacia} />
                <Campo label="Data de Filiação" valor={fmt(irmao.data_filiacao)} />
              </div>
              {graus.length > 0 && (<>
                <Secao titulo="Histórico de Graus" />
                {graus.map((g, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{GRAUS[g.grau] || g.grau}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{g.loja}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{fmt(g.data_concessao)}</p>
                  </div>
                ))}
              </>)}
              {enderecos.length > 0 && (<>
                <Secao titulo="Endereços" />
                {enderecos.map((e, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{e.tipo}</p>
                    <p style={{ margin: 0, fontSize: 14, color: '#1e293b' }}>{e.logradouro}, {e.numero} {e.complemento && `— ${e.complemento}`}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{e.bairro} — {e.cidade}/{e.uf} — CEP {e.cep}</p>
                  </div>
                ))}
              </>)}
              {familiares.length > 0 && (<>
                <Secao titulo="Familiares" />
                {familiares.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{f.nome}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{f.parentesco}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{fmt(f.data_nascimento)}</p>
                  </div>
                ))}
              </>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
