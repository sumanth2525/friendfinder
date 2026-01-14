-- ============================================================================
-- ONE QUERY TO CREATE USER AND MAKE ADMIN
-- Replace '009c3d47-7c4e-42a5-982d-18fc276c3a8d' with your auth user ID
-- Replace 'your-email@example.com' with your email
-- ============================================================================

DO $$
DECLARE
  v_auth_user_id UUID := '009c3d47-7c4e-42a5-982d-18fc276c3a8d'::uuid;  -- Your auth user ID
  v_user_email VARCHAR := 'sreddyaleti25@gmail.com';  -- Your email
  v_user_id UUID;
BEGIN
  -- Step 1: Create user record in users table (if doesn't exist)
  INSERT INTO users (id, email, auth_user_id, status)
  VALUES (
    uuid_generate_v4(),
    v_user_email,
    v_auth_user_id,
    'active'
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET status = 'active',
      email = COALESCE(EXCLUDED.email, users.email)
  RETURNING id INTO v_user_id;
  
  -- Step 2: Make user admin
  INSERT INTO admins (user_id, role, permissions)
  VALUES (
    v_user_id,
    'admin',
    '{"can_delete_users": true, "can_view_logs": true, "can_view_faq": true, "can_manage_faq": true}'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'admin',
      permissions = '{"can_delete_users": true, "can_view_logs": true, "can_view_faq": true, "can_manage_faq": true}'::jsonb;
  
  RAISE NOTICE '✅ User and admin created successfully!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Email: %', v_user_email;
END $$;

-- Verify admin was created
SELECT 
  a.id AS admin_id,
  a.role,
  u.id AS user_id,
  u.email,
  u.auth_user_id
FROM admins a
JOIN users u ON u.id = a.user_id
WHERE u.auth_user_id = '009c3d47-7c4e-42a5-982d-18fc276c3a8d'::uuid;
