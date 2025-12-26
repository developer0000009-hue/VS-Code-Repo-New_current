
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { AdmissionApplication, UserProfile } from '../../types';
import Spinner from '../common/Spinner';
import ChildProfileCard from './ChildProfileCard';
import ChildRegistrationModal from './ChildRegistrationModal';
import { PlusIcon } from '../icons/PlusIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

/**
 * Universal Error Resolver for Dashboard Telemetry.
 */
const resolveSyncError = (err: any): string => {
    if (!err) return "Identity synchronization protocol failed.";
    if (typeof err === 'string') return err;
    const message = err.message || err.error_description || err.details || err.hint;
    if (typeof message === 'string' && message.trim() !== "" && message !== "[object Object]") return message;
    if (err.error && typeof err.error === 'string') return err.error;
    try {
        const fallback = JSON.stringify(err);
        return fallback === '{}' ? "Institutional node reported an empty exception." : fallback;
    } catch {
        return "An unhandled institutional exception occurred.";
    }
};

type FilterType = 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED';

const MyChildrenTab: React.FC<{ onManageDocuments: (id: number) => void; profile: UserProfile }> = ({ onManageDocuments, profile }) => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<AdmissionApplication | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    
    const fetchData = useCallback(async () => {
        if (!profile?.id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_my_children_profiles');
            if (rpcError) throw rpcError;
            setApplications((data || []) as AdmissionApplication[]);
        } catch (err: any) {
            setError(resolveSyncError(err));
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);

    useEffect(() => { fetchData(); }, [fetchData]); 

    const handleOpenCreate = () => {
        setEditingChild(null);
        setIsModalOpen(true);
    };

    const handleNavigateDashboard = async (admissionId: number) => {
        const { error } = await supabase.rpc('parent_switch_student_view', { p_new_admission_id: admissionId });
        if (!error) navigate('/student');
    };

    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = (app.applicant_name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const status = (app.status || '').toUpperCase();
            
            if (activeFilter === 'APPROVED') return matchesSearch && (status === 'APPROVED' || status === 'VERIFIED');
            if (activeFilter === 'REJECTED') return matchesSearch && status === 'REJECTED';
            if (activeFilter === 'PENDING') {
                return matchesSearch && (status !== 'APPROVED' && status !== 'VERIFIED' && status !== 'REJECTED');
            }
            return matchesSearch;
        });
    }, [applications, activeFilter, searchTerm]);

    if (loading && applications.length === 0 && !error) {
        return (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
                <Spinner size="lg" className="text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Establishing Identity Stream</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-1000 pb-20">
            {/* --- HERO SECTION --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary">Institutional Roster</span>
                         <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Node: Active
                         </div>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-serif font-black text-white tracking-tighter leading-none uppercase">
                        My <span className="text-white/20 italic">Children.</span>
                    </h2>
                    <p className="text-white/40 text-lg md:text-2xl font-medium leading-relaxed font-serif italic max-w-2xl border-l-2 border-primary/20 pl-8 ml-2">
                        Unified tracking for your family's academic journey. Manage enrollment, monitor progress, and access secure digital hubs.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <button 
                        onClick={handleOpenCreate} 
                        className="flex-grow lg:flex-grow-0 h-[72px] px-12 bg-primary text-white font-black text-[12px] uppercase tracking-[0.3em] rounded-2xl shadow-[0_24px_48px_-12px_rgba(var(--primary),0.5)] hover:bg-primary/90 transition-all flex items-center justify-center gap-4 active:scale-95 group relative overflow-hidden"
                    >
                        <PlusIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" /> 
                        <span>Register New Child</span>
                    </button>
                    <button onClick={fetchData} className="h-[72px] w-[72px] flex items-center justify-center bg-white/[0.03] text-white/30 hover:text-white hover:bg-white/5 rounded-2xl border border-white/5 transition-all shadow-xl group">
                        <RefreshIcon className={`w-7 h-7 transition-transform duration-700 group-hover:rotate-180 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] flex items-start gap-4 animate-in shake shadow-2xl backdrop-blur-md">
                    <AlertTriangleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-black uppercase text-red-500 tracking-widest">Registry Disruption</p>
                        <p className="text-sm text-red-200/60 font-medium mt-1 leading-relaxed">{error}</p>
                    </div>
                </div>
            )}

            {/* --- TOOLBAR: PREMIUM FILTERS & SEARCH --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#0f1115]/60 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-white/5 shadow-3xl ring-1 ring-white/5">
                <div className="flex bg-black/40 p-1.5 rounded-[2rem] border border-white/5 shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
                    {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`flex-1 md:flex-none px-10 py-4 rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-500 whitespace-nowrap relative ${activeFilter === f ? 'bg-[#1a1d24] text-primary shadow-2xl ring-1 ring-white/10 scale-[1.03] z-10' : 'text-white/30 hover:text-white'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                
                <div className="relative flex-grow w-full md:max-w-md group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-primary transition-colors duration-500" />
                    <input 
                        type="text" 
                        placeholder="SEARCH IDENTITY ROSTER..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-black/40 border border-white/5 rounded-[2rem] text-[12px] font-black tracking-[0.25em] text-white focus:bg-black/60 outline-none transition-all shadow-inner placeholder:text-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5"
                    />
                </div>
            </div>

            {/* --- CHILDREN GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {filteredApplications.map((app) => (
                    <ChildProfileCard 
                        key={app.id} 
                        child={app}
                        isExpanded={false}
                        onToggleExpand={() => {}}
                        onEdit={() => { setEditingChild(app); setIsModalOpen(true); }}
                        onManageDocuments={() => onManageDocuments(app.id)}
                        onNavigateDashboard={() => handleNavigateDashboard(app.id)}
                    />
                ))}
                
                {/* Empty State / Add Card */}
                <button 
                    onClick={handleOpenCreate}
                    className="flex flex-col items-center justify-center p-12 sm:p-20 rounded-[4rem] border-2 border-dashed border-white/5 hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-700 group relative overflow-hidden h-full min-h-[420px]"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.03),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="w-28 h-28 rounded-[2.5rem] bg-white/5 flex items-center justify-center mb-8 transition-all duration-700 group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-6 border border-white/10 shadow-2xl group-hover:shadow-primary/10">
                        <PlusIcon className="w-12 h-12 text-white/20 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-serif font-black text-3xl text-white/20 group-hover:text-white transition-all tracking-tight uppercase">Expand Roster</span>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/10 group-hover:text-primary/60 mt-4 transition-colors">Start Enrollment Protocol</p>
                </button>
            </div>

            {isModalOpen && (
                <ChildRegistrationModal 
                    child={editingChild}
                    onClose={() => { setIsModalOpen(false); setEditingChild(null); }}
                    onSave={fetchData}
                    currentUserId={profile.id}
                />
            )}
        </div>
    );
};

export default MyChildrenTab;
