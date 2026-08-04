'use client';

import { useEffect, useState } from 'react';

type ResultItem = {
  id: string;
  score: number | null;
  grade: string | null;
  student_id: string;
  exam: { name: string; exam_date: string | null } | null;
  subject: { name: string; code: string } | null;
};

export default function ParentResultsPage() {
  const [data, setData] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/parent/results');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load results');
        setData(json.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading results...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Results</h2>
        <p className="text-sm text-muted-foreground">Academic results for your children</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && data.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No results are available for your children yet.
        </div>
      )}

      {!error && data.length > 0 && (
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{item.subject?.name || 'Subject'}</p>
                  <p className="text-sm text-muted-foreground">{item.exam?.name || 'Exam'}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{item.grade || '—'}</p>
                  <p className="text-muted-foreground">{item.score ?? '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
