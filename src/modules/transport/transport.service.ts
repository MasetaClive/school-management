import { createClient } from '@/lib/supabase/server';

export class TransportServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class TransportService {
    static async listRoutes() {
        const supabase = await createClient();
        const { data, error } = await supabase.from('transport_routes').select('*').order('name');
        if (error) throw new TransportServiceError('Failed to fetch routes', 500);
        return data;
    }

    static async assignStudent(studentId: string, routeId: string, details: { pickup_point?: string, dropoff_point?: string, academic_year: string }) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('transport_assignments')
            .upsert({ 
                student_id: studentId, 
                route_id: routeId, 
                pickup_point: details.pickup_point,
                dropoff_point: details.dropoff_point,
                academic_year: details.academic_year
            })
            .select('*')
            .single();

        if (error) throw new TransportServiceError('Failed to assign student to route', 500);
        return data;
    }

    static async listAssignments() {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('transport_assignments')
            .select(`
                *,
                student:students(full_name, student_id, class:classes(name)),
                route:transport_routes(name, vehicle_number, driver_name)
            `);
        
        if (error) throw new TransportServiceError('Failed to fetch transport assignments', 500);
        return data;
    }

    static async getStudentRoute(studentId: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('transport_assignments')
            .select(`
                *,
                route:transport_routes(*)
            `)
            .eq('student_id', studentId)
            .single();

        if (error && error.code !== 'PGRST116') throw new TransportServiceError('Failed to fetch student route', 500);
        return data;
    }

    static async createRoute(routeData: { name: string, vehicle_number: string, driver_name?: string, driver_phone?: string, capacity?: number, fee?: number }) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('transport_routes')
            .insert(routeData)
            .select('*')
            .single();

        if (error) throw new TransportServiceError('Failed to create transport route', 500);
        return data;
    }
}
