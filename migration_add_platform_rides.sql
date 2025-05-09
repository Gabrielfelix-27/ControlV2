-- Adiciona a coluna platform_rides do tipo JSONB à tabela transactions
ALTER TABLE public.transactions ADD COLUMN platform_rides JSONB; 