import { createClient } from '@/lib/supabase/server';

export class ReportCardServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class ReportCardService {
    static getLetterGrade(percentage: number): string {
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        if (percentage >= 40) return 'E';
        return 'F';
    }

    static async generateReport(studentId: string, examId: string) {
        const supabase = await createClient();

        // 1. Get Student info
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select(`
        id,
        full_name,
        student_id,
        academic_year,
        class_id,
        class:classes(name, grade_level)
      `)
            .eq('id', studentId)
            .single();

        if (studentError) throw new ReportCardServiceError('Failed to fetch student', 500);
        if (!student) {
            throw new ReportCardServiceError('Student not found', 404);
        }

        // 2. Get Exam info
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single();

        if (examError) throw new ReportCardServiceError('Failed to fetch exam', 500);
        if (!exam) {
            throw new ReportCardServiceError('Exam not found', 404);
        }

        if (student.class_id !== exam.class_id || student.academic_year !== exam.academic_year) {
            throw new ReportCardServiceError('Student is not eligible for this exam report card', 409);
        }

        // 3. Get Results for this student and exam
        const { data: results, error: resultsError } = await supabase
            .from('results')
            .select(`
        id,
        marks_obtained,
        grade,
        remarks,
        exam:exams(
          id,
          name,
          max_marks,
          subject:subjects(name, code)
        )
      `)
            .eq('student_id', studentId)
            .eq('exam_id', examId);

        if (resultsError) {
            throw new ReportCardServiceError('Failed to fetch results for report card', 500);
        }

        const subjects = (results ?? []).map((r: any) => {
            const marks = Number(r.marks_obtained);
            const maxMarks = Number(r.exam.max_marks);
            const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;

            return {
                subject: r.exam.subject.name,
                code: r.exam.subject.code,
                marks,
                maxMarks,
                percentage: parseFloat(percentage.toFixed(2)),
                grade: r.grade || this.getLetterGrade(percentage),
                remarks: r.remarks
            };
        });

        // 4. Calculate Summary
        let totalObtained = 0;
        let totalMax = 0;

        subjects.forEach(s => {
            totalObtained += s.marks;
            totalMax += s.maxMarks;
        });

        const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

        return {
            student: {
                name: student.full_name,
                student_id: student.student_id,
                class: (student.class as any).name
            },
            exam: {
                name: exam.name,
                date: exam.exam_date,
                academic_year: exam.academic_year
            },
            subjects,
            summary: {
                totalObtained,
                totalMax,
                overallPercentage: parseFloat(overallPercentage.toFixed(2)),
                overallGrade: totalMax > 0 ? this.getLetterGrade(overallPercentage) : 'Not available',
                passed: totalMax > 0 ? overallPercentage >= 50 : null,
                resultCount: subjects.length,
                isComplete: subjects.length > 0,
            }
        };
    }
}
