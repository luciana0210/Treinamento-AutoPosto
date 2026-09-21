import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
mkdirSync(path.dirname(config.database), { recursive: true });
export const db = new DatabaseSync(config.database, { timeout: 5000 });
db.exec('PRAGMA journal_mode = WAL;');
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
export const all = (sql, ...args) => db.prepare(sql).all(...args);
export const one = (sql, ...args) => db.prepare(sql).get(...args);
export const run = (sql, ...args) => db.prepare(sql).run(...args);
export const now = () => new Date().toISOString();
// Nenhum await dentro da transação: validação e gravação são atômicas.
export function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = fn(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function audit(actor, action, target, details = {}) {
  run('INSERT INTO audit_events(actor_id,action,target_id,details_json,created_at) VALUES(?,?,?,?,?)', actor, action, target, JSON.stringify(details), now());
}
