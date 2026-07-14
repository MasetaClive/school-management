import { createClient } from '@/lib/supabase/server';
import type {
  CreateAcademicYearInput,
  UpdateAcademicYearInput,
} from './academicYear.validation';

export class AcademicYearServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export class AcademicYearService {
  static async getAcademicYears() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AcademicYearServiceError('Failed to fetch academic years', 500);
    }

    return data ?? [];
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

    // Check if year already exists
    const { data: existing } = await supabase
      .from('academic_years')
      .select('id')
      .eq('year', input.year)
      .maybeSingle();

    if (existing) {
      throw new AcademicYearServiceError('Academic year already exists', 409);
    }

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
      throw new AcademicYearServiceError('Failed to create academic year', 500);
    }

    return data;
  }

  static async setActiveYear(id: string) {
    const supabase = await createClient();

    // 1. Set all years is_active = false
    const { error: deactivateError } = await supabase
      .from('academic_years')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to update all

    if (deactivateError) {
      throw new AcademicYearServiceError('Failed to deactivate existing years', 500);
    }

    // 2. Set selected year is_active = true
    const { data, error: activateError } = await supabase
      .from('academic_years')
      .update({ is_active: true })
      .eq('id', id)
      .select('*')
      .single();

    if (activateError) {
      throw new AcademicYearServiceError('Failed to activate academic year', 500);
    }

    return data;
  }

  static async closeAcademicYear(id: string) {
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
