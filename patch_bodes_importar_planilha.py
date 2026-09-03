import shutil

arquivo = 'src/pages/BodesAsfalto.jsx'
shutil.copy(arquivo, arquivo + '.bak2')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

# --- Patch 1: import da lib xlsx ---
antigo_1 = """import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'"""
novo_1 = """import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'"""

if antigo_1 not in conteudo:
    print('ERRO: patch 1 (import xlsx) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_1, novo_1)

# --- Patch 2: novo estado "importando" ---
antigo_2 = """  const [msg, setMsg] = useState('')"""
novo_2 = """  const [msg, setMsg] = useState('')
  const [importando, setImportando] = useState(false)"""

if antigo_2 not in conteudo:
    print('ERRO: patch 2 (estado importando) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_2, novo_2)

# --- Patch 3: funcao de importacao (inserida logo apos msgTemp) ---
antigo_3 = """  function msgTemp(t) { setMsg(t); setTimeout(() => setMsg(''), 3000) }"""
novo_3 = """  function msgTemp(t) { setMsg(t); setTimeout(() => setMsg(''), 5000) }

  // ---------- IMPORTACAO DE PLANILHA (ferramenta financeira externa) ----------
  function convData(br) {
    if (!br) return null
    const partes = String(br).split('/')
    if (partes.length !== 3) return null
    const [d, m, a] = partes
    return `${a}-${m}-${d}`
  }

  async function handleImportarPlanilha(e) {
    const file = e.target.files[0]
    if (!file) return
    setImportando(true)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      let qtdFin = 0, qtdNovos = 0, qtdAtualizados = 0, qtdIgnorados = 0

      // ---- Extrato (Caixa) -> bodes_financeiro ----
      if (wb.SheetNames.includes('Extrato (Caixa)')) {
        const ws = wb.Sheets['Extrato (Caixa)']
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }).slice(1).filter(r => r[0])
        // Reimportacao e idempotente: remove o lote anterior vindo da planilha antes de inserir o novo
        await supabase.from('bodes_financeiro').delete().eq('origem', 'planilha')
        const inserts = rows.map(r => {
          const [dataBR, historico, tipo, categoria, debito, credito] = r
          const valor = credito != null ? Number(credito) : Number(debito || 0)
          return {
            tipo: tipo === 'despesa' ? 'saida' : 'entrada',
            categoria: categoria || 'outro',
            descricao: historico || null,
            valor,
            data: convData(dataBR),
            membro_tipo: 'geral',
            origem: 'planilha'
          }
        }).filter(r => r.data && r.valor > 0)
        if (inserts.length > 0) {
          const { error } = await supabase.from('bodes_financeiro').insert(inserts)
          if (!error) qtdFin = inserts.length
        }
      }

      // ---- Pessoal -> bodes_externos (apenas quem NAO e da loja) ----
      if (wb.SheetNames.includes('Pessoal')) {
        const ws = wb.Sheets['Pessoal']
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }).slice(1).filter(r => r[0])

        const { data: assocs } = await supabase.from('associados').select('cpf').not('cpf', 'is', null)
        const cpfsLoja = new Set((assocs || []).map(a => (a.cpf || '').replace(/\\D/g, '')))
        const { data: externosExistentes } = await supabase.from('bodes_externos').select('id, cpf')
        const mapExternos = {}
        ;(externosExistentes || []).forEach(ex => { if (ex.cpf) mapExternos[ex.cpf] = ex.id })

        for (const r of rows) {
          const [nome, apelido, cargo, situacao, , cpfRaw, email, telefone, dataNascBR, cidade, numeroSocio, dataAdmBR] = r
          const cpf = String(cpfRaw || '').replace(/\\D/g, '')
          if (!cpf) { qtdIgnorados++; continue }
          if (cpfsLoja.has(cpf)) continue // ja e da loja — nao duplica em bodes_externos
          const payload = {
            nome, apelido: apelido || null, cpf,
            email: email || null, telefone: telefone || null, cidade: cidade || null,
            numero_socio: numeroSocio ? String(numeroSocio) : null,
            data_nascimento: convData(dataNascBR), data_admissao: convData(dataAdmBR),
            cargo_bodes: cargo || 'Membro', ativo: situacao === 'Ativo', status: 'aprovado'
          }
          if (mapExternos[cpf]) {
            await supabase.from('bodes_externos').update(payload).eq('id', mapExternos[cpf])
            qtdAtualizados++
          } else {
            await supabase.from('bodes_externos').insert(payload)
            qtdNovos++
          }
        }
      }

      msgTemp(`Importado: ${qtdFin} lançamentos · ${qtdNovos} membros novos · ${qtdAtualizados} atualizados${qtdIgnorados ? ' · ' + qtdIgnorados + ' sem CPF (ignorados)' : ''}`)
      await carregarMembros()
      await carregarFinanceiro()
      await carregarAtas()
    } catch (err) {
      msgTemp('Erro ao importar: ' + err.message)
    }
    setImportando(false)
    e.target.value = ''
  }"""

if antigo_3 not in conteudo:
    print('ERRO: patch 3 (funcao importar) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_3, novo_3)

# --- Patch 4: botao de importacao na UI (logo apos a barra de abas) ---
antigo_4 = """            <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
              {[['membros','👥 Membros'],['financeiro','💰 Financeiro'],['atas','📋 Atas & Presença'],['config','⚙️ Config']].map(([k,l]) => (
                <button key={k} onClick={() => setAba(k)}
                  style={{ padding:'9px 16px', borderRadius:10, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer',
                    background: aba===k ? '#fff' : 'rgba(255,255,255,0.15)', color: aba===k ? '#1a237e' : '#fff' }}>{l}</button>
              ))}
            </div>"""
novo_4 = """            <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
              {[['membros','👥 Membros'],['financeiro','💰 Financeiro'],['atas','📋 Atas & Presença'],['config','⚙️ Config']].map(([k,l]) => (
                <button key={k} onClick={() => setAba(k)}
                  style={{ padding:'9px 16px', borderRadius:10, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer',
                    background: aba===k ? '#fff' : 'rgba(255,255,255,0.15)', color: aba===k ? '#1a237e' : '#fff' }}>{l}</button>
              ))}
            </div>

            <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, background:'rgba(255,255,255,0.15)', color:'#fff', fontSize:12, fontWeight:600, cursor: importando ? 'default' : 'pointer', marginBottom:16 }}>
              {importando ? 'Importando...' : 'Importar planilha (Excel)'}
              <input type="file" accept=".xlsx" onChange={handleImportarPlanilha} disabled={importando} style={{ display:'none' }} />
            </label>"""

if antigo_4 not in conteudo:
    print('ERRO: patch 4 (botao importar) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_4, novo_4)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: BodesAsfalto.jsx (patch importacao) atualizado com sucesso. Backup em', arquivo + '.bak2')
