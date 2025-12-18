
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { StudentForAdmin, StudentInvoice, StudentAttendanceRecord, SchoolClass } from '../../types';
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
import { DownloadIcon } from '../icons/DownloadIcon';
import { EditIcon } from '../icons/EditIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { LocationIcon } from '../icons/LocationIcon';
import { BookIcon } from '../icons/BookIcon';
import { PlusIcon } from '../icons/PlusIcon';
import EditStudentDetailsModal from './EditStudentDetailsModal';
import CustomSelect from '../common/CustomSelect';

interface StudentProfileModalProps {
    student: StudentForAdmin;
    onClose: () => void;
    onUpdate: () => void;
    initialTab?: 'overview' | 'parents' | 'academic' | 'documents' | 'fees' | 'history';
}

type TabType = 'overview' | 'parents' | 'academic' | 'documents' | 'fees' | 'history';

// --- Lifecycle Stepper Component ---
const LifecycleStepper: React.FC<{ 
    isApproved: boolean, 
    isRegistered: boolean, 
    isActive: boolean, 
    isClassAssigned: boolean 
}> = ({ isApproved, isRegistered, isActive, isClassAssigned }) => {
    const steps = [
        { label: 'Admission', status: isApproved ? 'complete' : 'current', tooltip: 'Application approved by admin' },
        { label: 'Registration', status: isRegistered ? 'complete' : isApproved ? 'current' : 'pending', tooltip: 'Student details filled' },
        { label: 'Active', status: isActive ? 'complete' : isRegistered ? 'current' : 'pending', tooltip: 'Account activated' },
        { label: 'Class Assigned', status: isClassAssigned ? 'complete' : isActive ? 'current' : 'pending', tooltip: 'Enrolled in class' },
    ];

    const activeIndex = steps.filter(s => s.status === 'complete').length;

    return (
        <div className="w-full mb-8 relative px-4">
            {/* Connecting Line */}
            <div className="absolute top-4 left-0 w-full h-1.5 bg-muted -z-10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 ease-out relative"
                    style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                >
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/30 to-transparent animate-pulse"></div>
                </div>
            </div>

            <div className="flex justify-between w-full">
                {steps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center relative group cursor-help">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-md z-10 ${
                            step.status === 'complete' ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-emerald-500/30' :
                            step.status === 'current' ? 'bg-white border-blue-500 text-blue-500 ring-4 ring-blue-100 scale-110 animate-pulse' :
                            'bg-card border-muted text-muted-foreground'
                        }`}>
                            {step.status === 'complete' ? <CheckCircleIcon className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                        </div>
                        
                        <div className="absolute top-12 flex flex-col items-center w-32 transition-all duration-300">
                             <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-1 transition-colors ${
                                step.status === 'complete' ? 'text-emerald-600' :
                                step.status === 'current' ? 'text-blue-600' :
                                'text-muted-foreground'
                            }`}>{step.label}</p>
                            
                            {/* Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-7 bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap font-medium pointer-events-none transform translate-y-1 group-hover:translate-y-0 z-20">
                                {step.tooltip}
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Assign Class Modal ---
const AssignClassModal: React.FC<{ studentId: string, currentClass?: string, onClose: () => void, onUpdate: () => void }> = ({ studentId, currentClass, onClose, onUpdate }) => {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClasses = async () => {
            setFetching(true);
            const { data, error } = await supabase.rpc('get_all_classes_for_admin');
            if (error) {
                setError("Failed to load classes.");
            } else {
                // Sort classes by name or grade for easier finding
                const sorted = (data || []).sort((a: any, b: any) => a.name.localeCompare(b.name));
                setClasses(sorted);
            }
            setFetching(false);
        };
        fetchClasses();
    }, []);

    const handleAssign = async () => {
        if (!selectedClass) return;
        setLoading(true);
        const { error } = await supabase.from('student_profiles').update({ assigned_class_id: parseInt(selectedClass) }).eq('user_id', studentId);
        
        if (error) {
            alert(`Error assigning class: ${error.message}`);
            setLoading(false);
        } else {
            onUpdate();
            // onUpdate will trigger the refresh in parent, which closes modal
        }
    };

    // Prepare options for CustomSelect
    const classOptions = classes.map(c => ({
        value: c.id.toString(),
        label: `${c.name} (Grade ${c.grade_level})`,
    }));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95" onClick={onClose}>
            <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                            <BookIcon className="w-5 h-5 text-primary"/> Assign Class
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Enroll the student into an academic class.</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><XIcon className="w-5 h-5"/></button>
                </div>
                
                {error ? (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm mb-4">{error}</div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Select Class</label>
                            {fetching ? (
                                <div className="h-12 w-full bg-muted animate-pulse rounded-xl"></div>
                            ) : classes.length === 0 ? (
                                <div className="text-center p-4 border-2 border-dashed border-border rounded-xl bg-muted/20">
                                    <p className="text-sm text-muted-foreground">No active classes found.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Please create classes in Academic Settings first.</p>
                                </div>
                            ) : (
                                <CustomSelect
                                    value={selectedClass}
                                    onChange={setSelectedClass}
                                    options={classOptions}
                                    placeholder="Search for a class..."
                                    searchable
                                    icon={<SchoolIcon className="w-4 h-4"/>}
                                />
                            )}
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
                            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                            <button 
                                onClick={handleAssign} 
                                disabled={!selectedClass || loading} 
                                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                {loading ? <Spinner size="sm" className="text-current"/> : 'Confirm Assignment'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Digital ID Card Component ---
const getQrUrl = (text: string) => {
    return `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=300&margin=1&ecLevel=H&dark=0f172a&light=ffffff`;
};

const DigitalIdCard: React.FC<{ student: StudentForAdmin, onDownload: () => void, loading: boolean }> = ({ student, onDownload, loading }) => {
    const qrData = `${window.location.origin}/verify/student/${student.id}`;
    const profileImg = student.profile_photo_url || `https://api.dicebear.com/8.x/initials/svg?seed=${student.display_name}`;

    return (
        <div className="bg-background border border-border rounded-3xl shadow-xl overflow-hidden max-w-sm mx-auto transform hover:scale-[1.02] transition-all duration-500 group relative perspective-1000 ring-1 ring-black/5 hover:shadow-2xl hover:shadow-primary/10">
            {/* ID Card Content */}
            <div className="h-[480px] flex flex-col relative bg-white dark:bg-slate-900">
                {/* Header Design */}
                <div className="h-32 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 relative overflow-hidden">
                     <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                     <div className="absolute left-5 bottom-0 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
                     <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-2">
                         <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 shadow-sm">
                                <SchoolIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-extrabold text-white text-lg tracking-wide drop-shadow-sm">SCHOOL PORTAL</span>
                         </div>
                         <span className="text-[9px] text-blue-50 uppercase tracking-[0.3em] font-bold opacity-90">Official Student ID</span>
                     </div>
                </div>

                {/* Profile Image */}
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
                    <div className="w-28 h-28 rounded-full p-1 bg-white dark:bg-slate-900 shadow-xl ring-4 ring-white/20">
                         <img 
                            src={profileImg} 
                            alt="Profile" 
                            className="w-full h-full rounded-full object-cover bg-slate-100"
                         />
                    </div>
                    {/* Active Status Indicator */}
                    <div className={`absolute bottom-1 right-1 w-7 h-7 border-4 border-white dark:border-slate-900 rounded-full ${student.is_active ? 'bg-emerald-500' : 'bg-amber-500'} shadow-md flex items-center justify-center`} title={student.is_active ? "Active" : "Inactive"}>
                        {student.is_active && <CheckCircleIcon className="w-3 h-3 text-white" />}
                    </div>
                </div>

                {/* Info Section */}
                <div className="mt-16 flex-grow flex flex-col items-center px-6 text-center pt-4">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1 leading-tight tracking-tight">{student.display_name}</h2>
                    <span className="px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-6 border border-indigo-100 dark:border-indigo-800/50">
                        {student.role || 'Student'}
                    </span>

                    <div className="grid grid-cols-2 gap-3 w-full mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Grade</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{student.grade || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">ID Number</p>
                            <p className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm tracking-tight">{student.student_id_number || '---'}</p>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="mt-auto mb-6 flex flex-col items-center gap-2">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                            <img src={getQrUrl(qrData)} alt="Scan QR" className="w-20 h-20 object-contain"/>
                        </div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-[0.2em] font-bold">Scan for Profile</p>
                    </div>
                </div>
            </div>

             {/* Action Button Overlay */}
             <div className="absolute bottom-4 left-0 right-0 px-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                    onClick={onDownload}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-70"
                >
                    {loading ? <Spinner size="sm" className="text-current"/> : <><DownloadIcon className="w-3.5 h-3.5"/> Download ID Card</>}
                </button>
             </div>
        </div>
    );
};

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose, onUpdate, initialTab = 'overview' }) => {
    // --- Local Student State for Real-time Updates ---
    const [localStudent, setLocalStudent] = useState<StudentForAdmin>(student);
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    
    // Data State
    const [loading, setLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
    const [attendance, setAttendance] = useState<StudentAttendanceRecord[]>([]);
    const [admissionData, setAdmissionData] = useState<any>(null);
    const [parentContact, setParentContact] = useState<{
        phone?: string, 
        email?: string, 
        address?: string, 
        name?: string, 
        relationship?: string,
        city?: string,
        state?: string,
        country?: string
    } | null>(null);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isAssignClassOpen, setIsAssignClassOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Mock History Data
    const [historyLogs, setHistoryLogs] = useState<any[]>([
        { id: 1, action: 'Profile Created', date: localStudent.created_at, user: 'System' },
        { id: 2, action: 'Admission Approved', date: localStudent.created_at, user: 'Admin' },
    ]);

    // Fetch Data based on tab
    const fetchData = useCallback(async () => {
        setLoading(true);
        
        // Always fetch parent data for "Auto-Sync" logic in Overview
        try {
            const { data: parentData } = await supabase.rpc('get_linked_parent_for_student', { p_student_id: localStudent.id });
            if (parentData && parentData.found) {
                setParentContact(parentData);
            }
        } catch (e) { console.error(e); }

        if (activeTab === 'documents') {
            const { data: admData } = await supabase.from('admissions').select('id').eq('student_user_id', localStudent.id).single();
            if (admData) {
                const { data: docs } = await supabase.from('admission_documents').select('*').eq('admission_id', admData.id);
                const { data: reqs } = await supabase.from('document_requirements').select('*').eq('admission_id', admData.id);
                
                const mergedDocs = docs?.map(doc => {
                    const req = reqs?.find(r => r.id === doc.requirement_id);
                    return { ...doc, status: req?.status || 'Pending', requirement_id: req?.id };
                });
                setDocuments(mergedDocs || []);
            }
        }
        
        if (activeTab === 'fees') {
            const { data: invData } = await supabase.rpc('get_student_invoices', { p_student_id: localStudent.id });
            setInvoices(invData || []);
        }

        if (activeTab === 'academic') {
            const { data: attData } = await supabase.rpc('get_student_attendance_records', { p_student_id: localStudent.id });
            setAttendance(attData || []);
        }

        if (activeTab === 'parents' || activeTab === 'overview') {
            const { data: admData } = await supabase.from('admissions').select('*').eq('student_user_id', localStudent.id).single();
            setAdmissionData(admData);
        }
        
        setLoading(false);
    }, [activeTab, localStudent.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Update Handlers ---

    const handleEditSuccess = () => {
        setSuccessMessage("Student profile updated successfully.");
        onUpdate(); // Refresh parent list
        
        // Re-fetch student data locally to update UI without closing
        supabase.from('student_profiles').select('*').eq('user_id', localStudent.id).single().then(({data}) => {
            if(data) setLocalStudent(prev => ({ ...prev, ...data }));
        });
        supabase.from('profiles').select('*').eq('id', localStudent.id).single().then(({data}) => {
             if(data) setLocalStudent(prev => ({ ...prev, display_name: data.display_name, email: data.email, phone: data.phone }));
        });

        fetchData(); // Refresh related data
        setTimeout(() => setSuccessMessage(null), 3000);
    };
    
    const handleAssignClassSuccess = async () => {
        setIsAssignClassOpen(false);
        setSuccessMessage("Class assigned successfully.");
        
        // Refresh local student data immediately
        const { data: profileData } = await supabase
            .from('student_profiles')
            .select('assigned_class_id, school_classes(name)')
            .eq('user_id', localStudent.id)
            .single();
            
        if (profileData) {
            setLocalStudent(prev => ({
                ...prev,
                assigned_class_id: profileData.assigned_class_id,
                assigned_class_name: (profileData as any).school_classes?.name
            }));
            
            // Add to history log locally for UX
            setHistoryLogs(prev => [{ id: Date.now(), action: `Class Assigned: ${(profileData as any).school_classes?.name}`, date: new Date().toISOString(), user: 'Admin' }, ...prev]);
        }

        onUpdate(); // Tell parent list to refresh
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleVerifyDocument = async (doc: any) => {
        if (!doc.requirement_id) return;
        const { error } = await supabase.from('document_requirements').update({ status: 'Accepted' }).eq('id', doc.requirement_id);
        if (error) alert('Failed to verify document: ' + error.message);
        else fetchData();
    };

    const handleRejectDocument = async (doc: any) => {
        if (!doc.requirement_id) return;
        const reason = prompt("Please enter a reason for rejection:");
        if (reason === null) return; 
        const { error } = await supabase.from('document_requirements').update({ status: 'Rejected', rejection_reason: reason }).eq('id', doc.requirement_id);
        if (error) alert('Failed to reject document: ' + error.message);
        else fetchData();
    };

    // --- ID CARD GENERATOR ---
    const handleDownloadIdCard = async () => {
        setDownloadingId(true);
        // Logic placeholder for real implementation
        setTimeout(() => {
            setDownloadingId(false);
            alert("ID Card download started (simulated).");
        }, 1000);
    };

    // --- Render Helpers ---
    const InfoRow = ({ label, value, icon, isSynced = false }: { label: string, value?: string | null, icon?: React.ReactNode, isSynced?: boolean }) => (
        <div className="py-3.5 border-b border-border/40 last:border-0 flex items-start gap-3 group">
            <div className="mt-0.5 p-1.5 rounded-md bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                {icon}
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-center mb-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                    {isSynced && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded-full">
                            <CheckCircleIcon className="w-3 h-3"/> Auto-Synced
                        </span>
                    )}
                </div>
                <p className={`text-sm font-semibold text-foreground break-words ${!value ? 'italic text-muted-foreground' : ''}`}>
                    {value || 'Not provided'}
                </p>
            </div>
        </div>
    );

    const TabButton = ({ id, label, icon }: { id: TabType, label: string, icon: React.ReactNode }) => (
        <button 
            onClick={() => setActiveTab(id)} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative ${
                activeTab === id 
                ? 'bg-white dark:bg-card text-primary shadow-md ring-1 ring-black/5 z-10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
        >
            {activeTab === id && <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full"></div>}
            <div className={`p-1.5 rounded-lg transition-colors ${activeTab === id ? 'bg-primary/10' : 'bg-transparent group-hover:bg-muted'}`}>
                {icon}
            </div>
            {label}
        </button>
    );
    
    // Lifecycle Status
    const isApproved = true; 
    const isRegistered = localStudent.profile_completed;
    const isActive = localStudent.is_active;
    const isClassAssigned = !!localStudent.assigned_class_name;

    // Intelligent Data Resolution
    const resolvedPhone = localStudent.phone || parentContact?.phone;
    const isPhoneSynced = !localStudent.phone && !!parentContact?.phone;
    
    const resolvedAddress = localStudent.address || (parentContact ? [parentContact.address, parentContact.city, parentContact.state, parentContact.country].filter(Boolean).join(', ') : null);
    const isAddressSynced = !localStudent.address && !!resolvedAddress;

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={onClose}>
                <div className="bg-background w-full max-w-6xl h-[92vh] rounded-[2rem] shadow-2xl border border-border flex flex-col overflow-hidden relative ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="bg-card/80 backdrop-blur-xl border-b border-border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-shrink-0 z-10 relative">
                        <div className="flex items-center gap-6">
                            <div className="relative group cursor-pointer" onClick={() => setIsEditing(true)}>
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-background overflow-hidden transition-transform group-hover:scale-105">
                                    {localStudent.profile_photo_url ? (
                                        <img src={localStudent.profile_photo_url} className="w-full h-full object-cover" alt={localStudent.display_name} />
                                    ) : (
                                        localStudent.display_name.charAt(0)
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <EditIcon className="w-6 h-6 text-white" />
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-background flex items-center justify-center shadow-sm ${localStudent.is_active ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                    {localStudent.is_active ? <CheckCircleIcon className="w-3.5 h-3.5 text-white"/> : <ClockIcon className="w-3.5 h-3.5 text-white"/>}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                                    {localStudent.display_name}
                                </h2>
                                <div className="flex flex-wrap gap-3 mt-2 items-center">
                                    <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground text-xs font-mono font-bold border border-border uppercase tracking-wider flex items-center gap-1.5">
                                        ID: {localStudent.student_id_number || 'PENDING'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                                        Grade {localStudent.grade}
                                    </span>
                                    {localStudent.assigned_class_name ? (
                                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                                            <CheckCircleIcon className="w-3 h-3"/> {localStudent.assigned_class_name}
                                        </span>
                                    ) : (
                                        <button 
                                            onClick={() => setIsAssignClassOpen(true)}
                                            className="px-3 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 animate-pulse flex items-center gap-1.5 transition-all hover:shadow-sm"
                                        >
                                            <AlertTriangleIcon className="w-3 h-3" /> Assign Class Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                             <button 
                                onClick={() => setIsEditing(true)} 
                                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95"
                            >
                                <EditIcon className="w-4 h-4" /> Edit Profile
                            </button>
                            <button onClick={onClose} className="p-2.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border">
                                <XIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>

                    {successMessage && (
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-4 fade-in border border-green-400">
                            <CheckCircleIcon className="w-5 h-5" /> {successMessage}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                        {/* Sidebar Navigation */}
                        <div className="w-full md:w-72 bg-muted/20 border-r border-border flex-shrink-0 overflow-y-auto custom-scrollbar backdrop-blur-sm">
                            <nav className="p-4 space-y-2">
                                <p className="px-4 py-2 text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-widest">Workspace</p>
                                <TabButton id="overview" label="Overview" icon={<UserIcon className="w-4 h-4"/>} />
                                <TabButton id="parents" label="Guardians" icon={<UsersIcon className="w-4 h-4"/>} />
                                <TabButton id="academic" label="Academic Info" icon={<GraduationCapIcon className="w-4 h-4"/>} />
                                <TabButton id="documents" label="Documents" icon={<FileTextIcon className="w-4 h-4"/>} />
                                <TabButton id="fees" label="Fees & Billing" icon={<CreditCardIcon className="w-4 h-4"/>} />
                                <TabButton id="history" label="History & Logs" icon={<ClockIcon className="w-4 h-4"/>} />
                            </nav>
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow overflow-y-auto p-8 bg-background custom-scrollbar relative scroll-smooth">
                            {loading ? (
                                <div className="absolute inset-0 flex justify-center items-center bg-background/80 backdrop-blur-sm z-20">
                                    <Spinner size="lg"/>
                                </div>
                            ) : (
                                <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    
                                    {/* OVERVIEW TAB */}
                                    {activeTab === 'overview' && (
                                        <>
                                            {/* Lifecycle Tracker */}
                                            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm mb-8 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5"><ChartBarIcon className="w-40 h-40 text-primary" /></div>
                                                <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
                                                    <ChartBarIcon className="w-4 h-4" /> Student Lifecycle Status
                                                </h3>
                                                <LifecycleStepper 
                                                    isApproved={isApproved} 
                                                    isRegistered={isRegistered} 
                                                    isActive={isActive} 
                                                    isClassAssigned={isClassAssigned} 
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                {/* Left Col - Basic Details */}
                                                <div className="lg:col-span-2 space-y-6">
                                                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                                                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                                                            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                                                                <UserIcon className="w-5 h-5 text-primary" /> Basic Details
                                                            </h3>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">Last Updated: {new Date().toLocaleDateString()}</span>
                                                                <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 border border-primary/20">
                                                                    <EditIcon className="w-3.5 h-3.5"/> Quick Edit
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                                            <InfoRow label="Email Address" value={localStudent.email} icon={<MailIcon className="w-4 h-4"/>} />
                                                            <InfoRow label="Phone Number" value={resolvedPhone} isSynced={isPhoneSynced} icon={<PhoneIcon className="w-4 h-4"/>} />
                                                            <InfoRow label="Gender" value={localStudent.gender || admissionData?.gender} icon={<UserIcon className="w-4 h-4"/>} />
                                                            <InfoRow label="Date of Birth" value={(localStudent.date_of_birth || admissionData?.date_of_birth) ? new Date(localStudent.date_of_birth || admissionData?.date_of_birth).toLocaleDateString() : null} icon={<CalendarIcon className="w-4 h-4"/>} />
                                                            <div className="col-span-full mt-2">
                                                                 <InfoRow label="Residential Address" value={resolvedAddress} isSynced={isAddressSynced} icon={<LocationIcon className="w-4 h-4"/>} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Col - ID Card */}
                                                <div className="lg:col-span-1">
                                                    <div className="flex flex-col items-center gap-6 sticky top-4">
                                                        <DigitalIdCard student={localStudent} onDownload={handleDownloadIdCard} loading={downloadingId} />
                                                        <button className="w-full max-w-sm py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all border border-border flex items-center justify-center gap-2">
                                                            View in Student Portal &rarr;
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* PARENTS TAB */}
                                    {activeTab === 'parents' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="p-3 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-xl">
                                                        <UserIcon className="w-6 h-6"/>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-foreground">Primary Guardian</h3>
                                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Main Contact</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <InfoRow label="Name" value={parentContact?.name || admissionData?.parent_name} icon={<UserIcon className="w-4 h-4"/>} />
                                                    <InfoRow label="Relationship" value={parentContact?.relationship || "Parent/Guardian"} icon={<UsersIcon className="w-4 h-4"/>} />
                                                    <InfoRow label="Email" value={parentContact?.email || admissionData?.parent_email} icon={<MailIcon className="w-4 h-4"/>} />
                                                    <InfoRow label="Phone" value={parentContact?.phone || admissionData?.parent_phone} icon={<PhoneIcon className="w-4 h-4"/>} />
                                                </div>
                                            </div>

                                            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center items-center text-center border-dashed">
                                                 <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                     <UsersIcon className="w-8 h-8 text-muted-foreground/50"/>
                                                 </div>
                                                 <h3 className="font-bold text-foreground">Secondary Guardian</h3>
                                                 <p className="text-sm text-muted-foreground mt-1 max-w-xs">No secondary contact added. Add one for emergency purposes.</p>
                                                 <button className="mt-6 text-xs font-bold bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">
                                                     Add Secondary Guardian
                                                 </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* DOCUMENTS TAB */}
                                    {activeTab === 'documents' && (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-lg font-bold text-foreground">Student Documents</h3>
                                                    <p className="text-xs text-muted-foreground">Manage official records and verification.</p>
                                                </div>
                                                <button className="text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                                                    Request Document
                                                </button>
                                            </div>
                                            
                                            {documents.length === 0 ? (
                                                <div className="p-16 text-center bg-muted/20 border-2 border-dashed border-border rounded-2xl">
                                                    <FileTextIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                                    <p className="text-muted-foreground font-medium">No documents uploaded yet.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                                    {documents.map(doc => (
                                                        <div key={doc.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-lg transition-all group relative flex flex-col">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                                                    <FileTextIcon className="w-6 h-6"/>
                                                                </div>
                                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                                                                    doc.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                                    doc.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                                                }`}>
                                                                    {doc.status}
                                                                </span>
                                                            </div>
                                                            
                                                            <h4 className="font-bold text-foreground text-sm truncate mb-1" title={doc.file_name}>{doc.file_name}</h4>
                                                            <p className="text-xs text-muted-foreground mb-4">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                                            
                                                            <div className="mt-auto flex gap-2 pt-4 border-t border-border/50">
                                                                <button onClick={() => window.open(supabase.storage.from('admission-documents').getPublicUrl(doc.storage_path).data.publicUrl, '_blank')} className="flex-1 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                                                                    View
                                                                </button>
                                                                {doc.status !== 'Accepted' && (
                                                                    <button onClick={() => handleVerifyDocument(doc)} className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors" title="Verify">
                                                                        <ShieldCheckIcon className="w-4 h-4"/>
                                                                    </button>
                                                                )}
                                                                {doc.status !== 'Rejected' && (
                                                                    <button onClick={() => handleRejectDocument(doc)} className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors" title="Reject">
                                                                        <XIcon className="w-4 h-4"/>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* FEES TAB */}
                                    {activeTab === 'fees' && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/20">
                                                    <p className="text-xs font-bold uppercase opacity-80 tracking-wider">Total Billed</p>
                                                    <p className="text-3xl font-mono font-bold mt-2">$12,450</p>
                                                </div>
                                                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Paid Amount</p>
                                                    <p className="text-3xl font-mono font-bold text-foreground mt-2">$8,200</p>
                                                </div>
                                                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                                                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Pending Due</p>
                                                    <p className="text-3xl font-mono font-bold text-foreground mt-2">$4,250</p>
                                                </div>
                                            </div>

                                            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                                <div className="p-5 border-b border-border bg-muted/10 flex justify-between items-center">
                                                    <h3 className="font-bold text-foreground">Transaction History</h3>
                                                    <button className="text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 shadow-sm">Create Invoice</button>
                                                </div>
                                                {invoices.length === 0 ? (
                                                    <div className="p-12 text-center text-muted-foreground text-sm">No invoice records found.</div>
                                                ) : (
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                            <tr>
                                                                <th className="p-5">Date</th>
                                                                <th className="p-5">Description</th>
                                                                <th className="p-5 text-right">Amount</th>
                                                                <th className="p-5 text-center">Status</th>
                                                                <th className="p-5 text-right">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/50">
                                                            {invoices.map(inv => (
                                                                <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                                                                    <td className="p-5 font-medium">{new Date(inv.due_date).toLocaleDateString()}</td>
                                                                    <td className="p-5 text-muted-foreground">{inv.description}</td>
                                                                    <td className="p-5 text-right font-mono">${inv.amount}</td>
                                                                    <td className="p-5 text-center">
                                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                            {inv.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-5 text-right">
                                                                        <button className="text-muted-foreground hover:text-primary p-2 hover:bg-muted rounded-lg transition-colors"><DownloadIcon className="w-4 h-4"/></button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ACADEMIC TAB */}
                                    {activeTab === 'academic' && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                 <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                                                     <h4 className="font-bold text-foreground mb-6 flex items-center gap-2 text-lg">
                                                         <CalendarIcon className="w-5 h-5 text-primary"/> Attendance Overview
                                                     </h4>
                                                     {attendance.length > 0 ? (
                                                         <div className="space-y-4">
                                                             {/* Mock Chart Bars */}
                                                             <div className="flex items-end gap-3 h-40 pb-2 border-b border-border">
                                                                 {[90, 95, 80, 85, 92].map((h, i) => (
                                                                     <div key={i} className="w-full bg-primary/10 rounded-t-lg relative group h-full flex items-end">
                                                                         <div className="w-full bg-primary rounded-t-lg transition-all duration-1000 group-hover:bg-primary/80" style={{height: `${h}%`}}></div>
                                                                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
                                                                     </div>
                                                                 ))}
                                                             </div>
                                                             <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                                                                 <span>Week 1</span><span>Week 5</span>
                                                             </div>
                                                         </div>
                                                     ) : (
                                                         <p className="text-muted-foreground text-sm text-center py-12">No attendance data available.</p>
                                                     )}
                                                 </div>

                                                 <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                                                      <h4 className="font-bold text-foreground mb-6 flex items-center gap-2 text-lg">
                                                         <ChartBarIcon className="w-5 h-5 text-primary"/> Performance Stats
                                                     </h4>
                                                     <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm italic bg-muted/10 rounded-xl border-2 border-dashed border-border">
                                                         <ChartBarIcon className="w-8 h-8 mb-2 opacity-20"/>
                                                         Performance charts populated after first term exams.
                                                     </div>
                                                 </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* HISTORY TAB */}
                                    {activeTab === 'history' && (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-bold text-foreground">Activity Log</h3>
                                                <button className="text-xs font-bold text-primary hover:underline">Export Logs</button>
                                            </div>
                                            <div className="relative border-l-2 border-border/60 ml-3 space-y-8 py-2">
                                                {historyLogs.map((log, idx) => (
                                                    <div key={log.id} className="relative pl-8 group">
                                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-muted-foreground/30 group-hover:border-primary group-hover:scale-110 transition-all z-10"></div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{log.action}</span>
                                                            <span className="text-xs text-muted-foreground mt-1">by <span className="font-semibold text-foreground/80">{log.user}</span> • {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal Overlay */}
            {isEditing && (
                <EditStudentDetailsModal 
                    student={localStudent} 
                    onClose={() => setIsEditing(false)} 
                    onSave={handleEditSuccess} 
                />
            )}
            
            {/* Assign Class Modal Overlay */}
            {isAssignClassOpen && (
                <AssignClassModal 
                    studentId={localStudent.id}
                    onClose={() => setIsAssignClassOpen(false)}
                    onUpdate={handleAssignClassSuccess}
                />
            )}
        </>
    );
};

export default StudentProfileModal;
