// Adapta o contrato do React existente sem duplicar as regras de treinamento.
import { z } from 'zod';
import { enrollmentFor, progress, fail } from './training.js';

export const frontendUser = u => ({ id: String(u.id), nome: u.name, cargo: u.job_title,
  perfil: u.role === 'COLABORADOR' ? 'colaborador' : 'gestor',
  empresa: { id: '1', nome: 'Autoposto Rego & CIA' } });
const moduleStatus = m => m.done ? 'concluido' : m.locked ? 'bloqueado' : m.progress ? 'em_andamento' : 'nao_iniciado';

export function compatibility(req, res, next) {
  const url = req.path;
  const json = res.json.bind(res);
  if (url === '/me/modulos' && req.method === 'GET') {
    if (req.user.role !== 'COLABORADOR') return res.status(403).json({ error: 'Perfil sem permissão.' });
    const e = enrollmentFor(req.user.id), t = progress(e);
    const current = t.modules.find(m => !m.done && !m.locked);
    return res.json({ resumo: { progressoPercentual: t.progress, moduloAtualId: current ? `${e.id}:${current.id}` : null, moduloAtualOrdem: current?.position || null, totalModulos: t.modules.length, concluido: t.status === 'CONCLUIDO', status: t.status.toLowerCase(), prazoLimite: e.due_at, atrasado: t.status === 'ATRASADO', certificado: t.certificate ? { id: t.certificate.id, emitidoEm: t.certificate.issued_at } : null },
      modulos: t.modules.map(m => ({ id: `${e.id}:${m.id}`, ordem: m.position, titulo: m.title, duracaoMinutos: m.duration_minutes, tipo: 'Leitura + avaliação', status: moduleStatus(m), ativo: m.id === current?.id })) });
  }
  if (url === '/equipe/painel' && req.method === 'GET') {
    req.url = '/admin/dashboard';
    res.json = d => {
      if (res.statusCode >= 400) return json(d);
      const t = d.users.find(u => u.training)?.training;
      return json({ totalModulos: t?.modules.length || 7, metricas: { colaboradoresAtivos: d.stats.active, novosColaboradoresMes: d.stats.new_this_month,
        conclusaoMediaPercentual: d.stats.average_progress, variacaoConclusao14DiasPontosPercentuais: null,
        treinamentosPendentes: d.stats.pending, pendentesVencendoEm7Dias: d.stats.due_in_seven_days },
        colaboradores: d.users.map(u => ({ id: String(u.id), nome: u.name, cargo: u.job_title, ativo: u.active,
          progressoPercentual: u.training?.progress || 0, moduloAtual: u.training?.modules.find(m => !m.done) ? { id: `${u.training.id}:${u.training.modules.find(m => !m.done).id}`, titulo: u.training.modules.find(m => !m.done).title } : null,
          ultimaAtividadeEm: u.last_activity_at, status: u.training?.status.toLowerCase() || 'sem_trilha' })) });
    };
    return next();
  }
  const match = url.match(/^\/modulos\/([^/]+)(?:\/(respostas|checklist|ajuda))?$/);
  if (!match) return next();
  if (req.user.role !== 'COLABORADOR') return res.status(403).json({ error: 'Perfil sem permissão.' });
  // IDs emitidos pela API incluem o ciclo, impedindo que uma tela antiga grave no ciclo novo.
  const composite = decodeURIComponent(match[1]).match(/^(\d+):(\d+)$/);
  if (!composite) fail(400, 'Use o ID de módulo retornado em /me/modulos (ciclo:módulo).');
  const e = enrollmentFor(req.user.id, Number(composite[1]));
  const moduleId = Number(composite[2]);
  const base = `/me/enrollments/${e.id}/modules/${moduleId}`;
  const action = match[2];
  if (!action && req.method === 'GET') {
    req.url = base;
    res.json = m => res.statusCode >= 400 ? json(m) : json({ id: `${e.id}:${m.id}`, ordem: m.position, totalModulos: JSON.parse(e.catalog_json).length,
      titulo: m.title, duracaoMinutos: m.duration_minutes, tipo: 'Leitura + avaliação', status: moduleStatus(m), video: null,
      notaMinima: m.min_score, tentativasRestantes: m.attempts_remaining, tentativas: m.attempts,
      perguntas: m.questions.map(q => ({ id: String(q.id), texto: q.prompt, alternativas: q.options.map((texto, i) => ({ id: String(i), texto })) })),
      checklist: m.lessons.map(l => ({ itemId: String(l.id), texto: `${l.title}: ${l.content} — Declaro que li este conteúdo.`, concluido: l.completed })) });
  } else if (action === 'respostas' && req.method === 'POST') {
    const b = z.object({ respostas: z.array(z.object({ perguntaId: z.string().regex(/^\d+$/), alternativaId: z.string().regex(/^\d+$/) }).strict()).min(1).max(100) }).strict().parse(req.body);
    req.body = { answers: b.respostas.map(a => ({ question_id: Number(a.perguntaId), option_index: Number(a.alternativaId) })) };
    req.url = base + '/attempts';
    res.json = r => res.statusCode >= 400 ? json(r) : json({ tentativaId: `${e.id}:${moduleId}:${r.attempt_number}`, nota: r.score, aprovado: r.passed, statusModulo: r.passed ? 'concluido' : 'em_andamento', mensagem: 'Respostas registradas.' });
  } else if (action === 'checklist' && req.method === 'PUT') {
    const b = z.object({ itens: z.array(z.object({ itemId: z.string().regex(/^\d+$/), concluido: z.boolean() }).strict()).min(1).max(100) }).strict().parse(req.body);
    req.body = { items: b.itens.map(i => ({ lesson_id: Number(i.itemId), completed: i.concluido })) };
    req.url = base + '/checklist';
    res.json = r => res.statusCode >= 400 ? json(r) : json({ itens: b.itens, statusModulo: moduleStatus(r.modules.find(m => m.id === moduleId)) });
  } else if (action === 'ajuda' && req.method === 'POST') {
    const b = z.object({ mensagem: z.string().trim().min(3).max(2000) }).strict().parse(req.body);
    req.body = { message: b.mensagem }; req.url = base + '/help';
    res.json = r => res.statusCode >= 400 ? json(r) : json({ solicitacaoId: String(r.id), status: 'aberta' });
  }
  next();
}
