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

function templateNascimento(nome) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Georgia,serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#1e3a5f,#2d6a9f);padding:36px 32px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">🎂</div>
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px">Feliz Aniversário!</h1>
      <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px">Loja Simbólica Acácia de Serra Negra Nº 271</p>
    </div>
    <div style="padding:32px;text-align:center">
      <p style="font-size:18px;color:#1e3a5f;margin:0 0 16px">Querido Ir. <strong>${nome}</strong>,</p>
      <p style="color:#475569;line-height:1.7;margin:0 0 24px">
        Em nome de toda a família maçônica da Loja Acácia de Serra Negra Nº 271,
        enviamos nossas mais sinceras felicitações neste dia tão especial.
        Que o Grande Arquiteto do Universo ilumine seu caminho com saúde,
        paz e prosperidade.
      </p>
      <div style="background:#f8fafc;border-left:4px solid #2d6a9f;padding:16px 20px;border-radius:0 8px 8px 0;text-align:left;margin-bottom:24px">
        <p style="margin:0;color:#1e3a5f;font-style:italic;font-size:15px">
          "Que a Luz da Maçonaria continue a guiar seus passos por muitos anos."
        </p>
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

function templateCasamento(nome, nomeEsposa, estadoCivil) {
  const tipo = estadoCivil === 'União Estável' ? 'de União' : 'de Casamento'
  const saudacao = nomeEsposa
    ? `Ir. <strong>${nome}</strong> e <strong>${nomeEsposa}</strong>`
    : `Ir. <strong>${nome}</strong>`
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Georgia,serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#1e3a5f,#7c3aed);padding:36px 32px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">💍</div>
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px">Feliz Aniversário ${tipo}!</h1>
      <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px">Loja Simbólica Acácia de Serra Negra Nº 271</p>
    </div>
    <div style="padding:32px;text-align:center">
      <p style="font-size:18px;color:#1e3a5f;margin:0 0 16px">Querido(a) ${saudacao},</p>
      <p style="color:#475569;line-height:1.7;margin:0 0 24px">
        A Loja Acácia de Serra Negra Nº 271 tem a alegria de celebrar
        com vocês este aniversário ${tipo.toLowerCase()}.
        Que o amor, o respeito e a cumplicidade continuem sendo os
        alicerces dessa bela união. Muita saúde e felicidade a vocês!
      </p>
      <div style="background:#faf5ff;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:0 8px 8px 0;text-align:left;margin-bottom:24px">
        <p style="margin:0;color:#4c1d95;font-style:italic;font-size:15px">
          "Uma família unida é a mais bela das construções humanas."
        </p>
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

export default async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const isManual = req.headers.authorization === `Bearer ${CRON_SECRET}`
  if (!isVercelCron && !isManual) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  // Data de hoje no horário de Brasília (UTC-3 = UTC+0 às 11h)
  const agora = new Date()
  const dia = String(agora.getUTCDate()).padStart(2, '0')
  const mes = String(agora.getUTCMonth() + 1).padStart(2, '0')

  const enviados = []
  const erros    = []

  // --- Aniversários de nascimento ---
  const { data: todos } = await supabase
    .from('associados')
    .select('id, nome_completo, email, data_nascimento')
    .eq('status_cadastro', 'aprovado')
    .not('data_nascimento', 'is', null)

  for (const irmao of (todos || [])) {
    const [, m, d] = irmao.data_nascimento.split('T')[0].split('-')
    if (d !== dia || m !== mes) continue
    const nome = irmao.nome_completo.split(' ')[0]
    const ok = await enviarEmail({
      to: irmao.email,
      subject: `🎂 Feliz Aniversário, Ir. ${nome}!`,
      html: templateNascimento(nome)
    })
    ok ? enviados.push(`nascimento: ${irmao.nome_completo}`)
       : erros.push(`nascimento: ${irmao.nome_completo}`)
  }

  // --- Aniversários de casamento ---
  const { data: casados } = await supabase
    .from('associados')
    .select('id, nome_completo, email, data_casamento, estado_civil')
    .eq('status_cadastro', 'aprovado')
    .in('estado_civil', ['Casado', 'União Estável'])
    .not('data_casamento', 'is', null)

  for (const irmao of (casados || [])) {
    const [, m, d] = irmao.data_casamento.split('T')[0].split('-')
    if (d !== dia || m !== mes) continue
    const nome = irmao.nome_completo.split(' ')[0]

    // Buscar esposa na tabela familiares
    const { data: fam } = await supabase
      .from('familiares')
      .select('nome, parentesco')
      .eq('associado_id', irmao.id)
      .or('parentesco.ilike.%esposa%,parentesco.ilike.%cônjuge%,parentesco.ilike.%conjuge%,parentesco.ilike.%companheira%')
      .limit(1)

    const nomeEsposa = fam?.[0]?.nome?.split(' ')[0] || null

    const ok = await enviarEmail({
      to: irmao.email,
      subject: `💍 Feliz Aniversário de Casamento, Ir. ${nome}!`,
      html: templateCasamento(nome, nomeEsposa, irmao.estado_civil)
    })
    ok ? enviados.push(`casamento: ${irmao.nome_completo}`)
       : erros.push(`casamento: ${irmao.nome_completo}`)
  }

  return res.status(200).json({ ok: true, dia, mes, enviados, erros })
}
