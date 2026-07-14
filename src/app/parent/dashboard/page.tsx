import Link from 'next/link';

export default function ParentDashboardPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Welcome, Parent</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Children Overview</h3>
          <p className="text-sm text-muted-foreground">View your children&apos;s progress</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Attendance</h3>
          <p className="text-sm text-muted-foreground">Daily attendance records</p>
        </div>
        <Link
          href="/messages"
          className="rounded-lg border bg-card p-6 transition hover:border-primary"
        >
          <h3 className="font-semibold text-blue-600">Messages</h3>
          <p className="text-sm text-muted-foreground">Communication with teachers</p>
        </Link>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Announcements</h3>
          <p className="text-sm text-muted-foreground">School-wide updates</p>
        </div>
      </div>
    </div>
  );
}
