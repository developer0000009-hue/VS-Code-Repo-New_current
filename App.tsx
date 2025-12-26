
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase, STORAGE_KEY } from './services/supabase';
import { UserProfile, BuiltInRoles } from './types';
import AuthPage from './components/AuthPage';
import SchoolAdminDashboard from './components/SchoolAdminDashboard';
import ParentDashboard from './components/ParentDashboard';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import OnboardingFlow from './OnboardingFlow';
import Spinner from './components/common/Spinner';
import NotFound from './components/common/NotFound';

const App: React.FC = () => {
    const [session, setSession] = useState<any | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
    
    const navigate = useNavigate();
    const isFetching = useRef(false);

    const loadUserData = useCallback(async (currentSession: any, force = false) => {
        if (isFetching.current && !force) return;
        isFetching.current = true;
        
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profileData) {
                // Initialize profile if missing
                const { data: newProfile, error: insertError } = await supabase.from('profiles').upsert({
                    id: currentSession.user.id,
                    email: currentSession.user.email,
                    display_name: currentSession.user.user_metadata?.display_name || 'New User',
                    is_active: true
                }).select().maybeSingle();
                
                if (insertError) throw insertError;
                setProfile(newProfile as UserProfile);
            } else {
                setProfile(profileData as UserProfile);
                
                // If school admin, track their onboarding progress
                if (profileData.role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                    const { data: adminProfile } = await supabase
                        .from('school_admin_profiles')
                        .select('onboarding_step')
                        .eq('user_id', profileData.id)
                        .maybeSingle();
                    setOnboardingStep(adminProfile?.onboarding_step || 'profile');
                }
            }
        } catch (e) {
            console.error("Critical Profile Sync Failure:", e);
        } finally {
            isFetching.current = false;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession);
            if (initialSession) loadUserData(initialSession);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
            if (currentSession) loadUserData(currentSession, true);
            else {
                setProfile(null);
                setLoading(false);
            }
        });
        return () => subscription.unsubscribe();
    }, [loadUserData]);

    const handleOnboardingComplete = async () => {
        setLoading(true);
        if (session) await loadUserData(session, true);
    };

    const handleRoleReset = async () => {
        setLoading(true);
        if (profile) {
            await supabase.from('profiles').update({ role: null, profile_completed: false }).eq('id', profile.id);
            if (session) await loadUserData(session, true);
        }
    };

    const handleSignOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
        setProfile(null);
        navigate('/', { replace: true });
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0c] text-center p-6">
                <Spinner size="lg" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Initializing Identity Node</p>
            </div>
        );
    }

    if (!session || !profile) return <AuthPage />;

    if (!profile.role || (!profile.profile_completed && profile.role !== BuiltInRoles.SUPER_ADMIN)) {
        return (
            <OnboardingFlow 
                profile={profile} 
                onComplete={handleOnboardingComplete} 
                onStepChange={() => loadUserData(session, true)}
                onboardingStep={onboardingStep}
            />
        );
    }

    const renderDashboard = () => {
        switch (profile.role) {
            case BuiltInRoles.SCHOOL_ADMINISTRATION:
            case BuiltInRoles.BRANCH_ADMIN:
                return <SchoolAdminDashboard profile={profile} onSignOut={handleSignOut} onProfileUpdate={handleOnboardingComplete} onSelectRole={(r) => handleOnboardingComplete()} />;
            case BuiltInRoles.PARENT_GUARDIAN:
                return <ParentDashboard profile={profile} onSignOut={handleSignOut} onProfileUpdate={handleOnboardingComplete} onSelectRole={(r) => handleOnboardingComplete()} />;
            case BuiltInRoles.STUDENT:
                return <StudentDashboard profile={profile} onSignOut={handleSignOut} onSwitchRole={handleRoleReset} onSelectRole={(r) => handleOnboardingComplete()} />;
            case BuiltInRoles.TEACHER:
                return <TeacherDashboard profile={profile} onSignOut={handleSignOut} onProfileUpdate={handleOnboardingComplete} onSwitchRole={handleRoleReset} onSelectRole={(r) => handleOnboardingComplete()} />;
            default:
                return <div className="p-20 text-center">Identity Mismatch: Role {profile.role} is not mapped to a dashboard.</div>;
        }
    };

    return (
        <Routes>
            <Route path="/" element={renderDashboard()} />
            <Route path="/admin" element={profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION || profile.role === BuiltInRoles.BRANCH_ADMIN ? renderDashboard() : <Navigate to="/" />} />
            <Route path="/parent" element={profile.role === BuiltInRoles.PARENT_GUARDIAN ? renderDashboard() : <Navigate to="/" />} />
            <Route path="/student" element={profile.role === BuiltInRoles.STUDENT ? renderDashboard() : <Navigate to="/" />} />
            <Route path="/teacher" element={profile.role === BuiltInRoles.TEACHER ? renderDashboard() : <Navigate to="/" />} />
            <Route path="*" element={<NotFound redirectTo="/" />} />
        </Routes>
    );
};

export default App;
