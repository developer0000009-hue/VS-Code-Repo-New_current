
import React, { useState } from 'react';
import { supabase, formatError } from '../services/supabase'; 
import Spinner from './common/Spinner';
import { MailIcon } from './icons/MailIcon';
import { LockIcon } from './icons/LockIcon';
import { UserIcon } from './icons/UserIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';

interface SignupFormProps {
    onSuccess: (email: string) => void;
    onSwitchToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({ displayName: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: { 
                    data: { 
                        display_name: formData.displayName,
                        role: null // Identity will be provisioned during onboarding
                    } 
                },
            });
            if (signUpError) throw signUpError;
            if (data.user) onSuccess(formData.email);
        } catch (err: any) {
            setError(formatError(err));
            setLoading(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="bg-[#0d0f14]/80 backdrop-blur-3xl p-8 sm:p-12 rounded-[3rem] border border-white/10 space-y-10 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent animate-scanner-move pointer-events-none"></div>
            
            <div className="text-center space-y-3 relative z-10">
                <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tighter leading-none uppercase">Provision.</h2>
                <p className="text-white/30 text-xs md:text-sm font-serif italic tracking-tight">Establish a new institutional identity node.</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6 relative z-10">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl flex items-center gap-3 animate-in shake">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="flex-1">{error}</span>
                    </div>
                )}
                
                <div className="space-y-3 group">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 transition-colors group-focus-within:text-primary">Legal Descriptor</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <input name="displayName" value={formData.displayName} onChange={handleChange} required className="block w-full h-[60px] md:h-[68px] pl-14 pr-6 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all duration-300 font-bold tracking-wider" placeholder="FULL LEGAL NAME" />
                    </div>
                </div>

                <div className="space-y-3 group">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 transition-colors group-focus-within:text-primary">Node Identifier</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                            <MailIcon className="h-5 w-5" />
                        </div>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} required className="block w-full h-[60px] md:h-[68px] pl-14 pr-6 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all duration-300 font-mono font-bold tracking-wider" placeholder="ID@NODE.NET" />
                    </div>
                </div>

                <div className="space-y-3 group">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 transition-colors group-focus-within:text-primary">Secure Cipher</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                            <LockIcon className="h-5 w-5" />
                        </div>
                        <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required className="block w-full h-[60px] md:h-[68px] pl-14 pr-14 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all duration-300 font-mono font-bold tracking-widest" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-white/20 hover:text-white transition-colors">{showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button>
                    </div>
                </div>

                <div className="pt-6">
                    <button type="submit" disabled={loading} className="w-full h-[60px] md:h-[68px] flex items-center justify-center py-3.5 px-8 rounded-2xl shadow-2xl shadow-primary/20 text-[11px] font-black text-white bg-primary hover:bg-primary/90 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 uppercase tracking-[0.5em]">
                        {loading ? <Spinner size="sm" className="text-white" /> : 'Activate Protocol'}
                    </button>
                </div>
            </form>

            <div className="text-center relative z-10">
                <p className="text-xs text-white/20 font-serif italic">
                    Already Synced?{' '}
                    <button onClick={onSwitchToLogin} className="font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest ml-2 not-italic underline underline-offset-8">Return to Console</button>
                </p>
            </div>
        </div>
    );
};

export default SignupForm;
