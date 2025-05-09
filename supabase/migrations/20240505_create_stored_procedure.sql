-- Criar função para criar a tabela de usuários autorizados
CREATE OR REPLACE FUNCTION public.create_authorized_users_table()
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Verificar se a tabela existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'authorized_users'
  ) INTO table_exists;
  
  -- Se a tabela não existir, criar
  IF NOT table_exists THEN
    -- Criação da tabela de usuários autorizados
    CREATE TABLE IF NOT EXISTS public.authorized_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Criação de um gatilho para atualizar o campo updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
       NEW.updated_at = now();
       RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_authorized_users_updated_at
    BEFORE UPDATE ON public.authorized_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- Comentários da tabela
    COMMENT ON TABLE public.authorized_users IS 'Tabela com usuários autorizados a acessar o sistema';
    COMMENT ON COLUMN public.authorized_users.id IS 'ID único do usuário autorizado';
    COMMENT ON COLUMN public.authorized_users.email IS 'Email do usuário autorizado';
    COMMENT ON COLUMN public.authorized_users.name IS 'Nome do usuário autorizado';
    COMMENT ON COLUMN public.authorized_users.created_at IS 'Data de criação do registro';
    COMMENT ON COLUMN public.authorized_users.updated_at IS 'Data da última atualização do registro';

    -- Criar política RLS para leitura
    CREATE POLICY "Permitir leitura pelos usuários autorizados" 
    ON public.authorized_users FOR SELECT 
    TO authenticated 
    USING (email = auth.jwt() ->> 'email');

    -- Habilitar RLS
    ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

    -- Dar permissão para apenas leitura para o papel anônimo e autenticado
    GRANT SELECT ON public.authorized_users TO anon, authenticated;
    GRANT INSERT, UPDATE, DELETE ON public.authorized_users TO service_role;
  END IF;
  
  RETURN TRUE;
END;
$$; 