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
pnpm test src/path/to/test-file.test.ts

# Run tests matching a pattern
pnpm test --watch "user"

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
- Always destructure props with explicit type annotations in components

### TypeScript

- Enable strict mode (`strict: true` in tsconfig)
- Additional strict settings enabled:
  - `noUnusedLocals`: true - Warn on unused local variables
  - `noUnusedParameters`: true - Warn on unused function parameters
  - `noFallthroughCasesInSwitch`: true - Require all switch cases to break/return
  - `noUncheckedSideEffectImports`: true - Check side effect imports
- Always use explicit types for function params and return types
- Use `type` for unions/intersections, `interface` for object shapes
- Avoid `any`, use `unknown` when type is truly unknown
- Use `@ts-check` for JSDoc type checking in .js files

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
- Always destructure props with explicit type annotations
- Keep components focused and small (single responsibility)

### Component Structure

- UI components in `src/components/ui/`
- Feature components in `src/components/[feature]/`
- Use cva for component variants with discriminated unions
- Export components as named exports
- Co-locate tests with components when possible

### Server File Organization

- For larger features, separate server code by responsibility:

```text
src/utils/
├── users.functions.ts   # createServerFn wrappers, safe to import in routes/components
├── users.server.ts      # server-only helpers (DB queries/internal logic)
└── schemas.ts           # shared client-safe schemas/types/constants
```

- `*.functions.ts`: export `createServerFn` wrappers only; this file is the public entrypoint for server actions.
- `*.server.ts`: keep server-only implementation details; import this only from server function handlers or server-only modules.
- `*.ts` (no suffix): keep client-safe code only (types, validation schemas, constants, pure utilities).
- Avoid importing `*.server.ts` directly from route components or other client-reachable modules.

## Testing (Vitest)

- Tests use Vitest with React Testing Library
- Test files: `*.test.ts` or `*.test.tsx` pattern
- Run tests: `pnpm test`
- Watch mode: `pnpm test --watch`
- Single file: `pnpm test src/path/to/test-file.test.ts`
- Use `describe` blocks for test suites, `it` or `test` for individual tests
- Follow existing test patterns in the codebase
- Use `vi.fn()` for mocking functions
- Wrap components with `render()` from RTL for component tests

## Error Handling

- Use Zod for runtime validation
- Use `try/catch` for async operations
- Throw descriptive errors with context
- Use error boundaries for component failures
- Handle API errors with proper error types

## State Management

- Use TanStack Query for server state (`@tanstack/react-query`)
- Use React Context for global client state
- Keep state as local as possible, lift only when needed

### CSS & Styling

- Use Tailwind CSS for all styling
- Use `cn()` utility from `@/lib/utils` for class merging
- Use cva (class-variance-authority) for component variants

### Database (Drizzle ORM)

- Schema in `src/db/schema/`
- Use `drizzle-orm` for queries
- Migrations in `drizzle/` directory
- Requires `DATABASE_URL` environment variable

### Data Fetching

- Use TanStack Query (`@tanstack/react-query`) for server state
- Prefer `useSuspenseQuery` over `useQuery` for Suspense-first patterns
- Use query keys with meaningful prefixes (e.g., `['users', userId]`)
- Implement proper cache invalidation after mutations

### API Patterns

- Use TanStack Router's server functions for API routes
- Define API routes in route modules using `createFileRoute()`
- Validate request payloads with Zod schemas
- Return typed responses from server functions

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
