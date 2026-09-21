# Regras de negócio — Treinamento Rego & CIA

## 1. Problema que o trabalho resolve

Em um posto com alta rotatividade, chegam pessoas novas enquanto outras deixam a equipe. Sem um registro central, o gestor precisa repetir orientações, não sabe quem estudou cada tema e pode confundir o histórico de quem voltou ao trabalho. O projeto organiza a integração: quem recebeu a trilha, o que concluiu, quais notas obteve e qual prazo tem.

O sistema dá visibilidade ao aprendizado interno. Não mede sozinho competência prática nem substitui supervisão, procedimentos do posto ou capacitações legalmente exigidas.

## 2. Atores e responsabilidades

| Ator | O que faz |
|---|---|
| ADMIN | Tudo que o gestor faz e cadastro de outros gestores/administradores |
| GESTOR | Cadastra e inativa colaboradores, atribui trilhas, altera prazos, acompanha notas e solicita reciclagem |
| COLABORADOR | Entra com sua conta, lê aulas liberadas, responde avaliações e consulta o próprio histórico/certificado |

O modelo atende a um único posto. Não existe hierarquia por filial. Gestores não podem se promover nem criar outro gestor. Colaboradores não conseguem consultar o progresso de colegas, mesmo trocando um ID na URL. Nome e cargo podem ser corrigidos pelo gestor, mas o nome de um certificado emitido permanece como estava na emissão.

## 3. Fluxo principal

1. O gestor cadastra nome, e-mail, cargo, senha inicial e prazo.
2. O servidor cria o usuário e o primeiro ciclo de integração.
3. O colaborador entra e vê os sete módulos; só o primeiro começa liberado.
4. Ao terminar uma leitura, registra sua conclusão. Todas as aulas do módulo são obrigatórias.
5. Responde todas as questões. O navegador envia alternativas, nunca nota.
6. O servidor corrige e registra a tentativa. Aprovação exige nota mínima e aulas concluídas.
7. Após concluir o módulo, o próximo é liberado.
8. Ao cumprir os requisitos dos sete módulos, o servidor encerra o ciclo e emite um certificado interno único.

Os sete módulos são: Boas-vindas ao posto; Atendimento e vendas no caixa; Segurança no manuseio de combustíveis; Operação das bombas; Normas de segurança e saúde (NR-20); Fechamento de caixa e conferência; Avaliação final e certificado.

## 4. Regras numeradas para explicar ao professor

**RN01 — Acesso individual.** E-mail é único. A senha é armazenada com hash bcrypt e salt; não em texto puro. JWT assinado identifica a sessão. Perfil e situação ativa são consultados no banco a cada requisição, de modo que inativar uma pessoa bloqueia seu acesso imediatamente.

**RN02 — Inativar preserva o passado.** Saída de funcionário não apaga notas, ciclos ou certificados. Reativar não reaproveita tokens antigos: é necessário novo login. O gestor decide se atribui nova trilha. O sistema não permite auto-inativação.

**RN03 — Um ciclo atual por pessoa.** A atribuição cria um ciclo numerado, com responsável, prazo e motivo. Se havia um ciclo atual, ele fica arquivado. Todo histórico continua disponível. Não é possível adicionar respostas a ciclos arquivados ou concluídos.

**RN04 — Sequência obrigatória.** Para abrir o módulo N, todos os módulos anteriores precisam estar concluídos. O servidor valida tanto a leitura quanto a conclusão de aula e o envio da avaliação. Esconder um botão na tela não é a única proteção.

**RN05 — Conclusão de módulo.** Exige todas as aulas registradas e pelo menos uma avaliação aprovada. Nesta demonstração, cada módulo tem uma leitura e duas questões. A API suporta várias aulas e questões no snapshot.

**RN06 — Progresso calculado no backend.** Cada aula concluída vale uma unidade, e cada avaliação aprovada vale uma unidade. Percentual = parte inteira de `100 × unidades concluídas ÷ unidades exigidas`. São 14 unidades no seed. Concluir só a primeira leitura resulta em 7% da trilha, e não em um módulo inteiro concluído. Reprovação não conta como aprovação. Repetir a chamada de conclusão de aula não duplica unidades. O checklist permite corrigir/desmarcar leituras antes da aprovação, sem apagar tentativas. Após aprovação ou encerramento do ciclo, não se pode desfazer as leituras.

**RN07 — Correção e tentativas.** Nota = `100 × respostas corretas ÷ quantidade de questões`. A comparação com a nota mínima usa o valor antes do arredondamento; a nota exibida tem até duas casas. Por padrão, nota mínima 70 e no máximo 3 tentativas por módulo/ciclo. Com duas questões, acertar apenas uma resulta em 50 e reprovação. Requisições inválidas não consomem tentativa. Reprovações válidas consomem. Aprovação encerra novas tentativas daquele módulo.

**RN08 — Tentativas esgotadas.** O sistema não libera o próximo módulo. O gestor deve orientar o colaborador e decidir uma reciclagem. Não há exclusão de tentativas, aprovação manual ou botão para adulterar nota. Reciclagem é um novo ciclo completo, não a eliminação da tentativa que deu errado.

**RN09 — Mudanças de regras.** Gestor e ADMIN configuram nota mínima entre 1 e 100 e limite entre 1 e 20. Essas mudanças só valem em novas atribuições. O ciclo já iniciado mantém seu conteúdo e suas regras. Isso evita mudar a condição de aprovação depois que a pessoa já respondeu.

**RN10 — Prazos e status.** Se todos os requisitos foram cumpridos, o status é CONCLUÍDO. Caso contrário, se o instante atual ultrapassou o prazo, é ATRASADO; até o prazo, é EM DIA. Exatamente no prazo ainda é em dia. O atraso não impede estudar: permite regularização. Uma conclusão depois do prazo continua concluída, e as datas mostram que houve atraso. Quem nunca recebeu trilha aparece como SEM TRILHA. Ciclos arquivados mantêm progresso e situação calculada; o marcador de arquivamento é separado do status de prazo.

**RN11 — Dashboard.** Os indicadores consideram colaboradores ativos e seu ciclo atual. Média usa todos os ativos, considerando zero para quem está sem trilha. Pendentes são ciclos atribuídos e ainda não concluídos; sem trilha é contado separadamente. Inativos continuam na tabela e podem ser filtrados, mas não entram nos indicadores. Última atividade registra login e acessos/ações de aprendizado; não é registro de ponto ou tempo trabalhado.

**RN12 — Certificado condicionado.** Gerado automaticamente, dentro da transação da última aprovação, apenas após todos os requisitos. Tem UUID, nome na emissão, ciclo, módulos e data. Pode ser consultado em JSON pelo titular ou gestor. Tela de certificado, impressão/PDF e verificação pública não fazem parte desta entrega de backend. Não há assinatura digital legal. É um registro interno de conclusão das atividades do sistema.

**RN13 — Segurança e saúde.** O módulo NR-20 é conteúdo interno/complementar. Nem o módulo nem o certificado substituem capacitação legal obrigatória. Não há alegação de habilitação operacional, carga horária legal ou comprovação de prática supervisionada. O posto precisa tratar suas obrigações de capacitação fora deste protótipo.

## 5. Exemplos do posto

**Pessoa recém-admitida:** Maria recebe prazo de 14 dias. A primeira leitura gera progresso parcial. Se responder uma questão errada, recebe 50, permanece no módulo e pode revisar o conteúdo.

**Alta rotatividade:** Pedro saiu da empresa. O gestor inativa seu acesso sem apagar registros. Se ele retornar, reativa a conta e atribui reciclagem, explicando o motivo. O ciclo 2 começa com zero, enquanto o ciclo 1 continua consultável.

**Tentativas esgotadas:** após três reprovações, Maria precisa procurar o gestor. O sistema evita que várias requisições simultâneas ultrapassem esse limite. Uma nova orientação e atribuição ficam registradas.

**Conclusão:** João já possui sete módulos aprovados no seed. O gestor vê 100%, status concluído e certificado. Ao atribuir reciclagem, esse certificado continua no histórico e não significa que o novo ciclo já esteja concluído.

## 6. Entidades e decisões técnicas

Usuário identifica a pessoa; módulo agrupa aulas e questões; matrícula representa um ciclo; conclusão registra uma aula; tentativa guarda respostas e nota; certificado materializa a conclusão; auditoria guarda mudanças administrativas.

Node.js executa o servidor. Express organiza as rotas REST. SQLite guarda tudo em um arquivo, simplificando a apresentação acadêmica. O SQLite integrado ao Node evita instalar um servidor de banco ou compilar dependências nativas. As operações são síncronas e curtas, adequadas à escala local.

O frontend React/Vite existente permanece sem alterações. Uma camada de compatibilidade atende aos formatos de suas chamadas. O JWT fica em cookie HttpOnly, inacessível ao JavaScript da página. Cookie SameSite estrito, conferência de origem nas escritas, CORS, validação Zod, consultas parametrizadas, limitação de login e headers de segurança complementam a autorização. O token expira; sair ou inativar revoga sessões mediante um contador no usuário. Não há token em localStorage. A sessão padrão dura duas horas; a opção manter conectado do contrato existente dura sete dias.

## 7. Roteiro sugerido para gravar vídeos

Esta entrega contém somente backend e documentação. Use Postman, outro cliente HTTP ou os testes automatizados para demonstrar cadastro, reciclagem, histórico e certificado, pois as telas correspondentes não foram adicionadas. Os passos de interface abaixo são sugestões para quando o frontend consumir esses endpoints; não representam telas entregues neste PR.

### Vídeo 1 — Problema e telas (3–5 minutos)

Explique a dificuldade da alta rotatividade. Abra o login e entre como gestor. Mostre equipe, atraso de Pedro e conclusão de João. Diga de onde os números vêm: banco e cálculo do backend. Mostre cadastro e prazo. Evite apresentar os dados demo como dados de trabalhadores reais.

### Vídeo 2 — Regras em ação (5–7 minutos)

Entre como Maria. Mostre que o módulo 2 está bloqueado. Abra o primeiro módulo, registre leitura e responda uma avaliação. Explique nota mínima e limite. Faça uma reprovação para mostrar histórico; depois, acerte as duas respostas e mostre o próximo módulo liberado. Explique que a interface apenas envia respostas, e a API toma a decisão.

### Vídeo 3 — Reciclagem, certificado e técnica (5–7 minutos)

Como gestor, abra o histórico e atribua novo ciclo com motivo. Mostre que o histórico anterior permanece. Entre como João para mostrar o certificado interno e seu aviso de escopo. Apresente as pastas, o esquema SQLite e a fórmula de progresso. Execute `npm test` para mostrar a verificação automática. Finalize explicando os limites: conteúdo demonstrativo, sem vídeos nem comprovação prática, sem substituir NR-20 obrigatória.

## 8. Perguntas que o professor pode fazer

**Por que não guardar apenas um percentual no usuário?** Porque perderíamos quais aulas, tentativas e ciclos explicam aquele número. O percentual é uma informação derivada, não o histórico.

**Por que não apagar o treinamento e começar de novo?** Para manter rastreabilidade e permitir comparação entre integrações e reciclagens.

**O aluno pode mudar a nota pelo navegador?** O endpoint só aceita alternativas válidas; campos como `score` e `progress` são rejeitados. O gabarito fica no servidor.

**Clicar em “li” comprova leitura real?** Não. Registra uma declaração do usuário. A avaliação oferece evidência limitada de compreensão, mas não substitui observação prática ou fiscalização.

**O projeto está pronto para uso empresarial amplo?** O escopo é acadêmico/local. Para operação real seriam necessários, entre outros requisitos do negócio, processos de recuperação de acesso, manutenção de conteúdo validado, backups, monitoração, avaliação de privacidade e infraestrutura apropriada.
