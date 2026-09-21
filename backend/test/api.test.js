import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const temp = mkdtempSync(path.join(tmpdir(),'rego-test-'));
process.env.DATABASE_PATH = path.join(temp,'test.sqlite');
process.env.JWT_SECRET = 'test-only-secret-with-more-than-thirty-two-characters';
let server, db, one, run, base, manager, admin, maria, joao, currentId;
const due = () => new Date(Date.now()+30*86400000).toISOString();
async function request(url, method='GET', body, cookie, extra={}) {
  const response=await fetch(base+url,{method,headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});
  const data=response.status===204?null:await response.json();
  return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
async function login(email){const r=await request('/api/auth/login','POST',{email,password:'Demo@12345'});assert.equal(r.status,200);return r.cookie;}
before(async()=>{
  ({db,one,run}=await import('../src/db.js'));
  await import('../src/seed.js');
  const {app}=await import('../src/app.js');
  server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  base=`http://127.0.0.1:${server.address().port}`;
  manager=await login('gestor@rego.local');admin=await login('admin@rego.local');maria=await login('maria@rego.local');joao=await login('joao@rego.local');
  currentId=(await request('/api/me/training','GET',undefined,maria)).data.id;
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));db?.close();rmSync(temp,{recursive:true,force:true});});
test('autenticação, hash, perfil e origem',async()=>{
  assert.match(one('SELECT password_hash FROM users WHERE id=3').password_hash,/^\$2[aby]\$/);
  assert.equal((await request('/api/auth/login','POST',{email:'maria@rego.local',password:'errada'})).status,401);
  assert.equal((await request('/api/me/training')).status,401);
  assert.equal((await request('/api/admin/dashboard','GET',undefined,maria)).status,403);
  assert.equal((await request('/api/admin/users','POST',{name:'Teste',email:'t@r.local',password:'12345678',role:'ADMIN'},manager)).status,403);
  assert.equal((await request('/api/auth/logout','POST',{},maria,{Origin:'https://evil.example'})).status,403);
  assert.equal((await request('/api/auth/me','GET',undefined,maria)).status,200);
});
test('módulo bloqueado, certificado prematuro e acesso ao ciclo alheio',async()=>{
  assert.equal((await request(`/api/me/enrollments/${currentId}/modules/2`,'GET',undefined,maria)).status,403);
  assert.equal((await request(`/api/me/enrollments/${currentId}/lessons/2/complete`,'POST',{},maria)).status,403);
  assert.equal((await request(`/api/me/enrollments/${currentId}/modules/2/attempts`,'POST',{answers:[{question_id:21,option_index:1}]},maria)).status,403);
  assert.equal((await request(`/api/me/enrollments/${currentId}/modules/1`,'GET',undefined,joao)).status,404);
  const t=(await request('/api/me/training','GET',undefined,maria)).data;
  assert.equal(t.certificate,null);assert.equal(t.progress,0);
  const other=(await request('/api/me/training','GET',undefined,joao)).data;
  assert.equal((await request('/api/certificates/'+other.certificate.id,'GET',undefined,maria)).status,404);
  assert.equal((await request('/api/certificates/'+other.certificate.id,'GET',undefined,manager)).status,200);
});
test('servidor não aceita nota/progresso e exige leitura',async()=>{
  const url=`/api/me/enrollments/${currentId}/modules/1/attempts`;
  assert.equal((await request(url,'POST',{answers:[{question_id:11,option_index:0},{question_id:12,option_index:2}]},maria)).status,409);
  assert.equal((await request(`/api/me/enrollments/${currentId}/lessons/1/complete`,'POST',{progress:100},maria)).status,400);
  const result=await request(`/api/me/enrollments/${currentId}/lessons/1/complete`,'POST',{},maria);assert.equal(result.status,200);
  await request(`/api/me/enrollments/${currentId}/lessons/1/complete`,'POST',{},maria);
  assert.equal(one('SELECT COUNT(*) AS n FROM lesson_completions WHERE enrollment_id=?',currentId).n,1);
  assert.equal((await request(url,'POST',{score:100,answers:[{question_id:11,option_index:0}]},maria)).status,400);
  for(const answers of [[{question_id:11,option_index:0},{question_id:11,option_index:0}],[{question_id:11,option_index:9},{question_id:12,option_index:2}]])assert.equal((await request(url,'POST',{answers},maria)).status,400);
  const module=(await request(`/api/me/enrollments/${currentId}/modules/1`,'GET',undefined,maria)).data;
  assert.ok(!JSON.stringify(module).includes('correct_index'));
  assert.equal(one('SELECT COUNT(*) AS n FROM attempts WHERE enrollment_id=?',currentId).n,0);
});
test('tentativas simultâneas respeitam limite e bloqueiam aprovação posterior',async()=>{
  const url=`/api/me/enrollments/${currentId}/modules/1/attempts`;
  const results=await Promise.all(Array.from({length:5},()=>request(url,'POST',{answers:[{question_id:11,option_index:1},{question_id:12,option_index:0}]},maria)));
  assert.equal(results.filter(r=>r.status===201).length,3);assert.equal(results.filter(r=>r.status===409).length,2);
  assert.equal(one('SELECT COUNT(*) AS n FROM attempts WHERE enrollment_id=?',currentId).n,3);
  assert.equal((await request(url,'POST',{answers:[{question_id:11,option_index:0},{question_id:12,option_index:2}]},maria)).status,409);
});
test('reciclagem preserva tentativas antigas, arquiva ciclo e reinicia progresso',async()=>{
  const oldId=currentId;
  const result=await request('/api/admin/users/3/enrollments','POST',{due_at:due(),reason:'Reciclagem após orientação'},manager);
  assert.equal(result.status,201);currentId=result.data.id;assert.equal(result.data.progress,0);assert.equal(result.data.cycle,2);
  assert.equal(one('SELECT COUNT(*) AS n FROM attempts WHERE enrollment_id=?',oldId).n,3);
  assert.equal((await request(`/api/me/enrollments/${oldId}/lessons/1/complete`,'POST',{},maria)).status,409);
  assert.equal((await request('/api/me/enrollments','GET',undefined,maria)).data.length,2);
});
test('aprovação libera sequência e conclusão emite certificado único',async()=>{
  const correct=[0,1,2,0,1,2,0];
  for(let m=1;m<=7;m++){
    const l=await request(`/api/me/enrollments/${currentId}/lessons/${m}/complete`,'POST',{},maria);assert.equal(l.status,200);
    const r=await request(`/api/me/enrollments/${currentId}/modules/${m}/attempts`,'POST',{answers:[{question_id:m*10+1,option_index:correct[m-1]},{question_id:m*10+2,option_index:2}]},maria);
    assert.equal(r.status,201);assert.equal(r.data.score,100);assert.equal(r.data.passed,true);
    if(m<7){assert.equal(r.data.training.modules[m].locked,false);assert.equal(r.data.training.certificate,null);}
  }
  const t=(await request('/api/me/training','GET',undefined,maria)).data;
  assert.equal(t.status,'CONCLUIDO');assert.equal(t.progress,100);assert.ok(t.completed_at);assert.ok(t.certificate);
  const c=await request('/api/certificates/'+t.certificate.id,'GET',undefined,maria);assert.equal(c.status,200);assert.match(c.data.notice,/não substitui/);
  assert.equal((await request(`/api/me/enrollments/${currentId}/modules/7/attempts`,'POST',{answers:[{question_id:71,option_index:0},{question_id:72,option_index:2}]},maria)).status,409);
  assert.equal(one('SELECT COUNT(*) AS n FROM certificates WHERE enrollment_id=?',currentId).n,1);
});
test('regras são configuráveis e imutáveis em ciclos existentes',async()=>{
  assert.equal((await request('/api/admin/modules/1','PATCH',{min_score:50,max_attempts:1},manager)).status,200);
  const oldId=currentId;
  const r=await request('/api/admin/users/3/enrollments','POST',{due_at:due(),reason:'Novo ciclo de atualização'},manager);currentId=r.data.id;
  assert.equal(r.data.modules[0].min_score,50);assert.equal(r.data.modules[0].max_attempts,1);
  const h=(await request('/api/me/enrollments','GET',undefined,maria)).data;
  assert.equal(h.find(e=>e.id===oldId).modules[0].min_score,70);assert.ok(h.find(e=>e.id===oldId).certificate);
  await request(`/api/me/enrollments/${currentId}/lessons/1/complete`,'POST',{},maria);
  const half=await request(`/api/me/enrollments/${currentId}/modules/1/attempts`,'POST',{answers:[{question_id:11,option_index:0},{question_id:12,option_index:0}]},maria);
  assert.equal(half.data.score,50);assert.equal(half.data.passed,true);
});
test('prazo, dashboard, última atividade e auditoria',async()=>{
  run('UPDATE enrollments SET due_at=? WHERE id=?',new Date(Date.now()-1000).toISOString(),currentId);
  assert.equal((await request('/api/me/training','GET',undefined,maria)).data.status,'ATRASADO');
  const r=await request('/api/admin/enrollments/'+currentId,'PATCH',{due_at:due(),reason:'Prazo ajustado pelo gestor'},manager);assert.equal(r.data.status,'EM_DIA');
  const d=(await request('/api/admin/dashboard','GET',undefined,manager)).data;
  assert.equal(d.stats.active,3);assert.equal(d.stats.overdue,1);assert.ok(d.users.find(u=>u.id===3).last_activity_at);
  assert.ok(one("SELECT id FROM audit_events WHERE action='PRAZO_ALTERADO'"));
  assert.equal((await request('/api/admin/enrollments/'+currentId,'PATCH',{due_at:'2020-01-01T00:00:00Z',reason:'Data passada'},manager)).status,400);
});
test('cadastro, duplicidade, inativação e revogação do JWT',async()=>{
  const body={name:'Nova Pessoa',email:'nova@rego.local',password:'Senha@12345',due_at:due()};
  const created=await request('/api/admin/users','POST',body,manager);assert.equal(created.status,201);assert.equal(created.data.role,'COLABORADOR');assert.equal(created.data.password_hash,undefined);
  assert.equal((await request('/api/admin/users','POST',body,manager)).status,409);
  assert.equal((await request('/api/admin/users/3','PATCH',{active:false},manager)).status,200);
  assert.equal((await request('/api/me/training','GET',undefined,maria)).status,401);
  assert.equal((await request('/api/auth/login','POST',{email:'maria@rego.local',password:'Demo@12345'})).status,401);
  assert.equal((await request('/api/admin/users/3/enrollments','POST',{due_at:due(),reason:'Não permitido inativo'},manager)).status,409);
  await request('/api/admin/users/3','PATCH',{active:true},manager);
  assert.equal((await request('/api/me/training','GET',undefined,maria)).status,401);
  maria=await login('maria@rego.local');assert.equal((await request('/api/me/training','GET',undefined,maria)).status,200);
  assert.equal((await request('/api/admin/users/2','PATCH',{active:false},manager)).status,403);
  assert.equal((await request('/api/admin/users/1','PATCH',{active:false},admin)).status,409);
});
test('checklist é validado no servidor e dúvidas ficam disponíveis só à gestão',async()=>{
  const url=`/api/me/enrollments/${currentId}/modules/2`;
  assert.equal((await request(url+'/checklist','PUT',{items:[{lesson_id:1,completed:true}]},maria)).status,400);
  assert.equal((await request(url+'/checklist','PUT',{items:[{lesson_id:2,completed:true}]},maria)).status,200);
  assert.equal((await request(url+'/checklist','PUT',{items:[{lesson_id:2,completed:false}]},maria)).status,200);
  assert.equal((await request(url,'GET',undefined,maria)).data.lessons_done,0);
  const help=await request(url+'/help','POST',{message:'Preciso de orientação sobre esta aula.'},maria);
  assert.equal(help.status,201);
  assert.equal((await request('/api/admin/help-requests','GET',undefined,maria)).status,403);
  assert.ok((await request('/api/admin/help-requests','GET',undefined,manager)).data.some(h=>h.id===help.data.id));
  assert.equal((await request(`/api/me/enrollments/${currentId}/modules/1/checklist`,'PUT',{items:[{lesson_id:1,completed:false}]},maria)).status,409);
});
test('contrato do React existente funciona sem editar o frontend',async()=>{
  const loginResult=await request('/api/auth/login','POST',{usuario:'maria@rego.local',senha:'Demo@12345',manterConectado:true});
  assert.equal(loginResult.status,200);assert.equal(loginResult.data.usuario.perfil,'colaborador');
  const cookie=loginResult.cookie;
  assert.equal((await request('/api/auth/me','GET',undefined,cookie)).data.usuario.nome,'Maria Silva');
  const list=await request('/api/me/modulos','GET',undefined,cookie);
  assert.equal(list.status,200);assert.equal(list.data.modulos.length,7);
  const mid=list.data.modulos[1].id;
  const module=await request('/api/modulos/'+encodeURIComponent(mid),'GET',undefined,cookie);
  assert.equal(module.status,200);assert.ok(module.data.checklist[0].texto);assert.equal(module.data.perguntas.length,2);
  const path='/api/modulos/'+encodeURIComponent(mid);
  const checklist=await request(path+'/checklist','PUT',{itens:module.data.checklist.map(i=>({itemId:i.itemId,concluido:true}))},cookie);
  assert.equal(checklist.status,200);assert.equal(checklist.data.itens[0].concluido,true);
  const quiz=await request(path+'/respostas','POST',{respostas:[{perguntaId:'21',alternativaId:'1'},{perguntaId:'22',alternativaId:'2'}]},cookie);
  assert.equal(quiz.status,201);assert.equal(quiz.data.nota,100);assert.equal(quiz.data.aprovado,true);
  const help=await request(path+'/ajuda','POST',{mensagem:'Dúvida pelo frontend existente'},cookie);assert.equal(help.status,201);assert.ok(help.data.solicitacaoId);
  assert.equal((await request('/api/equipe/painel','GET',undefined,cookie)).status,403);
  const dashboard=await request('/api/equipe/painel','GET',undefined,manager);assert.equal(dashboard.status,200);assert.ok(dashboard.data.metricas);assert.ok(Array.isArray(dashboard.data.colaboradores));
  const recovery=await request('/api/auth/recuperar-senha','POST',{usuario:'maria@rego.local'});assert.equal(recovery.status,501);assert.match(recovery.data.mensagem,/não configurada/);
  const old=list.data.modulos[0].id;
  await request('/api/admin/users/3/enrollments','POST',{due_at:due(),reason:'Novo ciclo para teste de tela antiga'},manager);
  assert.equal((await request('/api/modulos/'+encodeURIComponent(old)+'/checklist','PUT',{itens:[{itemId:'1',concluido:false}]},cookie)).status,409);
});
test('logout revoga sessão e frontend é servido sem expor banco',async()=>{
  assert.equal((await request('/api/auth/logout','POST',{},maria)).status,204);
  assert.equal((await request('/api/auth/me','GET',undefined,maria)).status,401);
  assert.equal((await fetch(base+'/')).status,200);
  assert.equal((await fetch(base+'/backend/.env')).status,404);
  assert.equal((await fetch(base+'/data/treinamento.sqlite')).status,404);
});
