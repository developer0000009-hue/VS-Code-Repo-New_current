
import { createClient } from '@supabase/supabase-js';

/**
 * Robust helper to retrieve environment variables from multiple possible sources.
 */
const getEnvVar = (key: string, defaultValue: string): string => {
    // 1. Try import.meta.env (Vite standard)
    try {
        const metaEnv = (import.meta as any).env;
        if (metaEnv && metaEnv[key]) return metaEnv[key];
    } catch (e) {}

    // 2. Try process.env (Node/Vercel/Define standard)
    try {
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key] as string;
        }
    } catch (e) {}

    return defaultValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://lnqfoffbmafwkhgdadgw.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxucWZvZmZibWFmd2toZ2RhZGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjM2NjUsImV4cCI6MjA3ODQ5OTY2NX0.kxsaKzmK4uYfOqjDSglL0s2FshAbd8kqt77EZiOI5Gg');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase initialization error: Missing URL or Anon Key.');
}

// Versioned storage key is vital to prevent cache-related auth bugs across releases
export const STORAGE_KEY = 'gurukul_auth_session_v9.09';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
        flowType: 'pkce',
    },
});
