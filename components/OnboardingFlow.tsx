import React, { useState, useEffect, useRef } from 'react';
import RoleSelectionPage from './RoleSelectionPage';
import { BranchCreationPage } from './BranchCreationPage';
import { ProfileCreationPage } from './ProfileCreationPage';
import PricingSelectionPage from './PricingSelectionPage';
import { Role, UserProfile, BuiltInRoles } from '../types';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import ThemeSwitcher from './common/ThemeSwitcher';
import { SchoolIcon } from './icons/SchoolIcon';
import ProfileDropdown from './common/ProfileDropdown';
import Stepper from './common/Stepper';

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

const stepIndexMap: { [key: number]: 'profile' | 'pricing' | 'branches' } = {
    0: 'profile',
    1: 'pricing',
    2: 'branches'
};

// Error formatter helper
const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') return err;
    
    // Check for standard Error object or Supabase PostgrestError properties
    // Supabase errors often have 'message', 'error_description', or 'details'
    const message = err.message || err.error_description || err.details?.message || err.details || err.hint;

    if (message && typeof message === 'string') {
         return message;
    }
    
    // Fallback for objects that don't have a clear message property
    try {
        const json = JSON.stringify(err);
        if (json && json !== '{}' && json !== '[]') return json;
    } catch {
        // Ignore JSON errors
    }
    
    return "An unexpected system error occurred.";
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ profile, onComplete, onStepChange, onboardingStep }) => {
    const [step, setStep] = useState<'role' | 'profile' | 'pricing' | 'branches'>('role');
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Refs for stability
    const isMounted = useRef(true);
    const initialized = useRef(false);
    const lastRole = useRef<Role | null>(null);
    const processingRoleSelection = useRef(false); 
    const ignoreProfileChanges = useRef(false);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);
    
    useEffect(() => {
        if (ignoreProfileChanges.current) {
            if (!profile.role) {
                ignoreProfileChanges.current = false; 
            } else {
                return;
            }
        }

        if (selectedRole && profile.role && selectedRole !== profile.role) {
             return;
        }

        if (initialized.current && profile.role === lastRole.current) {
            if (profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION && onboardingStep) {
                 if (['profile', 'pricing', 'branches'].includes(onboardingStep)) {
                     if (isMounted.current && step !== onboardingStep) {
                         // Optional sync
                     }
                 }
            }
            return;
        }

        if (initialized.current && selectedRole) {
            return;
        }

        setLoading(true);
        
        if (profile.role) {
            setSelectedRole(profile.role);
            lastRole.current = profile.role;

            if (profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                const dbStep = onboardingStep;
                if (dbStep && ['profile', 'pricing', 'branches'].includes(dbStep)) {
                    if (isMounted.current) setStep(dbStep as any);
                } else {
                    if (isMounted.current) setStep('profile');
                }
            } else if (profile.role === BuiltInRoles.BRANCH_ADMIN) {
                 if (isMounted.current) onComplete();
            } else if (!profile.profile_completed) {
                if (isMounted.current) setStep('profile');
            } else {
                 if (isMounted.current) onComplete();
            }
        } else {
            if (isMounted.current) {
                setSelectedRole(null);
                setStep('role');
            }
        }
        
        if (isMounted.current) setLoading(false);
        initialized.current = true;
    }, [profile.role, onboardingStep, profile.profile_completed, selectedRole, step, onComplete]);

    const handleSignOut = async () => {
        if (isMounted.current) setLoading(true);
        await supabase.auth.signOut();
    };
    
    const handleRoleSelect = async (role: Role) => {
        if (!isMounted.current || processingRoleSelection.current) return;
        
        processingRoleSelection.current = true; 
        setLoading(true);
        ignoreProfileChanges.current = false; 
        lastRole.current = role; 
        setSelectedRole(role);

        const simpleAdminRoles: Role[] = [
            BuiltInRoles.PRINCIPAL,
            BuiltInRoles.HR_MANAGER,
            BuiltInRoles.ACADEMIC_COORDINATOR
        ];

        let tableName = '';
        switch (role) {
            case BuiltInRoles.PARENT_GUARDIAN: tableName = 'parent_profiles'; break;
            case BuiltInRoles.STUDENT: tableName = 'student_profiles'; break;
            case BuiltInRoles.TEACHER: tableName = 'teacher_profiles'; break;
            case BuiltInRoles.TRANSPORT_STAFF: tableName = 'transport_staff_profiles'; break;
            case BuiltInRoles.ECOMMERCE_OPERATOR: tableName = 'ecommerce_operator_profiles'; break;
        }

        let profileExists = false;
        
        try {
            if (tableName) {
                const { count, error } = await supabase
                    .from(tableName)
                    .select('user_id', { count: 'exact', head: true })
                    .eq('user_id', profile.id);

                if (!error && count && count > 0) {
                    profileExists = true;
                }
            }
            
            const isComplete = (profileExists && role !== BuiltInRoles.SCHOOL_ADMINISTRATION) || simpleAdminRoles.includes(role);

            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({ 
                    id: profile.id,
                    email: profile.email,
                    role: role, 
                    profile_completed: isComplete 
                }, { onConflict: 'id' });

            if (updateError) throw updateError;
            
            // **THE FIX**
            // If selecting School Admin for the first time, create the admin profile record immediately
            // to lock in the onboarding state.
            if (role === BuiltInRoles.SCHOOL_ADMINISTRATION && !isComplete) {
                const { error: adminProfileUpsertError } = await supabase
                    .from('school_admin_profiles')
                    .upsert({ 
                        user_id: profile.id, 
                        onboarding_step: 'profile' 
                    }, { onConflict: 'user_id' });
                
                if (adminProfileUpsertError) throw adminProfileUpsertError;
            }

            if (onStepChange) await onStepChange();

            if (role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                setStep('profile');
            } else if (role === BuiltInRoles.BRANCH_ADMIN) {
                await onComplete(); 
            } else {
                if (isComplete) { 
                    await onComplete(); 
                } else {
                    setStep('profile'); 
                }
            }

        } catch (err: any) {
            console.error('Role selection failed:', err);
            const errorMessage = formatError(err);
            alert(`Failed to assign role: ${errorMessage}\nPlease try again.`);
            setSelectedRole(null);
            setStep('role');
        } finally {
            processingRoleSelection.current = false;
            if (isMounted.current) setLoading(false);
        }
    };

    const handleProfileComplete = async () => {
        if (!isMounted.current) return;
        if (selectedRole === BuiltInRoles.SCHOOL_ADMINISTRATION) {
            // Profile page now handles DB update, just refresh state here
            await onStepChange(); 
        } else {
            await onComplete();
        }
    };

    const handlePricingComplete = async () => {
        if (!isMounted.current) return;
         // Pricing page now handles DB update, just refresh state here
        await onStepChange();
    };

    const [isFinishing, setIsFinishing] = useState(false);

    const handleBranchesComplete = async () => {
        // FIX: Changed check from 'onNext' to 'onComplete'. 'onNext' is not defined in this scope, while 'onComplete' is the prop that this handler is intended to call.
        if (isFinishing || !isMounted.current || !onComplete) return; 
        setIsFinishing(true);
        try {
            const { error } = await supabase.rpc('complete_branch_step');
            if (error) throw error;
            if (isMounted.current) await onComplete();
        } catch (error: any) {
            console.error("Error finalizing setup:", error);
            alert("Error finalizing setup: " + formatError(error));
            if (isMounted.current) setIsFinishing(false);
        }
    };
    
    const handleBack = async () => {
        if (!isMounted.current) return;
        if (profile.profile_completed) return;

        // Ensure we sync the back navigation to the database for School Admin
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
                     // Going back from profile clears role
                     ignoreProfileChanges.current = true;
                     await supabase.from('profiles').update({ role: null, profile_completed: false }).eq('id', profile.id);
                     // Also clear school admin profile to reset onboarding? Maybe safer not to delete, just reset role.
                     setSelectedRole(null);
                     lastRole.current = null;
                     setStep('role');
                }
                
                if (onStepChange) await onStepChange();
            } catch (err) {
                 console.error("Error navigating back:", err);
            } finally {
                 if (isMounted.current) setLoading(false);
            }
            return;
        }

        // For other roles, simple state transition
        switch (step) {
            case 'branches': setStep('pricing'); break;
            case 'pricing': setStep('profile'); break;
            case 'profile': 
                setLoading(true);
                ignoreProfileChanges.current = true; 

                try {
                    await supabase.from('profiles').update({ role: null, profile_completed: false }).eq('id', profile.id);
                    setSelectedRole(null);
                    lastRole.current = null;
                    setStep('role');
                    if (onStepChange) await onStepChange(); 
                } catch (e) {
                    console.error("Error clearing role on back:", e);
                    ignoreProfileChanges.current = false; 
                } finally {
                    if (isMounted.current) setLoading(false);
                }
                break;
        }
    };

    const handleStepClick = (index: number) => {
        // Disabled direct navigation to prevent skipping steps logic for now, 
        // unless we add robust validation per step check.
        // if (!isMounted.current || selectedRole !== BuiltInRoles.SCHOOL_ADMINISTRATION) return;
        // const targetStep = stepIndexMap[index];
        // if (targetStep) {
        //    setStep(targetStep);
        // }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-muted-foreground animate-pulse font-medium">Loading...</p>
                </div>
            </div>
        );
    }
    
    let content;
    switch (step) {
        case 'role':
            content = <RoleSelectionPage onRoleSelect={handleRoleSelect} onComplete={onComplete} />;
            break;
        case 'profile':
            content = selectedRole ? (
                <ProfileCreationPage 
                    key={selectedRole} 
                    profile={profile} 
                    role={selectedRole} 
                    onComplete={handleProfileComplete} 
                    onBack={handleBack} 
                    showBackButton={true} 
                />
            ) : (
                <RoleSelectionPage onRoleSelect={handleRoleSelect} onComplete={onComplete} />
            );
            break;
        case 'pricing':
            content = <PricingSelectionPage onComplete={handlePricingComplete} onBack={handleBack} />;
            break;
        case 'branches':
            content = <BranchCreationPage onNext={handleBranchesComplete} profile={profile} onBack={handleBack} />;
            break;
        default:
            content = <RoleSelectionPage onRoleSelect={handleRoleSelect} onComplete={onComplete} />;
    }

    const currentStepIndex = stepMap[step] ?? 0;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40 transition-all duration-300">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center flex-shrink-0 cursor-pointer group" onClick={() => { if(step !== 'role') handleBack(); }}>
                            <div className="p-2 bg-primary/10 rounded-xl mr-3 group-hover:bg-primary/20 transition-colors">
                                <SchoolIcon className="h-6 w-6 text-primary" />
                            </div>
                            <span className="font-serif font-bold text-lg hidden sm:block text-foreground">Account Setup</span>
                        </div>
                        
                        {selectedRole === BuiltInRoles.SCHOOL_ADMINISTRATION && step !== 'role' && (
                            <div className="hidden md:flex items-center justify-center flex-grow max-w-xl mx-auto">
                                <Stepper 
                                    steps={ONBOARDING_STEPS} 
                                    currentStep={currentStepIndex} 
                                    onStepClick={handleStepClick}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <ThemeSwitcher />
                            <ProfileDropdown 
                                profile={profile}
                                onSignOut={handleSignOut}
                            />
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