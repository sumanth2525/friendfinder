-- ============================================================================
-- COMPLETE ADMIN SETUP - Run this entire file
-- ============================================================================
-- This script creates the admins table and sets up admin users
-- Run in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Create Admins Table
-- ============================================================================

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read all admins" ON admins;

-- RLS Policy: Admins can read all admins
CREATE POLICY "Admins can read all admins" ON admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id::text = auth.uid()::text
    )
  );

-- ============================================================================
-- STEP 2: Create Admin User
-- ============================================================================
-- IMPORTANT: Replace 'YOUR_EMAIL@example.com' with your actual email

-- Option A: If you already have a user in the users table
-- Uncomment and replace email:

/*
INSERT INTO admins (user_id, role, permissions)
SELECT 
  id,
  'admin',
  '{
    "can_delete_users": true,
    "can_view_logs": true,
    "can_view_faq": true,
    "can_manage_faq": true
  }'::jsonb
FROM users
WHERE email = 'YOUR_EMAIL@example.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin',
    permissions = '{
      "can_delete_users": true,
      "can_view_logs": true,
      "can_view_faq": true,
      "can_manage_faq": true
    }'::jsonb;
*/

-- Option B: If you need to create user first
-- Step 1: Create user via Supabase Auth Dashboard
-- Step 2: Find the user ID:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
-- Step 3: Create user record in users table (if not exists)
-- Step 4: Then run Option A above

-- ============================================================================
-- STEP 3: Verify Setup
-- ============================================================================

-- Check if admins table exists
SELECT 
  'Admins table exists' AS status,
  COUNT(*) AS admin_count
FROM admins;

-- List all admins
SELECT 
  a.id,
  a.role,
  a.permissions,
  u.email,
  u.phone,
  p.display_name
FROM admins a
LEFT JOIN users u ON u.id = a.user_id
LEFT JOIN profiles p ON p.user_id = a.user_id;

-- ============================================================================
-- QUICK ADMIN CREATION (Uncomment and use)
-- ============================================================================

-- Make existing user admin by email:
/*
INSERT INTO admins (user_id, role, permissions)
SELECT 
  id,
  'admin',
  '{"can_delete_users": true, "can_view_logs": true, "can_view_faq": true, "can_manage_faq": true}'::jsonb
FROM users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin',
    permissions = '{"can_delete_users": true, "can_view_logs": true, "can_view_faq": true, "can_manage_faq": true}'::jsonb;
*/
