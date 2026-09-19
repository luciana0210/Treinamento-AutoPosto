# Treinamento AutoPosto — frontend integrado

Esta versão conecta as telas à API. Não contém servidor, login fictício, dados demonstrativos ou fallback de sucesso.

## Executar

1. Instale as dependências com `npm ci`.
2. Copie `.env.example` para `.env.local`.
3. Em `.env.local`, ajuste `VITE_API_URL=http://localhost:8000/api` para o endereço do backend, incluindo o prefixo `/api`.
4. Execute `npm run dev`. Reinicie o Vite se alterar a variável.

Sem a variável, o endereço padrão é `/api` na mesma origem do site. Sem backend, a verificação de sessão e as operações exibem erros reais. Nenhuma credencial permite entrar sem confirmação do servidor.

## O que foi conectado

- Login com usuário, senha e opção de manter conectado.
- Recuperação da sessão ao abrir a página e retorno ao login em HTTP 401.
- Logout confirmado pelo servidor.
- Solicitação de recuperação de senha.
- Nome, cargo e empresa recebidos na autenticação.
- Trilha, percentuais e módulos carregados da API.
- Navegação pelo ID real do módulo selecionado.
- Player de vídeo com URL recebida, sem player simulado.
- Questionário e resultado retornado pelo servidor.
- Checklist completo enviado por PUT e confirmado pelo servidor.
- Solicitação de ajuda ao gestor com mensagem.
- Painel e métricas carregados da API; menu disponível para perfil gestor.
- Estados de carregamento, erro, vazio e repetição de consultas; bloqueio dos formulários durante envio.

## Arquivos principais

`src/services/api.js`: URLs e funções HTTP. Os imports já estão feitos nas telas.
`CONTRATO-API.md`: métodos, caminhos, corpos e respostas esperadas.
`.env.example`: modelo de configuração.

Autenticação definida por cookie HttpOnly; o cliente usa `credentials: include`. O backend é responsável por autenticação, autorização, CORS, proteção CSRF e regras de treinamento. O frontend não calcula aprovação nem decide a liberação de módulos. O progresso da trilha é atualizado ao voltar do módulo.

Não existe cadastro de usuários nesta interface. A recuperação apenas solicita instruções ao backend; o envio e a conclusão da redefinição devem ser implementados no serviço. Não há upload/administração de conteúdo, emissão de certificados ou rastreamento de tempo de vídeo.

## Verificação

`npm run build` e `npm run lint`.
Testes de interação em DOM simulado (jsdom), com respostas HTTP controladas, passaram para login negado/aceito, carregamento de dados, seleção do módulo, questionário com erro e sucesso, checklist, ajuda, painel, logout, recuperação e falha de conexão. As respostas controladas existem apenas no teste externo, não no projeto entregue. O teste visual em navegador não foi realizado porque o download do navegador não ficou disponível neste ambiente. Não foi realizado teste com um backend real, pois nenhum foi fornecido.
