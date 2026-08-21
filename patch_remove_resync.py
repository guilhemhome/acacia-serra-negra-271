path = "src/App.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_str = """        // Se não é ADM, verificar se tem cargo ativo em cargos_historico
        // e sincronizar com perfis_acesso se necessário
        if (perfilAtual !== 'ADM') {
          const { data: assoc } = await supabase.from('associados')
            .select('id').eq('user_id', session.user.id).maybeSingle()
          if (assoc?.id) {
            const { data: cargo } = await supabase.from('cargos_historico')
              .select('cargo').eq('associado_id', assoc.id).eq('em_exercicio', true).maybeSingle()
            if (cargo?.cargo) {
              // Cargo ativo encontrado — usar o perfil_acesso cadastrado no cargo (dinamico)
              const { data: cargoInfo } = await supabase.from('cargos')
                .select('perfil_acesso').eq('nome', cargo.cargo).maybeSingle()
              const perfilDoCargo = cargoInfo?.perfil_acesso
              if (perfilDoCargo && perfilDoCargo !== perfilAtual) {
                // Sincronizar perfis_acesso automaticamente
                await supabase.from('perfis_acesso')
                  .update({ perfil: perfilDoCargo }).eq('user_id', session.user.id).eq('is_admin', false)
                perfilAtual = perfilDoCargo
              } else if (perfilDoCargo) {
                perfilAtual = perfilDoCargo
              }
            }
          }
        }

        if (!ativo) return"""

new_str = """        if (!ativo) return"""

if old_str not in content:
    print("ERRO")
else:
    content = content.replace(old_str, new_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK")
