# School Management System (SMS)

A production-ready, multi-role School Management System built with Next.js, Supabase, Trigger.dev, Mastra, Loops, and Sentry.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL)
- **Background Jobs**: Trigger.dev
- **AI Agents**: Mastra
- **Email**: Loops
- **Error Monitoring**: Sentry
- **Deployment**: Vercel

## Roles

- **Admin**: Email login, full system access
- **Teacher**: teacher_id login, classes, attendance, homework, marks
- **Student**: student_id login, timetable, homework, results
- **Parent**: parent_id login, children overview, attendance, messages

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project
- Trigger.dev account
- Loops account
- Sentry project
- OpenAI API key (for Mastra)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TRIGGER_SECRET_KEY=
LOOPS_API_KEY=
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
OPENAI_API_KEY=
```

### 3. Database Setup

Run the Supabase migrations in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/seed.sql` (optional)

Use the Supabase SQL Editor or CLI.

### 4. Auth Setup

For students, teachers, and parents (ID-based login):

- Create auth users with email pattern: `{student_id}@school.local`, `{teacher_id}@school.local`, `{parent_id}@school.local`
- Insert corresponding rows in `users` (with role) and `students`/`teachers`/`parents`

For admins: use standard email/password in Supabase Auth and add to `users` and `admins` tables.

### 5. Run Development

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Trigger.dev (for background jobs)
npm run trigger:dev
```

### 6. Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Trigger.dev: run `npm run trigger:deploy` separately.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/              # Admin dashboard & routes
│   ├── teacher/            # Teacher dashboard
│   ├── student/            # Student dashboard
│   ├── parent/             # Parent dashboard
│   ├── login/
│   └── api/                # API routes
├── components/             # React components
├── lib/                    # Utilities, Supabase client
├── services/               # Email, Sentry, etc.
├── agents/                 # Mastra AI agents
├── trigger/                # Trigger.dev tasks
├── supabase/
│   └── migrations/         # Database schema & RLS
└── types/                  # TypeScript types
```

## Modules

### Phase 1 ✅

- Auth with RBAC
- Student management scaffolding
- Attendance tracking
- Basic role dashboards

### Phase 2

- Academic system (classes, subjects, timetable)
- Exams, marks, report cards (PDF)

### Phase 3

- Library management
- Transport management
- Advanced reporting

### Phase 4

- AI academic summaries (Mastra)
- Automation improvements

## Trigger.dev Workflows

- **attendance-absence-notification**: Sends email via Loops when student is absent
- **library-overdue-check**: Daily cron to send overdue reminders
- **daily-library-overdue**: Scheduled at 9 AM

## AI Integration

- **academic-summary** (`POST /api/agents/summary`): Uses OpenAI to analyze attendance + grades and generate parent-friendly progress reports
- Optional: Add Mastra agents for announcement rewriting when Node 20+ is available

## API Routes

- `POST /api/attendance` - Mark student attendance (triggers absence notification)
- `POST /api/agents/summary` - AI academic summary

## License

ISC
