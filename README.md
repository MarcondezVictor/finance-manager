# Gestor de Finanças

**Personal finance manager: accounts, income and expenses, tags, and a dashboard with charts.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Strapi](https://img.shields.io/badge/Strapi-5-4945FF?logo=strapi)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)

A full-stack web app for tracking personal money across several accounts (bank, digital wallet, cash, investments). Users register, log in and see only their own data. Every movement can be tagged, and the dashboard shows where the money is and how it changed month by month.

> Academic project · CTeSP TPSI · Instituto Politécnico de Tomar (2025/2026). The UI is in Portuguese (pt-PT).

<!-- Screenshots: add images to docs/ and uncomment
![Dashboard](docs/dashboard.png)
-->

## Features

- **Authentication**: register and log in with Strapi Users & Permissions (JWT)
- **Accounts**: bank, digital wallet, cash or investment, each with its own starting balance
- **Movements**: create, edit and delete income and expenses, with date, amount and description
- **Tags**: tag movements and create new tags from inside the form
- **Dashboard**:
  - KPI cards: net worth, total income, total expenses and current-month balance
  - Income vs. expenses chart
  - Monthly balance evolution
  - Distribution of money across accounts
- **Per-user data isolation**: custom Strapi controllers filter every query by the logged-in user and block access to other users' records

## Architecture

```
gestor-financas/
├── frontend/   Next.js 16 (App Router) · React 19 · React-Bootstrap · Recharts
└── backend/    Strapi 5 headless CMS · REST API · SQLite
```

```
Browser ──► Next.js frontend ──REST + JWT──► Strapi API ──► SQLite
```

Some design decisions:

- **Balances are never stored.** An account's balance is always derived from its starting balance plus the sum of its movements (`frontend/lib/financas.js`), so it can never drift out of sync.
- **Business logic is separate from UI and API.** `lib/financas.js` holds pure functions (totals, monthly grouping, euro formatting); `lib/strapi.js` handles every API call in one place.
- **Ownership is enforced on the server**, not just hidden in the UI. See `backend/src/api/*/controllers/`.

### Data model

| Content type | Fields |
|---|---|
| `conta` (account) | name, type (`banco`, `carteira_digital`, `dinheiro`, `investimento`), starting balance, owner |
| `movimento` (movement) | description, amount, date, type (`receita`/`despesa`), account, tags, owner |
| `etiqueta` (tag) | name, movements |

## Running locally

Requirements: **Node.js 20+** and npm.

### 1. Backend (Strapi)

```bash
cd backend
cp .env.example .env
# Fill in the secrets in .env, e.g. generate each value with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npm install
npm run develop
```

Strapi starts at <http://localhost:1337>. On the first run:

1. Create your admin account at <http://localhost:1337/admin>.
2. Go to **Settings → Users & Permissions → Roles → Authenticated** and enable `find`, `findOne`, `create`, `update` and `delete` for **Conta**, **Movimento** and **Etiqueta**.

### 2. Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>, create a user, add an account and start adding movements.

## What I learned

- Building a REST backend with Strapi and **overriding its core controllers** to add authorisation rules
- Handling JWT auth on the client with React Context
- Shaping API data for charts with Recharts
- Keeping derived state (balances) computed instead of stored

## Author

**Victor Hugo Marcondes Lopes** · [GitHub](https://github.com/MarcondezVictor)
