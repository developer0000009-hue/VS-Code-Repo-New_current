
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
    PARENT: 'Parent/Guardian',
    PARENT_GUARDIAN: 'Parent/Guardian',
    TRANSPORT: 'Transport Staff',
    TRANSPORT_STAFF: 'Transport Staff',
    ECOMMERCE: 'E-commerce Operator',
    ECOMMERCE_OPERATOR: 'E-commerce Operator',
    SUPER: 'Super Admin',
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
    created_at?: string;
    // Fix: Added is_super_admin to UserProfile
    is_super_admin?: boolean;
    // Fix: Added email_confirmed_at to UserProfile
    email_confirmed_at?: string;
}

export interface AdmissionApplication {
    id: number;
    application_number: string;
    applicant_name: string;
    grade: string;
    status: AdmissionStatus;
    submitted_at: string;
    parent_name: string;
    profile_photo_url?: string;
    // Fix: Added missing properties to AdmissionApplication
    student_user_id?: string;
    date_of_birth?: string;
    gender?: string;
    parent_email?: string;
    parent_phone?: string;
    branch_id?: number;
    medical_info?: string;
    emergency_contact?: string;
    branch_name?: string;
    student_system_email?: string;
    updated_at?: string;
}

export type AdmissionStatus = 'Pending Review' | 'Documents Requested' | 'Approved' | 'Rejected' | 'Enquiry' | 'Payment Pending';

export interface Communication {
    id: number;
    subject: string;
    body: string;
    sender_name: string;
    sent_at: string;
    recipients: string[];
    // Fix: Added missing properties to Communication
    target_criteria?: any;
    status?: string;
    sender_role?: string;
}

export interface DocumentRequirement {
    id: number;
    admission_id: number;
    document_name: string;
    // Fix: Added 'Verified' to status union to resolve comparison errors in components.
    status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected' | 'Verified';
    rejection_reason?: string;
    notes_for_parent?: string;
    admission_documents?: AdmissionDocument[];
    applicant_name?: string;
}

export interface AdmissionDocument {
    id: number;
    admission_id: number;
    requirement_id: number;
    file_name: string;
    storage_path: string;
    uploaded_at: string;
}

export interface SchoolClass {
    id: number;
    name: string;
    grade_level?: string;
    section?: string;
    academic_year?: string;
    class_teacher_id?: string | null;
    capacity?: number;
    branch_id?: number | null;
}

export interface Course {
    id: number;
    title: string;
    grade_level: string;
    code: string;
    description: string;
    credits: number;
    category: string;
    status: CourseStatus;
    teacher_id?: string | null;
    teacher_name?: string;
    department?: string;
    subject_type?: string;
    enrolled_count?: number;
    created_at?: string;
}

export type CourseStatus = 'Active' | 'Draft' | 'Archived' | 'Pending' | 'Inactive';

export interface StudentForAdmin extends UserProfile {
    grade: string;
    student_id_number?: string;
    parent_guardian_details?: string;
    assigned_class_id?: number | null;
    assigned_class_name?: string | null;
    profile_photo_url?: string;
    gender?: string;
    date_of_birth?: string;
    address?: string;
}

export interface TeacherProfileData {
    subject?: string;
    qualification?: string;
    experience_years?: number | null;
    date_of_joining?: string | null;
    bio?: string;
    specializations?: string;
    profile_picture_url?: string | null;
    gender?: string;
    date_of_birth?: string | null;
    department?: string;
    designation?: string;
    employee_id?: string;
    employment_type?: string;
    employment_status?: string;
    branch_id?: number | null;
    workload_limit?: number;
    salary?: string;
    bank_details?: string;
}

export interface TeacherExtended extends UserProfile {
    details?: TeacherProfileData;
    dailyStatus?: string;
}

// Fix: Added ParentProfileData interface to resolve missing exported member error
export interface ParentProfileData {
    user_id: string;
    relationship_to_student?: string;
    gender?: string;
    number_of_children?: number | null;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    pin_code?: string;
    secondary_parent_name?: string;
    secondary_parent_relationship?: string;
    secondary_parent_gender?: string;
    secondary_parent_email?: string;
    secondary_parent_phone?: string;
}

// Fix: Added StudentProfileData interface to resolve missing exported member error
export interface StudentProfileData {
    user_id: string;
    grade?: string;
    date_of_birth?: string | null;
    gender?: string;
    parent_guardian_details?: string;
    student_id_number?: string;
    assigned_class_id?: number | null;
    profile_photo_url?: string;
    address?: string;
    branch_id?: number | null;
}

// Fix: Added TransportProfileData interface to resolve missing exported member error
export interface TransportProfileData {
    user_id: string;
    route_id?: number | null;
    vehicle_details?: string;
    license_info?: string;
}

// Fix: Added EcommerceProfileData interface to resolve missing exported member error
export interface EcommerceProfileData {
    user_id: string;
    store_name?: string;
    business_type?: string;
}

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

export interface SchoolAdminProfileData {
    id: number;
    user_id: string;
    school_name: string;
    address: string;
    country: string;
    state: string;
    city: string;
    admin_contact_name: string;
    admin_contact_email: string;
    admin_contact_phone: string;
    admin_designation: string;
    academic_board: string;
    affiliation_number: string;
    school_type: string;
    academic_year_start: string;
    academic_year_end: string;
    grade_range_start: string;
    grade_range_end: string;
    onboarding_step?: string;
    plan_id?: string;
}

export interface StudentDashboardData {
    profile: UserProfile & { roll_number?: string; student_id_number?: string; grade: string; parent_guardian_details?: string };
    classInfo?: { name: string; teacher_name: string };
    assignments: StudentAssignment[];
    attendanceSummary: { total_days: number; present_days: number; absent_days: number; late_days: number };
    timetable: any[];
    announcements: Communication[];
    recentGrades: any[];
    studyMaterials: StudyMaterial[];
    needs_onboarding?: boolean;
    admission: AdmissionApplication;
}

export type SubmissionStatus = 'Not Submitted' | 'Submitted' | 'Late' | 'Graded' | 'Overdue';

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
    subject: string;
    file_name: string;
    file_path: string;
    file_type: string;
    is_bookmarked: boolean;
    created_at: string;
}

export interface StudentAttendanceRecord {
    date: string;
    status: AttendanceStatus;
    notes?: string;
}

export interface StudentInvoice {
    id: number;
    description: string;
    amount: number;
    amount_paid: number;
    status: InvoiceStatus;
    due_date: string;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial';

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

export interface TeacherDocument {
    id: number;
    document_name: string;
    document_type: string;
    file_path: string;
    status: string;
    uploaded_at: string;
}

export interface TeacherSubjectMapping {
    id: number;
    teacher_id: string;
    subject_id: number;
    class_id: number;
    academic_year: string;
    class_name: string;
    subject_name: string;
    credits?: number;
    category?: string;
}

export interface BulkImportResult {
    success_count: number;
    failure_count: number;
    errors: any[];
}

export interface SchoolDepartment {
    id: number;
    name: string;
    description?: string;
    hod_id?: string | null;
    hod_name?: string;
    teacher_count?: number;
    course_count?: number;
}

export interface Enquiry {
    id: number;
    applicant_name: string;
    parent_name: string;
    status: EnquiryStatus;
    received_at: string;
    grade: string;
    parent_email?: string;
    parent_phone?: string;
    notes?: string;
    admission_id?: number | null;
}

export type EnquiryStatus = 'New' | 'Contacted' | 'In Review' | 'Completed';

export interface MyEnquiry extends Enquiry {
    last_updated: string;
}

export interface TimelineItem {
    id: number;
    item_type: 'MESSAGE' | 'EVENT';
    created_at: string;
    created_by_name: string;
    is_admin: boolean;
    details: any;
}

export interface VerifiedShareCodeData {
    admission_id: number;
    code_type: ShareCodeType;
    applicant_name: string;
    parent_name: string;
    grade: string;
    gender: string;
    date_of_birth: string;
    parent_email: string;
    parent_phone: string;
    already_imported: boolean;
    error?: string;
}

export type ShareCodeType = 'Enquiry' | 'Admission';

export type ShareCodeStatus = 'Active' | 'Expired' | 'Revoked' | 'Redeemed';

export interface ShareCode {
    id: number;
    code: string;
    status: ShareCodeStatus;
    applicant_name: string;
    expires_at: string;
    created_at?: string;
    code_type: ShareCodeType;
}

export interface TimetableEntry {
    id: string;
    day: Day;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
    room: string;
    isConflict?: boolean;
    class_name?: string;
}

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type TimeSlot = string;

export type FunctionComponentWithIcon<P = {}> = React.FC<P> & { Icon: any };

export interface StudentRosterItem {
    id: string;
    display_name: string;
    roll_number?: string;
    grade: string;
    gender?: string;
}

export interface AttendanceRecord {
    id?: number;
    student_id: string;
    status: AttendanceStatus;
    notes?: string;
    recorded_by?: string;
    attendance_date: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface FinanceData {
    revenue_ytd: number;
    collections_this_month: number;
    pending_dues: number;
    online_payments: number;
}

export interface FeeStructure {
    id: number;
    name: string;
    academic_year: string;
    target_grade: string;
    description: string;
    currency: string;
    status: string;
    is_active: boolean;
    branch_id: number;
    components?: any[];
}

export interface StudentFeeSummary {
    student_id: string;
    display_name: string;
    class_name: string;
    total_billed: number;
    total_paid: number;
    outstanding_balance: number;
    overall_status: 'Paid' | 'Pending' | 'Overdue';
}

export interface AdminAnalyticsStats {
    total_users: number;
    total_applications: number;
    pending_applications: number;
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

export interface ExpenseDashboardData {
    total_expenses_month: number;
    pending_approvals: number;
    recent_expenses: Expense[];
}

export interface Expense {
    id: number;
    category: string;
    amount: number;
    vendor_name: string;
    expense_date: string;
    description: string;
    status: string;
    invoice_url?: string;
}

export interface FeeCollectionReportItem {
    [key: string]: any;
}

export interface ExpenseReportItem {
    [key: string]: any;
}

export interface StudentLedgerEntry {
    [key: string]: any;
}

export interface StudentFinanceDetails {
    invoices: StudentInvoice[];
    payments: Payment[];
}

export interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    receipt_number: string;
}

export interface TransportDashboardData {
    route: BusRoute;
    students: BusStudent[];
}

export interface BusRoute {
    id: number;
    name: string;
    description: string;
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

export type BusTripType = 'Morning Pickup' | 'Afternoon Drop-off';

export type BusAttendanceStatus = 'Boarded' | 'Absent';

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

export interface ClassSubject {
    id: number;
    name: string;
}

export interface LessonPlan {
    id: number;
    title: string;
    subject_name: string;
    objectives: string;
    activities: string;
    lesson_date: string;
    resources: any[];
}

export interface ClassPerformanceSummary {
    average_grade: number;
    attendance_rate: number;
}

export interface StudentPerformanceReport {
    attendance_summary: { present: number; absent: number; late: number };
    assignments: any[];
}

export interface ProfileData {
    [key: string]: any;
}

export interface CourseModule {
    id: number;
    course_id: number;
    title: string;
    order_index: number;
}
