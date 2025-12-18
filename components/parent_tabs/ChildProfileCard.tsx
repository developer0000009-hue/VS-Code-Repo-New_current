
import React, { useState, useEffect, useMemo } from 'react';
import { AdmissionApplication, AdmissionStatus, DocumentRequirement } from '../../types';
import { supabase } from '../../services/supabase';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { EditIcon } from '../icons/EditIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { BarChartIcon } from '../icons/BarChartIcon';
import { ChecklistIcon } from '../icons/ChecklistIcon';
import { FinanceIcon } from '../icons/FinanceIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { UserIcon } from '../icons/UserIcon';
import Spinner from '../common/Spinner';

// Configuration for status badges and colors
const statusConfig: { [key: string]: { text: string; bg: string; border: string; icon: React.ReactNode; progress: number; color: string; label: string; gradient: string } } = {
    'Pending Review': { label: 'Pending Setup', text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: <ClockIcon className="w-3.5 h-3.5" />, progress: 40, color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500' },
    'Documents Requested': { label: 'Docs Required', text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: <DocumentTextIcon className="w-3.5 h-3.5" />, progress: 60, color: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-500' },
    'Approved': { label: 'Active Student', text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: <CheckCircleIcon className="w-3.5 h-3.5" />, progress: 100, color: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500' },
    'Rejected': { label: 'Application Rejected', text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: <XCircleIcon className="w-3.5 h-3.5" />, progress: 100, color: 'bg-red-500', gradient: 'from-red-500 to-pink-500' },
    'Payment Pending': { label: 'Payment Pending', text: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: <FinanceIcon className="w-3.5 h-3.5" />, progress: 80, color: 'bg-purple-500', gradient: 'from-purple-500 to-violet-500' },
};

interface ChildProfileCardProps {
    child: AdmissionApplication;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onEdit: () => void;
    onManageDocuments: () => void;
    onNavigateDashboard: () => void;
}

// --- Sub-Components ---

const QuickActionIcon: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    onClick: (e: React.MouseEvent) => void; 
    disabled?: boolean;
    alert?: boolean;
    badge?: string | number;
    badgeColor?: string;
}> = ({ icon, label, onClick, disabled, alert, badge, badgeColor = 'bg-primary' }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(e); }}
        disabled={disabled}
        className={`
            flex flex-col items-center gap-2 group focus:outline-none w-full p-2 rounded-xl transition-all duration-300
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer active:scale-95'}
        `}
    >
        <div className={`
            relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border transition-all duration-300
            ${disabled 
                ? 'bg-muted border-border text-muted-foreground' 
                : 'bg-background border-border/60 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary group-hover:shadow-md group-hover:shadow-primary/5 group-hover:-translate-y-1'
            }
        `}>
            {icon}
            {alert && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background z-10 animate-pulse"></span>}
            {badge && (
                 <span className={`absolute -top-2 -right-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full border-2 border-background z-10 ${badgeColor}`}>
                    {badge}
                 </span>
            )}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{label}</span>
    </button>
);

const ExpandedActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick: (e: React.MouseEvent) => void;
    disabled?: boolean;
    colorClass?: string;
}> = ({ icon, label, description, onClick, disabled, colorClass = "text-primary bg-primary/10" }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(e); }}
        disabled={disabled}
        className={`
            flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 text-left group w-full relative overflow-hidden
            ${disabled 
                ? 'border-transparent bg-muted/30 opacity-50 cursor-not-allowed' 
                : 'border-border/40 bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer'
            }
        `}
    >
        {!disabled && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
        <div className={`p-3 rounded-xl ${disabled ? 'bg-muted text-muted-foreground' : colorClass} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
            {icon}
        </div>
        <div className="relative z-10">
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{label}</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 group-hover:text-muted-foreground/80">{description}</p>
        </div>
        <ChevronRightIcon className={`w-4 h-4 text-muted-foreground ml-auto transition-transform duration-300 ${disabled ? '' : 'group-hover:translate-x-1 group-hover:text-primary'}`} />
    </button>
);

type StepStatus = 'complete' | 'pending' | 'missing' | 'current';

const SetupStep: React.FC<{ label: string; status: StepStatus; index: number }> = ({ label, status, index }) => {
    const styles = {
        complete: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', icon: <CheckCircleIcon className="w-3.5 h-3.5 text-white" /> },
        current: { bg: 'bg-background', border: 'border-blue-500', text: 'text-blue-600 dark:text-blue-400', icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> },
        pending: { bg: 'bg-muted/50', border: 'border-border', text: 'text-muted-foreground', icon: <span className="text-[10px] font-bold text-muted-foreground">{index + 1}</span> },
        missing: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400', icon: <XCircleIcon className="w-3.5 h-3.5 text-red-500" /> }
    };
    const current = styles[status];

    return (
        <div className="flex flex-col items-center relative z-10 flex-1 group">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-sm ${current.border} ${current.bg}`}>
                {current.icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wide mt-2 text-center transition-colors ${current.text}`}>
                {label}
            </span>
        </div>
    );
};

const DocStatusRow: React.FC<{ name: string; status: string }> = ({ name, status }) => {
    const styles: Record<string, string> = {
        'Accepted': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
        'Submitted': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
        'Pending': 'bg-muted text-muted-foreground border-border',
        'Rejected': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    };
    const icons: Record<string, React.ReactNode> = {
        'Accepted': <CheckCircleIcon className="w-3.5 h-3.5"/>,
        'Submitted': <ClockIcon className="w-3.5 h-3.5"/>,
        'Pending': <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"/>,
        'Rejected': <XCircleIcon className="w-3.5 h-3.5"/>,
    };
    
    const safeStatus = typeof status === 'string' ? status : 'Pending';
    const displayStatus = safeStatus === 'Accepted' ? 'Verified' : safeStatus === 'Submitted' ? 'Uploaded' : safeStatus;

    return (
        <div className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-transparent hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-md ${safeStatus === 'Rejected' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-muted text-muted-foreground'} transition-colors`}>
                    <DocumentTextIcon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-xs font-semibold transition-colors ${safeStatus === 'Rejected' ? 'text-red-600' : 'text-foreground/80 group-hover:text-foreground'}`}>{name}</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${styles[safeStatus] || styles['Pending']}`}>
                {icons[safeStatus] || icons['Pending']} {displayStatus}
            </span>
        </div>
    );
};

const ChildProfileCard: React.FC<ChildProfileCardProps> = ({ child, isExpanded, onToggleExpand, onEdit, onManageDocuments, onNavigateDashboard }) => {
    const isApproved = child.status === 'Approved';
    const config = statusConfig[child.status as string] || statusConfig['Pending Review'];
    
    // -- State for Backend Data --
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [documents, setDocuments] = useState<DocumentRequirement[]>([]);
    const [attendanceStats, setAttendanceStats] = useState<{rate: number} | null>(null);
    const [feeStats, setFeeStats] = useState<{due: number} | null>(null);
    
    // -- Logic: Fetch data when expanded --
    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            if (!isExpanded) return;
            setLoadingDetails(true);
            
            try {
                // 1. Fetch Documents (Always relevant)
                const { data: docData } = await supabase
                    .from('document_requirements')
                    .select('*')
                    .eq('admission_id', child.id);
                
                if (isMounted && docData) setDocuments(docData);

                // 2. Fetch Student Dashboard Data (Only if approved student)
                if (child.student_user_id) {
                    const [attRes, feeRes] = await Promise.all([
                        supabase.rpc('get_student_attendance_records', { p_student_id: child.student_user_id }),
                        supabase.rpc('get_student_invoices', { p_student_id: child.student_user_id })
                    ]);
                    
                    if (isMounted) {
                         // Calculate Attendance %
                         const attRecords = attRes.data || [];
                         if (attRecords.length > 0) {
                             const present = attRecords.filter((r: any) => r.status === 'Present').length;
                             setAttendanceStats({ rate: Math.round((present / attRecords.length) * 100) });
                         }

                         // Calculate Pending Fees
                         const invoices = feeRes.data || [];
                         const due = invoices.reduce((acc: number, inv: any) => acc + (inv.amount - (inv.amount_paid || 0)), 0);
                         setFeeStats({ due });
                    }
                }
            } catch (err) {
                console.error("Error fetching child details:", err);
            } finally {
                if (isMounted) setLoadingDetails(false);
            }
        };
        
        fetchData();
        
        return () => { isMounted = false; };
    }, [isExpanded, child.id, child.student_user_id]);

    // -- Computed Status Logic --
    const docsStatus = useMemo((): StepStatus => {
        if (documents.length === 0) return 'current';
        if (documents.some(d => d.status === 'Rejected')) return 'missing';
        if (documents.every(d => d.status === 'Accepted' || d.status === 'Submitted')) return 'complete';
        return 'current'; // Mixed or pending
    }, [documents]);

    // Dynamic Steps
    const steps: { label: string; status: StepStatus }[] = useMemo(() => [
        { label: 'Profile', status: 'complete' },
        { label: 'Parents', status: 'complete' },
        { label: 'Docs', status: docsStatus },
        { label: 'Verify', status: isApproved || child.status === 'Payment Pending' ? 'complete' : (docsStatus === 'complete' ? 'current' : 'pending') },
        { label: 'Fees', status: isApproved ? 'complete' : (child.status === 'Payment Pending' ? 'current' : 'pending') },
    ], [docsStatus, isApproved, child.status]);

    // Determine overall completion %
    const completionPercentage = useMemo(() => {
        if (isApproved) return 100;
        let p = 20; // Profile done
        p += 20; // Parents done
        if (docsStatus === 'complete') p += 20;
        if (child.status === 'Payment Pending') p += 20;
        return p;
    }, [isApproved, docsStatus, child.status]);

    // Documents to display (Priority + Extras)
    const displayDocs = useMemo(() => {
        const important = ['Birth Certificate', 'Student Photograph', 'Address Proof'];
        const relevantDocs = documents.filter(d => important.includes(d.document_name));
        
        // If we don't have real data yet, show placeholders (but marked as loading if fetching)
        if (documents.length === 0 && !loadingDetails && !isApproved) {
             return important.map(name => ({ document_name: name, status: 'Pending' }));
        }
        
        return relevantDocs.length > 0 ? relevantDocs : documents.slice(0, 3);
    }, [documents, loadingDetails, isApproved]);


    return (
        <div 
            className={`
                group relative bg-card border rounded-[2rem] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col overflow-hidden
                ${isExpanded 
                    ? 'border-primary/40 shadow-2xl ring-1 ring-primary/10 z-10 transform scale-[1.01]' 
                    : 'border-border shadow-sm hover:shadow-lg hover:border-primary/30 hover:shadow-primary/5 hover:-translate-y-1'
                }
            `}
        >
            {/* --- Top Status Bar Gradient --- */}
            <div className={`h-1.5 w-full transition-opacity duration-300 bg-gradient-to-r ${config.gradient} ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>

            {/* --- Main Card Content (Always Visible) --- */}
            <div 
                className="p-7 cursor-pointer relative z-10"
                onClick={onToggleExpand}
            >
                <div className="flex items-start gap-6">
                    {/* Avatar with Status Indicator */}
                    <div className="relative flex-shrink-0">
                        <div className="w-[76px] h-[76px] rounded-[1.2rem] border-2 border-background shadow-lg overflow-hidden bg-muted flex items-center justify-center group-hover:scale-105 transition-transform duration-500 ease-out ring-1 ring-black/5 dark:ring-white/5">
                            {child.profile_photo_url ? (
                                <img src={child.profile_photo_url} alt={child.applicant_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white text-2xl font-extrabold`}>
                                    {(child.applicant_name || '?').charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-[3px] border-card flex items-center justify-center bg-card shadow-sm ${config.text} z-10 transition-transform group-hover:scale-110`}>
                            {config.icon}
                        </div>
                    </div>

                    {/* Header Info */}
                    <div className="flex-grow min-w-0 pt-1">
                        <div className="flex justify-between items-start mb-1.5">
                            <h3 className="text-xl font-extrabold text-foreground truncate leading-tight group-hover:text-primary transition-colors tracking-tight">
                                {child.applicant_name}
                            </h3>
                            {/* Expand Toggle Chevron */}
                            <div className={`text-muted-foreground/40 group-hover:text-primary p-1 rounded-full hover:bg-primary/5 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDownIcon className="w-5 h-5" />
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium mb-3">
                            <span className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
                                <SchoolIcon className="w-3.5 h-3.5 opacity-70"/> Grade {child.grade}
                            </span>
                            <span className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
                                <span className="font-mono opacity-80">ID: {child.application_number || `#${child.id}`}</span>
                            </span>
                        </div>

                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${config.bg} ${config.text} ${config.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.color} animate-pulse`}></span>
                            {config.label}
                        </div>
                    </div>
                </div>

                {/* Mini Progress Bar (Visible only when collapsed) */}
                <div className={`mt-7 transition-all duration-500 ease-in-out ${isExpanded ? 'opacity-0 h-0 overflow-hidden mt-0' : 'opacity-100'}`}>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Setup Progress</span>
                        <span className="text-[10px] font-bold text-foreground">{completionPercentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${config.gradient}`} 
                            style={{ width: `${completionPercentage}%` }}
                        ></div>
                    </div>
                </div>

                {/* Quick Actions Row (Visible only when collapsed) */}
                <div className={`mt-6 pt-5 border-t border-border/40 grid grid-cols-5 gap-2 transition-all duration-300 ${isExpanded ? 'opacity-0 h-0 overflow-hidden mt-0 pt-0 border-none' : 'opacity-100'}`}>
                    <QuickActionIcon icon={<DocumentTextIcon className="w-5 h-5"/>} label="Docs" onClick={onManageDocuments} alert={docsStatus === 'missing' || child.status === 'Documents Requested'} />
                    <QuickActionIcon icon={<SchoolIcon className="w-5 h-5"/>} label="Classes" onClick={onNavigateDashboard} disabled={!isApproved} />
                    <QuickActionIcon icon={<BarChartIcon className="w-5 h-5"/>} label="Exams" onClick={onNavigateDashboard} disabled={!isApproved} />
                    <QuickActionIcon icon={<ChecklistIcon className="w-5 h-5"/>} label="Attend" onClick={onNavigateDashboard} disabled={!isApproved} />
                    <QuickActionIcon icon={<FinanceIcon className="w-5 h-5"/>} label="Fees" onClick={onNavigateDashboard} disabled={!isApproved} />
                </div>
            </div>

            {/* --- Expanded View Panel --- */}
            <div 
                className={`
                    bg-muted/5 border-t border-border/60 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                    ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="p-7 space-y-8">
                    
                    {/* A. Quick Child Summary & Setup Progress */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        
                        {/* Left: Summary & Key Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                                    <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                        <InfoIcon className="w-4 h-4 text-primary"/> Profile Details
                                    </h4>
                                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-[10px] font-bold bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg transition-colors">
                                        Edit
                                    </button>
                                </div>
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Enrollment Status</span>
                                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${config.text} bg-opacity-10 ${config.bg}`}>{child.status}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Campus</span>
                                        <span className="font-semibold text-foreground">{child.branch_name || 'Main Branch'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">System Email</span>
                                        <span className="font-mono text-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 truncate max-w-[150px]" title={child.student_system_email || ''}>
                                            {child.student_system_email || 'Pending Allocation'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-border/50">
                                        <span className="text-muted-foreground font-medium">Last Updated</span>
                                        <span className="text-foreground font-mono">{new Date(child.updated_at || child.submitted_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Progress Stepper */}
                        <div className="lg:col-span-3">
                             <div className="bg-card rounded-2xl border border-border p-6 shadow-sm h-full flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                                    <CheckCircleIcon className="w-32 h-32" />
                                </div>
                                <div className="mb-6 flex justify-between items-end relative z-10">
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">Setup Roadmap</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Complete these steps to finalize enrollment.</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
                                        {completionPercentage}% Complete
                                    </span>
                                </div>
                                
                                <div className="relative z-10 px-2">
                                    {/* Connector Line */}
                                    <div className="absolute top-4 left-0 w-full h-0.5 bg-muted -z-10 rounded-full"></div>
                                    <div 
                                        className={`absolute top-4 left-0 h-0.5 bg-gradient-to-r ${config.gradient} -z-10 rounded-full transition-all duration-1000`} 
                                        style={{ width: `${completionPercentage}%` }}
                                    ></div>

                                    <div className="flex justify-between relative z-10 w-full">
                                        {steps.map((step, idx) => (
                                            <SetupStep key={idx} label={step.label} status={step.status} index={idx} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* B. Action Buttons Grid */}
                    <div>
                        <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Quick Access</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <ExpandedActionButton 
                                icon={<UserIcon className="w-5 h-5"/>} 
                                label="Full Profile" 
                                description="View and edit personal details" 
                                onClick={onEdit} 
                                colorClass="bg-blue-500/10 text-blue-600"
                            />
                            <ExpandedActionButton 
                                icon={<DocumentTextIcon className="w-5 h-5"/>} 
                                label="Documents" 
                                description={documents.length > 0 ? `${documents.length} files stored` : "Manage required files"}
                                onClick={onManageDocuments} 
                                colorClass="bg-amber-500/10 text-amber-600"
                            />
                            <ExpandedActionButton 
                                icon={<ChecklistIcon className="w-5 h-5"/>} 
                                label={`Attendance ${attendanceStats ? `(${attendanceStats.rate}%)` : ''}`} 
                                description={attendanceStats ? "View detailed logs" : "Check daily logs"}
                                onClick={onNavigateDashboard} 
                                disabled={!isApproved}
                                colorClass="bg-emerald-500/10 text-emerald-600"
                            />
                            <ExpandedActionButton 
                                icon={<BarChartIcon className="w-5 h-5"/>} 
                                label="Exams & Results" 
                                description="View academic performance" 
                                onClick={onNavigateDashboard} 
                                disabled={!isApproved}
                                colorClass="bg-purple-500/10 text-purple-600"
                            />
                            <ExpandedActionButton 
                                icon={<SchoolIcon className="w-5 h-5"/>} 
                                label="School Info" 
                                description="Campus news & rules" 
                                onClick={onNavigateDashboard} 
                                colorClass="bg-indigo-500/10 text-indigo-600"
                            />
                             <ExpandedActionButton 
                                icon={<FinanceIcon className="w-5 h-5"/>} 
                                label={`Fees ${feeStats?.due ? `($${feeStats.due})` : ''}`}
                                description={feeStats?.due ? "Payment due" : "View invoices and pay"}
                                onClick={onNavigateDashboard} 
                                disabled={!isApproved}
                                colorClass="bg-pink-500/10 text-pink-600"
                            />
                        </div>
                    </div>

                    {/* C. Document Status Preview */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                             <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Document Status Preview
                            </h4>
                            <button onClick={(e) => { e.stopPropagation(); onManageDocuments(); }} className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                                View Repository <ChevronRightIcon className="w-3 h-3"/>
                            </button>
                        </div>
                        
                        {loadingDetails ? (
                            <div className="p-8 flex justify-center bg-card rounded-2xl border border-border"><Spinner size="sm"/></div>
                        ) : (
                            <div 
                                className="bg-card rounded-2xl border border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-sm cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group/docs relative overflow-hidden"
                                onClick={(e) => { e.stopPropagation(); onManageDocuments(); }}
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent opacity-0 group-hover/docs:opacity-100 transition-opacity"></div>
                                {displayDocs.length > 0 ? (
                                    displayDocs.map((doc: any) => (
                                         <DocStatusRow key={doc.id || doc.document_name} name={doc.document_name} status={doc.status} />
                                    ))
                                ) : (
                                    <p className="col-span-2 text-center text-muted-foreground text-sm py-4">No document requirements found.</p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {isApproved && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onNavigateDashboard(); }}
                            className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
                        >
                            Access Student Dashboard <ChevronRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChildProfileCard;
