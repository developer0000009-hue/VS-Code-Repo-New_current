
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lnqfoffbmafwkhgdadgw.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxucWZvZmZibWFmd2toZ2RhZGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjM2NjUsImV4cCI6MjA3ODQ5OTY2NX0.kxsaKzmK4uYfOqjDSglL0s2FshAbd8kqt77EZiOI5Gg';

export const STORAGE_KEY = 'school_v14_auth';

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
        flowType: 'pkce'
    }
});

/**
 * Robust error formatter for enterprise-grade user feedback.
 * Recursively scans and sanitizes error objects to prevent [object Object] output.
 */
export const formatError = (err: any): string => {
    if (!err) return "Synchronization Idle.";
    
    const JUNK_STRINGS = ["[object Object]", "{}", "null", "undefined"];

    // 1. Handle string errors directly
    if (typeof err === 'string') {
        if (JUNK_STRINGS.includes(err)) return "Institutional system synchronization exception.";
        return err;
    }

    // 2. Recursive message extractor for complex objects
    const getDeepMessage = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        // Priority fields for database and SDK errors
        const keys = ['message', 'error_description', 'details', 'hint', 'error'];
        for (const key of keys) {
            const val = obj[key];
            
            if (val && typeof val === 'string') {
                // Return value only if it's not a junk stringified object
                if (!JUNK_STRINGS.includes(val)) return val;
            }
            
            if (val && typeof val === 'object') {
                const deep = getDeepMessage(val);
                if (deep) return deep;
            }
        }
        return null;
    };

    // 3. Handle specific Postgres Error Codes
    if (err.code === '42501') return "Security Violation: Access denied to this database node.";
    if (err.code === '22P02') return "Data Integrity Error: Invalid identification format detected.";
    if (err.code === '23505') return "Registry Conflict: This identity node is already registered.";
    if (err.code === 'PGRST116') return "Resource Resolution Failure: Record not found.";

    const extracted = getDeepMessage(err);
    if (extracted) {
        // Suppress technical keyword leak
        if (extracted.toLowerCase().includes("uuid") || extracted.toLowerCase().includes("row-level security")) {
            return "Security Context Sync Error: Please ensure you have permission to perform this action.";
        }
        return extracted;
    }

    return "Institutional system exception during verification.";
};
