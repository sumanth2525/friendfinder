-- ============================================================================
-- CREATE ADMINS TABLE (Run this FIRST before admin_setup.sql)
-- ============================================================================

-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can read all admins" ON admins;

-- RLS Policies for admins table
CREATE POLICY "Admins can read all admins" ON admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id::text = auth.uid()::text
    )
  );

-- Allow service role to manage admins (for initial setup)
-- Note: This requires service_role key, so admins should be created via SQL Editor
-- or via a secure admin API endpoint

-- Verify table creation
SELECT 'Admins table created successfully!' AS status;
