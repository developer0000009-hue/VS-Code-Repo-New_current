
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { StorageService, BUCKETS } from '../../services/storage';
import Spinner from '../common/Spinner';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import PremiumAvatar from '../common/PremiumAvatar';

const formatError = (err: any): string => {
    if (!err) return "Protocol synchronization failed.";
    if (typeof err === 'string') return err;
    const message = err.message || err.error_description || err.details || err.hint;
    if (typeof message === 'string' && message.trim() !== "" && message !== "[object Object]") return message;
    return "Institutional node exception.";
};

interface DocumentFile {
    id: number;
    file_name: string;
    storage_path: string;
    uploaded_at: string;
}

interface RequirementWithDocs {
    id: number;
    admission_id: number;
    document_name: string;
    status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected' | 'Verified';
    is_mandatory: boolean;
    notes_for_parent: string;
    rejection_reason: string;
    applicant_name: string;
    profile_photo_url: string | null;
    admission_documents: DocumentFile[];
}

interface GroupedRequirementData {
    admissionId: number;
    applicantName: string;
    profilePhotoUrl: string | null;
    requirements: RequirementWithDocs[];
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = {
        'Accepted': { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircleIcon className="w-3 h-3"/>, label: 'Verified' },
        'Verified': { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircleIcon className="w-3 h-3"/>, label: 'Verified' },
        'Submitted': { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: <ClockIcon className="w-3 h-3"/>, label: 'In Review' },
        'Pending': { color: 'text-white/20 bg-white/5 border-white/10', icon: <div className="w-1 h-1 rounded-full bg-white/20" />, label: 'Required' },
        'Rejected': { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: <XCircleIcon className="w-3 h-3"/>, label: 'Correction' },
    };
    const style = config[status as keyof typeof config] || config['Pending'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.75rem] font-medium tracking-wide border backdrop-blur-md transition-all duration-300 ${style.color}`}>
            {style.icon} {style.label}
        </span>
    );
};

const DocumentSlot: React.FC<{ 
    req: RequirementWithDocs; 
    isExpanded: boolean;
    onToggle: (id: number) => void;
    onUpload: (file: File, reqId: number, admId: number, type: string) => Promise<void>;
}> = ({ req, isExpanded, onToggle, onUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Defensive: handle undefined admission_documents
    const docs = req.admission_documents || [];
    const latestDoc = docs.length > 0 
        ? [...docs].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0] 
        : null;

    const isLocked = req.status === 'Accepted' || req.status === 'Verified';
    const isRejected = req.status === 'Rejected';

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            await onUpload(file, req.id, req.admission_id, req.document_name);
        } catch (err: any) {
            alert("Upload Error: " + formatError(err));
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = ''; 
        }
    };

    const handleView = async () => {
        if (!latestDoc) return;
        setActionLoading(true);
        try {
            const url = await StorageService.resolveUrl(BUCKETS.DOCUMENTS, latestDoc.storage_path);
            if (url) window.open(url, '_blank');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className={`relative rounded-[1rem] border transition-all duration-160 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden bg-[#0d0f14] ${isExpanded ? 'border-primary/50 shadow-[0_12px_40px_rgba(0,0,0,0.6)] ring-1 ring-primary/20' : 'border-white/5 hover:border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.45)]'}`}>
            <div 
                onClick={() => onToggle(req.id)}
                className={`p-[1.25rem] flex items-center justify-between cursor-pointer group select-none transition-colors ${isExpanded ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${isLocked ? 'bg-emerald-500/10 text-emerald-400' : isExpanded ? 'bg-primary text-white' : 'bg-white/5 text-white/30 group-hover:text-white/60'}`}>
                        <DocumentTextIcon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                        <h4 className={`font-sans font-semibold text-[0.9375rem] tracking-tight leading-snug transition-colors ${isExpanded ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{req.document_name}</h4>
                        {!isExpanded && latestDoc && <p className="text-[0.75rem] text-white/30 font-mono truncate max-w-[120px]">{latestDoc.file_name}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {!isExpanded && <StatusBadge status={req.status} />}
                    <ChevronDownIcon className={`w-5 h-5 text-white/20 transition-transform duration-160 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'rotate-180 text-primary' : 'group-hover:text-white/40'}`} />
                </div>
            </div>
            <div className={`grid transition-all duration-160 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-[1.25rem] pt-0 space-y-[1rem] border-t border-white/5">
                        <div className="pt-[1.25rem] space-y-4">
                            {isRejected && (
                                <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-start gap-3">
                                    <XCircleIcon className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[0.75rem] font-bold uppercase text-orange-400 tracking-wider">Adjustment Protocol</p>
                                        <p className="text-[0.875rem] text-orange-200/60 font-medium italic mt-1 leading-relaxed">"{req.rejection_reason}"</p>
                                    </div>
                                </div>
                            )}
                            {latestDoc ? (
                                <div className="flex items-center justify-between p-3.5 bg-black/40 rounded-xl border border-white/5 group/file transition-all hover:bg-black/60">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 bg-white/5 rounded-lg text-white/20 group-hover/file:text-primary transition-colors"><UploadIcon className="w-4 h-4"/></div>
                                        <div className="min-w-0"><p className="text-[0.6875rem] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Active Ledger</p><p className="text-[0.8125rem] text-white/70 font-mono truncate">{latestDoc.file_name}</p></div>
                                    </div>
                                    <StatusBadge status={req.status} />
                                </div>
                            ) : (
                                <div className="p-3.5 bg-white/[0.01] border border-dashed border-white/10 rounded-xl text-[0.8125rem] text-white/30 leading-relaxed font-medium italic">Awaiting institutional synchronization. Please provide the required verification asset.</div>
                            )}
                            <div className="flex gap-2.5 pt-1">
                                {latestDoc ? (
                                    <>
                                        <button onClick={handleView} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[0.8125rem] font-bold bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5 transition-all duration-160 active:scale-95">{actionLoading ? <Spinner size="sm"/> : <><EyeIcon className="w-4 h-4" /> View Asset</>}</button>
                                        {!isLocked && <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white/30 hover:text-primary transition-all duration-160 border border-transparent hover:border-primary/20 active:scale-95" title="Re-synchronize File"><RefreshIcon className="w-4.5 h-4.5"/></button>}
                                    </>
                                ) : (
                                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full h-10 flex items-center justify-center gap-3 rounded-xl text-[0.8125rem] font-black text-white bg-primary hover:bg-primary/90 transition-all duration-160 uppercase tracking-[0.1em] shadow-lg shadow-primary/20 active:scale-95">{isUploading ? <Spinner size="sm" className="text-white"/> : <><UploadIcon className="w-4 h-4" /> Initialize Upload</>}</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
        </div>
    );
};

const DocumentsTab: React.FC<{ focusOnAdmissionId?: number | null; onClearFocus?: () => void }> = ({ focusOnAdmissionId, onClearFocus }) => {
    const [loading, setLoading] = useState(true);
    const [groupedRequirements, setGroupedRequirements] = useState<Record<number, GroupedRequirementData>>({});
    const [expandedChildIds, setExpandedChildIds] = useState<Set<number>>(new Set());
    const [expandedDocId, setExpandedDocId] = useState<number | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const { data: ads } = await supabase.rpc('get_my_children_profiles');
            if (ads && Array.isArray(ads) && ads.length > 0) {
                await Promise.all((ads as any[]).map(child => 
                    supabase.rpc('parent_initialize_vault_slots', { p_admission_id: child.id })
                ));
            }

            const { data: reqs, error } = await supabase.rpc('parent_get_document_requirements');
            if (error) throw error;

            const grouped: Record<number, GroupedRequirementData> = {};
            (reqs || []).forEach((req: any) => {
                if (!req.admission_id) return;
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

            if (focusOnAdmissionId) setExpandedChildIds(new Set([focusOnAdmissionId]));
            else if (Object.keys(grouped).length > 0 && expandedChildIds.size === 0) {
                setExpandedChildIds(new Set([Number(Object.keys(grouped)[0])]));
            }
        } catch (err) {
            console.error("Vault Synchronization Error:", err);
        } finally {
            setLoading(false);
        }
    }, [focusOnAdmissionId, expandedChildIds.size]);

    useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);

    const handleUpload = async (file: File, reqId: number, admId: number, type: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const path = StorageService.getDocumentPath(user.id, admId, type, file.name);
        const uploadResult = await StorageService.upload(BUCKETS.DOCUMENTS, path, file);
        const { error: dbError } = await supabase.rpc('parent_complete_document_upload', { p_requirement_id: reqId, p_admission_id: admId, p_file_name: file.name, p_storage_path: uploadResult.path, p_file_size: file.size, p_mime_type: file.type });
        if (dbError) throw dbError;
        setExpandedDocId(reqId);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleToggleDoc = (id: number) => setExpandedDocId(prev => prev === id ? null : id);

    if (loading && Object.keys(groupedRequirements).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Spinner size="lg" className="text-primary"/><p className="text-[0.75rem] font-black uppercase text-white/20 tracking-[0.4em] animate-pulse">Establishing Node Context</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-[1400px] mx-auto space-y-[2rem] animate-in fade-in duration-700 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div className="max-w-4xl"><div className="flex items-center gap-4 mb-4"><span className="text-[0.75rem] font-bold uppercase text-primary tracking-[0.2em] border-l-2 border-primary pl-4">Security Protocol 14.1</span></div><h2 className="text-[clamp(2rem,3vw,2.75rem)] font-serif font-black text-white tracking-tighter leading-none mb-4 uppercase">Verification <span className="text-white/30 italic">Vault.</span></h2><p className="text-white/40 text-[1.125rem] font-medium leading-relaxed font-serif italic border-l-2 border-white/10 pl-8 ml-1">High-fidelity institutional identity repository. Centralized management of mandatory enrollment assets required to activate active student nodes.</p></div>
                <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-[1.5rem] border border-white/5 shadow-2xl backdrop-blur-md ring-1 ring-white/5"><div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 shadow-inner border border-indigo-500/20"><ShieldCheckIcon className="w-6 h-6"/></div><div className="pr-4"><p className="text-[0.75rem] font-bold text-white/20 uppercase tracking-widest leading-none mb-1">Status</p><p className="text-[0.875rem] font-black text-white uppercase tracking-wider">Secure Context</p></div></div>
            </div>

            <div className="space-y-[1.5rem]">
                {Object.keys(groupedRequirements).length === 0 ? (
                    <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]"><DocumentTextIcon className="w-16 h-16 mx-auto mb-6 text-white/10" /><p className="text-[0.875rem] text-white/20 italic font-serif">No identity nodes currently in the verification pipeline.</p></div>
                ) : Object.keys(groupedRequirements).map(id => {
                    const admId = Number(id);
                    const group = groupedRequirements[admId];
                    if (!group) return null;
                    const isExpanded = expandedChildIds.has(admId);
                    const requirements = group.requirements || [];
                    const securedCount = requirements.filter(r => r.status === 'Accepted' || r.status === 'Verified').length;
                    const progress = requirements.length > 0 ? (securedCount / requirements.length) * 100 : 0;

                    return (
                        <div key={admId} className={`group bg-[#0d0f14] border transition-all duration-300 rounded-[1.5rem] overflow-hidden ${isExpanded ? 'border-white/10 shadow-2xl' : 'border-white/5'}`}>
                            <div className={`p-[1.5rem] md:p-[2rem] flex flex-col xl:flex-row justify-between items-center gap-8 cursor-pointer relative z-20 transition-colors ${isExpanded ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`} onClick={() => setExpandedChildIds(prev => { const n = new Set(prev); n.has(admId) ? n.delete(admId) : n.add(admId); return n; })}>
                                <div className="flex items-center gap-6 w-full xl:w-auto"><PremiumAvatar src={group.profilePhotoUrl} name={group.applicantName} size="md" className="border-2 border-white/5 shadow-lg" /><div><p className="text-[0.75rem] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">Subject Node</p><h3 className="font-sans font-bold text-[1.125rem] text-white tracking-tight leading-none uppercase group-hover:text-primary transition-colors duration-300">{group.applicantName}</h3></div></div>
                                <div className="flex items-center gap-8 w-full xl:w-auto justify-between md:justify-end"><div className="text-right hidden sm:block min-w-[220px]"><div className="flex justify-between items-end mb-2 px-1"><p className="text-[0.75rem] font-bold text-white/30 uppercase tracking-widest">Integrity Index</p><p className={`text-[0.8125rem] font-black transition-colors ${progress === 100 ? 'text-emerald-500' : 'text-white/60'}`}>{securedCount} / {requirements.length} SECURED</p></div><div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5"><div className={`h-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div></div></div><div className={`p-4 rounded-xl transition-all duration-300 ${isExpanded ? 'rotate-180 bg-white/10 text-white shadow-lg' : 'text-white/10 bg-white/5'}`}><ChevronDownIcon className="w-6 h-6" /></div></div>
                            </div>
                            {isExpanded && (
                                <div className="p-[1.5rem] md:p-[2rem] lg:p-[3rem] border-t border-white/5 bg-[#08090a]/40 animate-in slide-in-from-top-4 duration-300"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-[1.25rem]">{requirements.map(req => (<DocumentSlot key={req.id} req={req} isExpanded={expandedDocId === req.id} onToggle={handleToggleDoc} onUpload={handleUpload} />))}</div></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DocumentsTab;
