/*
  # Add result column to service_usage table

  1. Changes
    - Add JSONB column 'result' to store service response
    - Make it nullable since some services might not return results
  
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE service_usage
ADD COLUMN IF NOT EXISTS result JSONB;