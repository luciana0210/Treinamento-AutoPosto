# Contrato de integração — Treinamento AutoPosto

Rotas definidas para o frontend integrado. O backend ainda precisa implementá-las. Os JSON abaixo são exclusivamente exemplos de documentação; não são usados como dados do aplicativo.

## Contrato proposto

Prefixo: `/api`. JSON UTF-8. IDs são strings. GET não envia corpo. Datas reais devem usar ISO 8601; textos como “Hoje, 09:40” ficam a cargo da interface. Classes CSS como `pill-done` permanecem no React.

| Função exportada | Método | Caminho sem prefixo | Finalidade |
|---|---|---|---|
| fazerLogin | POST | /auth/login | Autenticar |
| buscarUsuarioAtual | GET | /auth/me | Identidade e perfil |
| buscarMeusModulos | GET | /me/modulos | Trilha do usuário |
| buscarModulo | GET | /modulos/{moduloId} | Conteúdo e estado do módulo |
| enviarRespostas | POST | /modulos/{moduloId}/respostas | Submeter questionário |
| salvarChecklist | PUT | /modulos/{moduloId}/checklist | Salvar checklist completo |
| buscarPainelEquipe | GET | /equipe/painel | Métricas e colaboradores |

### POST /auth/login → 200

Entrada:
```json
{"usuario":"usuario.exemplo","senha":"senha-informada","manterConectado":false}
```
Saída:
```json
{"usuario":{"id":"u1","nome":"Mateus Silva","cargo":"Frentista","perfil":"colaborador","empresa":{"id":"e1","nome":"Autoposto Rego & CIA"}}}
```
O backend define o cookie de sessão. Credenciais inválidas: 401. `manterConectado` orienta a duração da sessão; não significa guardar a senha no navegador.

### GET /auth/me → 200

Sem entrada. Mesma saída de login, com o usuário da sessão. `perfil`: `colaborador` ou `gestor`. Sessão ausente/expirada: 401.

### GET /me/modulos → 200

```json
{
  "resumo":{"progressoPercentual":58,"moduloAtualId":"04","moduloAtualOrdem":4,"totalModulos":7},
  "modulos":[
    {"id":"04","ordem":4,"titulo":"Operação das bombas","duracaoMinutos":20,"tipo":"Vídeo + prática guiada","status":"em_andamento","ativo":true}
  ]
}
```
Retornar todos os módulos da trilha, não apenas o exemplo. Status sugeridos: `nao_iniciado`, `em_andamento`, `concluido`, `bloqueado`. `ativo` indica o módulo destacado/continuável como no protótipo. O frontend traduz os status e escolhe classes CSS.

### GET /modulos/{moduloId} → 200

```json
{
  "id":"04",
  "ordem":4,
  "totalModulos":7,
  "titulo":"Operação das bombas",
  "duracaoMinutos":20,
  "tipo":"Vídeo + prática guiada",
  "status":"em_andamento",
  "video":{"titulo":"Autorizando e liberando a bomba","url":"/midia/bombas.mp4","duracaoSegundos":580},
  "perguntas":[
    {"id":"p1","texto":"O que fazer antes de autorizar a bomba?","alternativas":[
      {"id":"a1","texto":"Verificar se o cliente escolheu o combustível correto."},
      {"id":"a2","texto":"Confirmar o aterramento do veículo e posicionamento do bico."},
      {"id":"a3","texto":"Ligar a iluminação de segurança do box."}
    ]}
  ],
  "checklist":[
    {"itemId":"item1","texto":"Conferir lacre","concluido":false},
    {"itemId":"item2","texto":"Zerar o painel","concluido":false},
    {"itemId":"item3","texto":"Acoplar bico","concluido":false}
  ]
}
```
A URL de vídeo neste exemplo é ilustrativa. Retorne uma URL absoluta ou acessível no domínio do frontend; a entrega não contém vídeos. Os textos do questionário reproduzem o protótipo, sem validar conteúdo técnico ou definir gabarito. O gabarito deve ficar no backend. Módulo inexistente: 404; sem acesso/bloqueado: 403.

### POST /modulos/{moduloId}/respostas → 201

Entrada:
```json
{"respostas":[{"perguntaId":"p1","alternativaId":"a1"}]}
```
Saída ilustrativa (não define qual alternativa está correta):
```json
{"tentativaId":"t1","nota":0,"aprovado":false,"statusModulo":"em_andamento","mensagem":"Respostas registradas."}
```
O backend valida IDs, alternativas, respostas obrigatórias e regras de tentativas; calcula nota/aprovação. O frontend não envia nota, gabarito ou usuário alvo.

### PUT /modulos/{moduloId}/checklist → 200

Entrada: estado completo, incluindo itens desmarcados.
```json
{"itens":[{"itemId":"item1","concluido":true},{"itemId":"item2","concluido":false},{"itemId":"item3","concluido":false}]}
```
Saída:
```json
{"itens":[{"itemId":"item1","concluido":true},{"itemId":"item2","concluido":false},{"itemId":"item3","concluido":false}],"statusModulo":"em_andamento"}
```
Atualizar somente o progresso do usuário autenticado. Validar que todos os IDs pertencem ao módulo; repetir o mesmo PUT mantém o mesmo estado.

### GET /equipe/painel → 200

```json
{
  "totalModulos":7,
  "metricas":{"colaboradoresAtivos":8,"novosColaboradoresMes":2,"conclusaoMediaPercentual":64,"variacaoConclusao14DiasPontosPercentuais":11,"treinamentosPendentes":5,"pendentesVencendoEm7Dias":5},
  "colaboradores":[
    {"id":"u2","nome":"Maria","cargo":"Operadora de caixa","progressoPercentual":58,"moduloAtual":{"id":"04","titulo":"Operação das bombas"},"ultimaAtividadeEm":"2026-09-18T09:40:00-03:00","status":"em_dia"}
  ]
}
```
Status: `em_dia`, `atrasado`, `concluido`. `moduloAtual` pode ser null após concluir a trilha; `ultimaAtividadeEm` pode ser null antes do primeiro acesso. Os números reproduzem os cartões ilustrativos, não dados reais. A lista completa e as métricas devem usar o mesmo escopo autorizado da equipe. Acesso exclusivo do gestor; demais perfis: 403. A diferença de conclusão foi proposta em pontos percentuais; confirmar com o produto.

## Sessão, recuperação e ajuda (conectadas às telas)

| Função | Método e caminho | Entrada | Sucesso |
|---|---|---|---|
| sair | POST /auth/logout | Sem corpo | 204 sem corpo; invalidar sessão e cookie |
| solicitarRecuperacaoSenha | POST /auth/recuperar-senha | `{"usuario":"usuario.exemplo"}` | 202 `{"mensagem":"Se houver uma conta correspondente, enviaremos as instruções."}` |
| solicitarAjudaGestor | POST /modulos/{moduloId}/ajuda | `{"mensagem":"Preciso de orientação nesta etapa."}` | 201 `{"solicitacaoId":"s1","status":"aberta"}` |

O frontend agora tem botão de saída, formulário para solicitar recuperação de senha e formulário de ajuda. O backend deve implementar as três rotas. A entrega não inclui cadastro de usuários, envio de e-mail, tela para concluir redefinição com token ou emissão de certificado; essas funções dependem de requisitos e serviços do backend.

## Regras compartilhadas e decisões pendentes

- Autenticação proposta por cookie HttpOnly; usar Secure em HTTPS e política SameSite apropriada. Backend deve proteger mutações contra CSRF (por exemplo, validar Origin e aplicar a política de cookie; se exigir token CSRF, adaptar o cliente). Para origens distintas, permitir a origem exata do frontend e credenciais no CORS. Esse mecanismo não existia no projeto.
- Servidor obtém usuário, empresa e equipe da sessão e aplica autorização. Ocultar um menu no React não substitui essa verificação.
- Erros JSON: `{"mensagem":"Descrição do erro","erros":{"campo":"Motivo"}}`. Usar 400/422 para entrada inválida, 401 para sessão, 403 para acesso, 404 para recurso e 500 para falha interna.
- Definir regra de conclusão, nota mínima, tentativas, prazos e liberação do próximo módulo. Após respostas/checklist, backend recalcula o estado conforme essas regras; React recarrega a trilha. O protótipo não permite deduzir a fórmula dos 58%.
- O player agora reproduz a URL real retornada pela API, mas não salva posição de reprodução. Se acompanhar tempo assistido for obrigatório, definir uma rota adicional e a regra de progresso.
- Certificado aparece só como título do módulo 7; emissão/download não estão implementados nem cobertos por este contrato.

