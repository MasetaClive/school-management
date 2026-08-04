import { createClient } from '@/lib/supabase/client';

export class StorageService {
    static async uploadFile(bucket: string, path: string, file: File) {
        const supabase = createClient();
        
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const objectPath = `${crypto.randomUUID()}-${safeFileName}`;
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(objectPath, file, {
                upsert: false,
                cacheControl: '3600'
            });

        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return publicUrl;
    }

    static async deleteFile(bucket: string, path: string) {
        const supabase = createClient();
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) throw error;
        return true;
    }
}
