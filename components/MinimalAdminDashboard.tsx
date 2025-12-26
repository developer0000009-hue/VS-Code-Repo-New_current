import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';
import Spinner from './common/Spinner';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UsersIcon } from './icons/UsersIcon';
import { TeacherIcon } from './icons/TeacherIcon';
import { FinanceIcon } from './icons/FinanceIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { SchoolIcon } from './icons/SchoolIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

const StatBox: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; trend?: string }> = ({ title, value, icon, color, trend }) => (
    <div className="bg-[#12141a]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl hover:shadow-primary/10 transition-all duration-500 group overflow-hidden relative border-b-4 border-b-transparent hover:border-b-primary/40">
        <div className={`absolute -right-8 -top-8 w-48 h-48 ${color} opacity-[0.05] rounded-full blur-[100px] group-hover:opacity-[0.1] transition-opacity duration-1000`}></div>
        <div className="flex justify-between items-start relative z-10">
            <div className={`p-4 rounded-2xl bg-white/5 text-white/30 ring-1 ring-white/10 shadow-inner group-hover:scale-110 group-hover:text-primary group-hover:bg-primary/10 transition-all duration-500`}>
                {icon}
            </div>
            {trend && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 shadow-sm">
                    {trend}
                </div>
            )}
        </div>
        <div className="mt-10 relative z-10">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">{title}</p>
            <h3 className="text-6xl font-serif font-black text-white tracking-tighter leading-none">{value}</h3>
        </div>
    </div>
);

const MinimalAdminDashboard: React.FC<{ profile: UserProfile }> = ({ profile }) => {
    const [stats, setStats] = useState({ students: 0, teachers: 0, revenue: 0, applications: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [std, tea, fin, adm] = await Promise.all([
                    supabase.from('student_profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('teacher_profiles').select('*', { count: 'exact', head: true }),
                    supabase.rpc('get_finance_dashboard_data'),
                    supabase.from('admissions').select('*', { count: 'exact', head: true }).eq('status', 'Pending Review')
                ]);
                
                setStats({
                    students: std.count || 0,
                    teachers: tea.count || 0,
                    revenue: fin.data?.revenue_ytd || 0,
                    applications: adm.count || 0
                });
            } catch (e) {
                console.error("Metric sync failed:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-[75vh] space-y-8">
            <Spinner size="lg" className="text-primary" />
            <div className="text-center space-y-2">
                <p className="text-[12px] font-black uppercase tracking-[0.6em] text-white/30 animate-pulse">Establishing Secure Context</p>
                <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">v9.5 Institutional Gateway</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 max-w-[1700px] mx-auto pb-32">
            {/* Executive Identity Bar */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 bg-[#0c0e12] border border-white/5 p-12 md:p-16 rounded-[4rem] relative overflow-hidden ring-1 ring-white/10 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-900/10 pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-8 shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.5em] text-primary">System Overlord Status</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-serif font-black text-white tracking-tighter leading-[0.9] mb-4">
                        Executive <br/> <span className="text-white/30">Operations.</span>
                    </h1>
                    <p className="text-white/40 mt-8 text-2xl font-medium leading-relaxed max-w-3xl font-serif italic border-l-2 border-white/10 pl-10">
                        Real-time aggregated telemetry from all institutional nodes. Monitoring lifecycle, fiscal health, and faculty compliance across the network.
                    </p>
                </div>
                
                <div className="flex items-center gap-8 bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-3xl relative z-10 group transition-all duration-700 cursor-default min-w-[340px]">
                    <div className="p-4 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/20 transform group-hover:rotate-6 transition-transform duration-500">
                        <CalendarIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] mb-1.5">Active Fiscal Cycle</p>
                        <p className="text-2xl font-black text-white uppercase tracking-widest">2025 / 26</p>
                    </div>
                </div>
            </header>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatBox title="Global Students" value={stats.students} icon={<GraduationCapIcon className="w-8 h-8"/>} color="bg-blue-500" trend="+14.2%" />
                <StatBox title="Faculty Network" value={stats.teachers} icon={<TeacherIcon className="w-8 h-8"/>} color="bg-emerald-500" />
                <StatBox title="Pending Admissions" value={stats.applications} icon={<UsersIcon className="w-8 h-8"/>} color="bg-amber-500" trend="Attention" />
                <StatBox title="Gross Revenue" value={`$${(stats.revenue / 1000).toFixed(1)}K`} icon={<FinanceIcon className="w-8 h-8"/>} color="bg-indigo-500" trend="Optimal" />
            </div>

            {/* Analysis Center */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Growth Analysis */}
                <div className="lg:col-span-7 bg-[#12141a]/60 backdrop-blur-3xl border border-white/5 rounded-[4rem] p-16 shadow-2xl flex flex-col min-h-[550px] relative overflow-hidden group hover:border-primary/20 transition-all duration-1000">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none transform -rotate-12 group-hover:scale-110 transition-transform duration-1000"><ChartBarIcon className="w-96 h-96 text-white" /></div>
                    <div className="flex justify-between items-start mb-16 relative z-10">
                        <div>
                            <h3 className="text-4xl font-serif font-black text-white tracking-tight leading-none">Enrollment Velocity</h3>
                            <p className="text-base text-white/30 mt-3 font-medium tracking-widest uppercase">Network Growth Metrics</p>
                        </div>
                        <button className="p-4 bg-white/5 rounded-[1.5rem] hover:bg-primary hover:text-white border border-white/10 transition-all shadow-xl group-hover:scale-110">
                            <TrendingUpIcon className="w-6 h-6" />
                        </button>
                    </div>
                    
                    {/* Visualizer Simulation */}
                    <div className="flex-grow flex items-end justify-between gap-6 px-4 mb-6 relative z-10">
                         {[50, 65, 45, 80, 55, 95, 85].map((h, i) => (
                             <div key={i} className="flex-1 bg-white/[0.02] rounded-3xl relative group/bar hover:bg-primary/5 transition-all duration-700" style={{ height: '100%' }}>
                                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/30 to-primary rounded-3xl transition-all duration-1000 ease-in-out shadow-[0_0_30px_rgba(var(--primary),0.2)] group-hover/bar:brightness-125" style={{ height: `${h}%` }}></div>
                             </div>
                         ))}
                    </div>
                    <div className="flex justify-between mt-8 text-[11px] font-black text-white/20 uppercase tracking-[0.6em] px-6">
                        <span>OCT</span><span>NOV</span><span>DEC</span><span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span>
                    </div>
                </div>
                
                {/* Node Performance */}
                <div className="lg:col-span-5 bg-[#0c0e12] border border-white/5 rounded-[4rem] p-16 shadow-2xl flex flex-col relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-1000">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000"><SchoolIcon className="w-80 h-80 text-white" /></div>
                    <div className="flex justify-between items-center mb-12 relative z-10">
                         <h3 className="text-3xl font-serif font-black text-white tracking-tight">System Sync</h3>
                         <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-5 py-2.5 rounded-full border border-emerald-500/20 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div> Online
                         </div>
                    </div>
                    <div className="space-y-8 flex-grow relative z-10">
                        {[
                            { name: 'Headquarters (Core)', health: 100, status: 'Synced' },
                            { name: 'Northern Branch', health: 92, status: 'Active' },
                            { name: 'Western Campus', health: 94, status: 'Optimal' }
                        ].map((b, i) => (
                            <div key={i} className="group/item flex justify-between items-center p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-700">
                                <div>
                                    <p className="text-lg font-black text-white/90 uppercase tracking-widest leading-none">{b.name}</p>
                                    <p className="text-[10px] text-white/30 mt-2.5 uppercase font-black tracking-[0.3em]">{b.status}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-3xl font-black text-emerald-400 tracking-tighter font-mono`}>{b.health}%</p>
                                    <div className="w-24 h-1.5 bg-white/5 mt-3 rounded-full overflow-hidden shadow-inner">
                                        <div className={`h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all duration-1000`} style={{ width: `${b.health}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-12 w-full py-6 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl transition-all active:scale-[0.98] border border-white/10 flex items-center justify-center gap-4 group/btn">
                        <ShieldCheckIcon className="w-6 h-6 text-white/30 group-hover/btn:text-emerald-400 group-hover/btn:scale-110 transition-all" /> Generate Network Audit
                    </button>
                </div>
            </div>
            
            <footer className="pt-20 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-8 opacity-20 group">
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/40">GURUKUL OS v9.5.0 Deployment Core • Institutional Node</p>
                 <div className="flex items-center gap-12">
                     <span className="text-[11px] font-black uppercase tracking-[0.5em] flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"></div> Operational</span>
                     <span className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-500/80">AES-256 SECURED</span>
                 </div>
            </footer>
        </div>
    );
};

export default MinimalAdminDashboard;