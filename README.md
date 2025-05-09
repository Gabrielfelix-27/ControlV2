# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/0e9dfa63-df70-45f5-b6f9-bc889d59cbe0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/0e9dfa63-df70-45f5-b6f9-bc889d59cbe0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/0e9dfa63-df70-45f5-b6f9-bc889d59cbe0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Control V2

Aplicativo de controle financeiro para freelancers e criadores de conteúdo.

## Características Principais

- Dashboard com visão geral financeira
- Controle de transações (ganhos e despesas)
- Relatórios e gráficos
- Definição de metas mensais
- Controle de ganhos por plataforma
- Autenticação restrita para usuários autorizados
- Redefinição de senha pelos próprios usuários
- Gerenciamento de contas exclusivo do administrador

## Tecnologias

- React + TypeScript + Vite
- Supabase para backend e autenticação
- Shadcn/UI para componentes de interface

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Integração Stripe-Supabase

Este projeto demonstra como integrar o Stripe como sistema de pagamento com o Supabase como banco de dados, onde o acesso à aplicação é concedido apenas após a confirmação do pagamento.

### Características

- Processamento de pagamentos com Stripe
- Integração com Supabase para armazenamento de dados e gerenciamento de usuários
- Verificação de acesso baseada em pagamentos confirmados
- Suporte a pagamentos únicos e assinaturas
- Processamento de webhooks do Stripe
- Interface de usuário para página de pagamento

## Pré-requisitos

- Conta no Stripe (https://stripe.com)
- Projeto Supabase (https://supabase.com)
- Node.js (v14 ou superior)
- npm ou yarn

## Configuração

### 1. Configuração do Supabase

1. Crie um novo projeto no Supabase.
2. Execute as migrações SQL para criar as tabelas necessárias:
   - Use o arquivo `src/migrations/20240605000000_create_stripe_tables.sql`
   - Execute as consultas SQL no editor SQL do Supabase.
3. Configure as variáveis de ambiente da função Edge:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=whsec_...
   ```
4. Implante a função Edge para webhooks:
   ```bash
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

### 2. Configuração do Stripe

1. Crie uma conta no Stripe ou faça login em uma existente.
2. No Dashboard do Stripe, navegue até Desenvolvedores > Chaves de API.
3. Copie as seguintes chaves:
   - Chave publicável (pública)
   - Chave secreta
4. Configure um Webhook no Stripe:
   - Vá para Desenvolvedores > Webhooks
   - Clique em "Adicionar endpoint"
   - URL do endpoint: `https://[PROJETO-ID].supabase.co/functions/v1/stripe-webhook`
   - Eventos para escutar:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copie a chave de assinatura do webhook após a criação.
5. Crie produtos e preços no Stripe:
   - Vá para Produtos > Adicionar produto
   - Defina o nome, descrição e preço
   - Copie o ID do preço (price_xxx) para usar na aplicação.

### 3. Configuração da Aplicação

1. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn
   ```

2. Configure as variáveis de ambiente criando um arquivo `.env.local`:
   ```
   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJETO-ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
   SUPABASE_SERVICE_ROLE_KEY=eyJh...
   
   # URL da aplicação
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Atualize os IDs de preço do Stripe em `src/pages/pagamento.jsx` com os seus próprios IDs de preço.

4. Execute a aplicação:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

## Estrutura do Projeto

- `src/api/stripe/`: Endpoints da API para interação com o Stripe
  - `checkout-session.js`: Cria uma sessão de checkout
  - `session.js`: Busca detalhes de uma sessão
  - `webhook.js`: Processa webhooks do Stripe (não é utilizado quando as funções Edge do Supabase estão em uso)
- `src/components/stripe/`: Componentes relacionados ao Stripe
  - `CheckoutButton.jsx`: Botão para iniciar o checkout
- `src/components/ProtectedRoute.jsx`: Componente para proteger rotas que exigem pagamento
- `src/hooks/useAccessCheck.jsx`: Hook para verificar acesso do usuário
- `src/migrations/`: Migrações SQL para o Supabase
- `src/pages/`: Páginas da aplicação
  - `pagamento.jsx`: Página de planos e pagamento
  - `pagamento-sucesso.jsx`: Página de confirmação após pagamento bem-sucedido
- `src/supabase/functions/`: Funções Edge do Supabase
  - `stripe-webhook/`: Função para processar webhooks do Stripe

## Fluxo de Integração

1. Usuário se registra/faz login na aplicação
2. Usuário navega para a página de pagamento
3. Usuário seleciona um plano e clica no botão de checkout
4. O usuário é redirecionado para a página de checkout do Stripe
5. Após o pagamento bem-sucedido, o Stripe envia um webhook
6. A função Edge do Supabase processa o webhook e concede acesso ao usuário
7. O usuário é redirecionado de volta para a aplicação
8. A aplicação verifica se o usuário tem acesso e permite a navegação nas áreas protegidas

## Testando a Integração

1. Para testar a integração em ambiente de desenvolvimento, você pode usar o Stripe CLI:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
   ```

2. Use os cartões de teste do Stripe para testar diferentes cenários:
   - Pagamento bem-sucedido: `4242 4242 4242 4242`
   - Pagamento requer autenticação: `4000 0025 0000 3155`
   - Pagamento recusado: `4000 0000 0000 0002`

## Recursos Adicionais

- [Documentação do Stripe](https://stripe.com/docs)
- [Documentação do Supabase](https://supabase.io/docs)
- [Guia de Webhooks do Stripe](https://stripe.com/docs/webhooks)
- [Funções Edge do Supabase](https://supabase.com/docs/guides/functions)
