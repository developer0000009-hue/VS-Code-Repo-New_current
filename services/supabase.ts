import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jforwngnlqyvlpqzuqpz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3J3bmdubHF5dmxwcXp1cXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjY0NTksImV4cCI6MjA4Mjk0MjQ1OX0.f3WXFI972q4P-PKD_vWQo6fKzh9bedoQ6FzIgpJxU8M';

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
 * Standardized error formatter to prevent [object Object] in logs/telemetry.
 * Targeted for Postgres error codes and nested API responses.
 */
export const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    
    // 1. Handle Error objects
    if (err instanceof Error) {
        if (err.message && !err.message.includes("[object Object]")) return err.message;
    }

    // 2. Handle direct relation errors or junk strings
    if (typeof err === 'string') {
        const isJunk = err.includes("[object Object]") || err === "{}" || err === "null" || err === "undefined";
        if (isJunk) return "System synchronization exception.";
        
        if (err.includes('relation "') && err.includes('" does not exist')) {
            const relation = err.match(/relation "(.+)" does not exist/)?.[1] || 'database entity';
            return `System Desync: The component '${relation}' is missing from the database. Please execute the latest migration from 'schema.txt'.`;
        }
        return err;
    }

    // 3. Postgres / Supabase specific codes
    if (err.code === '42P01') {
        const relation = err.message?.match(/relation "(.+)"/)?.[1] || 'identity ledger';
        return `Schema Mismatch: The registry table '${relation}' was not found. Migration 20.0.1 required in SQL Editor.`;
    }
    if (err.code === '22P02') return "Data Alignment Error: Legacy identity mismatch detected. Migration 14.2.9 required.";
    if (err.code === '42883') return "Identity Handshake Failure: Operator type mismatch. Update to Migration 14.2.9 required.";
    if (err.code === 'PGRST116') return "The requested record was not found in the institutional node.";

    // 4. Inspection Priority for objects
    // Direct message or error_description
    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string' && !message.includes("[object Object]")) {
        return message;
    }

    // Nested error object (Supabase Auth style)
    if (err.error) {
        if (typeof err.error === 'string' && !err.error.includes("[object Object]")) return err.error;
        if (typeof err.error === 'object' && err.error?.message && typeof err.error.message === 'string' && !err.error.message.includes("[object Object]")) return err.error.message;
    }

    // Response object from RPC that might contain a success/message payload
    if (err.msg || err.message_text) return String(err.msg || err.message_text);

    // Try stringifying for raw details if it's not a generic object
    try {
        const str = JSON.stringify(err);
        if (str && str !== '{}' && str !== '[]' && !str.includes("[object Object]")) {
            return str.length > 200 ? str.substring(0, 197) + "..." : str;
        }
    } catch { }

    // 5. Final Fallback
    const stringified = String(err);
    if (stringified.includes('[object Object]') || stringified === 'undefined' || stringified === 'null') {
        return "Institutional system exception (identity sync fail).";
    }
    
    return stringified;
};