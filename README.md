# whatsapp-expense-tracker

An AI-powered WhatsApp bot that tracks personal expenses and income from plain-language messages. Send it something like `Spent 500 on lunch` or `Received salary 180000` and it parses the transaction, categorizes it, and stores it — no forms, no menus.

## What it does

- **Natural language transaction logging** — messages are parsed by OpenAI into structured data (amount, currency, category, type, date, description) with a confidence score.
- **Spending summaries** — `today`, `this week`, `this month` / `summary`, `balance` (income vs. expenses), and `categories` (spending broken down by category).
- **Transaction history** — `last 10` to view recent transactions, `delete last` to undo the most recent one.
- **WhatsApp Cloud API integration** — receives messages via webhook, verifies signatures, and replies directly in the chat.
- **Idempotent webhook handling** — duplicate WhatsApp webhook deliveries are deduplicated at the database level so the same message never gets processed twice.

## Tech stack

- **Runtime**: Node.js + TypeScript
- **Web framework**: Express 5, with Helmet for security headers and express-rate-limit for rate limiting
- **Database**: PostgreSQL via Prisma ORM
- **AI**: OpenAI API (`gpt-4o-mini` by default) for parsing transactions from natural language
- **Messaging**: WhatsApp Cloud API (webhook-based)
- **Validation**: Zod for environment/config and payload validation
- **Logging**: Winston
- **Dev tooling**: ts-node-dev for hot reload, tsc for builds

## Project structure

```
src/
  config/        env, database, logger setup
  middleware/     request id, rate limiting, sanitization, webhook signature verification, error handling
  modules/
    ai/           OpenAI prompt + transaction parsing
    commands/     command detection/routing (help, summary, history, delete)
    transactions/ transaction persistence and queries
    users/        user lookup/creation by phone number
    webhook/      WhatsApp webhook controller/service
    whatsapp/     WhatsApp Cloud API client + message formatting
  scripts/        failed-webhook replay utility
prisma/           schema, migrations, seed
```

## Getting started

1. Copy `.env.example` to `.env` and fill in your PostgreSQL, OpenAI, and WhatsApp Cloud API credentials.
2. Install dependencies: `npm install`
3. Run migrations: `npm run db:migrate`
4. Start the dev server: `npm run dev`
