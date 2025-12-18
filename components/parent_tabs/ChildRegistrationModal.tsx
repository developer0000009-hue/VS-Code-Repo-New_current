
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { AdmissionApplication, DocumentRequirement } from '../../types';
import Spinner from '../common/Spinner';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { IdCardIcon } from '../icons/IdCardIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { UserIcon } from '../icons/UserIcon';

// --- Icons ---
const CopyIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1-2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
    </svg>
);

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const PhotoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

// --- Constants ---
const STANDARD_DOCS = [
    { name: "Birth Certificate", icon: <DocumentTextIcon className="w-5 h-5" />, required: true },
    { name: "Student Photograph", icon: <PhotoIcon className="w-5 h-5" />, required: true },
    { name: "Parent ID Proof", icon: <IdCardIcon className="w-5 h-5" />, required: true },
    { name: "Previous School Report Card", icon: <DocumentTextIcon className="w-5 h-5" />, required: false },
    { name: "Transfer Certificate", icon: <DocumentTextIcon className="w-5 h-5" />, required: false },
    { name: "Address Proof", icon: <DocumentTextIcon className="w-5 h-5" />, required: false },
];

// --- Sub-Component: Smart Document Card ---
interface SmartDocumentCardProps {
    label: string;
    icon: React.ReactNode;
    admissionId: number;
    isRequired?: boolean;
    existingReq?: DocumentRequirement;
    onUploadComplete: () => void;
}

const SmartDocumentCard: React.FC<SmartDocumentCardProps> = ({ label, icon, admissionId, isRequired, existingReq, onUploadComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentStatus = existingReq?.status || 'Pending';
    const isApproved = currentStatus === 'Accepted';
    const isRejected = currentStatus === 'Rejected';
    const displayStatus = status === 'success' ? 'Submitted' : currentStatus;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            
            if (selectedFile.size > 5 * 1024 * 1024) { 
                alert("File too large. Max size is 5MB.");
                return;
            }

            setFile(selectedFile);
            setStatus('uploading');
            setProgress(0);

            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("User not authenticated");

                const fileExt = selectedFile.name.split('.').pop();
                const safeDocName = label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                const storagePath = `${user.id}/${admissionId}/${safeDocName}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage.from('admission-documents').upload(storagePath, selectedFile);
                if (uploadError) throw uploadError;

                const { error: rpcError } = await supabase.rpc('submit_unsolicited_document', {
                    p_admission_id: admissionId,
                    p_document_name: label,
                    p_file_name: selectedFile.name,
                    p_storage_path: storagePath
                });

                if (rpcError) throw rpcError;

                clearInterval(interval);
                setProgress(100);
                setStatus('success');
                onUploadComplete();

            } catch (err) {
                console.error(err);
                clearInterval(interval);
                setStatus('error');
            }
        }
    };

    const handleTrigger = () => {
        if (isApproved) return;
        inputRef.current?.click();
    };

    return (
        <div className={`
            relative p-4 rounded-xl border-2 transition-all duration-300 group overflow-hidden
            ${isApproved ? 'border-emerald-500/20 bg-emerald-50/30' : 
              isRejected ? 'border-red-500/20 bg-red-50/30' :
              displayStatus === 'Submitted' ? 'border-blue-500/20 bg-blue-50/30' :
              'border-dashed border-border hover:border-primary/50 hover:bg-muted/30'}
        `}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg transition-colors 
                        ${isApproved ? 'bg-emerald-100 text-emerald-600' : 
                          isRejected ? 'bg-red-100 text-red-600' :
                          displayStatus === 'Submitted' ? 'bg-blue-100 text-blue-600' :
                          'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'}`}>
                        {icon}
                    </div>
                    <div>
                        <p className={`text-sm font-bold flex items-center gap-2 ${isApproved ? 'text-emerald-700' : 'text-foreground'}`}>
                            {label} 
                            {isRequired && !isApproved && <span className="text-red-500 text-xs bg-red-100 px-1.5 py-0.5 rounded-full">Required</span>}
                        </p>
                        
                        {isApproved && <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Approved & Locked</p>}
                        {isRejected && <p className="text-xs text-red-600 font-medium mt-0.5 flex items-center gap-1"><XCircleIcon className="w-3 h-3"/> Rejected: {existingReq?.rejection_reason}</p>}
                        {displayStatus === 'Submitted' && !isApproved && !isRejected && <p className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Under Review</p>}
                        {displayStatus === 'Pending' && <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, PNG • Max 5MB</p>}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {status === 'uploading' ? (
                        <span className="text-xs font-bold text-primary animate-pulse">Uploading...</span>
                    ) : isApproved ? (
                        <span className="p-1.5 rounded-full bg-emerald-100 text-emerald-600"><CheckIcon className="w-4 h-4" /></span>
                    ) : (
                        <button 
                            type="button" 
                            onClick={handleTrigger}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors 
                                ${isRejected ? 'text-red-600 border-red-200 hover:bg-red-50' : 
                                  displayStatus === 'Submitted' ? 'text-muted-foreground border-border hover:text-primary hover:border-primary' : 
                                  'text-primary border-primary/20 hover:bg-primary/10'}`}
                        >
                            {isRejected ? 'Re-upload' : displayStatus === 'Submitted' ? 'Replace' : 'Upload'}
                        </button>
                    )}
                </div>
            </div>

            {status === 'uploading' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden rounded-b-xl">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            <input ref={inputRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
        </div>
    );
};

interface ChildRegistrationModalProps {
    child: AdmissionApplication | null;
    onClose: () => void;
    onSave: () => void;
    currentUserId: string;
}

const ChildRegistrationModal: React.FC<ChildRegistrationModalProps> = ({ child, onClose, onSave, currentUserId }) => {
    const [step, setStep] = useState<'details' | 'documents' | 'success'>('details');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    
    const [formData, setFormData] = useState({
        applicant_name: '', grade: '', date_of_birth: '', gender: '', medical_info: '', emergency_contact: '',
    });
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(child?.profile_photo_url || null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parentContactInfo, setParentContactInfo] = useState<string>('');
    const [currentAdmissionId, setCurrentAdmissionId] = useState<number | null>(child?.id || null);

    const [fetchedRequirements, setFetchedRequirements] = useState<DocumentRequirement[]>([]);
    const [customDocName, setCustomDocName] = useState('');
    const [refreshDocsTrigger, setRefreshDocsTrigger] = useState(0);

    useEffect(() => {
        if (child) {
            setFormData({
                applicant_name: child.applicant_name || '',
                grade: child.grade || '',
                date_of_birth: child.date_of_birth ? new Date(child.date_of_birth).toISOString().split('T')[0] : '',
                gender: child.gender || '',
                medical_info: child.medical_info || '',
                emergency_contact: child.emergency_contact || '',
            });
            setCurrentAdmissionId(child.id);
        }

        const fetchParentInfo = async () => {
            if (!currentUserId) return;
            const [profileRes, parentProfileRes] = await Promise.all([
                supabase.from('profiles').select('display_name, phone').eq('id', currentUserId).single(),
                supabase.from('parent_profiles').select('relationship_to_student, secondary_parent_name, secondary_parent_relationship, secondary_parent_phone').eq('user_id', currentUserId).single()
            ]);

            if (profileRes.data) {
                const mainProfile = profileRes.data;
                const parentProfile = parentProfileRes.data; 
                let contactString = `Primary: ${mainProfile.display_name} (${parentProfile?.relationship_to_student || 'Guardian'}), Phone: ${mainProfile.phone || 'N/A'}`;
                if (parentProfile?.secondary_parent_name) {
                    contactString += `\nSecondary: ${parentProfile.secondary_parent_name} (${parentProfile.secondary_parent_relationship || 'Guardian'}), Phone: ${parentProfile.secondary_parent_phone || 'N/A'}`;
                }
                setParentContactInfo(contactString);
            }
        };
        fetchParentInfo();
    }, [child, currentUserId]);

    useEffect(() => {
        if (step === 'documents' && currentAdmissionId) {
            const fetchDocs = async () => {
                const { data, error } = await supabase.rpc('parent_get_document_requirements');
                if (!error && data) {
                    const relevantDocs = (data as any[]).filter(d => d.admission_id === currentAdmissionId);
                    setFetchedRequirements(relevantDocs);
                }
            };
            fetchDocs();
        }
    }, [step, currentAdmissionId, refreshDocsTrigger]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePhotoFile(e.target.files[0]);
            setProfilePhotoUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        let finalPhotoUrl = child?.profile_photo_url || null;

        try {
            if (profilePhotoFile) {
                const fileExt = profilePhotoFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${currentUserId}/${fileName}`; 
                const { error: uploadError } = await supabase.storage.from('profile-photos').upload(filePath, profilePhotoFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
                finalPhotoUrl = data.publicUrl;
            }

            if (currentAdmissionId) {
                 const { error: updateError } = await supabase.rpc('update_admission', {
                    p_admission_id: currentAdmissionId,
                    p_applicant_name: formData.applicant_name,
                    p_grade: formData.grade,
                    p_date_of_birth: formData.date_of_birth || null,
                    p_gender: formData.gender || null,
                    p_profile_photo_url: finalPhotoUrl,
                    p_medical_info: formData.medical_info || null,
                    p_emergency_contact: formData.emergency_contact || null,
                 });
                 if (updateError) throw updateError;
            } else {
                 const { data: newId, error: createError } = await supabase.rpc('create_admission', {
                    p_applicant_name: formData.applicant_name,
                    p_grade: formData.grade,
                    p_date_of_birth: formData.date_of_birth || null,
                    p_gender: formData.gender || null,
                    p_profile_photo_url: finalPhotoUrl,
                    p_medical_info: formData.medical_info || null,
                    p_emergency_contact: formData.emergency_contact || null,
                    p_admission_id: null
                 });
                 if (createError) throw createError;
                 setCurrentAdmissionId(newId);
            }
            setStep('documents');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = () => {
        setRefreshDocsTrigger(prev => prev + 1);
    };

    const handleDocumentsSubmit = async () => {
        if (!currentAdmissionId) return;
        setLoading(true);
        
        try {
            const missing = STANDARD_DOCS.filter(d => {
                if (!d.required) return false;
                const req = fetchedRequirements.find(r => r.document_name === d.name);
                return !req || (req.status !== 'Submitted' && req.status !== 'Accepted');
            });

            if (missing.length > 0) {
                setError(`Missing required documents: ${missing.map(d => d.name).join(', ')}`);
                setLoading(false);
                return;
            }

            if (!child) {
                const { data: codeData, error: codeError } = await supabase.rpc('generate_admission_share_code', {
                    p_admission_id: currentAdmissionId,
                    p_purpose: 'New Application Submission',
                    p_code_type: 'Enquiry',
                });
                if (codeError) throw codeError;
                setGeneratedCode(codeData);
                setStep('success');
            } else {
                onSave();
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const customRequirements = fetchedRequirements.filter(req => !STANDARD_DOCS.some(std => std.name === req.document_name));

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
                
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{!child ? 'New Registration' : 'Edit Application'}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {step === 'details' ? 'Step 1: Student Information' : step === 'documents' ? 'Step 2: Document Management' : 'Registration Complete'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"><XCircleIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="flex-grow overflow-y-auto custom-scrollbar bg-background">
                    {step === 'details' && (
                        <form id="details-form" onSubmit={handleDetailsSubmit} className="p-8 space-y-6">
                            {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">{error}</div>}
                            
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="flex-shrink-0">
                                    <label className="block text-sm font-medium text-foreground mb-2">Student Photo</label>
                                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden relative group">
                                        {profilePhotoUrl ? <img src={profilePhotoUrl} alt="Preview" className="w-full h-full object-cover"/> : <UploadIcon className="w-8 h-8 text-muted-foreground"/>}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-bold">Change</span>
                                        </div>
                                        <input type="file" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*"/>
                                    </div>
                                </div>
                                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div><label className="input-label">Full Name</label><input name="applicant_name" value={formData.applicant_name} onChange={handleChange} required className="input-premium"/></div>
                                    <div><label className="input-label">Grade Applying For</label><select name="grade" value={formData.grade} onChange={handleChange} required className="input-premium"><option value="">Select...</option>{Array.from({length:12},(_,i)=>i+1).map(g=><option key={g} value={String(g)}>Grade {g}</option>)}</select></div>
                                    <div><label className="input-label">Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="input-premium"/></div>
                                    <div><label className="input-label">Gender</label><select name="gender" value={formData.gender} onChange={handleChange} className="input-premium"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div><label className="input-label">Medical Conditions / Allergies</label><textarea name="medical_info" value={formData.medical_info} onChange={handleChange} rows={2} className="input-premium"/></div>
                                <div>
                                    <div className="flex justify-between"><label className="input-label">Emergency Contact</label>{parentContactInfo && <button type="button" onClick={() => setFormData(p=>({...p, emergency_contact: parentContactInfo}))} className="text-xs text-primary font-bold hover:underline">Copy from Profile</button>}</div>
                                    <textarea name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} rows={2} className="input-premium"/>
                                </div>
                            </div>
                        </form>
                    )}

                    {step === 'documents' && currentAdmissionId && (
                        <div className="p-8 space-y-8">
                            {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">{error}</div>}
                            
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                                <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded text-blue-600 dark:text-blue-300"><DocumentTextIcon className="w-5 h-5"/></div>
                                <div>
                                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Document Management</h4>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Upload required documents below. You can update these later from the "Documents" tab.</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Standard Requirements</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {STANDARD_DOCS.map(doc => {
                                        const req = fetchedRequirements.find(r => r.document_name === doc.name);
                                        return (
                                            <SmartDocumentCard 
                                                key={doc.name} 
                                                label={doc.name} 
                                                icon={doc.icon} 
                                                isRequired={doc.required} 
                                                admissionId={currentAdmissionId}
                                                existingReq={req}
                                                onUploadComplete={handleUploadComplete}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {customRequirements.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Requested by School</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {customRequirements.map(req => (
                                            <SmartDocumentCard 
                                                key={req.id} 
                                                label={req.document_name} 
                                                icon={<DocumentTextIcon className="w-5 h-5"/>} 
                                                admissionId={currentAdmissionId}
                                                existingReq={req}
                                                onUploadComplete={handleUploadComplete}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 rounded-xl border-2 border-dashed border-border flex items-center gap-3 bg-muted/20">
                                <input 
                                    type="text" 
                                    placeholder="Upload an additional document (e.g. Vaccination Record)..." 
                                    value={customDocName}
                                    onChange={e => setCustomDocName(e.target.value)}
                                    className="flex-grow bg-transparent border-none focus:ring-0 text-sm placeholder:text-muted-foreground/60"
                                />
                                <button 
                                    disabled={!customDocName.trim()} 
                                    onClick={() => { /* Implementation for custom upload trigger */ }}
                                    className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-primary/20 transition-colors"
                                >
                                    Select File
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-green-500/20">
                                <CheckCircleIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl font-bold text-foreground">Application Submitted!</h3>
                            <p className="text-muted-foreground mt-2 max-w-md">Your child's profile has been created. Use the code below for any enquiries with the school office.</p>
                            
                            <div className="mt-8 p-6 bg-muted/30 border-2 border-dashed border-primary/30 rounded-xl relative group cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all" onClick={() => {navigator.clipboard.writeText(generatedCode!); setIsCopied(true);}}>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Admission Code</p>
                                <p className="text-4xl font-mono font-black text-primary tracking-widest">{generatedCode}</p>
                                <div className="absolute inset-0 bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                    <span className="font-bold text-sm text-primary flex items-center gap-2"><CopyIcon/> Click to Copy</span>
                                </div>
                            </div>
                            {isCopied && <p className="text-green-600 text-sm font-bold mt-3">Copied to clipboard!</p>}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center">
                    {step === 'success' ? (
                        <button onClick={() => { onSave(); onClose(); }} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg">Done</button>
                    ) : (
                        <>
                            <button onClick={() => step === 'documents' ? setStep('details') : onClose()} className="px-6 py-2.5 font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                                {step === 'details' ? 'Cancel' : 'Back'}
                            </button>
                            <button 
                                onClick={() => step === 'details' ? document.getElementById('details-form')?.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true})) : handleDocumentsSubmit()}
                                disabled={loading}
                                className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2 transition-all transform active:scale-95"
                            >
                                {loading ? <Spinner size="sm" className="text-current"/> : step === 'details' ? 'Next: Documents' : (!child ? 'Submit Application' : 'Save Changes')}
                            </button>
                        </>
                    )}
                </div>
            </div>
            <style>{`.input-premium { display: block; width: 100%; padding: 0.75rem 1rem; border: 1px solid hsl(var(--input)); border-radius: 0.75rem; background-color: hsl(var(--background)); color: hsl(var(--foreground)); font-size: 0.9rem; transition: all 0.2s; } .input-premium:focus { outline: none; border-color: hsl(var(--primary)); box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1); } .input-label { display: block; font-size: 0.75rem; font-weight: 800; color: hsl(var(--muted-foreground)); margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.05em; }`}</style>
        </div>
    );
};

export default ChildRegistrationModal;
