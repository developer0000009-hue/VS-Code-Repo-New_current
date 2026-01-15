
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jforwngnlqyvlpqzuqpz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3J3bmdubHF5dmxwcXp1cXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjY0NTksImV4cCI6MjA4Mjk0MjQ1OX0.f3WXFI972q4P-PKD_vWQo6fKzh9bedoQ6FzIgpJxU8M';

export const STORAGE_KEY = 'school_v15_auth_session';

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
 * Institutional Error Protocol
 * Translates low-level SQL/API errors into actionable user guidance.
 * Strengthened to strictly prevent [object Object] fallbacks.
 */
export const formatError = (err: any): string => {
    if (!err) return "Synchronization error.";
    
    // 1. Handle String Inputs directly
    if (typeof err === 'string') {
        // Check for generic object strings
        if (err === "[object Object]" || err === "{}") {
            return "Institutional protocol failure (Empty Error Context).";
        }
        return err;
    }

    // 2. Handle Error Objects (Standard JS Error)
    if (err instanceof Error) {
        return err.message;
    }

    // 3. Primary Key Extraction (Standard Supabase/PostgREST)
    // Supabase errors often look like { message: "...", code: "...", details: "...", hint: "..." }
    let candidate = err.message || err.error_description || err.details?.message || err.details || err.hint;
    
    // 4. Nested Auth/Error Object Probing
    if (!candidate && err.error) {
        if (typeof err.error === 'string') candidate = err.error;
        else if (typeof err.error === 'object') {
            candidate = err.error.message || err.error.description || err.error.details;
        }
    }

    // 5. Final Candidate Validation
    if (candidate) {
        if (typeof candidate === 'string') {
            if (candidate === "[object Object]" || candidate === "{}") {
                 return "Identity synchronization exception.";
            }
            return candidate;
        }
        // If candidate is not a string, stringify it
        try {
            return JSON.stringify(candidate);
        } catch {
            return "Invalid error response format.";
        }
    }

    // 6. Safe JSON Stringification Fallback
    try {
        const str = JSON.stringify(err);
        if (str && str !== '{}' && str !== '[]' && !str.includes("[object Object]")) {
            // Return a snippet of the JSON if it's not too long, or a generic message
            return `System Error: ${str.substring(0, 150)}${str.length > 150 ? '...' : ''}`;
        }
    } catch { }

    // 7. Last Resort
    return "An unexpected system error occurred.";
};
