import sys

path = "src/pages/Calendario.jsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """  async function verPresencas(ev) {
    const { data } = await supabase.from('eventos_presencas')
      .select('resposta, justificativa, associados(id, nome_completo)')
      .eq('evento_id', ev.id)
    const { data: todosAtivos } = await supabase.from('associados').select('id, nome_completo').eq('status_cadastro', 'aprovado').eq('situacao', 'ativo')
    const respondidoIds = new Set((data||[]).map(p => p.associados?.id).filter(Boolean))
    const pendentes = (todosAtivos||[]).filter(m => !respondidoIds.has(m.id)).map(m => ({ associados: { nome_completo: m.nome_completo } }))
    setPresencas(data||[])
    setNaoResponderam(pendentes)
    setModalPresencas(ev)"""

new = """  async function verPresencas(ev) {
    const { data } = await supabase.from('eventos_presencas')
      .select('resposta, justificativa, associados(id, nome_completo, situacao, conta_teste)')
      .eq('evento_id', ev.id)
    const dataReal = (data||[]).filter(p => p.associados?.situacao === 'ativo' && !p.associados?.conta_teste)
    const { data: todosAtivos } = await supabase.from('associados').select('id, nome_completo').eq('status_cadastro', 'aprovado').eq('situacao', 'ativo').eq('conta_teste', false)
    const respondidoIds = new Set(dataReal.map(p => p.associados?.id).filter(Boolean))
    const pendentes = (todosAtivos||[]).filter(m => !respondidoIds.has(m.id)).map(m => ({ associados: { nome_completo: m.nome_completo } }))
    setPresencas(dataReal)
    setNaoResponderam(pendentes)
    setModalPresencas(ev)"""

if old not in content:
    print("ERRO: bloco nao encontrado")
    sys.exit(1)

content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
