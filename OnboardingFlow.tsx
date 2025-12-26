import React, { useState, useEffect, useRef } from 'react';
import RoleSelectionPage from './components/RoleSelectionPage';
import { BranchCreationPage } from './components/BranchCreationPage';
import { ProfileCreationPage } from './components/ProfileCreationPage';
import PricingSelectionPage from './components/PricingSelectionPage';
import { Role, UserProfile, BuiltInRoles } from './types';
import { supabase } from './services/supabase';
import Spinner from './components/common/Spinner';
import ThemeSwitcher from './components/common/ThemeSwitcher';
import { SchoolIcon } from './components/icons/SchoolIcon';
import ProfileDropdown from './components/common/ProfileDropdown';
import Stepper from './components/common/Stepper';

const formatError = (err: any): string => {
    if (!err) return "Synchronization failed.";
    
    if (typeof err === 'string') {
        const isJunk = err === "[object Object]" || err === "{}" || err === "null" || err === "undefined";
        return isJunk ? "An internal system exception occurred." : err;
    }
    
    const candidates = [
        err.message, 
        err.error_description, 
        err.details, 
        err.hint, 
        err.error?.message,
        err.error
    ];
    
    for (const val of candidates) {
        if (typeof val === 'string' && val !== "[object Object]" && val !== "{}") return val;
        if (typeof val === 'object' && val?.message && typeof val.message === 'string') return val.message;
    }
    
    try {
        const str = JSON.stringify(err);
        if (str && str !== '{}' && str !== '[]' && !str.includes("[object Object]")) return str;
    } catch { }
    
    return "An unexpected system exception occurred during setup.";
};

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

    const handleSignOut = async () => {
        if (isMounted.current) setLoading(true);
        await supabase.auth.signOut();
    };
    
    const handleRoleSelect = async (role: Role) => {
        if (!isMounted.current || isTransitioning) return;
        setIsTransitioning(true);
        setLoading(true);
        
        try {
            // switch_active_role now automatically detects if a profile is reusable
            const { data, error } = await supabase.rpc('switch_active_role', { p_target_role: role });
            if (error) throw error;

            if (onStepChange) {
                await onStepChange();
            }
            
            setSelectedRole(role);

            // If the RPC restored a profile, we immediately complete onboarding
            if (data?.profile_restored) {
                onComplete();
            }

        } catch (err: any) {
            const formatted = formatError(err);
            console.error('Role selection failed: ' + formatted, err);
            alert(`Setup Failed: ${formatted}`);
            
            if (isMounted.current) {
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

    const handleFinalize = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('complete_branch_step');
            if (error) throw error;
            if (isMounted.current) await onComplete();
        } catch (error: any) {
            alert("Protocol Violation: " + formatError(error));
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };
    
    const handleBack = async () => {
        if (!isMounted.current || profile.profile_completed) return;

        if (selectedRole === BuiltInRoles.SCHOOL_ADMINISTRATION) {
            setLoading(true);
            try {
                if (step === 'branches') {
                     await supabase.from('school_admin_profiles').update({ onboarding_step: 'pricing' }).eq('user_id', profile.id);
                     setStep('pricing');
                } else if (step === 'pricing') {
                     await supabase.from('school_admin_profiles').update({ onboarding_step: 'profile' }).eq('user_id', profile.id);
                     setStep('profile');
                } else if (step === 'profile') {
                     await supabase.from('profiles').update({ role: null, profile_completed: false }).eq('id', profile.id);
                     setSelectedRole(null);
                     setStep('role');
                }
                if (onStepChange) await onStepChange();
            } catch (err) {
                 console.error("Back navigation sync error:", err);
            } finally {
                 if (isMounted.current) setLoading(false);
            }
            return;
        }

        if (step === 'profile') {
            setLoading(true);
            try {
                await supabase.from('profiles').update({ role: null, profile_completed: false }).eq('id', profile.id);
                setSelectedRole(null);
                setStep('role');
                if (onStepChange) await onStepChange();
            } finally {
                if (isMounted.current) setLoading(false);
            }
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
            content = <BranchCreationPage onNext={handleFinalize} profile={profile} onBack={handleBack} />;
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
                            <ProfileDropdown profile={profile} onSignOut={handleSignOut} />
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-grow max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                {content}
            </main>
        </div>
    );
};

export default OnboardingFlow;