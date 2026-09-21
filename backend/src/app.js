import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z, ZodError } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { compatibility, frontendUser } from './compatibility.js';
import { config, checkSecret } from './config.js';
import { all, one, run, now, transaction, audit } from './db.js';
import { fail, catalog, enrollmentFor, progress, unlockedModule, assign, finishIfEligible } from './training.js';

checkSecret();
export const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: {
  'script-src': ["'self'"], 'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'], 'upgrade-insecure-requests': null
} }, strictTransportSecurity: config.production ? undefined : false }));
app.use(cors({ origin(origin, callback) { callback(null, !origin || config.origins.includes(origin)); }, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use('/api', (req, res, next) => {
  const json = res.json.bind(res);
  res.json = body => json(body?.error ? { ...body, mensagem: body.error } : body);
  res.set('Cache-Control', 'no-store');
  if (!['GET','HEAD','OPTIONS'].includes(req.method) &&
    ((req.headers.origin && !config.origins.includes(req.headers.origin)) || req.headers['sec-fetch-site'] === 'cross-site')) {
    return res.status(403).json({ error: 'Origem não permitida.' });
  }
  next();
});
const id = value => z.coerce.number().int().positive().parse(value);
const credentials = z.object({ email: z.email().max(254).transform(v => v.toLowerCase().trim()), password: z.string().min(1).max(72).refine(s => Buffer.byteLength(s, 'utf8') <= 72, 'Senha deve ter até 72 bytes.') }).strict();
const password = z.string().min(8).max(72).refine(s => Buffer.byteLength(s, 'utf8') <= 72, 'Senha deve ter até 72 bytes.');
const dueDate = z.iso.datetime({ offset: true }).transform(v => new Date(v).toISOString()).refine(v => Date.parse(v) > Date.now(), 'Prazo deve ser futuro.');
const safeUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, job_title: u.job_title, active: Boolean(u.active), last_activity_at: u.last_activity_at });
const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: config.production, path: '/api' };
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' } });
const dummyHash = bcrypt.hashSync('comparacao-de-tempo-apenas', 12);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/login', limiter, async (req, res) => {
  let remember = false;
  if (req.body?.usuario !== undefined) {
    const legacy = z.object({ usuario: z.string(), senha: z.string(), manterConectado: z.boolean().default(false) }).strict().parse(req.body);
    remember = legacy.manterConectado;
    req.body = { email: legacy.usuario, password: legacy.senha };
  }
  const body = credentials.parse(req.body);
  const u = one('SELECT * FROM users WHERE email=?', body.email);
  const valid = await bcrypt.compare(body.password, u?.password_hash || dummyHash);
  if (!u || !valid || !u.active) fail(401, 'E-mail ou senha inválidos.');
  run('UPDATE users SET last_activity_at=? WHERE id=?', now(), u.id);
  const token = jwt.sign({ ver: u.token_version }, config.secret, { subject: String(u.id), algorithm: 'HS256', expiresIn: remember ? '7d' : config.expires, issuer: 'rego-api', audience: 'rego-web' });
  res.cookie('rego_session', token, remember ? { ...cookieOptions, maxAge: 7*86400000 } : cookieOptions).json({ user: safeUser(u), usuario: frontendUser(u) });
});
app.post('/api/auth/recuperar-senha', limiter, (req, res) => res.status(501).json({ error: 'Recuperação por e-mail não configurada nesta versão local. Procure o responsável pelo projeto.' }));
app.use('/api', (req, res, next) => {
  const cookie = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('rego_session='))?.slice(13);
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : cookie;
  let payload;
  try { payload = jwt.verify(token || '', config.secret, { algorithms: ['HS256'], issuer: 'rego-api', audience: 'rego-web' }); }
  catch { return res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' }); }
  const u = one('SELECT * FROM users WHERE id=?', Number(payload.sub));
  if (!u || !u.active || payload.ver !== u.token_version) return res.status(401).json({ error: 'Acesso revogado. Entre novamente ou procure o gestor.' });
  req.user = u;
  next();
});
const roles = (...allowed) => (req, res, next) => allowed.includes(req.user.role) ? next() : res.status(403).json({ error: 'Perfil sem permissão.' });
const manager = roles('ADMIN', 'GESTOR');
const learner = roles('COLABORADOR');
const activity = userId => run('UPDATE users SET last_activity_at=? WHERE id=?', now(), userId);
app.use('/api', (req, res, next) => {
  if (req.user.role === 'COLABORADOR' && ['/me/modulos'].includes(req.path)) activity(req.user.id);
  next();
}, compatibility);
app.get('/api/auth/me', (req, res) => res.json({ ...safeUser(req.user), usuario: frontendUser(req.user) }));
app.post('/api/auth/logout', (req, res) => {
  run('UPDATE users SET token_version=token_version+1 WHERE id=?', req.user.id);
  res.clearCookie('rego_session', cookieOptions).status(204).end();
});
app.get('/api/me/enrollments', learner, (req, res) => res.json(all('SELECT * FROM enrollments WHERE user_id=? ORDER BY cycle DESC', req.user.id).map(progress)));
app.get('/api/me/training', learner, (req, res) => {
  activity(req.user.id);
  res.json(progress(enrollmentFor(req.user.id)));
});
app.get('/api/me/enrollments/:id/modules/:moduleId', learner, (req, res) => {
  const e = enrollmentFor(req.user.id, id(req.params.id));
  const { m, state } = unlockedModule(e, id(req.params.moduleId));
  const done = new Set(all('SELECT lesson_id FROM lesson_completions WHERE enrollment_id=?', e.id).map(l => l.lesson_id));
  activity(req.user.id);
  res.json({ ...state, enrollment_id: e.id, read_only: Boolean(e.archived_at || e.completed_at),
    lessons: m.lessons.map(l => ({ id: l.id, title: l.title, content: l.content, completed: done.has(l.id) })),
    questions: m.questions.map(q => ({ id: q.id, prompt: q.prompt, options: q.options })) });
});
app.post('/api/me/enrollments/:id/lessons/:lessonId/complete', learner, (req, res) => {
  z.object({}).strict().parse(req.body || {});
  const result = transaction(() => {
    const e = enrollmentFor(req.user.id, id(req.params.id));
    const lessonId = id(req.params.lessonId);
    const m = JSON.parse(e.catalog_json).find(m => m.lessons.some(l => l.id === lessonId));
    if (!m) fail(404, 'Aula não encontrada.');
    unlockedModule(e, m.id, true);
    run('INSERT OR IGNORE INTO lesson_completions(enrollment_id,lesson_id,completed_at) VALUES(?,?,?)', e.id, lessonId, now());
    activity(req.user.id);
    return progress(e);
  });
  res.json(result);
});
app.post('/api/me/enrollments/:id/modules/:moduleId/attempts', learner, (req, res) => {
  const body = z.object({ answers: z.array(z.object({ question_id: z.number().int().positive(), option_index: z.number().int().nonnegative() }).strict()).min(1).max(100) }).strict().parse(req.body);
  const result = transaction(() => {
    const e = enrollmentFor(req.user.id, id(req.params.id));
    const { m, state } = unlockedModule(e, id(req.params.moduleId), true);
    if (state.done) fail(409, 'Módulo já aprovado.');
    if (state.lessons_done !== state.lessons_total) fail(409, 'Conclua todas as aulas antes da avaliação.');
    if (!state.attempts_remaining) fail(409, 'Limite de tentativas atingido. Solicite reciclagem ao gestor.');
    const answers = new Map(body.answers.map(a => [a.question_id, a.option_index]));
    if (answers.size !== m.questions.length || body.answers.length !== m.questions.length ||
      m.questions.some(q => !answers.has(q.id) || answers.get(q.id) >= q.options.length)) fail(400, 'Envie exatamente uma alternativa válida por questão.');
    const correct = m.questions.filter(q => answers.get(q.id) === q.correct_index).length;
    const rawScore = correct * 100 / m.questions.length;
    const score = Math.round(rawScore * 100) / 100;
    const passed = rawScore >= m.min_score;
    const number = state.attempts.length + 1;
    run('INSERT INTO attempts(enrollment_id,module_id,attempt_number,answers_json,score,passed,created_at) VALUES(?,?,?,?,?,?,?)', e.id, m.id, number, JSON.stringify(body.answers), score, Number(passed), now());
    finishIfEligible(e);
    activity(req.user.id);
    return { score, passed, attempt_number: number, attempts_remaining: m.max_attempts - number, training: progress(enrollmentFor(req.user.id, e.id)) };
  });
  res.status(201).json(result);
});
app.get('/api/certificates/:id', (req, res) => {
  const c = one('SELECT c.*,e.user_id,e.cycle,e.catalog_json FROM certificates c JOIN enrollments e ON e.id=c.enrollment_id WHERE c.id=?', req.params.id);
  if (!c || (req.user.role === 'COLABORADOR' && req.user.id !== c.user_id)) fail(404, 'Certificado não encontrado.');
  res.json({ id: c.id, enrollment_id: c.enrollment_id, participant_name: c.participant_name, issued_at: c.issued_at, cycle: c.cycle,
    title: 'Certificado de conclusão — Trilha interna de integração',
    modules: JSON.parse(c.catalog_json).map(m => m.title),
    notice: 'Conteúdo interno e complementar. Este certificado não substitui capacitação legal obrigatória, inclusive NR-20, nem autoriza atividades operacionais sem orientação e habilitação aplicáveis.' });
});
app.put('/api/me/enrollments/:id/modules/:moduleId/checklist', learner, (req, res) => {
  const body = z.object({ items: z.array(z.object({ lesson_id: z.number().int().positive(), completed: z.boolean() }).strict()).min(1).max(100) }).strict().parse(req.body);
  const result = transaction(() => {
    const e = enrollmentFor(req.user.id, id(req.params.id));
    const { m, state } = unlockedModule(e, id(req.params.moduleId), true);
    if (state.done) fail(409, 'Módulo aprovado não pode ter leituras alteradas.');
    const items = new Map(body.items.map(i => [i.lesson_id, i.completed]));
    if (items.size !== m.lessons.length || body.items.length !== m.lessons.length || m.lessons.some(l => !items.has(l.id))) fail(400, 'Envie exatamente um estado para cada aula deste módulo.');
    for (const [lessonId, completed] of items) {
      if (completed) run('INSERT OR IGNORE INTO lesson_completions VALUES(?,?,?)', e.id, lessonId, now());
      else run('DELETE FROM lesson_completions WHERE enrollment_id=? AND lesson_id=?', e.id, lessonId);
    }
    activity(req.user.id);
    return progress(e);
  });
  res.json(result);
});
app.post('/api/me/enrollments/:id/modules/:moduleId/help', learner, (req, res) => {
  const body = z.object({ message: z.string().trim().min(3).max(2000) }).strict().parse(req.body);
  const e = enrollmentFor(req.user.id, id(req.params.id));
  const { m } = unlockedModule(e, id(req.params.moduleId));
  const requestId = Number(run('INSERT INTO help_requests(user_id,enrollment_id,module_id,message,created_at) VALUES(?,?,?,?,?)', req.user.id,e.id,m.id,body.message,now()).lastInsertRowid);
  activity(req.user.id);
  res.status(201).json({ id: requestId });
});
app.get('/api/admin/help-requests', manager, (req,res) => res.json(all('SELECT h.*,u.name FROM help_requests h JOIN users u ON u.id=h.user_id ORDER BY h.id DESC')));
app.get('/api/admin/dashboard', manager, (req, res) => {
  const users = all("SELECT * FROM users WHERE role='COLABORADOR' ORDER BY name").map(u => {
    const e = one('SELECT * FROM enrollments WHERE user_id=? AND archived_at IS NULL', u.id);
    return { ...safeUser(u), training: e ? progress(e) : null };
  });
  const active = users.filter(u => u.active);
  res.json({ stats: { active: active.length, average_progress: active.length ? Math.round(active.reduce((sum,u) => sum + (u.training?.progress || 0),0) / active.length) : 0,
    new_this_month: one("SELECT COUNT(*) AS n FROM users WHERE active=1 AND role='COLABORADOR' AND substr(created_at,1,7)=?", now().slice(0,7)).n,
    due_in_seven_days: active.filter(u => u.training && u.training.status !== 'CONCLUIDO' && Date.parse(u.training.due_at) >= Date.now() && Date.parse(u.training.due_at) <= Date.now()+7*86400000).length,
    pending: active.filter(u => u.training && u.training.status !== 'CONCLUIDO').length,
    overdue: active.filter(u => u.training?.status === 'ATRASADO').length,
    unassigned: active.filter(u => !u.training).length }, users });
});
app.get('/api/admin/users', manager, (req, res) => res.json(all(req.user.role === 'ADMIN' ? 'SELECT * FROM users ORDER BY name' : "SELECT * FROM users WHERE role='COLABORADOR' ORDER BY name").map(safeUser)));
app.post('/api/admin/users', manager, async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(100), email: z.email().max(254).transform(v => v.toLowerCase()), password,
    role: z.enum(['ADMIN','GESTOR','COLABORADOR']).default('COLABORADOR'), job_title: z.string().trim().min(2).max(80).default('Frentista'), due_at: dueDate.optional() }).strict().parse(req.body);
  if (req.user.role === 'GESTOR' && body.role !== 'COLABORADOR') fail(403, 'Somente ADMIN pode criar gestores ou administradores.');
  if (body.due_at && body.role !== 'COLABORADOR') fail(400, 'Apenas colaboradores recebem trilha.');
  const hash = await bcrypt.hash(body.password, 12);
  const result = transaction(() => {
    if (one('SELECT id FROM users WHERE email=?', body.email)) fail(409, 'E-mail já cadastrado.');
    const userId = Number(run('INSERT INTO users(name,email,password_hash,role,job_title,created_at) VALUES(?,?,?,?,?,?)', body.name, body.email, hash, body.role, body.job_title, now()).lastInsertRowid);
    if (body.due_at) assign(userId, req.user.id, body.due_at, 'Integração inicial');
    audit(req.user.id, 'USUARIO_CRIADO', userId);
    return safeUser(one('SELECT * FROM users WHERE id=?', userId));
  });
  res.status(201).json(result);
});
app.patch('/api/admin/users/:id', manager, (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(100).optional(), job_title: z.string().trim().min(2).max(80).optional(), active: z.boolean().optional() }).strict().refine(b => Object.keys(b).length > 0).parse(req.body);
  const userId = id(req.params.id);
  const u = one('SELECT * FROM users WHERE id=?', userId);
  if (!u) fail(404, 'Usuário não encontrado.');
  if (req.user.role === 'GESTOR' && u.role !== 'COLABORADOR') fail(403, 'Gestor administra apenas colaboradores.');
  if (u.id === req.user.id && body.active === false) fail(409, 'Não é permitido inativar a própria conta.');
  transaction(() => {
    run('UPDATE users SET name=?,job_title=?,active=?,token_version=token_version+? WHERE id=?', body.name ?? u.name, body.job_title ?? u.job_title, body.active === undefined ? u.active : Number(body.active), body.active === undefined ? 0 : 1, userId);
    audit(req.user.id, 'USUARIO_ATUALIZADO', userId, body);
  });
  res.json(safeUser(one('SELECT * FROM users WHERE id=?', userId)));
});
app.post('/api/admin/users/:id/enrollments', manager, (req, res) => {
  const body = z.object({ due_at: dueDate, reason: z.string().trim().min(5).max(300) }).strict().parse(req.body);
  res.status(201).json(transaction(() => assign(id(req.params.id), req.user.id, body.due_at, body.reason)));
});
app.get('/api/admin/users/:id/enrollments', manager, (req, res) => res.json(all('SELECT * FROM enrollments WHERE user_id=? ORDER BY cycle DESC', id(req.params.id)).map(progress)));
app.patch('/api/admin/enrollments/:id', manager, (req, res) => {
  const body = z.object({ due_at: dueDate, reason: z.string().trim().min(5).max(300) }).strict().parse(req.body);
  const e = one('SELECT * FROM enrollments WHERE id=?', id(req.params.id));
  if (!e) fail(404, 'Trilha não encontrada.');
  if (e.completed_at || e.archived_at) fail(409, 'Ciclo encerrado não pode ter prazo alterado.');
  transaction(() => {
    run('UPDATE enrollments SET due_at=? WHERE id=?', body.due_at, e.id);
    audit(req.user.id, 'PRAZO_ALTERADO', e.user_id, { enrollment_id: e.id, previous_due_at: e.due_at, ...body });
  });
  res.json(progress(enrollmentFor(e.user_id, e.id)));
});
app.get('/api/admin/modules', manager, (req, res) => res.json(catalog().map(m => ({ ...m, questions: m.questions.map(({ correct_index, ...q }) => q) }))));
app.patch('/api/admin/modules/:id', manager, (req, res) => {
  const body = z.object({ min_score: z.number().int().min(1).max(100), max_attempts: z.number().int().min(1).max(20) }).strict().parse(req.body);
  const moduleId = id(req.params.id);
  if (!one('SELECT id FROM modules WHERE id=?', moduleId)) fail(404, 'Módulo não encontrado.');
  transaction(() => { run('UPDATE modules SET min_score=?,max_attempts=? WHERE id=?', body.min_score, body.max_attempts, moduleId); audit(req.user.id, 'REGRA_MODULO_ALTERADA', moduleId, body); });
  res.json({ ...body, message: 'Regras aplicadas somente a novas trilhas. Ciclos existentes preservam suas regras.' });
});
app.use('/api', (req,res) => res.status(404).json({ error: 'Endpoint não encontrado.' }));
// O build React é servido na mesma origem da API; HTML/CSS legados permanecem no repositório.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
app.use(express.static(dist, { dotfiles: 'deny' }));
app.get('/', (req, res) => {
  if (existsSync(path.join(dist, 'index.html'))) return res.sendFile(path.join(dist, 'index.html'));
  res.json({ service: 'Treinamento AutoPosto API', health: '/api/health', documentation: 'backend/README.md' });
});
app.use((error, req, res, next) => {
  if (error instanceof ZodError) return res.status(400).json({ error: 'Dados inválidos.', details: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Requisição muito grande.' });
  const status = error.status || 500;
  if (status === 500) console.error(error);
  res.status(status).json({ error: status === 500 ? 'Erro interno. Tente novamente.' : error.message });
});
