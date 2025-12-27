
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
 * Enterprise Typography & Spacing System
 * Hero Title: clamp(34px, 3.2vw, 42px) -> text-[clamp(34px,3.2vw,42px)]
 * space-xl: 36px
 * space-lg: 24px
 * space-md: 16px
 */

const resolveSyncError = (err: any): string => {
    if (!err) return "Identity synchronization protocol failed.";
    if (typeof err === 'string') return err;
    const message = err.message || err.error_description || err.details || err.hint;
    if (typeof message === 'string' && message.trim() !== "" && message !== "[object Object]") return message;
    return "Institutional node synchronization failure.";
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
            <div className="flex flex-col items-center justify-center py-40">
                <Spinner size="lg" className="text-primary" />
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/20 mt-6 animate-pulse">Synchronizing Identity Stream</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto animate-in fade-in duration-1000 pb-20">
            {/* --- HERO SECTION --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-9">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                         <span className="text-[11px] font-bold uppercase text-primary tracking-[0.2em] border-l-2 border-primary/40 pl-3">Institutional Roster</span>
                         <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                    </div>
                    <h2 className="text-[clamp(34px,3.2vw,42px)] font-serif font-bold text-white tracking-[-0.02em] leading-[1.1] uppercase">
                        MY <span className="text-white/40 font-normal italic">CHILDREN.</span>
                    </h2>
                    <p className="text-white/50 text-[14px] leading-relaxed font-serif italic mt-4 max-w-lg border-l border-white/10 pl-6">
                        Seamlessly manage enrollment nodes, monitor academic milestones, and verify digital credentials for your family.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button 
                        onClick={handleOpenCreate} 
                        className="flex-grow lg:flex-grow-0 h-[38px] px-[18px] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium text-[13px] rounded-[14px] shadow-lg shadow-primary/10 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <PlusIcon className="w-3.5 h-3.5" /> 
                        <span>Register New Child</span>
                    </button>
                    <button onClick={fetchData} className="h-[38px] w-[38px] flex items-center justify-center bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.08] rounded-[14px] border border-white/5 transition-all group">
                        <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in shake mb-6">
                    <AlertTriangleIcon className="w-4 h-4 text-red-500 mt-0.5" />
                    <p className="text-[13px] text-red-200/60 font-medium leading-tight">{error}</p>
                </div>
            )}

            {/* --- TOOLBAR: REFINED FILTERS --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.02] p-4 rounded-[18px] border border-white/5 mb-6 shadow-sm">
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`flex-1 md:flex-none h-[30px] px-4 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all duration-300 whitespace-nowrap ${activeFilter === f ? 'bg-primary text-white shadow-md' : 'text-white/20 hover:text-white/40'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                
                <div className="relative flex-grow w-full md:max-w-md group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-primary transition-colors duration-300" />
                    <input 
                        type="text" 
                        placeholder="Search roster..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-[36px] w-full pl-11 pr-4 bg-white/[0.04] border border-white/5 rounded-[14px] text-[13px] font-medium text-white focus:bg-white/[0.06] outline-none transition-all placeholder:text-white/10 focus:border-primary/20"
                    />
                </div>
            </div>

            {/* --- CHILDREN GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredApplications.map((app, idx) => (
                    <div key={app.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                        <ChildProfileCard 
                            child={app}
                            isExpanded={false}
                            onToggleExpand={() => {}}
                            onEdit={() => { setEditingChild(app); setIsModalOpen(true); }}
                            onManageDocuments={() => onManageDocuments(app.id)}
                            onNavigateDashboard={() => handleNavigateDashboard(app.id)}
                            index={idx + 1}
                        />
                    </div>
                ))}
                
                {/* Visual Matching "ADD" Card */}
                <button 
                    onClick={handleOpenCreate}
                    className="flex flex-col items-center justify-center p-12 rounded-[18px] border-2 border-dashed border-white/5 hover:border-primary/30 hover:bg-primary/[0.01] transition-all duration-500 group relative overflow-hidden h-full min-h-[210px] bg-white/[0.01] shadow-inner"
                >
                    <div className="w-12 h-12 rounded-[14px] bg-white/[0.03] flex items-center justify-center mb-4 transition-all duration-500 group-hover:bg-primary/10 group-hover:scale-105 border border-white/5">
                        <PlusIcon className="w-5 h-5 text-white/10 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-serif font-bold text-lg text-white/20 group-hover:text-white/50 transition-all uppercase tracking-tight">Provision Identity</span>
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
