-- Update token columns in transactions table
ALTER TABLE public.transactions
DROP COLUMN IF EXISTS tokens_input,
DROP COLUMN IF EXISTS tokens_output,
ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER,
ADD COLUMN IF NOT EXISTS completion_tokens INTEGER;
