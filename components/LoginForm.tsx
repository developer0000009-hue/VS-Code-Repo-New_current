
import React, { useState } from 'react';
import { supabase } from '../services/supabase'; 
import Spinner from './common/Spinner';
import { MailIcon } from './icons/MailIcon';
import { LockIcon } from './icons/LockIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';


interface LoginFormProps {
    onSwitchToSignup: () => void;
    onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
            return;
        }
        
        if (!data.session) {
            setError("Unable to sign in. Please check your credentials.");
            setLoading(false);
        }
    };

    return (
        <div className="bg-card/60 dark:bg-card/50 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border/50 space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-serif font-extrabold text-foreground tracking-tight">Welcome Back</h2>
                <p className="text-muted-foreground text-sm">
                    Sign in to access your personalized dashboard.
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-start gap-3 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <div className="space-y-2 group">
                    <label htmlFor="email" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors duration-300">
                            <MailIcon className="h-5 w-5" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full h-[52px] pl-12 pr-4 bg-muted/30 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all duration-200"
                            placeholder="name@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-2 group">
                    <div className="flex justify-between items-center ml-1">
                        <label htmlFor="password" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-primary">Password</label>
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors focus:outline-none hover:underline"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors duration-300">
                            <LockIcon className="h-5 w-5" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full h-[52px] pl-12 pr-11 bg-muted/30 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all duration-200"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground focus:outline-none transition-colors duration-200"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[52px] flex items-center justify-center py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 text-sm font-bold text-white bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-0.5"
                    >
                        {loading ? <Spinner size="sm" className="text-white" /> : 'Sign In'}
                    </button>
                </div>
            </form>

            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                        onClick={onSwitchToSignup}
                        className="font-bold text-primary hover:text-primary/80 transition-colors focus:outline-none hover:underline ml-1"
                    >
                        Create free account
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
