
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

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                if (signInError.message.toLowerCase().includes('confirm') || signInError.message.toLowerCase().includes('verified')) {
                    setError("Identity activation pending. Verify your inbox.");
                } else {
                    setError(signInError.message);
                }
                setLoading(false);
                return;
            }
        } catch (err: any) {
            setError("Connectivity Protocol Failure.");
            setLoading(false);
        }
    };

    return (
        <div className="bg-card/40 dark:bg-card/30 backdrop-blur-3xl p-8 sm:p-12 rounded-[2.5rem] border border-white/10 space-y-10 shadow-2xl relative overflow-hidden">
            <div className="text-center space-y-3 relative z-10">
                <h2 className="text-4xl font-serif font-black text-white tracking-tight leading-none">Initialize</h2>
                <p className="text-white/40 text-sm font-medium tracking-tight">
                    Secure access to the institutional node.
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 animate-in shake duration-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-2 group">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-1 transition-colors group-focus-within:text-primary">User Identifier</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                            <MailIcon className="h-5 w-5" />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full h-[62px] pl-14 pr-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300 font-medium"
                            placeholder="institutional@id.net"
                        />
                    </div>
                </div>

                <div className="space-y-2 group">
                    <div className="flex justify-between items-center ml-1">
                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] transition-colors group-focus-within:text-primary">Cipher Key</label>
                        <button type="button" onClick={onForgotPassword} className="text-[10px] font-black text-primary/60 hover:text-primary transition-colors uppercase tracking-widest">Lost Key?</button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                            <LockIcon className="h-5 w-5" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full h-[62px] pl-14 pr-12 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 focus:bg-white/10 transition-all duration-300 font-medium"
                            placeholder="••••••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-5 flex items-center text-white/20 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-[62px] flex items-center justify-center py-3.5 px-8 rounded-2xl shadow-2xl shadow-primary/20 text-sm font-black text-white bg-primary hover:bg-primary/90 focus:outline-none transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 uppercase tracking-[0.25em]"
                    >
                        {loading ? <Spinner size="sm" className="text-white" /> : 'Authorize'}
                    </button>
                </div>
            </form>

            <div className="text-center relative z-10">
                <p className="text-xs text-white/30 font-medium">
                    New Identity?{' '}
                    <button
                        onClick={onSwitchToSignup}
                        className="font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest ml-1"
                    >
                        Initialize Account
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
