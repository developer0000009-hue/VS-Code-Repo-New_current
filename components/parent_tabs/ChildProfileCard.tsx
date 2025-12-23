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
    'Pending Review': { label: 'Awaiting Review', text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: <ClockIcon className="w-3.5 h-3.5" />, progress: 40, color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500' },
    'Documents Requested': { label: 'Action: Upload Docs', text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: <DocumentTextIcon className="w-3.5 h-3.5" />, progress: 60, color: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-500' },
    'Approved': { label: 'Enrolled Student', text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: <CheckCircleIcon className="w-3.5 h-3.5" />, progress: 100, color: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500' },
    'Rejected': { label: 'Application Denied', text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: <XCircleIcon className="w-3.5 h-3.5" />, progress: 100, color: 'bg-red-500', gradient: 'from-red-500 to-pink-500' },
    'Payment Pending': { label: 'Finance: Due', text: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: <FinanceIcon className="w-3.5 h-3.5" />, progress: 80, color: 'bg-purple-500', gradient: 'from-purple-500 to-violet-500' },
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
            flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all duration-300 text-left group w-full relative overflow-hidden
            ${disabled 
                ? 'border-transparent bg-muted/30 opacity-50 cursor-not-allowed' 
                : 'border-border/40 bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer'
            }
        `}
    >
        {!disabled && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
        <div className={`p-3.5 rounded-xl ${disabled ? 'bg-muted text-muted-foreground' : colorClass} transition-transform duration-300 group-hover:scale-110 shadow-sm border border-transparent group-hover:border-current/10`}>
            {icon}
        </div>
        <div className="relative z-10 flex-grow min-w-0">
            <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors truncate uppercase tracking-wide">{label}</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-1 group-hover:text-muted-foreground/80 font-medium">{description}</p>
        </div>
        <ChevronRightIcon className={`w-4 h-4 text-muted-foreground/40 ml-auto transition-transform duration-300 ${disabled ? '' : 'group-hover:translate-x-1 group-hover:text-primary group-hover:opacity-100'}`} />
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
            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-sm ${current.border} ${current.bg}`}>
                {current.icon}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest mt-2.5 text-center transition-colors ${current.text}`}>
                {label}
            </span>
        </div>
    );
};

const DocStatusRow: React.FC<{ name: string; status: string }> = ({ name, status }) => {
    const styles: Record<string, string> = {
        'Accepted': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
        'Verified': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
        'Submitted': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        'Pending': 'bg-muted text-muted-foreground border-border',
        'Rejected': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    };
    const icons: Record<string, React.ReactNode> = {
        'Accepted': <CheckCircleIcon className="w-3.5 h-3.5"/>,
        'Verified': <CheckCircleIcon className="w-3.5 h-3.5"/>,
        'Submitted': <ClockIcon className="w-3.5 h-3.5"/>,
        'Pending': <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-pulse"/>,
        'Rejected': <XCircleIcon className="w-3.5 h-3.5"/>,
    };
    
    const safeStatus = typeof status === 'string' ? status : 'Pending';
    const displayStatus = (safeStatus === 'Accepted' || safeStatus === 'Verified') ? 'Verified' : safeStatus === 'Submitted' ? 'In Review' : safeStatus;

    return (
        <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-transparent hover:bg-muted/30 transition-all group/row">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${safeStatus === 'Rejected' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-muted text-muted-foreground'} transition-colors group-hover/row:bg-primary/10 group-hover/row:text-primary`}>
                    <DocumentTextIcon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold transition-colors ${safeStatus === 'Rejected' ? 'text-red-600' : 'text-foreground/80 group-hover/row:text-foreground'}`}>{name}</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-sm ${styles[safeStatus] || styles['Pending']}`}>
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
                         const attRecords = attRes.data || [];
                         if (attRecords.length > 0) {
                             const present = attRecords.filter((r: any) => r.status === 'Present').length;
                             setAttendanceStats({ rate: Math.round((present / attRecords.length) * 100) });
                         }

                         const invoices = feeRes.data || [];
                         const due = invoices.reduce((acc: number, inv: any) => acc + (inv.amount - (inv.amount_paid || 0)), 0);
                         setFeeStats({ due });
                    }
                }
            } catch (err) {
                console.error("Profile detail sync error:", err);
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
        if (documents.every(d => d.status === 'Accepted' || d.status === 'Submitted' || d.status === 'Verified')) return 'complete';
        return 'current'; 
    }, [documents]);

    const steps: { label: string; status: StepStatus }[] = useMemo(() => [
        { label: 'Application', status: 'complete' },
        { label: 'Documentation', status: docsStatus },
        { label: 'Compliance', status: isApproved || child.status === 'Payment Pending' ? 'complete' : (docsStatus === 'complete' ? 'current' : 'pending') },
        { label: 'Finances', status: isApproved ? 'complete' : (child.status === 'Payment Pending' ? 'current' : 'pending') },
        { label: 'Admission', status: isApproved ? 'complete' : 'pending' },
    ], [docsStatus, isApproved, child.status]);

    const completionPercentage = useMemo(() => {
        if (isApproved) return 100;
        let p = 20; 
        if (docsStatus === 'complete') p += 20;
        if (child.status === 'Payment Pending') p += 40;
        if (child.status === 'Documents Requested' && docsStatus !== 'complete') p = 30;
        return p;
    }, [isApproved, docsStatus, child.status]);

    const displayDocs = useMemo(() => {
        const important = ['Birth Certificate', 'Student Photograph', 'Address Proof'];
        const relevantDocs = documents.filter(d => important.includes(d.document_name));
        if (documents.length === 0 && !loadingDetails && !isApproved) {
             return important.map(name => ({ document_name: name, status: 'Pending' }));
        }
        return relevantDocs.length > 0 ? relevantDocs : documents.slice(0, 3);
    }, [documents, loadingDetails, isApproved]);

    return (
        <div 
            className={`
                group relative bg-card border rounded-[2.5rem] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col overflow-hidden
                ${isExpanded 
                    ? 'border-primary/30 shadow-2xl ring-4 ring-primary/5 z-10 transform scale-[1.01]' 
                    : 'border-border shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1'
                }
            `}
        >
            <div className={`h-1.5 w-full transition-opacity duration-300 bg-gradient-to-r ${config.gradient} ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>

            <div 
                className="p-8 cursor-pointer relative z-10"
                onClick={onToggleExpand}
            >
                <div className="flex items-start gap-8">
                    <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-[1.8rem] border-2 border-background shadow-lg overflow-hidden bg-muted flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out ring-1 ring-black/10 dark:ring-white/10">
                            {child.profile_photo_url ? (
                                <img src={child.profile_photo_url} alt={child.applicant_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white text-3xl font-black`}>
                                    {(child.applicant_name || '?').charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className={`absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl border-[3.5px] border-card flex items-center justify-center bg-card shadow-lg ${config.text} z-10 transition-transform group-hover:scale-110`}>
                            {config.icon}
                        </div>
                    </div>

                    <div className="flex-grow min-w-0 pt-1">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-black text-foreground truncate leading-tight group-hover:text-primary transition-colors tracking-tight uppercase font-serif">
                                {child.applicant_name}
                            </h3>
                            <div className={`text-muted-foreground/30 group-hover:text-primary p-2 rounded-full hover:bg-primary/5 transition-all duration-500 ${isExpanded ? 'rotate-180 text-primary' : ''}`}>
                                <ChevronDownIcon className="w-6 h-6" />
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground font-bold mb-4">
                            <span className="flex items-center gap-2 bg-muted/40 px-3 py-1 rounded-lg border border-border/50 uppercase tracking-widest">
                                <SchoolIcon className="w-4 h-4 opacity-50"/> Grade {child.grade}
                            </span>
                            <span className="flex items-center gap-2 bg-muted/40 px-3 py-1 rounded-lg border border-border/50">
                                <span className="font-mono opacity-60 tracking-wider">ID: {child.application_number || `#${child.id}`}</span>
                            </span>
                        </div>

                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border shadow-md ${config.bg} ${config.text} ${config.border}`}>
                            <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]`}></span>
                            {config.label}
                        </div>
                    </div>
                </div>

                <div className={`mt-10 transition-all duration-700 ease-in-out ${isExpanded ? 'opacity-0 h-0 overflow-hidden mt-0' : 'opacity-100'}`}>
                    <div className="flex justify-between items-end mb-2.5 px-1">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Institutional Progress</span>
                        <span className="text-[10px] font-black text-foreground tracking-widest">{completionPercentage}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner border border-border/10">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${config.gradient} shadow-[0_0_10px_rgba(var(--primary),0.2)]`} 
                            style={{ width: `${completionPercentage}%` }}
                        ></div>
                    </div>
                </div>

                <div className={`mt-8 pt-6 border-t border-border/40 grid grid-cols-5 gap-3 transition-all duration-500 ${isExpanded ? 'opacity-0 h-0 overflow-hidden mt-0 pt-0 border-none' : 'opacity-100'}`}>
                    <QuickActionIcon icon={<DocumentTextIcon className="w-6 h-6"/>} label="Docs" onClick={onManageDocuments} alert={docsStatus === 'missing' || child.status === 'Documents Requested'} />
                    <QuickActionIcon icon={<SchoolIcon className="w-6 h-6"/>} label="Academia" onClick={onNavigateDashboard} disabled={!isApproved} />
                    <QuickActionIcon icon={<BarChartIcon className="w-6 h-6"/>} label="Performance" onClick={onNavigateDashboard} disabled={!isApproved} />
                    <QuickActionIcon icon={<ChecklistIcon className="w-6 h-6"/>} label="Attendance" onClick={onNavigateDashboard} disabled={!isApproved} />
                    <QuickActionIcon icon={<FinanceIcon className="w-6 h-6"/>} label="Payments" onClick={onNavigateDashboard} disabled={!isApproved} />
                </div>
            </div>

            <div 
                className={`
                    bg-muted/5 border-t border-border/60 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                    ${isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="p-10 space-y-10">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                        
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-card rounded-[2rem] border border-border p-6 shadow-sm relative overflow-hidden ring-1 ring-black/5">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
                                     <InfoIcon className="w-24 h-24" />
                                </div>
                                <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4 relative z-10">
                                    <h4 className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.25em] flex items-center gap-2">
                                        <InfoIcon className="w-4 h-4 text-primary"/> Identity Vault
                                    </h4>
                                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-[10px] font-black text-primary hover:bg-primary/10 border border-primary/10 px-4 py-1.5 rounded-xl transition-all active:scale-95 uppercase tracking-widest">
                                        Edit
                                    </button>
                                </div>
                                <div className="space-y-4 text-xs relative z-10">
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground/60 font-bold uppercase tracking-wider">Status</span><span className={`font-black px-3 py-1 rounded-lg text-[9px] uppercase tracking-widest ${config.text} bg-opacity-10 ${config.bg} border ${config.border}`}>{child.status}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground/60 font-bold uppercase tracking-wider">Assigned Campus</span><span className="font-bold text-foreground">{child.branch_name || 'Main Campus'}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground/60 font-bold uppercase tracking-wider">Network Identity</span><span className="font-mono text-[10px] text-foreground bg-muted/50 px-2 py-1 rounded border border-border/50 truncate max-w-[140px] tracking-tight">{child.student_system_email || 'PENDING ALLOCATION'}</span></div>
                                    <div className="flex justify-between items-center pt-3 border-t border-border/30"><span className="text-muted-foreground/60 font-bold uppercase tracking-wider">Last Interaction</span><span className="text-foreground font-black tracking-widest uppercase text-[10px]">{new Date(child.updated_at || child.submitted_at).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                             <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-sm h-full flex flex-col justify-center relative overflow-hidden ring-1 ring-black/5">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                    <CheckCircleIcon className="w-40 h-40" />
                                </div>
                                <div className="mb-10 flex justify-between items-end relative z-10">
                                    <div>
                                        <h4 className="text-xl font-serif font-bold text-foreground">Admission Roadmap</h4>
                                        <p className="text-xs text-muted-foreground mt-1 font-medium">Tracking lifecycle milestones.</p>
                                    </div>
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${config.bg} ${config.text} ${config.border} shadow-sm`}>
                                        {completionPercentage}% Unified
                                    </span>
                                </div>
                                
                                <div className="relative z-10 px-2">
                                    <div className="absolute top-[17px] left-0 w-full h-[2px] bg-muted -z-10 rounded-full"></div>
                                    <div 
                                        className={`absolute top-[17px] left-0 h-[2px] bg-gradient-to-r ${config.gradient} -z-10 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary),0.4)]`} 
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

                    <div>
                        <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div> Fast Pass Actions
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <ExpandedActionButton 
                                icon={<UserIcon className="w-5 h-5"/>} 
                                label="Profile Master" 
                                description="Deep-dive into personal data" 
                                onClick={onEdit} 
                                colorClass="bg-blue-500/10 text-blue-600"
                            />
                            <ExpandedActionButton 
                                icon={<DocumentTextIcon className="w-5 h-5"/>} 
                                label="Verification" 
                                description={documents.length > 0 ? `${documents.length} secure files archived` : "Sync mandatory records"}
                                onClick={onManageDocuments} 
                                colorClass="bg-amber-500/10 text-amber-600"
                            />
                            <ExpandedActionButton 
                                icon={<ChecklistIcon className="w-5 h-5"/>} 
                                label={`Attendance ${attendanceStats ? `${attendanceStats.rate}%` : ''}`} 
                                description={attendanceStats ? "Analyzed engagement log" : "Awaiting activation"}
                                onClick={onNavigateDashboard} 
                                disabled={!isApproved}
                                colorClass="bg-emerald-500/10 text-emerald-600"
                            />
                            <ExpandedActionButton 
                                icon={<BarChartIcon className="w-5 h-5"/>} 
                                label="Performance" 
                                description="Real-time academic telemetry" 
                                onClick={onNavigateDashboard} 
                                disabled={!isApproved}
                                colorClass="bg-purple-500/10 text-purple-600"
                            />
                            <ExpandedActionButton 
                                icon={<SchoolIcon className="w-5 h-5"/>} 
                                label="Academic Unit" 
                                description="Section & Teacher mapping" 
                                onClick={onNavigateDashboard} 
                                colorClass="bg-indigo-500/10 text-indigo-600"
                            />
                             <ExpandedActionButton 
                                icon={<FinanceIcon className="w-6 h-6"/>} 
                                label={`Financials ${feeStats?.due ? `($${feeStats.due})` : ''}`}
                                description={feeStats?.due ? "Action: Secure payment due" : "Settled ledger history"}
                                onClick={onNavigateDashboard} 
                                disabled={!isApproved}
                                colorClass="bg-pink-500/10 text-pink-600"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-6">
                             <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div> Documentation Audit
                            </h4>
                            <button onClick={(e) => { e.stopPropagation(); onManageDocuments(); }} className="text-[10px] font-black text-primary hover:text-white hover:bg-primary px-4 py-2 rounded-xl transition-all border border-primary/20 bg-primary/5 uppercase tracking-widest">
                                Manage Vault &rarr;
                            </button>
                        </div>
                        
                        {loadingDetails ? (
                            <div className="p-12 flex justify-center bg-[#13151b] rounded-[2rem] border border-white/5 shadow-inner"><Spinner size="md" className="text-white/20"/></div>
                        ) : (
                            <div 
                                className="bg-[#13151b] rounded-[2.5rem] border border-white/5 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-inner cursor-pointer hover:border-white/10 transition-all group/docs relative overflow-hidden"
                                onClick={(e) => { e.stopPropagation(); onManageDocuments(); }}
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-transparent opacity-0 group-hover/docs:opacity-100 transition-opacity"></div>
                                {displayDocs.length > 0 ? (
                                    displayDocs.map((doc: any) => (
                                         <DocStatusRow key={doc.id || doc.document_name} name={doc.document_name} status={doc.status} />
                                    ))
                                ) : (
                                    <p className="col-span-2 text-center text-white/20 text-xs font-bold uppercase tracking-widest py-8">No documentation audit data</p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {isApproved && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onNavigateDashboard(); }}
                            className="w-full py-6 bg-gradient-to-br from-primary via-indigo-600 to-purple-700 hover:from-primary/90 hover:via-indigo-600/90 hover:to-purple-700/90 text-white font-black text-sm rounded-[2rem] shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 group/btn active:scale-95 uppercase tracking-[0.2em]"
                        >
                            Open Student Portal <ChevronRightIcon className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform"/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChildProfileCard;