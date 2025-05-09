-- Adicionar um usuário de exemplo para testes
-- ATENÇÃO: Substitua 'admin@example.com' pelo email real do administrador antes de executar esta migração
INSERT INTO public.authorized_users (email, name)
VALUES ('admin@example.com', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- Adicione mais usuários autorizados conforme necessário
/* Exemplo:
INSERT INTO public.authorized_users (email, name)
VALUES ('usuario1@example.com', 'Usuário 1')
ON CONFLICT (email) DO NOTHING;
*/ 