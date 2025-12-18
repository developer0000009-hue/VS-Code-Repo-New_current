
import React from 'react';

// Roles
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

export interface TimetableEntry {
    id: string;
    class_id?: number;
    day: Day;
    startTime: string;
    endTime: string;
    subject: string;
    teacher?: string; // Optional to support Room/Teacher views where this might be inferred or displayed differently
    room?: string;
    // New Fields for Enhanced Features
    class_name?: string; // For Teacher/Room views
    isConflict?: boolean;
}

export interface BulkImportResult {
    success_count: number;
    failure_count: number;
    errors: {
        row: number;
        name: string;
        error: string;
    }[];
}

// ... [Rest of file] ...
export type FunctionComponentWithIcon<P = {}> = React.FC<P> & { Icon?: React.ComponentType<any> };
export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type TimeSlot = string;

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
    onboarding_step?: string | null;
    email_confirmed_at?: string | null;
}

export interface ProfileData {
    [key: string]: any;
}

export interface SchoolAdminProfileData extends ProfileData {
    school_name: string;
    address: string;
    country: string;
    state: string;
    city: string;
    admin_contact_name: string;
    admin_contact_email: string;
    admin_contact_phone: string;
    admin_designation?: string;
    plan_id?: string;
    onboarding_step?: string;
}

export interface ParentProfileData extends ProfileData {
    relationship_to_student: string;
    gender?: string;
    number_of_children?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pin_code?: string;
    secondary_parent_name?: string;
    secondary_parent_relationship?: string;
    secondary_parent_email?: string;
    secondary_parent_phone?: string;
    secondary_parent_gender?: string;
}

export interface StudentProfileData extends ProfileData {
    applicant_name?: string;
    grade?: string;
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
    employment_status?: string; // Active, On Leave, Resigned, Suspended, Pending Verification
    salary?: string;
    bank_details?: string;
    branch_id?: number;
    workload_limit?: number;
    verification_status?: 'Pending' | 'Verified' | 'Rejected';
}

export interface TeacherDocument {
    id: number;
    teacher_id: string;
    document_name: string;
    document_type: string; // Certificate, ID, Resume
    status: 'Pending' | 'Verified' | 'Rejected';
    file_path: string;
    uploaded_at: string;
    notes?: string;
}

export interface TeacherSubjectMapping {
    id: number;
    teacher_id: string;
    subject_id: number;
    class_id: number;
    academic_year: string;
    class_name?: string;
    subject_name?: string;
}

export interface TransportProfileData extends ProfileData {
    route_id?: number;
    vehicle_details?: string;
    license_info?: string;
}

export interface EcommerceProfileData extends ProfileData {
    store_name?: string;
    business_type?: string;
}

export interface SchoolBranch {
    id: number;
    name: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    is_main_branch: boolean;
    admin_name?: string;
    admin_email?: string;
    admin_phone?: string;
    branch_admin_id?: string;
    contact_number?: string;
    email?: string;
}

export type AdmissionStatus = 'Pending Review' | 'Documents Requested' | 'Approved' | 'Rejected' | 'Payment Pending' | 'Enquiry';

export interface AdmissionApplication {
    id: number;
    applicant_name: string;
    grade: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    status: AdmissionStatus;
    submitted_at: string;
    updated_at?: string;
    submitted_by?: string;
    student_user_id?: string;
    branch_id?: number;
    branch_name?: string;
    date_of_birth?: string;
    gender?: string;
    profile_photo_url?: string;
    medical_info?: string;
    emergency_contact?: string;
    application_number?: string;
    student_system_email?: string;
}

export interface DocumentRequirement {
    id: number;
    admission_id: number;
    document_name: string;
    status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';
    notes_for_parent?: string;
    rejection_reason?: string;
    applicant_name?: string;
}

export interface AdmissionDocument {
    id: number;
    admission_id: number;
    requirement_id?: number;
    file_name: string;
    storage_path: string;
    uploaded_at: string;
}

export type ShareCodeType = 'Enquiry' | 'Admission';
export type ShareCodeStatus = 'Active' | 'Expired' | 'Revoked' | 'Redeemed';

export interface ShareCode {
    id: number;
    code: string;
    admission_id: number;
    generated_by: string;
    created_at: string;
    expires_at: string;
    status: ShareCodeStatus;
    code_type: ShareCodeType;
    purpose?: string;
    applicant_name?: string;
}

export interface VerifiedShareCodeData {
    valid: boolean;
    admission_id: number;
    code_type: ShareCodeType;
    applicant_name: string;
    grade: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    date_of_birth: string;
    gender: string;
    error?: string;
    already_imported?: boolean;
}

export interface SchoolClass {
    id: number;
    name: string;
    grade_level?: string;
    section?: string;
    branch_id?: number;
    academic_year?: string;
    class_teacher_id?: string;
    capacity?: number;
    student_count?: number;
    teacher_name?: string;
    created_at?: string;
}

export interface ClassSubject {
    id: number;
    name: string;
    code?: string;
}

export interface StudentRosterItem {
    id: string; 
    display_name: string;
    roll_number?: string;
    student_id_number?: string;
    parent_guardian_details?: string;
    phone?: string;
    email?: string;
    gender?: string;
    grade?: string;
    is_active?: boolean;
    profile_completed?: boolean;
    created_at?: string;
    assigned_class_name?: string;
    assigned_class_id?: number;
    profile_photo_url?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused' | 'Half-Day';

export interface AttendanceRecord {
    id?: number;
    class_id: number;
    student_id: string;
    attendance_date: string;
    status: string;
    notes?: string;
    recorded_by?: string;
}

export interface StudentAttendanceRecord {
    date: string;
    status: string;
    notes?: string;
}

export interface SchoolProfile {
    school_name: string;
    address: string;
    admin_contact_phone: string;
    admin_contact_email: string;
}

export interface FinanceData {
    revenue_ytd: number;
    collections_this_month: number;
    pending_dues: number;
    overdue_accounts: number;
    online_payments: number;
    refunds_processed: number;
    school_profile: SchoolProfile | null;
    dues_data: DuesDashboardData;
    expense_data: ExpenseDashboardData;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial';

export interface Invoice {
    id: number;
    student_id: string;
    amount: number;
    amount_paid?: number;
    due_date: string;
    status: InvoiceStatus;
    description: string;
    display_name?: string;
    created_at?: string;
}

export interface StudentInvoice {
    id: number;
    amount: number;
    amount_paid: number;
    due_date: string;
    status: InvoiceStatus;
    description: string;
}

export interface FeeStructure {
    id: number;
    name: string;
    description?: string;
    academic_year: string;
    is_template?: boolean;
    components?: FeeComponent[];
}

export type FeeFrequency = 'One-time' | 'Monthly' | 'Quarterly' | 'Annually';

export interface FeeComponent {
    id?: number;
    structure_id?: number;
    name: string;
    amount: number;
    due_date?: string;
    frequency?: FeeFrequency;
    is_optional?: boolean;
    is_refundable?: boolean;
}

export interface StudentFeeSummary {
    student_id: string;
    display_name: string;
    class_name: string | null;
    total_billed: number;
    total_paid: number;
    total_concession: number;
    outstanding_balance: number;
    overall_status: 'No Invoices' | 'Overdue' | 'Pending' | 'Paid';
}

export interface StudentInvoiceDetails extends Invoice {
    concession_amount: number;
    components: FeeComponent[];
    student_name: string;
    parent_name: string;
    class_name: string;
}

export interface Payment {
    id: number;
    invoice_id: number;
    student_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number: string | null;
    receipt_number: string;
    refunded_amount: number;
}

export interface PaymentWithDetails extends Payment {
    payment_id: number;
    invoice_id: number;
    invoice_description: string;
    total_billed: number;
    student_name: string;
    parent_name: string;
}


export interface Concession {
    id: number;
    invoice_id: number;
    amount: number;
    reason: string | null;
    applied_at: string;
}

export interface Refund {
    id: number;
    payment_id: number;
    amount: number;
    reason: string | null;
    refund_date: string;
}

export interface StudentFinanceDetails {
    invoices: StudentInvoiceDetails[];
    payments: Payment[];
    concessions: Concession[];
    refunds: Refund[];
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

export interface DuesDashboardData {
    total_dues: number;
    total_overdue: number;
    overdue_student_count: number;
    highest_dues_students: StudentDuesInfo[];
    dues_by_class: ClassDuesInfo[];
}

export interface Expense {
    id: number;
    category: string;
    amount: number;
    vendor_name: string | null;
    expense_date: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    description: string;
    invoice_url: string | null;
    recorded_by_name: string;
}

export interface Vendor {
    id: number;
    name: string;
    contact_person: string | null;
    contact_email: string | null;
    category: string;
}

export interface ExpenseDashboardData {
    total_expenses_month: number;
    pending_approvals: number;
    recent_expenses: Expense[];
}

export interface FeeCollectionReportItem {
    payment_id: number;
    student_name: string;
    class_name: string;
    invoice_description: string;
    amount: number;
    payment_date: string;
    payment_method: string;
}

export interface ExpenseReportItem {
    expense_id: number;
    category: string;
    vendor_name: string;
    amount: number;
    expense_date: string;
    status: string;
}

export interface StudentLedgerEntry {
    transaction_date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}


export interface TeacherExtended extends UserProfile {
    details?: TeacherProfileData;
    dailyStatus?: string; // For UI display only (e.g. attendance)
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

export interface LessonPlan {
    id: number;
    title: string;
    subject_name: string;
    lesson_date: string;
    objectives: string;
    activities: string;
    resources: { resource_id: number, file_name: string, file_path: string }[];
}

export interface ClassPerformanceSummary {
    average_grade: number;
    attendance_rate: number;
}

export interface StudentPerformanceReport {
    attendance_summary: { present: number, absent: number, late: number };
    assignments: { title: string, due_date: string, grade: string, status: string }[];
}

export interface TeacherProfessionalDevelopmentData {
    total_points: number;
    training_records: { title: string, completed_at: string, points: number }[];
    awards: { award_name: string, awarded_date: string, points: number }[];
}

export interface Workshop {
    id: number;
    title: string;
    description: string;
    workshop_date: string;
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

export interface StudentForAdmin extends StudentRosterItem {
    role: string;
    address?: string;
    date_of_birth?: string;
}

export interface AdminAnalyticsStats {
    total_users: number;
    total_applications: number;
    pending_applications: number;
}

export interface Communication {
    id: number;
    subject: string;
    body: string;
    sender_id: string;
    sender_name?: string;
    sender_role?: string;
    recipients: string[];
    sent_at: string;
    status: 'Sent' | 'Delivered' | 'Failed';
    target_criteria?: any;
}

export type EnquiryStatus = 'New' | 'Contacted' | 'In Review' | 'Completed';

export interface Enquiry {
    id: number;
    applicant_name: string;
    grade: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    status: EnquiryStatus;
    notes?: string;
    received_at: string;
    branch_id?: number;
    admission_id?: number;
}

export interface MyEnquiry extends Enquiry {
    last_updated: string;
}

export interface TimelineItem {
    id: number;
    enquiry_id: number;
    created_by: string;
    created_by_name: string;
    item_type: 'NOTE' | 'STATUS_CHANGE' | 'MESSAGE' | 'SYSTEM' | 'ADMISSION_STATUS_CHANGE' | 'DOCUMENTS_REQUESTED';
    details: any;
    created_at: string;
    is_admin?: boolean;
}

export type CourseStatus = 'Active' | 'Inactive' | 'Archived' | 'Draft' | 'Pending';

export interface Course {
    id: number;
    title: string;
    code: string;
    description?: string;
    credits: number;
    category: string;
    subject_type?: string;
    grade_level: string;
    status: CourseStatus;
    teacher_id?: string;
    teacher_name?: string;
    department?: string;
    syllabus_pdf_url?: string;
    created_at?: string;
    updated_at?: string;
    modules_count?: number;
    enrolled_count?: number;
}

export interface CourseModule {
    id: number;
    course_id: number;
    title: string;
    order_index: number;
    status?: string;
    duration_hours?: number;
}

export type BusTripType = 'Morning Pickup' | 'Afternoon Drop-off';
export type BusAttendanceStatus = 'Boarded' | 'Absent' | 'Dropped' | 'Pending';

export interface BusRoute {
    id: number;
    name: string;
    description?: string;
    vehicle_number?: string;
    driver_name?: string;
    driver_phone?: string;
}

export interface BusStudent {
    id: string;
    display_name: string;
    grade: string;
    parent_guardian_details: string;
    status?: BusAttendanceStatus;
}

export interface BusAttendanceRecord {
    id: number;
    student_id: string;
    route_id: number;
    trip_date: string;
    trip_type: BusTripType;
    status: BusAttendanceStatus;
    recorded_at: string;
}

export interface TransportDashboardData {
    route: BusRoute;
    students: BusStudent[];
}

export interface StudentDashboardData {
    profile: StudentForAdmin;
    classInfo?: { name: string, teacher_name: string };
    attendanceSummary: { total_days: number, present_days: number, absent_days: number, late_days: number };
    assignments: StudentAssignment[];
    timetable: any[];
    announcements: Communication[];
    recentGrades: { subject: string, exam_name: string, grade: string, marks_obtained: number, total_marks: number, remarks?: string }[];
    fees?: StudentInvoice[];
    admission: AdmissionApplication;
    studyMaterials: StudyMaterial[];
    needs_onboarding?: boolean;
}

export type SubmissionStatus = 'Not Submitted' | 'Submitted' | 'Late' | 'Graded';

export interface StudentAssignment {
    id: number;
    title: string;
    subject: string;
    description?: string;
    due_date: string;
    status: SubmissionStatus;
    file_path?: string;
    submission_grade?: string;
    teacher_feedback?: string;
}

export interface StudyMaterial {
    id: number;
    title: string;
    description?: string;
    subject: string;
    file_path: string;
    file_name: string;
    file_type: string;
    uploaded_at: string;
    is_bookmarked?: boolean;
}
