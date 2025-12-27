
import { supabase } from './supabase';

export const BUCKETS = {
    PROFILES: 'profile-images',
    DOCUMENTS: 'guardian-documents'
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

/**
 * Enterprise Storage Service
 * Enforces strict path conventions for RLS compliance.
 */
export const StorageService = {
    /**
     * Standardizes profile image paths
     * Pattern: [type]/[user_id]/avatar_[timestamp].png
     */
    getProfilePath: (type: 'parent' | 'child' | 'teacher', userId: string) => {
        return `${type}/${userId}/avatar_${Date.now()}.png`;
    },

    /**
     * Standardizes document paths
     * Pattern: parent/[parent_id]/child/[child_id]/[type]/[uuid].[ext]
     */
    getDocumentPath: (parentId: string, childId: string | number, type: string, fileName: string) => {
        const cleanType = type.toLowerCase().replace(/\s+/g, '_');
        const ext = fileName.split('.').pop();
        // Note: For RLS (foldername[2]), we must put parentId in the second segment
        return `documents/${parentId}/${childId}/${cleanType}/${crypto.randomUUID()}.${ext}`;
    },

    /**
     * Uploads a file with built-in error handling and path management
     */
    async upload(bucket: BucketName, path: string, file: File) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        return {
            path: data.path
        };
    },

    /**
     * Resolves a storage path into a public URL
     */
    getPublicUrl(bucket: BucketName, path: string) {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    },

    // Fix: Added missing resolveUrl method to provide signed URLs for sensitive documents as expected by DocumentsTab
    async resolveUrl(bucket: BucketName, path: string, expiresIn = 3600) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);
        if (error) throw error;
        return data.signedUrl;
    }
};
