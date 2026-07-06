-- UVZ Funnel Forge — Initial Schema
-- Safe: all tables use CREATE TABLE IF NOT EXISTS

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'analyzing',
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS uvz_analyses (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  uvz_options TEXT,
  selected_uvz TEXT,
  scores TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_outlines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  product_type TEXT,
  rationale TEXT,
  outline_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS distribution_plans (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  platforms TEXT,
  seo_json TEXT,
  content_packs TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  question TEXT,
  answer TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS funnel_flows (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  funnel_type TEXT,
  steps_json TEXT,
  hooks_json TEXT,
  email_sequence_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  keyword TEXT,
  layer1 TEXT,
  layer2 TEXT,
  best_uvz TEXT,
  best_uvz_reason TEXT,
  layer3_options TEXT,
  scoring_table TEXT,
  product_title TEXT,
  product_outline TEXT,
  three_angle_offer TEXT,
  hook_options TEXT,
  funnel_path TEXT,
  full_json TEXT,
  full_system_prompt TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  session_id TEXT,
  messages TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  event_type TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  product_id TEXT,
  module_index INTEGER DEFAULT 0,
  lesson_index INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  metadata TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  token TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hooks (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  hook_text TEXT,
  hook_type TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  offer_json TEXT,
  created_at TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_uvz_project_id ON uvz_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_product_outlines_project_id ON product_outlines(project_id);
CREATE INDEX IF NOT EXISTS idx_funnel_flows_project_id ON funnel_flows(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_product_id ON analytics(product_id);
