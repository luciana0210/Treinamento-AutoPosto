# API REST

Base local: `http://127.0.0.1:3000/api`. Corpos JSON; envie `Content-Type: application/json`. O login entrega o JWT em cookie `rego_session`, HttpOnly, SameSite=Strict, restrito a `/api`. O navegador envia automaticamente. Não há token na resposta JSON. Clientes como Postman devem manter os cookies. O middleware também aceita `Authorization: Bearer <JWT>` quando o cliente já possui um token válido emitido por este servidor. Os aliases compatíveis com o React existente estão em [integracao-backend.md](integracao-backend.md).

Toda rota, exceto saúde e login, exige conta ativa e sessão válida. Papéis são lidos do banco a cada chamada. Origens de escritas são verificadas; configure CORS no `.env`. O frontend servido junto da API usa a mesma origem. O modo de cookie estrito não foi projetado para um frontend hospedado em outro site.

## Endpoints

| Método e caminho | Perfil | Entrada / resultado |
|---|---|---|
| GET `/health` | Público | `{status:"ok"}` |
| POST `/auth/login` | Público | `{email,password}` → `{user}` + cookie; até 30 chamadas por IP/15 min |
| GET `/auth/me` | Autenticado | Identidade, papel, cargo, ativo e última atividade; sem hash |
| POST `/auth/logout` | Autenticado | Revoga todas as sessões do usuário, limpa cookie, 204 |
| GET `/me/training` | COLABORADOR | Ciclo atual, status, progresso, módulos, tentativas e certificado se elegível |
| GET `/me/enrollments` | COLABORADOR | Todos os seus ciclos, do mais novo ao mais antigo |
| GET `/me/enrollments/:id/modules/:moduleId` | COLABORADOR | Conteúdo e questões sem gabarito, se módulo liberado; `read_only` para ciclos encerrados |
| POST `/me/enrollments/:id/lessons/:lessonId/complete` | COLABORADOR | `{}` → progresso; idempotente no ciclo aberto |
| POST `/me/enrollments/:id/modules/:moduleId/attempts` | COLABORADOR | `{answers:[{question_id,option_index}]}` → nota, aprovação, número, restantes e ciclo |
| GET `/certificates/:id` | Titular / GESTOR / ADMIN | Certificado interno em JSON, módulos, nome na emissão e aviso de escopo |
| GET `/admin/dashboard` | GESTOR / ADMIN | `{stats,users}` com ciclos atuais; indicadores só dos colaboradores ativos |
| GET `/admin/users` | GESTOR / ADMIN | Gestor vê colaboradores; ADMIN vê todos os perfis |
| POST `/admin/users` | GESTOR / ADMIN | Cadastro; campos abaixo. 201 |
| PATCH `/admin/users/:id` | GESTOR / ADMIN | Nome, cargo e/ou ativo; sem alteração de papel. Gestor só altera colaboradores |
| GET `/admin/users/:id/enrollments` | GESTOR / ADMIN | Histórico de ciclos com notas e certificados |
| POST `/admin/users/:id/enrollments` | GESTOR / ADMIN | `{due_at,reason}`; cria ciclo e arquiva anterior. 201 |
| PATCH `/admin/enrollments/:id` | GESTOR / ADMIN | `{due_at,reason}`; prazo de ciclo atual não concluído; mudança auditada |
| GET `/admin/modules` | GESTOR / ADMIN | Catálogo atual de módulos, aulas, questões e regras; não inclui gabarito |
| PUT `/me/enrollments/:id/modules/:moduleId/checklist` | COLABORADOR | `{items:[{lesson_id,completed}]}`; estado completo das leituras, validado e salvo atomicamente |
| POST `/me/enrollments/:id/modules/:moduleId/help` | COLABORADOR | `{message}` com 3–2000 caracteres; registra dúvida e retorna `{id}` |
| GET `/admin/help-requests` | GESTOR / ADMIN | Dúvidas com autor, ciclo, módulo, mensagem e data |
| PATCH `/admin/modules/:id` | GESTOR / ADMIN | `{min_score,max_attempts}`; afeta apenas futuras atribuições |

## Exemplos

Login:

```json
{"email":"gestor@rego.local","password":"Demo@12345"}
```

Cadastro com trilha (troque o prazo por uma data futura):

```json
{
  "name":"Ana Exemplo",
  "email":"ana@rego.local",
  "password":"SenhaInicial@123",
  "role":"COLABORADOR",
  "job_title":"Frentista",
  "due_at":"2027-01-31T23:59:59-03:00"
}
```

Nome: 2–100 caracteres; cargo: 2–80; e-mail válido até 254; senha: 8–72 caracteres, limitada também a 72 bytes UTF-8 por causa do bcrypt. Papel padrão COLABORADOR e cargo padrão Frentista. `due_at` é opcional na API: omitindo, cria usuário sem trilha. Informando prazo, cria usuário e matrícula na mesma transação. Esta entrega não inclui tela de cadastro. GESTOR não pode criar ADMIN/GESTOR. Não envie prazo para perfis administrativos.

Inativação:

```json
{"active":false}
```

Reciclagem (POST `/admin/users/3/enrollments`):

```json
{"due_at":"2027-02-28T23:59:59-03:00","reason":"Reciclagem após retorno ao posto"}
```

Questões são identificadas pela resposta GET do módulo. `option_index` começa em **zero**. Envie exatamente uma resposta para cada questão, sem repetições nem IDs desconhecidos:

```json
{"answers":[{"question_id":11,"option_index":0},{"question_id":12,"option_index":2}]}
```

Retorno de tentativa aprovada, resumido:

```json
{
  "score":100,
  "passed":true,
  "attempt_number":1,
  "attempts_remaining":2,
  "training":{"id":1,"cycle":1,"status":"EM_DIA","progress":14}
}
```

`training` também contém módulos, datas e certificado. O valor de progresso acima corresponde a um módulo aprovado em uma trilha de sete módulos, cada um com uma aula e uma avaliação. Campos `score`, `passed`, `progress`, `user_id` ou `completed_at` enviados pelo cliente não são aceitos para fabricar um resultado.

Configuração futura:

```json
{"min_score":70,"max_attempts":3}
```

## Erros

Erros têm `{error:"mensagem"}`; validação pode incluir `details:[{field,message}]`.

| Código | Significado |
|---|---|
| 400 | JSON ou campos inválidos, respostas incompletas/duplicadas, prazo não futuro |
| 401 | Login inválido, JWT expirado, sessão revogada ou usuário inativo |
| 403 | Papel sem acesso, origem não permitida, módulo bloqueado |
| 404 | Recurso inexistente ou pertencente a outro colaborador |
| 409 | E-mail duplicado, ciclo encerrado, aulas pendentes, tentativas esgotadas ou operação conflitante |
| 413 | Corpo maior que 32 KB |
| 429 | Limite de login atingido |
| 500 | Falha interna sem detalhes sensíveis na resposta |

## Testar sem frontend

No Prompt de Comando, PowerShell (`curl.exe`) ou terminal Unix (`curl`), dentro de uma pasta temporária:

```sh
curl -c cookies.txt -H "Content-Type: application/json" -d "{\"email\":\"maria@rego.local\",\"password\":\"Demo@12345\"}" http://127.0.0.1:3000/api/auth/login
curl -b cookies.txt http://127.0.0.1:3000/api/me/training
```

A forma de escapar aspas varia entre shells; para evitar isso, salve o JSON de login em `login.json` e use `--data-binary @login.json`. O arquivo de cookies contém uma credencial de sessão: não publique. Para a apresentação, as telas e `npm test` dispensam essa configuração manual.
