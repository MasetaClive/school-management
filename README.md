# School Management System (SMS)

A production-ready, multi-role School Management System built with Next.js 15, Supabase, Trigger.dev, Loops, and OpenAI.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL)
- **Background Jobs**: Trigger.dev (Optional integration, currently commented out for Phase 4)
- **AI Integration**: OpenAI API (gpt-4o-mini) (Direct integration via SDK/fetch; Mastra AI agent support planned)
- **Email**: Loops (Optional integration for email notifications)
- **Payment Gateway**: Paynow (Optional integration for student fee payment simulation)
- **Error Monitoring**: Sentry (Not implemented in codebase)
- **Deployment**: Vercel

## Roles

- **Admin**: Email login, full system access (financials, management, and system setup)
- **Teacher**: ID-based login (`{teacher_id}@school.local`), classes, attendance, homework, exams, and marks management
- **Student**: ID-based login (`{student_id}@school.local`), timetables, homework access, library borrowings, and academic results
- **Parent**: ID-based login (`{parent_id}@school.local`), overview of linked children (attendance, results, homework, payment simulator)

---

## Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **Supabase**: A Supabase project (hosted or local)
- **OpenAI**: An OpenAI API key (for progress report summaries)
- **Loops**: An account and API key (for email notifications)
- **Paynow**: Integration credentials (for simulation testing)

### 1. Install Dependencies

Install packages with a clean install using the lockfile to ensure identical dependency resolution:

```bash
npm ci
```

*(For adding or updating dependencies, you can use `npm install <package>` instead).*

### 2. Environment Variables

Copy the `.env.example` file to create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Fill in the appropriate configuration keys in `.env.local`. Minimally, the Supabase credentials are required to start the application:

```env
# Required for base application
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (Needed for specific feature modules)
OPENAI_API_KEY=sk-xxx
LOOPS_API_KEY=your-loops-api-key
PAYNOW_INTEGRATION_ID=your-paynow-integration-id
PAYNOW_INTEGRATION_KEY=your-paynow-integration-key
```

### 3. Database Setup

Database schemas, RLS policies, and triggers are version-controlled under the `supabase/migrations/` directory.

To initialize your database, apply the 23 SQL migration files inside `supabase/migrations/` in chronological/alphabetical order.

#### Option A: Supabase CLI (Recommended)
If you have the Supabase CLI installed, link your project and push migrations:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

#### Option B: Supabase SQL Editor
Alternatively, you can copy-paste and execute the contents of each migration file in chronological order (starting with `001_initial_schema.sql`, `002_rls_policies.sql`, etc.) within the SQL Editor on your Supabase dashboard.

#### Optional Seed Data
After setting up the tables, run the seed SQL script to populate basic subjects and class structures:
```bash
# Execute the SQL queries inside:
# supabase/seed.sql
```

### 4. Authentication Setup

For ID-based roles (Students, Teachers, and Parents):
1. Create a Supabase Auth user using the corresponding email pattern:
   - Students: `{student_id}@school.local`
   - Teachers: `{teacher_id}@school.local`
   - Parents: `{parent_id}@school.local`
2. Insert a corresponding row in the public tables:
   - Add a row to the `users` table with the user's Auth UUID, email, and designated role.
   - Add a row to the respective role table (`students`, `teachers`, or `parents`) linking the user's UUID.

For Admins:
- Create a standard email/password user in Supabase Auth, add their record to the `users` table with the `admin` role, and insert them into the `admins` table.

### 5. Local Development

Start the Next.js local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Local Validation and Testing

To maintain code quality and ensure the project remains stable, run the following validation scripts before committing your changes. These are the same checks executed during continuous integration:

- **Clean Install Dependencies**:
  ```bash
  npm ci
  ```
- **Lint Code**:
  ```bash
  npm run lint
  ```
- **Type Check**:
  ```bash
  npx tsc --noEmit
  ```
- **Run Tests**:
  ```bash
  npm test -- --runInBand
  ```
- **Run Security Audit**:
  ```bash
  npm run security:audit
  ```
- **Build Production Bundle**:
  ```bash
  npm run build
  ```

---

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration. The pipeline configuration is defined in [ci.yml](file:///.github/workflows/ci.yml).

On every push or pull request to the `main` branch, the workflow automatically:
1. Checks out the repository.
2. Sets up Node.js 20 environment.
3. Installs dependencies using `npm ci`.
4. Runs `npm run security:audit`.
5. Runs `npm run lint`.
6. Checks TypeScript types via `npx tsc --noEmit`.
7. Executes all unit/integration tests with `npm test`.
8. Compiles the Next.js build using `npm run build`.

---

## Project Structure

All application source code is organized within the `src/` folder:

```
├── .github/
│   └── workflows/          # GitHub Actions CI/CD workflows
├── src/
│   ├── app/                # Next.js App Router (pages and API routes)
│   │   ├── api/            # API endpoints (auth, attendance, parent/student routes)
│   │   ├── finance/        # Financial dashboard and workflows
│   │   ├── parent/         # Parent dashboard and student tracking
│   │   ├── student/        # Student dashboard and library borrowing
│   │   └── teacher/        # Teacher class/homework/attendance management
│   ├── components/         # Reusable UI components (shadcn components, forms, sidebars)
│   ├── lib/                # Utilities and Supabase server/client wrappers
│   ├── modules/            # Core business logic separated by feature module
│   │   │                   # (Includes services, controllers, routes, validators, tests)
│   │   ├── students/       # Student account management and tracking
│   │   ├── teachers/       # Teacher profiles and directories
│   │   ├── classes/        # Classrooms, grade levels, and structures
│   │   ├── homework/       # Homework distribution and grading
│   │   ├── exams/          # Exam planning and scheduler
│   │   ├── results/        # Gradebooks and marks entry
│   │   └── ... (others)    # Stats, timetables, payroll, transport, inventory, settings
│   ├── services/           # External service integration layers (Loops, Paynow)
│   └── types/              # TypeScript global interface/type declarations
├── supabase/
│   ├── migrations/         # PostgreSQL database schema & RLS policies (23 files)
│   └── seed.sql            # Core seed data for development
└── scripts/
    └── security-audit.js   # Custom dependency security audit script
```

---

## Modules Roadmap

### Phase 1 ✅ (Active)
- Role-based Access Control (RBAC) auth
- Basic dashboards for all user roles
- Student and Teacher management scaffolding
- Daily attendance tracking and record logs

### Phase 2 (Active)
- Academic timetables and subject scheduling
- Classes & classrooms assignment
- Exams planner, marks management, and report card generator (PDF export)
- Financial management: fee structure generation, receipts, student account statements, and Paynow webhook simulators

### Phase 3 (Planned)
- School library catalogs and borrowing tracking
- Campus transport and inventory logistics
- Comprehensive academic reporting

### Phase 4 (Planned / Commented-out integrations)
- Trigger.dev background workers (automated email alerts for absences, library deadlines)
- Mastra AI Agent (automated progress summaries generator for parents)

---

## License

ISC
