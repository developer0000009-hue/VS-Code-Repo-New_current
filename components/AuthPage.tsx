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
        <div className="bg-card/60 dark:bg-card/50 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border/50 text-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-md mx-auto">
            <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-500/5 shadow-xl">
                <CheckIcon className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">Account Created!</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                A verification link has been sent to <strong className="text-foreground">{userEmail}</strong>. Please check your inbox to continue.
            </p>
            <button
                onClick={() => { setSignupSuccess(false); setView('login'); }}
                className="w-full h-[52px] flex items-center justify-center py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-all transform hover:-translate-y-0.5"
            >
                Proceed to Sign In
            </button>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-background">
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-indigo-900/40 to-slate-900/90 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center mix-blend-overlay opacity-30 z-0 grayscale"></div>
                
                <div className="relative z-10 flex flex-col justify-between w-full p-16 text-white h-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                            <SchoolIcon className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-wide text-white/90">Gurukul v6.0</span>
                    </div>
                    
                    <div className="mb-12">
                        <h1 className="text-6xl font-serif font-extrabold leading-tight mb-6 tracking-tight">
                            Education, <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">Reimagined.</span>
                        </h1>
                        <p className="text-lg text-blue-100/80 max-w-lg leading-relaxed font-medium">
                            Streamline administration, enhance learning, and stay connected. The authoritative platform for modern schools.
                        </p>
                    </div>

                    <div className="flex justify-between text-xs text-white/40 font-medium uppercase tracking-wider">
                        <p>&copy; 2025 School Portal Inc.</p>
                        <div className="flex gap-6">
                            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col relative overflow-y-auto bg-background">
                <div className="absolute top-6 right-6 z-20">
                    <ThemeSwitcher />
                </div>

                <div className="flex-grow flex items-center justify-center p-6 sm:p-12">
                    <div className="w-full max-w-[440px]">
                        <div className="lg:hidden flex justify-center mb-8">
                            <div className="inline-flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <SchoolIcon className="h-8 w-8 text-primary" />
                                </div>
                                <span className="text-2xl font-extrabold text-foreground tracking-tight">Gurukul</span>
                            </div>
                        </div>

                        {signupSuccess ? (
                            renderSuccessMessage()
                        ) : (
                            <>
                                {view === 'login' && <LoginForm onSwitchToSignup={() => setView('signup')} onForgotPassword={() => setView('forgot')} />}
                                {view === 'signup' && <SignupForm onSuccess={handleSignupSuccess} onSwitchToLogin={() => setView('login')} />}
                                {view === 'forgot' && <ForgotPasswordForm onBack={() => setView('login')} />}
                            </>
                        )}
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