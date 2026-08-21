def aplicar(path, substituicoes):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new, label in substituicoes:
        if old not in content:
            print(f'ERRO em {path}: {label} nao encontrado')
        else:
            content = content.replace(old, new)
            print(f'OK em {path}: {label}')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# Oficiais.jsx
aplicar('src/pages/Oficiais.jsx', [
    ("<span style={{ flex:1, fontSize:15, fontWeight:700, color: aberto ? '#fff' : '#1a237e' }}>{grupo.label}</span>",
     "<span translate=\"no\" style={{ flex:1, fontSize:15, fontWeight:700, color: aberto ? '#fff' : '#1a237e' }}>{grupo.label}</span>",
     "categoria grupo.label"),
    ("<span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{c.cargo}</span>",
     "<span translate=\"no\" style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{c.cargo}</span>",
     "nome do cargo c.cargo"),
])

# PerfilIrmao.jsx
aplicar('src/pages/PerfilIrmao.jsx', [
    ("<p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{e.tipo}</p>",
     "<p translate=\"no\" style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{e.tipo}</p>",
     "tipo evento filosofico e.tipo"),
    ("<p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{f.nome}</p>",
     "<p translate=\"no\" style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{f.nome}</p>",
     "nome familiar f.nome"),
    ("<p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{f.parentesco}</p>",
     "<p translate=\"no\" style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{f.parentesco}</p>",
     "parentesco f.parentesco"),
])

# Calendario.jsx
aplicar('src/pages/Calendario.jsx', [
    ("<p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{f.nome}</p>",
     "<p translate=\"no\" style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{f.nome}</p>",
     "nome f.nome (linha 559)"),
    ("<p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{item.nome}</p>",
     "<p translate=\"no\" style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{item.nome}</p>",
     "nome item.nome (linha 607)"),
])

# EditarPerfil.jsx
aplicar('src/pages/EditarPerfil.jsx', [
    ("<p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{f.nome}</p>",
     "<p translate=\"no\" style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{f.nome}</p>",
     "nome familiar f.nome"),
    ("<p style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{f.grau}</p>",
     "<p translate=\"no\" style={{ margin:0, fontWeight:600, color:'#1e293b' }}>{f.grau}</p>",
     "grau filosofico f.grau"),
])

# PortalMembro.jsx
aplicar('src/pages/PortalMembro.jsx', [
    ("<div style={{ color: c.emBreve ? 'rgba(255,255,255,0.5)' : '#fff', fontSize:13, fontWeight:600, lineHeight:1.2 }}>{c.label}</div>",
     "<div translate=\"no\" style={{ color: c.emBreve ? 'rgba(255,255,255,0.5)' : '#fff', fontSize:13, fontWeight:600, lineHeight:1.2 }}>{c.label}</div>",
     "atalho c.label"),
    ("<div style={{ fontSize:13, fontWeight:700, color:'#1e293b', marginBottom:4 }}>{av.titulo}</div>",
     "<div translate=\"no\" style={{ fontSize:13, fontWeight:700, color:'#1e293b', marginBottom:4 }}>{av.titulo}</div>",
     "aviso av.titulo"),
    ("<div style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>{av.conteudo}</div>",
     "<div translate=\"no\" style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>{av.conteudo}</div>",
     "aviso av.conteudo"),
    ("<div style={{ fontSize:14, fontWeight:700, color:'#2e7d32' }}>{b.titulo}</div>",
     "<div translate=\"no\" style={{ fontSize:14, fontWeight:700, color:'#2e7d32' }}>{b.titulo}</div>",
     "banner b.titulo"),
    ("<div style={{ fontSize:12, color:'#388e3c' }}>{b.sub}</div>",
     "<div translate=\"no\" style={{ fontSize:12, color:'#388e3c' }}>{b.sub}</div>",
     "banner b.sub"),
    ("<div style={{ fontSize:13, fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.titulo}</div>",
     "<div translate=\"no\" style={{ fontSize:13, fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.titulo}</div>",
     "evento ev.titulo"),
])

# TemplatesMensagens.jsx
aplicar('src/pages/TemplatesMensagens.jsx', [
    ("<div style={{ color:'#fff', fontWeight:'bold', fontSize:15 }}>{t.titulo}</div>",
     "<div translate=\"no\" style={{ color:'#fff', fontWeight:'bold', fontSize:15 }}>{t.titulo}</div>",
     "titulo template t.titulo"),
])
