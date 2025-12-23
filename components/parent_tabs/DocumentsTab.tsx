import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';

// --- Types ---

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
    notes_for_parent: string;
    rejection_reason: string;
    applicant_name: string;
    admission_documents: DocumentFile[];
}

interface GroupedRequirementData {
    admissionId: number;
    applicantName: string;
    requirements: RequirementWithDocs[];
}

interface DocumentsTabProps {
    focusOnAdmissionId?: number | null;
    onClearFocus?: () => void;
}

/**
 * Robust error formatter to extract string messages from any error object.
 * Prevents [object Object] from being shown to users.
 */
const formatError = (err: any): string => {
    if (!err) return "An unknown synchronization error occurred.";
    if (typeof err === 'string') {
        if (err.includes("[object Object]")) return "An unexpected server response occurred.";
        return err;
    }
    
    // Check common error property paths and ensure they are strings
    const rawMsg = err.message || err.error_description || err.details || err.hint;
    if (typeof rawMsg === 'string' && !rawMsg.includes("[object Object]")) {
        return rawMsg;
    }
    
    // Supabase specific wrapped error
    if (err.error) {
        if (typeof err.error === 'string') return err.error;
        if (err.error.message && typeof err.error.message === 'string') return err.error.message;
    }

    // Fallback to JSON if it's a plain object, else generic
    try {
        const str = JSON.stringify(err);
        if (str && str !== '{}' && str !== '[]') return str;
    } catch { }

    const final = err.toString();
    return final === '[object Object]' ? "An unexpected system exception occurred during the operation." : final;
};

// --- Status Badge Helper ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = {
        'Accepted': { 
            color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', 
            icon: <CheckCircleIcon className="w-3.5 h-3.5"/>, 
            label: 'Verified' 
        },
        'Verified': { 
            color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', 
            icon: <CheckCircleIcon className="w-3.5 h-3.5"/>, 
            label: 'Verified' 
        },
        'Submitted': { 
            color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', 
            icon: <ClockIcon className="w-3.5 h-3.5"/>, 
            label: 'In Review' 
        },
        'Pending': { 
            color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', 
            icon: <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />, 
            label: 'Required' 
        },
        'Rejected': { 
            color: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', 
            icon: <XCircleIcon className="w-3.5 h-3.5"/>, 
            label: 'Correction Needed' 
        },
    };
    const style = config[status as keyof typeof config] || config['Pending'];

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-sm ${style.color}`}>
            {style.icon}
            {style.label}
        </span>
    );
};

// --- Smart Document Card ---
const DocumentCard: React.FC<{ 
    req: RequirementWithDocs; 
    onUpload: (file: File, reqId: number, admId: number) => Promise<void>;
}> = ({ req, onUpload }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const latestDoc = req.admission_documents && req.admission_documents.length > 0 
        ? req.admission_documents.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0] 
        : null;

    const isLocked = req.status === 'Accepted' || req.status === 'Verified';
    const isRejected = req.status === 'Rejected';
    const hasFile = !!latestDoc && !isRejected;
    
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLocked) return;
        if (e.type === 'dragenter' || e.type === 'dragover') setIsDragOver(true);
        else if (e.type === 'dragleave' || e.type === 'drop') setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (isLocked) return;
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processUpload(e.target.files[0]);
        }
    };

    const processUpload = async (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            alert("File is too large. Max size is 10MB.");
            return;
        }
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
            alert("Invalid file type. Please upload PDF, JPG, or PNG.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        const timer = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        try {
            await onUpload(file, req.id, req.admission_id);
            setUploadProgress(100);
        } catch (error) {
            console.error("Critical upload failure:", formatError(error));
        } finally {
            clearInterval(timer);
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    };

    const handleView = async () => {
        if (!latestDoc) return;
        try {
            const { data, error } = await supabase.storage
                .from('admission-documents')
                .createSignedUrl(latestDoc.storage_path, 3600);

            if (error || !data) throw error || new Error("Link generation failed");
            window.open(data.signedUrl, '_blank');
        } catch (err) {
            console.error("View error:", formatError(err));
            alert("Could not view document.");
        }
    };
    
    const handleDownload = async () => {
        if (!latestDoc) return;
        setDownloading(true);
        try {
            const { data, error } = await supabase.storage
                .from('admission-documents')
                .createSignedUrl(latestDoc.storage_path, 60);

            if (error) throw error;
            if (!data?.signedUrl) throw new Error("Failed to get download link");

            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.download = latestDoc.file_name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e: any) {
            console.error("Download error:", formatError(e));
            alert(`Download failed: ${formatError(e)}`);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div 
            className={`
                relative rounded-[2rem] border transition-all duration-500 group overflow-hidden bg-card flex flex-col h-full
                ${isDragOver ? 'border-primary bg-primary/5 scale-[1.02] shadow-2xl' : 'border-border'}
                ${isLocked ? 'border-emerald-500/30 bg-emerald-50/5' : ''}
                ${isRejected ? 'border-red-500/30 bg-red-50/5' : ''}
                ${!hasFile && !isLocked && !isRejected ? 'border-dashed border-border hover:border-primary/50 hover:bg-muted/30' : 'shadow-sm hover:shadow-xl'}
            `}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
        >
            {isUploading && (
                <div className="absolute top-0 left-0 h-1 bg-primary z-20 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]" style={{ width: `${uploadProgress}%` }}></div>
            )}

            <div className="p-8 flex flex-col h-full relative">
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl shadow-inner transition-all duration-500 ${isLocked ? 'bg-emerald-100 text-emerald-600' : isRejected ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'}`}>
                        <DocumentTextIcon className="w-7 h-7" />
                    </div>
                    <StatusBadge status={req.status} />
                </div>

                <div className="flex-grow">
                    <h4 className="font-black text-foreground text-lg mb-2 tracking-tight group-hover:text-primary transition-colors">{req.document_name}</h4>
                    {isRejected && req.rejection_reason ? (
                         <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 animate-in fade-in slide-in-from-top-1">
                             <p className="text-[10px] font-black text-red-600 uppercase flex items-center gap-1.5 mb-1.5 tracking-widest">
                                 <AlertTriangleIcon className="w-3.5 h-3.5"/> Action Required
                             </p>
                             <p className="text-xs text-red-800 dark:text-red-300 font-medium leading-relaxed italic">"{req.rejection_reason}"</p>
                         </div>
                    ) : (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                            {req.notes_for_parent || (hasFile ? `Last submission: ${new Date(latestDoc?.uploaded_at!).toLocaleDateString()}` : "Formats: PDF, JPG, PNG (Max 10MB)")}
                        </p>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-border/50 grid grid-cols-2 gap-3">
                    {hasFile || isLocked ? (
                        <>
                            <button 
                                onClick={handleView}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black bg-background border border-border hover:bg-muted text-foreground transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                            >
                                <EyeIcon className="w-4 h-4 text-muted-foreground" /> View
                            </button>
                            
                            {!isLocked ? (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                                >
                                    <RefreshIcon className="w-4 h-4" /> Update
                                </button>
                            ) : (
                                <button 
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black bg-background border border-border hover:bg-muted text-foreground transition-all uppercase tracking-wider"
                                >
                                    {downloading ? <Spinner size="sm"/> : <><DownloadIcon className="w-4 h-4 text-muted-foreground" /> Save</>}
                                </button>
                            )}
                        </>
                    ) : (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`col-span-2 w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-xs font-black text-white transition-all shadow-lg active:scale-95 uppercase tracking-widest
                                ${isRejected ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-primary hover:bg-primary/90 shadow-primary/25'}
                            `}
                        >
                            {isUploading ? <Spinner size="sm" className="text-white"/> : <><UploadIcon className="w-4 h-4" /> {isRejected ? 'Correct & Upload' : 'Upload Document'}</>}
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

// --- Main Tab Component ---

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
            const { data, error } = await supabase.rpc('parent_get_document_requirements');

            if (error) throw error;

            const grouped: Record<number, GroupedRequirementData> = {};
            
            (data as RequirementWithDocs[]).forEach(req => {
                if (!grouped[req.admission_id]) {
                    grouped[req.admission_id] = {
                        admissionId: req.admission_id,
                        applicantName: req.applicant_name,
                        requirements: []
                    };
                }
                const docs = Array.isArray(req.admission_documents) ? req.admission_documents : [];
                grouped[req.admission_id].requirements.push({ ...req, admission_documents: docs });
            });

            setGroupedRequirements(grouped);

            if (focusOnAdmissionId) {
                setExpandedChildIds(new Set([focusOnAdmissionId]));
            } else if (Object.keys(grouped).length > 0 && expandedChildIds.size === 0) {
                 const firstId = Object.keys(grouped)[0];
                 setExpandedChildIds(new Set([Number(firstId)]));
            }
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    }, [focusOnAdmissionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    useEffect(() => {
        return () => {
            if (onClearFocus) onClearFocus();
        };
    }, [onClearFocus]);

    const toggleExpand = (id: number) => {
        setExpandedChildIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleUpload = async (file: File, reqId: number, admId: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication session expired.");

            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/admission-${admId}/req-${reqId}_${Date.now()}.${fileExt}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('admission-documents')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            // 2. Update status to 'Submitted'
            const { error: updateError } = await supabase
                .from('document_requirements')
                .update({ status: 'Submitted' })
                .eq('id', reqId);
            
            if (updateError) throw updateError;
            
            // 3. Insert document record
            const { error: docError } = await supabase
                .from('admission_documents')
                .insert({
                    admission_id: admId,
                    requirement_id: reqId,
                    file_name: file.name,
                    storage_path: filePath,
                    uploaded_at: new Date().toISOString()
                });

            if (docError) throw docError;

            setRefreshTrigger(prev => prev + 1);
            alert("Document uploaded successfully. It is now awaiting admin verification.");
        } catch (error: any) {
            console.error("Upload failure:", formatError(error));
            alert(`Document processing failed: ${formatError(error)}`);
            throw error; 
        }
    };

    if (loading && Object.keys(groupedRequirements).length === 0) return <div className="flex justify-center p-24"><Spinner size="lg" /></div>;
    
    if (error) return (
        <div className="p-12 text-center bg-red-500/10 border border-red-500/20 rounded-[2rem] m-6">
            <AlertTriangleIcon className="w-10 h-10 text-red-500 mx-auto mb-4"/>
            <p className="text-red-700 font-bold text-lg">{error}</p>
            <button onClick={() => fetchData()} className="mt-6 px-8 py-3 bg-red-600 text-white font-black rounded-xl text-sm shadow-lg active:scale-95 transition-all">Retry Sync</button>
        </div>
    );

    const admissionIds = Object.keys(groupedRequirements).map(Number);

    if (admissionIds.length === 0) {
        return (
            <div className="text-center py-32 bg-muted/20 border-2 border-dashed border-border rounded-[3rem] animate-in fade-in zoom-in-95 duration-700">
                <div className="w-20 h-20 bg-background rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-border">
                    <DocumentTextIcon className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">Verification Vault Empty</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
                    Required documents for your children will appear here once an admission request is initiated by the school.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-serif font-black text-foreground tracking-tight">Verification Vault</h2>
                    <p className="text-muted-foreground mt-2 text-lg">Securely manage mandatory enrollment documentation.</p>
                </div>
                <div className="bg-primary/5 border border-primary/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                     <ShieldCheckIcon className="w-5 h-5 text-primary" />
                     <span className="text-xs font-bold text-primary uppercase tracking-widest">AES-256 Cloud Storage Enabled</span>
                </div>
            </div>

            <div className="space-y-6 pb-20">
                {admissionIds.map(admId => {
                    const group = groupedRequirements[admId];
                    const isExpanded = expandedChildIds.has(admId);
                    const verifiedCount = group.requirements.filter(r => r.status === 'Accepted' || r.status === 'Verified').length;
                    const totalCount = group.requirements.length;
                    const completion = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
                    
                    return (
                        <div key={admId} className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                            <div 
                                className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 cursor-pointer bg-muted/10 hover:bg-muted/30 transition-colors"
                                onClick={() => toggleExpand(admId)}
                            >
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
                                        {group.applicantName.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-2xl text-foreground tracking-tight truncate">{group.applicantName}</h3>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{totalCount} Required Files</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 w-full md:w-auto">
                                    <div className="flex-grow md:w-48">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Stewardship</span>
                                            <span className={`text-[10px] font-black ${completion === 100 ? 'text-emerald-500' : 'text-primary'}`}>{completion}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner">
                                            <div className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${completion === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${completion}%` }}></div>
                                        </div>
                                    </div>
                                    <div className={`p-2.5 rounded-full transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary' : 'text-muted-foreground bg-muted'}`}>
                                        <ChevronDownIcon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="p-6 md:p-10 border-t border-border bg-background animate-in slide-in-from-top-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                        {group.requirements.map(req => (
                                            <DocumentCard 
                                                key={req.id} 
                                                req={req} 
                                                onUpload={handleUpload}
                                            />
                                        ))}
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