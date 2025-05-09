# Guia do Administrador - Control V2

## Introdução

Este guia explica como gerenciar usuários no sistema Control V2. O sistema agora está configurado para permitir acesso apenas a usuários previamente cadastrados pelo administrador no Supabase.

## Gerenciando Usuários

### Acessando o Painel do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.io)
2. Faça login com sua conta de administrador
3. Selecione o projeto Control V2

### Criando Novos Usuários

1. No menu lateral, clique em **Authentication** > **Users**
2. Clique em **+ Invite User**
3. Digite o email do usuário que deseja cadastrar
4. Clique em **Invite**
5. O usuário receberá um email com instruções para definir sua senha

Alternativamente, você pode criar usuários diretamente com o CLI do Supabase:

```bash
supabase auth admin create-user \
  --email usuario@exemplo.com \
  --password senha123 \
  --data '{"name":"Nome do Usuário"}'
```

### Visualizando Usuários Cadastrados

1. No menu lateral, clique em **Authentication** > **Users**
2. Você verá uma lista de todos os usuários cadastrados no sistema
3. É possível filtrar e buscar usuários por email

### Removendo Usuários

Se precisar remover o acesso de um usuário:

1. No painel do Supabase, vá para **Authentication** > **Users**
2. Encontre o usuário na lista
3. Clique no botão de menu (...) e selecione **Delete User**

## Fluxo de Acesso

O sistema agora funciona da seguinte forma:

1. O administrador cria um usuário no Supabase
2. O usuário recebe um email para definir sua senha (ou o administrador informa a senha)
3. O usuário faz login usando o email e senha
4. O sistema verifica a autenticação e concede acesso

## Notas Importantes

- Não existe opção de cadastro na interface do sistema
- Apenas o administrador pode criar novos usuários
- Todos os usuários cadastrados têm acesso total ao sistema
- Os usuários podem redefinir suas próprias senhas através da página de Configurações
- O usuário deve informar ao administrador caso esqueça sua senha para que ela seja redefinida

## Suporte

Para questões técnicas ou problemas com o sistema de autenticação, entre em contato com o suporte técnico.

## Considerações sobre Exclusão de Usuários

A exclusão de usuários é uma funcionalidade exclusiva do administrador e foi intencionalmente removida da interface do usuário. Os usuários não têm a opção de excluir suas próprias contas diretamente no sistema.

Para excluir um usuário quando necessário:

1. Acesse o painel do Supabase em [Dashboard do Supabase](https://app.supabase.io)
2. Selecione o projeto Control V2
3. Vá para **Table Editor** e execute as seguintes etapas:
   
   a. Exclua todas as transações do usuário:
   ```sql
   DELETE FROM public.transactions WHERE user_id = 'ID_DO_USUARIO';
   ```
   
   b. Exclua o perfil do usuário:
   ```sql
   DELETE FROM public.user_profiles WHERE id = 'ID_DO_USUARIO';
   ```
   
4. Finalmente, vá para **Authentication** > **Users**, localize o usuário e clique no botão de exclusão.

**Importante**: Informe aos usuários que, se desejarem excluir suas contas, devem entrar em contato com o administrador do sistema. 