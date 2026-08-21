import re

def aplicar(path, substituicoes):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in substituicoes:
        if old not in content:
            print(f'ERRO em {path}: trecho nao encontrado -> {old[:60]}...')
        else:
            content = content.replace(old, new)
            print(f'OK em {path}: {old[:60]}...')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# GestaoCargos.jsx
aplicar('src/pages/GestaoCargos.jsx', [
    ("<select value={formAtribuir.associado_id} onChange={e => setFormAtribuir({...formAtribuir, associado_id:e.target.value})}",
     "<select value={formAtribuir.associado_id} translate=\"no\" onChange={e => setFormAtribuir({...formAtribuir, associado_id:e.target.value})}")
])

# EditarPerfil.jsx
aplicar('src/pages/EditarPerfil.jsx', [
    ("<select value={pessoal.estado_civil} onChange={e => setPessoal({...pessoal, estado_civil:e.target.value, data_casamento: e.target.value !== 'Casado' && e.target.value !== 'União Estável' ? '' : pessoal.data_casamento})}",
     "<select value={pessoal.estado_civil} translate=\"no\" onChange={e => setPessoal({...pessoal, estado_civil:e.target.value, data_casamento: e.target.value !== 'Casado' && e.target.value !== 'União Estável' ? '' : pessoal.data_casamento})}"),
    ("<select value={novoFamiliar.parentesco} onChange={e => setNovoFamiliar({...novoFamiliar, parentesco:e.target.value})}",
     "<select value={novoFamiliar.parentesco} translate=\"no\" onChange={e => setNovoFamiliar({...novoFamiliar, parentesco:e.target.value})}"),
    ("<select value={editFamiliarForm.parentesco} onChange={e => setEditFamiliarForm({...editFamiliarForm, parentesco:e.target.value})}",
     "<select value={editFamiliarForm.parentesco} translate=\"no\" onChange={e => setEditFamiliarForm({...editFamiliarForm, parentesco:e.target.value})}"),
    ("<select value={novoFilosofico.grau} onChange={e => setNovoFilosofico({...novoFilosofico, grau:e.target.value})}",
     "<select value={novoFilosofico.grau} translate=\"no\" onChange={e => setNovoFilosofico({...novoFilosofico, grau:e.target.value})}"),
    ("<select value={editFilosoficoForm.grau} onChange={e => setEditFilosoficoForm({...editFilosoficoForm, grau:e.target.value})}",
     "<select value={editFilosoficoForm.grau} translate=\"no\" onChange={e => setEditFilosoficoForm({...editFilosoficoForm, grau:e.target.value})}"),
])

# Calendario.jsx
aplicar('src/pages/Calendario.jsx', [
    ("<select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}",
     "<select value={filtroMes} translate=\"no\" onChange={e => setFiltroMes(e.target.value)}"),
    ("<select value={form.tipo} onChange={e => setForm({...form,tipo:e.target.value})}",
     "<select value={form.tipo} translate=\"no\" onChange={e => setForm({...form,tipo:e.target.value})}"),
    ("<select value={form.visibilidade} onChange={e => setForm({...form,visibilidade:e.target.value})}",
     "<select value={form.visibilidade} translate=\"no\" onChange={e => setForm({...form,visibilidade:e.target.value})}"),
    ("<select value={form.status} onChange={e => setForm({...form,status:e.target.value})}",
     "<select value={form.status} translate=\"no\" onChange={e => setForm({...form,status:e.target.value})}"),
])
