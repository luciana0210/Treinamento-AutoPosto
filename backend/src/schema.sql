PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('ADMIN','GESTOR','COLABORADOR')),
 job_title TEXT NOT NULL DEFAULT 'Frentista', active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 token_version INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, last_activity_at TEXT
);
CREATE TABLE IF NOT EXISTS modules (
 id INTEGER PRIMARY KEY, position INTEGER NOT NULL UNIQUE, title TEXT NOT NULL,
 duration_minutes INTEGER NOT NULL, min_score INTEGER NOT NULL CHECK(min_score BETWEEN 1 AND 100),
 max_attempts INTEGER NOT NULL CHECK(max_attempts BETWEEN 1 AND 20)
);
CREATE TABLE IF NOT EXISTS lessons (
 id INTEGER PRIMARY KEY, module_id INTEGER NOT NULL REFERENCES modules(id),
 position INTEGER NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, UNIQUE(module_id,position)
);
CREATE TABLE IF NOT EXISTS questions (
 id INTEGER PRIMARY KEY, module_id INTEGER NOT NULL REFERENCES modules(id),
 prompt TEXT NOT NULL, options_json TEXT NOT NULL, correct_index INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS enrollments (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
 cycle INTEGER NOT NULL, assigned_by INTEGER NOT NULL REFERENCES users(id), reason TEXT NOT NULL,
 assigned_at TEXT NOT NULL, due_at TEXT NOT NULL, completed_at TEXT, archived_at TEXT,
 catalog_json TEXT NOT NULL, UNIQUE(user_id,cycle)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_current_cycle ON enrollments(user_id) WHERE archived_at IS NULL;
CREATE TABLE IF NOT EXISTS lesson_completions (
 enrollment_id INTEGER NOT NULL REFERENCES enrollments(id), lesson_id INTEGER NOT NULL,
 completed_at TEXT NOT NULL, PRIMARY KEY(enrollment_id,lesson_id)
);
CREATE TABLE IF NOT EXISTS attempts (
 id INTEGER PRIMARY KEY, enrollment_id INTEGER NOT NULL REFERENCES enrollments(id),
 module_id INTEGER NOT NULL, attempt_number INTEGER NOT NULL, answers_json TEXT NOT NULL,
 score REAL NOT NULL CHECK(score BETWEEN 0 AND 100), passed INTEGER NOT NULL CHECK(passed IN (0,1)),
 created_at TEXT NOT NULL, UNIQUE(enrollment_id,module_id,attempt_number)
);
CREATE TABLE IF NOT EXISTS certificates (
 id TEXT PRIMARY KEY, enrollment_id INTEGER NOT NULL UNIQUE REFERENCES enrollments(id),
 participant_name TEXT NOT NULL, issued_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_events (
 id INTEGER PRIMARY KEY, actor_id INTEGER REFERENCES users(id), action TEXT NOT NULL,
 target_id INTEGER, details_json TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_enrollment ON attempts(enrollment_id,module_id);
CREATE TABLE IF NOT EXISTS help_requests (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
 enrollment_id INTEGER NOT NULL REFERENCES enrollments(id), module_id INTEGER NOT NULL,
 message TEXT NOT NULL, created_at TEXT NOT NULL
);
