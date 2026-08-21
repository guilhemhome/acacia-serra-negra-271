erros = []

# --- Calendario.jsx ---
path1 = "src/pages/Calendario.jsx"
with open(path1, "r", encoding="utf-8") as f:
    c1 = f.read()

old1 = "<button onClick={() => navigate('/dashboard')}\n            style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:18 }}>←</button>"
new1 = "<button onClick={() => navigate(-1)}\n            style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:18 }}>←</button>"

if old1 not in c1:
    erros.append("calendario")
else:
    c1 = c1.replace(old1, new1)
    with open(path1, "w", encoding="utf-8") as f:
        f.write(c1)

# --- EditarPerfil.jsx ---
path2 = "src/pages/EditarPerfil.jsx"
with open(path2, "r", encoding="utf-8") as f:
    c2 = f.read()

old2 = "<button onClick={() => navigate(idParam ? `/perfil/${idParam}` : '/dashboard')}"
new2 = "<button onClick={() => navigate(idParam ? `/perfil/${idParam}` : -1)}"

if old2 not in c2:
    erros.append("editarperfil")
else:
    c2 = c2.replace(old2, new2)
    with open(path2, "w", encoding="utf-8") as f:
        f.write(c2)

if erros:
    print("ERRO:", erros)
else:
    print("OK")
