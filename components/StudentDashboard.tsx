import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, StudentDashboardData, AdmissionApplication, Role } from '../types';
import Spinner from './common/Spinner';
import StudentSidebar from './student/StudentSidebar';
import StudentHeader from './student/StudentHeader';
import StudentOnboardingWizard from './student/StudentOnboardingWizard';

// Import tab components
import DashboardTab from './student_tabs/DashboardTab';
import AcademicsTab from './student_tabs/AcademicsTab';
import ProfileTab from './student_tabs/ProfileTab';
import AnnouncementsTab from './student_tabs/AnnouncementsTab';
import SchoolInfoTab from './student_tabs/SchoolInfoTab';
import AttendanceTab from './student_tabs/AttendanceTab';
import ExamsTab from './student_tabs/ExamsTab';
import FeesTab from './student_tabs/FeesTab';
import DocumentsTab from './student_tabs/DocumentsTab';
import SupportTab from './student_tabs/SupportTab';
import { SchoolIcon } from './icons/SchoolIcon';


interface StudentDashboardProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSwitchRole: () => void;
    onSelectRole?: (role: Role, isExisting?: boolean) => void; 
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ profile, onSignOut, onSwitchRole, onSelectRole }) => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // State for data and view type (student vs parent)
    const [isParentView, setIsParentView] = useState(false);
    const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
    const [currentAdmissionId, setCurrentAdmissionId] = useState<number | null>(null);
    const [allMyChildren, setAllMyChildren] = useState<AdmissionApplication[]>([]);
    const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // This effect runs once to determine the view type
    useEffect(() => {
        const initializeView = async () => {
            setLoading(true);
            // Use profile.id directly instead of supabase.auth.getUser()
            if (!profile.id) { setLoading(false); setError("User ID not available."); return; }

            // Check if the current user has a parent profile. This is the definitive way to know it's a parent.
            const { count, error: parentProfileError } = await supabase.from('parent_profiles').select('user_id', { count: 'exact', head: true }).eq('user_id', profile.id);

            if (parentProfileError) {
                setError("Could not verify user type.");
                setLoading(false);
                return;
            }
            
            if (count && count > 0) { // It's a parent
                setIsParentView(true);
                // 1. Get all their children profiles for the switcher
                const { data: childrenData, error: childrenError } = await supabase.rpc('get_my_children_profiles');

                if (childrenError) { setError("Could not fetch children list."); setLoading(false); return; }
                
                const enrolledChildren = (childrenData || []).filter((child: any) => child.student_user_id);
                setAllMyChildren(enrolledChildren);

                // 2. Find which student they are currently viewing via their 'student_profiles' record
                const { data: parentStudentProfile, error: profileError } = await supabase.from('student_profiles').select('admission_id').eq('user_id', profile.id).single();
                
                if (profileError || !parentStudentProfile) { 
                    // Fallback: if no specific student selected, pick the first one
                    if (enrolledChildren.length > 0) {
                        const firstChild = enrolledChildren[0];
                        setCurrentAdmissionId(firstChild.id);
                        if (firstChild.student_user_id) setCurrentStudentId(firstChild.student_user_id);
                    } else {
                        // No children found or enrolled yet. Stop loading here to show empty state.
                        setLoading(false);
                        return;
                    }
                } else {
                    const initialAdmissionId = parentStudentProfile.admission_id;
                    setCurrentAdmissionId(initialAdmissionId);

                    // 3. Find the student_user_id from that admission record
                    const linkedChild = enrolledChildren.find((c: any) => c.id === initialAdmissionId);
                    if (linkedChild?.student_user_id) {
                        setCurrentStudentId(linkedChild.student_user_id);
                    } else {
                        // Fallback if link is broken
                         if (enrolledChildren.length > 0) {
                            setCurrentStudentId(enrolledChildren[0].student_user_id);
                            setCurrentAdmissionId(enrolledChildren[0].id);
                        } else {
                            setLoading(false); // No valid child found
                        }
                    }
                }

            } else { // It's a student
                setIsParentView(false);
                setCurrentStudentId(profile.id);
            }
            // We will let the next effect handle data fetching if ID exists
        };

        initializeView();
    }, [profile]); 

    // This effect fetches the main dashboard data whenever the student ID to view changes
    const fetchDashboardData = useCallback(async () => {
        if (!currentStudentId) {
             return;
        }

        setLoading(true);
        setError(null);
        const { data, error } = await supabase.rpc('get_student_dashboard_data', { p_student_id: currentStudentId });
        
        if (error) {
            setError(`Failed to load dashboard data: ${error.message}`);
            console.error(error);
        } else {
            setDashboardData(data);
        }
        setLoading(false);
    }, [currentStudentId]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);
    
    const handleSwitchStudent = async (newAdmissionId: number) => {
        if (newAdmissionId === currentAdmissionId) return; // No change

        setLoading(true);
        // 1. Update the parent's pointer in the DB
        const { error: switchError } = await supabase.rpc('parent_switch_student_view', { p_new_admission_id: newAdmissionId });
        if (switchError) {
            setError(`Failed to switch student view: ${switchError.message}`);
            setLoading(false);
            return;
        }
        
        // 2. Update local state to trigger data re-fetch
        setCurrentAdmissionId(newAdmissionId);
        const newChild = allMyChildren.find(c => c.id === newAdmissionId);
        if (newChild?.student_user_id) {
            setCurrentStudentId(newChild.student_user_id);
        } else {
            setError("Error finding new student to display.");
            setLoading(false);
        }
    };
    
    // CHECK FOR WIZARD REQUIREMENT
    if (dashboardData?.needs_onboarding) {
        return <StudentOnboardingWizard data={dashboardData} onComplete={fetchDashboardData} />;
    }

    const renderContent = () => {
        if (loading) {
            return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>;
        }
        
        // Empty State for Parents with no kids linked
        if (isParentView && !currentStudentId) {
             return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="p-6 bg-muted/30 rounded-full mb-4 border-2 border-dashed border-border">
                        <svg className="w-12 h-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No Students Linked</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">It seems you haven't enrolled any children yet, or their profiles haven't been approved by the admin.</p>
                </div>
             )
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="p-4 bg-destructive/10 rounded-full mb-4">
                        <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Dashboard Unavailable</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">Reload Page</button>
                </div>
            );
        }
        
        // Critical: Handle case where data is missing but no error (Blank Screen Fix)
        if (!dashboardData) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in-95">
                    <div className="p-6 bg-muted/20 rounded-full mb-4 border border-border">
                        <SchoolIcon className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Initializing Student Profile...</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">We are setting up your dashboard. If this persists, please contact support.</p>
                    <button onClick={fetchDashboardData} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
                        Retry Loading
                    </button>
                </div>
            );
        }

        switch (activeTab) {
            case 'Dashboard': return <DashboardTab data={dashboardData} />;
            case 'Academics': return <AcademicsTab data={dashboardData} onRefresh={fetchDashboardData} currentUserId={profile.id} />;
            case 'Profile': return <ProfileTab data={dashboardData} />;
            case 'Announcements': return <AnnouncementsTab data={dashboardData} />;
            case 'School Info': return <SchoolInfoTab />;
            case 'Attendance': return <AttendanceTab data={dashboardData} studentId={currentStudentId} />;
            case 'Exams & Grades': return <ExamsTab data={dashboardData} />;
            case 'Fees': return <FeesTab studentId={currentStudentId} />;
            case 'My Documents': return <DocumentsTab />;
            case 'Support': return <SupportTab />;
            default: return <DashboardTab data={dashboardData} />;
        }
    };
    
    return (
        <div className="flex h-screen bg-muted/40">
            <StudentSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                profile={profile}
                isParentView={isParentView}
                onSwitchRole={onSwitchRole}
            />
            <div className="flex flex-col flex-1 overflow-hidden">
                <StudentHeader 
                    profile={profile} 
                    onSignOut={onSignOut} 
                    onSwitchRole={onSwitchRole}
                    onSelectRole={onSelectRole} 
                    onMenuClick={() => setIsSidebarOpen(true)}
                    pageTitle={activeTab}
                    // Pass parent-specific props
                    isParentView={isParentView}
                    allMyChildren={allMyChildren}
                    currentChildId={currentAdmissionId}
                    onSwitchStudent={handleSwitchStudent}
                    currentStudentName={dashboardData?.profile?.display_name}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentDashboard;