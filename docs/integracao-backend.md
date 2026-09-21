# Integração sem modificar o frontend

O contrato original `CONTRATO-API.md` permanece preservado. O backend atende às chamadas já presentes em `src/services/api.js`, com as decisões e limites abaixo. A entrega não modifica React, CSS, HTML, Vite nem dependências da raiz.

| Chamada existente | Implementação |
|---|---|
| POST /api/auth/login | Aceita `{usuario,senha,manterConectado}` e retorna `{usuario}`; também aceita formato canônico `{email,password}` e retorna `{user}` |
| GET /api/auth/me | Retorna identidade canônica e `usuario` com nome, cargo, perfil e empresa |
| GET /api/me/modulos | Resumo e lista dos módulos com status calculado no backend |
| GET /api/modulos/:id | Conteúdo, perguntas sem gabarito e checklist de leituras |
| POST /api/modulos/:id/respostas | Converte respostas e reutiliza a correção transacional da API |
| PUT /api/modulos/:id/checklist | Valida e salva o estado completo das leituras |
| POST /api/modulos/:id/ajuda | Registra dúvida; gestão consulta GET /api/admin/help-requests |
| GET /api/equipe/painel | Métricas e colaboradores reais, com autorização |
| POST /api/auth/logout | Revoga sessão e limpa cookie |
| POST /api/auth/recuperar-senha | 501 com mensagem explícita: envio de e-mail não configurado |

O ID de módulo é uma string opaca `ciclo:módulo`. Use exatamente o ID retornado pela lista. Isso impede que uma tela aberta antes de uma reciclagem envie respostas ao novo ciclo. Os componentes existentes já transportam IDs como strings e usam `encodeURIComponent`.

ADMIN e GESTOR são apresentados como `perfil: gestor`; a autorização real distingue os dois no banco. Somente ADMIN cadastra gestores/administradores. Login com manterConectado=true dura sete dias; sem isso usa JWT_EXPIRES_IN (padrão duas horas) e cookie de sessão. Não se grava senha no navegador.

O checklist é de leituras, sem comprovação de prática. O texto da aula é incluído no item para disponibilizar conteúdo sem alterar o frontend. Antes da aprovação, pode-se desmarcar; após aprovação ou arquivamento, a API rejeita alterações. Tentativas antigas permanecem registradas. Módulos bloqueados não aceitam leitura, respostas ou ajuda. Sem vídeo fornecido, `video` é null.

A métrica de variação em 14 dias é null (não calculada, sem inventar números). Novos colaboradores são contados no mês UTC. Pendentes vencendo em sete dias consideram colaboradores ativos, prazo futuro até sete dias e ciclo não concluído. Sem matrícula, o painel retorna `sem_trilha`; GET /me/modulos retorna 404 com orientação para solicitar atribuição.

Erros incluem `error` e o alias `mensagem` usado pelo frontend. Em produção local, o Express pode servir o build existente em dist; sem build, a raiz mostra identificação JSON da API. Para desenvolvimento e CORS, siga [backend/README.md](../backend/README.md).

As rotas administrativas, histórico e certificado são documentadas em [endpoints.md](endpoints.md). Elas estão prontas para consumo; esta entrega não adiciona telas para essas funções, não gera PDF e não envia mensagens externas.
