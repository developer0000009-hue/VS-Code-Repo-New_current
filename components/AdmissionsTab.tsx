import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { AdmissionApplication, AdmissionStatus } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SchoolIcon } from './icons/SchoolIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ClockIcon } from './icons/ClockIcon';
import { FilterIcon } from './icons/FilterIcon';
import { UsersIcon } from './icons/UsersIcon';
// Fix: Added missing AlertTriangleIcon import
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

const statusColors: { [key: string]: string } = {
  'Pending Review': 'bg-amber-50/10 text-amber-600 border-amber-200 dark:border-amber-800',
  'Documents Requested': 'bg-blue-50/10 text-blue-600 border-blue-200 dark:border-blue-800',
  'Approved': 'bg-emerald-50/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
  'Rejected': 'bg-red-50/10 text-red-600 border-red-200 dark:border-red-800',
};

// Fix: Component defined and exported to satisfy import requirements in EnquiryDetailsModal.tsx.
// Facilitates administrative requests for specific verification documentation.
export const RequestDocumentsModal: React.FC<{
    admissionId: number;
    applicantName: string;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ admissionId, applicantName, onClose, onSuccess }) => {
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const docOptions = [
        "Birth Certificate",
        "Identity Proof (Aadhar/Passport)",
        "Previous Year Report Card",
        "Transfer Certificate",
        "Vaccination Records",
        "Address Proof"
    ];

    const toggleDoc = (doc: string) => {
        setSelectedDocs(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
    };

    const handleRequest = async () => {
        if (selectedDocs.length === 0) return alert("Select at least one document.");
        setLoading(true);
        try {
            const { error } = await supabase.rpc('admin_request_documents', {
                p_admission_id: admissionId,
                p_documents: selectedDocs,
                p_message: message
            });
            if (error) throw error;
            onSuccess();
        } catch (err: any) {
            alert(err.message || "Failed to dispatch document request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-foreground">Request Verification</h3>
                        <p className="text-xs text-muted-foreground mt-1">Target: {applicantName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><XIcon className="w-5 h-5 text-muted-foreground"/></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Required Assets</label>
                        <div className="grid grid-cols-1 gap-2">
                            {docOptions.map(doc => (
                                <button key={doc} onClick={() => toggleDoc(doc)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-sm font-medium ${selectedDocs.includes(doc) ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-background border-border text-muted-foreground hover:border-primary/40'}`}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedDocs.includes(doc) ? 'bg-primary border-primary' : 'border-border'}`}>
                                        {selectedDocs.includes(doc) && <CheckCircleIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    {doc}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Contextual Instructions</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full p-3 bg-muted/30 border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none h-20 resize-none transition-all focus:bg-background text-foreground" placeholder="Describe the specifics of the required documents..."/>
                    </div>
                </div>
                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                    <button onClick={handleRequest} disabled={loading || selectedDocs.length === 0} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
                        {loading ? <Spinner size="sm" className="text-current"/> : 'Dispatch Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdmissionsTab: React.FC<{ branchId?: number | null }> = ({ branchId }) => {
    const [applicants, setApplicants] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    
    const fetchApplicants = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const { data } = await supabase.rpc('get_admissions', { p_branch_id: branchId });
            if (data) setApplicants(data as AdmissionApplication[]);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

    const filteredApps = applicants.filter(app => filterStatus === 'All' || app.status === filterStatus);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-serif font-black text-foreground tracking-tight">Admission Vault</h2>
                    <p className="text-muted-foreground text-sm md:text-base mt-1">Lifecycle management for student enrollment nodes.</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl md:rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 md:p-6 border-b border-border bg-muted/5 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-xl border border-border shadow-inner">
                        <FilterIcon className="w-4 h-4 text-muted-foreground"/>
                        <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)} 
                            className="bg-transparent text-xs md:text-sm font-bold text-foreground focus:outline-none cursor-pointer"
                        >
                            <option value="All">Global Roster</option>
                            <option value="Pending Review">Pending Review</option>
                            <option value="Documents Requested">Docs Requested</option>
                            <option value="Approved">Verified Status</option>
                        </select>
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{filteredApps.length} Identities Loaded</span>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20"><Spinner size="lg" /></div>
                ) : filteredApps.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground italic">No identity blocks found matching filter.</div>
                ) : (
                    <div className="overflow-x-auto w-full custom-scrollbar">
                        <table className="w-full text-left text-sm min-w-[700px]">
                            <thead className="bg-muted/30 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                <tr>
                                    <th className="p-4 md:p-6 pl-8">Applicant Profile</th>
                                    <th className="p-4 md:p-6">Parent Link</th>
                                    <th className="p-4 md:p-6">Registry Date</th>
                                    <th className="p-4 md:p-6">Lifecycle Status</th>
                                    <th className="p-4 md:p-6 text-right pr-8">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredApps.map(app => (
                                    <tr key={app.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="p-4 md:p-6 pl-8">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm md:text-base border border-primary/20 shadow-inner">
                                                    {app.applicant_name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-foreground truncate group-hover:text-primary transition-colors">{app.applicant_name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Grade {app.grade} Block</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <p className="font-bold text-foreground/80">{app.parent_name}</p>
                                            <p className="text-[10px] font-medium text-muted-foreground">{app.parent_phone}</p>
                                        </td>
                                        <td className="p-4 md:p-6 font-mono text-[11px] text-muted-foreground">{new Date(app.submitted_at).toLocaleDateString()}</td>
                                        <td className="p-4 md:p-6">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-wider ${statusColors[app.status]}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="p-4 md:p-6 text-right pr-8">
                                            <button className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all active:scale-90">
                                                <EyeIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdmissionsTab;