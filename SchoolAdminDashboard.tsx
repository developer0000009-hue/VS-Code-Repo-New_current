import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Role, SchoolAdminProfileData, SchoolBranch, BuiltInRoles } from './types';
import Navbar from './components/admin/Navbar';
import Sidebar from './components/admin/Sidebar';
import DashboardOverview from './components/admin/DashboardOverview';
import AdmissionsTab from './components/AdmissionsTab';
import EnquiryTab from './components/EnquiryTab';
import AttendanceTab from './components/AttendanceTab';
import FinanceTab from './components/FinanceTab';
import CommunicationTab from './components/CommunicationTab';
import { UserManagementTab } from './components/UserManagementTab';
import { ProfileCreationPage } from './components/ProfileCreationPage';
import FacilityManagementTab from './components/FacilityManagementTab';
import CoursesTab from './components/CoursesTab';
import MeetingsTab from './components/MeetingsTab';
import HomeworkTab from './components/HomeworkTab';
import StudentManagementTab from './components/StudentManagementTab';
import { supabase } from './services/supabase';
import TimetableTab from './components/TimetableTab';
import CodeVerificationTab from './components/CodeVerificationTab';
import { BranchManagementTab } from './components/BranchManagementTab';
import Spinner from './components/common/Spinner';
import AnalyticsTab from './components/AnalyticsTab';
import TeachersManagementTab from './components/TeachersManagementTab';
import ClassesTab from './components/ClassesTab';
// FIX: Import getAdminMenu to build the menu structure for sidebar and navbar.
import { getAdminMenu } from './components/admin/AdminMenuConfig';

interface SchoolAdminDashboardProps {
    profile: UserProfile;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
    onProfileUpdate: () => void;
    onSignOut: () => void;
}

const SchoolAdminDashboard: React.FC<SchoolAdminDashboardProps> = ({ profile, onSelectRole, onProfileUpdate, onSignOut }) => {
    const [activeComponent, setActiveComponent] = useState('Dashboard');
    const [schoolData, setSchoolData] = useState<SchoolAdminProfileData | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const [branches, setBranches] = useState<SchoolBranch[]>([]);
    const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setLoadingData(true);
        setDataError(null);
        try {
            const [schoolRes, branchRes] = await Promise.all([
                supabase.from('school_admin_profiles').select('*').eq('user_id', profile.id).single(),
                supabase.rpc('get_school_branches')
            ]);

            // Allow missing school profile if initial setup
            if (schoolRes.error && schoolRes.error.code !== 'PGRST116') throw schoolRes.error;
            if (branchRes.error) throw branchRes.error;

            setSchoolData(schoolRes.data);
            const sortedBranches = (branchRes.data || []).sort((a: SchoolBranch, b: SchoolBranch) => 
                (b.is_main_branch ? 1 : 0) - (a.is_main_branch ? 1 : 0)
            );
            setBranches(sortedBranches);

            // Initialize currentBranchId immediately to avoid null state in child components
            if (sortedBranches.length > 0) {
                // If we don't have a selection or it's invalid, default to Main Branch or First
                const mainBranch = sortedBranches.find(b => b.is_main_branch);
                setCurrentBranchId(prevId => {
                    if (prevId && sortedBranches.some(b => b.id === prevId)) return prevId;
                    return mainBranch ? mainBranch.id : sortedBranches[0].id;
                });
            } else {
                setCurrentBranchId(null);
            }

        } catch (e: any) {
            console.error("Error loading initial data", e);
            setDataError(e.message || "Failed to load initial data");
        } finally {
            setLoadingData(false);
        }
    }, [profile.id]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const isHeadOfficeAdmin = useMemo(() => {
        return profile.role === BuiltInRoles.SCHOOL_ADMINISTRATION;
    }, [profile.role]);

    // FIX: Define isBranchAdmin based on isHeadOfficeAdmin to resolve 'Cannot find name' error.
    const isBranchAdmin = !isHeadOfficeAdmin;

    // FIX: Define menuGroups to be passed to child components.
    const menuGroups = useMemo(() => {
        if (!profile.role) return [];
        return getAdminMenu(isHeadOfficeAdmin, profile.role);
    }, [isHeadOfficeAdmin, profile.role]);

    const handleBranchUpdate = (updatedBranch?: SchoolBranch, isDelete: boolean = false) => {
        if (isDelete && updatedBranch) {
            setBranches(prev => prev.filter(b => b.id !== updatedBranch.id));
        } else if (updatedBranch) {
            setBranches(prev => {
                const exists = prev.some(b => b.id === updatedBranch.id);
                if (exists) {
                    return prev.map(b => b.id === updatedBranch.id ? updatedBranch : b);
                } else {
                    return [...prev, updatedBranch].sort((a,b) => (b.is_main_branch ? 1 : 0) - (a.is_main_branch ? 1 : 0));
                }
            });
        } else {
            fetchDashboardData();
        }
    };

    // Fallback effect: Ensure a branch is selected if state somehow becomes inconsistent
    useEffect(() => {
        if (!loadingData && branches.length > 0) {
            const isValid = currentBranchId && branches.some(b => b.id === currentBranchId);
            if (!isValid) {
                const mainBranch = branches.find(b => b.is_main_branch);
                setCurrentBranchId(mainBranch ? mainBranch.id : branches[0].id);
            }
        }
    }, [branches, loadingData, currentBranchId]);

    // Force redirect to Dashboard if non-admin tries to access branch management directly
    useEffect(() => {
        const isBranchAdmin = !isHeadOfficeAdmin;
        if (isBranchAdmin && activeComponent === 'Branches') {
            setActiveComponent('Dashboard');
        }
    }, [isHeadOfficeAdmin, activeComponent]);

    const handleBranchNavigation = useCallback((branchId: number) => {
        setCurrentBranchId(branchId);
        setActiveComponent('Dashboard');
    }, []);

    const currentBranch = useMemo(() => branches.find(b => b.id === currentBranchId) || null, [branches, currentBranchId]);

    const renderContent = () => {
        if (loadingData) return <div className="flex justify-center items-center h-[calc(100vh-80px)]"><Spinner size="lg" /></div>;
        if (dataError) return <div className="p-4 bg-destructive/10 text-destructive rounded-lg m-6">{dataError}</div>;

        switch (activeComponent) {
            case 'Dashboard':
                return <DashboardOverview schoolProfile={schoolData} currentBranch={currentBranch} profile={profile} onNavigateToBranches={() => setActiveComponent('Branches')} />;
            case 'Profile':
                return <ProfileCreationPage profile={profile} role={profile.role!} onComplete={onProfileUpdate} onBack={() => {}} showBackButton={false} />;
            case 'Branches':
                return <BranchManagementTab isHeadOfficeAdmin={isHeadOfficeAdmin} branches={branches} isLoading={loadingData} error={dataError} onBranchUpdate={handleBranchUpdate} onSelectBranch={handleBranchNavigation} schoolProfile={schoolData} />;
            case 'Admissions': return <AdmissionsTab branchId={currentBranchId} />;
            case 'Enquiries': return <EnquiryTab branchId={currentBranchId} />;
            case 'Code Verification': return <CodeVerificationTab branchId={currentBranchId} />;
            case 'Student Management': return <StudentManagementTab />;
            case 'Teacher Management': return <TeachersManagementTab profile={profile} branchId={currentBranchId} />;
            case 'Classes': return <ClassesTab branchId={currentBranchId} />;
            case 'Courses': return <CoursesTab profile={profile} />;
            case 'Attendance': return <AttendanceTab />;
            case 'Timetable': return <TimetableTab />;
            case 'Finance': return <FinanceTab profile={profile} />;
            // FIX: Pass profile prop to CommunicationTab to resolve type error and provide context.
            case 'Communication': return <CommunicationTab profile={profile} />;
            // FIX: Pass profile prop to UserManagementTab to resolve type error and enable features like audit logging.
            case 'User Management': return <UserManagementTab profile={profile} isHeadOfficeAdmin={isHeadOfficeAdmin} />;
            case 'Analytics': return <AnalyticsTab />;
            case 'Meetings': return <MeetingsTab />;
            case 'Homework': return <HomeworkTab />;
            case 'Facility Management': return <FacilityManagementTab />;
            default:
                return <DashboardOverview schoolProfile={schoolData} currentBranch={currentBranch} profile={profile} onNavigateToBranches={() => setActiveComponent('Branches')} />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar 
                activeComponent={activeComponent}
                setActiveComponent={setActiveComponent}
                isCollapsed={isSidebarCollapsed}
                setCollapsed={setIsSidebarCollapsed}
// FIX: Pass the defined isBranchAdmin variable to resolve the 'Cannot find name' error.
                isBranchAdmin={isBranchAdmin}
                isHeadOfficeAdmin={isHeadOfficeAdmin}
                menuGroups={menuGroups}
            />

            {/* Main Content Area with Dynamic Margin */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out h-screen overflow-hidden ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
                <Navbar 
                    activeComponent={activeComponent}
                    setActiveComponent={setActiveComponent}
// FIX: Pass the defined isBranchAdmin variable to resolve the 'Cannot find name' error.
                    isBranchAdmin={isBranchAdmin}
                    isHeadOfficeAdmin={isHeadOfficeAdmin}
                    profile={profile}
                    onSelectRole={onSelectRole}
                    onSignOut={onSignOut}
                    branches={branches}
                    currentBranchId={currentBranchId}
                    onSwitchBranch={setCurrentBranchId}
                    menuGroups={menuGroups}
                />
                
                <main className="flex-grow w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 custom-scrollbar overflow-y-auto">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SchoolAdminDashboard;