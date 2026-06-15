import sys

path = 'src/pages/Configuracoes.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

erros = []

def rep(nome, old, new):
    global content
    count = content.count(old)
    if count == 0:
        erros.append('NAO ENCONTRADO: ' + nome)
    elif count > 1:
        erros.append('DUPLICADO: ' + nome)
    else:
        content = content.replace(old, new)
        print('OK:', nome)

rep('maxWidth',
"        <div style={{ maxWidth:700, margin:'0 auto' }}>",
"        <div style={{ maxWidth:900, margin:'0 auto' }}>")

rep('carregarPermissoes',
"          setPerfis(perfisComNome)\n        }\n      }\n      carregar()",
"""          setPerfis(perfisComNome)
        }
      }

      const { data: perms } = await supabase.from('permissoes_perfil').select('*')
      if (perms) {
        const map = {}
        perms.forEach(p => {
          if (!map[p.perfil]) map[p.perfil] = {}
          map[p.perfil][p.modulo] = p.nivel
        })
        setPermissoes(map)
      }
    }
    carregar()""")

rep('novasFuncoes',
"        setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, perfil: novoPerfil } : p))\n      }\n    }\n\n    const MODULOS",
"""        setPerfis(prev => prev.map(p => p.user_id === userId ? { ...p, perfil: novoPerfil } : p))
      }
    }

  async function salvarPermissoes() {
    setSalvandoPerm(true)
    const entradas = []
    Object.entries(permissoes).forEach(([perfil, modulos]) => {
      Object.entries(modulos).forEach(([modulo, nivel]) => {
        entradas.push({ perfil, modulo, nivel })
      })
    })
    const { error } = await supabase.from('permissoes_perfil')
      .upsert(entradas, { onConflict: 'perfil,modulo' })
    if (error) msg('Erro ao salvar permissoes: ' + error.message)
    else msg('Permissoes salvas! OK')
    setSalvandoPerm(false)
  }

  function alterarNivel(perfil, modulo, nivel) {
    setPermissoes(prev => ({
      ...prev,
      [perfil]: { ...prev[perfil], [modulo]: nivel }
    }))
  }

    const MODULOS""")

if erros:
    print('ERROS:', erros)
    sys.exit(1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('PARTE 1 OK. Linhas:', content.count('\n')+1)
