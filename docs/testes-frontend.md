# Testes Automatizados do Frontend (Autoposto Rego & CIA)

Este documento detalha a arquitetura, organização e comandos para execução da suíte de testes automatizados do frontend do **Autoposto Rego & CIA**, contemplando tanto testes unitários e de componentes quanto testes ponta a ponta (E2E).

---

## 🏗️ Arquitetura de Testes

A estratégia de testes do frontend é dividida em dois níveis complementares:

```
                  ┌────────────────────────────────────────┐
                  │          Testes E2E (Playwright)        │
                  │   7 cenários em navegador real (Chromium)│
                  └───────────────────┬────────────────────┘
                                      │
                  ┌───────────────────▼────────────────────┐
                  │    Testes Unitários (Vitest + RTL)     │
                  │   18 testes de componentes em jsdom    │
                  └────────────────────────────────────────┘
```

1. **Testes Unitários e de Componente (Vitest + React Testing Library + jsdom):**
   - Rápida execução (menos de 3 segundos no total).
   - Valida renderização, comportamento de estado local, acessibilidade (`role`, `aria`), interações do usuário e mocks da camada de API.
2. **Testes End-to-End (Playwright):**
   - Execução em ambiente de navegador real (Chromium).
   - Valida a integração completa entre a interface em React e os endpoints da API REST em Express, garantindo que regras de negócio, fluxos de autenticação, permissões e cookies de sessão funcionem perfeitamente.

---

## 📁 Estrutura de Arquivos

```
Treinamento-AutoPosto/
├── playwright.config.js          # Configuração do Playwright (baseURL, portas, workers)
├── vitest.config.js              # Configuração do Vitest (jsdom, setupFiles, globals)
└── tests/
    ├── setup.js                  # Setup do RTL, matchers jest-dom e polyfills
    ├── unit/                     # Suíte de Testes Unitários de Componentes
    │   ├── EstadoConsulta.test.jsx
    │   ├── Login.test.jsx
    │   ├── MeusModulos.test.jsx
    │   ├── ModuloInterno.test.jsx
    │   └── PainelEquipe.test.jsx
    └── e2e/                      # Suíte de Testes End-to-End
        ├── auth.spec.js
        ├── certificado.spec.js
        ├── painel-gestor.spec.js
        ├── prazo-vencido.spec.js
        └── trilha-colaborador.spec.js
```

---

## 🧩 Cobertura dos Testes Unitários

Arquivo de setup: [`tests/setup.js`](../tests/setup.js) (integra `@testing-library/jest-dom` e limpeza automática pós-teste com `cleanup()`).

| Arquivo de Teste | Componente Alvo | Qtd. Testes | Cenários Verificados |
|---|---|:---:|---|
| [`Login.test.jsx`](../tests/unit/Login.test.jsx) | `src/Paginas/Login.jsx` | 5 | - Renderização da identidade visual do **Autoposto Rego & CIA** e contas demo.<br>- Alternância entre abas "Entrar" e "Esqueci a senha".<br>- Chamada de callback `onLogin` em caso de sucesso.<br>- Exibição de alertas em falhas de autenticação.<br>- Envio do formulário institucional de recuperação de senha. |
| [`MeusModulos.test.jsx`](../tests/unit/MeusModulos.test.jsx) | `src/Paginas/MeusModulos.jsx` | 3 | - Listagem de módulos com status correto (concluído, em andamento, bloqueado).<br>- Exibição do banner destacado de **Prazo Vencido** com orientações.<br>- Exibição do card de conquista e abertura do modal oficial de **Certificado de Conclusão**. |
| [`ModuloInterno.test.jsx`](../tests/unit/ModuloInterno.test.jsx) | `src/Paginas/ModuloInterno.jsx` | 4 | - Renderização do cabeçalho, tempo estimado e status do módulo.<br>- Marcação de itens do checklist operacional e persistência.<br>- Preenchimento e envio do questionário de fixação.<br>- Registro e envio de dúvidas operacionais ao gestor da unidade. |
| [`PainelEquipe.test.jsx`](../tests/unit/PainelEquipe.test.jsx) | `src/Paginas/PainelEquipe.jsx` | 3 | - Renderização dos cards de métricas (taxa de conclusão, colaboradores em andamento e atrasados).<br>- Tabela de colaboradores com badges e sinalização de prazos expirados.<br>- Listagem de dúvidas operacionais da equipe aguardando retorno. |
| [`EstadoConsulta.test.jsx`](../tests/unit/EstadoConsulta.test.jsx) | `src/Componentes/EstadoConsulta.jsx` | 3 | - Indicador visual de carregamento (`spinner`).<br>- Alerta de erro com botão de reexecução (`Tentar novamente`).<br>- Estado vazio amigável quando não houver dados. |

---

## 🎭 Cobertura dos Testes End-to-End (Playwright)

Arquivo de configuração: [`playwright.config.js`](../playwright.config.js).

| Arquivo de Teste | Usuário de Teste | Cenários Cobertos |
|---|---|---|
| [`auth.spec.js`](../tests/e2e/auth.spec.js) | `admin@rego.local`<br>`maria@rego.local` | 1. Validação de mensagem de erro ao errar a senha.<br>2. Solicitação de recuperação de senha institucional.<br>3. Fluxo completo de login com credenciais válidas e encerramento de sessão via logout seguro. |
| [`trilha-colaborador.spec.js`](../tests/e2e/trilha-colaborador.spec.js) | `maria@rego.local` | Login da colaboradora, identificação na sidebar, abertura do módulo liberado, marcação/salvamento do checklist da prática operacional, envio de dúvida ao gestor e retorno à trilha. |
| [`certificado.spec.js`](../tests/e2e/certificado.spec.js) | `joao@rego.local` | Login com colaborador que já finalizou a capacitação, validação visual da badge 100% Concluída, exibição do card oficial de certificado e abertura do modal com botão de impressão/PDF. |
| [`prazo-vencido.spec.js`](../tests/e2e/prazo-vencido.spec.js) | `pedro@rego.local` | Validação visual do badge "Atrasada" e do banner de atenção com data limite ultrapassada e canais de contato da gerência. |
| [`painel-gestor.spec.js`](../tests/e2e/painel-gestor.spec.js) | `gestor@rego.local` | Acesso do gestor ao dashboard da equipe, checagem dos indicadores da unidade (conclusão, colaboradores ativos e atrasados) e acompanhamento das dúvidas operacionais enviadas pela equipe. |

---

## 🚀 Como Executar os Testes

### Pré-requisitos
Certifique-se de ter instalado as dependências na raiz do projeto:

```bash
npm install
```

### 1. Executar Testes Unitários

```bash
# Execução única de todos os testes unitários
npm run test:unit

# Modo interativo com watch (ideal durante o desenvolvimento de novos componentes)
npm run test:unit:watch
```

### 2. Executar Testes End-to-End

Para os testes E2E, o backend e o frontend devem estar em execução:

```bash
# Terminal 1: Inicie o backend
cd backend && npm run dev

# Terminal 2: Inicie o frontend
npm run dev

# Terminal 3: Execute a suíte E2E
npm run test:e2e
```

#### Comandos Úteis do Playwright:
```bash
# Executar com interface gráfica interativa do Playwright
npx playwright test --ui

# Executar exibindo o navegador (modo headed)
npx playwright test --headed

# Executar um arquivo de teste específico
npx playwright test tests/e2e/auth.spec.js

# Visualizar o relatório HTML da última execução
npx playwright show-report
```

---

## 📊 Resultados e Evidências

Última execução completa validada:
- **Testes Unitários:** 18 testes em 5 arquivos (`18 passed, 0 failed`) em ~2.9s.
- **Testes End-to-End:** 7 cenários em 5 arquivos (`7 passed, 0 failed`) em ~8.1s.
- **Testes de Integração da API (Backend):** 12 testes (`12 passed, 0 failed`) em ~4.1s.
