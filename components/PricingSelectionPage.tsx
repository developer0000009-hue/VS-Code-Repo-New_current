
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { UserProfile } from '../types';

interface PricingSelectionPageProps {
    onComplete: () => void;
    onBack?: () => void;
}

interface BasePlan {
    id: string;
    label: string;
    branches: string;
    description: string;
    features: string[];
    recommended?: boolean;
}

const basePlans: BasePlan[] = [
    { 
        id: '1_branch', 
        label: 'Single Branch', 
        branches: '1 Branch', 
        description: 'Perfect for individual schools starting out.',
        features: ['Core Admin Features', 'Student Management', 'Basic Reporting', 'Email Support']
    },
    { 
        id: '3_branches', 
        label: 'Starter Chain', 
        branches: '3 Branches', 
        description: 'Ideal for small groups expanding their reach.',
        features: ['Multi-branch Dashboard', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
        recommended: true
    },
    { 
        id: '5_branches', 
        label: 'Growth Chain', 
        branches: '5 Branches', 
        description: 'For growing institutions with multiple campuses.',
        features: ['Enterprise API Access', 'Dedicated Account Manager', 'Data Export/Import', 'Unlimited Staff Accounts']
    },
    { 
        id: 'unlimited', 
        label: 'Enterprise', 
        branches: 'Unlimited', 
        description: 'Full-scale solution for large educational networks.',
        features: ['Full White Label', 'On-premise Deployment', '24/7 Phone Support', 'Custom Feature Dev']
    },
];

// Robust error formatter
const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') {
        if (err.includes("[object Object]")) return "An unexpected error occurred. Please try again.";
        return err;
    }
    
    // Check for standard Error object or Supabase PostgrestError properties
    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string' && !message.includes("[object Object]")) {
        return message;
    }
    
    // If it's an object but has no clean message, try to stringify it safely
    try {
        const json = JSON.stringify(err);
        if (json && json !== '{}' && json !== '[]') return json;
    } catch {
        // Ignore JSON errors
    }
    
    return "An unexpected system error occurred.";
};

const PricingSelectionPage: React.FC<PricingSelectionPageProps> = ({ onComplete, onBack }) => {
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true); // Add initializing state
    const [error, setError] = useState<string | null>(null);
    const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // Restore saved plan if exists
    useEffect(() => {
        const fetchSavedPlan = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('school_admin_profiles')
                    .select('plan_id')
                    .eq('user_id', user.id)
                    .single();

                if (data && data.plan_id && isMounted.current) {
                    setSelectedPlanId(data.plan_id);
                }
            } catch (err) {
                console.error("Error fetching saved plan:", err);
            } finally {
                if (isMounted.current) setInitializing(false);
            }
        };

        fetchSavedPlan();
    }, []);

    const handleSelect = async () => {
        if (!selectedPlanId) return;
        
        setLoading(true);
        setError(null);
        
        const selectedPlan = basePlans.find(p => p.id === selectedPlanId);
        const branches = selectedPlan?.branches || '1 Branch';

        try {
            // First RPC to set plan/branches if specific logic exists
            const { error: rpcError } = await supabase.rpc('finalize_school_pricing', {
                p_branches: branches
            });

            if (rpcError) throw rpcError;
            
            // Explicitly update onboarding_step and plan_id
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                 const { error: updateError } = await supabase
                    .from('school_admin_profiles')
                    .update({ 
                        plan_id: selectedPlanId,
                        onboarding_step: 'branches' 
                    })
                    .eq('user_id', user.id);
                 
                 if (updateError) throw updateError;
            }
            
            if (isMounted.current) {
                onComplete();
            }
        } catch (err: any) {
            console.error("Pricing Selection Error:", err);
            if (isMounted.current) {
                setError(formatError(err));
                setLoading(false);
            }
        }
    };

    const getPrice = (index: number) => {
        const baseValues = [9, 99, 999, 9999];
        const value = baseValues[index];
        // Simple currency conversion logic for display
        const displayValue = currency === 'INR' ? value : Math.round(value / 80 * 10) / 10; // Approx conv
        const symbol = currency === 'INR' ? '₹' : '$';
        
        return `${symbol}${displayValue.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US')}`;
    };

    if (initializing) {
        return <div className="flex justify-center items-center py-20"><Spinner size="lg" /></div>;
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {onBack && (
                <div className="mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-sm font-medium"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Back to Profile
                    </button>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div className="text-left max-w-2xl">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                        Choose Your Plan
                    </h1>
                    <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
                        Select a package that fits your institution's scale. Upgrade seamlessly as you grow.
                    </p>
                </div>
                
                {/* Currency Toggle */}
                <div className="bg-muted p-1 rounded-xl inline-flex border border-border/50 shadow-sm">
                    <button 
                        onClick={() => setCurrency('INR')}
                        className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                            currency === 'INR' 
                            ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                    >
                        INR (₹)
                    </button>
                    <button 
                        onClick={() => setCurrency('USD')}
                        className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                            currency === 'USD' 
                            ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                    >
                        USD ($)
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12 items-start">
                {basePlans.map((plan, index) => {
                    const isSelected = selectedPlanId === plan.id;
                    const isRecommended = plan.recommended;

                    return (
                        <div 
                            key={plan.id}
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`
                                group relative flex flex-col h-full p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 ease-out
                                ${isSelected 
                                    ? 'bg-primary/5 border-primary shadow-2xl scale-[1.02] ring-4 ring-primary/10 z-10' 
                                    : 'bg-card border-border hover:border-primary/30 hover:shadow-xl hover:-translate-y-2'
                                }
                            `}
                        >
                            {/* Recommended Badge */}
                            {isRecommended && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30">
                                    Most Popular
                                </div>
                            )}
                            
                            {/* Card Header */}
                            <div className="mb-6 pt-2">
                                <h3 className={`text-xl font-bold tracking-tight mb-2 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                    {plan.label}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed min-h-[40px]">
                                    {plan.description}
                                </p>
                            </div>

                            {/* Pricing */}
                            <div className="mb-8 pb-8 border-b border-border/60">
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-4xl font-extrabold tracking-tight ${isSelected ? 'text-foreground' : 'text-foreground/90'}`}>
                                        {getPrice(index)}
                                    </span>
                                    <span className="text-muted-foreground font-medium text-sm">/mo</span>
                                </div>
                                <p className="text-xs font-bold text-primary/80 uppercase tracking-widest mt-3 bg-primary/5 inline-block px-2 py-1 rounded">
                                    {plan.branches} License
                                </p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-4 mb-8 flex-grow">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start text-sm group/item">
                                        <CheckCircleIcon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${isSelected || isRecommended ? 'text-primary' : 'text-muted-foreground/60 group-hover/item:text-primary/70'}`} />
                                        <span className={`transition-colors font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover/item:text-foreground'}`}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* Selection Button (Visual only, card click handles it) */}
                            <button className={`w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all duration-200 ${
                                isSelected
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-y-0'
                                    : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary border border-transparent group-hover:border-primary/10'
                            }`}>
                                {isSelected ? 'Selected' : 'Select Plan'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Error Message */}
            {error && (
                <div className="max-w-md mx-auto mb-8 p-4 bg-destructive/10 text-destructive rounded-xl text-center text-sm border border-destructive/20 font-semibold animate-pulse flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Confirm CTA */}
            <div className="flex justify-center pb-8">
                <button
                    onClick={handleSelect}
                    disabled={!selectedPlanId || loading}
                    className="px-12 py-4 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
                >
                    {loading ? <Spinner size="md" className="text-white" /> : 'Confirm & Continue'}
                </button>
            </div>
        </div>
    );
};

export default PricingSelectionPage;
