
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
        <div className="bg-card/60 dark:bg-card/50 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border/50 text-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-md">
            <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-500/5 shadow-[0_0_30px_rgba(74,222,128,0.2)]">
                <svg className="h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h3 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">Account Created!</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                A verification link has been sent to <strong className="text-foreground">{userEmail}</strong>. Please check your inbox to continue.
            </p>
            <button
                onClick={() => { setSignupSuccess(false); setView('login'); }}
                className="w-full h-[52px] flex items-center justify-center py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 text-sm font-bold text-white bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-0.5"
            >
                Proceed to Sign In
            </button>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-indigo-900/40 to-slate-900/90 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center mix-blend-overlay opacity-30 z-0 grayscale"></div>
                
                {/* Animated background elements */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>

                <div className="relative z-10 flex flex-col justify-between w-full p-16 text-white h-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                            <SchoolIcon className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-wide text-white/90">School Portal</span>
                    </div>
                    
                    <div className="mb-12">
                        <h1 className="text-6xl font-serif font-extrabold leading-tight mb-6 tracking-tight">
                            Education, <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">Reimagined.</span>
                        </h1>
                        <p className="text-lg text-blue-100/80 max-w-lg leading-relaxed font-medium">
                            Streamline administration, enhance learning, and stay connected. The premium platform for modern educational institutions.
                        </p>
                        
                        <div className="mt-10 flex items-center gap-6">
                            <div className="flex -space-x-4">
                                <img className="w-12 h-12 rounded-full border-2 border-slate-900" src="https://api.dicebear.com/8.x/avataaars/svg?seed=Felix" alt="Avatar" />
                                <img className="w-12 h-12 rounded-full border-2 border-slate-900" src="https://api.dicebear.com/8.x/avataaars/svg?seed=Aneka" alt="Avatar" />
                                <img className="w-12 h-12 rounded-full border-2 border-slate-900" src="https://api.dicebear.com/8.x/avataaars/svg?seed=Milo" alt="Avatar" />
                                <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold">+2k</div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="text-sm font-bold">Trusted Community</p>
                                <div className="flex items-center text-xs text-yellow-400 mt-0.5">
                                    ★★★★★ <span className="text-white/60 ml-2">5.0 rating</span>
                                </div>
                            </div>
                        </div>
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

            {/* Right Side - Authentication Forms */}
            <div className="w-full lg:w-1/2 flex flex-col relative overflow-y-auto bg-background">
                <div className="absolute top-6 right-6 z-20">
                    <ThemeSwitcher />
                </div>

                <div className="flex-grow flex items-center justify-center p-6 sm:p-12">
                    <div className="w-full max-w-[440px]">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <div className="inline-flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <SchoolIcon className="h-8 w-8 text-primary" />
                                </div>
                                <span className="text-2xl font-extrabold text-foreground tracking-tight">School Portal</span>
                            </div>
                        </div>

                        {signupSuccess ? (
                            renderSuccessMessage()
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
                
                {/* Mobile Footer */}
                <div className="lg:hidden p-6 text-center text-xs text-muted-foreground opacity-60">
                    &copy; 2025 School Portal. v1.3.16
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
