
CREATE TABLE IF NOT EXISTS users (
  telegram_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_project_owner BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  credits INTEGER DEFAULT 0,
  current_state TEXT DEFAULT NULL,
  last_command TEXT DEFAULT NULL,
  language_code TEXT DEFAULT 'en',
  social_accounts JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT REFERENCES users(telegram_id),
  status TEXT DEFAULT 'active',
  campaign_count INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]',
  rewards JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  participant_count INTEGER DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_participants (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  user_id TEXT REFERENCES users(telegram_id),
  telegram_username TEXT,
  status TEXT DEFAULT 'pending',
  participation_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  reward_claimed BOOLEAN DEFAULT false,
  reward_sent BOOLEAN DEFAULT false,
  reward_type TEXT,
  reward_amount INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  campaign_id INTEGER REFERENCES campaigns(id),
  metric_type TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
