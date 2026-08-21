import shutil

arquivo = 'src/pages/GestaoCargos.jsx'
shutil.copy(arquivo, arquivo + '.bak')

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

# --- Trecho 1: dentro de atribuir() ---
antigo_1 = """    // Atualizar nível de acesso automaticamente (usando perfil_acesso cadastrado no cargo)
    const cargoObj = cargos.find(c => c.nome === cargo)
    const novoPerfil = cargoObj?.perfil_acesso || 'Membro'
    const { data: assocUser } = await supabase.from('associados').select('user_id').eq('id', formAtribuir.associado_id).maybeSingle()
    if (assocUser?.user_id) {
      await supabase.from('perfis_acesso').upsert({ user_id: assocUser.user_id, perfil: novoPerfil }, { onConflict: 'user_id' })
    }
    setMsg('✅ Cargo atribuído com sucesso! Nível de acesso atualizado para: ' + novoPerfil)"""

novo_1 = """    // Atualizar nível de acesso automaticamente (usando perfil_acesso cadastrado no cargo)
    // EXCECAO: cargos da categoria "Bodes do Asfalto" NUNCA sobrescrevem o perfil principal
    // do irmao (que rege o acesso a loja). O acesso ao modulo dos Bodes e concedido via
    // cargos_historico, checado separadamente em RotaProtegida.
    const cargoObj = cargos.find(c => c.nome === cargo)
    const ehCargoBodes = cargoObj?.categoria === 'Bodes do Asfalto'
    const novoPerfil = cargoObj?.perfil_acesso || 'Membro'
    if (!ehCargoBodes) {
      const { data: assocUser } = await supabase.from('associados').select('user_id').eq('id', formAtribuir.associado_id).maybeSingle()
      if (assocUser?.user_id) {
        await supabase.from('perfis_acesso').upsert({ user_id: assocUser.user_id, perfil: novoPerfil }, { onConflict: 'user_id' })
      }
    }
    setMsg(ehCargoBodes
      ? '✅ Cargo dos Bodes atribuído! O acesso do irmão à loja não foi alterado.'
      : '✅ Cargo atribuído com sucesso! Nível de acesso atualizado para: ' + novoPerfil)"""

if antigo_1 not in conteudo:
    print('ERRO: trecho 1 (atribuir) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_1, novo_1)

# --- Trecho 2: dentro de confirmarAlerta() ---
antigo_2 = """    const cargoObj = cargos.find(c => c.nome === cargo)
    const novoPerfil = cargoObj?.perfil_acesso || 'Membro'
    const { data: assocUser } = await supabase.from('associados').select('user_id').eq('id', associado_id).maybeSingle()
    if (assocUser?.user_id) {
      await supabase.from('perfis_acesso').upsert({ user_id: assocUser.user_id, perfil: novoPerfil }, { onConflict: 'user_id' })
    }
    setMsg('Cargo atribuido! Nivel de acesso: ' + novoPerfil)"""

novo_2 = """    const cargoObj = cargos.find(c => c.nome === cargo)
    const ehCargoBodes = cargoObj?.categoria === 'Bodes do Asfalto'
    const novoPerfil = cargoObj?.perfil_acesso || 'Membro'
    if (!ehCargoBodes) {
      const { data: assocUser } = await supabase.from('associados').select('user_id').eq('id', associado_id).maybeSingle()
      if (assocUser?.user_id) {
        await supabase.from('perfis_acesso').upsert({ user_id: assocUser.user_id, perfil: novoPerfil }, { onConflict: 'user_id' })
      }
    }
    setMsg(ehCargoBodes
      ? 'Cargo dos Bodes atribuido! O acesso a loja nao foi alterado.'
      : 'Cargo atribuido! Nivel de acesso: ' + novoPerfil)"""

if antigo_2 not in conteudo:
    print('ERRO: trecho 2 (confirmarAlerta) nao encontrado. Nada foi alterado.')
    raise SystemExit(1)
conteudo = conteudo.replace(antigo_2, novo_2)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo)

print('OK: GestaoCargos.jsx atualizado com sucesso. Backup em', arquivo + '.bak')