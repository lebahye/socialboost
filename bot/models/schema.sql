-- Users table with complete fields
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language TEXT DEFAULT 'en'::text,
  is_project_owner BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  current_state TEXT,
  social_accounts JSONB DEFAULT '[]'::jsonb,
  credits INTEGER DEFAULT 0,
  verification_code TEXT,
  verification_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  is_premium BOOLEAN DEFAULT false,
  achievements JSONB DEFAULT '[]'::jsonb,
  referral_count INTEGER DEFAULT 0,
  campaigns_completed INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'pending'::text,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + interval '30 minutes',
  username TEXT NOT NULL,
  verified_at TIMESTAMP,
  attempts_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  error_message TEXT,
  dm_received BOOLEAN DEFAULT false,
  dm_received_at TIMESTAMP,
  dm_sender_id TEXT,
  dm_message_text TEXT,
  CONSTRAINT verification_codes_code_key UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_telegram_id ON verification_codes(telegram_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_status ON verification_codes(status);

-- Verification attempts table
CREATE TABLE IF NOT EXISTS verification_attempts (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT NOT NULL,
  x_username TEXT NOT NULL, 
  verification_code TEXT NOT NULL,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  code_issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  code_expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + interval '30 minutes',
  verified_at TIMESTAMP,
  status TEXT DEFAULT 'pending',
  attempts_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  ip_address TEXT,
  client_info JSONB,
  verification_method TEXT,
  error_message TEXT,
  dm_received BOOLEAN DEFAULT false,
  dm_received_at TIMESTAMP,
  dm_sender_id TEXT,
  dm_message_text TEXT,
  CONSTRAINT verification_code_unique UNIQUE (verification_code)
);

CREATE INDEX IF NOT EXISTS idx_verification_attempts_telegram_id ON verification_attempts(telegram_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_code ON verification_attempts(verification_code);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_status ON verification_attempts(status);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(telegram_id),
  subscription JSONB DEFAULT '{"isActive": true, "campaignsRemaining": 3}'::jsonb,
  campaigns_remaining INTEGER DEFAULT 3,
  social_accounts JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id),
  project_name TEXT NOT NULL,
  x_post_url TEXT,
  discord_url TEXT,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  target_participants INTEGER DEFAULT 0,
  current_participants INTEGER DEFAULT 0,
  rewards JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft'::text,
  private BOOLEAN DEFAULT false,
  created_by TEXT REFERENCES users(telegram_id),
  participants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign participants table
CREATE TABLE IF NOT EXISTS campaign_participants (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  telegram_id TEXT NOT NULL,
  telegram_username TEXT,
  participated BOOLEAN DEFAULT false,
  participation_date TIMESTAMP,
  rewarded BOOLEAN DEFAULT false,
  reward_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaign_participants_telegram_id ON campaign_participants(telegram_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign_id ON campaign_participants(campaign_id);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id SERIAL PRIMARY KEY, 
  campaign_id INTEGER REFERENCES campaigns(id),
  metric_type TEXT NOT NULL,
  value INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_campaign_id ON analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_type ON analytics(metric_type);

-- Add verification tracking tables
CREATE TABLE IF NOT EXISTS dm_checks (
  id SERIAL PRIMARY KEY,
  verification_code TEXT NOT NULL,
  message_text TEXT,
  sender_id TEXT NOT NULL,
  is_match BOOLEAN NOT NULL,
  check_time TIMESTAMP NOT NULL
);

-- Campaign posts tracking for rate limiting
CREATE TABLE IF NOT EXISTS campaign_posts (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  owner_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);