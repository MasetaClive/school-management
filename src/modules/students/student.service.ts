import { createClient } from '@/lib/supabase/server';
import { UserService } from '@/modules/users/user.service';
import type {
  CreateStudentInput,
  UpdateStudentInput,
  ListStudentsQuery,
} from './student.validation';

export class StudentServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const PAGE_SIZE = 20;

export class StudentService {
  static async ensureStudentIdUnique(student_id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', student_id)
      .maybeSingle();

    if (error) throw new StudentServiceError('Failed to validate student_id', 500);
    if (data) throw new StudentServiceError('Student ID already exists', 400);
  }

  static async ensureClassExists(class_id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('classes')
      .select('id')
      .eq('id', class_id)
      .maybeSingle();

    if (error) throw new StudentServiceError('Failed to validate class', 500);
    if (!data) throw new StudentServiceError('Class not found', 400);
  }

  static async ensureParentExists(parent_id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('parents')
      .select('id')
      .eq('id', parent_id)
      .maybeSingle();

    if (error) throw new StudentServiceError('Failed to validate parent', 500);
    if (!data) throw new StudentServiceError('Parent not found', 400);
  }

  static normalizeMedicalInfo(input: unknown) {
    if (!input) return {};
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {
        // ignore, fallback below
      }
    }
    if (typeof input === 'object') return input;
    return {};
  }

  static async createStudent(input: CreateStudentInput) {
    const {
      student_id,
      full_name,
      date_of_birth,
      gender,
      class_id,
      parent_id,
      guardian_name,
      guardian_phone,
      guardian_email,
      medical_info,
      admission_date,
      academic_year,
      create_account,
      password_mode: _passwordMode,
      password,
    } = input;

    if (!full_name) {
      throw new StudentServiceError('Full name is required', 400);
    }
    if (!academic_year) {
      throw new StudentServiceError('Academic year is required', 400);
    }

    await this.ensureStudentIdUnique(student_id);

    if (class_id) {
      await this.ensureClassExists(class_id);
    }
    if (parent_id) {
      await this.ensureParentExists(parent_id);
    }

    const supabase = await createClient();
    let account = null;

    if (create_account) {
      account = await UserService.provisionAccount({
        role: 'student',
        username: student_id,
        fullName: full_name,
        password,
      });
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: account?.userId ?? null,
        student_id,
        full_name,
        date_of_birth: date_of_birth ?? null,
        gender: gender ?? null,
        class_id: class_id ?? null,
        parent_id: parent_id ?? null,
        guardian_name: guardian_name ?? null,
        guardian_phone: guardian_phone ?? null,
        guardian_email: guardian_email ?? null,
        medical_info: this.normalizeMedicalInfo(medical_info),
        admission_date: admission_date ?? null,
        academic_year,
      })
      .select('*')
      .single();

    if (studentError) {
      if (account) {
        await UserService.rollbackProvisionedAccount(account.userId);
      }
      throw new StudentServiceError(`Failed to create student: ${studentError.message}`, 500);
    }

    return { profile: student, account };
  }

  static async getStudentById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new StudentServiceError('Failed to fetch student', 500);
    if (!data) throw new StudentServiceError('Student not found', 404);
    return data;
  }

  static async updateStudent(id: string, input: UpdateStudentInput) {
    const existing = await this.getStudentById(id);

    if (input.class_id) {
      await this.ensureClassExists(input.class_id);
    }
    if (input.parent_id) {
      await this.ensureParentExists(input.parent_id);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .update({
        full_name: input.full_name ?? existing.full_name,
        date_of_birth: input.date_of_birth ?? existing.date_of_birth,
        gender: input.gender ?? existing.gender,
        class_id: input.class_id ?? existing.class_id,
        parent_id: input.parent_id ?? existing.parent_id,
        guardian_name: input.guardian_name ?? existing.guardian_name,
        guardian_phone: input.guardian_phone ?? existing.guardian_phone,
        guardian_email: input.guardian_email ?? existing.guardian_email,
        medical_info:
          input.medical_info !== undefined
            ? this.normalizeMedicalInfo(input.medical_info)
            : existing.medical_info,
        admission_date: input.admission_date ?? existing.admission_date,
        academic_year: input.academic_year ?? existing.academic_year,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new StudentServiceError('Failed to update student', 500);
    }

    return data;
  }

  static async canHardDeleteStudent(id: string) {
    const supabase = await createClient();

    const checks = [
      supabase
        .from('results')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', id),
      supabase
        .from('student_attendance')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', id),
      supabase
        .from('borrow_records')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', id),
      supabase
        .from('transport_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', id),
    ];

    for (const p of checks) {
      const { count, error } = await p;
      if (error) {
        throw new StudentServiceError('Failed to check related records', 500);
      }
      if ((count ?? 0) > 0) {
        return false;
      }
    }
    return true;
  }

  static async deleteStudent(id: string) {
    await this.getStudentById(id);

    const canDelete = await this.canHardDeleteStudent(id);
    if (!canDelete) {
      throw new StudentServiceError(
        'Cannot delete student with academic records.',
        409,
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from('students').delete().eq('id', id);

    if (error) {
      throw new StudentServiceError('Failed to delete student', 500);
    }

    return { success: true };
  }

  static async listStudents(query: ListStudentsQuery) {
    const page = query.page ?? 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const supabase = await createClient();

    let req = supabase
      .from('students')
      .select(
        `
        id,
        student_id,
        full_name,
        gender,
        academic_year,
        class:classes(id, name, grade_level),
        parent:parents(id, full_name, phone)
      `,
        { count: 'exact' },
      )
      .order('full_name', { ascending: true });

    if (query.search) {
      req = req.or(
        `full_name.ilike.%${query.search}%,student_id.ilike.%${query.search}%`,
      );
    }
    if (query.class_id) {
      req = req.eq('class_id', query.class_id);
    }
    if (query.academic_year) {
      req = req.eq('academic_year', query.academic_year);
    }

    const { data, error, count } = await req.range(from, to);

    if (error) {
      throw new StudentServiceError('Failed to fetch students', 500);
    }

    return {
      data: data ?? [],
      page,
      pageSize: PAGE_SIZE,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
    };
  }

  static async getStudentDashboardData(userId: string) {
    const supabase = await createClient();

    // 1. Get Student Profile
    const { data: profile, error: profileError } = await supabase
      .from('students')
      .select('*, class:classes(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      throw new StudentServiceError('Student profile not found', 404);
    }

    // 2. Fetch Stats in parallel
    const [attendanceRes, homeworkRes, resultsRes, scheduleRes] = await Promise.all([
      // Attendance
      supabase
        .from('student_attendance')
        .select('status', { count: 'exact' })
        .eq('student_id', profile.id),
      
      // Homework (total for their class)
      supabase
        .from('homework')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', profile.class_id),

      // Results (Recent 5)
      supabase
        .from('results')
        .select(`
          marks_obtained,
          exam:exams(name, max_marks, subject:subjects(name))
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5),

      // Schedule for Today
      supabase
        .from('timetable_entries')
        .select(`
          id,
          subject:subjects(name, code),
          time_slot:time_slots!inner(start_time, end_time, day_of_week)
        `)
        .eq('class_id', profile.class_id)
        .eq('academic_year', profile.academic_year)
        .eq('time_slot.day_of_week', new Date().getDay())
    ]);

    const attendanceData = attendanceRes.data || [];
    const totalDays = attendanceRes.count || 0;
    const presentDays = attendanceData.filter(a => a.status === 'present').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    return {
      profile,
      stats: {
        attendanceRate,
        pendingHomework: homeworkRes.count || 0,
        gpa: null,
        credits: null,
      },
      recentResults: resultsRes.data || [],
      todaySchedule: scheduleRes.data || [],
    };
  }
}
