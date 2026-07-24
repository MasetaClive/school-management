import { createClient } from '@/lib/supabase/server';
import type {
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
  ListAcademicYearsQuery,
} from './academicYear.validation';

export class AcademicYearServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export class AcademicYearService {
  static async getAcademicYears(query: ListAcademicYearsQuery) {
    const page = query.page ?? 1;
    const pageSize = 20;
    const supabase = await createClient();
    let request = supabase
      .from('academic_years')
      .select('*', { count: 'exact' })
      .order('year', { ascending: false });

    if (query.search) request = request.ilike('year', `%${query.search}%`);

    const { data, error, count } = await request.range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      throw new AcademicYearServiceError('Failed to fetch academic years', 500);
    }

    return { data: data ?? [], page, pageSize, total: count ?? 0, totalPages: count ? Math.ceil(count / pageSize) : 1 };
  }

  static async getAcademicYearById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new AcademicYearServiceError('Failed to fetch academic year', 500);
    if (!data) throw new AcademicYearServiceError('Academic year not found', 404);
    return data;
  }

  static async createAcademicYear(input: CreateAcademicYearInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('academic_years')
      .insert({
        year: input.year,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        is_active: false,
        is_closed: false,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') throw new AcademicYearServiceError('Academic year already exists', 409);
      throw new AcademicYearServiceError('Failed to create academic year', 500);
    }

    return data;
  }

  static async setActiveYear(id: string) {
    const existing = await this.getAcademicYearById(id);
    if (existing.is_closed) throw new AcademicYearServiceError('Cannot activate a closed academic year', 409);
    const supabase = await createClient();

    const { data, error: activateError } = await supabase.rpc('set_active_academic_year', { p_id: id });

    if (activateError) {
      throw new AcademicYearServiceError('Failed to activate academic year', 500);
    }
    if (!data) throw new AcademicYearServiceError('Academic year not found', 404);
    return Array.isArray(data) ? data[0] : data;
  }

  static async closeAcademicYear(id: string) {
    await this.getAcademicYearById(id);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('academic_years')
      .update({ is_closed: true, is_active: false }) // Also deactivate if closed
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new AcademicYearServiceError('Failed to close academic year', 500);
    }

    return data;
  }

  static async updateAcademicYear(id: string, input: UpdateAcademicYearInput) {
    const existing = await this.getAcademicYearById(id);
    const startDate = input.start_date !== undefined ? input.start_date : existing.start_date;
    const endDate = input.end_date !== undefined ? input.end_date : existing.end_date;
    if (startDate && endDate && startDate > endDate) {
      throw new AcademicYearServiceError('End date must be on or after the start date', 400);
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('academic_years')
      .update({
        year: input.year ?? existing.year,
        start_date: startDate,
        end_date: endDate,
        is_closed: input.is_closed ?? existing.is_closed,
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      if (error.code === '23505') throw new AcademicYearServiceError('Academic year already exists', 409);
      throw new AcademicYearServiceError('Failed to update academic year', 500);
    }
    return data;
  }

  static async deleteAcademicYear(id: string) {
    const year = await this.getAcademicYearById(id);
    if (year.is_active) throw new AcademicYearServiceError('Cannot delete the active academic year', 409);
    const supabase = await createClient();
    const checks = await Promise.all([
      supabase.from('classes').select('id', { count: 'exact', head: true }).eq('academic_year', year.year),
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('academic_year', year.year),
      supabase.from('exams').select('id', { count: 'exact', head: true }).eq('academic_year', year.year),
      supabase.from('timetable_entries').select('id', { count: 'exact', head: true }).eq('academic_year', year.year),
    ]);
    if (checks.some((check) => check.error)) throw new AcademicYearServiceError('Failed to check academic year dependencies', 500);
    if (checks.some((check) => (check.count ?? 0) > 0)) {
      throw new AcademicYearServiceError('Cannot delete an academic year with dependent records.', 409);
    }
    const { error } = await supabase.from('academic_years').delete().eq('id', id);
    if (error) throw new AcademicYearServiceError('Failed to delete academic year', 500);
    return { success: true };
  }

  static async getActiveAcademicYear() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('academic_years')
      .select('year')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw new AcademicYearServiceError('Failed to fetch active academic year', 500);
    return data;
  }

  /**
   * Helper function to check if an academic year is open for updates.
   * Returns true if the year is NOT closed.
   */
  static async isAcademicYearOpen(year: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('academic_years')
      .select('is_closed')
      .eq('year', year)
      .maybeSingle();

    if (error || !data) return true; // Default to open if not found or error
    return !data.is_closed;
  }
}
