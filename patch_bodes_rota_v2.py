import shutil

arquivo = 'src/App.jsx'
shutil.copy(arquivo, arquivo + '.bak3')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

# --- Patch A: import do novo componente ---
antigo_a = """import PortalMembro from './pages/PortalMembro'
import Oficiais from './pages/Oficiais'"""
novo_a = """import PortalMembro from './pages/PortalMembro'
import Oficiais from './pages/Oficiais'
import BodesAsfalto from './pages/BodesAsfalto'"""

if antigo_a not in conteudo:
    print('ERRO: patch A (import) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_a, novo_a)

# --- Patch B: nova rota ---
antigo_b = """        <Route path="/templates-mensagens" element={<RotaProtegida modulo="/templates-mensagens"><TemplatesMensagens /></RotaProtegida>} />"""
novo_b = """        <Route path="/templates-mensagens" element={<RotaProtegida modulo="/templates-mensagens"><TemplatesMensagens /></RotaProtegida>} />
        <Route path="/bodes-asfalto" element={<RotaProtegida modulo="/bodes-asfalto"><BodesAsfalto /></RotaProtegida>} />"""

if antigo_b not in conteudo:
    print('ERRO: patch B (rota) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_b, novo_b)

# --- Patch C: acesso de leitura via flag bodes_asfalto (alem do acesso total via cargo) ---
antigo_c = """        if (!ativo) return
        setPerfil(perfilAtual)
        if (perfilAtual === 'ADM' || perfilAtual === 'Total') { setNivel('total'); return }
        if (!modulo) { setNivel('total'); return }
        const { data: perm } = await supabase.from('permissoes_perfil')
          .select('nivel').eq('perfil', perfilAtual).eq('modulo', modulo).maybeSingle()
        if (!ativo) return
        let nivelFinal = perm?.nivel || 'bloqueado'

        // Modulo Bodes do Asfalto: acesso aditivo via cargo, sem depender do perfil principal
        // (que rege o acesso a loja). Um irmao pode ter perfil de loja bloqueado nesse modulo
        // e ainda assim ter acesso total por ocupar um dos cargos dos Bodes.
        if (modulo === '/bodes-asfalto' && nivelFinal === 'bloqueado') {
          const { data: cargosBodes } = await supabase.from('cargos').select('nome').eq('categoria', 'Bodes do Asfalto')
          const nomesCargosBodes = (cargosBodes || []).map(c => c.nome)
          if (!ativo) return
          if (nomesCargosBodes.length > 0) {
            const { data: meuAssoc } = await supabase.from('associados').select('id').eq('user_id', session.user.id).maybeSingle()
            if (!ativo) return
            if (meuAssoc?.id) {
              const { data: meuCargoBodes } = await supabase.from('cargos_historico')
                .select('id').eq('associado_id', meuAssoc.id).eq('em_exercicio', true)
                .in('cargo', nomesCargosBodes).maybeSingle()
              if (!ativo) return
              if (meuCargoBodes) nivelFinal = 'total'
            }
          }
        }

        setNivel(nivelFinal)"""

novo_c = """        if (!ativo) return
        setPerfil(perfilAtual)
        if (perfilAtual === 'ADM' || perfilAtual === 'Total') { setNivel('total'); return }
        if (!modulo) { setNivel('total'); return }
        const { data: perm } = await supabase.from('permissoes_perfil')
          .select('nivel').eq('perfil', perfilAtual).eq('modulo', modulo).maybeSingle()
        if (!ativo) return
        let nivelFinal = perm?.nivel || 'bloqueado'

        // Modulo Bodes do Asfalto: acesso aditivo, sem depender do perfil principal (que rege
        // a loja). Cargo dos Bodes = acesso total ao modulo. Apenas bodes_asfalto=true (sem
        // cargo) = acesso de leitura (visao simplificada, controlada dentro da propria pagina).
        if (modulo === '/bodes-asfalto' && nivelFinal === 'bloqueado') {
          const { data: meuAssocBodes } = await supabase.from('associados')
            .select('id, bodes_asfalto').eq('user_id', session.user.id).maybeSingle()
          if (!ativo) return
          if (meuAssocBodes?.id) {
            const { data: cargosBodes } = await supabase.from('cargos').select('nome').eq('categoria', 'Bodes do Asfalto')
            const nomesCargosBodes = (cargosBodes || []).map(c => c.nome)
            if (!ativo) return
            let temCargoBodes = false
            if (nomesCargosBodes.length > 0) {
              const { data: meuCargoBodes } = await supabase.from('cargos_historico')
                .select('id').eq('associado_id', meuAssocBodes.id).eq('em_exercicio', true)
                .in('cargo', nomesCargosBodes).maybeSingle()
              if (!ativo) return
              temCargoBodes = !!meuCargoBodes
            }
            if (temCargoBodes) nivelFinal = 'total'
            else if (meuAssocBodes.bodes_asfalto === true) nivelFinal = 'leitura'
          }
        }

        setNivel(nivelFinal)"""

if antigo_c not in conteudo:
    print('ERRO: patch C (nivel leitura) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_c, novo_c)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: App.jsx (patch 3) atualizado com sucesso. Backup em', arquivo + '.bak3')
