'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DashboardData = {
  parent: { full_name: string; parent_id: string; email: string | null; phone: string };
  children: Array<{ id: string; student_id: string; full_name: string }>;
};

export default function ParentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/parent/dashboard');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load parent dashboard');
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load parent dashboard');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">{loading ? 'Parent Dashboard' : `Welcome, ${data?.parent.full_name || 'Parent'}`}</h2>
        {!loading && data && <p className="mt-1 text-sm text-muted-foreground">Parent ID: {data.parent.parent_id}</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold">Linked Children</h3>
        {loading && <p className="py-6 text-sm text-muted-foreground">Loading linked children...</p>}
        {!loading && !error && data?.children.length === 0 && (
          <p className="py-6 text-sm text-muted-foreground">No children are linked to this parent account.</p>
        )}
        {!loading && data && data.children.length > 0 && (
          <ul className="mt-4 divide-y">
            {data.children.map((child) => (
              <li key={child.id}>
                <Link href={`/parent/children/${child.id}`} className="flex items-center justify-between py-3 transition hover:bg-muted/50">
                  <span className="font-medium">{child.full_name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{child.student_id}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && data && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Contact Details</h3>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{data.parent.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{data.parent.email || 'Not provided'}</dd>
            </div>
          </dl>
        </div>
      )}

      <Link href="/messages" className="block rounded-lg border bg-card p-6 transition hover:border-primary">
        <h3 className="font-semibold text-blue-600">Messages</h3>
        <p className="text-sm text-muted-foreground">Communication with the school</p>
      </Link>
    </div>
  );
}
