import React, { useState, useEffect, useCallback } from 'react';
import { supabase, formatError } from './services/supabase';
import { AdmissionApplication, AdmissionStatus } from './types';
import Spinner from './components/common/Spinner';
import { XIcon } from './components/icons/XIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { EyeIcon } from './components/icons/EyeIcon';
import { ClockIcon } from './components/icons/ClockIcon';
import { FilterIcon } from './components/icons/FilterIcon';
import { AlertTriangleIcon } from './components/icons/AlertTriangleIcon';
import { RefreshIcon } from './components/icons/RefreshIcon';
import AdmissionDetailsModal from './components/admin/AdmissionDetailsModal';
import PremiumAvatar from './components/common/PremiumAvatar';

const statusColors: Record<string, string> = {
  'Registered': 'bg-slate-500/10 text-slate-400 border-white/5',
  'Pending Review': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Verified': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Approved': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black shadow-[0_0_10px_rgba(16,185,129,0.1)]',
  'Rejected': 'bg-rose-500/10 text-red-500 border-rose-500/20',
  'Cancelled': 'bg-zinc-500/10 text-zinc-500 border-white/5',
};

const formatStatus = (s: string) => s === 'Approved' ? 'Admitted' : s;

export const RequestDocumentsModal: React.FC<{
    admissionId: string;
    applicantName: string;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ admissionId, applicantName, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const docOptions = [
        "Birth Certificate",
        "Previous School Transfer Certificate",
        "Passport / Identity Proof",
        "Immunization Records",
        "Recent Passport Photo"
    ];

    const toggleDoc = (doc: string) => {
        setSelectedDocs(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
    };

    const handleSelectAll = () => {
        if (selectedDocs.length === docOptions.length) setSelectedDocs([]);
        else setSelectedDocs(docOptions);
    };

    const handleSendRequest = async () => {
        if (selectedDocs.length === 0) {
            setStatus({ type: 'error', message: 'Selection Required: At least one document must be requested.' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const { error } = await supabase.rpc('admin_request_documents', {
                p_admission_id: admissionId,
                p_documents: selectedDocs,
                p_message: message
            });

            if (error) throw error;

            setStatus({ type: 'success', message: 'Request Transmitted: Identity verification cycle initialized.' });
            
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1800);

        } catch (err: any) {
            setStatus({ type: 'error', message: `Uplink Failure: ${formatError(err)}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[400] p-4" onClick={onClose}>
            <div className="bg-[#0c0d12] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <DocumentTextIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Request Artifacts</h3>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Verification Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-white/30 hover:text-white">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-8">
                    {status && (
                        <div className={`p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 border ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            {status.type === 'success' ? <CheckCircleIcon className="w-6 h-6 shrink-0"/> : <AlertTriangleIcon className="w-6 h-6 shrink-0" />}
                            <p className="text-xs font-bold uppercase tracking-wide leading-relaxed">{status.message}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-xs font-serif italic text-white/40 leading-relaxed">
                                Request specific identities for <strong className="text-white not-italic">{applicantName}</strong>'s node.
                            </p>
                            <button onClick={handleSelectAll} className="text-[9px] font-black uppercase text-primary tracking-widest hover:underline">
                                {selectedDocs.length === docOptions.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        