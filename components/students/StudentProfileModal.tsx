import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { StudentForAdmin, SchoolClass, Course } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { UserIcon } from '../icons/UserIcon';
import { MailIcon } from '../icons/MailIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { CreditCardIcon } from '../icons/CreditCardIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { EditIcon } from '../icons/EditIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { LocationIcon } from '../icons/LocationIcon';
import { BookIcon } from '../icons/BookIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { PrinterIcon } from '../icons/PrinterIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { MenuIcon } from '../icons/MenuIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { LockIcon } from '../icons/LockIcon';
import { KeyIcon } from '../icons/KeyIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ReceiptIcon } from '../icons/ReceiptIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import CustomSelect from '../common/CustomSelect';
import RecordPaymentModal from '../finance/RecordPaymentModal';

interface StudentProfileModalProps {
    student: StudentForAdmin;
    onClose: () => void;
    onUpdate: () => void;
    initialTab?: TabType;
}

type TabType = 'overview' | 'parents' | 'academic' | 'documents' | 'fees' | 'history';

// --- SUB-COMPONENTS ---

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount || 0);
};

const DocumentCard: React.FC<{ 
    doc: any, 
    // FIX: Changed docId from number to string to match UUID format.
    onVerify: (id: string) => void, 
    onReject: (id: string) => void,
    onView: (path: string) => void
}> = ({ 
    doc, 
    onVerify, 
    onReject, 
    onView 
}) => {
    const status = doc.status || 'Pending';
    const file = doc.admission_documents?.[0];
    
    const getStatusStyle = (s: string) => {
        switch(s) {
            case 'Verified': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]';
            case 'Submitted': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'Rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        }
    };

    return (
        <div className="group relative bg-[#0f1115] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 flex flex-col h-full overflow-hidden">
            {/* Ambient Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 ${status === 'Verified' ? 'from-emerald-500/10' : 'from-blue-500/10'}`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 rounded-xl bg-[#1a1d23] text-white/50 group-hover:text-white group-hover:bg-[#252830] transition-colors border border-white/5 shadow-inner">
                    <FileTextIcon className="w-6 h-6"/>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getStatusStyle(status)} backdrop-blur-sm`}>
                    {status}
                </span>
            </div>
            
            <div className="flex-grow relative z-10">
                <h4 className="font-bold text-white text-sm line-clamp-1 leading-relaxed" title={doc.document_name}>{doc.document_name}</h4>
                {file ? (
                    <p className="text-[11px] text-white/40 mt-1 font-mono flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5"/> {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                ) : (
                    <p className="text-[11px] text-white/20 mt-1 italic">Pending Upload</p>
                )}
                {doc.rejection_reason && (
                    <p className="text-[10px] text-red-400 mt-2 bg-red-500/5 border border-red-500/10 p-2 rounded-lg">
                        Reason: {doc.rejection_reason}
                    </p>
                )}
            </div>

            {file && (
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2 relative z-10">
                    <button 
                        onClick={() => onView(file.storage_path)}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 border border-transparent hover:border-white/10"
                    >
                        <EyeIcon className="w-3.5 h-3.5"/> View
                    </button>
                    
                    {status !== 'Verified' && (
                         <div className="flex gap-2">
                             <button 
                                onClick={() => onVerify(doc.id)} 
                                className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all hover:scale-105 active:scale-95" 
                                title="Verify Document"
                            >
                                 <CheckCircleIcon className="w-4 h-4"/>
                             </button>
                             <button 
                                onClick={() => onReject(doc.id)} 
                                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all hover:scale-105 active:scale-95" 
                                title="Reject Document"
                            >
                                 <XCircleIcon className="w-4 h-4"/>
                             </button>
                         </div>
                    )}
                </div>
            )}
        </div>
    )
}

const GuardianEditModal: React.FC<{
    type: 'primary' | 'secondary';
    initialData: any;
    parentId?: string;
    onClose: () => void;
    onSave: () => void;
}> = ({ type, initialData, parentId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        relationship: initialData?.relationship || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (type === 'primary' && parentId) {
                 const { error: pError } = await supabase.from('profiles').update({
                     display_name: formData.name,
                     email: formData.email,
                     phone: formData.phone
                 }).eq('id', parentId);
                 if (pError) throw pError;
                 
                 const { error: ppError } = await supabase.from('parent_profiles').update({
                     relationship_to_student: formData.relationship
                 }).eq('user_id', parentId);
                 if (ppError) throw ppError;

            } else if (type === 'secondary' && parentId) {
                const { error } = await supabase.from('parent_profiles').update({
                    secondary_parent_name: formData.name,
                    secondary_parent_email: formData.email,
                    secondary_parent_phone: formData.phone,
                    secondary_parent_relationship: formData.relationship
                }).eq('user_id', parentId);
                if (error) throw error;
            }
            onSave();
        } catch (err: any) {
            alert("Error updating guardian: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95" onClick={onClose}>
            <div className="bg-[#13151b] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 p-8 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none"><UsersIcon className="w-32 h-32"/></div>
                
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="font-bold text-xl text-white font-serif tracking-tight">Edit {type === 'primary' ? 'Primary' : 'Secondary'} Guardian</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-5 h-5 text-white/50 hover:text-white"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Full Name</label>
                        <input className="w-full p-4 rounded-2xl border border-white/10 bg-black/20 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Relationship</label>
                        <input className="w-full p-4 rounded-2xl border border-white/10 bg-black/20 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all font-medium" value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} />
                    </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Email</label>
                        <input className="w-full p-4 rounded-2xl border border-white/10 bg-black/20 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Phone</label>
                        <input className="w-full p-4 rounded-2xl border border-white/10 bg-black/20 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors uppercase tracking-wider">Cancel</button>
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 flex items-center gap-2 transition-all uppercase tracking-wider hover:-translate-y-0.5">
                            {loading && <Spinner size="sm" className="text-white"/>} Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LifecycleStepper: React.FC<{ 
    isApproved: boolean, 
    isRegistered: boolean, 
    isActive: boolean, 
    classId?: string | null,
    className?: string | null,
    hasAvailableMappings: boolean
}> = ({ isApproved, isRegistered, isActive, classId, className, hasAvailableMappings }) => {
    const isPlacementComplete = !!(classId && className && className !== 'UNASSIGNED' && className !== 'PENDING' && className !== 'PLACEMENT PENDING');
    const steps = [{ label: 'ADMISSION', status: isApproved ? 'complete' : 'pending', sub: 'Verified' }, { label: 'REGISTRATION', status: isRegistered ? 'complete' : (isApproved ? 'current' : 'pending'), sub: 'Profile' }, { label: 'ACTIVE', status: isActive ? 'complete' : (isRegistered ? 'current' : 'pending'), sub: 'Enrolled' }, { label: 'PLACEMENT', status: isPlacementComplete ? 'complete' : (isActive ? 'current' : 'pending'), sub: isPlacementComplete ? className : (hasAvailableMappings ? 'Ready' : 'Pending') }];
    const completedCount = steps.filter(s => s.status === 'complete').length;
    const progressPercent = Math.max(0, Math.min(100, (completedCount / (steps.length - 1)) * 100));

    return (
        <div className="w-full relative py-4">
             <div className="flex flex-col md:flex-row md:items-center justify-between w-full px-6 py-8 md:px-8 bg-[#13151b] rounded-3xl md:rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl shadow-black/50">
                <div className="hidden md:block absolute top-[46px] left-16 right-16 h-[2px] bg-white/5 rounded-full z-0"></div>
                <div className="hidden md:block absolute top-[46px] left-16 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 z-0 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.6)]" style={{ width: `calc(${progressPercent}% - 4rem)` }}></div>
                <div className="md:hidden absolute left-10 top-16 bottom-16 w-[2px] bg-white/5 rounded-full z-0"></div>
                <div className="md:hidden absolute left-10 top-16 w-[2px] bg-gradient-to-b from-emerald-500 via-teal-400 to-indigo-500 z-0 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.6)]" style={{ height: `calc(${progressPercent}% - 3rem)` }}></div>
                {steps.map((step, idx) => (
                    <div key={idx} className="flex md:flex-col items-center relative z-10 flex-1 group mb-8 md:mb-0 last:mb-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative flex-shrink-0 z-10 ${step.status === 'complete' ? 'bg-[#0f1115] border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : step.status === 'current' ? 'bg-[#0f1115] border-indigo-500 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110' : 'bg-[#1a1d23] border-white/10 text-white/20'}`}>
                            {step.status === 'complete' ? <CheckCircleIcon className="w-5 h-5" /> : step.status === 'current' ? <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse" /> : <div className="w-2 h-2 bg-white/20 rounded-full" />}
                        </div>
                        <div className="ml-4 md:ml-0 md:mt-4 text-left md:text-center transition-all duration-300 transform group-hover:translate-x-1 md:group-hover:translate-x-0 md:group-hover:translate-y-[-2px]">
                            <span className={`block text-[10px] font-black uppercase tracking-[0.25em] mb-0.5 ${step.status === 'complete' ? 'text-emerald-500' : step.status === 'current' ? 'text-indigo-400' : 'text-white/30'}`}>{step.label}</span>
                            <span className={`text-[9px] font-medium tracking-wide ${step.status === 'complete' ? 'text-white/60' : step.status === 'current' ? 'text-white/90' : 'text-white/10'}`}>{step.sub}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DigitalIdCard: React.FC<{ student: StudentForAdmin }> = ({ student }) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const verificationData = encodeURIComponent(JSON.stringify({ id: student.student_id_number || student.id, name: student.display_name, valid: student.is_active }));
    const qrUrl = `https://quickchart.io/qr?text=${verificationData}&size=200&margin=1&ecLevel=H&format=png`;
    const handlePrint = useCallback(() => { setIsPrinting(true); setTimeout(() => { window.print(); setIsPrinting(false); }, 100); }, []);

    return (
        <div className="flex flex-col items-center gap-6">
             <style>{`@media print { @page { size: auto; margin: 0; } body { background-color: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body * { visibility: hidden; } #id-card-print-container, #id-card-print-container * { visibility: visible; } #id-card-print-container { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 320px; height: 520px; box