import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { db, one, run, now, transaction } from './db.js';
import { assign, finishIfEligible } from './training.js';

const modules = [
  ['Boas-vindas ao posto', 8, 'Integração e rotina', 'Conheça a equipe, os canais de comunicação e as responsabilidades da função. Antes de atuar, receba orientação presencial do responsável. Registre dúvidas e consulte os procedimentos internos do posto. Esta trilha registra estudo e compreensão; não comprova prática supervisionada.', 'Ao iniciar no posto, qual é a primeira atitude?', ['Conhecer os procedimentos e pedir orientação ao responsável', 'Operar equipamentos sem orientação', 'Usar a senha de outro colega'], 0],
  ['Atendimento e vendas no caixa', 15, 'Atendimento e registro', 'Atenda com respeito, confirme o pedido e informe o valor antes de finalizar a operação. Use sua própria identificação no sistema. Confira o meio de pagamento e registre a venda de acordo com a rotina interna. Diante de divergência, chame o responsável; não altere valores para esconder diferenças.', 'O valor cobrado diverge do pedido. O que fazer?', ['Ignorar a diferença', 'Conferir o registro e solicitar apoio ao responsável', 'Apagar a venda sem registro'], 1],
  ['Segurança no manuseio de combustíveis', 18, 'Reconhecimento de riscos', 'Este conteúdo é uma introdução interna. Consulte os procedimentos de segurança do estabelecimento e participe das capacitações aplicáveis. Não improvise em situações de risco. Identifique previamente o responsável e os canais de comunicação para ocorrências; intervenções dependem de orientação e capacitação apropriadas.', 'Ao identificar uma condição insegura, qual conduta é adequada?', ['Improvisar uma solução', 'Continuar e avisar ao fim do turno', 'Comunicar o responsável e seguir o procedimento de segurança'], 2],
  ['Operação das bombas', 20, 'Conferência e orientação', 'Antes de qualquer operação, confirme os dados do atendimento e siga os procedimentos locais, o manual do equipamento e a orientação presencial recebida. Divergências de produto, valor ou equipamento devem ser comunicadas antes de prosseguir. A leitura deste módulo não habilita operação autônoma.', 'Há dúvida sobre o produto solicitado. O que fazer?', ['Confirmar o pedido antes de prosseguir', 'Escolher o produto mais vendido', 'Pedir que um colega use sua identificação'], 0],
  ['Normas de segurança e saúde (NR-20)', 22, 'Conteúdo interno e complementar', 'Este módulo apresenta apenas a importância de conhecer as responsabilidades e os procedimentos de segurança do posto. NÃO substitui capacitação legal obrigatória, inclusive NR-20. O certificado desta plataforma comprova somente a conclusão da trilha interna. O gestor deve organizar separadamente as capacitações, documentos e orientações aplicáveis às atividades de cada trabalhador.', 'O certificado desta plataforma substitui capacitação legal obrigatória?', ['Sim, em qualquer atividade', 'Não; comprova somente esta trilha interna complementar', 'Sim, se a nota for 100'], 1],
  ['Fechamento de caixa e conferência', 12, 'Conferência e passagem de turno', 'Confronte os registros de vendas e pagamentos conforme a rotina do posto. Registre divergências e comunique o responsável, preservando os comprovantes exigidos internamente. Na passagem de turno, informe pendências de forma clara. Nunca compartilhe senhas nem altere registros para ocultar diferenças.', 'Ao encontrar diferença no fechamento, o correto é:', ['Pagar sem registrar e esconder a diferença', 'Alterar vendas anteriores', 'Registrar a divergência e comunicar o responsável'], 2],
  ['Avaliação final e certificado', 15, 'Revisão da integração', 'Revise atendimento, registros, comunicação de riscos e limites de atuação. A aprovação de todas as avaliações e a conclusão de todas as aulas liberam o certificado interno. Em uma reciclagem, um novo ciclo começa, mantendo o histórico anterior. Na prática, procure sempre a orientação do responsável e cumpra as capacitações aplicáveis.', 'Antes de executar uma atividade para a qual não recebeu orientação, você deve:', ['Solicitar orientação e capacitação aplicáveis', 'Usar apenas o certificado interno como autorização', 'Copiar outro colaborador sem confirmar procedimentos'], 0]
];

export async function seed() {
  if (one('SELECT id FROM users LIMIT 1')) { console.log('Banco já possui usuários; seed não altera dados existentes.'); return; }
  const passwordHash = await bcrypt.hash('Demo@12345', 12);
  transaction(() => {
    modules.forEach(([title, duration, lessonTitle, content, prompt, options, correct], index) => {
      const mid = index + 1;
      run('INSERT INTO modules(id,position,title,duration_minutes,min_score,max_attempts) VALUES(?,?,?,?,?,?)', mid, mid, title, duration, 70, 3);
      run('INSERT INTO lessons(id,module_id,position,title,content) VALUES(?,?,?,?,?)', mid, mid, 1, lessonTitle, content);
      run('INSERT INTO questions(id,module_id,prompt,options_json,correct_index) VALUES(?,?,?,?,?)', mid * 10 + 1, mid, prompt, JSON.stringify(options), correct);
      run('INSERT INTO questions(id,module_id,prompt,options_json,correct_index) VALUES(?,?,?,?,?)', mid * 10 + 2, mid, 'Qual registro representa o estudo nesta plataforma?', JSON.stringify(['Uma autorização automática para atuar sem supervisão', 'O uso da conta compartilhada da equipe', 'A conclusão das aulas e as respostas da própria pessoa']), 2);
    });
    const users = [ ['Administrador Demo','admin@rego.local','ADMIN','Administrador'], ['Diogo Gestor','gestor@rego.local','GESTOR','Gestor do posto'], ['Maria Silva','maria@rego.local','COLABORADOR','Operadora de caixa'], ['Pedro Santos','pedro@rego.local','COLABORADOR','Frentista'], ['João Souza','joao@rego.local','COLABORADOR','Frentista'] ];
    users.forEach(([name,email,role,job], i) => run('INSERT INTO users(id,name,email,password_hash,role,job_title,created_at) VALUES(?,?,?,?,?,?,?)', i+1,name,email,passwordHash,role,job,now()));
    const future = new Date(Date.now() + 14 * 86400000).toISOString();
    assign(3, 2, future, 'Integração inicial — demonstração');
    const late = assign(4, 2, new Date(Date.now() - 86400000).toISOString(), 'Integração em atraso — demonstração');
    const finished = assign(5, 2, future, 'Integração concluída — demonstração');
    run('INSERT INTO lesson_completions VALUES(?,?,?)', late.id, 1, now());
    modules.forEach((m, index) => {
      const mid = index + 1;
      run('INSERT INTO lesson_completions VALUES(?,?,?)', finished.id, mid, now());
      run('INSERT INTO attempts(enrollment_id,module_id,attempt_number,answers_json,score,passed,created_at) VALUES(?,?,?,?,?,?,?)', finished.id, mid, 1, JSON.stringify([{question_id:mid*10+1,option_index:m[7]},{question_id:mid*10+2,option_index:2}]),100,1,now());
    });
    finishIfEligible(one('SELECT * FROM enrollments WHERE id=?', finished.id));
    run('UPDATE users SET last_activity_at=? WHERE id IN (4,5)', now());
  });
  console.log('Seed criado: 7 módulos, 5 usuários. Senha demo: Demo@12345');
}
await seed();
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) db.close();
