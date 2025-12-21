
import React from 'react';

// --- Roles ---
export type Role = 'School Administration' | 'Branch Admin' | 'Principal' | 'HR Manager' | 'Academic Coordinator' | 'Accountant' | 'Teacher' | 'Student' | 'Parent/Guardian' | 'Transport Staff' | 'E-commerce Operator' | 'Super Admin';

export const BuiltInRoles = {
    SCHOOL_ADMINISTRATION: 'School Administration' as Role,
    BRANCH_ADMIN: 'Branch Admin' as Role,
    PRINCIPAL: 'Principal' as Role,
    HR_MANAGER: 'HR Manager' as Role,
    ACADEMIC_COORDINATOR: 'Academic Coordinator' as Role,
    ACCOUNTANT: 'Accountant' as Role,
    TEACHER: 'Teacher' as Role,
    STUDENT: 'Student' as Role,
    PARENT_GUARDIAN: 'Parent/Guardian' as Role,
    TRANSPORT_STAFF: 'Transport Staff' as Role,
    ECOMMERCE_OPERATOR: 'E-commerce Operator' as Role,
    SUPER_ADMIN: 'Super Admin' as Role
};

// --- User Profiles ---
export interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    phone?: string;
    role: Role | null;
    profile_completed: boolean;
    is_active: boolean;
    is_super_admin?: boolean;
    created_at?: string;
    email_confirmed_at?: string | null;
}

export interface ProfileData {
    id?: string;
    user_id: string;
    display_name?: string;
    phone?: string;
    created_at?: string;
    updated_at?: string;
}

export interface SchoolAdminProfileData extends ProfileData {
    school_name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    admin_contact_name: string;
    admin_contact_email: string;
    admin_contact_phone?: string;
    admin_designation: string;
    academic_board?: string;
    affiliation_number?: string;
    school_type?: string;
    academic_year_start?: string;
    academic_year_end?: string;
    grade_range_start?: string;
    grade_range_end?: string;
    onboarding_step?: string;
    plan_id?: string;
    workload_limit?: number;
}

export interface ParentProfileData extends ProfileData {
    relationship_to_student: string;
    gender: string;
    number_of_children?: number;
    address: string;
    country: string;
    state: string;
    city: string;
    pin_code?: string;
    secondary_parent_name?: string;
    secondary_parent_relationship?: string;
    secondary_parent_gender?: string;
    secondary_parent_email?: string;
    secondary_parent_phone?: string;
}

export interface StudentProfileData extends ProfileData {
    grade: string;
    date_of_birth?: string;
    gender?: string;
    parent_guardian_details?: string;
    roll_number?: string;
    student_id_number?: string;
    assigned_class_id?: number;
    branch_id?: number;
}

export interface TeacherProfileData extends ProfileData {
    subject?: string;
    qualification?: string;
    experience_years?: number;
    date_of_joining?: string;
    bio?: string;
    specializations?: string;
    profile_picture_url?: string;
    gender?: string;
    date_of_birth?: string;
    department?: string;
    designation?: string;
    employee_id?: string;
    employment_type?: string;
    employment_status?: string;
    branch_id?: number;
    salary?: string;
    bank_details?: string;
    workload_limit?: number;
}

export interface TransportProfileData extends ProfileData {
    route_id?: number;
    vehicle_details?: string;
    license_info?: string;
}

export interface EcommerceProfileData extends ProfileData {
    store_name: string;
    business_type: string;
}

// --- Branches & Departments ---
export interface SchoolBranch {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    is_main_branch: boolean;
    admin_name?: string;
    admin_email?: string;
    admin_phone?: string;
    email?: string;
}

export interface SchoolDepartment {
    id: number;
    name: string;
    description?: string;
    hod_id?: string;
    hod_name?: string;
    teacher_count?: number;
    course_count?: number;
}

// --- Admissions & Enquiries ---
export type AdmissionStatus = 'Pending Review' | 'Documents Requested' | 'Approved' | 'Rejected' | 'Enquiry' | 'Payment Pending';

export interface AdmissionApplication {
    id: number;
    applicant_name: string;
    grade: string;
    date_of_birth?: string;
    gender?: string;
    status: AdmissionStatus;
    submitted_at: string;
    updated_at?: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    application_number?: string;
    branch_id?: number;
    branch_name?: string;
    student_user_id?: string;
    student_system_email?: string;
    medical_info?: string;
    emergency_contact?: string;
    profile_photo_url?: string;
}

export type EnquiryStatus = 'New' | 'Contacted' | 'In Review' | 'Completed';

export interface Enquiry {
    id: number;
    applicant_name: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    grade: string;
    status: EnquiryStatus;
    received_at: string;
    notes?: string;
    admission_id?: number;
}

export interface MyEnquiry extends Enquiry {
    last_updated: string;
}

export interface TimelineItem {
    id: string;
    item_type: 'MESSAGE' | 'EVENT';
    created_at: string;
    created_by_name: string;
    is_admin: boolean;
    details: any;
}

// --- Verification & Codes ---
export type ShareCodeType = 'Enquiry' | 'Admission';
export type ShareCodeStatus = 'Active' | 'Expired' | 'Revoked' | 'Redeemed';

export interface ShareCode {
    id: number;
    code: string;
    admission_id: number;
    applicant_name: string;
    status: ShareCodeStatus;
    code_type: ShareCodeType;
    expires_at: string;
    created_at: string;
}

export interface VerifiedShareCodeData {
    admission_id: number;
    applicant_name: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    grade: string;
    gender: string;
    date_of_birth: string;
    code_type: ShareCodeType;
    already_imported: boolean;
    error?: string;
}

// --- Documents ---
export interface DocumentRequirement {
    id: number;
    admission_id: number;
    document_name: string;
    status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';
    notes_for_parent?: string;
    rejection_reason?: string;
}

export interface AdmissionDocument {
    id: number;
    admission_id: number;
    requirement_id: number;
    file_name: string;
    storage_path: string;
    uploaded_at: string;
}

// --- Classes & Courses ---
export interface SchoolClass {
    id: number;
    name: string;
    grade_level: string;
    section: string;
    academic_year: string;
    class_teacher_id?: string;
    branch_id?: number;
    capacity?: number;
    teacher_name?: string;
}

export type CourseStatus = 'Active' | 'Draft' | 'Archived' | 'Pending' | 'Inactive';

export interface Course {
    id: number;
    title: string;
    code: string;
    description?: string;
    credits?: number;
    category?: string;
    status: CourseStatus;
    teacher_id?: string;
    teacher_name?: string;
    grade_level?: string;
    department?: string;
    enrolled_count?: number;
    modules_count?: number;
    subject_type?: string;
    created_at?: string;
}

export interface CourseModule {
    id: number;
    course_id: number;
    title: string;
    order_index: number;
    status?: string;
    duration_hours?: number;
}

// --- Attendance ---
export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface AttendanceRecord {
    id?: number;
    student_id: string;
    class_id: number;
    attendance_date: string;
    status: AttendanceStatus;
    notes?: string;
    recorded_by?: string;
}

export interface StudentAttendanceRecord {
    date: string;
    status: AttendanceStatus;
    notes?: string;
}

// --- Timetable ---
export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type TimeSlot = '08:00' | '09:00' | '10:00' | '11:00' | '13:00' | '14:00' | '15:00';

export interface TimetableEntry {
    id: string;
    day: Day;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
    room?: string;
    class_name?: string;
    isConflict?: boolean;
}

// --- Finance ---
export interface FinanceData {
    revenue_ytd: number;
    collections_this_month: number;
    pending_dues: number;
    overdue_accounts: number;
    online_payments: number;
    refunds_processed: number;
}

export interface FeeStructure {
    id: number;
    branch_id?: number | null;
    name: string;
    description?: string;
    academic_year: string;
    target_grade?: string;
    status: 'Draft' | 'Active' | 'Archived';
    is_active: boolean;
    currency: 'INR' | 'USD';
    components?: FeeComponent[];
    created_at?: string;
    updated_at?: string;
}

export interface FeeComponent {
    id: number;
    structure_id: number;
    name: string;
    amount: number;
    frequency: 'One-time' | 'Monthly' | 'Quarterly' | 'Annually';
    is_mandatory: boolean;
    ledger_code?: string;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial';

export interface StudentInvoice {
    id: number;
    student_id: string;
    description: string;
    amount: number;
    amount_paid: number;
    due_date: string;
    status: InvoiceStatus;
    concession_amount?: number;
}

export interface StudentFeeSummary {
    student_id: string;
    display_name: string;
    class_name: string;
    total_billed: number;
    total_paid: number;
    outstanding_balance: number;
    overall_status: 'Paid' | 'Pending' | 'Overdue' | 'No Invoices';
}

export interface Payment {
    id: number;
    invoice_id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    receipt_number: string;
    reference?: string;
}

export interface StudentFinanceDetails {
    invoices: StudentInvoice[];
    payments: Payment[];
}

export interface DuesDashboardData {
    total_dues: number;
    total_overdue: number;
    overdue_student_count: number;
    dues_by_class: ClassDuesInfo[];
    highest_dues_students: StudentDuesInfo[];
}

export interface StudentDuesInfo {
    student_id: string;
    display_name: string;
    class_name: string;
    outstanding_balance: number;
}

export interface ClassDuesInfo {
    class_name: string;
    total_dues: number;
}

export interface Expense {
    id: number;
    category: string;
    amount: number;
    vendor_name?: string;
    expense_date: string;
    description: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    invoice_url?: string;
    payment_mode?: string;
}

export interface ExpenseDashboardData {
    total_expenses_month: number;
    pending_approvals: number;
    recent_expenses: Expense[];
}

// --- Reports ---
export interface FeeCollectionReportItem {
    transaction_date: string;
    student_name: string;
    class_name: string;
    amount: number;
    payment_method: string;
    receipt_number: string;
}

export interface ExpenseReportItem {
    expense_date: string;
    category: string;
    description: string;
    amount: number;
    vendor: string;
    status: string;
}

export interface StudentLedgerEntry {
    date: string;
    type: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

// --- Student Specific ---
export interface StudentForAdmin extends UserProfile {
    grade: string;
    student_id_number?: string;
    roll_number?: string;
    assigned_class_id?: number;
    assigned_class_name?: string;
    parent_guardian_details?: string;
    profile_photo_url?: string;
    gender?: string;
    date_of_birth?: string;
    address?: string;
}

export interface StudentDashboardData {
    profile: StudentForAdmin;
    admission: AdmissionApplication;
    classInfo: SchoolClass | null;
    attendanceSummary: {
        total_days: number;
        present_days: number;
        absent_days: number;
        late_days: number;
    };
    assignments: StudentAssignment[];
    recentGrades: any[];
    announcements: Communication[];
    timetable: any[];
    studyMaterials: StudyMaterial[];
    needs_onboarding: boolean;
}

export type SubmissionStatus = 'Not Submitted' | 'Submitted' | 'Late' | 'Graded';

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

export interface StudyMaterial {
    id: number;
    title: string;
    file_name: string;
    file_path: string;
    file_type: string;
    subject: string;
    is_bookmarked: boolean;
    created_at: string;
}

// --- Teacher Specific ---
export interface TeacherExtended extends UserProfile {
    details?: TeacherProfileData;
    dailyStatus?: string;
}

export interface TeacherDocument {
    id: number;
    teacher_id: string;
    document_name: string;
    document_type: string;
    file_path: string;
    status: 'Verified' | 'Pending';
    uploaded_at: string;
}

export interface TeacherSubjectMapping {
    id: number;
    teacher_id: string;
    subject_id: number;
    class_id: number;
    academic_year: string;
    class_name?: string;
    subject_name?: string;
    credits?: number;
    category?: string;
}

export interface TeacherClassOverview {
    id: number;
    name: string;
    student_count: number;
}

export interface TeacherClassDetails {
    roster: StudentRosterItem[];
    assignments: any[];
    studyMaterials: any[];
    subjects: ClassSubject[];
}

export interface StudentRosterItem {
    id: string;
    display_name: string;
    roll_number?: string;
}

export interface ClassSubject {
    id: number;
    name: string;
}

export interface LessonPlan {
    id: number;
    title: string;
    subject_name: string;
    lesson_date: string;
    objectives: string;
    activities: string;
    resources: any[];
}

export interface ClassPerformanceSummary {
    average_grade: number;
    attendance_rate: number;
}

export interface StudentPerformanceReport {
    attendance_summary: {
        present: number;
        absent: number;
        late: number;
    };
    assignments: any[];
}

export interface Workshop {
    id: number;
    title: string;
    description: string;
    workshop_date: string;
}

export interface TeacherProfessionalDevelopmentData {
    total_points: number;
    training_records: any[];
    awards: any[];
}

// --- Transport ---
export interface TransportDashboardData {
    route: {
        id: number;
        name: string;
        description: string;
    };
    students: BusStudent[];
}

export interface BusStudent {
    id: string;
    display_name: string;
    grade: string;
    parent_guardian_details: string;
    status?: BusAttendanceStatus;
}

export interface BusAttendanceRecord {
    student_id: string;
    status: BusAttendanceStatus;
}

export type BusAttendanceStatus = 'Boarded' | 'Absent';
export type BusTripType = 'Morning Pickup' | 'Afternoon Drop-off';

export interface BusRoute {
    id: number;
    name: string;
    description: string;
}

// --- Communication ---
export interface Communication {
    id: number;
    subject: string;
    body: string;
    sender_name: string;
    sender_role?: string;
    sent_at: string;
    recipients: string[];
    status?: string;
    target_criteria?: any;
}

// --- Analytics ---
export interface AdminAnalyticsStats {
    total_users: number;
    total_applications: number;
    pending_applications: number;
}

export interface BulkImportResult {
    success_count: number;
    failure_count: number;
    errors: any[];
}

// --- Common ---
export type FunctionComponentWithIcon<P = {}> = React.FC<P> & {
    Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
};
