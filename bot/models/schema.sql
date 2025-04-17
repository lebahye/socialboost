
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
