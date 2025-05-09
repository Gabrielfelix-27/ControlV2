-- Migração para adicionar políticas que permitem aos usuários excluir seus próprios dados

-- 1. Garantir que a tabela user_profiles tenha RLS habilitado
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Garantir que a tabela transactions tenha RLS habilitado
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. Adicionar política para permitir que usuários removam seu próprio perfil
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
CREATE POLICY "Users can delete their own profile" 
ON public.user_profiles 
FOR DELETE 
TO authenticated 
USING (id = auth.uid());

-- 4. Adicionar política para permitir que usuários removam suas próprias transações
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- 5. Adicionar políticas de SELECT para garantir que os usuários possam ver seus dados
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 6. Adicionar políticas para INSERT para permitir que usuários criem seus próprios dados
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- 7. Adicionar políticas para UPDATE para permitir que usuários atualizem seus próprios dados
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid()); 