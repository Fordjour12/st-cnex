# TanStack Start + shadcn/ui

This is a template for a new TanStack Start project with React, TypeScript, and shadcn/ui.

## Drizzle ORM (PostgreSQL) setup

1. Install dependencies:
   - `pnpm install`
2. Create local env file:
   - `cp .env.example .env`
3. Generate first migration:
   - `pnpm db:generate`
4. Apply migrations:
   - `pnpm db:migrate`
5. Optional DB UI:
   - `pnpm db:studio`
