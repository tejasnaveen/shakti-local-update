-- Add missing team_id column to employees table
-- This column is required for team assignment functionality

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_team_id 
ON employees(team_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added team_id column to employees table';
  RAISE NOTICE 'Created index for team_id queries';
END $$;
