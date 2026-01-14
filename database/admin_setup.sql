-- ============================================================================
-- ADMIN SETUP FOR FRIENDFINDER
-- Run this SQL in Supabase SQL Editor to set up admin users
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Admin User in Supabase Auth (if not exists)
-- ============================================================================
-- Note: You need to create the user via Supabase Dashboard → Authentication
-- Or use Supabase Admin API to create user with email/password

-- ============================================================================
-- STEP 2: Find User ID (after creating user in Auth)
-- ============================================================================
-- Run this query to find your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- ============================================================================
-- STEP 3: Create Admin Record
-- ============================================================================
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from step 2

-- Create regular admin
INSERT INTO admins (user_id, role, permissions)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,  -- Replace with actual user UUID
  'admin',
  '{
    "can_delete_users": true,
    "can_view_logs": true,
    "can_view_faq": true,
    "can_manage_faq": true
  }'::jsonb
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin',
    permissions = '{
      "can_delete_users": true,
      "can_view_logs": true,
      "can_view_faq": true,
      "can_manage_faq": true
    }'::jsonb;

-- Create super admin (optional - has all permissions)
INSERT INTO admins (user_id, role, permissions)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,  -- Replace with actual user UUID
  'super_admin',
  '{
    "can_delete_users": true,
    "can_view_logs": true,
    "can_view_faq": true,
    "can_manage_faq": true,
    "can_manage_admins": true,
    "can_access_all": true
  }'::jsonb
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'super_admin',
    permissions = '{
      "can_delete_users": true,
      "can_view_logs": true,
      "can_view_faq": true,
      "can_manage_faq": true,
      "can_manage_admins": true,
      "can_access_all": true
    }'::jsonb;

-- ============================================================================
-- STEP 4: Verify Admin Creation
-- ============================================================================
-- Run this to verify:
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
-- QUICK ADMIN CREATION SCRIPT (RECOMMENDED)
-- ============================================================================
-- If you already have a user and want to make them admin:
-- Replace 'your-email@example.com' with your actual email

-- Make user admin by email (uncomment and replace email):
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

-- ============================================================================
-- VERIFY ADMIN CREATION
-- ============================================================================
-- Run this to check if admin was created:
/*
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
*/
