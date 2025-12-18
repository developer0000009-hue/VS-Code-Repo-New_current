
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
    status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';
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

// --- Status Badge Helper ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = {
        'Accepted': { 
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
            label: 'Action Needed' 
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

    // Sort to get the latest document
    const latestDoc = req.admission_documents && req.admission_documents.length > 0 
        ? req.admission_documents.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0] 
        : null;

    const isLocked = req.status === 'Accepted';
    const isRejected = req.status === 'Rejected';
    const hasFile = !!latestDoc && !isRejected;
    
    // Drag handlers
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
        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large. Max size is 5MB.");
            return;
        }
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
            alert("Invalid file type. Please upload PDF, JPG, or PNG.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(10); // Start visual progress

        const timer = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            await onUpload(file, req.id, req.admission_id);
            setUploadProgress(100);
        } catch (error) {
            console.error(error);
            alert("Upload failed. Please try again.");
        } finally {
            clearInterval(timer);
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 800);
        }
    };

    const handleView = async () => {
        if (!latestDoc) return;
        try {
            // Using getPublicUrl assuming public bucket or signedUrl if private.
            // For security, storage usually requires signed URLs for private data.
            // Since this is parent viewing their own, we use createSignedUrl
            const { data, error } = await supabase.storage
                .from('admission-documents')
                .createSignedUrl(latestDoc.storage_path, 3600); // 1 hour link

            if (error || !data) throw error || new Error("Link generation failed");
            window.open(data.signedUrl, '_blank');
        } catch (err) {
            console.error(err);
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
            console.error("Download error:", e);
            alert(`Download failed: ${e.message}`);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div 
            className={`
                relative rounded-xl border-2 transition-all duration-300 group overflow-hidden bg-card flex flex-col h-full
                ${isDragOver ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg' : 'border-border'}
                ${isLocked ? 'border-emerald-500/20 bg-emerald-50/10' : ''}
                ${isRejected ? 'border-red-500/30 bg-red-50/10' : ''}
                ${!hasFile && !isLocked && !isRejected ? 'border-dashed border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-md' : 'shadow-sm hover:shadow-md'}
            `}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
        >
            {/* Progress Bar Overlay */}
            {isUploading && (
                <div className="absolute top-0 left-0 h-1 bg-primary z-20 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
            )}

            <div className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl shadow-sm transition-colors ${isLocked ? 'bg-emerald-100 text-emerald-600' : isRejected ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground group-hover:text-foreground'}`}>
                        <DocumentTextIcon className="w-6 h-6" />
                    </div>
                    <StatusBadge status={req.status} />
                </div>

                <div className="flex-grow">
                    <h4 className="font-bold text-foreground text-sm mb-1.5">{req.document_name}</h4>
                    {isRejected && req.rejection_reason ? (
                         <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 mb-2 mt-2 animate-in fade-in slide-in-from-top-1">
                             <p className="text-[10px] font-bold text-red-600 uppercase flex items-center gap-1.5 mb-1">
                                 <AlertTriangleIcon className="w-3 h-3"/> Modification Required
                             </p>
                             <p className="text-xs text-red-800 dark:text-red-300 leading-tight">{req.rejection_reason}</p>
                         </div>
                    ) : (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {req.notes_for_parent || (hasFile ? `Uploaded: ${new Date(latestDoc?.uploaded_at!).toLocaleDateString()}` : "PDF, JPG or PNG (Max 5MB)")}
                        </p>
                    )}
                </div>

                <div className="mt-5 pt-4 border-t border-border/50 grid grid-cols-2 gap-2">
                    {hasFile || isLocked ? (
                        <>
                            <button 
                                onClick={handleView}
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-background border border-border hover:bg-muted text-foreground transition-colors hover:shadow-sm"
                            >
                                <EyeIcon className="w-3.5 h-3.5 text-muted-foreground" /> View
                            </button>
                            
                            {!isLocked ? (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-background border border-border hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all hover:shadow-sm"
                                >
                                    <RefreshIcon className="w-3.5 h-3.5" /> Replace
                                </button>
                            ) : (
                                <button 
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-background border border-border hover:bg-muted text-foreground transition-colors"
                                >
                                    {downloading ? <Spinner size="sm"/> : <><DownloadIcon className="w-3.5 h-3.5 text-muted-foreground" /> Download</>}
                                </button>
                            )}
                        </>
                    ) : (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`col-span-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm active:scale-95
                                ${isRejected ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}
                            `}
                        >
                            {isUploading ? <Spinner size="sm" className="text-white"/> : <><UploadIcon className="w-3.5 h-3.5" /> {isRejected ? 'Re-upload Document' : 'Upload Document'}</>}
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
            
            // Group flat list by admission_id
            (data as RequirementWithDocs[]).forEach(req => {
                if (!grouped[req.admission_id]) {
                    grouped[req.admission_id] = {
                        admissionId: req.admission_id,
                        applicantName: req.applicant_name,
                        requirements: []
                    };
                }
                // Ensure admission_documents is an array (RPC returns jsonb)
                const docs = Array.isArray(req.admission_documents) ? req.admission_documents : [];
                grouped[req.admission_id].requirements.push({ ...req, admission_documents: docs });
            });

            setGroupedRequirements(grouped);

            // Auto-expand logic based on focus or default state
            if (focusOnAdmissionId) {
                setExpandedChildIds(new Set([focusOnAdmissionId]));
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [focusOnAdmissionId]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    // Handle clearing focus when unmounting or changing
    useEffect(() => {
        return () => {
            if (onClearFocus) onClearFocus();
        };
    }, []);

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
            if (!user) throw new Error("Not authenticated");

            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${admId}/${reqId}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('admission-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Update requirement status to Submitted
            const { error: updateError } = await supabase
                .from('document_requirements')
                .update({ status: 'Submitted' })
                .eq('id', reqId);
            
            if (updateError) throw updateError;
            
            // Record the document in admission_documents table
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
            alert("Document uploaded successfully!");
        } catch (error: any) {
            console.error("Upload error:", error);
            alert(`Upload failed: ${error.message}`);
            throw error; // Propagate to DocumentCard for UI handling
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const admissionIds = Object.keys(groupedRequirements).map(Number);

    if (admissionIds.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground bg-muted/10 border-2 border-dashed border-border rounded-xl">
                <DocumentTextIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-medium text-foreground">No documents required yet.</p>
                <p className="text-sm mt-1">Once you start an application, document requirements will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Document Management</h2>
            <div className="space-y-4">
                {admissionIds.map(admId => {
                    const group = groupedRequirements[admId];
                    const isExpanded = expandedChildIds.has(admId);
                    
                    return (
                        <div key={admId} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div 
                                className="p-4 flex justify-between items-center bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => toggleExpand(admId)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <DocumentTextIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">{group.applicantName}</h3>
                                        <p className="text-xs text-muted-foreground">{group.requirements.length} Requirements</p>
                                    </div>
                                </div>
                                <ChevronDownIcon className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                            
                            {isExpanded && (
                                <div className="p-6 border-t border-border bg-background">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
