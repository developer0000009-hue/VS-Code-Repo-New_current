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

const StatBox: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
        <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
        <div className="flex items-center gap-4 relative z-10">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                <h3 className="text-2xl font-black text-foreground mt-1">{value}</h3>
            </div>
        </div>
    </div>
);

const MinimalAdminDashboard: React.FC<{ profile: UserProfile }> = ({ profile }) => {
    const [stats, setStats] = useState({ students: 0, teachers: 0, revenue: 0, applications: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
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
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Control Center</h1>
                    <p className="text-muted-foreground mt-1">High-level institutional performance overview.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Academic Year</p>
                    <p className="text-sm font-bold text-primary">2025 - 2026</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBox title="Active Students" value={stats.students} icon={<GraduationCapIcon className="w-6 h-6"/>} color="bg-blue-500" />
                <StatBox title="Faculty Strength" value={stats.teachers} icon={<TeacherIcon className="w-6 h-6"/>} color="bg-emerald-500" />
                <StatBox title="New Applications" value={stats.applications} icon={<UsersIcon className="w-6 h-6"/>} color="bg-amber-500" />
                <StatBox title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<FinanceIcon className="w-6 h-6"/>} color="bg-indigo-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 shadow-sm">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-primary" /> Enrollment Distribution
                    </h3>
                    <div className="h-64 bg-muted/20 rounded-2xl flex items-center justify-center border-2 border-dashed border-border">
                        <p className="text-muted-foreground italic text-sm">Visual distribution chart coming in next update.</p>
                    </div>
                </div>
                
                <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <SchoolIcon className="w-5 h-5 text-primary" /> Branch Health
                    </h3>
                    <div className="space-y-4 flex-grow">
                        {[
                            { name: 'Main Campus', health: 98, status: 'Optimal' },
                            { name: 'North Satellite', health: 85, status: 'Check Attendance' },
                            { name: 'West Wing Academy', health: 92, status: 'Optimal' }
                        ].map((b, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/50">
                                <div>
                                    <p className="text-sm font-bold text-foreground">{b.name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{b.status}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-primary">{b.health}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-8 w-full py-3 bg-primary/10 text-primary font-bold text-sm rounded-xl hover:bg-primary/20 transition-all">
                        Full Audit Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MinimalAdminDashboard;