'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ClassTeacherAssignment = {
    id: string;
    class_id: string;
    teacher_id: string;
    is_homeroom: boolean;
    academic_year: string;
    class: { name: string; grade_level: string };
    teacher: { full_name: string; teacher_id: string };
};

export default function ClassTeachersPage() {
    const [data, setData] = useState<ClassTeacherAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    async function load() {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/class-teachers?page=${page}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Failed to load assignments');
            setData(json.data);
            setTotalPages(json.totalPages);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load assignments');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [page]);

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to remove this teacher assignment?')) return;
        try {
            const res = await fetch(`/api/admin/class-teachers/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error ?? 'Failed to delete assignment');
            }
            void load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete assignment');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <h2 className="text-xl font-bold">Class Teachers</h2>
                <Link
                    href="/admin/class-teachers/create"
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold shadow hover:bg-primary/90 transition"
                >
                    Assign Teacher
                </Link>
            </div>

            {error && <p className="text-sm text-red-600 font-bold bg-red-50 p-4 rounded border border-red-200">{error}</p>}

            <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/50 border-b text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">Class</th>
                            <th className="px-6 py-4">Teacher</th>
                            <th className="px-6 py-4 text-center">Homeroom</th>
                            <th className="px-6 py-4">Academic Year</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-4 bg-muted/10 h-12"></td>
                                </tr>
                            ))
                        ) : data.length > 0 ? (
                            data.map((row) => (
                                <tr key={row.id} className="hover:bg-muted/30 transition">
                                    <td className="px-6 py-4 font-medium">
                                        {row.class.name} ({row.class.grade_level})
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground">{row.teacher.full_name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{row.teacher.teacher_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {row.is_homeroom ? (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase ring-1 ring-green-600/20">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold uppercase italic">
                                                No
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground font-mono">{row.academic_year}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Link
                                                href={`/admin/class-teachers/${row.id}/edit`}
                                                className="text-xs font-bold text-primary hover:underline px-2 py-1"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(row.id)}
                                                className="text-xs font-bold text-red-600 hover:underline px-2 py-1"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                    No assignments found. Start by assigning a teacher to a class.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 pt-4">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-md disabled:opacity-30 text-xs font-bold uppercase transition"
                    >
                        Previous
                    </button>
                    <span className="text-xs font-bold">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded-md disabled:opacity-30 text-xs font-bold uppercase transition"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
