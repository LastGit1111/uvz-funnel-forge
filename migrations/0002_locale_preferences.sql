-- TriMind UVZ: supported-language preference for authenticated users.
-- The UI still keeps a local choice for anonymous visitors.
ALTER TABLE users ADD COLUMN locale TEXT NOT NULL DEFAULT 'en';
