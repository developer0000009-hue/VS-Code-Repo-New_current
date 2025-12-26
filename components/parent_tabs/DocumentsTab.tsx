
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
import { DownloadIcon } from '../icons/DownloadIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { PlusIcon } from '../icons/PlusIcon';
import PremiumAvatar from '../common/PremiumAvatar';

// --- Types ---

interface DocumentFile {
    id: number;
    file_name: string;
    storage_path: string;
    uploaded_at: string;
    file_size?: number;
    mime_type?: string;
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

interface DocumentsTabProps {
    focusOnAdmissionId?: number | null;
    onClearFocus?: () => void;
}

// --- Utils ---

const resolveError = (err: any): string => {
    if (!err) return "Synchronization failed.";
    const msg = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
    console.error("Vault Error [Technical]:", msg);
    
    if (msg.toLowerCase().includes('is_mandatory') || msg.toLowerCase().includes('column')) {
        return "System schema updated. Please refresh your portal.";
    }
    return "Handshake interrupted. Please verify your institutional connection.";
};

// --- Sub-Components ---

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = {
        'Accepted': { 
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5', 
            icon: <CheckCircleIcon className="w-3.5 h-3.5"/>, 
            label: 'Verified' 
        },
        'Verified': { 
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5', 
            icon: <CheckCircleIcon className="w-3.5 h-3.5"/>, 
            label: 'Verified' 
        },
        'Submitted': { 
            color: 'text-blue-400 bg-blue-500/10 border-blue-200/20', 
            icon: <ClockIcon className="w-3.5 h-3.5"/>, 
            label: 'In Review' 
        },
        'Pending': { 
            color: 'text-white/20 bg-white/5 border-white/10', 
            icon: <div className="w-1.5 h-1.5 rounded-full bg-white/20" />, 
            label: 'Required' 
        },
        'Rejected': { 
            color: 'text-red-400 bg-red-500/10 border-red-500/20 shadow-lg shadow-red-500/5', 
            icon: <XCircleIcon className="w-3.5 h-3.5"/>, 
            label: 'Correction' 
        },
    };
    const style = config[status as keyof typeof config] || config['Pending'];

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md transition-all duration-300 ${style.color}`}>
            {style.icon}
            {style.label}
        </span>
    );
};

const DocumentSlot: React.FC<{ 
    req: RequirementWithDocs; 
    onUpload: (file: File, reqId: number, admId: number) => Promise<void>;
}> = ({ req, onUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const latestDoc = req.admission_documents && req.admission_documents.length > 0 
        ? [...req.admission_documents].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0] 
        : null;

    const isLocked = req.status === 'Accepted' || req.status === 'Verified';
    const isRejected = req.status === 'Rejected';
    const hasFile = !!latestDoc;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        
        if (file.size > 10 * 1024 * 1024) {
            alert("File magnitude exceeds 10MB limit.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);
        
        // Progress simulation during binary stream
        const progInterval = setInterval(() => {
            setUploadProgress(prev => (prev < 90 ? prev + Math.floor(Math.random() * 5) + 1 : prev));
        }, 150);

        try {
            await onUpload(file, req.id, req.admission_id);
            clearInterval(progInterval);
            setUploadProgress(100);
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 800);
        } catch (err: any) {
            clearInterval(progInterval);
            setIsUploading(false);
            alert("Upload failed: " + err.message);
        } finally {
            if (e.target) e.target.value = ''; 
        }
    };

    const handleView = async (download = false) => {
        if (!latestDoc) return;
        setActionLoading(true);
        try {
            const { data, error } = await supabase.storage
                .from('guardian-documents')
                .createSignedUrl(latestDoc.storage_path, 3600);
            
            if (error) throw error;
            if (data) {
                if (download) {
                    const link = document.createElement('a');
                    link.href = data.signedUrl;
                    link.download = latestDoc.file_name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    window.open(data.signedUrl, '_blank');
                }
            }
        } catch (err: any) {
            alert("Handshake failure: " + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className={`relative rounded-[2.5rem] border transition-all duration-500 group overflow-hidden bg-[#12141a] flex flex-col h-full ${isLocked ? 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_40px_-15px_rgba(16,185,129,0.1)]' : 'border-white/5 hover:border-white/10 shadow-2xl hover:shadow-primary/5'}`}>
            
            {/* Real-time Sync Overlay */}
            {isUploading && (
                <div className="absolute inset-0 bg-[#0a0a0c]/90 backdrop-blur-xl z-40 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
                    <div className="relative w-24 h-24 mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-white/5" />
                            <circle 
                                cx="48" cy="48" r="42" 
                                stroke="currentColor" 
                                strokeWidth="5" 
                                fill="transparent" 
                                strokeDasharray="263.89" 
                                strokeDashoffset={263.89 - (263.89 * uploadProgress) / 100} 
                                className="text-primary transition-all duration-500 ease-out" 
                                strokeLinecap="round" 
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-black text-white font-mono">{uploadProgress}%</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] animate-pulse">Syncing Asset</p>
                </div>
            )}

            <div className="p-8 flex flex-col h-full relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl shadow-inner transition-all duration-500 ${isLocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20 group-hover:text-primary group-hover:bg-primary/10 border border-white/5'}`}>
                        <DocumentTextIcon className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {req.is_mandatory && !hasFile && (
                            <span className="text-[8px] font-black uppercase text-red-500 tracking-[0.2em] bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 shadow-sm animate-pulse">Mandatory Asset</span>
                        )}
                        <StatusBadge status={req.status} />
                    </div>
                </div>

                <div className="flex-grow">
                    <h4 className="font-serif font-black text-white text-xl mb-2 tracking-tight group-hover:text-primary transition-colors uppercase leading-tight">{req.document_name}</h4>
                    
                    {isRejected && req.rejection_reason && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 animate-in slide-in-from-top-2">
                             <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <AlertTriangleIcon className="w-3 h-3"/> Correction Required
                             </p>
                             <p className="text-xs text-red-200/60 font-medium italic leading-relaxed">"{req.rejection_reason}"</p>
                        </div>
                    )}

                    {hasFile && !isUploading && (
                        <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 animate-in fade-in zoom-in-95">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Payload Synchronized</p>
                            <p className="text-sm font-medium text-white/80 truncate">{latestDoc.file_name}</p>
                            <p className="text-[10px] text-white/40 mt-1 font-mono">{new Date(latestDoc.uploaded_at).toLocaleString()}</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                    {hasFile ? (
                        <>
                            <button 
                                onClick={() => handleView(false)} 
                                disabled={actionLoading} 
                                className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl text-[10px] font-black bg-[#1a1d24] border border-white/5 text-white/50 hover:text-white hover:bg-[#252832] transition-all uppercase tracking-widest shadow-xl"
                            >
                                {actionLoading ? <Spinner size="sm"/> : <><EyeIcon className="w-4 h-4" /> View</>}
                            </button>
                            <button 
                                onClick={() => handleView(true)} 
                                disabled={actionLoading} 
                                className="flex items-center justify-center h-14 w-14 rounded-2xl bg-white/5 border border-white/5 text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                title="Download Asset"
                            >
                                <DownloadIcon className="w-5 h-5" />
                            </button>
                            {!isLocked && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="p-4 h-14 rounded-2xl bg-white/5 border border-white/5 text-white/30 hover:text-primary hover:bg-primary/10 transition-all group/refresh"
                                    title="Replace Registry Document"
                                >
                                    <RefreshIcon className="w-5 h-5 transition-transform duration-700 group-hover/refresh:rotate-180" />
                                </button>
                            )}
                        </>
                    ) : (
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isUploading}
                            className="w-full h-16 flex items-center justify-center gap-3 rounded-2xl text-[11px] font-black text-white bg-primary hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 active:scale-[0.98] uppercase tracking-[0.2em] transform hover:-translate-y-0.5"
                        >
                            {isUploading ? <Spinner size="sm" className="text-white"/> : <><UploadIcon className="w-5 h-5" /> Initialize Upload</>}
                        </button>
                    )}
                </div>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect} 
                accept=".pdf,.jpg,.jpeg,.png" 
            />
        </div>
    );
};

// --- Main Tab ---

const DocumentsTab: React.FC<DocumentsTabProps> = ({ focusOnAdmissionId, onClearFocus }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [groupedRequirements, setGroupedRequirements] = useState<Record<number, GroupedRequirementData>>({});
    const [expandedChildIds, setExpandedChildIds] = useState<Set<number>>(new Set());
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch child profiles linked to parent
            const { data: admissions, error: admErr } = await supabase.rpc('get_my_children_profiles');
            if (admErr) throw admErr;

            const ads = (admissions || []) as AdmissionApplication[];
            
            // 2. Initialize default slots if necessary (Idempotent call)
            if (ads.length > 0) {
                await Promise.all(ads.map(child => supabase.rpc('parent_initialize_vault_slots', { p_admission_id: child.id })));
            }

            // 3. Fetch aggregated requirements with joined documents
            const { data: reqs, error: rpcError } = await supabase.rpc('parent_get_document_requirements');
            if (rpcError) throw rpcError;

            const grouped: Record<number, GroupedRequirementData> = {};
            (reqs as RequirementWithDocs[]).forEach(req => {
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

            // Auto-expansion logic
            if (focusOnAdmissionId) {
                setExpandedChildIds(new Set([focusOnAdmissionId]));
            } else if (Object.keys(grouped).length > 0 && expandedChildIds.size === 0) {
                 setExpandedChildIds(new Set([Number(Object.keys(grouped)[0])]));
            }
        } catch (err: any) {
            setError(resolveError(err));
        } finally {
            setLoading(false);
        }
    }, [focusOnAdmissionId]);

    useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);
    useEffect(() => { return () => { if (onClearFocus) onClearFocus(); }; }, [onClearFocus]);

    const handleUpload = async (file: File, reqId: number, admId: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth context invalidated.");
        
        const fileExt = file.name.split('.').pop();
        const filePath = `parent/${user.id}/adm-${admId}/req-${reqId}_${Date.now()}.${fileExt}`;
        
        try {
            // 1. Physical Asset Handshake (Supabase Storage: guardian-documents)
            const { error: uploadError } = await supabase.storage
                .from('guardian-documents')
                .upload(filePath, file, { 
                    upsert: true,
                    contentType: file.type
                });
            
            if (uploadError) throw uploadError;

            // 2. Cryptographic Metadata Sync (Postgres RPC)
            const { error: dbError } = await supabase.rpc('parent_complete_document_upload', {
                p_requirement_id: reqId,
                p_admission_id: admId,
                p_file_name: file.name,
                p_storage_path: filePath,
                p_file_size: file.size,
                p_mime_type: file.type
            });

            if (dbError) throw dbError;
            
            // 3. Trigger UI Re-Sync
            setRefreshTrigger(prev => prev + 1);
        } catch (e: any) {
            throw e;
        }
    };

    if (loading && Object.keys(groupedRequirements).length === 0 && !error) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-8">
                <Spinner size="lg" className="text-primary"/>
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 animate-pulse">Establishing Secure Hub</p>
            </div>
        );
    }
    
    if (error) return (
        <div className="max-w-[800px] mx-auto py-20 px-4">
            <div className="p-16 text-center bg-[#0d0a0a] border border-red-500/20 rounded-[3.5rem] animate-in shake duration-700 shadow-3xl ring-1 ring-white/5">
                <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner ring-1 ring-red-500/30">
                    <AlertTriangleIcon className="w-12 h-12"/>
                </div>
                <h3 className="text-4xl font-serif font-black text-white mb-6 uppercase tracking-tighter">Sync Interrupted</h3>
                <p className="text-white/40 text-xl leading-relaxed mb-12 max-w-lg mx-auto font-serif italic">{error}</p>
                <button onClick={() => fetchData()} className="px-14 py-6 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-[0.4em] rounded-2xl shadow-2xl shadow-red-600/20 transition-all active:scale-95 transform hover:-translate-y-1">Retry Connection</button>
            </div>
        </div>
    );

    const admissionIds = Object.keys(groupedRequirements).map(Number);

    return (
        <div className="space-y-16 animate-in fade-in duration-1000 pb-40">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="max-w-4xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-inner border border-primary/20">
                            <ShieldCheckIcon className="w-6 h-6"/>
                        </div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.6em]">Mandatory Compliance Hub</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-serif font-black text-white tracking-tighter leading-none mb-8 uppercase">Verification <span className="text-white/30 italic">Vault.</span></h2>
                    <p className="text-white/40 text-2xl font-medium leading-relaxed font-serif italic border-l-2 border-white/10 pl-10 ml-2">
                        Institutional identity repository. Linking mandatory enrollment assets is required to activate student nodes across the network.
                    </p>
                </div>
            </div>

            <div className="space-y-12">
                {admissionIds.map(admId => {
                    const group = groupedRequirements[admId];
                    const isExpanded = expandedChildIds.has(admId);
                    
                    const verifiedCount = group.requirements.filter(r => r.status === 'Accepted' || r.status === 'Verified').length;
                    const totalCount = group.requirements.length;
                    const completion = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
                    
                    return (
                        <div key={admId} className={`group bg-[#0d0f14] border transition-all duration-1000 rounded-[4rem] overflow-hidden ${isExpanded ? 'border-primary/40 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] scale-[1.01]' : 'border-white/5 hover:border-primary/20 shadow-2xl'}`}>
                            <div 
                                className={`p-10 md:p-14 flex flex-col xl:flex-row justify-between items-center gap-12 cursor-pointer transition-colors ${isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.01]'}`}
                                onClick={() => setExpandedChildIds(prev => {
                                    const n = new Set(prev);
                                    if (n.has(admId)) n.delete(admId);
                                    else n.add(admId);
                                    return n;
                                })}
                            >
                                <div className="flex items-center gap-10 w-full xl:w-auto">
                                    <div className="relative group/avatar">
                                        <PremiumAvatar src={group.profilePhotoUrl} name={group.applicantName} size="lg" statusColor={completion === 100 ? 'bg-emerald-500' : 'bg-primary'} className="ring-8 ring-black/30 group-hover/avatar:scale-105 transition-transform duration-700" />
                                        {completion === 100 && (
                                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-xl border-4 border-[#0d0f14] animate-bounce-subtle">
                                                <CheckCircleIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-serif font-black text-4xl md:text-5xl text-white tracking-tighter truncate leading-none mb-4 group-hover:text-primary transition-colors duration-700 uppercase">{group.applicantName}</h3>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] bg-white/5 px-4 py-2 rounded-xl border border-white/5 shadow-inner">Institutional Protocol Active</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/10 hidden md:block"></div>
                                            <span className="text-[11px] font-mono font-bold text-white/20 tracking-tighter uppercase opacity-60 bg-white/5 px-3 py-1 rounded-lg">ID: HUB_ADM_{admId.toString().padStart(4, '0')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-12 w-full xl:w-auto">
                                    <div className="flex-grow sm:w-72">
                                        <div className="flex justify-between items-end mb-4 px-1">
                                            <span className="text-[11px] font-black uppercase text-white/20 tracking-[0.5em]">Integrity Index</span>
                                            <span className={`text-[11px] font-black tracking-[0.2em] ${completion === 100 ? 'text-emerald-500' : 'text-primary'}`}>{completion}% Verified</span>
                                        </div>
                                        <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5 p-0.5">
                                            <div className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${completion === 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]'}`} style={{ width: `${completion}%` }}></div>
                                        </div>
                                    </div>
                                    <div className={`p-5 rounded-[1.8rem] transition-all duration-700 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary border border-primary/20 shadow-2xl' : 'text-white/20 bg-white/5 border border-white/5 shadow-inner'}`}>
                                        <ChevronDownIcon className="w-8 h-8" />
                                    </div>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="p-10 md:p-14 lg:p-20 border-t border-white/5 bg-[#08090a] animate-in slide-in-from-top-12 duration-1000">
                                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10 xl:gap-14">
                                        {group.requirements.map(req => (
                                            <DocumentSlot 
                                                key={req.id} 
                                                req={req} 
                                                onUpload={handleUpload}
                                            />
                                        ))}
                                        <button className="relative rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-primary/30 transition-all duration-500 group overflow-hidden bg-white/[0.01] flex flex-col items-center justify-center p-8 min-h-[320px]">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 shadow-inner">
                                                <PlusIcon className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
                                            </div>
                                            <p className="font-serif font-black text-white/20 text-lg group-hover:text-white transition-colors uppercase tracking-tight">Add Supplemental Record</p>
                                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/10 mt-3 group-hover:text-primary/60 transition-colors">Optional Data Node</p>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DocumentsTab;
