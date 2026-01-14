-- ============================================================================
-- FRIENDFINDER SUPABASE DATABASE SCHEMA
-- Based on ER Diagram with Matching Algorithm
-- Matching Algorithm: Hobbies 60%, Job 5%, Age 10%, Location 10%, Lifestyle 10%, Education 5%
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location-based queries (optional)

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash TEXT, -- Stored by Supabase Auth, but we keep reference
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Link to Supabase Auth
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE
);

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  bio TEXT,
  education VARCHAR(100),
  job_title VARCHAR(100),
  height VARCHAR(20), -- e.g., "5'10\""
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  looking_for VARCHAR(50) DEFAULT 'Relationship' CHECK (looking_for IN ('Relationship', 'Casual', 'Friends & Dating')),
  
  -- Lifestyle (stored as JSONB for flexibility)
  lifestyle JSONB DEFAULT '{}'::jsonb, -- {drinking, smoking, exercise, pets}
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- PREFERENCES TABLE
-- ============================================================================
CREATE TABLE preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age_min INTEGER DEFAULT 18 CHECK (age_min >= 18),
  age_max INTEGER DEFAULT 50 CHECK (age_max <= 100),
  distance_km INTEGER DEFAULT 50 CHECK (distance_km > 0),
  gender_pref VARCHAR(20) DEFAULT 'all' CHECK (gender_pref IN ('Male', 'Female', 'all')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_age_range CHECK (age_min <= age_max)
);

-- ============================================================================
-- USER_SETTINGS TABLE
-- ============================================================================
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  show_age BOOLEAN DEFAULT TRUE,
  show_distance BOOLEAN DEFAULT TRUE,
  discoverable BOOLEAN DEFAULT TRUE,
  notif_level VARCHAR(20) DEFAULT 'all' CHECK (notif_level IN ('all', 'matches', 'messages', 'none')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LOGIN_SESSIONS TABLE
-- ============================================================================
CREATE TABLE login_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VERIFICATION TABLE
-- ============================================================================
CREATE TABLE verification (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  photo_verified BOOLEAN DEFAULT FALSE,
  voice_verified BOOLEAN DEFAULT FALSE,
  human_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_score INTEGER DEFAULT 0 CHECK (verification_score >= 0 AND verification_score <= 100)
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'match', 'like', 'message', 'super_like', etc.
  payload JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INTERESTS TABLE
-- ============================================================================
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(50), -- 'Hobbies', 'Sports', 'Music', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER_INTERESTS TABLE (Junction Table)
-- ============================================================================
CREATE TABLE user_interests (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, interest_id)
);

-- ============================================================================
-- SWIPES TABLE
-- ============================================================================
CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('LIKE', 'DISLIKE', 'SUPERLIKE')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_swipe CHECK (from_user_id != to_user_id),
  CONSTRAINT unique_swipe UNIQUE (from_user_id, to_user_id)
);

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_percentage INTEGER NOT NULL CHECK (match_percentage >= 0 AND match_percentage <= 100),
  is_super_like_match BOOLEAN DEFAULT FALSE,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UNMATCHED')),
  unmatched_at TIMESTAMPTZ,
  
  CONSTRAINT no_self_match CHECK (user1_id != user2_id),
  CONSTRAINT unique_match UNIQUE (user1_id, user2_id),
  CONSTRAINT ordered_match CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  
  CONSTRAINT one_conversation_per_match UNIQUE (match_id)
);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- ============================================================================
-- BLOCKS TABLE
-- ============================================================================
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_block CHECK (blocker_user_id != blocked_user_id),
  CONSTRAINT unique_block UNIQUE (blocker_user_id, blocked_user_id)
);

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REVIEWED', 'RESOLVED', 'DISMISSED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  
  CONSTRAINT no_self_report CHECK (reporter_user_id != reported_user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_status ON users(status) WHERE status = 'active';

-- Profiles indexes
CREATE INDEX idx_profiles_age ON profiles(age);
CREATE INDEX idx_profiles_gender ON profiles(gender);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_looking_for ON profiles(looking_for);
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at DESC);


-- Swipes indexes
CREATE INDEX idx_swipes_from_user ON swipes(from_user_id);
CREATE INDEX idx_swipes_to_user ON swipes(to_user_id);
CREATE INDEX idx_swipes_action ON swipes(action);
CREATE INDEX idx_swipes_created_at ON swipes(created_at DESC);

-- Matches indexes
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_matches_status ON matches(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_matches_matched_at ON matches(matched_at DESC);
CREATE INDEX idx_matches_percentage ON matches(match_percentage DESC);

-- Messages indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_read_at ON messages(read_at) WHERE read_at IS NULL;

-- Blocks indexes
CREATE INDEX idx_blocks_blocker ON blocks(blocker_user_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_user_id);

-- Reports indexes
CREATE INDEX idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX idx_reports_reported ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status) WHERE status = 'OPEN';

-- User interests indexes
CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_user_interests_interest ON user_interests(interest_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- MATCHING ALGORITHM FUNCTION
-- ============================================================================
-- Algorithm: Hobbies 60%, Job 5%, Age 10%, Location 10%, Lifestyle 10%, Education 5%

CREATE OR REPLACE FUNCTION calculate_match_percentage(
  p_user1_id UUID,
  p_user2_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_hobbies_score DECIMAL := 0;
  v_job_score DECIMAL := 0;
  v_age_score DECIMAL := 0;
  v_location_score DECIMAL := 0;
  v_lifestyle_score DECIMAL := 0;
  v_education_score DECIMAL := 0;
  v_total_score DECIMAL := 0;
  v_common_interests INTEGER := 0;
  v_total_interests INTEGER := 0;
  v_user1_age INTEGER;
  v_user2_age INTEGER;
  v_user1_location VARCHAR;
  v_user2_location VARCHAR;
  v_user1_job VARCHAR;
  v_user2_job VARCHAR;
  v_user1_education VARCHAR;
  v_user2_education VARCHAR;
  v_user1_lifestyle JSONB;
  v_user2_lifestyle JSONB;
BEGIN
  -- Get user1's data
  SELECT p.age, p.location, p.job_title, p.education, p.lifestyle
  INTO v_user1_age, v_user1_location, v_user1_job, v_user1_education, v_user1_lifestyle
  FROM profiles p
  WHERE p.user_id = p_user1_id;
  
  -- Get user2's data
  SELECT p.age, p.location, p.job_title, p.education, p.lifestyle
  INTO v_user2_age, v_user2_location, v_user2_job, v_user2_education, v_user2_lifestyle
  FROM profiles p
  WHERE p.user_id = p_user2_id;
  
  -- 1. HOBBIES SCORE (60%)
  -- Count common interests
  SELECT COUNT(DISTINCT ui1.interest_id)
  INTO v_common_interests
  FROM user_interests ui1
  INNER JOIN user_interests ui2 ON ui1.interest_id = ui2.interest_id
  WHERE ui1.user_id = p_user1_id AND ui2.user_id = p_user2_id;
  
  -- Count total unique interests
  SELECT COUNT(DISTINCT interest_id)
  INTO v_total_interests
  FROM (
    SELECT interest_id FROM user_interests WHERE user_id = p_user1_id
    UNION
    SELECT interest_id FROM user_interests WHERE user_id = p_user2_id
  ) AS all_interests;
  
  -- Calculate hobbies score (60% weight)
  IF v_total_interests > 0 THEN
    v_hobbies_score := (v_common_interests::DECIMAL / v_total_interests::DECIMAL) * 60;
  ELSE
    v_hobbies_score := 0;
  END IF;
  
  -- 2. JOB SCORE (5%)
  IF v_user1_job IS NOT NULL AND v_user2_job IS NOT NULL THEN
    IF LOWER(TRIM(v_user1_job)) = LOWER(TRIM(v_user2_job)) THEN
      v_job_score := 5;
    ELSE
      -- Partial match (same industry/keywords)
      IF v_user1_job ILIKE '%' || v_user2_job || '%' OR 
         v_user2_job ILIKE '%' || v_user1_job || '%' THEN
        v_job_score := 2.5;
      ELSE
        v_job_score := 0;
      END IF;
    END IF;
  ELSE
    v_job_score := 2.5; -- Neutral score if one is missing
  END IF;
  
  -- 3. AGE SCORE (10%)
  -- Age compatibility: closer ages = higher score
  IF v_user1_age IS NOT NULL AND v_user2_age IS NOT NULL THEN
    DECLARE
      v_age_diff INTEGER := ABS(v_user1_age - v_user2_age);
    BEGIN
      IF v_age_diff = 0 THEN
        v_age_score := 10;
      ELSIF v_age_diff <= 2 THEN
        v_age_score := 8;
      ELSIF v_age_diff <= 5 THEN
        v_age_score := 6;
      ELSIF v_age_diff <= 10 THEN
        v_age_score := 4;
      ELSE
        v_age_score := 2;
      END IF;
    END;
  ELSE
    v_age_score := 5; -- Neutral score
  END IF;
  
  -- 4. LOCATION SCORE (10%)
  -- Same location = full score, similar location = partial score
  IF v_user1_location IS NOT NULL AND v_user2_location IS NOT NULL THEN
    IF LOWER(TRIM(v_user1_location)) = LOWER(TRIM(v_user2_location)) THEN
      v_location_score := 10;
    ELSIF v_user1_location ILIKE '%' || SPLIT_PART(v_user2_location, ',', 1) || '%' OR
          v_user2_location ILIKE '%' || SPLIT_PART(v_user1_location, ',', 1) || '%' THEN
      v_location_score := 7; -- Same city, different state
    ELSE
      v_location_score := 5; -- Different locations
    END IF;
  ELSE
    v_location_score := 5; -- Neutral score
  END IF;
  
  -- 5. LIFESTYLE SCORE (10%)
  -- Compare drinking, smoking, exercise, pets from JSONB
  DECLARE
    v_lifestyle_matches INTEGER := 0;
    v_total_factors INTEGER := 0;
  BEGIN
    -- Drinking match
    IF v_user1_lifestyle->>'drinking' IS NOT NULL AND v_user2_lifestyle->>'drinking' IS NOT NULL THEN
      v_total_factors := v_total_factors + 1;
      IF v_user1_lifestyle->>'drinking' = v_user2_lifestyle->>'drinking' THEN
        v_lifestyle_matches := v_lifestyle_matches + 1;
      END IF;
    END IF;
    
    -- Smoking match
    IF v_user1_lifestyle->>'smoking' IS NOT NULL AND v_user2_lifestyle->>'smoking' IS NOT NULL THEN
      v_total_factors := v_total_factors + 1;
      IF v_user1_lifestyle->>'smoking' = v_user2_lifestyle->>'smoking' THEN
        v_lifestyle_matches := v_lifestyle_matches + 1;
      END IF;
    END IF;
    
    -- Exercise match
    IF v_user1_lifestyle->>'exercise' IS NOT NULL AND v_user2_lifestyle->>'exercise' IS NOT NULL THEN
      v_total_factors := v_total_factors + 1;
      IF v_user1_lifestyle->>'exercise' = v_user2_lifestyle->>'exercise' THEN
        v_lifestyle_matches := v_lifestyle_matches + 1;
      END IF;
    END IF;
    
    -- Pets match
    IF v_user1_lifestyle->>'pets' IS NOT NULL AND v_user2_lifestyle->>'pets' IS NOT NULL THEN
      v_total_factors := v_total_factors + 1;
      IF v_user1_lifestyle->>'pets' = v_user2_lifestyle->>'pets' THEN
        v_lifestyle_matches := v_lifestyle_matches + 1;
      END IF;
    END IF;
    
    -- Calculate lifestyle score (10% total)
    IF v_total_factors > 0 THEN
      v_lifestyle_score := (v_lifestyle_matches::DECIMAL / v_total_factors::DECIMAL) * 10;
    ELSE
      v_lifestyle_score := 5; -- Neutral score
    END IF;
  END;
  
  -- 6. EDUCATION SCORE (5%)
  IF v_user1_education IS NOT NULL AND v_user2_education IS NOT NULL THEN
    IF LOWER(TRIM(v_user1_education)) = LOWER(TRIM(v_user2_education)) THEN
      v_education_score := 5;
    ELSE
      -- Partial match (similar education level)
      IF (v_user1_education ILIKE '%university%' OR v_user1_education ILIKE '%college%') AND
         (v_user2_education ILIKE '%university%' OR v_user2_education ILIKE '%college%') THEN
        v_education_score := 3;
      ELSE
        v_education_score := 1;
      END IF;
    END IF;
  ELSE
    v_education_score := 2.5; -- Neutral score
  END IF;
  
  -- Calculate total score
  v_total_score := v_hobbies_score + v_job_score + v_age_score + 
                   v_location_score + v_lifestyle_score + v_education_score;
  
  -- Round and clamp between 0-100
  RETURN LEAST(100, GREATEST(0, ROUND(v_total_score)::INTEGER));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION TO GET POTENTIAL MATCHES
-- ============================================================================
CREATE OR REPLACE FUNCTION get_potential_matches(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  user_id UUID,
  match_percentage INTEGER,
  display_name VARCHAR,
  age INTEGER,
  gender VARCHAR,
  bio TEXT,
  location VARCHAR,
  verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_prefs AS (
    SELECT age_min, age_max, distance_km, gender_pref
    FROM preferences
    WHERE user_id = p_user_id
  )
  SELECT 
    u.id AS user_id,
    calculate_match_percentage(p_user_id, u.id) AS match_percentage,
    p.display_name,
    p.age,
    p.gender,
    p.bio,
    p.location,
    COALESCE(v.photo_verified, FALSE) AS verified
  FROM users u
  INNER JOIN profiles p ON p.user_id = u.id
  LEFT JOIN verification v ON v.user_id = u.id
  LEFT JOIN user_settings us ON us.user_id = u.id
  CROSS JOIN user_prefs up
  WHERE 
    u.id != p_user_id
    AND u.status = 'active'
    AND p.age >= up.age_min
    AND p.age <= up.age_max
    AND (up.gender_pref = 'all' OR p.gender = up.gender_pref)
    AND u.id NOT IN (
      SELECT to_user_id FROM swipes WHERE from_user_id = p_user_id
    )
    AND u.id NOT IN (
      SELECT user2_id FROM matches WHERE user1_id = p_user_id AND status = 'ACTIVE'
      UNION
      SELECT user1_id FROM matches WHERE user2_id = p_user_id AND status = 'ACTIVE'
    )
    AND u.id NOT IN (
      SELECT blocked_user_id FROM blocks WHERE blocker_user_id = p_user_id
    )
    AND COALESCE(us.discoverable, TRUE) = TRUE
  ORDER BY match_percentage DESC, p.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION TO CREATE MATCH WHEN MUTUAL LIKE
-- ============================================================================
CREATE OR REPLACE FUNCTION create_match_if_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  v_match_exists BOOLEAN;
  v_match_percentage INTEGER;
  v_user1_id UUID;
  v_user2_id UUID;
BEGIN
  -- Check if the other user already liked this user
  IF EXISTS (
    SELECT 1 FROM swipes 
    WHERE from_user_id = NEW.to_user_id 
    AND to_user_id = NEW.from_user_id
    AND action IN ('LIKE', 'SUPERLIKE')
  ) AND NEW.action IN ('LIKE', 'SUPERLIKE') THEN
    
    -- Determine user order (user1_id < user2_id)
    IF NEW.from_user_id < NEW.to_user_id THEN
      v_user1_id := NEW.from_user_id;
      v_user2_id := NEW.to_user_id;
    ELSE
      v_user1_id := NEW.to_user_id;
      v_user2_id := NEW.from_user_id;
    END IF;
    
    -- Calculate match percentage
    v_match_percentage := calculate_match_percentage(v_user1_id, v_user2_id);
    
    -- Check if super like match
    DECLARE
      v_is_super_like BOOLEAN := FALSE;
    BEGIN
      IF NEW.action = 'SUPERLIKE' OR EXISTS (
        SELECT 1 FROM swipes 
        WHERE from_user_id = NEW.to_user_id 
        AND to_user_id = NEW.from_user_id
        AND action = 'SUPERLIKE'
      ) THEN
        v_is_super_like := TRUE;
      END IF;
      
      -- Create match
      INSERT INTO matches (user1_id, user2_id, match_percentage, is_super_like_match)
      VALUES (v_user1_id, v_user2_id, v_match_percentage, v_is_super_like)
      ON CONFLICT (user1_id, user2_id) DO UPDATE
      SET status = 'ACTIVE',
          matched_at = NOW(),
          match_percentage = v_match_percentage;
      
      -- Create conversation
      INSERT INTO conversations (match_id)
      SELECT id FROM matches WHERE user1_id = v_user1_id AND user2_id = v_user2_id
      ON CONFLICT (match_id) DO NOTHING;
      
      -- Create notifications for both users
      INSERT INTO notifications (user_id, type, payload)
      VALUES 
        (v_user1_id, 'match', jsonb_build_object('match_id', (SELECT id FROM matches WHERE user1_id = v_user1_id AND user2_id = v_user2_id), 'other_user_id', v_user2_id)),
        (v_user2_id, 'match', jsonb_build_object('match_id', (SELECT id FROM matches WHERE user1_id = v_user1_id AND user2_id = v_user2_id), 'other_user_id', v_user1_id));
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for swipes
CREATE TRIGGER trigger_create_match_on_swipe
AFTER INSERT ON swipes
FOR EACH ROW
EXECUTE FUNCTION create_match_if_mutual_like();

-- ============================================================================
-- FUNCTION TO UPDATE CONVERSATION LAST MESSAGE
-- ============================================================================
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = (
    SELECT conversation_id FROM messages WHERE id = NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_queue ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

-- Users can read other verified profiles (for matching)
CREATE POLICY "Users can read discoverable profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_settings us ON us.user_id = u.id
      WHERE u.id = profiles.user_id
      AND (us.discoverable = TRUE OR us.user_id = profiles.user_id)
      AND u.status = 'active'
    )
  );

-- Users can manage their own swipes
CREATE POLICY "Users can manage own swipes" ON swipes
  FOR ALL USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = from_user_id));

-- Users can read their own matches
CREATE POLICY "Users can read own matches" ON matches
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = user1_id
      UNION
      SELECT auth_user_id FROM users WHERE id = user2_id
    )
  );

-- Users can read messages in their conversations
CREATE POLICY "Users can read match messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
      AND (
        auth.uid() IN (SELECT auth_user_id FROM users WHERE id = m.user1_id)
        OR
        auth.uid() IN (SELECT auth_user_id FROM users WHERE id = m.user2_id)
      )
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT auth_user_id FROM users WHERE id = sender_id)
    AND EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
      AND (
        auth.uid() IN (SELECT auth_user_id FROM users WHERE id = m.user1_id)
        OR
        auth.uid() IN (SELECT auth_user_id FROM users WHERE id = m.user2_id)
      )
    )
  );

-- ============================================================================
-- ADMIN TABLE
-- ============================================================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admins_user_id ON admins(user_id);
CREATE INDEX idx_admins_role ON admins(role);

-- ============================================================================
-- LOGIN_ATTEMPTS TABLE (Track all login attempts)
-- ============================================================================
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255),
  phone VARCHAR(20),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  failure_reason VARCHAR(255),
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_phone ON login_attempts(phone);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at DESC);
CREATE INDEX idx_login_attempts_success ON login_attempts(success);
CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);

-- ============================================================================
-- DELETION_QUEUE TABLE
-- ============================================================================
CREATE TABLE deletion_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(20),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_deletion_queue_user_id ON deletion_queue(user_id);
CREATE INDEX idx_deletion_queue_status ON deletion_queue(status);
CREATE INDEX idx_deletion_queue_scheduled_deletion_at ON deletion_queue(scheduled_deletion_at);
CREATE INDEX idx_deletion_queue_created_at ON deletion_queue(created_at DESC);

-- ============================================================================
-- FUNCTION TO GET MEMBER STATISTICS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_member_stats()
RETURNS JSON AS $$
DECLARE
  v_men_count INTEGER;
  v_women_count INTEGER;
  v_online_count INTEGER;
  v_five_minutes_ago TIMESTAMPTZ;
BEGIN
  -- Count men
  SELECT COUNT(*) INTO v_men_count
  FROM profiles p
  INNER JOIN users u ON u.id = p.user_id
  WHERE p.gender = 'Male' AND u.status = 'active';
  
  -- Count women
  SELECT COUNT(*) INTO v_women_count
  FROM profiles p
  INNER JOIN users u ON u.id = p.user_id
  WHERE p.gender = 'Female' AND u.status = 'active';
  
  -- Count online users (active in last 5 minutes)
  v_five_minutes_ago := NOW() - INTERVAL '5 minutes';
  SELECT COUNT(DISTINCT user_id) INTO v_online_count
  FROM login_sessions
  WHERE last_active_at >= v_five_minutes_ago;
  
  RETURN json_build_object(
    'men_count', v_men_count,
    'women_count', v_women_count,
    'online_count', v_online_count
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED INTERESTS DATA
-- ============================================================================
INSERT INTO interests (name, category) VALUES
('Travel', 'Hobbies'),
('Photography', 'Hobbies'),
('Coffee', 'Lifestyle'),
('Yoga', 'Fitness'),
('Reading', 'Hobbies'),
('Art', 'Creative'),
('Hiking', 'Outdoor'),
('Music', 'Entertainment'),
('Cooking', 'Lifestyle'),
('Fitness', 'Fitness'),
('Food', 'Lifestyle'),
('Dancing', 'Entertainment'),
('Movies', 'Entertainment'),
('Technology', 'Professional'),
('Gaming', 'Entertainment'),
('Anime', 'Entertainment'),
('Writing', 'Creative'),
('Theater', 'Entertainment'),
('Wine', 'Lifestyle'),
('Meditation', 'Wellness'),
('Wellness', 'Wellness'),
('Nature', 'Outdoor')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get potential matches for a user
-- SELECT * FROM get_potential_matches('user-uuid-here', 20);

-- Calculate match percentage
-- SELECT calculate_match_percentage('user1-uuid', 'user2-uuid');

-- Get matches for a user
-- SELECT * FROM matches 
-- WHERE (user1_id = 'user-uuid' OR user2_id = 'user-uuid') 
-- AND status = 'ACTIVE' 
-- ORDER BY matched_at DESC;

-- Get messages for a conversation
-- SELECT * FROM messages 
-- WHERE conversation_id = 'conversation-uuid' 
-- ORDER BY created_at ASC;

-- ============================================================================
-- ADMIN RLS POLICIES
-- ============================================================================

-- Admins can read all admins
CREATE POLICY "Admins can read all admins" ON admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()::text::uuid
    )
  );

-- Admins can read all login attempts
CREATE POLICY "Admins can read all login attempts" ON login_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()::text::uuid
    )
  );

-- Users can read their own deletion queue entries
CREATE POLICY "Users can read own deletion queue" ON deletion_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = deletion_queue.user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can insert their own deletion queue entries
CREATE POLICY "Users can insert own deletion queue" ON deletion_queue
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = deletion_queue.user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can cancel their own deletion (update status to cancelled)
CREATE POLICY "Users can cancel own deletion" ON deletion_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = deletion_queue.user_id
      AND u.auth_user_id = auth.uid()
    )
    AND deletion_queue.status = 'pending'
  );

-- Admins can read all deletion queue entries
CREATE POLICY "Admins can read all deletion queue" ON deletion_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()::text::uuid
    )
  );

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()::text::uuid
    )
  );

-- Admins can update user status (suspend, delete)
CREATE POLICY "Admins can update user status" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()::text::uuid
    )
  );

-- Admins can delete users
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()::text::uuid
      AND a.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- FUNCTION TO TRACK LOGIN ATTEMPT
-- ============================================================================
CREATE OR REPLACE FUNCTION track_login_attempt(
  p_email VARCHAR DEFAULT NULL,
  p_phone VARCHAR DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT FALSE,
  p_failure_reason VARCHAR DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO login_attempts (
    email,
    phone,
    ip_address,
    user_agent,
    success,
    failure_reason,
    user_id
  ) VALUES (
    p_email,
    p_phone,
    p_ip_address,
    p_user_agent,
    p_success,
    p_failure_reason,
    p_user_id
  ) RETURNING id INTO v_attempt_id;
  
  RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION TO CHECK IF USER IS ADMIN
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION TO GET LOGIN ATTEMPTS (Admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_login_attempts(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_success BOOLEAN DEFAULT NULL,
  p_email VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  phone VARCHAR,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN,
  failure_reason VARCHAR,
  attempted_at TIMESTAMPTZ,
  user_id UUID,
  user_email VARCHAR,
  user_phone VARCHAR
) AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()::text::uuid
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    la.id,
    la.email,
    la.phone,
    la.ip_address,
    la.user_agent,
    la.success,
    la.failure_reason,
    la.attempted_at,
    la.user_id,
    u.email AS user_email,
    u.phone AS user_phone
  FROM login_attempts la
  LEFT JOIN users u ON u.id = la.user_id
  WHERE 
    (p_success IS NULL OR la.success = p_success)
    AND (p_email IS NULL OR la.email ILIKE '%' || p_email || '%')
  ORDER BY la.attempted_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION TO DELETE USER ACCOUNT (Admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()::text::uuid
    AND role IN ('admin', 'super_admin')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update user status to deleted (cascade will handle related records)
  UPDATE users
  SET status = 'deleted'
  WHERE id = p_user_id;

  -- Also delete from auth.users if needed (requires service_role key)
  -- This would be done via Supabase Admin API in production

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
