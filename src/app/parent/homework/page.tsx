'use client';

import { useEffect, useState } from 'react';

type Homework = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  attachment_url: string | null;
  subject: { name: string; code: string };
  teacher: { full_name: string };
};

export default function ParentHomeworkPage() {
  const [data, setData] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/parent/homework');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load homework');
        setData(json.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load homework');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading homework...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Homework</h2>
        <p className="text-sm text-muted-foreground">Assignments for your linked children</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && data.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No homework is currently assigned to your children.
        </div>
      )}

      {!error && data.length > 0 && (
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.subject.name} ({item.subject.code}) • {item.teacher.full_name}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Due</p>
                  <p>{new Date(item.due_date).toLocaleDateString()}</p>
                </div>
              </div>
              {item.description && <p className="mt-3 text-sm">{item.description}</p>}
              {item.attachment_url && (
                <a
                  href={item.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-medium text-blue-600"
                >
                  Download attachment
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
