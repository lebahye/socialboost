-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language TEXT DEFAULT 'en',
  is_project_owner BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  social_accounts JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(telegram_id),
  subscription JSONB DEFAULT '{"isActive": true, "campaignsRemaining": 3}',
  social_accounts JSONB DEFAULT '{"x": null, "discord": null}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_id INTEGER REFERENCES projects(id),
  x_post_url TEXT,
  discord_url TEXT,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  target_participants INTEGER DEFAULT 0,
  current_participants INTEGER DEFAULT 0,
  rewards JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  tags TEXT[],
  stats JSONB DEFAULT '{"engagement": {"likes": 0, "retweets": 0, "comments": 0}}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Participants table
CREATE TABLE IF NOT EXISTS campaign_participants (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  user_id TEXT REFERENCES users(telegram_id),
  status TEXT DEFAULT 'joined',
  participated BOOLEAN DEFAULT false,
  participated_at TIMESTAMP,
  rewards_claimed JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verification Codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(telegram_id),
  platform TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);