# Backend — Treinamento AutoPosto

API REST Node.js + Express, SQLite local, autenticação bcrypt/JWT e regras de treinamento. Esta entrega altera somente `backend/` e `docs/`; preserva o frontend e o contrato original do repositório. A camada `src/compatibility.js` atende aos nomes e formatos usados pelo React existente, enquanto as rotas canônicas cobrem gestão, ciclos, notas e certificados.

## Executar

Use Node.js 24.14 ou superior da série 24 LTS. A partir da raiz:

```sh
cd backend
npm ci
npm run setup
npm start
```

Saúde da API: http://127.0.0.1:3000/api/health. `npm test` executa os testes HTTP com banco isolado; não precisa compilar nem executar o frontend. `npm run dev` reinicia o servidor ao editar código. No PowerShell, se `npm.ps1` estiver bloqueado, use `npm.cmd`.

O setup cria `.env` com segredo aleatório e preenche SQLite. O seed não altera dados se já existem usuários. A base fica em `data/treinamento.sqlite` e não vai para o Git. Encerre com Ctrl+C antes de copiar a base como backup.

## Contas demonstrativas

Senha de todas: **Demo@12345**. São fictícias para execução acadêmica/local.

| E-mail | Perfil / situação |
|---|---|
| admin@rego.local | ADMIN, administra também cadastro de gestores |
| gestor@rego.local | GESTOR, administra colaboradores |
| maria@rego.local | COLABORADOR, trilha inicial |
| pedro@rego.local | COLABORADOR, prazo vencido |
| joao@rego.local | COLABORADOR, trilha concluída e certificado |

## Conectar o frontend existente

O backend não exige alterações nos componentes React e se comunica nativamente com o frontend:

1. **Desenvolvimento com proxy (Recomendado):** No arquivo `.env.local` da raiz, use `VITE_API_URL=/api`. O `vite.config.js` faz o proxy automático para `http://127.0.0.1:3000`. Isso elimina qualquer atrito com cookies `SameSite=Strict` ou conflitos de porta.
2. **Desenvolvimento direto:** Se preferir apontar diretamente (`VITE_API_URL=http://127.0.0.1:3000/api`), em modo de desenvolvimento (`NODE_ENV=development`) o backend aceita dinamicamente conexões locais de `localhost` e `127.0.0.1` em qualquer porta (`5173`, `5174`, etc.).
3. **Produção / Build local:** Execute `npm run build` na raiz. O Express serve a pasta `dist/` estática diretamente em `http://127.0.0.1:3000/`.

Para ambientes de produção reais, configure `CORS_ORIGINS` no `.env` com a lista exata dos domínios autorizados. `HOST` é 127.0.0.1, `JWT_EXPIRES_IN` é 2h. `manterConectado:true` no login legado emite sessão e cookie de sete dias. Logout e inativação revogam ambas imediatamente. `NODE_ENV=production` exige HTTPS para cookie Secure.

## Regras implementadas

- Usuários ADMIN/GESTOR/COLABORADOR; cadastro, edição e inativação preservam histórico.
- Sete módulos da trilha original com leituras e questões didáticas; não há vídeos fornecidos.
- Todas as aulas e aprovação exigidas para liberar o próximo módulo.
- Progresso e notas calculados no servidor; respostas e IDs validados.
- Nota mínima e tentativas configuráveis; ciclo guarda cópia imutável das regras e conteúdo.
- Prazos e status em dia/atrasado/concluído; última atividade; indicadores do gestor.
- Reciclagem cria novo ciclo sem apagar notas ou certificados anteriores.
- Certificado JSON com UUID somente após conclusão total.
- Dúvidas ficam registradas no banco para consulta da gestão.

## Limites explicitados

Esta entrega é somente backend e documentação. Cadastro, reciclagem, histórico, certificado e leitura das dúvidas têm endpoints; telas adicionais e impressão/PDF não foram adicionadas ao frontend. O checklist existente recebe as leituras em texto e registra declaração de leitura, sem comprovar prática. A avaliação continua protegida pelo servidor, mesmo se a tela permitir tentar enviá-la antes das leituras.

Não há provedor de e-mail: `/auth/recuperar-senha` retorna 501 com orientação explícita, sem simular envio. A variação de progresso em 14 dias retorna `null` porque não existem snapshots históricos desse indicador; a equipe de frontend pode ocultar esse texto. O sistema atende a um único posto e não inclui editor de conteúdos, redefinição automática de senha ou infraestrutura de produção.

**NR-20 e certificado: conteúdo interno/complementar, sem substituir capacitação legal obrigatória.**

## Estrutura e documentação

- `src/app.js`: endpoints, autenticação, validação e autorização.
- `src/compatibility.js`: contrato do React existente, sem duplicar correção/progresso.
- `src/training.js`: ciclos, sequência, cálculo e certificado.
- `src/db.js` e `src/schema.sql`: SQLite, transações e integridade.
- `src/seed.js`: sete módulos, aulas, avaliações e contas demo.
- `test/api.test.js`: autenticação, isolamento, concorrência, reciclagem e contrato existente.
- [Regras didáticas e roteiro de apresentação](../docs/regras-de-negocio.md).
- [Endpoints REST](../docs/endpoints.md), [compatibilidade com o frontend](../docs/integracao-backend.md), [banco](../docs/banco-de-dados.md) e [verificação](../docs/verificacao.md).
