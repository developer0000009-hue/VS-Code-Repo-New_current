import React, { useState, useEffect, useRef } from 'react';
import RoleSelectionPage from './components/RoleSelectionPage';
import { BranchCreationPage } from './components/BranchCreationPage';
import { ProfileCreationPage } from './components/ProfileCreationPage';
import PricingSelectionPage from './components/PricingSelectionPage';
import { Role, UserProfile, BuiltInRoles } from './types';
import { supabase, formatError } from './services/supabase';
import Spinner from './components/common/Spinner';
import ThemeSwitcher from './components/common/ThemeSwitcher';
import { SchoolIcon } from './components/icons/SchoolIcon';
import ProfileDropdown from './components/common/ProfileDropdown';
import Stepper from './components/common/Stepper';

interface OnboardingFlowProps {
    profile: UserProfile;
    onComplete: () => Promise<void> | void;
    onStepChange: () => Promise<void> | void;
    onboardingStep?: string | null;
}

const ONBOARDING_STEPS = ['Profile', 'Plan', 'Branches & Admins'];
const stepMap: { [key: string]: number } = {
    'profile': 0,
    'pricing': 1,
    'branches': 2
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ profile, onComplete, onStepChange, onboardingStep }) => {
    const [step, setStep] = useState<'role' | 'profile' | 'pricing' | 'branches'>('role');
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);
    
    useEffect(() => {
        if (!isMounted.current || isTransitioning) return;

        if (!profile.role) {
            setSelectedRole(null);
            setStep('role');
            setLoading(false);
            return;
        }

        setSelectedRole(profile.role);
        
        if (profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
            const dbStep = onboardingStep;
            if (dbStep && ['profile', 'pricing', 'branches'].includes(dbStep)) {
                setStep(dbStep as any);
            } else if (dbStep === 'completed' || profile.profile_completed) {
                onComplete();
            } else {
                setStep('profile');
            }
        } else {
            if (profile.profile_completed) {
                onComplete();
            } else {
                setStep('profile');
            }
        }
        
        setLoading(false);
    }, [profile.role, profile.profile_completed, onboardingStep, isTransitioning]);

    const handleRoleSelect = async (role: Role) => {
        if (!isMounted.current || isTransitioning) return;
        setIsTransitioning(true);
        setLoading(true);
        setError(null); // Clear previous errors
        
        try {
            // Atomic Role Switch with sub-profile verification
            const { data, error } = await supabase.rpc('switch_active_role', { p_target_role: role });
            if (error) throw error;

            if (onStepChange) await onStepChange();
            
            setSelectedRole(role);

            // AUTO-SKIP: If the profile was already established, finalize immediately
            if (data?.profile_restored) {
                onComplete();
            } else {
                setStep('profile');
                setLoading(false);
                setIsTransitioning(false);
            }

        } catch (err: any) {
            console.error('Identity Provisioning failure:', formatError(err));
            if (isMounted.current) {
                setError(formatError(err));
                setStep('role');
                setLoading(false);
                setIsTransitioning(false);
            }
        }
    };

    const handleStepAdvance = async () => {
        if (!isMounted.current) return;
        if (onStepChange) await onStepChange();
    };

    const handleBack = async () => {
        if (!isMounted.current || profile.profile_completed) return;
        setLoading(true);
        try {
            await supabase.from('profiles').update({ role: null, profile_completed: false }).eq('id', profile.id);
            setSelectedRole(null);
            setStep('role');
            if (onStepChange) await onStepChange();
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    if (loading && !isTransitioning) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Spinner size="lg" />
            </div>
        );
    }
    
    let content;
    switch (step) {
        case 'role':
            content = <RoleSelectionPage onRoleSelect={handleRoleSelect} onComplete={onComplete} />;
            break;
        case 'profile':
            content = <ProfileCreationPage profile={profile} role={selectedRole!} onComplete={handleStepAdvance} onBack={handleBack} showBackButton={true} />;
            break;
        case 'pricing':
            content = <PricingSelectionPage onComplete={handleStepAdvance} onBack={handleBack} />;
            break;
        case 'branches':
            content = <BranchCreationPage onNext={onComplete} profile={profile} onBack={handleBack} />;
            break;
        default:
            content = <RoleSelectionPage onRoleSelect={handleRoleSelect} onComplete={onComplete} />;
    }

    const currentStepIndex = stepMap[step] ?? 0;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => step !== 'role' && handleBack()}>
                            <div className="p-2 bg-primary/10 rounded-xl mr-3 shadow-inner">
                                <SchoolIcon className="h-6 w-6 text-primary" />
                            </div>
                            <span className="font-serif font-bold text-lg hidden sm:block text-foreground tracking-tight">Institutional Setup</span>
                        </div>
                        {selectedRole === BuiltInRoles.SCHOOL_ADMINISTRATION && step !== 'role' && (
                            <div className="hidden md:flex items-center justify-center flex-grow max-w-xl mx-auto">
                                <Stepper steps={ONBOARDING_STEPS} currentStep={currentStepIndex} />
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <ThemeSwitcher />
                            <ProfileDropdown profile={profile} onSignOut={() => supabase.auth.signOut()} />
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-grow max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                {error && (
                    <div className="mb-8 bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-[2rem] flex items-center gap-5 animate-in fade-in slide-in-from-top-2">
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-black">!</span>
                        </div>
                        <div className="flex-grow">
                            <p className="text-sm font-bold">Identity Provisioning Error</p>
                            <p className="text-xs text-red-400/80 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-400/60 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                        >
                            <span className="text-xs font-black">×</span>
                        </button>
                    </div>
                )}
                {content}
            </main>
        </div>
    );
};

export default OnboardingFlow;
