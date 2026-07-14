'use client';

import { useState } from 'react';
import { StorageService } from '@/lib/supabase/storage';

type FileUploadProps = {
    bucket: string;
    onUploadComplete: (url: string) => void;
    label?: string;
};

export default function FileUpload({ bucket, onUploadComplete, label = 'Upload File' }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            setError(null);
            
            const fileName = `${Date.now()}-${file.name}`;
            const url = await StorageService.uploadFile(bucket, fileName, file);
            
            onUploadComplete(url);
        } catch (err) {
            setError('Upload failed. Please check bucket permissions.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">{label}</label>
            <div className="relative border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition border-muted-foreground/20">
                <input 
                    type="file" 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                />
                <div className="text-center">
                    <span className="text-2xl mb-2 block">📁</span>
                    <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Click or drag to upload'}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">PDF, DOCX, ZIP or Images</p>
                </div>
            </div>
            {error && <p className="text-[10px] text-red-600 font-bold">{error}</p>}
        </div>
    );
}
