
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
    FinanceData, FeeStructure, 
    StudentFeeSummary, UserProfile 
} from '../types';
import Spinner from './common/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { BookIcon } from './icons/BookIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

import FeeMasterWizard from './finance/FeeMasterWizard';
import ExpenseDashboard from './finance/ExpenseDashboard';
import StudentFinanceDetailView from './finance/StudentFinanceDetailView';
import RevenueTrendChart from './finance/charts/RevenueTrendChart';
import CollectionDistributionChart from './finance/charts/CollectionDistributionChart';
import { StatsSkeleton, ListSkeleton, Skeleton } from './common/Skeleton';

const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: currency === 'USD' ? 'USD' : 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};

const TabButton: React.FC<{ 
    id: string; 
    label: string; 
    icon: React.ReactNode; 
    isActive: boolean; 
    onClick: (id: any) => void;
}> = ({ id, label, icon, isActive, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`
            flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden group
            ${isActive 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }
        `}
    >
        <span className="relative z-10 flex items-center gap-2">
            {icon} {label}
        </span>
    </button>
);

const FinanceStatCard: React.FC<{
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: React.ReactNode;
    gradient: string;
}> = ({ title, value, trend, trendUp, icon, gradient }) => (
    <div className="relative overflow-hidden bg-card border border-white/5 rounded-3xl p-6 shadow-xl group hover:border-white/10 transition-all duration-300">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 rounded-bl-full group-hover:scale-110 transition-transform duration-500`}></div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${trendUp ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-serif font-black text-foreground tracking-tight">{value}</h3>
            </div>
        </div>
    </div>
);

const FinanceTab: React.FC<{ profile: UserProfile, branchId?: number | null }> = ({ profile, branchId }) => {
    const [activeView, setActiveView] = useState<'overview' | 'accounts' | 'structures' | 'expenses'>('overview');
    const [financeData, setFinanceData] = useState<FinanceData | null>(null);
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [studentLedgers, setStudentLedgers] = useState<StudentFeeSummary[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentFeeSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [accountSearch, setAccountSearch] = useState('');

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [finRes, structRes, ledgerRes] = await Promise.all([
                supabase.rpc('get_finance_dashboard_data', { p_branch_id: branchId || null }),
                supabase.from('fee_structures').select('*, components:fee_components(*)').order('created_at', { ascending: false }),
                supabase.rpc('get_student_fee_summary_all', { p_branch_id: branchId || null }) 
            ]);

            setFinanceData(finRes.data);
            setFeeStructures(structRes.data || []);
            setStudentLedgers(ledgerRes.data || []);
        } catch (err) {
            console.error("Finance Sync Fail:", err);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const filteredAccounts = useMemo(() => {
        return studentLedgers.filter(s => 
            !accountSearch || 
            s.display_name.toLowerCase().includes(accountSearch.toLowerCase()) || 
            (s.class_name && s.class_name.toLowerCase().includes(accountSearch.toLowerCase()))
        );
    }, [studentLedgers, accountSearch]);

    if (selectedStudent) {
        return (
            <StudentFinanceDetailView 
                student={selectedStudent} 
                onBack={() => setSelectedStudent(null)} 
                onUpdate={fetchAllData}
            />
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-foreground tracking-tight uppercase">Finance <span className="text-white/20 italic">Center.</span></h2>
                    <p className="text-muted-foreground mt-2 text-lg italic font-serif opacity-60">Node Economy & Institutional Burn Rate</p>
                </div>
                
                <div className="flex bg-[#12141c]/60 p-1.5 rounded-3xl border border-white/5 backdrop-blur-md shadow-2xl">
                    <TabButton id="overview" label="Overview" icon={<ChartBarIcon className="w-4 h-4"/>} isActive={activeView === 'overview'} onClick={setActiveView} />
                    <TabButton id="accounts" label="Accounts" icon={<UsersIcon className="w-4 h-4"/>} isActive={activeView === 'accounts'} onClick={setActiveView} />
                    <TabButton id="expenses" label="Expenses" icon={<BriefcaseIcon className="w-4 h-4"/>} isActive={activeView === 'expenses'} onClick={setActiveView} />
                    <TabButton id="structures" label="Master" icon={<BookIcon className="w-4 h-4"/>} isActive={activeView === 'structures'} onClick={setActiveView} />
                </div>
            </div>

            {loading ? (
                <div className="space-y-10">
                    <StatsSkeleton />
                    <ListSkeleton rows={8} />
                </div>
            ) : (
                <>
                    {activeView === 'overview' && financeData && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <FinanceStatCard 
                                    title="Revenue (YTD)" 
                                    value={formatCurrency(financeData.revenue_ytd)} 
                                    trend="+12.5%" 
                                    trendUp={true} 
                                    icon={<TrendingUpIcon className="w-6 h-6"/>}
                                    gradient="from-blue-400 to-indigo-500"
                                />
                                <FinanceStatCard 
                                    title="Outstanding" 
                                    value={formatCurrency(financeData.pending_dues)} 
                                    trend="2.4%" 
                                    trendUp={false} 
                                    icon={<AlertTriangleIcon className="w-6 h-6"/>}
                                    gradient="from-red-400 to-pink-500"
                                />
                                 <FinanceStatCard 
                                    title="Digital Stream" 
                                    value={formatCurrency(financeData.online_payments)} 
                                    icon={<CreditCardIcon className="w-6 h-6"/>}
                                    gradient="from-emerald-400 to-teal-500"
                                />
                                <FinanceStatCard 
                                    title="Faculty Burn" 
                                    value={formatCurrency(0)} // Placeholder for salary
                                    icon={<BriefcaseIcon className="w-6 h-6"/>}
                                    gradient="from-violet-400 to-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                <div className="lg:col-span-3 bg-[#0d0f14] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden h-[450px]">
                                     <RevenueTrendChart total={financeData.revenue_ytd} />
                                </div>
                                <div className="lg:col-span-2 bg-[#0d0f14] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl flex flex-col relative overflow-hidden h-[450px]">
                                     <CollectionDistributionChart 
                                        paid={financeData.revenue_ytd} 
                                        pending={financeData.pending_dues} 
                                        overdue={financeData.pending_dues * 0.3} 
                                     />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'accounts' && (
                        <div className="space-y-6">
                            <div className="bg-[#0d0f14] p-5 rounded-[2rem] border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center sticky top-24 z-20 backdrop-blur-xl">
                                <div className="relative w-full md:w-[400px] group">
                                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-primary transition-colors"/>
                                    <input 
                                        type="text" 
                                        placeholder="IDENTIFY STUDENT OR CLASS NODE..." 
                                        value={accountSearch}
                                        onChange={e => setAccountSearch(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-[13px] font-bold text-white focus:bg-black/60 outline-none uppercase tracking-wider shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="bg-[#0a0a0c] border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden min-h-[500px] ring-1 ring-white/5">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-white/[0.01] border-b border-white/[0.04] text-[10px] font-black text-white/20 uppercase tracking-[0.3em] sticky top-0 z-10 backdrop-blur-3xl">
                                        <tr>
                                            <th className="p-10 pl-14">Identity Node</th>
                                            <th className="p-10">Integrity Score</th>
                                            <th className="p-10 text-right">Lifetime Billed</th>
                                            <th className="p-10 text-right">Synchronized</th>
                                            <th className="p-10 text-right pr-14">Audit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {filteredAccounts.map(account => {
                                            const percentPaid = account.total_billed > 0 ? (account.total_paid / account.total_billed) * 100 : 0;
                                            return (
                                                <tr key={account.student_id} className="group hover:bg-white/[0.01] transition-all cursor-pointer" onClick={() => setSelectedStudent(account)}>
                                                    <td className="p-8 pl-14">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-[52px] h-[52px] rounded-[1.2rem] bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 font-serif font-black text-lg border border-white/5 shadow-inner">
                                                                {account.display_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-serif font-black text-white text-lg group-hover:text-primary transition-colors uppercase tracking-tight">{account.display_name}</p>
                                                                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">{account.class_name || 'UNASSIGNED'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="w-40">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{account.overall_status}</span>
                                                                <span className="text-[9px] font-mono text-white/30">{Math.round(percentPaid)}%</span>
                                                            </div>
                                                            <div className="h-1 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/5">
                                                                <div className={`h-full bg-primary transition-all duration-1000`} style={{ width: `${percentPaid}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-right font-mono font-bold text-white/30">{formatCurrency(account.total_billed, account.currency || 'INR')}</td>
                                                    <td className="p-8 text-right font-mono font-black text-emerald-500">{formatCurrency(account.total_paid, account.currency || 'INR')}</td>
                                                    <td className="p-8 text-right pr-14">
                                                        <button className="p-4 rounded-[1.2rem] bg-white/[0.02] text-white/20 hover:text-white transition-all border border-transparent hover:border-primary/20 shadow-xl active:scale-90">
                                                            <ArrowRightIcon className="w-6 h-6"/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeView === 'expenses' && (
                         <ExpenseDashboard data={{ total_expenses_month: 0, pending_approvals: 0, recent_expenses: [] }} onRefresh={fetchAllData} />
                    )}

                    {activeView === 'structures' && (
                        <div className="space-y-8">
                            <div className="bg-[#0d0f14] p-5 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 backdrop-blur-xl">
                                <button 
                                    onClick={() => setIsWizardOpen(true)}
                                    className="px-10 py-5 bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl hover:bg-primary/90 transition-all flex items-center gap-3 transform active:scale-95 border border-white/10 ring-4 ring-primary/5"
                                >
                                    <PlusIcon className="w-5 h-5" /> Provision Structure
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                                {feeStructures.map((fs) => (
                                    <div key={fs.id} className="bg-[#0d0f14] border border-white/5 rounded-[3rem] p-10 shadow-2xl hover:border-primary/20 transition-all flex flex-col h-full hover:-translate-y-2 duration-500 group">
                                        <div className="flex justify-between items-start mb-10">
                                            <div>
                                                <h4 className="text-2xl font-serif font-black text-white group-hover:text-primary transition-colors tracking-tight uppercase">{fs.name}</h4>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-2">{fs.academic_year} • Grade {fs.target_grade}</p>
                                            </div>
                                            <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border border-white/10 bg-white/5 text-white/40">{fs.status}</span>
                                        </div>
                                        <div className="space-y-4 mb-10 flex-grow">
                                            {(fs.components || []).slice(0, 3).map((comp: any) => (
                                                <div key={comp.id} className="flex justify-between items-center text-xs border-b border-white/[0.03] pb-4">
                                                    <span className="text-white/40 font-bold uppercase tracking-wider">{comp.name}</span>
                                                    <span className="font-mono font-black text-white/80">{formatCurrency(comp.amount, fs.currency)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-8 border-t border-white/[0.05] flex justify-between items-center mt-auto">
                                             <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Global Valuation</p>
                                                <span className="text-2xl font-black text-primary font-mono">{formatCurrency(fs.components?.reduce((a,c)=>a+Number(c.amount),0)||0, fs.currency)}</span>
                                             </div>
                                             <button className="p-3.5 bg-white/5 text-white/30 rounded-2xl hover:text-white transition-all shadow-xl border border-transparent hover:border-white/10"><EditIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {isWizardOpen && (
                <FeeMasterWizard 
                    onClose={() => setIsWizardOpen(false)} 
                    branchId={branchId || null}
                    onSuccess={() => {
                        setIsWizardOpen(false);
                        fetchAllData();
                    }} 
                />
            )}
        </div>
    );
};

export default FinanceTab;
