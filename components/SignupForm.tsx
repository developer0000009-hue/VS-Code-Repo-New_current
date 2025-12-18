
import React, { useState } from 'react';
import { supabase } from '../services/supabase'; 
import Spinner from './common/Spinner';
import { MailIcon } from './icons/MailIcon';
import { LockIcon } from './icons/LockIcon';
import { UserIcon } from './icons/UserIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
import { countryCodes } from './data/countryCodes';
import { PhoneIcon } from './icons/PhoneIcon'; 

interface SignupFormProps {
    onSuccess: (email: string) => void;
    onSwitchToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [countryCode, setCountryCode] = useState('+91');
    const [localPhone, setLocalPhone] = useState('');
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.displayName.trim()) errors.displayName = 'Full name is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email address.';
        
        if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters.';
        else if (!/\d/.test(formData.password) || !/[a-zA-Z]/.test(formData.password)) {
            errors.password = 'Password must include both letters and numbers.';
        }
        
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match.';

        if (localPhone && !/^\d{4,15}$/.test(localPhone)) {
            errors.phone = 'Enter a valid phone number (digits only).';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) return;

        setLoading(true);

        const fullPhoneNumber = localPhone ? `${countryCode}${localPhone}` : undefined;

        // FIX: Removed 'phone' from top-level to prevent Phone Identity conflict.
        // It is correctly stored in options.data for the profile trigger.
        const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    display_name: formData.displayName,
                    phone: fullPhoneNumber, 
                    phone_country_code: countryCode,
                    phone_local: localPhone || null,
                },
            },
        });
        
        setLoading(false);

        if (error) {
            setError(error.message);
        } else {
            onSuccess(formData.email);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setLocalPhone(value);
        if (validationErrors.phone) {
            setValidationErrors(prev => ({ ...prev, phone: '' }));
        }
    };

    const inputClasses = (hasError: boolean) => `
        block w-full h-[52px] pl-12 pr-4 bg-muted/30 border rounded-xl text-sm text-foreground 
        placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200
        ${hasError 
            ? 'border-destructive/50 focus:border-destructive focus:ring-2 focus:ring-destructive/20' 
            : 'border-border/60 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background'
        }
    `;

    return (
        <div className="bg-card/60 dark:bg-card/50 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border/50 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-serif font-extrabold text-foreground tracking-tight">Create Account</h2>
                <p className="text-muted-foreground text-sm">
                    Join us today and start your journey.
                </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-start gap-3 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}
                
                <div className="space-y-2 group">
                    <label htmlFor="displayName" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Full Name</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <input 
                            id="displayName" 
                            name="displayName" 
                            type="text" 
                            value={formData.displayName} 
                            onChange={handleChange} 
                            autoComplete="name"
                            required 
                            className={inputClasses(!!validationErrors.displayName)}
                            placeholder="John Doe"
                        />
                    </div>
                    {validationErrors.displayName && <p className="ml-1 text-xs text-destructive font-medium animate-in slide-in-from-top-1">{validationErrors.displayName}</p>}
                </div>

                <div className="space-y-2 group">
                    <label htmlFor="email" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                            <MailIcon className="h-5 w-5" />
                        </div>
                        <input 
                            id="email" 
                            name="email" 
                            type="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            autoComplete="email"
                            required 
                            className={inputClasses(!!validationErrors.email)}
                            placeholder="name@example.com"
                        />
                    </div>
                    {validationErrors.email && <p className="ml-1 text-xs text-destructive font-medium animate-in slide-in-from-top-1">{validationErrors.email}</p>}
                </div>

                 <div className="space-y-2 group">
                    <label htmlFor="phone" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Phone (Optional)</label>
                    <div className="flex gap-2">
                        <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="h-[52px] bg-muted/30 border border-border/60 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all"
                        >
                            {countryCodes.map(c => <option key={c.code} value={c.dial_code}>{c.code} {c.dial_code}</option>)}
                        </select>
                        <div className="relative flex-grow">
                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                <PhoneIcon className="h-5 w-5" />
                            </div>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={localPhone}
                                onChange={handlePhoneChange}
                                className={inputClasses(!!validationErrors.phone)}
                                placeholder="Phone number"
                            />
                        </div>
                    </div>
                     {validationErrors.phone && <p className="ml-1 text-xs text-destructive font-medium animate-in slide-in-from-top-1">{validationErrors.phone}</p>}
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 group">
                        <label htmlFor="password" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                <LockIcon className="h-5 w-5" />
                            </div>
                            <input 
                                id="password" 
                                name="password" 
                                type={showPassword ? "text" : "password"}
                                value={formData.password} 
                                onChange={handleChange} 
                                autoComplete="new-password"
                                required 
                                className={`${inputClasses(!!validationErrors.password)} pr-11`}
                                placeholder="••••••••"
                            />
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-2 group">
                        <label htmlFor="confirmPassword" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Confirm</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                <LockIcon className="h-5 w-5" />
                            </div>
                            <input 
                                id="confirmPassword" 
                                name="confirmPassword" 
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword} 
                                onChange={handleChange} 
                                autoComplete="new-password"
                                required 
                                className={`${inputClasses(!!validationErrors.confirmPassword)} pr-11`}
                                placeholder="••••••••"
                            />
                             <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-1 pl-1">
                    {validationErrors.password ? (
                        <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1">{validationErrors.password}</p>
                    ) : (
                        <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span> Use 8+ chars with letters & numbers
                        </p>
                    )}
                    {validationErrors.confirmPassword && <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1">{validationErrors.confirmPassword}</p>}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[52px] flex items-center justify-center py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 text-sm font-bold text-white bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-0.5"
                    >
                        {loading ? <Spinner size="sm" className="text-white" /> : 'Create Account'}
                    </button>
                </div>
            </form>

            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                        onClick={onSwitchToLogin}
                        className="font-bold text-primary hover:text-primary/80 transition-colors focus:outline-none hover:underline ml-1"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignupForm;
