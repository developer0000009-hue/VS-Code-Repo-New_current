
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { AdmissionApplication, AdmissionStatus, DocumentRequirement, AdmissionDocument } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SchoolIcon } from './icons/SchoolIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ClockIcon } from './icons/ClockIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { UserIcon } from './icons/UserIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { MailIcon } from './icons/MailIcon';
import { UsersIcon } from './icons/UsersIcon';
import { FilterIcon } from './icons/FilterIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import ConfirmationModal from './common/ConfirmationModal';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { DownloadIcon } from './icons/DownloadIcon';

// --- Types & Constants ---

const statusColors: { [key: string]: string } = {
  'Pending Review': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  'Documents Requested': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  'Rejected': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  'Enquiry': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
};

const docStatusColors: { [key: string]: { text: string; bg: string; border: string; icon: React.ReactNode } } = {
    'Pending': { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> },
    'Submitted': { text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: <ClockIcon className="w-3.5 h-3.5"/> },
    'Accepted': { text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: <CheckCircleIcon className="w-3.5 h-3.5"/> },
    'Rejected': { text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: <XCircleIcon className="w-3.5 h-3.5"/> },
};

const DOCUMENT_OPTIONS = ["Birth Certificate", "Previous School Report Card", "Address Proof", "Parent ID Proof", "Student Photograph", "Transfer Certificate"];

// --- Sub-Components ---

const KPICard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color} text-white shadow-md`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{value}</p>
        </div>
    </div>
);

const PreviewModal: React.FC<{ url: string; fileName: string; onClose: () => void }> = ({ url, fileName, onClose }) => {
    const isPDF = fileName.toLowerCase().endsWith('.pdf');
    
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[200] flex items-center justify-center animate-in fade-in duration-200 p-4" onClick={onClose}>
            <div className="relative w-full h-full max-w-6xl max-h-[95vh] flex flex-col items-center justify-center bg-card rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent z-50">
                    <span className="text-white text-sm font-bold truncate pr-10">{fileName}</span>
                    <button onClick={onClose} className="p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors backdrop-blur-md">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>
                
                <div className="w-full h-full flex items-center justify-center bg-black/10">
                    {isPDF ? (
                        <iframe 
                            src={`${url}#toolbar=0`} 
                            className="w-full h-full border-0" 
                            title="PDF Preview"
                        />
                    ) : (
                        <img 
                            src={url} 
                            className="max-h-full max-w-full object-contain animate-in zoom-in-95 duration-300" 
                            alt="Preview"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC41KSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiA5djJtMCA0aC4wMU0yMSAxMmEtOSA5IDAgMSAxLTE4IDAgOSA5IDAgMCAxIDE4IDB6Ii8+PC9zdmc+';
                            }}
                        />
                    )}
                </div>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                     <a href={url} download={fileName} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/20 backdrop-blur-md flex items-center gap-2">
                        <DownloadIcon className="w-4 h-4"/> Download Original
                     </a>
                </div>
            </div>
        </div>
    );
};

export const RequestDocumentsModal: React.FC<{ admissionId: number; applicantName?: string; onClose: () => void; onSuccess: () => void }> = ({ admissionId, applicantName, onClose, onSuccess }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if(selected.size === 0) return alert("Select at least one document");
        setLoading(true);
        try {
            await supabase.rpc('request_admission_documents', { p_admission_id: admissionId, p_documents: Array.from(selected), p_note: note });
            onSuccess();
        } catch (err: any) {
            alert(`Failed to request documents: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden ring-1 ring-white/10" onClick={e=>e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Request Documents</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground"><XIcon className="w-5 h-5"/></button>
                </div>
                {applicantName && <p className="px-6 pt-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">For {applicantName}</p>}
                
                <div className="p-6 space-y-4">
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {DOCUMENT_OPTIONS.map(doc => (
                            <label key={doc} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected.has(doc) ? 'bg-primary/5 border-primary shadow-sm' : 'border-border hover:bg-muted/50'}`}>
                                <input type="checkbox" className="w-4 h-4 text-primary rounded border-input focus:ring-primary" checked={selected.has(doc)} onChange={() => { const s = new Set(selected); s.has(doc) ? s.delete(doc) : s.add(doc); setSelected(s); }} />
                                <span className="text-sm font-medium">{doc}</span>
                            </label>
                        ))}
                    </div>
                    <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note for the parent (optional)..." className="w-full p-3 bg-background border border-input rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-background rounded-xl border border-transparent hover:border-border transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-lg hover:bg-primary/90 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70">
                        {loading && <Spinner size="sm" className="text-current"/>} Send Request
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Detail View Component ---

const AdmissionDetailModal: React.FC<{ 
    application: AdmissionApplication; 
    onClose: () => void; 
    onUpdate: () => void; 
}> = ({ application, onClose, onUpdate }) => {
    const [docs, setDocs] = useState<(DocumentRequirement & { admission_documents: AdmissionDocument[] })[]>([]);
    const [docLoading, setDocLoading] = useState(false);
    const [reqModal, setReqModal] = useState(false);
    const [previewConfig, setPreviewConfig] = useState<{ url: string; fileName: string } | null>(null);
    const [processing, setProcessing] = useState(false);
    const [fetchingFile, setFetchingFile] = useState<number | null>(null);

    // Confirmation State
    const [confirmModal, setConfirmModal] = useState<{ 
        isOpen: boolean; 
        type: 'Approve' | 'Reject' | 'Warning';
        title: string;
        message: string;
    }>({ isOpen: false, type: 'Approve', title: '', message: '' });

    const fetchDocsData = useCallback(async () => {
        setDocLoading(true);
        try {
            const { data, error } = await supabase.from('document_requirements')
                .select('*, admission_documents(*)')
                .eq('admission_id', application.id);
            
            if (error) throw error;
            setDocs(data || []);
        } catch (err: any) {
            console.error("Error fetching docs:", err);
        } finally {
            setDocLoading(false);
        }
    }, [application.id]);

    useEffect(() => {
        fetchDocsData();
    }, [fetchDocsData]);

    const handleActionTrigger = (actionType: 'Approve' | 'Reject') => {
        if (actionType === 'Approve') {
            const unverifiedDocs = docs.filter(d => d.status !== 'Accepted');
            if (unverifiedDocs.length > 0) {
                setConfirmModal({
                    isOpen: true,
                    type: 'Warning',
                    title: 'Unverified Documents',
                    message: `Warning: ${unverifiedDocs.length} documents are not yet marked as 'Accepted'. Do you still want to proceed with approving ${application.applicant_name}?`
                });
            } else {
                setConfirmModal({
                    isOpen: true,
                    type: 'Approve',
                    title: 'Approve Admission',
                    message: `Are you sure you want to approve ${application.applicant_name} and create their student profile?`
                });
            }
        } else {
            setConfirmModal({
                isOpen: true,
                type: 'Reject',
                title: 'Reject Application',
                message: `Are you sure you want to reject the application for ${application.applicant_name}? This action is irreversible.`
            });
        }
    };

    const handleConfirmedAction = async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setProcessing(true);
        
        try {
            const status = confirmModal.type === 'Reject' ? 'Rejected' : 'Approved';

            if(status === 'Approved') {
                const { data, error } = await supabase.rpc('approve_admission_application', { p_admission_id: application.id });
                if (error) throw error;
                if(data?.success) { 
                    alert(`Application Approved! Student profile created.\nEmail: ${data.email || 'generated'}`); 
                    onClose(); 
                    onUpdate(); 
                } else {
                    throw new Error(data?.message || 'Failed to approve application.');
                }
            } else {
                const { error } = await supabase.rpc('update_admission_status', { p_admission_id: application.id, p_new_status: 'Rejected' });
                if (error) throw error;
                onClose(); 
                onUpdate();
            }
        } catch (err: any) {
            console.error("Status update error:", err);
            alert(`Error: ${err.message || "An unexpected error occurred."}`);
        } finally {
            setProcessing(false);
        }
    };

    const updateDoc = async (id: number, status: string) => {
            const reason = status === 'Rejected' ? prompt("Please enter a reason for rejection:") : null;
            if(status === 'Rejected' && !reason) return;
            
            const { error } = await supabase.from('document_requirements').update({ status, rejection_reason: reason }).eq('id', id);
            if (error) {
                alert("Failed to update document status");
            } else {
                setDocs(prev => prev.map(d => d.id === id ? { ...d, status: status as any, rejection_reason: reason || '' } : d));
            }
    };

    const handlePreview = async (docId: number, path: string, fileName: string) => {
        setFetchingFile(docId);
        try {
            const { data, error } = await supabase.storage.from('admission-documents').createSignedUrl(path, 3600);
            if (error) throw error;
            if (data?.signedUrl) {
                setPreviewConfig({ url: data.signedUrl, fileName });
            } else {
                throw new Error("Could not retrieve file URL.");
            }
        } catch (err: any) {
            console.error("Preview error:", err);
            alert(`Unable to open document: ${err.message || "Permissions error or file missing."}`);
        } finally {
            setFetchingFile(null);
        }
    };

    /**
     * Improved handleDownload to fetch file as blob, ensuring proper name & reliable browser handling.
     */
    const handleDownload = async (docId: number, path: string, fileName: string) => {
        setFetchingFile(docId);
        try {
            // Generate a secure, time-limited signed URL
            const { data, error } = await supabase.storage.from('admission-documents').createSignedUrl(path, 60);
            if (error) throw error;
            if (!data?.signedUrl) throw new Error("Could not retrieve secure download link.");

            // Fetch file as blob to force reliable download with specific filename
            const response = await fetch(data.signedUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Create hidden link and click it
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
            window.URL.revokeObjectURL(blobUrl);
            
        } catch (err: any) {
            console.error("Download error:", err);
            alert(`Download failed: ${err.message || "The file could not be retrieved due to a system restriction or connectivity issue."}`);
        } finally {
            setFetchingFile(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-background w-full h-full sm:max-w-6xl sm:h-[92vh] sm:rounded-[2rem] shadow-2xl border-0 sm:border border-white/10 ring-1 ring-black/5 flex flex-col overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 p-4 sm:p-6 border-b border-border bg-card/90 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl sm:text-3xl font-bold shadow-lg shadow-blue-500/20 border-2 sm:border-4 border-background flex-shrink-0">
                            {application.applicant_name.charAt(0)}
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start">
                                <h2 className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight truncate max-w-[200px] sm:max-w-md">{application.applicant_name}</h2>
                                <button onClick={onClose} className="sm:hidden p-1.5 -mt-1 -mr-2 rounded-full hover:bg-muted text-muted-foreground"><XIcon className="w-5 h-5"/></button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase border tracking-wide whitespace-nowrap ${statusColors[application.status]}`}>
                                    {application.status}
                                </span>
                                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md border border-border/50 whitespace-nowrap">
                                    <SchoolIcon className="w-3 h-3"/> Grade {application.grade}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="hidden sm:block p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"><XIcon className="w-6 h-6"/></button>
                </div>

                {/* Content */}
                <div className="flex flex-col lg:flex-row flex-grow overflow-y-auto lg:overflow-hidden bg-background">
                    {/* Sidebar */}
                    <div className="w-full lg:w-80 bg-muted/10 border-b lg:border-b-0 lg:border-r border-border flex-shrink-0 lg:overflow-y-auto custom-scrollbar">
                        <div className="p-4 sm:p-6 space-y-6">
                            <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-3">
                                <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-2 mb-2">
                                    <UserIcon className="w-3.5 h-3.5"/> Applicant Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Date of Birth</p>
                                        <p className="font-semibold text-sm text-foreground truncate">{application.date_of_birth ? new Date(application.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Gender</p>
                                        <p className="font-semibold text-sm text-foreground truncate">{application.gender || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">App ID</p>
                                        <p className="font-mono font-bold text-sm text-primary truncate">{application.application_number || `#${application.id}`}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-3">
                                <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-2 mb-2">
                                    <UsersIcon className="w-3.5 h-3.5"/> Guardian Info
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-1.5 bg-muted rounded text-muted-foreground"><UserIcon className="w-3.5 h-3.5"/></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Name</p>
                                            <p className="font-semibold text-foreground truncate">{application.parent_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-1.5 bg-muted rounded text-muted-foreground"><MailIcon className="w-3.5 h-3.5"/></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p>
                                            <p className="font-medium text-foreground truncate">{application.parent_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-1.5 bg-muted rounded text-muted-foreground"><PhoneIcon className="w-3.5 h-3.5"/></div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone</p>
                                            <p className="font-medium text-foreground truncate">{application.parent_phone}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Area (Documents) */}
                    <div className="flex-grow flex flex-col bg-background min-w-0 lg:h-full lg:overflow-hidden relative">
                        <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
                            <div>
                                <h3 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                                    Documents <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{docs.length}</span>
                                </h3>
                                <p className="text-xs text-muted-foreground hidden sm:block">Verify uploaded proofs below.</p>
                            </div>
                            <button onClick={()=>setReqModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all border border-primary/20 shadow-sm active:scale-95">
                                <PaperClipIcon className="w-3.5 h-3.5"/> Request Docs
                            </button>
                        </div>
                        
                        <div className="p-4 sm:p-6 bg-muted/5 custom-scrollbar lg:flex-grow lg:overflow-y-auto">
                            {docLoading ? <div className="flex justify-center py-20"><Spinner size="lg"/></div> : docs.length === 0 ? 
                                <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-border rounded-2xl bg-card m-4">
                                    <DocumentTextIcon className="w-12 h-12 text-muted-foreground/20 mb-3"/>
                                    <p className="text-sm font-bold text-muted-foreground">No documents requested yet.</p>
                                </div> :
                                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                                    {docs.map(doc => {
                                        const file = doc.admission_documents?.[0];
                                        const statusStyle = docStatusColors[doc.status] || docStatusColors['Pending'];
                                        const isFetchingThis = fetchingFile === doc.id;
                                        
                                        return (
                                            <div key={doc.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden h-full">
                                                <div className={`absolute top-0 left-0 w-1 h-full ${statusStyle.bg.replace('bg-', 'bg-').replace('/20', '')}`}></div>
                                                
                                                <div className="flex justify-between items-start mb-3 pl-2">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div className="p-2 bg-muted rounded-lg text-muted-foreground shrink-0 mt-0.5">
                                                            <DocumentTextIcon className="w-4 h-4"/>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-foreground truncate leading-tight" title={doc.document_name}>{doc.document_name}</p>
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-1.5 border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                                {statusStyle.icon} {doc.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-grow pl-2 mb-3">
                                                    {file ? (
                                                        <div className="bg-muted/30 p-2.5 rounded-lg border border-border/60 flex items-center justify-between group/file hover:border-primary/30 transition-colors">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <div className="p-1.5 bg-background rounded-md border border-border">
                                                                    <DocumentTextIcon className="w-3.5 h-3.5 text-muted-foreground"/>
                                                                </div>
                                                                <span className="text-xs font-mono font-medium truncate text-foreground/80 max-w-[120px]">{file.file_name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button 
                                                                    onClick={() => handlePreview(doc.id, file.storage_path, file.file_name)} 
                                                                    disabled={isFetchingThis}
                                                                    className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all disabled:opacity-50"
                                                                    title="View Document"
                                                                >
                                                                    {isFetchingThis ? <Spinner size="sm"/> : <EyeIcon className="w-4 h-4"/>}
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDownload(doc.id, file.storage_path, file.file_name)} 
                                                                    disabled={isFetchingThis}
                                                                    className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all disabled:opacity-50"
                                                                    title="Download Document"
                                                                >
                                                                    {isFetchingThis ? <Spinner size="sm"/> : <DownloadIcon className="w-4 h-4"/>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground italic text-center py-3 bg-muted/10 rounded-lg border border-dashed border-border">Pending Upload</div>
                                                    )}
                                                </div>

                                                {doc.status === 'Submitted' && file ? (
                                                    <div className="grid grid-cols-2 gap-2 mt-auto pl-2 pt-2 border-t border-border/50">
                                                        <button onClick={()=>updateDoc(doc.id, 'Accepted')} className="py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-1 active:scale-95">
                                                            <CheckCircleIcon className="w-3.5 h-3.5"/> Approve
                                                        </button>
                                                        <button onClick={()=>updateDoc(doc.id, 'Rejected')} className="py-2.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors border border-red-200 flex items-center justify-center gap-1 active:scale-95">
                                                            <XCircleIcon className="w-3.5 h-3.5"/> Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="mt-auto pl-2 pt-2 border-t border-border/50 h-9 flex items-center justify-center">
                                                        <p className="text-[10px] font-medium text-muted-foreground opacity-60 uppercase tracking-widest">{doc.status === 'Accepted' ? 'Verified' : doc.status === 'Rejected' ? 'Rejected' : 'Waiting for upload'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            }
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-6 border-t border-border bg-card flex flex-col sm:flex-row justify-between items-center gap-4 z-30 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] sticky bottom-0">
                            <div className="text-xs text-muted-foreground font-medium text-center sm:text-left hidden sm:block">
                                <span className="font-bold text-foreground">Action Required:</span> Review all documents before final approval.
                            </div>
                            <div className="flex w-full sm:w-auto gap-3">
                                {application.status !== 'Approved' && (
                                    <>
                                        <button 
                                            onClick={()=>handleActionTrigger('Reject')} 
                                            disabled={processing} 
                                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={()=>handleActionTrigger('Approve')} 
                                            disabled={processing} 
                                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            {processing ? <Spinner size="sm" className="text-white"/> : <><CheckCircleIcon className="w-5 h-5"/> Approve Admission</>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmedAction}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.type === 'Reject' ? 'Yes, Reject' : 'Yes, Proceed'}
                loading={processing}
            />

            {reqModal && <RequestDocumentsModal admissionId={application.id} applicantName={application.applicant_name} onClose={()=>setReqModal(false)} onSuccess={()=>{setReqModal(false); fetchDocsData(); }} />}
            {previewConfig && <PreviewModal url={previewConfig.url} fileName={previewConfig.fileName} onClose={()=>setPreviewConfig(null)} />}
        </div>
    );
};

// --- Main Tab ---

const AdmissionsTab: React.FC<{ branchId?: number | null }> = ({ branchId }) => {
    const [applicants, setApplicants] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingApp, setViewingApp] = useState<AdmissionApplication | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    
    const stats = {
        total: applicants.length,
        pending: applicants.filter(a => a.status === 'Pending Review').length,
        docsReq: applicants.filter(a => a.status === 'Documents Requested').length,
        approved: applicants.filter(a => a.status === 'Approved').length
    };

    const fetchApplicants = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const { data } = await supabase.rpc('get_admissions', { p_branch_id: branchId });
            if (data) {
                setApplicants((data as AdmissionApplication[]).sort((a,b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

    const filteredApps = applicants.filter(app => filterStatus === 'All' || app.status === filterStatus);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div>
                <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">Applications</h2>
                <p className="text-muted-foreground mt-2 text-lg">Process new student admissions and verify documents.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Applications" value={stats.total} icon={<UsersIcon className="w-6 h-6"/>} color="bg-blue-500" />
                <KPICard title="Action Needed" value={stats.pending} icon={<ClockIcon className="w-6 h-6"/>} color="bg-amber-500" />
                <KPICard title="Docs Review" value={stats.docsReq} icon={<DocumentTextIcon className="w-6 h-6"/>} color="bg-purple-500" />
                <KPICard title="Admitted" value={stats.approved} icon={<CheckCircleIcon className="w-6 h-6"/>} color="bg-emerald-500" />
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-5 border-b border-border bg-muted/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FilterIcon className="w-4 h-4 text-muted-foreground"/>
                        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer">
                            <option value="All">All Statuses</option>
                            <option value="Pending Review">Pending Review</option>
                            <option value="Documents Requested">Docs Requested</option>
                            <option value="Approved">Approved</option>
                        </select>
                    </div>
                    {filteredApps.length > 0 && <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">{filteredApps.length} Results</span>}
                </div>

                {loading ? <div className="flex-grow flex items-center justify-center"><Spinner size="lg"/></div> : 
                 filteredApps.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-10">
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4"><UsersIcon className="w-10 h-10 opacity-20"/></div>
                        <p className="font-medium text-lg">No applications found.</p>
                    </div>
                 ) : (
                    <>
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-muted/30 border-b border-border text-xs font-bold uppercase text-muted-foreground">
                                    <tr>
                                        <th className="p-6 pl-8">Applicant</th>
                                        <th className="p-6">Parent</th>
                                        <th className="p-6">Date</th>
                                        <th className="p-6">Status</th>
                                        <th className="p-6 text-right pr-8">Review</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredApps.map(app => (
                                        <tr key={app.id} onClick={()=>setViewingApp(app)} className="hover:bg-muted/20 transition-colors cursor-pointer group">
                                            <td className="p-6 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border-2 border-background shadow-sm">
                                                        {app.applicant_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">{app.applicant_name}</p>
                                                        <p className="text-xs text-muted-foreground font-medium">Grade {app.grade}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-medium text-foreground">{app.parent_name}</p>
                                                <p className="text-xs text-muted-foreground">{app.parent_phone}</p>
                                            </td>
                                            <td className="p-6 text-muted-foreground text-xs font-medium">{new Date(app.submitted_at).toLocaleDateString()}</td>
                                            <td className="p-6"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[app.status]}`}>{app.status}</span></td>
                                            <td className="p-6 text-right pr-8"><button className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><EyeIcon className="w-5 h-5"/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="sm:hidden p-4 space-y-4">
                             {filteredApps.map(app => (
                                <div key={app.id} onClick={()=>setViewingApp(app)} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md active:scale-95 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-sm">
                                                {app.applicant_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm">{app.applicant_name}</p>
                                                <p className="text-xs text-muted-foreground">Grade {app.grade}</p>
                                            </div>
                                        </div>
                                        <button className="p-2 rounded-full bg-muted/50 text-muted-foreground"><ChevronRightIcon className="w-4 h-4"/></button>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-border/50">
                                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[app.status]}`}>{app.status}</span>
                                         <span className="text-muted-foreground">{new Date(app.submitted_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                             ))}
                        </div>
                    </>
                 )
                }
            </div>
            {viewingApp && <AdmissionDetailModal application={viewingApp} onClose={() => setViewingApp(null)} onUpdate={fetchApplicants} />}
        </div>
    );
};

export default AdmissionsTab;
