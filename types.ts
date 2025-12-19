
import React from 'react';

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
    parent_guardian_details?: string;
    address?: string;
    gender?: string;
    date_of_birth?: string;
}

export interface ProfileData {
    [key: string]: any;
}

export interface ParentProfileData extends ProfileData {
    relationship_to_student: string;
    gender?: string;
    number_of_children?: number;
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

export interface StudentProfileData extends ProfileData {
    grade: string;
    date_of_birth?: string;
    gender?: string;
    parent_guardian_details?: string;
    roll_number?: string;
    student_id_number?: string;
    address?: string;
}

export interface TeacherProfileData extends ProfileData {
    subject: string;
    qualification: string;
    experience_years: number;
    date_of_joining: string;
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

export interface SchoolAdminProfileData {
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
    academic_board?: string;
    affiliation_number?: string;
    school_type?: string;
    academic_year_start?: string;
    academic_year_end?: string;
    grade_range_start?: string;
    grade_range_end?: string;
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
    email?: string;
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
}

export interface Course {
    id: number;
    title: string;
    code: string;
    description?: string;
    credits: number;
    category: string;
    grade_level: string;
    status: CourseStatus;
    teacher_id?: string;
    teacher_name?: string;
    department?: string;
    modules_count?: number;
    enrolled_count?: number;
    subject_type?: string;
    created_at?: string;
}

export interface AdmissionApplication {
    id: number;
    applicant_name: string;
    grade: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    status: string;
    submitted_at: string;
    student_user_id?: string;
    // Fix: Added missing branch_id property to resolve Property 'branch_id' does not exist error
    branch_id?: number;
    branch_name?: string;
    application_number?: string;
    profile_photo_url?: string;
    date_of_birth?: string;
    gender?: string;
    medical_info?: string;
    emergency_contact?: string;
    student_system_email?: string;
    updated_at?: string;
}

export interface StudentDashboardData {
    profile: UserProfile & { roll_number?: string, student_id_number?: string, grade?: string, parent_guardian_details?: string };
    admission: AdmissionApplication;
    timetable: any[];
    assignments: StudentAssignment[];
    attendanceSummary: { total_days: number, present_days: number, absent_days: number, late_days: number };
    recentGrades: any[];
    announcements: Communication[];
    studyMaterials: StudyMaterial[];
    needs_onboarding: boolean;
    classInfo?: { name: string, teacher_name: string };
}

export interface StudentInvoice {
    id: number;
    amount: number;
    amount_paid: number;
    due_date: string;
    status: InvoiceStatus;
    description: string;
}

export interface StudentInvoiceDetails extends StudentInvoice {
    concession_amount?: number;
}

export interface StudentAttendanceRecord {
    date: string;
    status: AttendanceStatus;
    notes?: string;
}

export interface StudentForAdmin extends UserProfile {
    grade?: string;
    student_id_number?: string;
    parent_guardian_details?: string;
    assigned_class_id?: number;
    assigned_class_name?: string;
    gender?: string;
    date_of_birth?: string;
    address?: string;
    profile_photo_url?: string;
    roll_number?: string;
}

export interface StudentRosterItem {
    id: string;
    display_name: string;
    roll_number?: string;
}

export type AdmissionStatus = string;
export type CourseStatus = 'Active' | 'Inactive' | 'Draft' | 'Archived' | 'Pending';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface AttendanceRecord {
    id?: number;
    student_id: string;
    class_id: number;
    attendance_date: string;
    status: AttendanceStatus;
    notes?: string;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial';

export interface FinanceData {
    revenue_ytd: number;
    collections_this_month: number;
    pending_dues: number;
    overdue_accounts: number;
    online_payments: number;
    refunds_processed: number;
    dues_data?: DuesDashboardData;
    expense_data?: ExpenseDashboardData;
}

export type FeeFrequency = 'One-time' | 'Annually' | 'Quarterly' | 'Monthly';

export interface FeeComponent {
    id: number;
    structure_id: number;
    name: string;
    amount: number;
    frequency: FeeFrequency;
}

export interface FeeStructure {
    id: number;
    name: string;
    description?: string;
    academic_year: string;
    components?: FeeComponent[];
}

export interface StudentFeeSummary {
    student_id: string;
    display_name: string;
    class_name: string;
    total_billed: number;
    total_paid: number;
    outstanding_balance: number;
    overall_status: string;
}

export interface StudentFinanceDetails {
    invoices: StudentInvoiceDetails[];
    payments: Payment[];
}

export interface Payment {
    id: number;
    invoice_id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    receipt_number: string;
}

export interface Refund {
    id: number;
    amount: number;
    refund_date: string;
}

export interface Concession {
    id: number;
    amount: number;
}

export interface AdminAnalyticsStats {
    total_applications: number;
    total_users: number;
    pending_applications: number;
}

export interface Communication {
    id: number;
    sender_name?: string;
    sender_role?: string;
    subject: string;
    body: string;
    sent_at: string;
    status: string;
    recipients: string[];
    target_criteria?: any;
    message_id?: number;
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
    received_at: string;
    notes?: string;
    admission_id?: number;
}

export interface MyEnquiry extends Enquiry {
    last_updated: string;
}

export interface TimelineItem {
    id: number;
    item_type: 'MESSAGE' | 'EVENT';
    is_admin: boolean;
    created_at: string;
    created_by_name: string;
    details: any;
}

export type ShareCodeStatus = 'Active' | 'Expired' | 'Revoked' | 'Redeemed';
export type ShareCodeType = 'Enquiry' | 'Admission';

export interface ShareCode {
    id: number;
    code: string;
    admission_id: number;
    applicant_name: string;
    status: ShareCodeStatus;
    code_type: ShareCodeType;
    expires_at: string;
    created_at?: string;
}

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
    already_imported: boolean;
    error?: string;
}

export interface CourseModule {
    id: number;
    course_id: number;
    title: string;
    order_index: number;
    status?: string;
    duration_hours?: number;
}

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type TimeSlot = string;

export interface TimetableEntry {
    id: string;
    day: Day;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
    room?: string;
    isConflict?: boolean;
    class_name?: string;
}

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
    status: string;
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
}

export interface TeacherClassOverview {
    id: number;
    name: string;
    student_count: number;
}

export interface TeacherClassDetails {
    roster: StudentRosterItem[];
    assignments: any[];
    studyMaterials: StudyMaterial[];
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
    lesson_date: string;
    objectives: string;
    activities: string;
    resources: any[];
}

export interface StudyMaterial {
    id: number;
    subject: string;
    title: string;
    file_name: string;
    file_path: string;
    file_type: string;
    created_at: string;
    is_bookmarked?: boolean;
}

export type SubmissionStatus = 'Not Submitted' | 'Submitted' | 'Late' | 'Graded';

export interface StudentAssignment {
    id: number;
    title: string;
    subject: string;
    description: string;
    due_date: string;
    status: SubmissionStatus;
    submission_grade?: string;
    teacher_feedback?: string;
    file_path?: string;
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

export interface ClassPerformanceSummary {
    average_grade: number;
    attendance_rate: number;
}

export interface StudentPerformanceReport {
    attendance_summary: { present: number, absent: number, late: number };
    assignments: any[];
}

export interface TransportDashboardData {
    route: { id: number, name: string, description: string };
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

export type BusTripType = 'Morning Pickup' | 'Afternoon Drop-off';
export type BusAttendanceStatus = 'Boarded' | 'Absent';

export interface BusRoute {
    id: number;
    name: string;
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
    hod_id?: string;
    hod_name?: string;
    teacher_count?: number;
    course_count?: number;
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
    description: string;
    category: string;
    amount: number;
    expense_date: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    vendor_name?: string;
    invoice_url?: string;
}

export interface FeeCollectionReportItem {
    // defined by RPC response
}

export interface ExpenseReportItem {
    // defined by RPC response
}

export interface StudentLedgerEntry {
    // defined by RPC response
}

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

export type FunctionComponentWithIcon<P = {}> = React.FC<P> & { Icon?: React.FC<React.SVGProps<SVGSVGElement>> };
