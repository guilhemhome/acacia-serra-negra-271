import shutil

arquivo = 'src/pages/Dashboard.jsx'
shutil.copy(arquivo, arquivo + '.bak')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

antigo = """            ...(usuario.perfil === 'ADM' ? [
              { icon: '👥', label: 'Aprovações', rota: '/aprovacoes' },
              { icon: '➕', label: 'Novo cadastro', rota: '/cadastro' },
              { icon: '👨‍⚖️', label: 'Ver membros', rota: '/membros' },
              { icon: '📅', label: 'Calendário', rota: '/calendario' },
              { icon: '⚙️', label: 'Configurações', rota: '/configuracoes' },
              { icon: '✏️', label: 'Meu perfil', rota: '/editar-perfil' },
            ] : ["""
novo = """            ...(usuario.perfil === 'ADM' ? [
              { icon: '👥', label: 'Aprovações', rota: '/aprovacoes' },
              { icon: '➕', label: 'Novo cadastro', rota: '/cadastro' },
              { icon: '👨‍⚖️', label: 'Ver membros', rota: '/membros' },
              { icon: '📅', label: 'Calendário', rota: '/calendario' },
              { icon: '🏍️', label: 'Bodes do Asfalto', rota: '/bodes-asfalto' },
              { icon: '⚙️', label: 'Configurações', rota: '/configuracoes' },
              { icon: '✏️', label: 'Meu perfil', rota: '/editar-perfil' },
            ] : ["""

if antigo not in conteudo:
    print('ERRO: trecho (acoes rapidas ADM) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo, novo)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: Dashboard.jsx atualizado com sucesso. Backup em', arquivo + '.bak')