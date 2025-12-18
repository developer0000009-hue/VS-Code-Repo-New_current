
import React, { useState, useEffect, useCallback } from 'react';
import { TeacherExtended, TeacherDocument, SchoolClass, Course, TeacherSubjectMapping } from '../types';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { UserIcon } from './icons/UserIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { BookIcon } from './icons/BookIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import ConfirmationModal from './common/ConfirmationModal';
import { TimetableIcon } from './icons/TimetableIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import OffboardingModal from './teachers/OffboardingModal';
import { ClockIcon } from './icons/ClockIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface TeacherDetailModalProps {
    teacher: TeacherExtended;
    onClose: () => void;
    onUpdate: () => void;
}

type TabType = 'personal' | 'employment' | 'academics' | 'timetable' | 'documents' | 'attendance' | 'performance' | 'account';

const TabButton: React.FC<{ label: string; id: TabType; activeId: TabType; onClick: (id: TabType) => void; icon: React.ReactNode }> = ({ label, id, activeId, onClick, icon }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeId === id
            ? 'border-primary text-primary bg-primary/5' 
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
    >
        {icon}
        {label}
    </button>
);

const InfoRow: React.FC<{ 
    label: string; 
    value?: string | number | null; 
    fullWidth?: boolean;
    isEditing?: boolean;
    onChange?: (val: string) => void;
    type?: string;
    options?: string[];
}> = ({ label, value, fullWidth, isEditing, onChange, type = "text", options }) => (
    <div className={`py-3 border-b border-border/50 last:border-0 ${fullWidth ? 'col-span-full' : ''}`}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        {isEditing && onChange ? (
            options ? (
                <select 
                    value={value?.toString() || ''} 
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                >
                    <option value="">Select...</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input 
                    type={type} 
                    value={value?.toString() || ''} 
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
            )
        ) : (
            <p className="text-sm font-medium text-foreground">{value || '—'}</p>
        )}
    </div>
);

const SectionTitle: React.FC<{ title: string, icon?: React.ReactNode, action?: React.ReactNode }> = ({ title, icon, action }) => (
    <div className="flex justify-between items-center mb-6 pb-2 border-b border-border">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            {icon} {title}
        </h3>
        {action}
    </div>
);

// Verification Widget for Pending Status
const VerificationChecklist: React.FC<{ docs: TeacherDocument[], onAction: (id: number, s: 'Verified'|'Rejected') => void }> = ({ docs, onAction }) => {
    const requiredDocs = ['Resume', 'ID Proof', 'Certificate'];
    const uploadedMap = new Map<string, TeacherDocument>(docs.map(d => [d.document_name, d]));
    
    return (
        <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4"/> Verification Checklist
            </h4>
            <div className="space-y-2">
                {requiredDocs.map(docName => {
                    const doc = uploadedMap.get(docName);
                    const status = doc?.status || 'Missing';
                    return (
                        <div key={docName} className="flex justify-between items-center p-2 bg-background/60 rounded-lg border border-border/50">
                            <span className="text-sm font-medium">{docName}</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${status === 'Verified' ? 'bg-green-100 text-green-700' : status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {status}
                                </span>
                                {status === 'Pending' && doc && (
                                    <div className="flex gap-1">
                                        <button onClick={() => onAction(doc.id, 'Verified')} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"><CheckCircleIcon className="w-3 h-3"/></button>
                                        <button onClick={() => onAction(doc.id, 'Rejected')} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><XCircleIcon className="w-3 h-3"/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">Verify all mandatory documents to activate this teacher account.</p>
        </div>
    );
};

const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({ teacher, onClose, onUpdate }) => {
    // Default to documents tab if verification pending for better UX
    const [activeTab, setActiveTab] = useState<TabType>(teacher.details?.employment_status === 'Pending Verification' ? 'documents' : 'personal');
    const [isEditing, setIsEditing] = useState(false);
    
    // Editable Form Data
    const [formData, setFormData] = useState({
        display_name: teacher.display_name,
        phone: teacher.phone || '',
        email: teacher.email,
        bio: teacher.details?.bio || '',
        gender: teacher.details?.gender || '',
        date_of_birth: teacher.details?.date_of_birth || '',
        department: teacher.details?.department || '',
        designation: teacher.details?.designation || '',
        employee_id: teacher.details?.employee_id || '',
        employment_type: teacher.details?.employment_type || '',
        employment_status: teacher.details?.employment_status || 'Active',
        date_of_joining: teacher.details?.date_of_joining || '',
        qualification: teacher.details?.qualification || '',
        specializations: teacher.details?.specializations || '',
        subject: teacher.details?.subject || ''
    });

    const [docs, setDocs] = useState<TeacherDocument[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageSubject, setMessageSubject] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isOffboarding, setIsOffboarding] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState<{ type: string, title: string, message: string } | null>(null);
    const [processingAction, setProcessingAction] = useState(false);

    // Subject Mapping State
    const [mappings, setMappings] = useState<TeacherSubjectMapping[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [newMapping, setNewMapping] = useState({ classId: '', subjectId: '' });
    const [loadingMappings, setLoadingMappings] = useState(false);

    // Mock Branch Data (In real app, fetch from school_branches)
    const [assignedBranches, setAssignedBranches] = useState(['Main Campus']);

    const fetchDocs = useCallback(async () => {
        setLoadingDocs(true);
        const { data, error } = await supabase.rpc('get_teacher_documents', { p_teacher_id: teacher.id });
        if (!error && data) setDocs(data);
        setLoadingDocs(false);
    }, [teacher.id]);

    const fetchMappings = useCallback(async () => {
        setLoadingMappings(true);
        // Fetch existing mappings using class_subjects table
        const { data: mappingData } = await supabase
            .from('class_subjects')
            .select(`
                id, class_id, subject_id,
                school_classes(name),
                courses(title)
            `)
            .eq('teacher_id', teacher.id);
        
        if (mappingData) {
            setMappings(mappingData.map((m: any) => ({
                id: m.id,
                teacher_id: teacher.id,
                subject_id: m.subject_id,
                class_id: m.class_id,
                academic_year: 'Current', // Not in table, placeholder
                class_name: m.school_classes?.name,
                subject_name: m.courses?.title
            })));
        }

        // Fetch options
        const [classRes, courseRes] = await Promise.all([
            supabase.from('school_classes').select('id, name'),
            supabase.from('courses').select('id, title')
        ]);
        
        if (classRes.data) setClasses(classRes.data);
        if (courseRes.data) setCourses(courseRes.data);
        
        setLoadingMappings(false);
    }, [teacher.id]);

    useEffect(() => {
        // Pre-fetch docs if status is pending verification regardless of tab
        if (teacher.details?.employment_status === 'Pending Verification' || activeTab === 'documents') fetchDocs();
        if (activeTab === 'academics' || activeTab === 'performance') fetchMappings();
    }, [activeTab, fetchDocs, fetchMappings, teacher.details?.employment_status]);

    // Workload Calculation Helpers
    const workloadHours = mappings.length * 4; // Mock logic: 4 hours per subject/class mapping
    const maxLoad = teacher.details?.workload_limit || 30;
    const loadPercentage = Math.min((workloadHours / maxLoad) * 100, 100);
    let loadStatus = 'Balanced';
    let loadColor = 'bg-emerald-500';
    let loadTextColor = 'text-emerald-700';
    let loadBgColor = 'bg-emerald-50';

    if (workloadHours < 12) { 
        loadStatus = 'Underutilized'; 
        loadColor = 'bg-blue-500'; 
        loadTextColor = 'text-blue-700';
        loadBgColor = 'bg-blue-50';
    } else if (workloadHours > maxLoad - 5) { 
        loadStatus = 'Overloaded'; 
        loadColor = 'bg-red-500'; 
        loadTextColor = 'text-red-700';
        loadBgColor = 'bg-red-50';
    }

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            await supabase.from('profiles').update({ display_name: formData.display_name, phone: formData.phone }).eq('id', teacher.id);
            await supabase.from('teacher_profiles').update({
                bio: formData.bio, gender: formData.gender, date_of_birth: formData.date_of_birth || null, department: formData.department, designation: formData.designation, employee_id: formData.employee_id, employment_type: formData.employment_type, employment_status: formData.employment_status, date_of_joining: formData.date_of_joining || null, qualification: formData.qualification, specializations: formData.specializations, subject: formData.subject
            }).eq('user_id', teacher.id);
            setIsEditing(false);
            onUpdate();
        } catch (err: any) { alert(`Failed to save profile: ${err.message}`); } finally { setIsSavingProfile(false); }
    };

    const handleVerifyTeacher = async () => {
        // Validation: Check if documents are verified
        const unverified = docs.some(d => d.status !== 'Verified' && ['Resume','ID Proof','Certificate'].includes(d.document_name));
        if (unverified && !confirm("Warning: Some mandatory documents are not verified. Proceed with activation?")) return;

        setProcessingAction(true);
        try {
             await supabase.from('profiles').update({ is_active: true }).eq('id', teacher.id);
             await supabase.from('teacher_profiles').update({ employment_status: 'Active' }).eq('user_id', teacher.id);
             onUpdate();
             onClose();
        } catch (err) { alert("Verification failed"); } finally { setProcessingAction(false); }
    };

    const handleDocAction = async (docId: number, status: 'Verified' | 'Rejected') => {
        const reason = status === 'Rejected' ? prompt("Enter rejection reason:") : null;
        if (status === 'Rejected' && !reason) return;
        const { error } = await supabase.rpc('update_teacher_document_status', { p_doc_id: docId, p_status: status, p_reason: reason });
        if (!error) fetchDocs(); else alert('Failed to update status');
    };

    const handleAddMapping = async () => {
        if (!newMapping.classId || !newMapping.subjectId) return;
        const { error } = await supabase.from('class_subjects').upsert({
            class_id: parseInt(newMapping.classId),
            subject_id: parseInt(newMapping.subjectId),
            teacher_id: teacher.id
        }, { onConflict: 'class_id, subject_id' });
        
        if (error) alert('Error assigning subject: ' + error.message);
        else {
            setNewMapping({ classId: '', subjectId: '' });
            fetchMappings();
        }
    };

    const handleRemoveMapping = async (id: number) => {
        const { error } = await supabase.from('class_subjects').update({ teacher_id: null }).eq('id', id);
        if (error) alert('Error removing assignment');
        else fetchMappings();
    };

    const executeAccountAction = async () => {
        if (!confirmationAction) return;
        setProcessingAction(true);
        let error = null;
        if (confirmationAction.type === 'toggle_active') { const { error: err } = await supabase.from('profiles').update({ is_active: !teacher.is_active }).eq('id', teacher.id); error = err; }
        else if (confirmationAction.type === 'suspend') { const { error: err } = await supabase.from('teacher_profiles').update({ employment_status: 'Suspended' }).eq('user_id', teacher.id); await supabase.from('profiles').update({ is_active: false }).eq('id', teacher.id); error = err; }
        else if (confirmationAction.type === 'reset_password') { const { error: err } = await supabase.auth.resetPasswordForEmail(teacher.email, { redirectTo: window.location.origin }); error = err; }

        if (error) alert(`Action failed: ${error.message}`);
        else { onUpdate(); if (confirmationAction.type !== 'reset_password') onClose(); else alert('Password reset email sent.'); }
        setProcessingAction(false); setConfirmationAction(null);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingMessage(true);
        try {
            await supabase.rpc('send_bulk_communication', { p_subject: messageSubject, p_body: messageBody, p_recipient_roles: [], p_target_criteria: { type: 'user', value: teacher.id } });
            await new Promise(resolve => setTimeout(resolve, 800)); setIsMessageModalOpen(false); setMessageSubject(''); setMessageBody(''); alert(`Message sent to ${teacher.display_name}`);
        } catch (err) { alert('Failed to send message.'); } finally { setSendingMessage(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
            <div className="bg-card w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-start flex-shrink-0 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-card overflow-hidden">
                                {teacher.details?.profile_picture_url ? <img src={teacher.details.profile_picture_url} className="w-full h-full object-cover"/> : (teacher.display_name || '?').charAt(0)}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-card flex items-center justify-center ${teacher.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                {teacher.is_active ? <CheckCircleIcon className="w-3 h-3 text-white"/> : <XCircleIcon className="w-3 h-3 text-white"/>}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                {teacher.display_name}
                                {formData.employment_status === 'Pending Verification' && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">Verification Pending</span>}
                            </h2>
                            <p className="text-sm text-muted-foreground font-medium mt-1">{teacher.details?.designation || 'Teacher'} • {teacher.details?.department || 'General'}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5"><MailIcon className="w-3.5 h-3.5"/> {teacher.email}</span>
                                <span className="flex items-center gap-1.5"><PhoneIcon className="w-3.5 h-3.5"/> {teacher.phone || 'N/A'}</span>
                                <span className="px-2 py-0.5 rounded bg-muted text-foreground font-mono border border-border">ID: {teacher.details?.employee_id || '---'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {formData.employment_status === 'Pending Verification' && (
                             <button onClick={handleVerifyTeacher} disabled={processingAction} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-bold text-sm rounded-lg transition-all flex items-center gap-2 shadow-sm animate-pulse">
                                <CheckCircleIcon className="w-4 h-4" /> Approve & Activate
                            </button>
                        )}
                        <button onClick={() => setIsMessageModalOpen(true)} className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-sm rounded-lg transition-all flex items-center gap-2">
                            <CommunicationIcon className="w-4 h-4" /> Message
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"><XIcon className="w-6 h-6"/></button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    <div className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border overflow-y-auto flex-shrink-0">
                        <nav className="p-2 space-y-1">
                            <TabButton id="personal" label="Personal Details" activeId={activeTab} onClick={setActiveTab} icon={<UserIcon className="w-4 h-4"/>} />
                            <TabButton id="employment" label="Employment & Access" activeId={activeTab} onClick={setActiveTab} icon={<BriefcaseIcon className="w-4 h-4"/>} />
                            <TabButton id="academics" label="Subject Mapping" activeId={activeTab} onClick={setActiveTab} icon={<BookIcon className="w-4 h-4"/>} />
                            <TabButton id="timetable" label="Timetable" activeId={activeTab} onClick={setActiveTab} icon={<TimetableIcon className="w-4 h-4"/>} />
                            <TabButton id="attendance" label="Attendance Log" activeId={activeTab} onClick={setActiveTab} icon={<CalendarIcon className="w-4 h-4"/>} />
                            <TabButton id="performance" label="Workload & Stats" activeId={activeTab} onClick={setActiveTab} icon={<ChartBarIcon className="w-4 h-4"/>} />
                            <TabButton id="documents" label="Documents" activeId={activeTab} onClick={setActiveTab} icon={<FileTextIcon className="w-4 h-4"/>} />
                            <TabButton id="account" label="Account Control" activeId={activeTab} onClick={setActiveTab} icon={<ShieldCheckIcon className="w-4 h-4"/>} />
                        </nav>
                    </div>

                    <div className="flex-grow overflow-y-auto p-8 bg-background relative">
                        {formData.employment_status === 'Pending Verification' && activeTab === 'documents' && (
                             <VerificationChecklist docs={docs} onAction={handleDocAction} />
                        )}

                        {['personal', 'employment'].includes(activeTab) && (
                            <div className="absolute top-6 right-8 z-10">
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-bold hover:bg-muted/80">Cancel</button>
                                        <button onClick={handleSaveProfile} disabled={isSavingProfile} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center gap-2">
                                            {isSavingProfile ? <Spinner size="sm" className="text-current"/> : <><SaveIcon className="w-4 h-4"/> Save Changes</>}
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-bold flex items-center gap-2 border border-border">
                                        <EditIcon className="w-4 h-4"/> Edit Details
                                    </button>
                                )}
                            </div>
                        )}

                        {activeTab === 'personal' && (
                            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <SectionTitle title="Personal Information" icon={<UserIcon className="w-5 h-5 text-primary"/>} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InfoRow label="Full Name" value={formData.display_name} isEditing={isEditing} onChange={v => setFormData({...formData, display_name: v})} />
                                    <InfoRow label="Gender" value={formData.gender} isEditing={isEditing} onChange={v => setFormData({...formData, gender: v})} options={['Male', 'Female', 'Other']} />
                                    <InfoRow label="Date of Birth" value={formData.date_of_birth} isEditing={isEditing} onChange={v => setFormData({...formData, date_of_birth: v})} type="date" />
                                    <InfoRow label="Contact Phone" value={formData.phone} isEditing={isEditing} onChange={v => setFormData({...formData, phone: v})} />
                                    <InfoRow label="Email Address" value={formData.email} />
                                    <div className="col-span-full pt-4">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Bio / Summary</p>
                                        {isEditing ? <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full p-4 bg-background rounded-xl border border-input text-sm focus:ring-2 h-32 resize-none" /> : <div className="p-4 bg-muted/30 rounded-xl border border-border text-sm leading-relaxed">{formData.bio || 'No bio available.'}</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'employment' && (
                             <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <SectionTitle title="Employment Details" icon={<BriefcaseIcon className="w-5 h-5 text-primary"/>} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InfoRow label="Employee ID" value={formData.employee_id} isEditing={isEditing} onChange={v => setFormData({...formData, employee_id: v})} />
                                    <InfoRow label="Department" value={formData.department} isEditing={isEditing} onChange={v => setFormData({...formData, department: v})} />
                                    <InfoRow label="Designation" value={formData.designation} isEditing={isEditing} onChange={v => setFormData({...formData, designation: v})} />
                                    <InfoRow label="Employment Type" value={formData.employment_type} isEditing={isEditing} onChange={v => setFormData({...formData, employment_type: v})} options={['Full-time', 'Part-time', 'Contract']} />
                                </div>
                                <div className="pt-6 border-t border-border">
                                    <h4 className="text-sm font-bold text-foreground mb-4">Multi-Branch Access</h4>
                                    <div className="bg-muted/20 p-4 rounded-xl border border-border">
                                        <p className="text-xs text-muted-foreground mb-3">This teacher can access and teach in the following branches:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {assignedBranches.map(branch => (
                                                <div key={branch} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-lg text-sm font-medium">
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> {branch}
                                                    {isEditing && <button className="text-muted-foreground hover:text-red-500"><XIcon className="w-3 h-3"/></button>}
                                                </div>
                                            ))}
                                            {isEditing && <button onClick={() => setAssignedBranches([...assignedBranches, 'New Branch'])} className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold">+ Add Branch</button>}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        )}

                        {activeTab === 'academics' && (
                             <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                 <SectionTitle title="Subject & Class Mapping" icon={<BookIcon className="w-5 h-5 text-primary"/>} />
                                 
                                 {/* Mapping List */}
                                 <div className="space-y-3">
                                    {loadingMappings ? <Spinner /> : mappings.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                            <BookIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2"/>
                                            <p>No subjects mapped yet.</p>
                                        </div>
                                    ) : (
                                        mappings.map(map => (
                                            <div key={map.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                        {map.class_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm">{map.class_name}</p>
                                                        <p className="text-xs text-muted-foreground">{map.subject_name}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemoveMapping(map.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                 </div>

                                 {/* Add New Mapping */}
                                 <div className="bg-muted/20 p-5 rounded-xl border border-border mt-6">
                                     <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Assign New Class</h4>
                                     <div className="flex gap-3">
                                         <select value={newMapping.classId} onChange={e => setNewMapping({...newMapping, classId: e.target.value})} className="flex-1 p-2.5 rounded-lg border border-input text-sm bg-background">
                                             <option value="">Select Class</option>
                                             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                         </select>
                                         <select value={newMapping.subjectId} onChange={e => setNewMapping({...newMapping, subjectId: e.target.value})} className="flex-1 p-2.5 rounded-lg border border-input text-sm bg-background">
                                             <option value="">Select Subject</option>
                                             {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                         </select>
                                         <button onClick={handleAddMapping} disabled={!newMapping.classId || !newMapping.subjectId} className="px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg text-sm disabled:opacity-50">
                                             <PlusIcon className="w-4 h-4"/> Add
                                         </button>
                                     </div>
                                 </div>
                             </div>
                        )}

                        {activeTab === 'timetable' && (
                            <div className="max-w-5xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <SectionTitle title="Weekly Schedule" icon={<TimetableIcon className="w-5 h-5 text-primary"/>} />
                                <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                    <p>Timetable view will be integrated with the main Timetable module.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                             <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <SectionTitle title="Attendance Log" icon={<CalendarIcon className="w-5 h-5 text-primary"/>} />
                                 <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                    <p>Teacher attendance tracking coming soon.</p>
                                </div>
                             </div>
                        )}

                        {activeTab === 'performance' && (
                             <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                 <SectionTitle title="Workload & Performance" icon={<ChartBarIcon className="w-5 h-5 text-primary"/>} />
                                 
                                 {/* Workload Status Card */}
                                 <div className="p-6 bg-card border border-border rounded-xl shadow-sm mb-6">
                                     <div className="flex justify-between items-center mb-4">
                                         <h4 className="text-sm font-bold text-foreground">Teaching Load</h4>
                                         <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${loadBgColor} ${loadTextColor}`}>
                                             {loadStatus}
                                         </span>
                                     </div>
                                     <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden">
                                         <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${loadColor}`} 
                                            style={{ width: `${loadPercentage}%` }}
                                         ></div>
                                     </div>
                                     <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
                                         <span>0 hrs</span>
                                         <span>{workloadHours} / {maxLoad} hrs/week</span>
                                         <span>40+ hrs</span>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-6">
                                     <div className="p-6 bg-card border border-border rounded-xl">
                                         <p className="text-sm text-muted-foreground font-medium">Total Assigned Subjects</p>
                                         <p className="text-3xl font-bold text-foreground mt-1">{mappings.length}</p>
                                     </div>
                                     <div className="p-6 bg-card border border-border rounded-xl">
                                         <p className="text-sm text-muted-foreground font-medium">Weekly Teaching Hours</p>
                                         <p className="text-3xl font-bold text-primary mt-1">{workloadHours} hrs</p>
                                     </div>
                                 </div>
                             </div>
                        )}

                        {activeTab === 'documents' && (
                             <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <SectionTitle title="Documents" icon={<FileTextIcon className="w-5 h-5 text-primary"/>} />
                                {loadingDocs ? <Spinner/> : docs.length === 0 ? <p className="text-muted-foreground italic">No documents found.</p> : (
                                    <div className="grid gap-4">
                                        {docs.map(doc => (
                                            <div key={doc.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-muted rounded-lg"><FileTextIcon className="w-6 h-6 text-muted-foreground"/></div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-foreground">{doc.document_name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${doc.status === 'Verified' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>{doc.status}</span>
                                                            <span className="text-[10px] text-muted-foreground">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {doc.status !== 'Verified' && (
                                                    <button onClick={() => handleDocAction(doc.id, 'Verified')} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90">Verify</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <SectionTitle title="Account Controls" icon={<ShieldCheckIcon className="w-5 h-5 text-primary"/>} />
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-5 bg-card border border-border rounded-xl shadow-sm">
                                        <div><h4 className="font-bold text-foreground">Account Status</h4><p className="text-sm text-muted-foreground">Temporarily disable login access.</p></div>
                                        <button onClick={() => setConfirmationAction({ type: 'toggle_active', title: teacher.is_active ? 'Deactivate Account' : 'Activate Account', message: `Are you sure you want to ${teacher.is_active ? 'deactivate' : 'activate'} this teacher's account?` })} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${teacher.is_active ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'}`}>{teacher.is_active ? 'Deactivate' : 'Activate'}</button>
                                    </div>
                                    <div className="p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl space-y-4">
                                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold"><AlertTriangleIcon className="w-5 h-5"/> Danger Zone</div>
                                        <div className="flex gap-4">
                                            <button onClick={() => setConfirmationAction({ type: 'suspend', title: 'Suspend Teacher', message: 'This will mark the teacher as Suspended and revoke all access immediately. Continue?' })} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">Suspend</button>
                                            <button onClick={() => setIsOffboarding(true)} className="px-4 py-2 bg-background border border-red-300 text-red-700 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors">Offboard / Resign</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isMessageModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CommunicationIcon className="w-5 h-5"/> Message {teacher.display_name}</h3>
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div><label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Subject</label><input className="w-full p-2 rounded border bg-background text-sm" required value={messageSubject} onChange={e => setMessageSubject(e.target.value)} placeholder="e.g. Meeting Request" /></div>
                            <div><label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Message</label><textarea className="w-full p-2 rounded border bg-background text-sm h-24" required value={messageBody} onChange={e => setMessageBody(e.target.value)} placeholder="Type your message..."></textarea></div>
                            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setIsMessageModalOpen(false)} className="px-4 py-2 rounded text-sm font-bold text-muted-foreground hover:bg-muted">Cancel</button><button type="submit" disabled={sendingMessage} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2">{sendingMessage ? <Spinner size="sm" className="text-current"/> : 'Send'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal isOpen={!!confirmationAction} onClose={() => setConfirmationAction(null)} onConfirm={executeAccountAction} title={confirmationAction?.title || ''} message={confirmationAction?.message || ''} loading={processingAction} confirmText="Confirm Action" />
            
            {isOffboarding && <OffboardingModal teacher={teacher} onClose={() => setIsOffboarding(false)} onSuccess={() => { setIsOffboarding(false); onUpdate(); onClose(); }} />}
        </div>
    );
};

export default TeacherDetailModal;
