
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';
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
import { MailIcon } from './icons/MailIcon';
import { UploadIcon } from './icons/UploadIcon';
import StudentProfileModal from './students/StudentProfileModal';
import BulkStudentActionsModal, { BulkStudentActionType } from './students/BulkStudentActionsModal';

interface StudentManagementTabProps {
    branchId?: number | null;
}

const KPICard: React.FC<{ title: string, value: number, icon: React.ReactNode, color: string, onClick?: () => void, active?: boolean }> = ({ title, value, icon, color, onClick, active }) => (
    <div 
        onClick={onClick}
        className={`relative overflow-hidden p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer group ${active ? 'bg-card border-primary ring-4 ring-primary/5 shadow-xl' : 'bg-card border-border/60 hover:border-primary/40 shadow-sm'}`}
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-4 rounded-2xl text-white shadow-lg transform group-hover:scale-110 transition-transform duration-500 ${color}`}>
                {icon}
            </div>
            {active && <CheckCircleIcon className="w-5 h-5 text-primary animate-in zoom-in" />}
        </div>
        <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
            <h3 className="text-3xl font-black text-foreground mt-1 tracking-tight">{value.toLocaleString()}</h3>
        </div>
    </div>
);

export const AddStudentModal: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ display_name: '', email: '', grade: '', parent_guardian_details: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.rpc('admin_quick_add_student', {
                p_display_name: formData.display_name,
                p_email: formData.email,
                p_grade: formData.grade,
                p_parent_details: formData.parent_guardian_details
            });
            if (error) throw error;
            onSave();
            onClose();
        } catch (err: any) {
            alert(err.message || "Failed to add student");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Register New Student</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Student Name" className="w-full p-3 rounded-xl border border-input bg-background" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} />
                    <input required type="email" placeholder="Login Email" className="w-full p-3 rounded-xl border border-input bg-background" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input required placeholder="Grade Level" className="w-full p-3 rounded-xl border border-input bg-background" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} />
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-muted-foreground">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg">
                            {loading ? <Spinner size="sm"/> : 'Confirm Entry'}
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
    const [searchTerm, setSearchTerm] = useState('');
    const [quickFilter, setQuickFilter] = useState<'All' | 'Active' | 'Pending' | 'New'>('All');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState<StudentForAdmin | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<BulkStudentActionType | null>(null);

    const itemsPerPage = 12;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_students_for_admin', { p_branch_id: branchId });
            if (error) throw error;
            setAllStudents(data || []);
        } catch (e) {
            console.error("Student Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredStudents = useMemo(() => {
        return allStudents.filter(s => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || s.display_name.toLowerCase().includes(searchLower) || (s.email || '').toLowerCase().includes(searchLower);
            let matchesQuick = true;
            if (quickFilter === 'Active') matchesQuick = s.is_active;
            if (quickFilter === 'Pending') matchesQuick = !s.profile_completed;
            return matchesSearch && matchesQuick;
        }).sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            if (sortConfig.key === 'name') return a.display_name.localeCompare(b.display_name) * dir;
            return 0;
        });
    }, [allStudents, searchTerm, quickFilter, sortConfig]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedData = useMemo(() => filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredStudents, currentPage]);

    return (
        <div className="space-y-8 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-black text-foreground tracking-tight">Student Directory</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Total Roster: {allStudents.length} Students</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setBulkAction('import')} className="px-5 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-2xl border border-border flex items-center gap-2"><UploadIcon className="w-4 h-4"/> Import</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Add Student</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Students" value={allStudents.length} icon={<StudentsIcon className="w-6 h-6"/>} color="bg-blue-600" active={quickFilter === 'All'} onClick={() => setQuickFilter('All')} />
                <KPICard title="Active" value={allStudents.filter(s => s.is_active).length} icon={<CheckCircleIcon className="w-6 h-6"/>} color="bg-emerald-600" active={quickFilter === 'Active'} onClick={() => setQuickFilter('Active')} />
                <KPICard title="Pending Setup" value={allStudents.filter(s => !s.profile_completed).length} icon={<ClockIcon className="w-6 h-6"/>} color="bg-purple-600" active={quickFilter === 'Pending'} onClick={() => setQuickFilter('Pending')} />
                <KPICard title="Newly Registered" value={allStudents.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length} icon={<GraduationCapIcon className="w-6 h-6"/>} color="bg-amber-600" />
            </div>

            <div className="bg-card border border-border rounded-[2rem] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-border flex flex-col md:flex-row gap-6 justify-between items-center">
                    <div className="relative w-full md:max-w-md">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input type="text" placeholder="Search roster..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl border border-input bg-background text-sm" />
                    </div>
                </div>

                <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/30 border-b border-border text-[10px] font-black uppercase text-muted-foreground tracking-widest sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="p-6">Identity</th>
                                <th className="p-6">Parent Link</th>
                                <th className="p-6">Grade</th>
                                <th className="p-6 text-center">Status</th>
                                <th className="p-6 text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? <tr><td colSpan={5} className="p-20 text-center"><Spinner size="lg" /></td></tr> : paginatedData.map(student => (
                                <tr key={student.id} className="hover:bg-muted/40 cursor-pointer group" onClick={() => setSelectedStudent(student)}>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <img src={student.profile_photo_url || `https://api.dicebear.com/8.x/initials/svg?seed=${student.display_name}`} className="w-10 h-10 rounded-xl object-cover" alt=""/>
                                            <div><p className="font-bold text-foreground">{student.display_name}</p><p className="text-[10px] text-muted-foreground font-mono">{student.student_id_number || 'ID_PENDING'}</p></div>
                                        </div>
                                    </td>
                                    <td className="p-6 font-medium text-muted-foreground">{student.parent_guardian_details || '—'}</td>
                                    <td className="p-6 font-bold">{student.grade}</td>
                                    <td className="p-6 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${student.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            {student.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right pr-8"><button className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><MoreVerticalIcon className="w-5 h-5"/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-border bg-muted/5 flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 rounded-xl border border-border hover:bg-background disabled:opacity-30"><ChevronLeftIcon className="w-5 h-5"/></button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-border hover:bg-background disabled:opacity-30"><ChevronRightIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>

            {selectedStudent && <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onUpdate={fetchData} />}
            {isAddModalOpen && <AddStudentModal onClose={() => setIsAddModalOpen(false)} onSave={fetchData} />}
            {bulkAction && <BulkStudentActionsModal action={bulkAction} selectedIds={[]} onClose={() => setBulkAction(null)} onSuccess={fetchData} />}
        </div>
    );
};

export default StudentManagementTab;
