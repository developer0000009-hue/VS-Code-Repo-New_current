
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
    FinanceData, FeeStructure, FeeComponent, 
    StudentFeeSummary, UserProfile 
} from '../types';
import Spinner from './common/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { BookIcon } from './icons/BookIcon';
import { TrashIcon } from './icons/TrashIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { CloneIcon } from './icons/CloneIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import FeeMasterWizard from './finance/FeeMasterWizard';

// --- UTILITIES ---
const formatCurrency = (amount: number, currency: 'INR' | 'USD' = 'INR') => {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: currency,
        minimumFractionDigits: 0
    }).format(amount || 0);
};

const FinanceTab: React.FC<{ profile: UserProfile, branchId?: number | null }> = ({ profile, branchId }) => {
    const [activeView, setActiveView] = useState<'overview' | 'accounts' | 'structures' | 'reports'>('overview');
    const [financeData, setFinanceData] = useState<FinanceData | null>(null);
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [structFilter, setStructFilter] = useState<'All' | 'Active' | 'Draft'>('All');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [finRes, structRes] = await Promise.all([
                supabase.rpc('get_finance_dashboard_data', { p_branch_id: branchId || null }),
                supabase.from('fee_structures').select('*, components:fee_components(*)').order('created_at', { ascending: false })
            ]);

            if (finRes.error) console.warn("Dashboard metrics unavailable.");
            if (structRes.error) throw structRes.error;

            setFinanceData(finRes.data);
            setFeeStructures(structRes.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to synchronize institutional data.");
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const filteredStructures = useMemo(() => {
        return feeStructures.filter(s => {
            const matchesStatus = structFilter === 'All' || s.status === structFilter;
            const matchesSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [feeStructures, structFilter, searchTerm]);

    const handlePublish = async (id: number) => {
        const { error } = await supabase.rpc('publish_fee_structure', { p_structure_id: id });
        if (error) alert(error.message);
        else fetchAllData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this structure? This will also remove associated components.")) return;
        const { error } = await supabase.from('fee_structures').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchAllData();
    };

    if (loading && !feeStructures.length) {
        return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">Finance Management</h2>
                    <p className="text-muted-foreground mt-1 text-lg">Manage institutional fee schedules, collections, and financial reporting.</p>
                </div>
                <div className="flex bg-muted/40 p-1 rounded-xl border border-border shadow-inner">
                    {[
                        { id: 'overview', label: 'Overview', icon: <ChartBarIcon className="w-4 h-4"/> },
                        { id: 'structures', label: 'Fee Master', icon: <BookIcon className="w-4 h-4"/> },
                        { id: 'accounts', label: 'Student Ledgers', icon: <UsersIcon className="w-4 h-4"/> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                                activeView === tab.id 
                                ? 'bg-card text-primary shadow-sm ring-1 ring-black/5' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Stats */}
            {activeView === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2">
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Revenue (YTD)</p>
                        <h3 className="text-3xl font-black text-foreground mt-1">{formatCurrency(financeData?.revenue_ytd || 0)}</h3>
                        <div className="mt-4 flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                            <TrendingUpIcon className="w-4 h-4"/> +12% from last cycle
                        </div>
                    </div>
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Outstanding Dues</p>
                        <h3 className="text-3xl font-black text-red-500 mt-1">{formatCurrency(financeData?.pending_dues || 0)}</h3>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">From {financeData?.overdue_accounts || 0} student accounts</p>
                    </div>
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Online Collections</p>
                        <h3 className="text-3xl font-black text-indigo-500 mt-1">{formatCurrency(financeData?.online_payments || 0)}</h3>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">Processed via secure gateway</p>
                    </div>
                </div>
            )}

            {/* Fee Master Section */}
            {activeView === 'structures' && (
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="bg-card border border-border rounded-[1.5rem] p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                        <div className="flex bg-muted p-1 rounded-xl shadow-inner border border-border/50">
                            {['All', 'Active', 'Draft'].map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setStructFilter(f as any)}
                                    className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${structFilter === f ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex-grow max-w-md">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Search by structure name..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-xl text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <button 
                            onClick={() => setIsWizardOpen(true)}
                            className="px-6 py-3 bg-primary text-primary-foreground font-black text-sm rounded-xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 transform active:scale-95"
                        >
                            <PlusIcon className="w-5 h-5" /> New Master Structure
                        </button>
                    </div>

                    {/* Listing */}
                    {filteredStructures.length === 0 ? (
                        <div className="py-32 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/5 animate-in zoom-in-95">
                             <BookIcon className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                             <h4 className="text-xl font-bold text-foreground">No Fee Structures Found</h4>
                             <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                                 Define your institutional fee schedules for the upcoming academic year. You can create drafts and publish them once verified.
                             </p>
                             <button onClick={() => setIsWizardOpen(true)} className="mt-8 text-primary font-black uppercase tracking-widest text-xs hover:underline flex items-center gap-2 mx-auto">
                                <PlusIcon className="w-4 h-4" /> Create First Master Draft
                             </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {filteredStructures.map((fs) => {
                                const totalAmount = fs.components?.reduce((acc, c) => acc + Number(c.amount), 0) || 0;
                                return (
                                    <div key={fs.id} className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full ring-1 ring-black/5">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors tracking-tight truncate max-w-[200px]">{fs.name}</h4>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{fs.academic_year} • Grade {fs.target_grade}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-widest ${
                                                fs.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-200'
                                            }`}>
                                                {fs.status || 'Draft'}
                                            </span>
                                        </div>

                                        <div className="space-y-3 mb-6 flex-grow">
                                            {(fs.components?.slice(0, 3) || []).map(comp => (
                                                <div key={comp.id} className="flex justify-between items-center text-xs border-b border-border/40 pb-2">
                                                    <span className="text-muted-foreground font-medium">{comp.name}</span>
                                                    <span className="font-mono font-bold text-foreground">{formatCurrency(comp.amount, fs.currency as any)}</span>
                                                </div>
                                            ))}
                                            {fs.components && fs.components.length > 3 && (
                                                <p className="text-[10px] text-muted-foreground italic">+{fs.components.length - 3} more components</p>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-border/50 flex flex-col gap-4">
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Yearly Liability</p>
                                                    <p className="text-xl font-black text-primary font-mono">{formatCurrency(totalAmount, fs.currency as any)}</p>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    {fs.status !== 'Active' && (
                                                        <button onClick={() => handlePublish(fs.id)} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="Publish Structure">
                                                            <CheckCircleIcon className="w-5 h-5"/>
                                                        </button>
                                                    )}
                                                    <button className="p-2 bg-muted hover:bg-border text-foreground rounded-lg transition-all" title="Edit Structure">
                                                        <EditIcon className="w-5 h-5"/>
                                                    </button>
                                                    <button onClick={() => handleDelete(fs.id)} className="p-2 bg-muted hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-lg transition-all" title="Delete Draft">
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeView === 'accounts' && (
                <div className="p-20 text-center bg-card border border-border rounded-[2rem] text-muted-foreground italic">
                    <UsersIcon className="w-12 h-12 mx-auto opacity-20 mb-4" />
                    Student ledger management is active. Please select a student from the main directory to view their financial account.
                </div>
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
