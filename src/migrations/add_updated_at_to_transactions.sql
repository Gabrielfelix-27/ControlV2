-- Adiciona a coluna updated_at à tabela transactions
ALTER TABLE transactions ADD COLUMN updated_at TIMESTAMPTZ;

-- Atualiza os registros existentes para definir updated_at igual a created_at
UPDATE transactions SET updated_at = created_at;

-- Torna a coluna NOT NULL
ALTER TABLE transactions ALTER COLUMN updated_at SET NOT NULL;

-- Cria um trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica o trigger à tabela transactions
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp(); 