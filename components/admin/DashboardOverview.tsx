
import React, { useEffect, useState } from 'react';
import { SchoolAdminProfileData, SchoolBranch, AdmissionApplication, UserProfile, BuiltInRoles } from '../../types';
import { supabase } from '../../services/supabase';
import StatCard from './StatCard';
import AreaChart from './charts/AreaChart';
import BarChart from './charts/BarChart';
import { StudentsIcon } from '../icons/StudentsIcon';
import { TeacherIcon } from '../icons/TeacherIcon';
import { CoursesIcon } from '../icons/CoursesIcon';
import { FinanceIcon } from '../icons/FinanceIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { LocationIcon } from '../icons/LocationIcon';

interface DashboardOverviewProps {
    schoolProfile: SchoolAdminProfileData | null;
    currentBranch: SchoolBranch | null;
    profile: UserProfile;
    onNavigateToBranches: () => void;
}

const statusColors: { [key: string]: string } = {
  'Pending Review': 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30',
  'Documents Requested': 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-500/30',
  'Approved': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30',
  'Rejected': 'bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30',
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ schoolProfile, currentBranch, profile, onNavigateToBranches }) => {
    const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0 });
    const [recentAdmissions, setRecentAdmissions] = useState<AdmissionApplication[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            const branchId = currentBranch ? currentBranch.id : null;

            const [studentRes, teacherRes, courseRes, admissionRes] = await Promise.all([
                // Use Secured RPC for students (filtered by admin ownership)
                supabase.rpc('get_all_students_for_admin'), 
                supabase.from('teacher_profiles').select('user_id', { count: 'exact', head: true }),
                supabase.from('courses').select('id', { count: 'exact', head: true }),
                // Use Secured RPC for admissions (filtered by admin ownership, preventing parent-only view)
                supabase.rpc('get_admissions', { p_branch_id: branchId })
            ]);
            
            setStats({
                students: studentRes.data?.length || 0,
                teachers: teacherRes.count || 0,
                courses: courseRes.count || 0
            });

            if (admissionRes.data) {
                // Client-side sort to get most recent
                // Filter: Only show "Pending Review" or "Approved" or "Documents Requested"
                // This ensures we don't show draft/unsubmitted if any exist
                const activeWorkflows = ['Pending Review', 'Approved', 'Documents Requested'];
                const sorted = (admissionRes.data as AdmissionApplication[])
                    .filter(a => activeWorkflows.includes(a.status))
                    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                    .slice(0, 5);
                setRecentAdmissions(sorted);
            }
        };
        fetchStats();
    }, [currentBranch]); // Re-fetch when branch changes

    const displayName = currentBranch 
        ? `${currentBranch.name}${currentBranch.is_main_branch ? ' - Head Office' : (currentBranch.city ? ` - ${currentBranch.city}` : '')}`
        : schoolProfile?.school_name || 'School Dashboard';

    const canManageBranches = profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION;
    const fullAddress = currentBranch ? [currentBranch.address, currentBranch.city, currentBranch.state, currentBranch.country].filter(Boolean).join(', ') : '';

    return (
        <div className="space-y-8 pb-12">
            {/* Premium Greeting Section */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 md:p-10 shadow-sm">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full filter blur-3xl opacity-70 pointer-events-none"></div>
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl opacity-70 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
                            Welcome, {(profile.display_name || 'Admin').split(' ')[0]}!
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground max-w-2xl leading-relaxed">
                            Here's what's happening at <span className="font-semibold text-foreground">{displayName}</span> today.
                        </p>
                        {fullAddress && (
                            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground/80 bg-muted/50 w-fit px-3 py-1.5 rounded-full border border-border/50">
                                <LocationIcon className="w-3.5 h-3.5" />
                                <span>{fullAddress}</span>
                            </div>
                        )}
                    </div>

                    {canManageBranches && (
                        <button 
                            onClick={onNavigateToBranches}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 font-bold text-sm transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <UsersIcon className="w-4 h-4" />
                            Manage Branches
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Students"
                    value={stats.students.toString()}
                    icon={<StudentsIcon className="h-6 w-6" />}
                    trend="+5.2%"
                    colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatCard 
                    title="Faculty Strength"
                    value={stats.teachers.toString()}
                    icon={<TeacherIcon className="h-6 w-6" />}
                    trend="+2 new"
                    colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
                <StatCard 
                    title="Active Courses"
                    value={stats.courses.toString()}
                    icon={<CoursesIcon className="h-6 w-6" />}
                    trend="Stable"
                    colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                />
                <StatCard 
                    title="Revenue (YTD)"
                    value="$0" 
                    icon={<FinanceIcon className="h-6 w-6" />}
                    trend="--%"
                    colorClass="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-card border border-border rounded-2xl shadow-sm flex flex-col h-[400px]">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="font-bold text-lg text-foreground">Enrollment Trends</h3>
                        <button className="text-xs font-semibold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">View Report</button>
                    </div>
                    <div className="p-6 flex-grow">
                        <AreaChart />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm flex flex-col h-[400px]">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="font-bold text-lg text-foreground">Attendance Overview</h3>
                        <select className="text-xs font-semibold bg-muted/50 border-none rounded-lg px-2 py-1 cursor-pointer focus:ring-0 text-muted-foreground">
                            <option>This Week</option>
                            <option>Last Week</option>
                        </select>
                    </div>
                    <div className="p-6 flex-grow">
                        <BarChart />
                    </div>
                </div>
            </div>

            {/* Recent Admissions */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/5">
                    <h3 className="font-bold text-lg text-foreground">Recent Admissions</h3>
                    <button className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">View All</button>
                </div>
                <div className="overflow-x-auto">
                    {recentAdmissions.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground text-sm">No new verified applications found.</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Applicant</th>
                                    <th className="px-6 py-4">Grade</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {recentAdmissions.map((admission) => (
                                    <tr key={admission.id} className="hover:bg-muted/20 transition-colors group">
                                        <td className="px-6 py-4 font-semibold text-foreground group-hover:text-primary transition-colors">{admission.applicant_name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{admission.grade}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{new Date(admission.submitted_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${statusColors[admission.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {admission.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
