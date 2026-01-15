
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, formatError } from '../services/supabase';
import { StudentForAdmin } from '../types';
import Spinner from './common/Spinner';
import { PlusIcon } from './icons/PlusIcon';
import { StudentsIcon } from './icons/StudentsIcon';
import { SearchIcon } from './icons/SearchIcon';
import { FilterIcon } from './icons/FilterIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';
import { UploadIcon } from './icons/UploadIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import StudentProfileModal, { AssignClassModal } from './students/StudentProfileModal';
import BulkStudentActionsModal, { BulkStudentActionType } from './students/BulkStudentActionsModal';
import PremiumAvatar from './common/PremiumAvatar';
import { ListSkeleton, StatsSkeleton } from './common/Skeleton';

interface StudentManagementTabProps {
    branchId?: number | null;
}

const KPICard: React.FC<{ 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    color: string; 
    onClick?: () => void; 
    active?: boolean;
    description?: string;
    loading?: boolean;
}> = ({ title, value, icon, color, onClick, active, description, loading }) => {
    const colorBase = color.split('-')[1];

    return (
        <div 
            onClick={onClick}
            className={`
                relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer group
                ${active 
                    ? 'bg-card border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.02] z-10' 
                    : 'bg-card/40 border-white/5 hover:border-primary/40 hover:bg-card/60 shadow-sm'
                }
            `}
        >
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-${colorBase}-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-4 rounded-2xl text-white shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${color} ring-1 ring-white/10`}>
                    {icon}
                </div>
                {active && <div className="p-1.5 bg-primary/10 rounded-full animate-in zoom-in"><CheckCircleIcon className="w-4 h-4 text-primary" /></div>}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">{title}</p>
                <div className="flex items-center gap-2 min-h-[40px]">
                    {loading ? (
                        <div className="h-8 w-24 bg-white/5 rounded animate-pulse shimmer" />
                    ) : (
                        <h3 className="text-4xl font-serif font-black text-foreground tracking-tighter animate-in fade-in">{value.toLocaleString()}</h3>
                    )}
                </div>
                {description && <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium italic">{description}</p>}
            </div>
        </div>
    );
};

export const AddStudentModal: React.FC<{ onClose: () => void; onSave: () => void; branchId?: number | null }> = ({ onClose, onSave, branchId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        grade: '',
        parent_guardian_details: ''
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // 1. Create the student record via RPC
            const { data, error: rpcError } = await supabase.rpc('admin_quick_add_student', {
                p_display_name: formData.display_name,
                p_email: formData.email,
                p_grade: formData.grade,
                p_parent_details: formData.parent_guardian_details
            });

            if (rpcError) throw rpcError;
            if (data && data.success === false) {
                throw new Error(data.message || "Registration failed");
            }

            // 2. Contextual Link: If we are in a branch view, ensure the new student is linked to this branch
            if (branchId && data?.user_id) {
                await supabase.from('student_profiles')
                    .update({ branch_id: branchId })
                    .eq('user_id', data.user_id);
            }

            onSave();
            onClose();
        } catch (err: any) {
            console.error("Registration Error:", err);
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#0f1115] w-full max-w-md rounded-[2rem] shadow-2xl border border-white/10 p-8 animate-in zoom-in-95 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none"><UserPlusIcon className="w-32 h-32 text-white" /></div>
                
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight font-serif">Register Node</h3>
                        <p className="text-sm font-bold text-white/30 uppercase tracking-widest mt-1">Quick Enrollment</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-5 h-5 text-white/50 hover:text-white"/></button>
                </div>

                <form onSubmit={handleSave} className="space-y-5 relative z-10">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500 animate-in slide-in-from-top-2">
                            <AlertTriangleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold leading-relaxed">{error}</p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Full Name</label>
                        <input required value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-primary/50 focus:bg-black/40 outline-none transition-all placeholder:text-white/10" placeholder="e.g. Alex Doe" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Email Access</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-primary/50 focus:bg-black/40 outline-none transition-all placeholder:text-white/10" placeholder="student@school.id" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Grade Level</label>
                            <input required value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-primary/50 focus:bg-black/40 outline-none transition-all placeholder:text-white/10" placeholder="e.g. 10" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-1">Parent Info</label>
                            <input value={formData.parent_guardian_details} onChange={e => setFormData({...formData, parent_guardian_details: e.target.value})} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-primary/50 focus:bg-black/40 outline-none transition-all placeholder:text-white/10" placeholder="Optional" />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest">Cancel</button>
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-primary text-white font-black text-xs rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2 transition-all transform active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <Spinner size="sm" className="text-white" /> : "Confirm Registration"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StudentManagementTab: React.FC<StudentManagementTabProps> = ({ branchId }) => {
    const [allStudents, setAllStudents] = useState<StudentForAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quickFilter, setQuickFilter] = useState<'All' | 'Active' | 'Pending' | 'New'>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    const [gradeFilter, setGradeFilter] = useState<string>('All');
    
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState<StudentForAdmin | null>(null);
    const [assigningStudent, setAssigningStudent] = useState<StudentForAdmin | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<BulkStudentActionType | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    const itemsPerPage = 12;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Direct query to ensure complete visibility of all student records
            let query = supabase
                .from('student_profiles')
                .select(`
                    *,
                    profiles!inner (
                        email, display_name, phone, role, is_active, profile_completed, created_at
                    ),
                    school_classes (
                        name
                    )
                `)
                .eq('profiles.role', 'Student');

            // Robust check for branchId (handle 0 as valid ID)
            if (branchId !== null && branchId !== undefined) {
                query = query.eq('branch_id', branchId);
            }

            const { data, error: dbError } = await query;

            if (dbError) throw dbError;

            // Map nested Supabase response to flat StudentForAdmin interface
            const mappedStudents: StudentForAdmin[] = (data || []).map((s: any) => ({
                id: s.user_id,
                email: s.profiles?.email || '',
                display_name: s.profiles?.display_name || 'Unknown Student',
                phone: s.profiles?.phone,
                role: s.profiles?.role,
                is_active: s.profiles?.is_active,
                profile_completed: s.profiles?.profile_completed,
                created_at: s.created_at || s.profiles?.created_at,
                // Fallback to local profile photo or undefined if not available on profile relation
                profile_photo_url: s.profile_photo_url, 
                gender: s.gender, // fetched from student_profiles (*)
                date_of_birth: s.date_of_birth, // fetched from student_profiles (*)
                address: s.address, // fetched from student_profiles (*)
                student_id_number: s.student_id_number,
                grade: s.grade,
                roll_number: s.roll_number,
                parent_guardian_details: s.parent_guardian_details,
                assigned_class_id: s.assigned_class_id,
                assigned_class_name: s.school_classes?.name || null
            }));

            setAllStudents(mappedStudents);
        } catch (e: any) {
            // Enhanced Error Logging
            console.error("Fetch error details:", JSON.stringify(e, null, 2));
            setError(formatError(e));
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    // Handle deep linking/highlighting
    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash.startsWith('#/Student Management')) {
                setRefreshKey(Date.now()); // Trigger re-fetch
                const params = new URLSearchParams(window.location.hash.split('?')[1]);
                const idToHighlight = params.get('highlight');
                if (idToHighlight) {
                    setHighlightedId(idToHighlight);
                    setTimeout(() => setHighlightedId(null), 3000); // Clear highlight after 3s
                }
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Run once on mount
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData, refreshKey]);

    const uniqueGrades = useMemo(() => {
        const grades = new Set(allStudents.map(s => s.grade).filter(Boolean));
        return Array.from(grades).sort((a, b) => {
            // Ensure 'a' and 'b' are strings
            const strA = String(a);
            const strB = String(b);
            const numA = parseInt(strA.replace(/\D/g, '')) || 0;
            const numB = parseInt(strB.replace(/\D/g, '')) || 0;
            return numA - numB;
        });
    }, [allStudents]);

    const filteredStudents = useMemo(() => {
        return allStudents.filter(s => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
                s.display_name.toLowerCase().includes(searchLower) || 
                (s.email || '').toLowerCase().includes(searchLower) || 
                (s.student_id_number || '').toLowerCase().includes(searchLower) ||
                (s.grade || '').toLowerCase().includes(searchLower);

            let matchesQuick = true;
            if (quickFilter === 'Active') matchesQuick = s.is_active;
            if (quickFilter === 'Pending') matchesQuick = !s.assigned_class_id;
            if (quickFilter === 'New') {
                const today = new Date().toDateString();
                const created = s.created_at ? new Date(s.created_at) : new Date(); // Fallback date
                matchesQuick = created.toDateString() === today;
            }

            // Explicit Filters
            const matchesStatus = statusFilter === 'All' 
                ? true 
                : statusFilter === 'Active' ? s.is_active : !s.is_active;
            
            const matchesGrade = gradeFilter === 'All' || s.grade === gradeFilter;

            return matchesSearch && matchesQuick && matchesStatus && matchesGrade;
        }).sort((a: any, b: any) => {
            // Priority sort for pending placement
            if (!a.assigned_class_id && b.assigned_class_id) return -1;
            if (a.assigned_class_id && !b.assigned_class_id) return 1;

            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            
            // Handle date sorting specially with safeguard for missing dates
            if (sortConfig.key === 'created_at') {
                 const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                 const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                 return (timeA - timeB) * dir;
            }
            
            if (sortConfig.key === 'name') return a.display_name.localeCompare(b.display_name) * dir;
            if (sortConfig.key === 'grade') {
                 // Numeric sort for grades if possible
                 const gradeA = parseInt(a.grade) || 0;
                 const gradeB = parseInt(b.grade) || 0;
                 if (gradeA && gradeB) return (gradeA - gradeB) * dir;
                 return a.grade.localeCompare(b.grade) * dir;
            }
            return 0;
        });
    }, [allStudents, searchTerm, quickFilter, statusFilter, gradeFilter, sortConfig]);

    const stats = useMemo(() => ({
        total: allStudents.length,
        active: allStudents.filter(s => s.is_active).length,
        pending: allStudents.filter(s => !s.assigned_class_id).length,
        new: allStudents.filter(s => s.created_at && new Date(s.created_at).toDateString() === new Date().toDateString()).length
    }), [allStudents]);

    // FIX: Added missing handleSort function to manage table sorting state.
    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedData = useMemo(() => filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredStudents, currentPage]);

    return (
        <div className="space-y-10 pb-24 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
                <div className="max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground tracking-tighter uppercase leading-none">
                        Student <span className="text-white/20 italic">Directory.</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <button onClick={() => setBulkAction('import')} className="flex-grow xl:flex-none px-10 py-5 bg-white/5 hover:bg-white/10 text-foreground font-black text-[11px] uppercase tracking-[0.25em] rounded-2xl border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-3"><UploadIcon className="w-5 h-5 text-muted-foreground"/> Bulk Import</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-grow xl:flex-none px-12 py-5 bg-primary text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 transform active:scale-95"><PlusIcon className="w-5 h-5"/> Register Node</button>
                </div>
            </div>

            {loading && allStudents.length === 0 ? (
                <div className="space-y-10">
                    <StatsSkeleton />
                    <ListSkeleton />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KPICard title="Total Roster" value={stats.total} icon={<StudentsIcon className="w-8 h-8"/>} color="bg-indigo-600" active={quickFilter === 'All'} onClick={() => { setQuickFilter('All'); setStatusFilter('All'); setGradeFilter('All'); }} description="Global identity count" loading={loading} />
                        <KPICard title="Active Stream" value={stats.active} icon={<CheckCircleIcon className="w-8 h-8"/>} color="bg-emerald-600" active={quickFilter === 'Active'} onClick={() => setQuickFilter('Active')} description="Live portal sessions" loading={loading} />
                        <KPICard title="Placement Pending" value={stats.pending} icon={<ClockIcon className="w-8 h-8"/>} color="bg-amber-600" active={quickFilter === 'Pending'} onClick={() => setQuickFilter('Pending')} description="Unassigned units" loading={loading} />
                        <KPICard title="Newly Registered" value={stats.new} icon={<GraduationCapIcon className="w-8 h-8"/>} color="bg-purple-600" active={quickFilter === 'New'} onClick={() => setQuickFilter('New')} description="Enrolled today" loading={loading} />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-4">
                            <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <div className="bg-card border border-white/10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] overflow-hidden flex flex-col min-h-[650px] ring-1 ring-white/5 relative">
                        <div className="p-8 border-b border-white/5 flex flex-col xl:flex-row gap-6 justify-between items-center relative z-10 bg-card/60 backdrop-blur-xl">
                            <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto flex-grow">
                                <div className="relative flex-grow group">
                                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/10 group-focus-within:text-primary transition-colors duration-300" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by Name, ID, or Grade..." 
                                        value={searchTerm} 
                                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl border border-white/5 bg-black/20 text-sm font-medium text-white focus:bg-black/40 outline-none transition-all placeholder:text-white/10 focus:border-primary/40" 
                                    />
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                                    <select 
                                        value={statusFilter} 
                                        onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }} 
                                        className="h-14 px-6 bg-black/20 border border-white/5 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-primary/40 cursor-pointer hover:bg-black/30 transition-all appearance-none min-w-[140px]"
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Active">Active Only</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                    
                                    <select 
                                        value={gradeFilter} 
                                        onChange={e => { setGradeFilter(e.target.value); setCurrentPage(1); }} 
                                        className="h-14 px-6 bg-black/20 border border-white/5 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-primary/40 cursor-pointer hover:bg-black/30 transition-all appearance-none min-w-[140px]"
                                    >
                                        <option value="All">All Grades</option>
                                        {uniqueGrades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => fetchData()} className="p-4 rounded-2xl bg-white/5 text-white/20 hover:text-primary transition-all border border-white/5 shadow-inner group flex-shrink-0"><RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
                        </div>

                        <div className="overflow-x-auto flex-grow relative z-10 custom-scrollbar">
                            {loading && allStudents.length > 0 ? (
                                <div className="p-20 flex justify-center"><Spinner size="lg" className="text-primary"/></div>
                            ) : paginatedData.length === 0 ? (
                                <div className="p-32 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-white/10">
                                            <StudentsIcon className="w-10 h-10 text-white"/>
                                        </div>
                                        <p className="text-lg font-bold text-white uppercase tracking-widest">No Students Found</p>
                                        <p className="text-xs text-white/50 mt-2 max-w-xs leading-relaxed font-serif italic">
                                            {searchTerm || quickFilter !== 'All' || statusFilter !== 'All' || gradeFilter !== 'All'
                                                ? "Your current filters match no identities. Reset parameters to view full roster." 
                                                : "All verified students have been placed in academic units."}
                                        </p>
                                        {(searchTerm || quickFilter !== 'All' || statusFilter !== 'All' || gradeFilter !== 'All') && (
                                            <button onClick={() => { setSearchTerm(''); setQuickFilter('All'); setStatusFilter('All'); setGradeFilter('All'); }} className="mt-8 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest text-primary border border-white/5 transition-all">
                                                Reset Filters
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[#0f1115]/80 border-b border-white/5 text-[10px] font-black uppercase text-white/20 tracking-[0.3em] sticky top-0 z-20 backdrop-blur-xl text-xs">
                                        <tr>
                                            <th className="p-8 pl-10 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>Subject Identity</th>
                                            <th className="p-8">Arbiter / Parent</th>
                                            <th className="p-8 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('grade')}>Placement Status</th>
                                            <th className="p-8 text-center">Lifecycle Status</th>
                                            <th className="p-8 text-right pr-10">Protocols</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 bg-transparent">
                                        {paginatedData.map(student => (
                                            <tr key={student.id} className={`hover:bg-white/[0.02] cursor-pointer group transition-all duration-300 ${student.id === highlightedId ? 'bg-primary/10 animate-pulse' : ''}`} onClick={() => setSelectedStudent(student)}>
                                                <td className="p-8 pl-10">
                                                    <div className="flex items-center gap-6">
                                                        <PremiumAvatar src={student.profile_photo_url} name={student.display_name} size="xs" className="w-14 h-14 rounded-2xl border border-white/10 shadow-2xl relative z-10" />
                                                        <div>
                                                            <p className="font-serif font-black text-white text-lg tracking-tight uppercase group-hover:text-primary transition-colors">{student.display_name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">
                                                                    {student.student_id_number || 'ID_PENDING'}
                                                                </p>
                                                                {!student.assigned_class_id && (
                                                                    <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">Awaiting Placement</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8"><div className="space-y-1"><p className="text-sm font-bold text-white/80">{student.parent_guardian_details || 'Unlinked'}</p></div></td>
                                                <td className="p-8">
                                                    {student.assigned_class_id ? (
                                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-indigo-400 text-xs shadow-inner">{student.assigned_class_name}</div></div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 shadow-sm animate-pulse">PLACEMENT PENDING</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-8 text-center"><span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-inner ${student.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{student.is_active ? 'Active' : 'Offline'}</span></td>
                                                <td className="p-8 text-right pr-10">
                                                    {!student.assigned_class_id ? (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setAssigningStudent(student); }}
                                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 flex items-center gap-2 ml-auto"
                                                        >
                                                            <SparklesIcon className="w-3 h-3" /> Assign Class
                                                        </button>
                                                    ) : (
                                                        <button className="p-4 rounded-2xl bg-white/5 text-white/10 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/5 shadow-xl">
                                                            <MoreVerticalIcon className="w-5 h-5"/>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="p-8 border-t border-white/5 bg-[#0a0a0c]/80 flex justify-between items-center relative z-10">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Sequence <span className="text-white/60">{currentPage}</span> of {totalPages || 1}</span>
                            <div className="flex gap-3">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-4 rounded-2xl border border-white/5 bg-white/5 text-white/40 hover:text-white disabled:opacity-20 transition-all shadow-lg"><ChevronLeftIcon className="w-6 h-6"/></button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-4 rounded-2xl border border-white/5 bg-white/5 text-white/40 hover:text-white disabled:opacity-20 transition-all shadow-lg"><ChevronRightIcon className="w-6 h-6"/></button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {selectedStudent && <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onUpdate={fetchData} />}
            {assigningStudent && <AssignClassModal student={assigningStudent} onClose={() => setAssigningStudent(null)} onSuccess={() => { setAssigningStudent(null); fetchData(); }} />}
            {isAddModalOpen && <AddStudentModal onClose={() => setIsAddModalOpen(false)} onSave={fetchData} branchId={branchId} />}
            {bulkAction && <BulkStudentActionsModal action={bulkAction} selectedIds={[]} onClose={() => setBulkAction(null)} onSuccess={fetchData} />}
        </div>
    );
};

export default StudentManagementTab;
