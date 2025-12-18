
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { StudentForAdmin, SchoolBranch } from '../types';
import Spinner from './common/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { StudentsIcon } from './icons/StudentsIcon';
import { SearchIcon } from './icons/SearchIcon';
import { FilterIcon } from './icons/FilterIcon';
import { UsersIcon } from './icons/UsersIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { MailIcon } from './icons/MailIcon';
import { UserIcon } from './icons/UserIcon';
import { EditIcon } from './icons/EditIcon';
import { KeyIcon } from './icons/KeyIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { UploadIcon } from './icons/UploadIcon';
import { TransferIcon } from './icons/TransferIcon';
import { BookIcon } from './icons/BookIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { BellIcon } from './icons/BellIcon';
import { SchoolIcon } from './icons/SchoolIcon';

import StudentProfileModal from './students/StudentProfileModal';
import BulkStudentActionsModal, { BulkStudentActionType } from './students/BulkStudentActionsModal';
import ConfirmationModal from './common/ConfirmationModal';

// --- Error Helper ---
const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') return err;
    
    const message = err.message || err.error_description || err.details?.message || err.details || err.hint;
    
    if (message && typeof message === 'string') return message;
    
    try {
        return JSON.stringify(err);
    } catch {
        return "An unexpected system error occurred.";
    }
};

// --- KPICard ---
const KPICard: React.FC<{ title: string, value: number, icon: React.ReactNode, color: string, onClick?: () => void, active?: boolean }> = ({ title, value, icon, color, onClick, active }) => (
    <div 
        onClick={onClick}
        className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-lg group ${active ? 'bg-card border-primary ring-2 ring-primary/20 shadow-md' : 'bg-card border-border hover:border-primary/50'}`}
    >
        <div className="flex justify-between items-start mb-3">
            <div className={`p-3 rounded-xl text-white shadow-lg shadow-black/5 transform group-hover:scale-110 transition-transform duration-300 ${color}`}>
                {icon}
            </div>
        </div>
        <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-extrabold text-foreground mt-1 tracking-tight">{value}</h3>
        </div>
    </div>
);

// --- AddStudentModal ---
export const AddStudentModal: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        phone: '',
        grade: '',
        student_id_number: '',
        branch_id: '',
    });
    const [branches, setBranches] = useState<SchoolBranch[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBranches = async () => {
            const { data } = await supabase.rpc('get_school_branches');
            if (data) {
                setBranches(data);
                // Default to first branch if available
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, branch_id: String(data[0].id) }));
                }
            }
            setLoadingBranches(false);
        };
        fetchBranches();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!formData.branch_id) {
                throw new Error("Please select a branch.");
            }

            // Use RPC to create student securely bypassing RLS
            const { data, error } = await supabase.rpc('admin_create_student', {
                p_email: formData.email,
                p_display_name: formData.display_name,
                p_phone: formData.phone,
                p_grade: formData.grade,
                p_student_id_number: formData.student_id_number,
                p_branch_id: parseInt(formData.branch_id)
            });

            if (error) throw error;
            
            if (data && data.success === false) {
                throw new Error(data.error || 'Failed to create student.');
            }

            onSave();
            onClose();
        } catch (err: any) {
            console.error("Add Student Error:", err);
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in-95">
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-foreground">Add New Student</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><XIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-600 font-medium break-words">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Full Name</label>
                        <input name="display_name" required value={formData.display_name} onChange={handleChange} className="w-full p-3 border border-input rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g. John Doe" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Email</label>
                            <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full p-3 border border-input rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="john@example.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Phone</label>
                            <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full p-3 border border-input rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="+1..." />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Grade</label>
                            <select name="grade" required value={formData.grade} onChange={handleChange} className="w-full p-3 border border-input rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none">
                                <option value="">Select...</option>
                                {Array.from({length: 12}, (_, i) => i + 1).map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Student ID (Roll No)</label>
                            <input name="student_id_number" value={formData.student_id_number} onChange={handleChange} className="w-full p-3 border border-input rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="e.g. 2025-001" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Assign to Branch</label>
                        {loadingBranches ? (
                            <div className="h-11 w-full bg-muted/50 rounded-xl animate-pulse"></div>
                        ) : (
                            <div className="relative">
                                <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"/>
                                <select 
                                    name="branch_id" 
                                    required 
                                    value={formData.branch_id} 
                                    onChange={handleChange} 
                                    className="w-full p-3 pl-10 border border-input rounded-xl bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select Branch</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} {b.is_main_branch ? '(Main)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-3 border-t border-border mt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 font-bold text-muted-foreground hover:bg-muted rounded-xl text-sm transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg hover:bg-primary/90 flex items-center gap-2 transition-all disabled:opacity-50">
                            {loading ? <Spinner size="sm" className="text-current"/> : 'Add Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Helper Components for Table ---

const LifecycleBadge: React.FC<{ student: StudentForAdmin }> = ({ student }) => {
    if (student.is_active) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
            </span>
        );
    }
    if (!student.profile_completed) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span> Pending Reg
            </span>
        );
    }
    // Profile completed but inactive = suspended or graduated
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inactive
        </span>
    );
};

const FeeStatusBadge: React.FC<{ status: 'Paid' | 'Pending' | 'Overdue' }> = ({ status }) => {
    let styles = '';
    if (status === 'Paid') styles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    else if (status === 'Pending') styles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
    else if (status === 'Overdue') styles = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles}`}>
            {status}
        </span>
    );
};

// --- Action Menu ---
const StudentActionMenu: React.FC<{ 
    student: StudentForAdmin; 
    onAction: (action: string, student: StudentForAdmin) => void;
    isOpen: boolean;
    setOpenId: (id: string | null) => void;
}> = ({ student, onAction, isOpen, setOpenId }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenId(null);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, setOpenId]);

    if (!isOpen) return null;

    const actions = [
        { id: 'view_profile', label: 'View Full Profile', icon: <UserIcon className="w-4 h-4"/> },
        { id: 'edit_student', label: 'Edit Student', icon: <EditIcon className="w-4 h-4"/> },
        { id: 'assign_grade', label: 'Assign Grade & Section', icon: <BookIcon className="w-4 h-4"/> },
        { id: 'reset_login', label: 'Reset Login', icon: <KeyIcon className="w-4 h-4"/> },
        { id: 'view_documents', label: 'View Documents', icon: <FileTextIcon className="w-4 h-4"/> },
        { id: 'upload_files', label: 'Upload Missing Files', icon: <UploadIcon className="w-4 h-4"/> },
        { id: 'view_fees', label: 'View Fee Details', icon: <CreditCardIcon className="w-4 h-4"/> },
        { id: 'transfer', label: 'Transfer to Another Branch', icon: <TransferIcon className="w-4 h-4"/> },
        { id: 'deactivate', label: 'Deactivate / Delete', icon: <TrashIcon className="w-4 h-4"/>, variant: 'danger' },
    ];

    return (
        <div 
            ref={menuRef}
            className="absolute right-8 top-0 mt-2 w-64 bg-card rounded-xl shadow-2xl border border-border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="py-1">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        disabled={(action as any).disabled}
                        onClick={() => { onAction(action.id, student); setOpenId(null); }}
                        className={`
                            w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-3 transition-colors
                            ${(action as any).disabled ? 'opacity-50 cursor-not-allowed text-muted-foreground' : 
                              (action as any).variant === 'danger' ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-foreground hover:bg-muted'}
                        `}
                    >
                        <span className={`opacity-70 ${(action as any).variant === 'danger' ? 'text-red-500' : 'text-muted-foreground'}`}>{action.icon}</span>
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
};


const StudentManagementTab: React.FC = () => {
    const [allStudents, setAllStudents] = useState<StudentForAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Advanced Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [quickFilter, setQuickFilter] = useState<'All' | 'Active' | 'Pending' | 'New'>('All');
    const [gradeFilter, setGradeFilter] = useState('');
    const [feeStatusFilter, setFeeStatusFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    // Selection & Pagination
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Menu State
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Modal States
    const [selectedStudent, setSelectedStudent] = useState<StudentForAdmin | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<BulkStudentActionType | null>(null);
    const [bulkIds, setBulkIds] = useState<string[]>([]); // For single or bulk actions
    const [initialProfileTab, setInitialProfileTab] = useState<'overview' | 'parents' | 'academic' | 'documents' | 'fees' | 'history'>('overview');
    
    const [deactivateConfirm, setDeactivateConfirm] = useState<StudentForAdmin | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_students_for_admin');
        if (!error && data) {
            const valid = (data as StudentForAdmin[]).filter(s => s.role === 'Student');
            setAllStudents(valid);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Mock Fee Generator for Demo (Consistent Hashing) ---
    const getFeeStatus = useCallback((id: string): 'Paid' | 'Pending' | 'Overdue' => {
        const hash = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
        if (hash % 3 === 0) return 'Paid';
        if (hash % 3 === 1) return 'Pending';
        return 'Overdue';
    }, []);

    // --- Filter Logic ---
    const filteredStudents = useMemo(() => {
        return allStudents.filter(s => {
            // Enhanced Search: Name, Email, ID, Phone, Parent Name
            const matchesSearch = !searchTerm || 
                s.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.student_id_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.phone?.includes(searchTerm) ||
                s.parent_guardian_details?.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesQuick = true;
            if (quickFilter === 'Active') matchesQuick = s.is_active;
            if (quickFilter === 'Pending') matchesQuick = !s.profile_completed && !s.is_active;
            if (quickFilter === 'New') matchesQuick = new Date(s.created_at || '').toDateString() === new Date().toDateString();

            // Advanced Filters
            const matchesGrade = !gradeFilter || s.grade === gradeFilter;
            const matchesFee = !feeStatusFilter || getFeeStatus(s.id) === feeStatusFilter;
            const matchesGender = !genderFilter || s.gender === genderFilter;
            
            let matchesYear = true;
            if (yearFilter) {
                const joinYear = new Date(s.created_at || '').getFullYear().toString();
                matchesYear = joinYear === yearFilter;
            }

            return matchesSearch && matchesQuick && matchesGrade && matchesFee && matchesGender && matchesYear;
        });
    }, [allStudents, searchTerm, quickFilter, gradeFilter, feeStatusFilter, genderFilter, yearFilter, getFeeStatus]);

    // --- Sorting Logic ---
    const sortedStudents = useMemo(() => {
        const sorted = [...filteredStudents];
        sorted.sort((a, b) => {
            let aVal: any = '';
            let bVal: any = '';

            switch(sortConfig.key) {
                case 'name': aVal = a.display_name; bVal = b.display_name; break;
                case 'grade': aVal = parseInt(a.grade || '0'); bVal = parseInt(b.grade || '0'); break;
                case 'date': aVal = new Date(a.created_at || '').getTime(); bVal = new Date(b.created_at || '').getTime(); break;
                case 'status': aVal = a.is_active ? 1 : 0; bVal = b.is_active ? 1 : 0; break;
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredStudents, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // --- Pagination ---
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedStudents.slice(start, start + itemsPerPage);
    }, [sortedStudents, currentPage]);
    
    const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);

    // --- Handlers ---
    const handleSelectAll = () => {
        if (selectedIds.size === paginatedData.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(paginatedData.map(s => s.id)));
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const stats = useMemo(() => ({
        total: allStudents.length,
        active: allStudents.filter(s => s.is_active).length,
        pending: allStudents.filter(s => !s.profile_completed && !s.is_active).length,
        newToday: allStudents.filter(s => new Date(s.created_at || '').toDateString() === new Date().toDateString()).length
    }), [allStudents]);

    
    // --- Action Handlers ---
    const handleMenuAction = (action: string, student: StudentForAdmin) => {
        switch (action) {
            case 'view_profile':
                setInitialProfileTab('overview');
                setSelectedStudent(student);
                break;
            case 'edit_student':
                setInitialProfileTab('overview');
                setSelectedStudent(student);
                break;
            case 'assign_grade':
                setBulkIds([student.id]);
                setBulkAction('assign_class');
                break;
            case 'reset_login':
                if (confirm(`Reset password for ${student.display_name}?`)) {
                    supabase.auth.resetPasswordForEmail(student.email, { redirectTo: window.location.origin })
                        .then(({error}) => {
                            if(error) alert("Error sending reset email: " + error.message);
                            else alert("Password reset email sent.");
                        });
                }
                break;
            case 'view_documents':
            case 'upload_files':
                setInitialProfileTab('documents');
                setSelectedStudent(student);
                break;
            case 'view_fees':
                setInitialProfileTab('fees');
                setSelectedStudent(student);
                break;
            case 'transfer':
                setBulkIds([student.id]);
                setBulkAction('transfer');
                break;
            case 'deactivate':
                setDeactivateConfirm(student);
                break;
        }
    };

    const handleBulkTrigger = (type: BulkStudentActionType) => {
        // For import, we don't need selected IDs
        if (type === 'import') {
            setBulkAction('import');
            setBulkIds([]);
            return;
        }
        if (selectedIds.size === 0 && type !== 'export') return;
        setBulkIds(Array.from(selectedIds));
        setBulkAction(type);
    };
    
    const confirmDeactivate = async () => {
        if (!deactivateConfirm) return;
        const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', deactivateConfirm.id);
        if (error) alert("Failed to deactivate: " + error.message);
        else {
            fetchData();
            setDeactivateConfirm(null);
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setQuickFilter('All');
        setGradeFilter('');
        setFeeStatusFilter('');
        setGenderFilter('');
        setYearFilter('');
    };

    // Unique years for dropdown
    const admissionYears = useMemo(() => 
        Array.from(new Set(allStudents.map(s => new Date(s.created_at || '').getFullYear()))).sort().reverse(), 
    [allStudents]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Students</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Manage student lifecycle, enrollments, and profiles.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => handleBulkTrigger('import')} className="px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl border border-border transition-all flex items-center gap-2">
                        <UploadIcon className="w-5 h-5"/> Import CSV
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                        <PlusIcon className="w-5 h-5"/> Add New Student
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Students" value={stats.total} icon={<StudentsIcon className="w-6 h-6"/>} color="bg-blue-500" active={quickFilter === 'All'} onClick={() => setQuickFilter('All')} />
                <KPICard title="Active Enrolled" value={stats.active} icon={<CheckCircleIcon className="w-6 h-6"/>} color="bg-emerald-500" active={quickFilter === 'Active'} onClick={() => setQuickFilter('Active')} />
                <KPICard title="Pending Reg." value={stats.pending} icon={<ClockIcon className="w-6 h-6"/>} color="bg-purple-500" active={quickFilter === 'Pending'} onClick={() => setQuickFilter('Pending')} />
                <KPICard title="New Admissions" value={stats.newToday} icon={<GraduationCapIcon className="w-6 h-6"/>} color="bg-amber-500" active={quickFilter === 'New'} onClick={() => setQuickFilter('New')} />
            </div>

            {/* Main Content */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-visible flex flex-col min-h-[600px]">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search by name, ID, phone, parent..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
                         <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${showAdvancedFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-input hover:bg-muted text-foreground'}`}>
                            <FilterIcon className="w-4 h-4" /> Filter
                        </button>
                        
                        {/* Bulk Actions Trigger */}
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                                <span className="text-sm font-bold text-primary whitespace-nowrap">{selectedIds.size} selected</span>
                                <div className="h-6 w-px bg-border mx-2"></div>
                                <button onClick={() => handleBulkTrigger('message')} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors" title="Message Parents"><CommunicationIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleBulkTrigger('reminder')} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors" title="Send Doc Reminder"><BellIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleBulkTrigger('assign_class')} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors" title="Assign Class"><UsersIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleBulkTrigger('status')} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors" title="Update Status"><CheckCircleIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleBulkTrigger('delete')} className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Archive"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <div className="p-6 bg-muted/30 border-b border-border grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-input bg-background text-sm">
                            <option value="">All Grades</option>
                            {Array.from({length: 12}, (_, i) => i + 1).map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
                        </select>
                        <select value={feeStatusFilter} onChange={e => setFeeStatusFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-input bg-background text-sm">
                            <option value="">All Fee Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                        <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-input bg-background text-sm">
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-input bg-background text-sm">
                            <option value="">All Admission Years</option>
                            {admissionYears.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                        </select>
                    </div>
                )}

                {/* Table */}
                <div className="flex-grow overflow-visible">
                     {loading ? (
                        <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>
                    ) : sortedStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-50"></div>
                                <div className="relative w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center border-2 border-dashed border-border">
                                    <StudentsIcon className="w-10 h-10 text-muted-foreground/60" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No students found</h3>
                            <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
                                No students found. Try adjusting filters or add a new student.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button 
                                    onClick={handleResetFilters}
                                    className="px-6 py-2.5 rounded-xl border border-border hover:bg-muted font-semibold text-sm transition-colors flex items-center gap-2 text-foreground"
                                >
                                    <FilterIcon className="w-4 h-4" /> Reset Filters
                                </button>
                                <button 
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" /> Add New Student
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-muted/30 border-b border-border text-xs font-bold uppercase text-muted-foreground tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="p-5 w-14 text-center"><input type="checkbox" className="rounded border-input text-primary focus:ring-primary cursor-pointer w-4 h-4" checked={selectedIds.size > 0 && selectedIds.size === paginatedData.length} onChange={handleSelectAll} /></th>
                                        <th className="p-5 cursor-pointer hover:text-foreground group" onClick={() => handleSort('name')}>
                                            Student Identity {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="p-5">Parent / Guardian</th>
                                        <th className="p-5 cursor-pointer hover:text-foreground" onClick={() => handleSort('grade')}>
                                            Academic {sortConfig.key === 'grade' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="p-5 text-center cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
                                            Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="p-5 cursor-pointer hover:text-foreground" onClick={() => handleSort('date')}>
                                            Joined {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="p-5 text-center">Fees</th>
                                        <th className="p-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {paginatedData.map(student => (
                                        <tr 
                                            key={student.id} 
                                            className={`group hover:bg-muted/30 transition-colors cursor-pointer ${selectedIds.has(student.id) ? 'bg-primary/5' : ''}`} 
                                            onClick={() => { setInitialProfileTab('overview'); setSelectedStudent(student); }}
                                        >
                                            <td className="p-5 text-center" onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" className="rounded border-input text-primary focus:ring-primary cursor-pointer w-4 h-4" checked={selectedIds.has(student.id)} onChange={() => toggleSelection(student.id)} />
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-background overflow-hidden">
                                                        {student.profile_photo_url ? <img src={student.profile_photo_url} className="w-full h-full object-cover"/> : (student.display_name || '?').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{student.display_name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs text-muted-foreground">{student.email}</span>
                                                            {student.student_id_number && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">{student.student_id_number}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{student.parent_guardian_details || '—'}</span>
                                                    {student.phone && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                            <PhoneIcon className="w-3 h-3"/> 
                                                            <span>{student.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-foreground border border-border w-fit">
                                                        Grade {student.grade}
                                                    </span>
                                                    {student.assigned_class_name ? (
                                                        <span className="text-[10px] text-muted-foreground mt-1 ml-1">{student.assigned_class_name}</span>
                                                    ) : (
                                                        <span className="text-[10px] text-amber-600 mt-1 ml-1 font-medium">No Class Assigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <LifecycleBadge student={student} />
                                            </td>
                                            <td className="p-5">
                                                 <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground">{new Date(student.created_at || '').toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-muted-foreground/60">Admission</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <FeeStatusBadge status={getFeeStatus(student.id)} />
                                            </td>
                                            <td className="p-5 text-right relative" onClick={e => e.stopPropagation()}>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(student.id === openMenuId ? null : student.id); }} 
                                                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                                                >
                                                    <MoreVerticalIcon className="w-5 h-5"/>
                                                </button>
                                                
                                                <StudentActionMenu 
                                                    student={student} 
                                                    isOpen={openMenuId === student.id} 
                                                    onAction={handleMenuAction}
                                                    setOpenId={setOpenMenuId}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {sortedStudents.length > 0 && (
                    <div className="p-4 border-t border-border bg-muted/10 flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground">Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="p-2 rounded-lg hover:bg-background border border-transparent hover:border-border disabled:opacity-50"><ChevronLeftIcon className="w-4 h-4"/></button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="p-2 rounded-lg hover:bg-background border border-transparent hover:border-border disabled:opacity-50"><ChevronRightIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isAddModalOpen && <AddStudentModal onClose={() => setIsAddModalOpen(false)} onSave={fetchData} />}
            
            {selectedStudent && (
                <StudentProfileModal 
                    student={selectedStudent} 
                    onClose={() => setSelectedStudent(null)} 
                    onUpdate={fetchData} 
                    initialTab={initialProfileTab}
                />
            )}

            {bulkAction && (
                <BulkStudentActionsModal 
                    action={bulkAction} 
                    selectedIds={bulkIds} // If import, this is empty
                    onClose={() => { setBulkAction(null); setBulkIds([]); }} 
                    onSuccess={() => { fetchData(); setSelectedIds(new Set()); }} 
                />
            )}

            {deactivateConfirm && (
                <ConfirmationModal 
                    isOpen={!!deactivateConfirm} 
                    onClose={() => setDeactivateConfirm(null)} 
                    onConfirm={confirmDeactivate} 
                    title={`Deactivate ${deactivateConfirm.display_name}`} 
                    message="Are you sure you want to deactivate this student account? They will no longer be able to access the portal."
                    confirmText="Yes, Deactivate" 
                />
            )}
        </div>
    );
};

export default StudentManagementTab;
