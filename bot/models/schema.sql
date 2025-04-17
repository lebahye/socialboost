
CREATE TABLE IF NOT EXISTS users (
  telegram_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT,
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_project_owner BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  credits INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_name VARCHAR(255) NOT NULL,
  x_post_url TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  target_participants INTEGER DEFAULT 0,
  current_participants INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  private BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_participants (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  user_id TEXT NOT NULL,
  telegram_username TEXT,
  participated BOOLEAN DEFAULT false,
  participation_date TIMESTAMP,
  rewarded BOOLEAN DEFAULT false,
  reward_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL REFERENCES users(telegram_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);
