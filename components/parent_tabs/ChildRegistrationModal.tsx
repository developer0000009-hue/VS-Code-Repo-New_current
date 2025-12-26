import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { AdmissionApplication } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { UserIcon } from '../icons/UserIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import CustomSelect from '../common/CustomSelect';
import PremiumAvatar from '../common/PremiumAvatar';

/**
 * Enterprise-grade Error Resolver.
 * Strips recursive pointers and ensures only primitive string payloads reach the UI state.
 */
const resolveSyncError = (err: any): string => {
    if (!err) return "Identity synchronization protocol failed.";
    if (typeof err === 'string') {
        return (err === "[object Object]" || err === "{}") ? "Protocol failure." : err;
    }
    const rawMessage = err.message || err.error_description || err.details || err.hint || err.error;
    if (typeof rawMessage === 'string' && rawMessage.trim() !== "" && rawMessage !== "[object Object]") {
        return rawMessage;
    }
    if (typeof rawMessage === 'object' && rawMessage !== null && rawMessage.message) {
        return String(rawMessage.message);
    }
    try {
        const fallback = JSON.stringify(err);
        return (fallback === '{}' || fallback === '[]') ? String(err) : fallback;
    } catch {
        return "Institutional node reported an unparsable exception.";
    }
};

const PremiumFloatingInput: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { label: string; icon?: React.ReactNode; isTextArea?: boolean; isSynced?: boolean }> = ({ label, icon, isTextArea, isSynced, className, ...props }) => (
    <div className="relative group w-full">
        {label && (
            <label className={`absolute left-10 top-0 -translate-y-1/2 bg-[#0a0a0c] px-2 text-[9px] font-black uppercase text-white/30 tracking-[0.3em] z-20 transition-all duration-300 group-focus-within:text-primary group-focus-within:tracking-[0.4em] ${isSynced ? 'text-primary' : ''}`}>
                {label}
            </label>
        )}
        <div className={`absolute ${isTextArea ? 'top-6' : 'top-1/2 -translate-y-1/2'} left-5 text-white/10 group-focus-within:text-primary transition-all duration-500 z-10 pointer-events-none group-focus-within:scale-110 ${isSynced ? 'text-primary/60' : ''}`}>
            {icon}
        </div>
        {isTextArea ? (
            <textarea
                {...(props as any)}
                placeholder=" "
                className={`peer block w-full h-32 rounded-[1.8rem] border transition-all duration-500 px-6 pl-14 pt-6 pb-2 text-sm text-white font-medium bg-white/[0.01] outline-none placeholder-transparent border-white/5 hover:border-white/10 focus:border-primary/50 focus:ring-8 focus:ring-primary/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] leading-relaxed focus:bg-white/[0.03] ${className}`}
            />
        ) : (
            <input
                {...props}
                placeholder=" "
                className={`peer block w-full h-[64px] rounded-[1.5rem] border transition-all duration-500 px-6 pl-14 pt-4 pb-1 text-sm text-white font-medium bg-white/[0.01] outline-none placeholder-transparent border-white/5 hover:border-white/10 focus:border-primary/50 focus:ring-8 focus:ring-primary/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus:bg-white/[0.03] ${isSynced ? 'border-primary/40 bg-primary/5' : ''} ${className}`}
            />
        )}
    </div>
);

interface ChildRegistrationModalProps {
    child: AdmissionApplication | null;
    onClose: () => void;
    onSave: () => Promise<void> | void;
    currentUserId: string;
}

const ChildRegistrationModal: React.FC<ChildRegistrationModalProps> = ({ child, onClose, onSave, currentUserId }) => {
    const isEdit = !!child;
    const [step, setStep] = useState<'details' | 'success'>('details');
    const [formData, setFormData] = useState({
        applicant_name: child?.applicant_name || '',
        grade: child?.grade || '',
        date_of_birth: child?.date_of_birth || '',
        gender: child?.gender || 'Male',
        medical_info: child?.medical_info || '',
        emergency_contact: child?.emergency_contact || '',
    });
    
    const [parentProfile, setParentProfile] = useState<{ name: string; email: string; phone: string } | null>(null);
    const [isEmergencySynced, setIsEmergencySynced] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(child?.profile_photo_url || null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchParent = async () => {
            const { data } = await supabase.from('profiles').select('display_name, email, phone').eq('id', currentUserId).maybeSingle();
            if (data) {
                setParentProfile({
                    name: data.display_name,
                    email: data.email,
                    phone: data.phone || ''
                });
            }
        };
        fetchParent();
    }, [currentUserId]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert("Magnitude exceeds limits. Max 5MB.");
                return;
            }
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSyncEmergency = async () => {
        if (isEmergencySynced) {
            setFormData(prev => ({ ...prev, emergency_contact: '' }));
            setIsEmergencySynced(false);
            return;
        }
        if (parentProfile) {
            setFormData(prev => ({ ...prev, emergency_contact: `${parentProfile.name} / ${parentProfile.phone || 'No Phone'}` }));
            setIsEmergencySynced(true);
        }
    };

    const handleSubmitDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.applicant_name || !currentUserId) return;
        setLoading(true);
        setError(null);
        try {
            let photoUrl = photoPreview;
            if (photoFile) {
                const fileExt = photoFile.name.split('.').pop();
                const filePath = `${currentUserId}/identity/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('admission-documents').upload(filePath, photoFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('admission-documents').getPublicUrl(filePath);
                photoUrl = data.publicUrl;
            }
            const payload: any = {
                applicant_name: formData.applicant_name,
                grade: formData.grade,
                date_of_birth: formData.date_of_birth,
                gender: formData.gender,
                medical_info: formData.medical_info,
                emergency_contact: formData.emergency_contact,
                profile_photo_url: photoUrl,
                submitted_by: currentUserId,
                parent_id: currentUserId,
                parent_name: parentProfile?.name || '',
                parent_email: parentProfile?.email || '',
                parent_phone: parentProfile?.phone || '',
                status: 'Pending Review' 
            };
            if (isEdit) {
                const { error } = await supabase.from('admissions').update(payload).eq('id', child.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('admissions').insert(payload);
                if (error) throw error;
            }
            setStep('success');
        } catch (err: any) {
            setError(resolveSyncError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizeHandshake = async () => {
        setLoading(true);
        setError(null);
        try {
            await onSave();
            onClose();
        } catch (err: any) {
            setError(resolveSyncError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-4 sm:p-6 overflow-hidden animate-in fade-in duration-700" onClick={onClose}>
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div 
                className="bg-[#0a0a0c] w-full max-w-2xl sm:h-auto sm:max-h-[90vh] rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_48px_128px_-24px_rgba(0,0,0,0.95)] border border-white/10 flex flex-col relative animate-in zoom-in-95 duration-500 ring-1 ring-white/5 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* light edge effect */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>

                {step === 'details' ? (
                    <form onSubmit={handleSubmitDetails} className="flex flex-col h-full relative z-10 overflow-hidden">
                        <div className="px-6 py-6 md:px-10 md:py-8 border-b border-white/5 bg-white/[0.02] backdrop-blur-2xl flex justify-between items-center shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-[0_8px_32px_rgba(var(--primary),0.2)] ring-1 ring-primary/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <PlusIcon className="w-6 h-6"/>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tighter uppercase leading-none">Register <span className="text-white/20 italic">Child.</span></h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Identity Enrollment Node</p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="group p-2.5 rounded-full bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all shadow-xl active:scale-90 ring-1 ring-white/10"
                                title="Exit Enrollment"
                            >
                                <XIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500"/>
                            </button>
                        </div>

                        <div className="px-6 py-6 md:px-10 md:py-8 overflow-y-auto flex-grow custom-mercury-scrollbar space-y-10">
                            {error && (
                                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-xs border border-red-500/20 flex items-start gap-4 animate-in shake duration-500 shadow-2xl backdrop-blur-md">
                                    <XCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-black uppercase tracking-[0.2em] text-[9px]">Sync Protocol Exception</p>
                                        <p className="font-medium leading-relaxed opacity-80">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-4 group/avatar">
                                <div className="relative">
                                    <div className="absolute -inset-4 rounded-full border border-primary/10 border-dashed animate-spin-slow opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-1000"></div>
                                    <div className="relative z-10">
                                        <PremiumAvatar 
                                            src={photoPreview} 
                                            name={formData.applicant_name || 'C'} 
                                            size="md" 
                                            className="ring-[12px] ring-white/[0.02] border-4 border-[#0a0a0c] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] transition-transform duration-700 group-hover/avatar:scale-[1.05]"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-[0_12px_40px_rgba(var(--primary),0.5)] ring-4 ring-[#0a0a0c] hover:scale-110 hover:rotate-6 active:scale-95 transition-all z-30 group/upload"
                                            title="Initialize Scan"
                                        >
                                            <UploadIcon className="w-5 h-5 group-hover:animate-bounce"/>
                                        </button>
                                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                    </div>
                                </div>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.6em] group-hover/avatar:text-primary/60 transition-colors duration-500">Biometric Interface</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                                <PremiumFloatingInput 
                                    label="Full Legal Name" 
                                    name="applicant_name" 
                                    value={formData.applicant_name} 
                                    onChange={handleChange} 
                                    required 
                                    icon={<UserIcon className="w-4 h-4"/>} 
                                />
                                <CustomSelect 
                                    label="Academic Placement"
                                    value={formData.grade}
                                    onChange={(v) => setFormData(prev => ({ ...prev, grade: v }))}
                                    options={Array.from({length: 12}, (_, i) => ({ value: String(i + 1), label: `Grade ${i + 1}` }))}
                                    icon={<SchoolIcon className="w-4 h-4"/>}
                                    placeholder="Select Grade"
                                />
                                <PremiumFloatingInput 
                                    label="Date of Birth" 
                                    name="date_of_birth" 
                                    type="date" 
                                    value={formData.date_of_birth} 
                                    onChange={handleChange} 
                                    required 
                                    icon={<CalendarIcon className="w-4 h-4"/>} 
                                />
                                <CustomSelect 
                                    label="Gender"
                                    value={formData.gender}
                                    onChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}
                                    options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]}
                                    icon={<UserIcon className="w-4 h-4"/>}
                                />
                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse"></div>
                                            <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Safety Contact</label>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={handleSyncEmergency}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 border relative overflow-hidden group/sync
                                                ${isEmergencySynced ? 'bg-primary text-white border-primary shadow-[0_12px_24px_rgba(var(--primary),0.4)] scale-[1.03]' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            <SparklesIcon className={`w-3.5 h-3.5 ${isEmergencySynced ? 'animate-spin-slow' : 'group-hover/sync:rotate-12 transition-transform'}`} /> 
                                            {isEmergencySynced ? 'Synced' : 'Use My Data'}
                                        </button>
                                    </div>
                                    <PremiumFloatingInput 
                                        label="" 
                                        name="emergency_contact" 
                                        value={formData.emergency_contact} 
                                        onChange={handleChange} 
                                        isSynced={isEmergencySynced} 
                                        icon={<PhoneIcon className="w-4 h-4"/>} 
                                        placeholder="Guardian Name / Secure Line" 
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex items-center gap-3 px-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]"></div>
                                        <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Clinical Disclosures</label>
                                    </div>
                                    <PremiumFloatingInput 
                                        label="" 
                                        name="medical_info" 
                                        value={formData.medical_info} 
                                        onChange={handleChange} 
                                        isTextArea 
                                        icon={<InfoIcon className="w-4 h-4"/>} 
                                        placeholder="Define Allergies or Requirements..." 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-6 md:px-10 md:py-8 border-t border-white/5 bg-white/[0.02] backdrop-blur-3xl flex flex-col sm:flex-row justify-between items-center gap-6 shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none opacity-50"></div>
                            <button 
                                type="button" 
                                onClick={onClose} 
                                disabled={loading} 
                                className="text-[11px] font-black text-white/20 hover:text-white transition-all uppercase tracking-[0.5em] order-2 sm:order-1 active:scale-95 disabled:opacity-20 relative z-10"
                            >
                                Discard Protocol
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading || !formData.applicant_name} 
                                className="relative z-10 w-full sm:w-auto px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-[0_24px_64px_-12px_rgba(var(--primary),0.6)] hover:bg-primary/90 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 group transform active:scale-95 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none order-1 sm:order-2 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                                {loading ? <Spinner size="sm" className="text-white"/> : <><CheckCircleIcon className="w-5 h-5"/> Initialize Enrollment</>}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-10 md:p-20 text-center space-y-12 animate-in zoom-in-95 duration-1000 h-full flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.1),transparent_70%)] animate-pulse"></div>
                        <div className="relative w-28 h-28 md:w-40 md:h-40">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse opacity-50"></div>
                            <div className="relative w-full h-full bg-[#13151b] rounded-3xl md:rounded-[3rem] flex items-center justify-center border border-emerald-500/40 shadow-3xl ring-[8px] ring-emerald-500/5 transition-transform duration-1000 hover:scale-105">
                                <CheckCircleIcon className="w-16 h-16 md:w-24 md:h-24 text-emerald-500 animate-in zoom-in-50 duration-700 animate-bounce-subtle" />
                            </div>
                        </div>
                        <div className="space-y-6 relative z-10">
                            <h2 className="text-3xl md:text-6xl font-serif font-black text-white tracking-tighter uppercase leading-none">Registry <span className="text-white/20 italic">Updated.</span></h2>
                            <p className="text-white/40 text-base md:text-xl leading-relaxed max-w-sm mx-auto font-serif italic border-l-2 border-emerald-500/30 pl-6 text-left">The enrollment protocol for <strong className="text-white">{formData.applicant_name}</strong> has been successfully integrated into the institutional cluster.</p>
                        </div>
                        <button 
                            onClick={handleFinalizeHandshake} 
                            disabled={loading}
                            className="relative z-10 w-full max-w-sm py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.5em] rounded-[1.8rem] shadow-[0_32px_80px_-16px_rgba(16,185,129,0.5)] transition-all active:scale-95 hover:-translate-y-1.5 flex items-center justify-center gap-4 group ring-1 ring-white/10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none"></div>
                            {loading ? <Spinner size="sm" className="text-white"/> : 'Finalize Handshake'}
                        </button>
                    </div>
                )}
            </div>
            
            <style>{`
                /* Premium Mercury Scrollbar */
                .custom-mercury-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-mercury-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                    margin: 20px;
                }
                .custom-mercury-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.04);
                    border-radius: 10px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                .custom-mercury-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--primary), 0.3);
                    background-clip: content-box;
                }

                @keyframes shine {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
                .animate-spin-slow {
                    animation: spin 12s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ChildRegistrationModal;