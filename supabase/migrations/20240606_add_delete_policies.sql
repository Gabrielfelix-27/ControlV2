-- Adicionar políticas RLS para permitir ao service_role excluir dados do usuário
-- Isso é crucial para que a função Edge delete-user-account possa funcionar corretamente

-- 1. Verificar e adicionar política para transações
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transactions' 
    AND policyname = 'Service role can delete user data'
  ) THEN
    CREATE POLICY "Service role can delete user data" 
    ON public.transactions 
    FOR DELETE 
    TO service_role 
    USING (true);
  END IF;
END $$;

-- 2. Verificar e adicionar política para perfis de usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Service role can delete user data'
  ) THEN
    CREATE POLICY "Service role can delete user data" 
    ON public.user_profiles 
    FOR DELETE 
    TO service_role 
    USING (true);
  END IF;
END $$;

-- 3. Garantir que o service_role tenha todas as permissões necessárias
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.user_profiles TO service_role;

-- 4. Adicionar um gatilho para excluir dados do usuário quando o usuário for excluído
-- (Isso não é necessário para nossa abordagem atual, mas pode ser útil para futuros casos)
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um usuário é excluído da tabela auth.users pelo sistema de autenticação
  -- Este gatilho é executado e remove os dados relacionados automaticamente
  DELETE FROM public.transactions WHERE user_id = OLD.id;
  DELETE FROM public.user_profiles WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se o gatilho já existe antes de tentar criá-lo novamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_deleted'
  ) THEN
    DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
    CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_deleted_user();
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Se não temos permissão para criar o gatilho em auth.users, registramos isso
    RAISE NOTICE 'Permissão insuficiente para criar o gatilho on_auth_user_deleted. Isso requer acesso de superusuário.';
END $$; 