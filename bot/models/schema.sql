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
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_telegram_id_key UNIQUE (telegram_id)
);

CREATE UNIQUE INDEX users_pkey USING BTREE (id);
CREATE UNIQUE INDEX users_telegram_id_key USING BTREE (telegram_id);

-- Create indexes after tables
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Verification codes table with all required fields
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + '00:30:00'::interval,
  username TEXT NOT NULL,
  verified_at TIMESTAMP,
  CONSTRAINT code_unique UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_telegram_id ON verification_codes(telegram_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_status ON verification_codes(status);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- Verification attempts table 
CREATE TABLE IF NOT EXISTS verification_attempts (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  x_username TEXT NOT NULL,
  verification_code TEXT UNIQUE NOT NULL,
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

CREATE INDEX idx_verification_status_code USING BTREE (verification_code, status);
CREATE INDEX idx_verification_code USING BTREE (verification_code);
CREATE INDEX idx_verification_code_status USING BTREE (status);
CREATE INDEX idx_verification_last_attempt USING BTREE (last_attempt_at);
CREATE INDEX idx_verification_expiry USING BTREE (code_expires_at);
CREATE INDEX idx_verification_status USING BTREE (status);
CREATE INDEX idx_telegram_id USING BTREE (telegram_id);

-- Add verification tracking tables
CREATE TABLE IF NOT EXISTS dm_checks (
  id SERIAL PRIMARY KEY,
  verification_code TEXT NOT NULL,
  message_text TEXT,
  sender_id TEXT NOT NULL,
  is_match BOOLEAN NOT NULL,
  check_time TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verification_code ON verification_attempts(verification_code);
CREATE INDEX IF NOT EXISTS idx_telegram_id ON verification_attempts(telegram_id);


-- Campaign posts tracking for rate limiting
CREATE TABLE IF NOT EXISTS campaign_posts (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  owner_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table with enhanced fields
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(telegram_id),
  subscription JSONB DEFAULT '{"isActive": true, "campaignsRemaining": 3}',
  campaigns_remaining INTEGER DEFAULT 3,
  social_accounts JSONB DEFAULT '{"x": null, "discord": null}',
  settings JSONB DEFAULT '{}',
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
  rewards JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  private BOOLEAN DEFAULT false,
  created_by TEXT REFERENCES users(telegram_id),
  participants JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add analytics tracking
CREATE TABLE IF NOT EXISTS analytics (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER,
  metric_type TEXT NOT NULL,
  value INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT analytics_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT analytics_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX analytics_pkey USING BTREE (id);
CREATE TABLE IF NOT EXISTS campaign_participants (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER,
  telegram_id TEXT UNIQUE NOT NULL,
  telegram_username TEXT,
  participated BOOLEAN DEFAULT false,
  participation_date TIMESTAMP,
  rewarded BOOLEAN DEFAULT false,
  reward_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT campaign_participants_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_participants_user_id_key UNIQUE (telegram_id)
);

CREATE UNIQUE INDEX campaign_participants_pkey USING BTREE (id);
CREATE UNIQUE INDEX campaign_participants_user_id_key USING BTREE (telegram_id);
