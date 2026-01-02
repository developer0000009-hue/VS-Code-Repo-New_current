
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { Enquiry, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import EnquiryDetailsModal from './EnquiryDetailsModal';
import { SearchIcon } from './icons/SearchIcon';
import { KeyIcon } from './icons/KeyIcon';
import { MailIcon } from './icons/MailIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { FilterIcon } from './icons/FilterIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
// Fix: Added missing import for ChevronRightIcon
import { ChevronRightIcon } from './icons/ChevronRightIcon';

const statusColors: Record<string, string> = {
  'New': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Contacted': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'In Review': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Inquiry Active': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-black shadow-[0_0_15px_rgba(99,102,241,0.1)]',
  'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

type SortableKeys = 'applicant_name' | 'grade' | 'status' | 'received_at';

interface EnquiryTabProps {
    branchId?: number | null;
    onNavigate?: (component: string) => void;
}

const KPICard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-card/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-sm flex items-center gap-5 transition-all hover:border-primary/30 group">
        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${color} text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{title}</p>
            <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
        </div>
    </div>
);

const EnquiryTab: React.FC<EnquiryTabProps> = ({ branchId, onNavigate }) => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' }>({ key: 'received_at', direction: 'descending' });

    const fetchEnquiries = useCallback(async (isSilent = false) => {
        if (!branchId) {
            setLoading(false);
            return;
        }
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            // Concurrent sync: Web Leads + Integrated Registry
            const [webRes, integratedRes] = await Promise.all([
                supabase.rpc('get_all_enquiries', { p_branch_id: branchId }),
                supabase.from('admissions').select('*').eq('branch_id', branchId).eq('status', 'Inquiry Active')
            ]);

            if (webRes.error) throw webRes.error;
            if (integratedRes.error) throw integratedRes.error;

            const unifiedList = [
                ...(webRes.data || []),
                ...(integratedRes.data || []).map((e: any) => ({
                    id: e.id,
                    applicant_name: e.applicant_name,
                    parent_name: e.parent_name,
                    parent_email: e.parent_email,
                    parent_phone: e.parent_phone,
                    grade: e.grade,
                    status: 'Inquiry Active' as EnquiryStatus,
                    received_at: e.updated_at || e.submitted_at || e.registered_at,
                    admission_id: e.id
                }))
            ];

            setEnquiries(unifiedList);
        } catch (err: any) {
            setError(`Protocol Sync Failure: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchEnquiries();
    }, [fetchEnquiries]);
    
    const processedEnquiries = useMemo(() => {
        let data = enquiries.filter(enq => {
            const matchesStatus = !filterStatus || enq.status === filterStatus;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                enq.applicant_name.toLowerCase().includes(searchLower) ||
                (enq.parent_name || '').toLowerCase().includes(searchLower);
            return matchesStatus && matchesSearch;
        });

        data.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            const factor = sortConfig.direction === 'ascending' ? 1 : -1;
            if (aVal < bVal) return -1 * factor;
            if (aVal > bVal) return 1 * factor;
            return 0;
        });
        
        return data;
    }, [enquiries, searchTerm, filterStatus, sortConfig]);

    const stats = useMemo(() => ({
        total: enquiries.length,
        new: enquiries.filter(e => e.status === 'New').length,
        active: enquiries.filter(e => e.status === 'Inquiry Active').length,
        completed: enquiries.filter(e => e.status === 'Completed').length
    }), [enquiries]);

    const handleSort = (key: SortableKeys) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                         <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em] border-l-2 border-primary/40 pl-4">Lead Intelligence</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tighter uppercase leading-none">Inquiry <span className="text-white/20 italic lowercase">desk.</span></h2>
                    <p className="text-white/40 text-lg mt-4 font-serif italic max-w-2xl border-l border-white/5 pl-8">Consolidated workstation for student interest nodes and initial communication handshakes.</p>
                </div>
                <button onClick={() => fetchEnquiries()} className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/10 text-white/30 hover:text-white transition-all border border-white/5 group active:scale-95 shadow-2xl">
                    <RefreshIcon className={`w-6 h-6 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`}/>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Payload" value={stats.total} icon={<MailIcon className="w-7 h-7"/>} color="bg-blue-600" />
                <KPICard title="Unread Handshakes" value={stats.new} icon={<MegaphoneIcon className="w-7 h-7"/>} color="bg-purple-600" />
                <KPICard title="Integrated Leads" value={stats.active} icon={<ShieldCheckIcon className="w-7 h-7"/>} color="bg-indigo-600" />
                <KPICard title="Conversion Rate" value={stats.completed} icon={<CheckCircleIcon className="w-7 h-7"/>} color="bg-emerald-600" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-[#0d0f14]/60 p-5 rounded-[2.5rem] border border-white/5 shadow-inner backdrop-blur-xl">
                <div className="relative w-full md:max-w-md group">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search node name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-sm font-medium text-white focus:border-primary/40 outline-none transition-all placeholder:text-white/5"
                    />
                </div>
                
                <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar w-full md:w-auto">
                    {['All', 'Inquiry Active', 'New', 'Completed'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilterStatus(f === 'All' ? '' : f)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                                (filterStatus === f || (f === 'All' && !filterStatus)) 
                                ? 'bg-[#1a1d24] text-primary shadow-2xl ring-1 ring-white/10' 
                                : 'text-white/20 hover:text-white/40'
                            }`}
                        >
                            {f === 'Inquiry Active' ? 'Integrated' : f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-card border border-white/10 rounded-[3rem] shadow-[0_48px_96px_-24px_rgba(0,0,0,1)] overflow-hidden flex flex-col min-h-[500px] ring-1 ring-white/5">
                {loading && enquiries.length === 0 ? (
                    <div className="flex flex-col justify-center items-center py-40 gap-6">
                        <Spinner size="lg" className="text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Syncing Desk Telemetry</p>
                    </div>
                ) : processedEnquiries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-12">
                        <div className="w-24 h-24 bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/5 shadow-inner">
                            <KeyIcon className="h-12 w-12 text-white/10" />
                        </div>
                        <h3 className="text-2xl font-serif font-black text-white tracking-tight uppercase">Registry Idle.</h3>
                        <p className="text-white/30 max-w-sm mx-auto mt-4 font-serif italic text-lg leading-relaxed">
                            No active handshakes matching your search. Provision an <strong className="text-primary">Enquiry Code</strong> in Quick Verification to pull new nodes into this desk.
                        </p>
                        <button onClick={() => onNavigate?.('Code Verification')} className="mt-10 px-10 py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-primary/90 transition-all transform active:scale-95">Go to Handshake Terminal</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#0f1115]/80 border-b border-white/5 text-[10px] font-black uppercase text-white/20 tracking-[0.3em] sticky top-0 z-20 backdrop-blur-xl">
                                <tr>
                                    <th className="p-8 pl-10 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('applicant_name')}>Subject Identity</th>
                                    <th className="p-8">Grade Node</th>
                                    <th className="p-8">Handshake Status</th>
                                    <th className="p-8 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('received_at')}>Last Activity</th>
                                    <th className="p-8 text-right pr-10">Protocols</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {processedEnquiries.map((enq) => (
                                    <tr key={enq.id} onClick={() => setViewingEnquiry(enq)} className="group hover:bg-white/[0.02] transition-all duration-300 cursor-pointer relative overflow-hidden">
                                        <td className="p-8 pl-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-indigo-500/10 to-purple-600/10 flex items-center justify-center text-indigo-400 font-serif font-black text-xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                                    {(enq.applicant_name || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-lg font-serif font-black text-white group-hover:text-primary transition-colors uppercase tracking-tight">{enq.applicant_name}</div>
                                                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">{enq.parent_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase bg-white/5 text-white/40 border border-white/5 tracking-[0.1em]">
                                                Grade {enq.grade}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-2 inline-flex text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border shadow-inner transition-all duration-700 ${statusColors[enq.status] || 'bg-white/5 text-white/20 border-white/5'}`}>
                                                {enq.status}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-white/30 uppercase tracking-widest">
                                                <ClockIcon className="w-4 h-4 opacity-40" />
                                                {new Date(enq.received_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="p-8 text-right pr-10">
                                            <button className="p-4 rounded-2xl bg-white/5 text-white/10 group-hover:text-primary group-hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all shadow-xl active:scale-90">
                                                <ChevronRightIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewingEnquiry && (
                <EnquiryDetailsModal 
                    enquiry={viewingEnquiry} 
                    currentBranchId={branchId}
                    onClose={() => setViewingEnquiry(null)} 
                    onUpdate={() => {
                        fetchEnquiries(true);
                    }} 
                />
            )}
        </div>
    );
};

export default EnquiryTab;
