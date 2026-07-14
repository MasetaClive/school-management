import { createClient } from '@/lib/supabase/server';

export class RolloverServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class RolloverService {
    /**
     * listStudentsPerClass
     * Helper to get students grouped by class for the promotion UI
     */
    static async listStudentsForPromotion() {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('students')
            .select(`
                id,
                full_name,
                student_id,
                class:classes(id, name, academic_year)
            `)
            .order('full_name');
        
        if (error) throw new RolloverServiceError('Failed to fetch students', 500);
        return data;
    }

    /**
     * promoteStudents
     * @param promotionData Array of { student_id, next_class_id }
     */
    static async promoteStudents(promotionData: { student_id: string; next_class_id: string }[]) {
        const supabase = await createClient();

        // We'll perform updates in parallel/batch
        const promotionPromises = promotionData.map(p => 
            supabase
                .from('students')
                .update({ class_id: p.next_class_id })
                .eq('id', p.student_id)
        );

        const results = await Promise.all(promotionPromises);
        const errors = results.filter(r => r.error);

        if (errors.length > 0) {
            console.error('Some promotions failed', errors);
            throw new RolloverServiceError(`${errors.length} students failed to promote`, 500);
        }

        return { success: true, count: promotionData.length };
    }

    /**
     * startNewAcademicYear
     * Logic to create new classes for the next year or update existing ones
     */
    static async startNewAcademicYear(newYear: string) {
        const supabase = await createClient();
        
        // This is a simplified logic: 
        // 1. You might want to duplicate class structures for the new year
        // For now, we'll just allow admins to update class academic_year flags or create new ones manually.
        
        return { message: `Ready to transition to ${newYear}. Please ensure classes for the new year are created.` };
    }
}
