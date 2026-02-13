# Agent Guidelines for st-cnex

This document provides guidelines for agents working on this codebase.

## Project Overview

- **Stack**: TanStack Start + React 19 + TypeScript + Vite
- **UI**: shadcn/ui components with Base UI + Tailwind CSS v4
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: better-auth
- **Routing**: TanStack Router (file-based routing)

## Build/Lint/Test Commands

```bash
# Development
pnpm dev              # Start dev server on port 3000

# Build
pnpm build           # Production build
pnpm preview         # Preview production build

# Linting & Formatting
pnpm lint            # Run ESLint
pnpm format          # Run Prettier (check only)
pnpm check           # Run Prettier + ESLint fix

# Testing (vitest)
pnpm test            # Run all tests once
pnpm test --watch    # Run tests in watch mode

# Run a single test file
pnpm test path/to/test-file.test.ts

# Database (Drizzle ORM)
pnpm db:generate     # Generate migrations
pnpm db:migrate      # Apply migrations
pnpm db:studio       # Open DB studio UI
```

## Code Style Guidelines

### Imports & Path Aliases

- Use path aliases: `@/*` maps to `./src/*`
- Order imports: external libs → internal libs → components
- Example: `import { cn } from "@/lib/utils"`

### TypeScript

- Enable strict mode (`strict: true` in tsconfig)
- Always use explicit types for function params and return types
- Use `type` for unions/intersections, `interface` for object shapes
- Avoid `any`, use `unknown` when type is truly unknown

### Naming Conventions

- **Components**: PascalCase (e.g., `Button`, `DataTable`)
- **Files**: kebab-case for non-component files (e.g., `auth.ts`, `utils.ts`)
- **React components**: PascalCase files (e.g., `button.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useMobile`)
- **Constants**: SCREAMING_SNAKE_CASE

### Formatting (Prettier)

- No semicolons
- Single quotes
- Trailing commas: all
- Config in `prettier.config.js`

### React Patterns

- Use function components with explicit prop typing
- Use TanStack Router for routing (`@tanstack/react-router`)
- Create routes in `src/routes/` directory using file-based routing
- Use `createFileRoute()` for route definitions

### Error Handling

- Use Zod for runtime validation
- Use `try/catch` for async operations
- Throw descriptive errors with context
- Use error boundaries for component failures

### CSS & Styling

- Use Tailwind CSS for all styling
- Use `cn()` utility from `@/lib/utils` for class merging
- Use cva (class-variance-authority) for component variants

### Database (Drizzle ORM)

- Schema in `src/db/schema/`
- Use `drizzle-orm` for queries
- Migrations in `drizzle/` directory
- Requires `DATABASE_URL` environment variable

### Available Skills

This project has specialized skills for common tasks:

- **frontend-development**: Multi-framework frontend development guidance
- **tanstack-router**: TanStack Router file-based routing
- **drizzle-orm**: Drizzle ORM patterns and queries
- **brainstorming**: Requirements exploration before implementation

Use the `skill` tool to load these when working on relevant tasks.

## Key Files

- `vite.config.ts`: Vite + TanStack Start configuration
- `tsconfig.json`: TypeScript configuration
- `eslint.config.js`: ESLint (TanStack config)
- `drizzle.config.ts`: Drizzle ORM configuration
- `src/routes/`: File-based route definitions
- `src/components/ui/`: shadcn/ui components
- `src/db/schema/`: Database schemas
