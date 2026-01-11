import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { AdmissionApplication } from '../../types';
import Spinner from '../common/Spinner';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { PlusIcon } from '../icons/PlusIcon';
import PremiumAvatar from '../common/PremiumAvatar';

// --- Internal Types ---

interface DocumentFile {
    id: number;
    file_name: string;
    storage_path: string;
    uploaded_at: string;
}

interface RequirementWithDocs {
    id: number;
    admission_id: string;
    document_name: string;
    status: 'Pending' | 'Submitted' | 'Verified' | 'Rejected';
    is_mandatory: boolean;
    notes_for_parent: string;
    rejection_reason: string;
    applicant_name: string;
    profile_photo_url: string | null;
    admission_documents: DocumentFile[];
}

interface GroupedRequirementData {
    admissionId: string;
    applicantName: string;
    profilePhotoUrl: string | null;
    requirements: RequirementWithDocs[];
}

// --- Sub-Components ---

const DocumentCard: React.FC<{ 
    req: RequirementWithDocs; 
    onUpload: (file: File, reqId: number, admId: string) => Promise<void>;
}> = ({ req, onUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const latestDoc = req.admission_documents?.[0];
    const isLocked = req.status === 'Verified';
    const isRejected = req.status === 'Rejected';
    const hasFile = !!latestDoc || req.status === 'Submitted';

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        try {
            await onUpload(e.target.files[0], req.id, req.admission_id);
        } catch (err: any) {
            console.error("Sync Failure", err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={`relative rounded-[2.5rem] border transition-all duration-500 group overflow-hidden bg-[#0d0f14] shadow-inner flex flex-col min-h-[320px] ${isLocked ? 'border-emerald-500/20' : isRejected ? 'border-rose-500/20' : 'border-white/5 hover:border-primary/20'}`}>
            <div className="p-8 flex flex-col h-full z-10">
                <div className="flex justify-between items-start mb-10">
                    <div className={`p-4 rounded-[1.2rem] shadow-inner transition-all duration-500 ${isLocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20 group-hover:text-primary group-hover:bg-primary/10 border border-white/5'}`}>
                        <DocumentTextIcon className="w-6 h-6" />
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border backdrop-blur-md transition-colors duration-500 ${isLocked ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : isRejected ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' : hasFile ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' : 'text-white/20 border-white/5 bg-white/5'}`}>
                        {req.status}
                    </span>
                </div>

                <div className="flex-grow">
                    <h4 className="font-serif font-black text-white text-lg mb-2 group-hover:text-primary transition-colors uppercase tracking-tight leading-tight">{req.document_name}</h4>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.25em]">{req.is_mandatory ? 'Mandatory Artifact' : 'Supplemental'}</p>
                    
                    {isRejected && (
                        <div className="mt-5 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl animate-in slide-in-from-top-2">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5">Action Required</p>
                            <p className="text-[12px] text-rose-200/50 italic leading-relaxed">"{req.rejection_reason}"</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                    {hasFile && !isRejected ? (
                        <button 
                            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl text-[10px] font-black bg-white/[0.03] border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all uppercase tracking-[0.3em]"
                        >
                            <EyeIcon className="w-5 h-5 opacity-40" /> View Artifact
                        </button>
                    ) : (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full h-14 flex items-center justify-center gap-4 rounded-2xl text-[10px] font-black text-white bg-primary hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 active:scale-95 uppercase tracking-[0.35em] group/btn"
                        >
                            {isUploading ? <Spinner size="sm" className="text-white"/> : <><UploadIcon className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" /> Upload</>}
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                </div>
            </div>
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
    );
};

// --- Main Container ---

const DocumentsTab: React.FC<{ focusOnAdmissionId?: string | null; onClearFocus?: () => void }> = ({ focusOnAdmissionId }) => {
    const [loading, setLoading] = useState(true);
    const [groupedRequirements, setGroupedRequirements] = useState<Record<string, GroupedRequirementData>>({});
    const [expandedChildIds, setExpandedChildIds] = useState<Set<string>>(new Set());
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const { data: ads, error: adsErr } = await supabase.rpc('get_my_children_profiles');
            if (adsErr) throw adsErr;

            if (ads?.length) {
                await Promise.all(ads.map((child: any) => 
                    supabase.rpc('parent_initialize_vault_slots', { p_admission_id: child.id })
                ));
            }

            const { data: reqs, error: rpcError } = await supabase.rpc('parent_get_document_requirements');
            if (rpcError) throw rpcError;

            const grouped: Record<string, GroupedRequirementData> = {};
            (reqs || []).forEach((req: RequirementWithDocs) => {
                if (!grouped[req.admission_id]) {
                    grouped[req.admission_id] = {
                        admissionId: req.admission_id,
                        applicantName: req.applicant_name,
                        profilePhotoUrl: req.profile_photo_url,
                        requirements: []
                    };
                }
                grouped[req.admission_id].requirements.push(req);
            });

            setGroupedRequirements(grouped);

            // Handle auto-expansion logic carefully
            if (isFirstLoad && !isSilent) {
                if (focusOnAdmissionId) {
                    setExpandedChildIds(new Set([focusOnAdmissionId]));
                } else if (Object.keys(grouped).length > 0) {
                    // Only auto-expand the first one if we haven't manually closed everything
                    setExpandedChildIds(new Set([Object.keys(grouped)[0]]));
                }
                setIsFirstLoad(false);
            }

        } catch (err) {
            console.error("Registry Sync Fail", err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [focusOnAdmissionId, isFirstLoad]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpload = async (file: File, reqId: number, admId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const filePath = `parent/${user.id}/adm-${admId}/req-${reqId}_${Date.now()}`;
        const { error: upErr } = await supabase.storage.from('guardian-documents').upload(filePath, file);
        if (upErr) throw upErr;

        // Optimistic UI Update: Patch the local state before the DB confirms for instant feedback
        setGroupedRequirements(prev => {
            const next = { ...prev };
            const group = next[admId];
            if (group) {
                const reqIndex = group.requirements.findIndex(r => r.id === reqId);
                if (reqIndex !== -1) {
                    group.requirements[reqIndex] = {
                        ...group.requirements[reqIndex],
                        status: 'Submitted'
                    };
                }
            }
            return next;
        });

        const { error: dbErr } = await supabase.rpc('parent_complete_document_upload', {
            p_requirement_id: reqId,
            p_admission_id: admId,
            p_file_name: file.name,
            p_storage_path: filePath,
            p_file_size: file.size,
            p_mime_type: file.type
        });
        
        if (dbErr) throw dbErr;
        
        // Final Sync: Fetch the latest state silently in background
        fetchData(true);
    };

    const toggleChild = (id: string, e: React.MouseEvent) => {
        // Prevent click bubbling issues
        e.stopPropagation();
        setExpandedChildIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (loading && Object.keys(groupedRequirements).length === 0) return (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Spinner size="lg" className="text-primary"/>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Syncing Lifecycle Ledger</p>
        </div>
    );

    const childIds = Object.keys(groupedRequirements);

    return (
        <div className="max-w-[1400px] mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
            
            {/* --- MASTER HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 px-4">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-primary/10 rounded-[1.2rem] text-primary border border-primary/20 shadow-inner">
                            <ShieldCheckIcon className="w-7 h-7"/>
                        </div>
                        <span className="text-[11px] font-black uppercase text-primary tracking-[0.5em] border-l border-primary/20 pl-4">Institutional Resilience</span>
                    </div>
                    <h2 className="text-[clamp(36px,4vw,56px)] font-serif font-black text-white tracking-tighter leading-[0.9] mb-8 uppercase">
                        Verification <span className="text-white/20 italic">Vault.</span>
                    </h2>
                    <p className="text-white/40 text-[18px] leading-relaxed font-serif italic border-l border-white/10 pl-10 ml-2">
                        Central repository for mandatory enrollment assets. Submit verified identity artifacts to finalize node synchronization and academic activation.
                    </p>
                </div>
                
                <div className="flex items-center gap-6 bg-[#0c0d12] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl ring-1 ring-white/5">
                     <div className="text-right">
                         <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] mb-1">Authenticated Nodes</p>
                         <p className="text-3xl font-black text-white">{childIds.length}</p>
                     </div>
                </div>
            </div>

            {/* --- REGISTRY NODES --- */}
            <div className="space-y-10">
                {childIds.map(admId => {
                    const group = groupedRequirements[admId];
                    const isExpanded = expandedChildIds.has(admId);
                    const verifiedCount = group.requirements.filter(r => r.status === 'Verified').length;
                    const totalCount = group.requirements.length;
                    const completion = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
                    const isFullySealed = completion === 100;

                    return (
                        <div 
                            key={admId} 
                            className={`group relative bg-[#090a0f] border transition-all duration-700 rounded-[3.5rem] overflow-hidden shadow-2xl ${isExpanded ? 'border-primary/20 ring-1 ring-white/5' : 'border-white/5 hover:border-white/10'}`}
                        >
                            <div 
                                className={`p-10 md:p-12 flex flex-col lg:flex-row justify-between items-center gap-10 cursor-pointer transition-all duration-500 ${isExpanded ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
                                onClick={(e) => toggleChild(admId, e)}
                            >
                                <div className="flex items-center gap-10 w-full lg:w-auto">
                                    <div className="relative group/avatar">
                                        <div className={`absolute -inset-2 rounded-[2.5rem] blur-2xl opacity-20 transition-all duration-1000 ${isFullySealed ? 'bg-emerald-500' : 'bg-primary'} group-hover/avatar:opacity-40`}></div>
                                        <PremiumAvatar src={group.profilePhotoUrl} name={group.applicantName} size="md" className={`shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] border-4 transition-all duration-1000 ${isFullySealed ? 'border-emerald-500 shadow-emerald-500/20' : 'border-white/10'}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-serif font-black text-4xl md:text-5xl text-white tracking-tighter truncate leading-none mb-4 group-hover:text-primary transition-colors duration-500 uppercase">{group.applicantName}</h3>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Operational</span>
                                            </div>
                                            <span className="text-[11px] font-mono font-bold text-white/10 uppercase tracking-[0.25em] bg-white/5 px-3 py-1 rounded-lg">HUB_ADM_{admId.substring(0, 8).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-12 w-full lg:w-auto">
                                    <div className="flex-grow lg:w-72 w-full">
                                        <div className="flex justify-between items-end mb-4 px-1">
                                            <span className="text-[11px] font-black uppercase text-white/20 tracking-[0.4em] font-serif">Integrity Index</span>
                                            <span className={`text-[14px] font-black tracking-widest ${isFullySealed ? 'text-emerald-400' : 'text-primary'}`}>{completion}% <span className="text-[9px] opacity-40 uppercase ml-1">Sealed</span></span>
                                        </div>
                                        <div className="h-2.5 w-full bg-black rounded-full overflow-hidden p-[2px] border border-white/5 shadow-inner ring-1 ring-white/5">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden ${isFullySealed ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]'}`} 
                                                style={{ width: `${completion}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div 
                                        className={`p-5 rounded-3xl transition-all duration-700 ${isExpanded ? 'rotate-180 bg-primary text-white shadow-2xl scale-110' : 'text-white/20 bg-white/[0.03] border border-white/5'}`}
                                    >
                                        <ChevronDownIcon className="w-8 h-8" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* --- EXPANDED GRID --- */}
                            <div 
                                className={`grid transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                            >
                                <div className="overflow-hidden">
                                    <div className="p-10 md:p-20 border-t border-white/5 bg-black/40">
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
                                            {group.requirements.map(req => (
                                                <DocumentCard 
                                                    key={req.id} 
                                                    req={req} 
                                                    onUpload={handleUpload} 
                                                />
                                            ))}
                                            
                                            <button 
                                                className="rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-primary/40 hover:bg-primary/[0.01] transition-all duration-700 flex flex-col items-center justify-center p-12 bg-white/[0.01] group/plus cursor-pointer min-h-[320px] shadow-inner"
                                            >
                                                <div className="w-20 h-20 rounded-[2rem] bg-white/[0.02] flex items-center justify-center mb-8 transition-all duration-700 group-hover/plus:scale-110 group-hover/plus:bg-primary/10 border border-white/5 shadow-2xl">
                                                    <PlusIcon className="w-8 h-8 text-white/10 group-hover/plus:text-primary transition-colors" />
                                                </div>
                                                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-white/10 group-hover/plus:text-white/30 transition-colors text-center">Supplemental <br/> Artifact Sync</p>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {childIds.length === 0 && !loading && (
                <div className="p-32 text-center border-2 border-dashed border-white/5 rounded-[5rem] bg-black/20 animate-in zoom-in-95 duration-1000 shadow-2xl">
                    <div className="w-40 h-40 bg-white/[0.01] rounded-[4rem] flex items-center justify-center mx-auto mb-12 border border-white/5 shadow-inner ring-1 ring-white/5 group">
                        <DocumentTextIcon className="w-20 h-20 text-white/5 group-hover:text-primary/20 transition-colors duration-1000" />
                    </div>
                    <h3 className="text-4xl font-serif font-black text-white uppercase tracking-tighter mb-6">Vault Dormant.</h3>
                    <p className="text-white/30 max-w-md mx-auto font-serif italic text-xl leading-relaxed">No active institutional identities identified in the familial ledger. Initialize a node in the children directory to activate the secure vault.</p>
                </div>
            )}
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--primary), 0.5); }
            `}</style>
        </div>
    );
};

export default DocumentsTab;