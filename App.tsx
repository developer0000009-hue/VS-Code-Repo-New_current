
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase, STORAGE_KEY } from './services/supabase';
import { UserProfile, Role, BuiltInRoles } from './types';
import AuthPage from './components/AuthPage';
import SchoolAdminDashboard from './components/SchoolAdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard'; 
import Spinner from './components/common/Spinner';
import OnboardingFlow from './components/OnboardingFlow';
import RoleDashboard from './components/RoleDashboard';
import ParentDashboard from './components/ParentDashboard';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import TransportDashboard from './components/TransportDashboard';
import EcommerceDashboard from './components/EcommerceDashboard';
import NotFound from './components/common/NotFound';


// Explicit role mapping to routes
const ROLE_ROUTES: Record<string, string> = {
    [BuiltInRoles.SCHOOL_ADMINISTRATION]: '/admin',
    [BuiltInRoles.BRANCH_ADMIN]: '/admin',
    [BuiltInRoles.PRINCIPAL]: '/admin',
    [BuiltInRoles.HR_MANAGER]: '/admin',
    [BuiltInRoles.ACADEMIC_COORDINATOR]: '/admin',
    [BuiltInRoles.ACCOUNTANT]: '/admin',
    [BuiltInRoles.PARENT_GUARDIAN]: '/parent',
    [BuiltInRoles.STUDENT]: '/student',
    [BuiltInRoles.TEACHER]: '/teacher',
    [BuiltInRoles.TRANSPORT_STAFF]: '/transport',
    [BuiltInRoles.ECOMMERCE_OPERATOR]: '/store',
    [BuiltInRoles.SUPER_ADMIN]: '/super-admin',
};

const getHomePath = (userProfile: UserProfile): string => {
    if (!userProfile.role) return '/dashboard'; // Default fallback if no role
    if (userProfile.is_super_admin) return '/super-admin';
    return ROLE_ROUTES[userProfile.role] || '/dashboard';
};


const App: React.FC = () => {
    const [session, setSession] = useState<any | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Prevent infinite redirect loops by tracking previous path
    useEffect(() => {
        if (profile && profile.role) {
            // Only log, don't force navigate here to avoid fighting with Router
        }
    }, [location, profile]);

    const getProfile = useCallback(async (session: any, isAfterOnboarding = false, silent = false) => {
        if (!silent && !profile) setLoading(true);
        
        const maxAttempts = isAfterOnboarding ? 8 : 3;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Step 1: Fetch the core profile first.
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                // --- SELF-HEALING LOGIC START ---
                if (profileError && profileError.code === 'PGRST116') {
                    console.log(`Profile missing (Attempt ${attempt}). Initiating self-healing...`);
                    
                    const { error: insertError } = await supabase.from('profiles').upsert({
                        id: session.user.id,
                        email: session.user.email,
                        display_name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
                        phone: session.user.phone || null,
                        role: session.user.user_metadata?.role || null,
                        profile_completed: false,
                        is_active: true
                    }, { onConflict: 'id' });

                    if (insertError) {
                        // FIX: Handle duplicate email error by reconciling data on the backend.
                        if (insertError.code === '23505' && insertError.message.includes('profiles_email_key')) {
                            console.warn('Duplicate email found. Attempting reconciliation...');
                            const { error: rpcError } = await supabase.rpc('reconcile_user_profile_id');
                            
                            if (rpcError) {
                                console.error('Reconciliation RPC failed:', rpcError);
                                // If reconciliation fails, stop to prevent infinite loop.
                                throw new Error("Account reconciliation failed. Please contact support.");
                            } else {
                                // Reconciliation successful, retry the whole getProfile loop
                                console.log('Reconciliation successful. Retrying profile creation.');
                                continue;
                            }
                        }
                        // For other errors, log and stop.
                        console.error("Self-healing insert failed:", JSON.stringify(insertError));
                        throw insertError; 
                    } else {
                        // If upsert succeeded, retry fetch immediately
                        continue;
                    }
                }
                // --- SELF-HEALING LOGIC END ---

                if (profileData) {
                    // Step 2: If School Admin, fetch specific onboarding step
                    let onboardingStep = null;
                    if (profileData.role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                        const { data: adminProfileData } = await supabase
                            .from('school_admin_profiles')
                            .select('onboarding_step')
                            .eq('user_id', session.user.id)
                            .single();

                        if (adminProfileData) {
                            onboardingStep = adminProfileData.onboarding_step;
                        } else {
                            // Failsafe: If profile exists but admin record is missing, assume completed if flagged
                            if (profileData.profile_completed) {
                                onboardingStep = 'completed';
                            }
                        }
                    }

                    const finalProfile = {
                        ...profileData,
                        onboarding_step: onboardingStep,
                    };
                    
                    // FORCE CONSISTENCY: If we just finished onboarding, trust that over the DB
                    if (isAfterOnboarding) {
                        finalProfile.profile_completed = true;
                        if (finalProfile.role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                            (finalProfile as any).onboarding_step = 'completed';
                        }
                    } else if (finalProfile.role === BuiltInRoles.SCHOOL_ADMINISTRATION && finalProfile.onboarding_step === 'completed' && !finalProfile.profile_completed) {
                         // Auto-heal local state if DB says step is completed but profile isn't marked
                         finalProfile.profile_completed = true;
                    }

                    setProfile(prev => {
                        // Deep comparison optimization to prevent rerenders
                        if (JSON.stringify(prev) === JSON.stringify(finalProfile)) return prev;
                        return finalProfile as UserProfile;
                    });
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error("Profile fetch exception:", e);
            }
            
            // Exponential backoff for retries
            if (attempt < maxAttempts) await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }

        // Final Fallback if all fetches fail
        console.warn('Profile fetch failed after max attempts. Using temporary fallback.');
        const tempProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email!,
            display_name: session.user.user_metadata?.display_name || session.user.email!.split('@')[0],
            phone: session.user.phone,
            role: session.user.user_metadata?.role || null,
            profile_completed: isAfterOnboarding, 
            is_active: true,
            is_super_admin: false,
            created_at: new Date().toISOString(),
        };
        setProfile(prev => {
            if (JSON.stringify(prev) === JSON.stringify(tempProfile)) return prev;
            return tempProfile;
        });
        setLoading(false);
    }, [profile]);
    
    const refreshProfileState = useCallback(async (isFinalizing = false) => {
        if(!isFinalizing) setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await getProfile(session, isFinalizing);
        } else {
            setLoading(false);
        }
    }, [getProfile]);

    const handleInvalidSession = useCallback(async () => {
        console.warn("Handling invalid session: Clearing tokens and state.");
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
        setProfile(null);
        setLoading(false);
        navigate('/', { replace: true });
        try {
             await supabase.auth.signOut();
        } catch (e) {
            // Ignore error during cleanup
        }
    }, [navigate]);

    const handleDirectRoleSwitch = useCallback(async (newRole: Role, isExisting: boolean = false) => {
        if (!profile) return;
        setLoading(true);

        try {
            // Call RPC to switch role and check if profile exists
            const { data, error } = await supabase.rpc('switch_active_role', { p_target_role: newRole });

            if (error) throw error;

            const profileExists = data?.profile_exists ?? false;

            // Optimistic Update to UI State
            const updatedProfile = { 
                ...profile, 
                role: newRole, 
                // If profile exists for this role, it's completed. If not, it's not.
                profile_completed: profileExists 
            };
            
            if (newRole === BuiltInRoles.SCHOOL_ADMINISTRATION && profileExists) {
                (updatedProfile as any).onboarding_step = 'completed';
            }

            setProfile(updatedProfile);
            
            // Navigate based on completion status
            if (!profileExists) {
                // Force navigation to dashboard which will render OnboardingFlow due to !profile_completed
                // We use '/dashboard' as a generic landing that allows Onboarding to take over
                navigate('/dashboard', { replace: true });
            } else {
                const targetPath = ROLE_ROUTES[newRole] || '/dashboard';
                navigate(targetPath, { replace: true });
            }
            
            // Background refresh to ensure consistency
            setTimeout(() => refreshProfileState(false), 500);

        } catch (e: any) {
            console.error("Role switch failed:", e);
            alert(`Error switching role: ${e.message}`);
            setLoading(false);
        }
    }, [profile, refreshProfileState, navigate]);

    const handleRoleReset = useCallback(async () => {
        setLoading(true);
        const { error } = await supabase.from('profiles').update({ role: null, profile_completed: false }).eq('id', profile?.id);
        if (error) {
            alert(`Error resetting role: ${error.message}`);
            setLoading(false);
        } else {
            await refreshProfileState(false);
            navigate('/', { replace: true });
        }
    }, [profile, refreshProfileState, navigate]);

    const handleOnboardingComplete = useCallback(async () => {
        // 1. Optimistic update first to unlock UI immediately
        if (profile) {
            const updatedProfile = { 
                ...profile, 
                profile_completed: true, 
                onboarding_step: profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION ? 'completed' : profile.onboarding_step 
            };
            setProfile(updatedProfile);
            
            // 2. Navigate immediately based on the optimistic profile
            const targetPath = getHomePath(updatedProfile);
            navigate(targetPath, { replace: true });
        }
        
        // 3. Sync with server in background (pass true to force completion logic in getProfile)
        setTimeout(() => refreshProfileState(true), 100);
    }, [profile, refreshProfileState, navigate]);


    const handleOnboardingStepChange = useCallback(async () => {
        await refreshProfileState(false);
    }, [refreshProfileState]);

    const handleSignOut = useCallback(async () => {
        setLoading(true);
        await handleInvalidSession();
    }, [handleInvalidSession]);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) throw error;

                if (!session) {
                    setLoading(false);
                    return;
                }

                setSession(session);
                if (session) await getProfile(session);
                else setLoading(false);
            } catch (error: any) {
                console.warn("Auth init error:", error.message);
                if (error.message?.includes("Refresh Token") || error.message?.includes("Invalid")) {
                    handleInvalidSession();
                    return;
                }
                setSession(null);
                setProfile(null);
                setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: any, session: any) => {
                if (event === 'TOKEN_REFRESH_REVOKED') {
                    handleInvalidSession();
                    return;
                }
                
                if (event === 'TOKEN_REFRESHED' && session && profile) {
                    setSession(session);
                    // Silent refresh
                    getProfile(session, false, true); 
                    return;
                }
                
                if (event === 'SIGNED_OUT') {
                    handleInvalidSession();
                    return;
                }
                
                setSession(session);
                if (session) {
                     if (!profile || (profile && profile.id !== session.user.id)) {
                         getProfile(session);
                     }
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            }
        );
        return () => subscription.unsubscribe();
    }, [getProfile, handleInvalidSession, profile]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="lg" />
                    <p className="text-muted-foreground animate-pulse text-sm">Loading your portal...</p>
                </div>
            </div>
        );
    }
    
    if (!session || !profile) {
        return <AuthPage />;
    }
    
    const isSchoolAdminOnboarding = profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION && profile.onboarding_step !== 'completed';

    // If profile is not complete, OR if strict admin onboarding isn't finished -> Show Onboarding
    if ((!profile.profile_completed || !profile.role) || isSchoolAdminOnboarding) {
        return <OnboardingFlow 
                    profile={profile} 
                    onComplete={handleOnboardingComplete} 
                    onStepChange={handleOnboardingStepChange}
                    onboardingStep={profile.onboarding_step} 
                />;
    }

    const homePath = getHomePath(profile);
    
    const adminRoles: string[] = [
        BuiltInRoles.SCHOOL_ADMINISTRATION, 
        BuiltInRoles.BRANCH_ADMIN, 
        BuiltInRoles.PRINCIPAL, 
        BuiltInRoles.HR_MANAGER, 
        BuiltInRoles.ACADEMIC_COORDINATOR,
        BuiltInRoles.ACCOUNTANT,
    ];

    return (
        <Routes>
            <Route 
                path="/" 
                element={<Navigate to={homePath} replace />} 
            />

            <Route 
                path="/admin/*" 
                element={
                    adminRoles.includes(profile.role!) && !profile.is_super_admin 
                        ? <SchoolAdminDashboard profile={profile} onSelectRole={handleDirectRoleSwitch} onSignOut={handleSignOut} onProfileUpdate={() => refreshProfileState(false)} /> 
                        : <Navigate to={homePath} replace />
                } 
            />
            <Route 
                path="/super-admin/*" 
                element={
                    profile.is_super_admin 
                        ? <SuperAdminDashboard profile={profile} onSelectRole={handleDirectRoleSwitch} onSignOut={handleSignOut} /> 
                        : <Navigate to={homePath} replace />
                } 
            />
            <Route 
                path="/parent/*" 
                element={
                    profile.role === BuiltInRoles.PARENT_GUARDIAN 
                        ? <ParentDashboard profile={profile} onSelectRole={handleDirectRoleSwitch} onSignOut={handleSignOut} onProfileUpdate={() => refreshProfileState(false)} /> 
                        : <Navigate to={homePath} replace />
                } 
            />
            <Route 
                path="/student/*" 
                element={
                    profile.role === BuiltInRoles.STUDENT 
                        ? <StudentDashboard 
                            profile={profile} 
                            onSignOut={handleSignOut} 
                            onSwitchRole={handleRoleReset} 
                            onSelectRole={handleDirectRoleSwitch} 
                          />
                        : <Navigate to={homePath} replace />
                } 
            />
            <Route 
                path="/teacher/*" 
                element={
                    profile.role === BuiltInRoles.TEACHER 
                        ? <TeacherDashboard profile={profile} onSwitchRole={handleRoleReset} onSignOut={handleSignOut} onProfileUpdate={() => refreshProfileState(false)} onSelectRole={handleDirectRoleSwitch} /> 
                        : <Navigate to={homePath} replace />
                } 
            />
            <Route 
                path="/transport/*" 
                element={
                    profile.role === BuiltInRoles.TRANSPORT_STAFF 
                        ? <TransportDashboard profile={profile} onSignOut={handleSignOut} onSwitchRole={handleRoleReset} onSelectRole={handleDirectRoleSwitch} /> 
                        : <Navigate to={homePath} replace />
                } 
            />
            <Route 
                path="/store/*" 
                element={
                    profile.role === BuiltInRoles.ECOMMERCE_OPERATOR 
                        ? <EcommerceDashboard profile={profile} onSignOut={handleSignOut} onSwitchRole={handleRoleReset} onSelectRole={handleDirectRoleSwitch} /> 
                        : <Navigate to={homePath} replace />
                } 
            />
            
            <Route 
                path="/dashboard/*" 
                element={<RoleDashboard profile={profile} onSignOut={handleSignOut} onSelectRole={handleDirectRoleSwitch} onProfileUpdate={() => refreshProfileState(false)} />} 
            />

            <Route path="*" element={<NotFound redirectTo={homePath} />} />
        </Routes>
    );
};

export default App;
