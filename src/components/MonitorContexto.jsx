import { useState } from 'react'

const VERSAO = '2.1'

const CONTEXTO = `# Projeto Acácia — Contexto v2.1
## ACESSO
- Sistema: https://acacia-serra-negra-271.vercel.app
- Codespace: https://sturdy-zebra-jrwq95jp4v6cpxp.github.dev
- Supabase: acacia-serra-negra-271 (ykgpvkldxirynmnxtopz)

## COLUNAS CRÍTICAS
- tel_celular (não telefone), uf (não estado)
- status_cadastro: minúsculo (pendente/aprovado/rejeitado)
- grau: texto (aprendiz/companheiro/mestre)

## ADM
- Login: douglas.guilhem@gmail.com | UID: f60595b7-9949-4b93-80a7-0cf8185608b7
- Associado: guilhem.home@gmail.com | ID: 69105211-0256-41f8-a94c-c4af376f2875

## CONSTRAINTS ÚNICAS
- associados: cim, cpf, email, id_acacia
- enderecos: (associado_id, tipo)
- historico_graus: (associado_id, grau)
- graus_filosoficos: (associado_id, grau)
- configuracoes: chave
- perfis_acesso: user_id

## ROTAS
/ /cadastro /dashboard /aprovacoes /membros
/perfil/:id /editar-perfil /configuracoes
/recuperar-senha /redefinir-senha

## E-MAIL (SMTP Resend)
- Remetente atual: onboarding@resend.dev
- Futuro: noreply@acacia271.com.br
- DNS pendente Registro.br:
  TXT resend._domainkey → p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDhkRhjt1mgArmO9HGS5vd6MwXF/gqA7tJr2fgsaeQMOf0vgJB/iAfmO/UdV1DM24Ym/DqtG9FW+foLxioTaaJ1KlyDIxG9oXiNLwFv4Unx3FJojkASXNu6jejhtwqfOzWq/Ul9RE3WPMOG6Kh5+51l+5EDW8+54NjDsYRqeRg0bQIDAQAB
  MX send → feedback-smtp.sa-east-1.amazonses.com (10)
  TXT send → v=spf1 include:amazonses.com ~all

## REGRAS CRÍTICAS
1. tel_celular, uf nos campos
2. Status minúsculo
3. Datas: data.split('T')[0].split('-') — nunca new Date()
4. Input/Campo/Secao SEMPRE fora do export default
5. Patches: node /tmp/patch.js — nunca sed com JSX
6. RLS: verificar antes de usar tabela nova
7. Constraints: verificar antes de upsert
8. Rotas novas: adicionar no App.jsx
9. Testar pela Vercel, não Codespace
10. SQL no Supabase, bash no terminal

## PRÓXIMOS MÓDULOS
1. Gerenciamento de cargos/permissões (tela ADM)
2. Controle de presenças
3. Módulo financeiro
4. Calendário e aniversários
5. Apontar acacia271.com.br para Vercel
6. Aplicar restrições de acesso por cargo

## TABELAS NOVAS (v2.1)
- niveis_acesso, cargos, permissoes (com RLS)
- associados.cargo_id → FK cargos
`

export default function MonitorContexto() {
  const [aberto, setAberto] = useState(false)
  const [exportado, setExportado] = useState(false)

  function exportar() {
    const blob = new Blob([CONTEXTO], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contexto-acacia-v${VERSAO}-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    setExportado(true)
    setTimeout(() => setExportado(false), 3000)
  }

  return (
    <div style={{ position:'fixed', bottom:16, right:16, zIndex:9999, fontFamily:'Arial,sans-serif' }}>
      {aberto && (
        <div style={{ background:'#1e293b', color:'#fff', borderRadius:12, padding:16, marginBottom:8, width:230, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:13 }}>📊 Contexto da Sessão</p>
          <p style={{ margin:'0 0 12px', color:'#94a3b8', fontSize:11 }}>
            Exporte o contexto antes de abrir uma nova conversa para não perder o progresso.
          </p>
          <button onClick={exportar}
            style={{ width:'100%', padding:'9px', borderRadius:8, border:'none', background: exportado ? '#16a34a' : '#4f46e5', color:'#fff', fontWeight:700, cursor:'pointer', marginBottom:8, fontSize:13 }}>
            {exportado ? '✅ Exportado!' : '💾 Exportar Contexto'}
          </button>
          <p style={{ margin:0, color:'#475569', fontSize:10, textAlign:'center' }}>
            Acácia 271 — ctx v{VERSAO}
          </p>
        </div>
      )}
      <button onClick={() => setAberto(!aberto)}
        style={{ background:'#1a237e', border:'2px solid rgba(255,255,255,0.3)', borderRadius:'50%', width:44, height:44, cursor:'pointer', fontSize:20, boxShadow:'0 4px 12px rgba(0,0,0,0.3)', display:'block', marginLeft:'auto', color:'white' }}>
        📋
      </button>
    </div>
  )
}
