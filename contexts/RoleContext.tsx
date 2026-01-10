
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Role } from '../types';
import { ROLE_ORDER } from '../constants';
import { supabase } from '../services/supabase';

interface AuthorizedScope {
    id: bigint;
    role_name: string;
    display_name: string;
    description: string;
    status: string;
    assigned_at: string;
    activated_at: string;
    permissions: Record<string, unknown>;
}

interface AvailableRole {
    name: string;
    display_name: string;
    description: string;
    is_system_role: boolean;
    permissions: Record<string, unknown>;
}

interface RoleContextType {
    authorizedScopes: AuthorizedScope[];
    availableRoles: AvailableRole[];
    allRoles: Role[];
    loading: boolean;
    error: string | null;
    refetchScopes: () => Promise<void>;
    registerRole: (roleName: string) => Promise<{ success: boolean; message?: string }>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authorizedScopes, setAuthorizedScopes] = useState<AuthorizedScope[]>([]);
    const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchScopes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch authorized scopes from database
            const { data: scopesData, error: scopesError } = await supabase.rpc('get_user_authorized_scopes');
            if (scopesError) throw scopesError;
            setAuthorizedScopes(scopesData || []);

            // Fetch available roles for registration
            const { data: rolesData, error: rolesError } = await supabase.rpc('get_available_roles_for_registration');
            if (rolesError) throw rolesError;
            setAvailableRoles(rolesData || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load scopes');
            // Fallback to constants on error
            setAuthorizedScopes([]);
            setAvailableRoles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScopes();
    }, [fetchScopes]);

    const registerRole = useCallback(async (roleName: string) => {
        try {
            const { data, error } = await supabase.rpc('register_role_scope', { p_role_name: roleName });
            if (error) throw error;
            
            if (data?.success) {
                // Refetch scopes after successful registration
                await fetchScopes();
                return { success: true };
            } else {
                return { success: false, message: data?.message || 'Failed to register role' };
            }
        } catch (err: any) {
            return { success: false, message: err.message || 'Failed to register role' };
        }
    }, [fetchScopes]);

    // Combine authorized scopes and available roles into all roles
    const allRoles: Role[] = useMemo(() => {
        const scopeNames = new Set(authorizedScopes.map(s => s.role_name));
        const availableNames = new Set(availableRoles.map(r => r.name));
        return [...ROLE_ORDER.filter(r => scopeNames.has(r) || availableNames.has(r))];
    }, [authorizedScopes, availableRoles]);

    const value = useMemo(() => ({
        authorizedScopes,
        availableRoles,
        allRoles,
        loading,
        error,
        refetchScopes: fetchScopes,
        registerRole
    }), [authorizedScopes, availableRoles, allRoles, loading, error, fetchScopes, registerRole]);

    return (
        <RoleContext.Provider value={value}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRoles = () => {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRoles must be used within a RoleProvider');
    }
    return context;
};
