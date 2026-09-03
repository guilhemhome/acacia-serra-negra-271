"""
Diagnóstico (NÃO ALTERA NADA) — confere se o BodesAsfalto.jsx ainda bate
com o que o patch_bodes_importar_planilha.py espera encontrar.
"""

arquivo = 'src/pages/BodesAsfalto.jsx'

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

checks = [
    ("Patch 1 - import supabase (base p/ inserir 'import xlsx')", """import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'"""),

    ("Patch 1b - já tem import do XLSX? (se SIM, patch 1 vai falhar/duplicar)", "import * as XLSX from 'xlsx'"),

    ("Patch 2 - linha do useState(msg)", "  const [msg, setMsg] = useState('')"),

    ("Patch 2b - já existe estado 'importando'? (se SIM, patch 2 vai falhar/duplicar)", "const [importando, setImportando] = useState(false)"),

    ("Patch 3 - linha da função msgTemp", "function msgTemp(t) { setMsg(t); setTimeout(() => setMsg(''), 3000) }"),

    ("Patch 3b - já existe handleImportarPlanilha? (se SIM, patch 3 vai falhar/duplicar)", "function handleImportarPlanilha"),

    ("Patch 4 - bloco das abas (Membros/Financeiro/Atas/Config)", """{[['membros','👥 Membros'],['financeiro','💰 Financeiro'],['atas','📋 Atas & Presença'],['config','⚙️ Config']].map(([k,l]) => ("""),

    ("Patch 4b - já existe botão 'Importar planilha'? (se SIM, patch 4 vai falhar/duplicar)", "Importar planilha (Excel)"),
]

print(f"Arquivo: {arquivo}  ({len(conteudo)} caracteres)\n")
print("=" * 70)

problemas = []
for nome, trecho in checks:
    ocorrencias = conteudo.count(trecho)
    if ocorrencias == 0:
        status = "AUSENTE"
    elif ocorrencias == 1:
        status = "OK (1x)"
    else:
        status = f"ATENÇÃO: aparece {ocorrencias}x"
    print(f"[{status:14}] {nome}")
    if "b -" in nome and ocorrencias > 0:
        problemas.append(f"- {nome}")
    if "b -" not in nome and ocorrencias != 1:
        problemas.append(f"- {nome} (esperado 1x, encontrado {ocorrencias}x)")

print("=" * 70)

if problemas:
    print("\nPontos que precisam de ajuste no patch antes de rodar:")
    for p in problemas:
        print(p)
else:
    print("\nTudo bate. O patch_bodes_importar_planilha.py pode ser aplicado com segurança.")

print("\n--- Extra: contexto ao redor da função msgTemp (para conferência manual) ---")
idx = conteudo.find("function msgTemp")
if idx != -1:
    print(conteudo[max(0, idx - 100):idx + 300])
else:
    print("(msgTemp não encontrado - confira manualmente o nome da função de mensagem temporária)")
