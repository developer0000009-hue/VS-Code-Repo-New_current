
import React from 'react';

export type Role = 
    | 'School Administration' 
    | 'Branch Admin' 
    | 'Teacher' 
    | 'Student' 
    | 'Parent/Guardian' 
    | 'Transport Staff' 
    | 'E-commerce Operator' 
    | 'Super Admin'
    | 'Principal'
    | 'HR Manager'
    | 'Academic Coordinator'
    | 'Accountant';

export const BuiltInRoles: Record<string, Role> = {
    ADMIN: 'School Administration',
    SCHOOL_ADMINISTRATION: 'School Administration',
    BRANCH_ADMIN: 'Branch Admin',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    PARENT_GUARDIAN: 'Parent/Guardian',
    TRANSPORT_STAFF: 'Transport Staff',
    ECOMMERCE_OPERATOR: 'E-commerce Operator',
    SUPER_ADMIN: 'Super Admin',
    PRINCIPAL: 'Principal',
    HR_MANAGER: 'HR Manager',
    ACADEMIC_COORDINATOR: 'Academic Coordinator',
    ACCOUNTANT: 'Accountant'
};

export interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    phone?: string;
    role: Role | null;
    profile_completed: boolean;
    is_active: boolean;
    created_at: string;
    branch_id?: number | null;
    email_confirmed_at?: string | null;
}

// Fix: Added missing SchoolAdminProfileData interface
export interface SchoolAdminProfileData {
    user_id: string;
    school_name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    admin_contact_name: string;
    admin_contact_phone: string;
    admin_contact_email: string;
    admin_designation?: string;
    academic_board?: string;
    affiliation_number?: string;
    school_type?: string;
    academic_year_start?: string;
    academic_year_end?: string;
    grade_range_start?: string;
    grade_range_end?: string;
    onboarding_step: 'profile' | 'pricing' | 'branches' | 'completed';
    workload_limit?: number;
}

// Fix: Added missing ParentProfileData interface
export interface ParentProfileData {
    user_id: string;
    relationship_to_student: string;
    gender: string;
    number_of_children: number;
    address: string;
    city: string;
    state: string;
    country: string;
    pin_code: string;
    secondary_parent_name?: string | null;
    secondary_parent_email?: string | null;
    secondary_parent_phone?: string | null;
    secondary_parent_relationship?: string | null;
    secondary_parent_gender?: string | null;
}

// Fix: Added missing StudentProfileData interface
export interface StudentProfileData {
    user_id: string;
    student_id_number: string | null;
    roll_number: string | null;
    grade: string;
    parent_guardian_details: string;
    assigned_class_id: number | null;
    profile_photo_url: string | null;
    date_of_birth: string | null;
    gender: string | null;
    address: string | null;
}

// Fix: Added missing TransportProfileData interface
export interface TransportProfileData {
    user_id: string;
    route_id: number | null;
    vehicle_details: string;
    license_info: string;
}

// Fix: Added missing BusRoute interface
export interface BusRoute {
    id: number;
    name: string;
    description: string;
    branch_id: number | null;
}

// Fix: Added missing EcommerceProfileData interface
export interface EcommerceProfileData {
    user_id: string;
    store_name: string;
    business_type: string;
}

export interface TeacherExtended extends UserProfile {
    details?: Partial<TeacherProfileData>;
    dailyStatus?: 'Present' | 'Absent' | 'Late';
}

export interface TeacherProfileData {
    user_id: string;
    subject: string;
    qualification: string;
    experience_years: number;
    date_of_joining: string;
    bio: string;
    specializations: string;
    profile_picture_url: string;
    gender: string;
    date_of_birth: string;
    department: string;
    designation: string;
    employee_id: string;
    employment_type: string;
    employment_status: string;
    branch_id: number | null;
    workload_limit?: number;
    // Fix: Added salary and bank_details properties
    salary?: number;
    bank_details?: string;
}

export interface StudentForAdmin extends UserProfile {
    student_id_number: string | null;
    roll_number: string | null;
    grade: string;
    parent_guardian_details: string;
    assigned_class_id: number | null;
    assigned_class_name: string | null;
    profile_photo_url: string | null;
    date_of_birth: string | null;
    gender: string | null;
    address: string | null;
}

// Fix: Added missing AdmissionStatus type
export type AdmissionStatus = 'Pending Review' | 'Documents Requested' | 'Approved' | 'Rejected';

// Fix: Added missing AdmissionApplication interface
export interface AdmissionApplication {
    id: number;
    applicant_name: string;
    grade: string;
    status: AdmissionStatus;
    submitted_at: string;
    parent_name: string;
    parent_phone: string;
    parent_email: string;
    date_of_birth: string;
    gender: string;
    profile_photo_url: string | null;
    medical_info?: string;
    emergency_contact?: string;
    application_number?: string;
}

export interface SchoolBranch {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    is_main_branch: boolean;
    admin_name: string;
    admin_phone: string;
    admin_email: string;
    status: 'Active' | 'Inactive' | 'Linked' | 'Pending';
}

export interface SchoolClass {
    id: number;
    name: string;
    grade_level: string;
    section: string;
    academic_year: string;
    class_teacher_id: string | null;
    branch_id: number | null;
    capacity: number;
    student_count?: number;
    teacher_name?: string;
}

// Fix: Added missing CourseStatus type
export type CourseStatus = 'Active' | 'Draft' | 'Archived' | 'Pending' | 'Inactive';

export interface Course {
    id: number;
    title: string;
    code: string;
    grade_level: string;
    description: string;
    credits: number;
    category: string;
    status: CourseStatus;
    teacher_id?: string | null;
    teacher_name?: string;
    department?: string;
    enrolled_count?: number;
    created_at?: string;
    branch_id?: number | null;
    subject_type?: string;
}

export interface Communication {
    id: number;
    subject: string;
    body: string;
    sent_at: string;
    status: 'Sent' | 'Delivered' | 'Failed';
    recipients: string[];
    sender_name?: string;
    sender_role?: string;
    target_criteria?: any;
}

export interface StudentFeeSummary {
    student_id: string;
    display_name: string;
    class_name: string;
    total_billed: number;
    total_paid: number;
    outstanding_balance: number;
    overall_status: 'Paid' | 'Overdue' | 'Pending';
}

export interface FinanceData {
    revenue_ytd: number;
    collections_this_month: number;
    pending_dues: number;
    online_payments: number;
}

export interface TimelineItem {
    id: number;
    item_type: 'MESSAGE' | 'EVENT';
    created_at: string;
    created_by_name: string;
    is_admin: boolean;
    details: any;
}

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type TimeSlot = string;

export interface TimetableEntry {
    id: string;
    day: Day;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
    room: string;
    class_name?: string;
    isConflict?: boolean;
}

// Fix: Added missing StudentRosterItem interface
export interface StudentRosterItem {
    id: string;
    display_name: string;
    roll_number: string | null;
}

// Fix: Added missing AttendanceStatus type
export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

// Fix: Added missing AttendanceRecord interface
export interface AttendanceRecord {
    id?: number;
    student_id: string;
    class_id: number;
    attendance_date: string;
    status: AttendanceStatus;
    notes: string | null;
}

// Fix: Added missing ShareCodeStatus type
export type ShareCodeStatus = 'Active' | 'Expired' | 'Revoked' | 'Redeemed';

// Fix: Added missing ShareCodeType type
export type ShareCodeType = 'Enquiry' | 'Admission';

// Fix: Added missing ShareCode interface
export interface ShareCode {
    id: number;
    code: string;
    admission_id: number;
    applicant_name: string;
    status: ShareCodeStatus;
    code_type: ShareCodeType;
    expires_at: string;
    purpose: string;
    profile_photo_url: string | null;
}

// Fix: Added missing EnquiryStatus type
export type EnquiryStatus = 'New' | 'Contacted' | 'In Review' | 'Completed';

// Fix: Added missing Enquiry interface
export interface Enquiry {
    id: number;
    applicant_name: string;
    grade: string;
    status: EnquiryStatus;
    received_at: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    notes?: string;
    admission_id?: number | null;
}

// Fix: Added missing MyEnquiry interface (used in MessagesTab)
export interface MyEnquiry extends Enquiry {
    last_updated: string;
}

// Fix: Added missing VerifiedShareCodeData interface
export interface VerifiedShareCodeData {
    admission_id: number;
    applicant_name: string;
    grade: string;
    gender: string;
    date_of_birth: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    code_type: ShareCodeType;
    found: boolean;
    already_imported: boolean;
    error?: string;
}

// Fix: Added missing TeacherClassOverview interface
export interface TeacherClassOverview {
    id: number;
    name: string;
    student_count: number;
}

// Fix: Added missing TeacherClassDetails interface
export interface TeacherClassDetails {
    subjects: ClassSubject[];
    roster: StudentRosterItem[];
    assignments: any[];
    studyMaterials: any[];
}

// Fix: Added missing ClassSubject interface
export interface ClassSubject {
    id: number;
    name: string;
}

// Fix: Added missing LessonPlan interface
export interface LessonPlan {
    id: number;
    title: string;
    subject_name: string;
    lesson_date: string;
    objectives: string;
    activities: string;
    resources: any[];
}

// Fix: Added missing SubmissionStatus type
export type SubmissionStatus = 'Not Submitted' | 'Submitted' | 'Late' | 'Graded';

// Fix: Added missing StudentAssignment interface
export interface StudentAssignment {
    id: number;
    title: string;
    description: string;
    subject: string;
    due_date: string;
    status: SubmissionStatus;
    submission_grade?: string;
    teacher_feedback?: string;
    file_path?: string;
}

// Fix: Added missing StudyMaterial interface
export interface StudyMaterial {
    id: number;
    title: string;
    subject: string;
    file_name: string;
    file_path: string;
    file_type: string;
    is_bookmarked: boolean;
}

// Fix: Added missing StudentAttendanceRecord interface
export interface StudentAttendanceRecord {
    date: string;
    status: AttendanceStatus;
    notes: string | null;
}

// Fix: Added missing InvoiceStatus type
export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial';

// Fix: Added missing StudentInvoice interface
export interface StudentInvoice {
    id: number;
    due_date: string;
    description: string;
    amount: number;
    amount_paid: number;
    status: InvoiceStatus;
}

// Fix: Added missing ClassPerformanceSummary interface
export interface ClassPerformanceSummary {
    average_grade: number;
    attendance_rate: number;
}

// Fix: Added missing StudentPerformanceReport interface
export interface StudentPerformanceReport {
    attendance_summary: {
        present: number;
        absent: number;
        late: number;
    };
    assignments: any[];
}

// Fix: Added missing Workshop interface
export interface Workshop {
    id: number;
    title: string;
    description: string;
    workshop_date: string;
}

// Fix: Added missing TeacherProfessionalDevelopmentData interface
export interface TeacherProfessionalDevelopmentData {
    total_points: number;
    training_records: any[];
    awards: any[];
}

// Fix: Added missing TransportDashboardData interface
export interface TransportDashboardData {
    route: {
        id: number;
        name: string;
        description: string;
    };
    students: BusStudent[];
    error?: string;
}

// Fix: Added missing BusStudent interface
export interface BusStudent {
    id: string;
    display_name: string;
    grade: string;
    parent_guardian_details: string;
    status?: BusAttendanceStatus;
}

// Fix: Added missing BusAttendanceStatus type
export type BusAttendanceStatus = 'Boarded' | 'Absent';

// Fix: Added missing BusTripType type
export type BusTripType = 'Morning Pickup' | 'Afternoon Drop-off';

// Fix: Added missing BusAttendanceRecord interface
export interface BusAttendanceRecord {
    student_id: string;
    status: BusAttendanceStatus;
}

// Fix: Added missing DocumentRequirement interface
export interface DocumentRequirement {
    id: number;
    admission_id: number;
    document_name: string;
    status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected' | 'Verified';
}

// Fix: Added missing TeacherDocument interface
export interface TeacherDocument {
    id: number;
    document_name: string;
    document_type: string;
    file_path: string;
    status: string;
    uploaded_at: string;
}

// Fix: Added missing TeacherSubjectMapping interface
export interface TeacherSubjectMapping {
    id: number;
    subject_id: number;
    class_id: number;
    class_name: string;
    subject_name: string;
    credits?: number;
    category?: string;
}

// Fix: Added missing BulkImportResult interface
export interface BulkImportResult {
    success_count: number;
    failure_count: number;
    errors: any[];
}

// Fix: Added missing SchoolDepartment interface
export interface SchoolDepartment {
    id: number;
    name: string;
    description: string;
    hod_id: string | null;
    hod_name?: string;
    teacher_count?: number;
    course_count?: number;
}

// Fix: Added missing DuesDashboardData interface
export interface DuesDashboardData {
    total_dues: number;
    total_overdue: number;
    overdue_student_count: number;
    dues_by_class: ClassDuesInfo[];
    highest_dues_students: StudentDuesInfo[];
}

// Fix: Added missing StudentDuesInfo interface
export interface StudentDuesInfo {
    student_id: string;
    display_name: string;
    class_name: string;
    outstanding_balance: number;
}

// Fix: Added missing ClassDuesInfo interface
export interface ClassDuesInfo {
    class_name: string;
    total_dues: number;
}

// Fix: Added missing ExpenseDashboardData interface
export interface ExpenseDashboardData {
    total_expenses_month: number;
    pending_approvals: number;
    recent_expenses: Expense[];
}

// Fix: Added missing Expense interface
export interface Expense {
    id: number;
    expense_date: string;
    category: string;
    amount: number;
    vendor_name: string;
    description: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    invoice_url?: string;
}

// Fix: Added missing FeeCollectionReportItem interface
export interface FeeCollectionReportItem {
    payment_date: string;
    student_name: string;
    amount: number;
}

// Fix: Added missing ExpenseReportItem interface
export interface ExpenseReportItem {
    expense_date: string;
    category: string;
    amount: number;
}

// Fix: Added missing StudentLedgerEntry interface
export interface StudentLedgerEntry {
    transaction_date: string;
    description: string;
    debit?: number;
    credit?: number;
    balance: number;
}

// Fix: Added missing Payment interface
export interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    receipt_number: string;
}

// Fix: Added missing StudentFinanceDetails interface
export interface StudentFinanceDetails {
    invoices: StudentInvoice[];
    payments: Payment[];
}

// Fix: Added missing FeeStructure interface
export interface FeeStructure {
    id: number;
    name: string;
    academic_year: string;
    target_grade: string;
    description: string;
    currency: string;
    status: string;
    components?: any[];
}

// Fix: Added missing AdminAnalyticsStats interface
export interface AdminAnalyticsStats {
    total_users: number;
    total_applications: number;
    pending_applications: number;
}

// Fix: Added missing CourseModule interface
export interface CourseModule {
    id: number;
    title: string;
    order_index: number;
}

export interface StudentDashboardData {
    profile: StudentForAdmin;
    admission: AdmissionApplication; // Added to handle onboarding data
    attendanceSummary: {
        total_days: number;
        present_days: number;
        absent_days: number;
        late_days: number;
    };
    assignments: any[];
    timetable: TimetableEntry[];
    recentGrades: any[];
    announcements: Communication[];
    studyMaterials: any[];
    classInfo: any;
    needs_onboarding?: boolean;
}

export type FunctionComponentWithIcon<P = {}> = React.FC<P> & { Icon?: React.FC<React.SVGProps<SVGSVGElement>> };
