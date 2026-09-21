# Treinamento AutoPosto

Sistema de treinamento e capacitação de colaboradores para postos de combustíveis, composto por frontend em React (Vite) integrado a uma API REST em Node.js (Express + SQLite).

---

## 🚀 Como Executar o Projeto

Abra dois terminais na raiz do projeto (um para o backend e outro para o frontend).

### 1. Iniciar o Backend

```bash
cd backend
npm ci
npm run setup    # Cria o .env local com chave JWT e popula o banco SQLite com dados demo
npm run dev      # Inicia o servidor com hot-reload na porta 3000 (ou npm start)
```

- **API disponível em:** `http://127.0.0.1:3000`
- **Healthcheck:** `http://127.0.0.1:3000/api/health`

### 2. Iniciar o Frontend

Em outro terminal, a partir da raiz do projeto:

```bash
npm ci
cp .env.example .env.local    # No Windows PowerShell: Copy-Item .env.example .env.local
npm run dev
```

- **Aplicação disponível em:** `http://localhost:5173/` (ou porta alternativa exibida no terminal, como `http://localhost:5174/`)

> **Nota sobre o proxy integrado:** O frontend já conta com proxy configurado em `vite.config.js` apontando `/api` para `http://127.0.0.1:3000`. Com `VITE_API_URL=/api`, você não precisa se preocupar com portas ou CORS durante o desenvolvimento local.

---

## 👥 Contas Demonstrativas para Teste

Todas as contas abaixo utilizam a senha padrão: **`Demo@12345`**

| E-mail | Perfil | Descrição / Estado |
|---|---|---|
| `admin@rego.local` | **ADMIN** | Gestão de administradores, gestores e painel |
| `gestor@rego.local` | **GESTOR** | Painel da equipe e gestão de colaboradores |
| `maria@rego.local` | **COLABORADOR** | Trilha inicial em andamento |
| `pedro@rego.local` | **COLABORADOR** | Trilha com prazo vencido |
| `joao@rego.local` | **COLABORADOR** | Trilha concluída e com certificado emitido |

---

## ⚙️ Configuração e Variáveis de Ambiente

### Frontend (`.env.local`)
```env
# Recomendado: usa o proxy do Vite para evitar problemas de CORS e cookies
VITE_API_URL=/api

# Opcional (conexão direta):
# VITE_API_URL=http://127.0.0.1:3000/api
```

### Backend (`backend/.env`)
Gerado automaticamente pelo `npm run setup` com chave JWT segura.
```env
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
DATABASE_PATH=./data/treinamento.sqlite
JWT_SECRET=<gerado_automaticamente>
JWT_EXPIRES_IN=2h
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
```

> **Flexibilidade de Origem:** Em modo `development`, o backend aceita automaticamente conexões locais provenientes de `localhost` e `127.0.0.1` em qualquer porta (`5173`, `5174`, etc.).

---

## 🧪 Testes e Verificação

### 1. Testes Unitários do Frontend (Vitest + Testing Library)
Valida a lógica e comportamento dos componentes (`Login`, `MeusModulos`, `ModuloInterno`, `PainelEquipe`, `EstadoConsulta`):

```bash
npm run test:unit        # Execução única
npm run test:unit:watch  # Modo contínuo com recarregamento em tempo real
```

### 2. Testes End-to-End (Playwright)
Cobre os fluxos completos da plataforma em ambiente de navegador real (Login/Logout, Colaborador, Certificado, Prazo Vencido e Gestão):

```bash
# Certifique-se de que os servidores (backend e frontend) estejam rodando
npm run test:e2e
```

### 3. Testes de Integração do Backend (Node.js Test Runner)
Executa a suíte de testes de integração da API REST com SQLite em memória:

```bash
cd backend
npm test
```

Os 12 testes do backend cobrem autenticação, isolamento de papéis, concorrência, reciclagem de ciclo, cálculo de progresso e regras de negócio com banco de dados isolado em memória temporária.

---

## 📁 Estrutura de Documentação

- [Regras de Negócio e Roteiro Didático](docs/regras-de-negocio.md)
- [Endpoints da API REST](docs/endpoints.md)
- [Integração e Contrato Frontend-Backend](docs/integracao-backend.md)
- [Estrutura do Banco de Dados SQLite](docs/banco-de-dados.md)
- [Relatório de Verificação e Testes](docs/verificacao.md)
- [Guia de Testes Automatizados do Frontend](docs/testes-frontend.md)
