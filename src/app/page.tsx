import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-slate-900">
          School Management System
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          A production-ready platform for schools. Manage students, attendance,
          academics, library, transport, and more.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
