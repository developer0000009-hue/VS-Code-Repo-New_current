
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { XIcon } from './components/icons/XIcon';

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
    if (!userProfile.role) return '/setup';
    if (userProfile.is_super_admin) return '/super-admin';
    return ROLE_ROUTES[userProfile.role] || '/dashboard';
};

const App: React.FC = () => {
    const [session, setSession] = useState<any | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const navigate = useNavigate();
    const isFetching = useRef(false);

    /**
     * Atomically fetches or initializes the user profile based on the session.
     */
    const loadUserData = useCallback(async (currentSession: any, force = false) => {
        if (isFetching.current && !force) return;
        isFetching.current = true;
        setAuthError(null);
        
        try {
            // 1. Fetch Core Profile - Use maybeSingle to handle empty results without throw
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .maybeSingle();

            if (profileError) {
                console.error("Profile fetch error details:", profileError.message, profileError.details, profileError.hint);
                // If it's a real database error (not just missing data), we should notify the user
                if (profileError.code !== 'PGRST116') {
                     setAuthError(`Institutional synchronization error: ${profileError.message}`);
                     setLoading(false);
                     return;
                }
            }

            if (!profileData) {
                console.warn("Profile not found in database, attempting institutional auto-creation...");
                // Profile not found - either trigger didn't run or record missing
                const { data: newProfile, error: insertError } = await supabase.from('profiles').upsert({
                    id: currentSession.user.id,
                    email: currentSession.user.email,
                    display_name: currentSession.user.user_metadata?.display_name || 'User',
                    role: currentSession.user.user_metadata?.role || null,
                    profile_completed: false,
                    is_active: true
                }).select().maybeSingle();
                
                if (insertError) {
                    console.error("Profile auto-creation failed details:", insertError.message, insertError.details, insertError.hint);
                    setAuthError(`Institutional profile initialization failed: ${insertError.message}. Please check your connection or contact administration.`);
                    setLoading(false);
                    return;
                }
                
                if (!newProfile) {
                     setAuthError("Institutional profile missing or access denied. Please contact administration.");
                     setLoading(false);
                     return;
                }

                setProfile(newProfile as UserProfile);
            } else {
                setProfile(profileData as UserProfile);
                
                // 2. Fetch Onboarding Step for Admins
                if (profileData.role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                    const { data: adminData } = await supabase
                        .from('school_admin_profiles')
                        .select('onboarding_step')
                        .eq('user_id', profileData.id)
                        .maybeSingle();
                    
                    if (adminData) {
                        setOnboardingStep(adminData.onboarding_step);
                    }
                }
            }
        } catch (e: any) {
            console.error("Critical Auth Sync Error:", e.message || e);
            setAuthError(e.message || "An unexpected error occurred during institutional synchronization.");
        } finally {
            isFetching.current = false;
            setLoading(false);
        }
    }, []);

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            localStorage.removeItem(STORAGE_KEY);
            setSession(null);
            setProfile(null);
            setOnboardingStep(null);
            setAuthError(null);
            navigate('/', { replace: true });
        } catch (err) {
            console.error("Logout Error:", err);
            window.location.hash = '#/';
        } finally {
            setLoading(false);
        }
    };

    const handleDirectRoleSwitch = useCallback(async (newRole: Role) => {
        if (!profile) return;
        setLoading(true);
        try {
            const { error } = await supabase.rpc('switch_active_role', { p_target_role: newRole });
            if (error) throw error;
            
            await loadUserData(session, true);
            
            const targetPath = ROLE_ROUTES[newRole] || '/dashboard';
            navigate(targetPath, { replace: true });
        } catch (e: any) {
            console.error("Role switch failed:", e.message || e);
        } finally {
            setLoading(false);
        }
    }, [profile, session, loadUserData, navigate]);

    useEffect(() => {
        const initializeAuth = async () => {
            const { data: { session: initialSession } } = await supabase.auth.getSession();
            setSession(initialSession);
            if (initialSession) {
                await loadUserData(initialSession);
            } else {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (event === 'SIGNED_OUT') {
                setSession(null);
                setProfile(null);
                setOnboardingStep(null);
                setLoading(false);
                navigate('/', { replace: true });
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                setSession(currentSession);
                if (currentSession) {
                    loadUserData(currentSession, true);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [loadUserData, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="lg" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-tight">Verifying institutional credentials...</p>
                </div>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                    <XIcon className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold mb-2">Access Issue</h1>
                <p className="text-muted-foreground mb-6 max-w-xs mx-auto">{authError}</p>
                <button onClick={handleSignOut} className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg transition-all hover:bg-primary/90">
                    Return to Login
                </button>
            </div>
        );
    }
    
    if (!session || !profile) {
        return <AuthPage />;
    }
    
    if (!profile.profile_completed || !profile.role) {
        return (
            <OnboardingFlow 
                profile={profile} 
                onboardingStep={onboardingStep}
                onComplete={async () => {
                    setLoading(true);
                    await loadUserData(session, true);
                }} 
                onStepChange={async () => {
                    await loadUserData(session, true);
                }}
            />
        );
    }

    const homePath = getHomePath(profile);
    const adminRoles: string[] = [
        BuiltInRoles.SCHOOL_ADMINISTRATION, 
        BuiltInRoles.BRANCH_ADMIN, 
        BuiltInRoles.PRINCIPAL, 
        BuiltInRoles.HR_MANAGER, 
        BuiltInRoles.ACADEMIC_COORDINATOR, 
        BuiltInRoles.ACCOUNTANT
    ];

    return (
        <Routes>
            <Route path="/" element={<Navigate to={homePath} replace />} />
            <Route path="/setup" element={<Navigate to={homePath} replace />} />
            <Route 
                path="/admin/*" 
                element={
                    adminRoles.includes(profile.role!) && !profile.is_super_admin 
                        ? <SchoolAdminDashboard profile={profile} onSelectRole={handleDirectRoleSwitch} onSignOut={handleSignOut} onProfileUpdate={() => loadUserData(session, true)} /> 
                        : <Navigate to={homePath} replace />
                } 
            />
            <Route path="/parent/*" element={profile.role === BuiltInRoles.PARENT_GUARDIAN ? <ParentDashboard profile={profile} onSelectRole={handleDirectRoleSwitch} onSignOut={handleSignOut} onProfileUpdate={() => loadUserData(session, true)} /> : <Navigate to={homePath} replace />} />
            <Route path="/student/*" element={profile.role === BuiltInRoles.STUDENT ? <StudentDashboard profile={profile} onSignOut={handleSignOut} onSwitchRole={() => handleDirectRoleSwitch(null as any)} onSelectRole={handleDirectRoleSwitch} /> : <Navigate to={homePath} replace />} />
            <Route path="/teacher/*" element={profile.role === BuiltInRoles.TEACHER ? <TeacherDashboard profile={profile} onSwitchRole={() => handleDirectRoleSwitch(null as any)} onSignOut={handleSignOut} onProfileUpdate={() => loadUserData(session, true)} onSelectRole={handleDirectRoleSwitch} /> : <Navigate to={homePath} replace />} />
            <Route path="/dashboard/*" element={<RoleDashboard profile={profile} onSignOut={handleSignOut} onSelectRole={handleDirectRoleSwitch} onProfileUpdate={() => loadUserData(session, true)} />} />
            <Route path="/super-admin/*" element={profile.is_super_admin ? <SuperAdminDashboard profile={profile} onSelectRole={handleDirectRoleSwitch} onSignOut={handleSignOut} /> : <Navigate to={homePath} replace />} />
            <Route path="*" element={<NotFound redirectTo={homePath} />} />
        </Routes>
    );
};

export default App;
