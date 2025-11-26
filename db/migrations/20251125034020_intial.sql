-- migrate:up
-- 1. TEMPLATES
CREATE TABLE practice_session_templates (
  id TEXT PRIMARY KEY NOT NULL,
  unique_name TEXT NOT NULL UNIQUE,
  display TEXT NOT NULL,
  default_recommended_time_minutes INTEGER DEFAULT 30,
  created_at INTEGER DEFAULT (unixepoch()),
  disabled_at INTEGER
);

CREATE TABLE practice_session_line_items (
  id TEXT PRIMARY KEY NOT NULL,
  practice_session_template_id TEXT NOT NULL REFERENCES practice_session_templates(id) ON DELETE CASCADE,
  title TEXT,
  display TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE day_templates (
  id TEXT PRIMARY KEY NOT NULL,
  display TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  disabled_at INTEGER
);

CREATE TABLE day_template_items (
  id TEXT PRIMARY KEY NOT NULL,
  day_template_id TEXT NOT NULL REFERENCES day_templates(id) ON DELETE CASCADE,
  practice_session_template_id TEXT NOT NULL REFERENCES practice_session_templates(id) ON DELETE CASCADE,
  recommended_time_minutes INTEGER,
  sort_order INTEGER DEFAULT 0
);

-- 2. INSTANCES
CREATE TABLE day_instances (
  id TEXT PRIMARY KEY NOT NULL, -- YYYY-MM-DD
  source_day_template_id TEXT REFERENCES day_templates(id) ON DELETE SET NULL,
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE practice_session_instances (
  id TEXT PRIMARY KEY NOT NULL,
  day_instance_id TEXT NOT NULL REFERENCES day_instances(id) ON DELETE CASCADE,
  practice_session_template_id TEXT REFERENCES practice_session_templates(id) ON DELETE SET NULL,
  display TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  recommended_time_minutes INTEGER,
  actual_time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER,
  canceled_at INTEGER
);

CREATE TABLE practice_session_instance_line_items (
  id TEXT PRIMARY KEY NOT NULL,
  practice_session_instance_id TEXT NOT NULL REFERENCES practice_session_instances(id) ON DELETE CASCADE,
  source_line_item_id TEXT REFERENCES practice_session_line_items(id) ON DELETE SET NULL,
  title TEXT,
  display TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_completed INTEGER DEFAULT 0,
  completed_at INTEGER,
  notes TEXT
);

-- 3. PLANNING
CREATE TABLE planning_items (
  id TEXT PRIMARY KEY NOT NULL,
  display TEXT NOT NULL,
  notes TEXT,
  min_day_instance_id TEXT,
  was_rejected INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER
);

-- 4. GENERATORS
CREATE TABLE generators (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL,
  data_source TEXT
);

CREATE TABLE practice_session_template_required_generators (
  id TEXT PRIMARY KEY NOT NULL,
  practice_session_template_id TEXT NOT NULL REFERENCES practice_session_templates(id) ON DELETE CASCADE,
  generator_id TEXT NOT NULL REFERENCES generators(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  label TEXT
);

CREATE TABLE generator_history (
  id TEXT PRIMARY KEY NOT NULL,
  generator_id TEXT NOT NULL REFERENCES generators(id) ON DELETE CASCADE,
  value_generated TEXT NOT NULL,
  picked_at INTEGER DEFAULT (unixepoch()),
  day_instance_id TEXT REFERENCES day_instances(id) ON DELETE CASCADE
);

CREATE TABLE practice_session_instance_generated_values (
  id TEXT PRIMARY KEY NOT NULL,
  practice_session_instance_id TEXT NOT NULL REFERENCES practice_session_instances(id) ON DELETE CASCADE,
  generator_id TEXT REFERENCES generators(id) ON DELETE SET NULL,
  display_value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);




-- migrate:down

DROP TABLE IF EXISTS practice_session_instance_generated_values;
DROP TABLE IF EXISTS generator_history;
DROP TABLE IF EXISTS practice_session_template_required_generators;
DROP TABLE IF EXISTS generators;

DROP TABLE IF EXISTS planning_items;

DROP TABLE IF EXISTS practice_session_instance_line_items;
DROP TABLE IF EXISTS practice_session_instances;
DROP TABLE IF EXISTS day_instances;

DROP TABLE IF EXISTS day_template_items;
DROP TABLE IF EXISTS day_templates;
DROP TABLE IF EXISTS practice_session_line_items;
DROP TABLE IF EXISTS practice_session_templates;

