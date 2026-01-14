-- ============================================================================
-- FAQ TABLE FOR ADMIN PANEL
-- ============================================================================

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'account', 'matching', 'messaging', 'safety', 'billing', 'technical')),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_order_index ON faqs(order_index);

-- RLS Policies
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Everyone can read active FAQs
CREATE POLICY "Anyone can read active FAQs" ON faqs
  FOR SELECT USING (is_active = TRUE);

-- Admins can read all FAQs
CREATE POLICY "Admins can read all FAQs" ON faqs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()::text::uuid
    )
  );

-- Admins can insert FAQs
CREATE POLICY "Admins can insert FAQs" ON faqs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()::text::uuid
      AND (a.permissions->>'can_manage_faq')::boolean = true
    )
  );

-- Admins can update FAQs
CREATE POLICY "Admins can update FAQs" ON faqs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()::text::uuid
      AND (a.permissions->>'can_manage_faq')::boolean = true
    )
  );

-- Admins can delete FAQs
CREATE POLICY "Admins can delete FAQs" ON faqs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()::text::uuid
      AND (a.permissions->>'can_manage_faq')::boolean = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_faq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_faq_timestamp
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_updated_at();

-- Insert sample FAQs
INSERT INTO faqs (question, answer, category, order_index) VALUES
('How do I create an account?', 'Click on "Sign Up" and enter your email or phone number, create a password, and complete your profile.', 'account', 1),
('How does matching work?', 'Our algorithm matches you based on hobbies (60%), job (5%), age (10%), location (10%), lifestyle (10%), and education (5%).', 'matching', 2),
('How do I message someone?', 'Once you match with someone, you can start messaging them in the Messages tab.', 'messaging', 3),
('Is my data safe?', 'Yes, we use industry-standard encryption and security measures to protect your data.', 'safety', 4),
('How do I delete my account?', 'Go to Settings and click "Delete Account". Your account will be scheduled for deletion in 3 days.', 'account', 5),
('Can I change my profile?', 'Yes, click on "Edit Profile" in your profile page to update your information.', 'account', 6),
('What happens if I report someone?', 'Reports are reviewed by our team. If violations are found, appropriate action will be taken.', 'safety', 7),
('How do I block someone?', 'Go to their profile or conversation and click the block button.', 'safety', 8)
ON CONFLICT DO NOTHING;
