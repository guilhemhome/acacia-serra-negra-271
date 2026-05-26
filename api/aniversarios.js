import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const RESEND_API_KEY = process.env.RESEND_API_KEY
const CRON_SECRET   = process.env.CRON_SECRET

async function enviarEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Acácia 271 <noreply@acacia271.com.br>', to, subject, html })
  })
  return res.ok
}

function calcularAnos(dataStr, anoAtual) {
  const ano = Number(dataStr.split('T')[0].split('-')[0])
  return anoAtual - ano
}

function nomeBodas(anos) {
  const tabela = {
    1:'Papel', 2:'Algodão', 3:'Couro', 4:'Flores', 5:'Madeira',
    6:'Açúcar', 7:'Lã', 8:'Bronze', 9:'Cerâmica', 10:'Estanho',
    11:'Aço', 12:'Seda', 13:'Renda', 14:'Marfim', 15:'Cristal',
    16:'Turquesa', 17:'Rosa', 18:'Turmalina', 19:'Cobre', 20:'Porcelana',
    21:'Latão', 22:'Bronze', 23:'Safira', 24:'Cetim', 25:'Prata',
    30:'Pérola', 35:'Coral', 40:'Rubi', 45:'Safira', 50:'Ouro',
    55:'Esmeralda', 60:'Diamante', 70:'Brilhante'
  }
  return tabela[anos] || null
}

function montarHtml(cor1, cor2, emoji, titulo, subtitulo, corDestaque, corFundo, corTexto, nome, anos, bodasNome, mensagemTexto, fraseItalico) {
  const bodasHtml = bodasNome
    ? `<div style="background:${corFundo};border-left:4px solid ${corDestaque};padding:16px 20px;border-radius:0 8px 8px 0;text-align:left;margin-bottom:24px">
        <p style="margin:0 0 4px;color:${corTexto};font-weight:bold;font-size:14px">${emoji} Bodas de ${bodasNome}</p>
        <p style="margin:0;color:${corTexto};font-size:13px">Uma data especial merece uma celebração à altura!</p>
      </div>`
    : ''
  const anosHtml = anos
    ? `<p style="font-size:28px;font-weight:bold;color:${corDestaque};margin:0 0 16px">${anos} ${anos === 1 ? 'ano' : 'anos'}!</p>`
    : ''
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Georgia,serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,${cor1},${cor2});padding:36px 32px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">${emoji}</div>
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px">${titulo}</h1>
      <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px">Loja Simbólica Acácia de Serra Negra Nº 271</p>
    </div>
    <div style="padding:32px;text-align:center">
      ${subtitulo}
      ${anosHtml}
      <p style="color:#475569;line-height:1.7;margin:0 0 24px">${mensagemTexto}</p>
      ${bodasHtml}
      <div style="background:#f8fafc;border-left:4px solid ${corDestaque};padding:16px 20px;border-radius:0 8px 8px 0;text-align:left;margin-bottom:24px">
        <p style="margin:0;color:#1e3a5f;font-style:italic;font-size:15px">"${fraseItalico}"</p>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0">
        Com fraternidade e estima,<br>
        <strong style="color:#1e3a5f">Loja Acácia de Serra Negra Nº 271 — GLESP</strong>
      </p>
    </div>
    <div style="background:#f1f5f9;padding:16px;text-align:center">
      <p style="color:#94a3b8;font-size:11px;margin:0">Este é um e-mail automático. Por favor, não responda.</p>
    </div>
  </div>
</body></html>`
}

function aplicarVariaveis(texto, vars) {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, v ?? ''), texto)
}

export default async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const isManual = req.headers.authorization === `Bearer ${CRON_SECRET}`
  if (!isVercelCron && !isManual) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const agora = new Date()
  const dia = String(agora.getUTCDate()).padStart(2, '0')
  const mes = String(agora.getUTCMonth() + 1).padStart(2, '0')
  const anoAtual = agora.getUTCFullYear()
  const enviados = []
  const erros = []

  // Buscar todos os templates do banco
  const { data: templates } = await supabase.from('mensagens_templates').select('chave, titulo, mensagem')
  const tpl = {}
  for (const t of (templates || [])) tpl[t.chave] = t

  // --- Aniversários de nascimento ---
  const { data: todos } = await supabase
    .from('associados').select('id, nome_completo, email, data_nascimento')
    .eq('status_cadastro', 'aprovado').not('data_nascimento', 'is', null)

  for (const irmao of (todos || [])) {
    const [, m, d] = irmao.data_nascimento.split('T')[0].split('-')
    if (d !== dia || m !== mes) continue
    const nome = irmao.nome_completo.split(' ')[0]
    const t = tpl['aniversario_nascimento']
    if (!t) continue
    const vars = { nome }
    const frases = { aniversario_nascimento: 'Que a Luz da Maçonaria continue a guiar seus passos por muitos anos.' }
    const ok = await enviarEmail({
      to: irmao.email,
      subject: aplicarVariaveis(t.titulo, vars),
      html: montarHtml('#1e3a5f','#2d6a9f','🎂','Feliz Aniversário!',
        `<p style="font-size:18px;color:#1e3a5f;margin:0 0 16px">Querido Ir. <strong>${nome}</strong>,</p>`,
        '#2d6a9f','#f8fafc','#1e3a5f', nome, null, null,
        aplicarVariaveis(t.mensagem, vars), frases['aniversario_nascimento'])
    })
    ok ? enviados.push(`nascimento: ${irmao.nome_completo}`) : erros.push(`nascimento: ${irmao.nome_completo}`)
  }

  // --- Aniversários de iniciação ---
  const { data: graus } = await supabase
    .from('historico_graus').select('associado_id, data_concessao')
    .eq('grau', 'aprendiz').not('data_concessao', 'is', null)

  for (const g of (graus || [])) {
    const [, m, d] = g.data_concessao.split('T')[0].split('-')
    if (d !== dia || m !== mes) continue
    const anos = calcularAnos(g.data_concessao, anoAtual)
    if (anos <= 0) continue
    const { data: assoc } = await supabase.from('associados').select('nome_completo, email')
      .eq('id', g.associado_id).eq('status_cadastro', 'aprovado').single()
    if (!assoc) continue
    const nome = assoc.nome_completo.split(' ')[0]
    const bodas = nomeBodas(anos)
    const t = tpl['aniversario_iniciacao']
    if (!t) continue
    const vars = { nome, anos, bodas_subject: bodas ? ` — Bodas de ${bodas}!` : '!', bodas_texto: bodas ? `Este ano você celebra suas Bodas de ${bodas} com a Arte Real!` : '' }
    const ok = await enviarEmail({
      to: assoc.email,
      subject: aplicarVariaveis(t.titulo, vars),
      html: montarHtml('#1e3a5f','#b45309','🔺','Aniversário de Iniciação!',
        `<p style="font-size:18px;color:#1e3a5f;margin:0 0 8px">Querido Ir. <strong>${nome}</strong>,</p>`,
        '#b45309','#fffbeb','#92400e', nome, anos, bodas,
        aplicarVariaveis(t.mensagem, vars), 'A Maçonaria não é um destino — é uma jornada de toda a vida.')
    })
    ok ? enviados.push(`iniciacao ${anos}a: ${assoc.nome_completo}`) : erros.push(`iniciacao: ${assoc.nome_completo}`)
  }

  // --- Aniversários de casamento ---
  const { data: casados } = await supabase
    .from('associados').select('id, nome_completo, email, data_casamento, estado_civil')
    .eq('status_cadastro', 'aprovado').in('estado_civil', ['Casado', 'União Estável'])
    .not('data_casamento', 'is', null)

  for (const irmao of (casados || [])) {
    const [, m, d] = irmao.data_casamento.split('T')[0].split('-')
    if (d !== dia || m !== mes) continue
    const anos = calcularAnos(irmao.data_casamento, anoAtual)
    if (anos <= 0) continue
    const nome = irmao.nome_completo.split(' ')[0]
    const bodas = nomeBodas(anos)
    const { data: fam } = await supabase.from('familiares').select('nome')
      .eq('associado_id', irmao.id)
      .or('parentesco.ilike.%esposa%,parentesco.ilike.%cônjuge%,parentesco.ilike.%conjuge%,parentesco.ilike.%companheira%')
      .limit(1)
    const nomeEsposa = fam?.[0]?.nome?.split(' ')[0] || null
    const t = tpl['aniversario_casamento']
    if (!t) continue
    const tipo = irmao.estado_civil === 'União Estável' ? 'de União' : 'de Casamento'
    const vars = { nome, anos, e_esposa: nomeEsposa ? ` e ${nomeEsposa}` : '', bodas_subject: bodas ? ` — Bodas de ${bodas}!` : '!', bodas_texto: bodas ? `Este ano vocês celebram suas Bodas de ${bodas}!` : '' }
    const ok = await enviarEmail({
      to: irmao.email,
      subject: aplicarVariaveis(t.titulo, vars),
      html: montarHtml('#1e3a5f','#7c3aed',`💍`,`Feliz Aniversário ${tipo}!`,
        `<p style="font-size:18px;color:#1e3a5f;margin:0 0 8px">Querido(a) Ir. <strong>${nome}</strong>${nomeEsposa ? ` e <strong>${nomeEsposa}</strong>` : ''},</p>`,
        '#7c3aed','#fdf4ff','#4c1d95', nome, anos, bodas,
        aplicarVariaveis(t.mensagem, vars), 'Uma família unida é a mais bela das construções humanas.')
    })
    ok ? enviados.push(`casamento ${anos}a: ${irmao.nome_completo}`) : erros.push(`casamento: ${irmao.nome_completo}`)
  }

  return res.status(200).json({ ok: true, dia, mes, anoAtual, enviados, erros })
}
