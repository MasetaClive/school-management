'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ParentChildPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [child, setChild] = useState<{ full_name: string; student_id: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/parent/dashboard');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load child details');
        const selected = json.children.find((item: { id: string }) => item.id === params.id);
        if (!selected) throw new Error('Child not found');
        setChild(selected);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load child details');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.id]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading child details...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!child) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{child.full_name}</h2>
      <p className="text-sm text-muted-foreground">Student ID: {child.student_id}</p>
    </div>
  );
}
