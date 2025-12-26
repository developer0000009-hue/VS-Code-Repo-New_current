import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ThemeSwitcher from './common/ThemeSwitcher';
import { SchoolIcon } from './icons/SchoolIcon';

type AuthView = 'login' | 'signup' | 'forgot';

const AuthPage: React.FC = () => {
    const [view, setView] = useState<AuthView>('login');
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const handleSignupSuccess = (email: string) => {
        setUserEmail(email);
        setSignupSuccess(true);
    };

    const renderSuccessMessage = () => (
        <div className="bg-card/60 dark:bg-card/50 backdrop-blur-3xl p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] border border-white/10 text-center animate-in fade-in zoom-in-95 duration-700 w-full max-w-md mx-auto shadow-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 text-emerald-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 ring-8 ring-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.2)] transform -rotate-6">
                <CheckIcon className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-2xl sm:text-4xl font-serif font-black text-foreground mb-4 tracking-tight leading-tight">Identity Secured.</h3>
            <p className="text-muted-foreground mb-8 sm:mb-10 text-sm sm:text-base max-w-sm mx-auto leading-relaxed font-medium px-2">
                A secure initialization link has been dispatched to <strong className="text-foreground font-bold">{userEmail}</strong>. Please verify your account to proceed.
            </p>
            <button
                onClick={() => { setSignupSuccess(false); setView('login'); }}
                className="w-full h-[56px] sm:h-[64px] flex items-center justify-center py-3.5 px-8 rounded-2xl shadow-xl shadow-primary/20 text-[10px] sm:text-xs font-black text-white bg-primary hover:bg-primary/90 transition-all transform active:scale-95 uppercase tracking-[0.3em]"
            >
                Return to Entry
            </button>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-[#0a0a0c] selection:bg-primary/20 selection:text-primary overflow-hidden">
            {/* Left Column: Visual Brand Story (Hidden on mobile/tablet) */}
            <div className="hidden lg:flex lg:w-[50%] xl:w-[60%] relative overflow-hidden">
                <div className="absolute inset-0 bg-[#0a0a0c] z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale mix-blend-luminosity"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-[#0a0a0c]/80 to-[#0a0a0c] z-10"></div>
                
                {/* Dynamic Aurora Overlay */}
                <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-indigo-500/20 rounded-full blur-[120px] animate-aurora pointer-events-none"></div>
                
                <div className="relative z-20 flex flex-col justify-between w-full p-16 xl:p-24 text-white h-full">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-3xl border border-white/10 shadow-2xl ring-1 ring-white/5 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                            <SchoolIcon className="h-9 w-9 text-white" />
                        </div>
                        <span className="text-3xl font-serif font-black tracking-[0.4em] text-white/90">GURUKUL</span>
                    </div>
                    
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-10">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">v9.5.0 Secure Node</span>
                        </div>
                        <h1 className="text-7xl xl:text-9xl font-serif font-black leading-[0.95] mb-10 tracking-tighter">
                            Architecting <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300">The Future.</span>
                        </h1>
                        <p className="text-2xl text-blue-100/60 leading-relaxed font-medium font-serif italic max-w-lg border-l-2 border-primary/30 pl-8 ml-2">
                            The definitive institutional operating system for high-performance pedagogy and unified campus intelligence.
                        </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-white/20 font-black uppercase tracking-[0.5em]">
                        <p>&copy; 2025 Institutional Matrix</p>
                        <div className="flex gap-10">
                            <span className="hover:text-white/60 cursor-pointer transition-colors">Privacy Protocol</span>
                            <span className="hover:text-white/60 cursor-pointer transition-colors">Legal Framework</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Interactive Portal */}
            <div className="w-full lg:w-[50%] xl:w-[40%] flex flex-col relative overflow-y-auto bg-[#0a0a0c] custom-scrollbar h-screen">
                <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-30 flex items-center gap-6">
                    <ThemeSwitcher />
                </div>

                <div className="flex-grow flex items-center justify-center p-4 sm:p-12 md:p-16 relative">
                    {/* Background Ambience */}
                    <div className="absolute top-1/4 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none opacity-40"></div>
                    <div className="absolute bottom-1/4 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-indigo-900/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none opacity-30"></div>

                    <div className="w-full max-w-[460px] z-10 relative">
                        {/* Mobile Brand Header */}
                        <div className="lg:hidden flex flex-col items-center mb-10 sm:mb-16 animate-in fade-in slide-in-from-top-6">
                            <div className="p-4 sm:p-5 bg-primary/10 rounded-[1.5rem] sm:rounded-[2rem] border border-primary/20 shadow-2xl mb-4 sm:mb-6 ring-8 ring-primary/5">
                                <SchoolIcon className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                            </div>
                            <span className="text-xl sm:text-3xl font-serif font-black text-white tracking-[0.4em] sm:tracking-[0.5em] uppercase">Gurukul</span>
                        </div>

                        {signupSuccess ? (
                            renderSuccessMessage()
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                {view === 'login' && (
                                    <LoginForm 
                                        onSwitchToSignup={() => setView('signup')} 
                                        onForgotPassword={() => setView('forgot')} 
                                    />
                                )}
                                {view === 'signup' && (
                                    <SignupForm 
                                        onSuccess={handleSignupSuccess} 
                                        onSwitchToLogin={() => setView('login')} 
                                    />
                                )}
                                {view === 'forgot' && (
                                    <ForgotPasswordForm 
                                        onBack={() => setView('login')} 
                                    />
                                )}
                            </div>
                        )}
                        
                        <div className="mt-12 sm:mt-16 text-center">
                            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-white/10">Global Education Trust Authorization Node</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CheckIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

export default AuthPage;