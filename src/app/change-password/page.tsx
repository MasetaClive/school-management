'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update password');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="mt-2 text-sm text-slate-600">Your temporary password must be changed before continuing.</p>
        </div>
        <input required minLength={6} type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        <input required minLength={6} type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={saving} className="w-full rounded-md bg-slate-900 py-2 font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Update password'}</button>
      </form>
    </main>
  );
}
