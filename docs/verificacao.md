# Verificação da entrega de backend

Comando: na pasta backend, execute `npm test`. O teste cria um SQLite temporário isolado e usa chamadas HTTP reais ao Express. Não exige build React e não altera a base da demonstração.

Resultado: **12 testes aprovados, 0 falhas**.

1. Hash de senha, autenticação, papel e origem de requisição.
2. Módulos bloqueados, certificado prematuro e isolamento entre colaboradores.
3. Rejeição de nota/progresso do cliente; leitura obrigatória e alternativas inválidas.
4. Tentativas simultâneas respeitam o limite transacional.
5. Reciclagem preserva histórico e inicia novo ciclo.
6. Aprovação sequencial, conclusão total e certificado único.
7. Configuração de nota/tentativas preserva regras dos ciclos anteriores.
8. Prazos, última atividade, dashboard e auditoria.
9. Cadastro, duplicidade, inativação, reativação e revogação de JWT.
10. Checklist completo, pertencimento de aulas e dúvidas restritas à gestão.
11. Contrato React existente: login, identidade, lista, detalhe, checklist, questionário, ajuda, painel e rejeição de alterações de uma tela antiga após reciclagem.
12. Logout e proteção contra exposição de banco e arquivo .env.

A verificação do contrato é feita por HTTP, com os mesmos corpos e formatos esperados pelo frontend. Esta entrega não modifica nem afirma validar visualmente novas telas. Testes de API não são auditoria de segurança, teste de carga ou validação legal do conteúdo. Certificado é um recurso JSON; não há geração de PDF nesta entrega.

Os arquivos de frontend existentes permanecem iguais à base do repositório. A documentação informa os ajustes de configuração local necessários para apontar a aplicação à API.
