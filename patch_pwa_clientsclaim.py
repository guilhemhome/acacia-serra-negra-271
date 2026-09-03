import shutil

arquivo = 'vite.config.js'
shutil.copy(arquivo, arquivo + '.bak')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

antigo = """    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-acacia.png'],"""
novo = """    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true
      },
      includeAssets: ['logo-acacia.png'],"""

if antigo not in conteudo:
    print('ERRO: trecho nao encontrado. Nada foi alterado.')
    raise SystemExit(1)

conteudo = conteudo.replace(antigo, novo)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: vite.config.js atualizado com sucesso. Backup em', arquivo + '.bak')
