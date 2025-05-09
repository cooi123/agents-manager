-- Add new token metrics columns to service_runs table
ALTER TABLE service_runs
ADD COLUMN prompt_tokens INTEGER,
ADD COLUMN completion_tokens INTEGER,
ADD COLUMN tokens_total INTEGER;

-- Add comment to explain the columns
COMMENT ON COLUMN service_runs.prompt_tokens IS 'Number of tokens used in the prompt';
COMMENT ON COLUMN service_runs.completion_tokens IS 'Number of tokens used in the completion';
COMMENT ON COLUMN service_runs.tokens_total IS 'Total number of tokens used (prompt + completion)';

-- Create an index on tokens_total for potential analytics queries
CREATE INDEX idx_service_runs_tokens_total ON service_runs(tokens_total); 