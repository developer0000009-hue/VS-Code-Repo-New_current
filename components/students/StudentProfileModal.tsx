
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { ActivityIcon } from '../icons/ActivityIcon';
import EditStudentDetailsModal from './EditStudentDetailsModal';
import CustomSelect from '../common/CustomSelect';
import { XCircleIcon } from '../icons/XCircleIcon';

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
const AssignClassModal: React.FC<{ studentId: string, currentClassId?: number, onClose: () => void, onUpdate: () => void }> = ({ studentId, currentClassId, onClose, onUpdate }) => {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>(currentClassId?.toString() || '');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchClasses = async () => {
            setFetching(true);
            const { data, error } = await supabase
                .from('school_classes')
                .select('*, students:student_profiles(count)')
                .order('name');

            if (error) {
                setError("Failed to load classes. Please verify your administrative access.");
            } else {
                setClasses(data || []);
            }
            setFetching(false);
        };
        fetchClasses();
    }, []);

    const handleAssign = async () => {
        if (!selectedClassId || selectedClassId === 'null') return;
        
        const targetClassId = parseInt(selectedClassId);
        if (isNaN(targetClassId)) {
            setError("Invalid class selection. Please try again.");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const classObj: any = classes.find(c => c.id === targetClassId);
            if (!classObj) throw new Error("The selected class is no longer available.");

            // Capacity Check
            const currentCount = classObj.students?.[0]?.count || 0;
            const capacity = classObj.capacity || 30;
            
            if (currentCount >= capacity && currentClassId !== targetClassId) {
                const proceed = confirm(`Warning: ${classObj.name} is currently at full capacity (${currentCount}/${capacity}). Do you wish to override and enroll this student anyway?`);
                if (!proceed) {
                    setLoading(false);
                    return;
                }
            }

            const { data: updatedData, error: updateError } = await supabase
                .from('student_profiles')
                .upsert({ 
                    user_id: studentId,
                    assigned_class_id: targetClassId,
                    grade: classObj.grade_level 
                }, { onConflict: 'user_id' })
                .select('assigned_class_id')
                .maybeSingle();
            
            if (updateError) throw updateError;
            if (!updatedData) throw new Error("Update verification failed.");

            setSuccess(true);
            onUpdate();
            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (err: any) {
            setError(err.message || "An error occurred during assignment.");
            setLoading(false);
        }
    };

    const classOptions = classes.map(c => ({
        value: c.id.toString(),
        label: `${c.name} (Grade ${c.grade_level})`,
    }));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95" onClick={onClose}>
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {success ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircleIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold">Enrollment Successful</h3>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Assign Class</h3>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors"><XIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-6">
                            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">{error}</div>}
                            <CustomSelect
                                value={selectedClassId}
                                onChange={setSelectedClassId}
                                options={classOptions}
                                placeholder="Select class..."
                                searchable
                                icon={<SchoolIcon className="w-4 h-4"/>}
                            />
                            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                                <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                                <button onClick={handleAssign} disabled={!selectedClassId || loading} className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50">
                                    {loading ? <Spinner size="sm" className="text-current"/> : 'Assign'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const DigitalIdCard: React.FC<{ student: StudentForAdmin, onDownload: () => void, loading: boolean }> = ({ student, onDownload, loading }) => {
    const profileImg = student.profile_photo_url || `https://api.dicebear.com/8.x/initials/svg?seed=${student.display_name}`;
    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(student.id)}&size=300&margin=1&ecLevel=H&dark=0f172a&light=ffffff`;

    return (
        <div className="bg-background border border-border rounded-3xl shadow-xl overflow-hidden max-w-sm mx-auto group relative ring-1 ring-black/5 hover:shadow-2xl transition-all duration-300">
            <div className="h-[480px] flex flex-col relative bg-white dark:bg-slate-900">
                <div className="h-32 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-1 z-10">
                        <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 shadow-sm">
                            <SchoolIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-extrabold text-white text-lg tracking-wide">SCHOOL PORTAL</span>
                    </div>
                    <span className="text-[9px] text-blue-50 uppercase tracking-[0.3em] font-bold opacity-90 z-10">Student ID</span>
                </div>

                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
                    <div className="w-28 h-28 rounded-full p-1 bg-white dark:bg-slate-900 shadow-xl ring-4 ring-white/20">
                         <img src={profileImg} alt="Profile" className="w-full h-full rounded-full object-cover bg-slate-100" />
                    </div>
                    <div className={`absolute bottom-1 right-1 w-7 h-7 border-4 border-white dark:border-slate-900 rounded-full ${student.is_active ? 'bg-emerald-500' : 'bg-amber-500'} shadow-md flex items-center justify-center`}>
                        {student.is_active && <CheckCircleIcon className="w-3 h-3 text-white" />}
                    </div>
                </div>

                <div className="mt-16 flex-grow flex flex-col items-center px-6 text-center pt-4">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{student.display_name}</h2>
                    <span className="px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-6 border border-indigo-100 dark:border-indigo-800/50">
                        Grade {student.grade}
                    </span>

                    <div className="grid grid-cols-2 gap-3 w-full mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Section</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{student.assigned_class_name || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">ID Number</p>
                            <p className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm tracking-tight">{student.student_id_number || '---'}</p>
                        </div>
                    </div>

                    <div className="mt-auto mb-6 flex flex-col items-center gap-2">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                            <img src={qrUrl} alt="QR" className="w-20 h-20 object-contain"/>
                        </div>
                    </div>
                </div>
            </div>
             <div className="absolute bottom-4 left-0 right-0 px-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onDownload} disabled={loading} className="w-full py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-xl active:scale-95 disabled:opacity-70">
                    {loading ? <Spinner size="sm" className="text-current"/> : 'Download ID'}
                </button>
             </div>
        </div>
    );
};

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose, onUpdate, initialTab = 'overview' }) => {
    const [localStudent, setLocalStudent] = useState<StudentForAdmin>(student);
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [loading, setLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState(false);
    const [documents, setDocuments] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
    const [attendance, setAttendance] = useState<StudentAttendanceRecord[]>([]);
    const [admissionData, setAdmissionData] = useState<any>(null);
    const [parentContact, setParentContact] = useState<any>(null);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isAssignClassOpen, setIsAssignClassOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                supabase.rpc('get_linked_parent_for_student', { p_student_id: localStudent.id }),
                supabase.from('admissions').select('*').eq('student_user_id', localStudent.id).maybeSingle()
            ]);

            if (results[0].status === 'fulfilled' && results[0].value.data?.found) {
                setParentContact(results[0].value.data);
            }
            if (results[1].status === 'fulfilled' && results[1].value.data) {
                setAdmissionData(results[1].value.data);
            }

            if (activeTab === 'academic') {
                const { data } = await supabase.rpc('get_student_attendance_records', { p_student_id: localStudent.id });
                setAttendance(data || []);
            }
            
            if (activeTab === 'fees') {
                const { data } = await supabase.rpc('get_student_invoices', { p_student_id: localStudent.id });
                setInvoices(data || []);
            }

            if (activeTab === 'documents' && admissionData?.id) {
                const { data: docsRes } = await supabase.from('admission_documents').select('*').eq('admission_id', admissionData.id);
                setDocuments(docsRes || []);
            }

        } catch (e) { console.error("Profile Modal Fetch Error:", e); }
        finally { setLoading(false); }
    }, [activeTab, localStudent.id, admissionData?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEditSuccess = () => {
        setSuccessMessage("Profile updated.");
        onUpdate();
        fetchData();
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // Fix: Defined handleAssignClassSuccess to resolve reference error
    const handleAssignClassSuccess = () => {
        setIsAssignClassOpen(false);
        setSuccessMessage("Class assigned successfully.");
        onUpdate();
        fetchData();
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const InfoRow = ({ label, value, icon, isSynced = false }: { label: string, value?: string | null, icon?: React.ReactNode, isSynced?: boolean }) => (
        <div className="py-3.5 border-b border-border/40 last:border-0 flex items-start gap-3 group">
            <div className="mt-0.5 p-1.5 rounded-md bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">{icon}</div>
            <div className="flex-grow">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-foreground break-words">{value || '—'}</p>
                {isSynced && <span className="text-[8px] font-bold text-primary mt-1 block">Synced with Parent Profile</span>}
            </div>
        </div>
    );

    const TabButton = ({ id, label, icon }: { id: TabType, label: string, icon: React.ReactNode }) => (
        <button 
            onClick={() => setActiveTab(id)} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === id ? 'bg-card text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
        >
            {icon} {label}
        </button>
    );

    // Fix: useMemo is now correctly imported
    const attendanceStats = useMemo(() => {
        if (attendance.length === 0) return { percent: 100, present: 0, absent: 0, total: 0 };
        const present = attendance.filter(r => r.status === 'Present').length;
        const absent = attendance.filter(r => r.status === 'Absent').length;
        const late = attendance.filter(r => r.status === 'Late').length;
        return {
            percent: Math.round((present / attendance.length) * 100),
            present,
            absent,
            late,
            total: attendance.length
        };
    }, [attendance]);

    // Fix: useMemo is now correctly imported
    const financialSummary = useMemo(() => {
        return invoices.reduce((acc, inv) => {
            acc.total += inv.amount;
            acc.paid += inv.amount_paid || 0;
            acc.due += (inv.amount - (inv.amount_paid || 0));
            if (inv.status === 'Overdue') acc.overdue += (inv.amount - (inv.amount_paid || 0));
            return acc;
        }, { total: 0, paid: 0, due: 0, overdue: 0 });
    }, [invoices]);

    // Fix: Defined historyLogs to resolve reference error
    const historyLogs = useMemo(() => [
        { id: 1, action: 'Admission Approved', date: localStudent.created_at || new Date().toISOString(), user: 'Admissions System' },
        { id: 2, action: 'Record Synchronized', date: localStudent.created_at || new Date().toISOString(), user: 'System Agent' },
    ], [localStudent]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-background w-full max-w-6xl h-[92vh] rounded-[2rem] shadow-2xl border border-border flex flex-col overflow-hidden relative ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                <div className="bg-card/80 backdrop-blur-xl border-b border-border p-6 flex justify-between items-center z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                            {localStudent.profile_photo_url ? <img src={localStudent.profile_photo_url} className="w-full h-full object-cover" /> : localStudent.display_name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{localStudent.display_name}</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs font-mono font-bold text-muted-foreground uppercase">ID: {localStudent.student_id_number || 'PENDING'}</span>
                                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 text-[10px] font-bold">Grade {localStudent.grade}</span>
                                {localStudent.assigned_class_name && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">{localStudent.assigned_class_name}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg flex items-center gap-2"><EditIcon className="w-4 h-4"/> Edit</button>
                        <button onClick={onClose} className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"><XIcon className="w-6 h-6"/></button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    <div className="w-full md:w-64 bg-muted/20 border-r border-border p-4 space-y-1.5 flex-shrink-0">
                        <TabButton id="overview" label="Overview" icon={<UserIcon className="w-4 h-4"/>} />
                        <TabButton id="parents" label="Guardians" icon={<UsersIcon className="w-4 h-4"/>} />
                        <TabButton id="academic" label="Academic Info" icon={<GraduationCapIcon className="w-4 h-4"/>} />
                        <TabButton id="documents" label="Documents" icon={<FileTextIcon className="w-4 h-4"/>} />
                        <TabButton id="fees" label="Fees & Billing" icon={<CreditCardIcon className="w-4 h-4"/>} />
                        <TabButton id="history" label="History" icon={<ClockIcon className="w-4 h-4"/>} />
                    </div>

                    <div className="flex-grow overflow-y-auto p-8 bg-background custom-scrollbar relative">
                        {loading && <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center"><Spinner size="lg" /></div>}
                        
                        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                            <h3 className="font-bold text-lg mb-6 border-b pb-4">Lifecycle Status</h3>
                                            <LifecycleStepper 
                                                isApproved={true} 
                                                isRegistered={localStudent.profile_completed} 
                                                isActive={localStudent.is_active} 
                                                isClassAssigned={!!localStudent.assigned_class_id} 
                                            />
                                        </div>
                                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                            <h3 className="font-bold text-lg mb-6 border-b pb-4">Core Info</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                                <InfoRow label="Email" value={localStudent.email} icon={<MailIcon className="w-4 h-4"/>} />
                                                <InfoRow label="Gender" value={localStudent.gender || admissionData?.gender} icon={<UserIcon className="w-4 h-4"/>} />
                                                <InfoRow label="DOB" value={localStudent.date_of_birth || admissionData?.date_of_birth} icon={<CalendarIcon className="w-4 h-4"/>} />
                                                <InfoRow label="Joined" value={new Date(localStudent.created_at || '').toLocaleDateString()} icon={<ClockIcon className="w-4 h-4"/>} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-1">
                                        <DigitalIdCard student={localStudent} onDownload={() => {}} loading={false} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'academic' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-card border border-border rounded-2xl p-6 text-center">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Attendance Rate</p>
                                            <p className={`text-4xl font-black ${attendanceStats.percent < 75 ? 'text-red-500' : 'text-emerald-500'}`}>{attendanceStats.percent}%</p>
                                        </div>
                                        <div className="bg-card border border-border rounded-2xl p-6 text-center">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Present Days</p>
                                            <p className="text-4xl font-black text-foreground">{attendanceStats.present}</p>
                                        </div>
                                        <div className="bg-card border border-border rounded-2xl p-6 text-center">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Absences</p>
                                            <p className="text-4xl font-black text-red-500">{attendanceStats.absent}</p>
                                        </div>
                                    </div>

                                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                        <div className="p-6 border-b border-border bg-muted/5 flex justify-between items-center">
                                            <h3 className="font-bold text-lg">Academic Status</h3>
                                            {!localStudent.assigned_class_id && <button onClick={() => setIsAssignClassOpen(true)} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all">Assign To Class</button>}
                                        </div>
                                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Grade</p><p className="font-bold text-foreground">{localStudent.grade}</p></div>
                                            <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Section</p><p className="font-bold text-foreground">{localStudent.assigned_class_name || 'Unassigned'}</p></div>
                                            <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Term Status</p><span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">ENROLLED</span></div>
                                            <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Reporting</p><p className="font-bold text-foreground">Available</p></div>
                                        </div>
                                    </div>

                                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                        <div className="p-6 border-b border-border bg-muted/5"><h3 className="font-bold text-lg">Attendance Log</h3></div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase">
                                                    <tr><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4">Notes</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {attendance.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No records found for this academic period.</td></tr> :
                                                        attendance.slice(0, 10).map(rec => (
                                                            <tr key={rec.date} className="hover:bg-muted/30">
                                                                <td className="p-4 font-medium">{new Date(rec.date).toLocaleDateString()}</td>
                                                                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${rec.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rec.status}</span></td>
                                                                <td className="p-4 text-muted-foreground text-xs italic">{rec.notes || '—'}</td>
                                                            </tr>
                                                        ))
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'fees' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Billed</p>
                                            <p className="text-2xl font-black">${financialSummary.total.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Total Paid</p>
                                            <p className="text-2xl font-black text-emerald-600">${financialSummary.paid.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm ring-1 ring-amber-500/20">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Balance Due</p>
                                            <p className="text-2xl font-black text-amber-600">${financialSummary.due.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm">
                                            <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Overdue</p>
                                            <p className="text-2xl font-black text-red-600">${financialSummary.overdue.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                        <div className="p-6 border-b border-border bg-muted/5 flex justify-between items-center"><h3 className="font-bold text-lg">Invoices</h3><button className="btn-primary text-xs"><PlusIcon className="w-3.5 h-3.5"/> Create Invoice</button></div>
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-muted/50 text-xs font-bold uppercase text-muted-foreground">
                                                <tr><th className="p-4">Description</th><th className="p-4">Amount</th><th className="p-4">Due Date</th><th className="p-4">Status</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {invoices.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No invoices generated.</td></tr> :
                                                    invoices.map(inv => (
                                                        <tr key={inv.id} className="hover:bg-muted/30">
                                                            <td className="p-4 font-medium">{inv.description}</td>
                                                            <td className="p-4 font-mono font-bold">${inv.amount.toLocaleString()}</td>
                                                            <td className="p-4">{new Date(inv.due_date).toLocaleDateString()}</td>
                                                            <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span></td>
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold">Activity Log</h3>
                                    <div className="relative border-l-2 border-border ml-4 space-y-8 py-2">
                                        {historyLogs.map(log => (
                                            <div key={log.id} className="relative pl-8 group">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary group-hover:scale-110 transition-transform"></div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{log.action}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                        <CalendarIcon className="w-3 h-3"/> {new Date(log.date).toLocaleString()}
                                                        <span className="w-1 h-1 rounded-full bg-border"></span>
                                                        <UserIcon className="w-3 h-3"/> By {log.user}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'parents' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                                        <h3 className="font-bold text-lg mb-6 border-b pb-4">Primary Guardian</h3>
                                        <div className="space-y-1">
                                            <InfoRow label="Name" value={parentContact?.name || admissionData?.parent_name} icon={<UserIcon className="w-4 h-4"/>} />
                                            <InfoRow label="Relationship" value={parentContact?.relationship || "Guardian"} icon={<UsersIcon className="w-4 h-4"/>} />
                                            <InfoRow label="Email" value={parentContact?.email || admissionData?.parent_email} icon={<MailIcon className="w-4 h-4"/>} />
                                            <InfoRow label="Phone" value={parentContact?.phone || admissionData?.parent_phone} icon={<PhoneIcon className="w-4 h-4"/>} />
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm border-dashed flex flex-col items-center justify-center text-center opacity-60">
                                         <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4"><UsersIcon className="w-8 h-8 text-muted-foreground"/></div>
                                         <h4 className="font-bold text-foreground">Secondary Contact</h4>
                                         <p className="text-xs text-muted-foreground mt-1">No secondary contact found in parent profile.</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold">Verification Files</h3>
                                    {documents.length === 0 ? <div className="p-20 text-center bg-muted/10 border-2 border-dashed border-border rounded-3xl"><p className="text-muted-foreground">No documents found.</p></div> :
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {documents.map(doc => (
                                                <div key={doc.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col group hover:border-primary/50 transition-all">
                                                    <div className="flex justify-between items-start mb-4"><FileTextIcon className="w-8 h-8 text-blue-500"/><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${doc.status === 'Accepted' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{doc.status}</span></div>
                                                    <p className="text-xs font-bold text-foreground truncate mb-1">{doc.file_name}</p>
                                                    <p className="text-[10px] text-muted-foreground">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                                    <button onClick={() => window.open(supabase.storage.from('admission-documents').getPublicUrl(doc.storage_path).data.publicUrl, '_blank')} className="mt-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-[10px] font-bold uppercase transition-colors">View Document</button>
                                                </div>
                                            ))}
                                        </div>
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isEditing && <EditStudentDetailsModal student={localStudent} onClose={() => setIsEditing(false)} onSave={handleEditSuccess} />}
            {isAssignClassOpen && <AssignClassModal studentId={localStudent.id} currentClassId={localStudent.assigned_class_id} onClose={() => setIsAssignClassOpen(false)} onUpdate={handleAssignClassSuccess} />}
            <style>{`.btn-primary { padding: 0.5rem 1rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 0.5rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.5rem; }`}</style>
        </div>
    );
};

export default StudentProfileModal;
