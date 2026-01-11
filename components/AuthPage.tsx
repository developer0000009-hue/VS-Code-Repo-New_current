import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ThemeSwitcher from './common/ThemeSwitcher';
import { SchoolIcon } from './icons/SchoolIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

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
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0d0f14]/80 backdrop-blur-3xl p-10 md:p-16 rounded-[3rem] border border-white/10 text-center shadow-2xl relative overflow-hidden ring-1 ring-white/5"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent animate-scanner-move pointer-events-none"></div>
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 ring-8 ring-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <CheckIcon className="w-10 h-10" />
            </div>
            <h3 className="text-4xl font-serif font-black text-white mb-4 tracking-tighter uppercase">Protocol <span className="text-white/30 italic">Finalized.</span></h3>
            <p className="text-white/50 mb-10 text-base leading-relaxed font-serif italic">
                Identity node synchronized. A secure initialization link has been dispatched to <strong className="text-white">{userEmail}</strong>.
            </p>
            <button
                onClick={() => { setSignupSuccess(false); setView('login'); }}
                className="w-full h-[64px] flex items-center justify-center py-3.5 px-8 rounded-2xl shadow-xl shadow-primary/20 text-[10px] font-black text-white bg-primary hover:bg-primary/90 transition-all transform active:scale-95 uppercase tracking-[0.4em]"
            >
                Initialize Console
            </button>
        </motion.div>
    );

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.98
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.98
        })
    };

    return (
        <div className="min-h-screen flex bg-[#08090a] selection:bg-primary/20 selection:text-primary overflow-hidden relative font-sans">
            {/* Ambient Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>
            
            {/* Mesh Gradient for Background Flair */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]"></div>

            {/* Left Column: Visual Brand Story (Desktop Only) */}
            <div className="hidden lg:flex lg:w-[50%] xl:w-[60%] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050335102-c8845180f12d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 grayscale mix-blend-luminosity"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-[#0a0a0c]/90 to-[#0a0a0c] z-10"></div>
                
                <div className="relative z-20 flex flex-col justify-between w-full p-16 xl:p-24 text-white h-full">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-3xl border border-white/10 shadow-2xl ring-1 ring-white/5 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                            <SchoolIcon className="h-9 w-9 text-white" />
                        </div>
                        <span className="text-3xl font-serif font-black tracking-[0.4em] text-white/90 uppercase">Gurukul</span>
                    </div>
                    
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-10">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">v12.0.1 Secure Node</span>
                        </div>
                        <h1 className="text-7xl xl:text-9xl font-serif font-black leading-[0.9] mb-10 tracking-tighter uppercase">
                            Evolution <br/> <span className="text-white/30 italic lowercase">starts here.</span>
                        </h1>
                        <p className="text-2xl text-white/40 leading-relaxed font-serif italic max-w-lg border-l-2 border-primary/30 pl-8 ml-2">
                            The definitive institutional operating system for high-performance pedagogy and unified campus intelligence.
                        </p>
                    </div>

                    <div className="text-[10px] text-white/10 font-black uppercase tracking-[0.5em]">
                        &copy; 2025 Institutional Matrix • Deployment Core v12
                    </div>
                </div>
            </div>

            {/* Right Column: Interactive Portal */}
            <div className="w-full lg:w-[50%] xl:w-[40%] flex flex-col relative overflow-y-auto bg-[#08090a] custom-scrollbar h-screen">
                <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-30 flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">TLS 1.3 Secured</span>
                    </div>
                    <ThemeSwitcher />
                </div>

                <div className="flex-grow flex items-center justify-center p-4 sm:p-12 relative">
                    <div className="w-full max-w-[480px] z-10 relative">
                        <AnimatePresence mode="wait">
                            {signupSuccess ? (
                                renderSuccessMessage()
                            ) : (
                                <motion.div 
                                    key={view}
                                    custom={view === 'signup' ? 1 : -1}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                >
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <div className="mt-16 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">Global Education Trust Authorization Node</p>
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