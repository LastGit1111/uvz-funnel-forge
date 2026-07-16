-- Explicit server-side administrator role. Grant only through a controlled D1 command.
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
