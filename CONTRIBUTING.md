# Contributing to School Management System (SMS)

Welcome! Thank you for interest in contributing to the School Management System. This guide contains information on code standards, git workflow, and validation requirements to help you get started quickly.

---

## Code Quality and Design Standards

To keep the codebase maintainable, clean, and bug-free, please adhere to these principles:

1. **TypeScript Usage**:
   - Write clean, strictly typed TypeScript. Avoid the use of `any` where possible.
   - Run type-checks regularly to catch errors early.
2. **Framework Patterns**:
   - Follow Next.js App Router patterns. Keep Client Components thin, utilizing Server Components for database queries and business logic fetching.
   - Place core business logic inside `src/modules/<module-name>/`. Avoid burying custom services or heavy controllers inside standard API routes.
3. **Database Security & RLS**:
   - All database tables MUST have Row Level Security (RLS) enabled.
   - Write appropriate security policies inside migrations (e.g. following the patterns in `supabase/migrations/002_rls_policies.sql`).
4. **Style Guidelines**:
   - Use Tailwind CSS and follow the design guidelines. Maintain a clean, consistent styling system using standard components in `src/components/ui/` where applicable.

---

## Git Workflow and Branching

1. **Branch Naming**:
   - Use clear, descriptive names for your branches:
     - `feature/your-feature-name` (for new features)
     - `bugfix/your-fix-name` (for bug fixes)
     - `docs/your-doc-name` (for documentation changes)
2. **Commit Messages**:
   - Keep commits granular and clear. Mention the ticket number or module name in the prefix if applicable (e.g., `feat(homework): add homework submission endpoint` or `fix(auth): resolve session expiry crash`).
3. **Database Migrations**:
   - If your changes require database modifications, DO NOT edit existing migrations.
   - Create a new migration file under `supabase/migrations/` using a chronological/sequential name (e.g. `20260828_add_your_column.sql`).

---

## Local Pre-commit Validation Checklist

Before requesting a review or pushing your changes to the remote repository, you must verify that all automated validations pass. Run the following commands locally in order:

### 1. Clean Dependency Installation
Ensure that package-lock is synced and cleanly installed without generating configuration issues:
```bash
npm ci
```

### 2. Linting Check
Ensure that the code conforms to ESLint rules:
```bash
npm run lint
```

### 3. Static Type Checking
Compile-time check to ensure TypeScript is free of type mismatch errors:
```bash
npx tsc --noEmit
```

### 4. Running the Test Suite
Ensure that all existing and new tests pass (run in band to avoid DB/environment collisions):
```bash
npm test -- --runInBand
```

### 5. Dependency Security Audit
Verify that there are no unapproved HIGH or CRITICAL vulnerability packages in your dependency tree:
```bash
npm run security:audit
```

### 6. Production Compilation
Confirm that the Next.js production build completes without warnings or errors:
```bash
npm run build
```

---

## Pull Request Process

1. Double-check that the GitHub Actions CI pipeline passes successfully.
2. If your PR introduces new environment variables, ensure they are documented in `.env.example` with fallback/mock values.
3. Keep PR scope focused. Do not merge unrelated layout updates or code cleanup with structural bug fixes.
