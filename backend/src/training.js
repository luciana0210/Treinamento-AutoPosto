import { randomUUID } from 'node:crypto';
import { all, one, run, now, audit } from './db.js';
export function fail(status, message) { const e = new Error(message); e.status = status; throw e; }
export function catalog() {
  return all('SELECT * FROM modules ORDER BY position').map(m => ({ ...m,
    lessons: all('SELECT * FROM lessons WHERE module_id=? ORDER BY position', m.id),
    questions: all('SELECT * FROM questions WHERE module_id=? ORDER BY id', m.id).map(q => ({ ...q, options: JSON.parse(q.options_json), options_json: undefined }))
  }));
}
export function enrollmentFor(userId, id) {
  const e = id ? one('SELECT * FROM enrollments WHERE id=? AND user_id=?', id, userId)
    : one('SELECT * FROM enrollments WHERE user_id=? AND archived_at IS NULL', userId);
  if (!e) fail(404, 'Trilha não encontrada. Solicite a atribuição ao gestor.');
  return e;
}
export function progress(e) {
  const completed = new Set(all('SELECT lesson_id FROM lesson_completions WHERE enrollment_id=?', e.id).map(l => l.lesson_id));
  const attempts = all('SELECT id,module_id,attempt_number,score,passed,created_at FROM attempts WHERE enrollment_id=? ORDER BY id', e.id);
  let previousDone = true;
  const modules = JSON.parse(e.catalog_json).map(m => {
    const history = attempts.filter(a => a.module_id === m.id);
    const lessonsDone = m.lessons.filter(l => completed.has(l.id)).length;
    const passed = history.some(a => a.passed === 1);
    const done = lessonsDone === m.lessons.length && passed;
    const locked = !previousDone;
    previousDone = previousDone && done;
    return { id: m.id, position: m.position, title: m.title, duration_minutes: m.duration_minutes,
      min_score: m.min_score, max_attempts: m.max_attempts, lessons_total: m.lessons.length,
      lessons_done: lessonsDone, passed, done, locked, attempts: history,
      attempts_remaining: m.max_attempts - history.length,
      progress: Math.floor(100 * (lessonsDone + Number(passed)) / (m.lessons.length + 1)) };
  });
  const units = modules.reduce((sum, m) => sum + m.lessons_total + 1, 0);
  const doneUnits = modules.reduce((sum, m) => sum + m.lessons_done + Number(m.passed), 0);
  const done = modules.length > 0 && modules.every(m => m.done);
  return { id: e.id, cycle: e.cycle, reason: e.reason, assigned_at: e.assigned_at, due_at: e.due_at,
    completed_at: e.completed_at, archived_at: e.archived_at,
    status: done ? 'CONCLUIDO' : Date.now() > Date.parse(e.due_at) ? 'ATRASADO' : 'EM_DIA',
    progress: units ? Math.floor(100 * doneUnits / units) : 0, modules,
    certificate: one('SELECT id,issued_at FROM certificates WHERE enrollment_id=?', e.id) || null };
}
export function unlockedModule(e, moduleId, writable = false) {
  if (writable && (e.archived_at || e.completed_at)) fail(409, 'Este ciclo está encerrado e preservado para consulta.');
  const m = JSON.parse(e.catalog_json).find(m => m.id === moduleId);
  if (!m) fail(404, 'Módulo não encontrado nesta trilha.');
  const state = progress(e).modules.find(x => x.id === moduleId);
  if (state.locked) fail(403, 'Conclua e seja aprovado no módulo anterior.');
  return { m, state };
}
export function assign(userId, actorId, due, reason) {
  const user = one('SELECT * FROM users WHERE id=?', userId);
  if (!user || user.role !== 'COLABORADOR') fail(404, 'Colaborador não encontrado.');
  if (!user.active) fail(409, 'Reative o colaborador antes de atribuir uma trilha.');
  const modules = catalog();
  if (!modules.length || modules.some(m => !m.lessons.length || !m.questions.length)) fail(409, 'Catálogo incompleto.');
  const timestamp = now();
  run('UPDATE enrollments SET archived_at=? WHERE user_id=? AND archived_at IS NULL', timestamp, userId);
  const cycle = one('SELECT COALESCE(MAX(cycle),0)+1 AS n FROM enrollments WHERE user_id=?', userId).n;
  const id = Number(run('INSERT INTO enrollments(user_id,cycle,assigned_by,reason,assigned_at,due_at,catalog_json) VALUES(?,?,?,?,?,?,?)', userId, cycle, actorId, reason, timestamp, due, JSON.stringify(modules)).lastInsertRowid);
  audit(actorId, 'TRILHA_ATRIBUIDA', userId, { enrollment_id: id, cycle, reason, due_at: due });
  return progress(enrollmentFor(userId, id));
}
export function finishIfEligible(e) {
  if (progress(e).modules.every(m => m.done)) {
    const timestamp = now();
    run('UPDATE enrollments SET completed_at=COALESCE(completed_at,?) WHERE id=?', timestamp, e.id);
    const user = one('SELECT name FROM users WHERE id=?', e.user_id);
    run('INSERT OR IGNORE INTO certificates(id,enrollment_id,participant_name,issued_at) VALUES(?,?,?,?)', randomUUID(), e.id, user.name, timestamp);
  }
}
