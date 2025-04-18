-- Users table with complete fields
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language TEXT DEFAULT 'en',
  is_project_owner BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  current_state TEXT,
  social_accounts JSONB DEFAULT '[]',
  credits INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]',
  referral_code TEXT,
  referred_by TEXT,
  verification_code TEXT,
  verification_expiry TIMESTAMP,
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
  name VARCHAR(50) NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  project_name VARCHAR(50),
  x_post_url TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  target_participants INTEGER DEFAULT 0,
  created_by TEXT REFERENCES users(telegram_id),
  status TEXT DEFAULT 'draft',
  private BOOLEAN DEFAULT false,
  rewards JSONB DEFAULT '[]',
  participants JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{"engagement": {"likes": 0, "retweets": 0, "comments": 0}}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table with complete tracking
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
  campaign_id INTEGER REFERENCES campaigns(id),
  metric_type TEXT NOT NULL,
  value INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);