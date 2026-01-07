import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { Enquiry, TimelineItem, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { MailIcon } from './icons/MailIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EditIcon } from './icons/EditIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const STATUS_CONFIG: Record<string, {
    label: string;
    color: string;
    bg: string;
    progress: number;
    nextAction: string;
    canConvert: boolean;
}> = {
    'New': {
        label: 'New Enquiry',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200',
        progress: 10,
        nextAction: 'Contact parent and verify details',
        canConvert: false
    },
    'ENQUIRY_ACTIVE': {
        label: 'Active',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200',
        progress: 25,
        nextAction: 'Verify parent contact information',
        canConvert: false
    },
    'ENQUIRY_VERIFIED': {
        label: 'Verified',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 60,
        nextAction: 'Request required documents',
        canConvert: true
    },
    'VERIFIED': {
        label: 'Verified',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 60,
        nextAction: 'Request required documents',
        canConvert: true
    },
    'ENQUIRY_IN_PROGRESS': {
        label: 'In Progress',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        progress: 80,
        nextAction: 'Review submitted documents',
        canConvert: true
    },
    'IN_REVIEW': {
        label: 'In Review',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        progress: 80,
        nextAction: 'Review submitted documents',
        canConvert: true
    },
    'CONVERTED': {
        label: 'Converted',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 100,
        nextAction: 'Admission process complete',
        canConvert: false
    },
    'Completed': {
        label: 'Completed',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        progress: 100,
        nextAction: 'Admission process complete',
        canConvert: false
    },
};

const PROGRESS_STEPS = [
    { label: 'Enquiry Created', status: 'completed' },
    { label: 'Contact Verified', status: 'pending' },
    { label: 'Documents Requested', status: 'pending' },
    { label: 'Review Complete', status: 'pending' },
    { label: 'Ready for Admission', status: 'pending' }
];

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    currentBranchId?: string | null;
    onNavigate?: (component: string) => void;
}

// Helper Components
const SkeletonLoader: React.FC<{ className?: string }> = ({ className = "h-4 w-32" }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const EditableField: React.FC<{
    label: string;
    value: string;
    onSave: (value: string) => void;
    required?: boolean;
    missing?: boolean;
}> = ({ label, value, onSave, required, missing }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    return (
        <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-300" style={{fontFamily: 'Inter, sans-serif'}}>{label}</label>
            {isEditing ? (
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm text-white placeholder-gray-400 transition-all duration-200"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                    />
                    <button
                        onClick={handleSave}
                        className="p-3 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all duration-200"
                        style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
                    >
                        <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-3 text-gray-400 hover:bg-gray-600/50 rounded-xl transition-all duration-200"
                        style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    className={`flex items-center justify-between p-4 bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-600/30 transition-all duration-200 border-2 ${
                        missing ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-600'
                    }`}
                    onClick={() => setIsEditing(true)}
                    style={{boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'}}
                >
                    <span className={`text-sm ${!value ? 'text-gray-400 italic' : 'text-white font-medium'}`}>
                        {value || 'Not provided'}
                        {required && !value && <span className="text-red-400 ml-2">*</span>}
                    </span>
                    <EditIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}
        </div>
    );
};

const SummaryChip: React.FC<{
    label: string;
    value: string;
    icon?: React.ReactNode;
    color?: string;
}> = ({ label, value, icon, color = 'text-gray-300' }) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-600/30" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
        {icon && <div className="text-gray-400">{icon}</div>}
        <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</div>
            <div className={`text-sm font-semibold ${color}`}>{value}</div>
        </div>
    </div>
);

const TimelineStep: React.FC<{
    step: typeof PROGRESS_STEPS[0];
    isCompleted: boolean;
    isCurrent: boolean;
    isLast: boolean;
}> = ({ step, isCompleted, isCurrent, isLast }) => (
    <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' :
                isCurrent ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 text-white shadow-lg' :
                'bg-gray-700 border-gray-600 text-gray-400'
            }`} style={{boxShadow: isCompleted || isCurrent ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'}}>
                {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                ) : (
                    <span className="text-sm font-bold">
                        {isCurrent ? '●' : '○'}
                    </span>
                )}
            </div>
            {!isLast && (
                <div className={`w-0.5 h-16 mt-3 rounded-full ${
                    isCompleted ? 'bg-emerald-500' : 'bg-gray-600'
                }`} />
            )}
        </div>
        <div className="pb-8">
            <div className={`text-base font-semibold ${
                isCompleted ? 'text-emerald-400' :
                isCurrent ? 'text-purple-300' :
                'text-gray-400'
            }`} style={{fontFamily: 'Inter, sans-serif'}}>
                {step.label}
            </div>
            {isCurrent && (
                <div className="text-sm text-purple-400 mt-2 font-medium">Current step</div>
            )}
        </div>
    </div>
);

const MessageBubble: React.FC<{
    message: string;
    isAdmin: boolean;
    timestamp: string;
    sender: string;
}> = ({ message, isAdmin, timestamp, sender }) => (
    <div className={`flex gap-4 ${isAdmin ? 'justify-end' : 'justify-start'} mb-6`}>
        {!isAdmin && (
            <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg">
                {sender.charAt(0)}
            </div>
        )}
        <div className={`max-w-[75%] ${isAdmin ? 'order-first' : ''}`}>
            <div className={`p-4 rounded-2xl shadow-lg ${
                isAdmin ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'bg-gray-800/70 backdrop-blur-sm border border-gray-600 text-gray-100'
            }`} style={{boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                <p className="text-sm leading-relaxed">{message}</p>
            </div>
            <div className={`text-xs text-gray-500 mt-2 ${isAdmin ? 'text-right' : 'text-left'}`}>
                {sender} • {timestamp}
            </div>
        </div>
        {isAdmin && (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg">
                {sender.charAt(0)}
            </div>
        )}
    </div>
);

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({
    enquiry,
    onClose,
    onUpdate,
    onNavigate
}) => {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [formData, setFormData] = useState({
        applicant_name: enquiry.applicant_name || '',
        parent_name: enquiry.parent_name || '',
        parent_email: enquiry.parent_email || '',
        parent_phone: enquiry.parent_phone || '',
        notes: enquiry.notes || '',
    });
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({
        timeline: true,
        saving: false,
        converting: false,
        sending: false
    });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'communication'>('overview');
    const commsEndRef = useRef<HTMLDivElement>(null);

    // Calculate derived data
    const daysActive = Math.floor((new Date().getTime() - new Date(enquiry.received_at || enquiry.updated_at).getTime()) / (1000 * 3600 * 24));
    const priorityLevel = daysActive > 7 ? 'High' : daysActive > 3 ? 'Medium' : 'Low';
    const priorityColor = priorityLevel === 'High' ? 'text-red-600' :
                         priorityLevel === 'Medium' ? 'text-amber-600' : 'text-green-600';
    const currentStatus = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG['New'];
    const lastActivity = timeline.length > 0 ? timeline[0].created_at : enquiry.updated_at;

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: enquiry.id });
            if (error) throw error;
            setTimeline(data || []);
        } catch (err) {
            console.error("Timeline fetch error:", err);
            setError("Failed to load timeline. Please refresh the page.");
        } finally {
            if (!isSilent) setLoading(prev => ({ ...prev, timeline: false }));
        }
    }, [enquiry.id]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    useEffect(() => {
        if (commsEndRef.current && activeTab === 'communication') {
            commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [timeline, activeTab]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleSaveField = async (field: string, value: string) => {
        setLoading(prev => ({ ...prev, saving: true }));
        setError(null);
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ [field]: value, updated_at: new Date().toISOString() })
                .eq('id', enquiry.id);

            if (error) throw error;
            setFormData(prev => ({ ...prev, [field]: value }));
            setSuccessMessage('Information updated successfully');
            onUpdate();
        } catch (err) {
            console.error('Save error:', err);
            setError(`Failed to update ${field.replace('_', ' ')}: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleStatusChange = async (newStatus: EnquiryStatus) => {
        setLoading(prev => ({ ...prev, saving: true }));
        setError(null);
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', enquiry.id);

            if (error) throw error;
            setSuccessMessage('Status updated successfully');
            onUpdate();
            await fetchTimeline(true);
        } catch (err) {
            console.error('Status update error:', err);
            setError(`Failed to update status: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleConvert = async () => {
        if (!currentStatus.canConvert) {
            setError('Cannot convert: enquiry must be verified first');
            return;
        }

        setLoading(prev => ({ ...prev, converting: true }));
        setError(null);
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                setSuccessMessage('Successfully converted to admission');
                onUpdate();
                setTimeout(() => {
                    onClose();
                    onNavigate?.('Admissions');
                }, 1500);
            } else {
                throw new Error(result.message || 'Conversion failed');
            }
        } catch (err: any) {
            console.error('Conversion error:', err);
            setError(`Conversion failed: ${err.message || 'Please try again'}`);
        } finally {
            setLoading(prev => ({ ...prev, converting: false }));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = newMessage.trim();
        if (!msg) return;

        setLoading(prev => ({ ...prev, sending: true }));
        setError(null);
        try {
            const { error } = await supabase.rpc('send_enquiry_message', {
                p_enquiry_id: enquiry.id,
                p_message: msg
            });
            if (error) throw error;
            setNewMessage('');
            setSuccessMessage('Message sent successfully');
            await fetchTimeline(true);
        } catch (err) {
            console.error('Send message error:', err);
            setError(`Failed to send message: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, sending: false }));
        }
    };

    const handleQuickAction = (action: string) => {
        let message = '';
        switch (action) {
            case 'welcome':
                message = `Dear ${formData.parent_name || 'Parent'},

Thank you for your interest in our school! We've received your enquiry for ${formData.applicant_name} in Grade ${enquiry.grade}.

Our admissions team will contact you shortly to discuss next steps.

Best regards,
Admissions Team`;
                break;
            case 'documents':
                message = `Dear ${formData.parent_name || 'Parent'},

To proceed with ${formData.applicant_name}'s admission process, please provide the following documents:

• Birth Certificate
• Address Proof
• Previous School Records
• Medical Certificate (if applicable)

You can upload these documents securely through your Parent Portal.

Best regards,
Admissions Team`;
                break;
        }
        setNewMessage(message);
        setActiveTab('communication');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-gray-700" style={{boxShadow: '0 8px 32px rgba(0,0,0,0.3)'}}>

                {/* Success/Error Messages */}
                {(successMessage || error) && (
                    <div className={`px-8 py-4 text-sm font-medium border-b ${
                        successMessage ? 'bg-emerald-50/10 text-emerald-300 border-emerald-700/30' :
                        'bg-red-50/10 text-red-300 border-red-700/30'
                    }`}>
                        {successMessage || error}
                    </div>
                )}

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-gray-900 border-b border-gray-700 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={onClose}
                                className="p-3 hover:bg-gray-800 rounded-xl transition-all duration-200"
                                style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
                            >
                                <ChevronLeftIcon className="w-5 h-5 text-gray-300" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg">
                                    {formData.applicant_name.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white" style={{fontFamily: 'Inter, sans-serif'}}>{formData.applicant_name}</h1>
                                    <p className="text-sm text-gray-300" style={{fontFamily: 'Inter, sans-serif'}}>Grade {enquiry.grade} • Enquiry #{enquiry.id.toString().slice(-6)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            {/* Status Badge */}
                            <div className={`px-4 py-2 rounded-xl text-sm font-semibold border backdrop-blur-sm ${
                                enquiry.status === 'CONVERTED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                                enquiry.status === 'ENQUIRY_VERIFIED' || enquiry.status === 'VERIFIED' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                                'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}>
                                {currentStatus.label}
                            </div>

                            {/* Progress Bar */}
                            <div className="flex items-center gap-3 min-w-[140px]">
                                <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden" style={{boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'}}>
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 rounded-full"
                                        style={{ width: `${currentStatus.progress}%`, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                                    />
                                </div>
                                <span className="text-sm font-semibold text-gray-300 min-w-[40px]" style={{fontFamily: 'Inter, sans-serif'}}>
                                    {currentStatus.progress}%
                                </span>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-3 hover:bg-gray-800 rounded-xl transition-all duration-200"
                                style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
                            >
                                <XIcon className="w-5 h-5 text-gray-300" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* At-a-Glance Summary */}
                <div className="bg-gray-800/50 border-b border-gray-700 px-8 py-6">
                    <div className="flex items-center gap-6">
                        <SummaryChip
                            label="Priority"
                            value={priorityLevel}
                            icon={<AlertTriangleIcon className="w-4 h-4" />}
                            color={priorityLevel === 'High' ? 'text-red-400' : priorityLevel === 'Medium' ? 'text-amber-400' : 'text-green-400'}
                        />
                        <SummaryChip
                            label="Days Active"
                            value={daysActive.toString()}
                            icon={<ClockIcon className="w-4 h-4" />}
                        />
                        <SummaryChip
                            label="Enquiry Source"
                            value={enquiry.admission_id ? 'Parent Portal' : 'Direct Enquiry'}
                            icon={<DocumentTextIcon className="w-4 h-4" />}
                        />
                        <SummaryChip
                            label="Last Activity"
                            value={new Date(lastActivity).toLocaleDateString()}
                            icon={<CalendarIcon className="w-4 h-4" />}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-80 bg-gray-800/70 backdrop-blur-sm border-r border-gray-700 flex flex-col">
                        {/* Timeline */}
                        <div className="flex-1 p-8">
                            <h2 className="text-xl font-bold text-white mb-8" style={{fontFamily: 'Inter, sans-serif'}}>Progress Timeline</h2>
                            <div className="space-y-2">
                                {PROGRESS_STEPS.map((step, index) => {
                                    const isCompleted = index < Math.floor(currentStatus.progress / 20);
                                    const isCurrent = index === Math.floor(currentStatus.progress / 20);

                                    return (
                                        <TimelineStep
                                            key={index}
                                            step={step}
                                            isCompleted={isCompleted}
                                            isCurrent={isCurrent}
                                            isLast={index === PROGRESS_STEPS.length - 1}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Next Action */}
                        <div className="p-8 border-t border-gray-700">
                            <h3 className="text-base font-semibold text-white mb-4">Next Action</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">{currentStatus.nextAction}</p>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Tab Navigation */}
                        <div className="bg-gray-800/70 backdrop-blur-sm border-b border-gray-700">
                            <div className="flex">
                                {[
                                    { id: 'overview', label: 'Details' },
                                    { id: 'timeline', label: 'Timeline' },
                                    { id: 'communication', label: 'Messages' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-8 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
                                            activeTab === tab.id
                                                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                                                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                                        }`}
                                        style={{fontFamily: 'Inter, sans-serif'}}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto bg-gray-900">
                            {activeTab === 'overview' ? (
                                <div className="p-8 space-y-8">
                                    {/* Student Details */}
                                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
                                                <AcademicCapIcon className="w-6 h-6 text-purple-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white" style={{fontFamily: 'Inter, sans-serif'}}>Student Information</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <EditableField
                                                label="Full Name"
                                                value={formData.applicant_name}
                                                onSave={(value) => handleSaveField('applicant_name', value)}
                                                required
                                                missing={!formData.applicant_name}
                                            />
                                            <div className="space-y-3">
                                                <label className="text-sm font-semibold text-gray-300" style={{fontFamily: 'Inter, sans-serif'}}>Grade Level</label>
                                                <div className="p-4 bg-gray-700/50 rounded-xl border-2 border-gray-600" style={{boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'}}>
                                                    <span className="text-sm text-white font-semibold">Grade {enquiry.grade}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parent/Guardian Details */}
                                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                                                <UsersIcon className="w-6 h-6 text-green-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white" style={{fontFamily: 'Inter, sans-serif'}}>Parent/Guardian Information</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <EditableField
                                                label="Full Name"
                                                value={formData.parent_name}
                                                onSave={(value) => handleSaveField('parent_name', value)}
                                                required
                                                missing={!formData.parent_name}
                                            />
                                            <EditableField
                                                label="Email Address"
                                                value={formData.parent_email}
                                                onSave={(value) => handleSaveField('parent_email', value)}
                                                missing={!formData.parent_email}
                                            />
                                            <EditableField
                                                label="Phone Number"
                                                value={formData.parent_phone}
                                                onSave={(value) => handleSaveField('parent_phone', value)}
                                                missing={!formData.parent_phone}
                                            />
                                            <div className="space-y-3">
                                                <label className="text-sm font-semibold text-gray-300" style={{fontFamily: 'Inter, sans-serif'}}>Relationship</label>
                                                <div className="p-4 bg-gray-700/50 rounded-xl border-2 border-gray-600" style={{boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'}}>
                                                    <span className="text-sm text-white font-semibold">Parent</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="mt-8 pt-8 border-t border-gray-700">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => window.open(`mailto:${formData.parent_email}`, '_blank')}
                                                    disabled={!formData.parent_email}
                                                    className="flex items-center gap-3 px-6 py-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-xl hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold"
                                                    style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
                                                >
                                                    <MailIcon className="w-4 h-4" />
                                                    Email
                                                </button>
                                                <button
                                                    onClick={() => window.open(`tel:${formData.parent_phone}`, '_blank')}
                                                    disabled={!formData.parent_phone}
                                                    className="flex items-center gap-3 px-6 py-3 bg-green-500/10 border border-green-500/30 text-green-300 rounded-xl hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold"
                                                    style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
                                                >
                                                    <PhoneIcon className="w-4 h-4" />
                                                    Call
                                                </button>
                                                <button
                                                    onClick={() => handleQuickAction('welcome')}
                                                    className="flex items-center gap-3 px-6 py-3 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-500/20 transition-all duration-200 text-sm font-semibold"
                                                    style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
                                                >
                                                    <CommunicationIcon className="w-4 h-4" />
                                                    Message
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Enquiry Source */}
                                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                                                <DocumentTextIcon className="w-6 h-6 text-amber-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white" style={{fontFamily: 'Inter, sans-serif'}}>Enquiry Source</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-sm font-semibold text-gray-300" style={{fontFamily: 'Inter, sans-serif'}}>Source Type</label>
                                                <div className="p-4 bg-gray-700/50 rounded-xl border-2 border-gray-600" style={{boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'}}>
                                                    <span className="text-sm text-white font-semibold">
                                                        {enquiry.admission_id ? 'Parent Portal Registration' : 'Direct School Enquiry'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-sm font-semibold text-gray-300" style={{fontFamily: 'Inter, sans-serif'}}>Created Date</label>
                                                <div className="p-4 bg-gray-700/50 rounded-xl border-2 border-gray-600" style={{boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'}}>
                                                    <span className="text-sm text-white font-semibold">
                                                        {new Date(enquiry.received_at || enquiry.updated_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'timeline' ? (
                                <div className="p-8">
                                    <h2 className="text-2xl font-bold text-white mb-8" style={{fontFamily: 'Inter, sans-serif'}}>Activity Timeline</h2>
                                    {loading.timeline ? (
                                        <div className="space-y-6">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="flex gap-6">
                                                    <SkeletonLoader className="w-10 h-10 rounded-full" />
                                                    <div className="space-y-3 flex-1">
                                                        <SkeletonLoader className="h-5 w-40" />
                                                        <SkeletonLoader className="h-4 w-64" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : timeline.length === 0 ? (
                                        <div className="text-center py-16">
                                            <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                                            <h3 className="text-xl font-semibold text-gray-300 mb-3">No activity yet</h3>
                                            <p className="text-gray-500">Timeline events will appear here</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {timeline.map((item, idx) => (
                                                <div key={idx} className="flex gap-6">
                                                    <div className="w-12 h-12 bg-gray-700/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-600" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                                                        {item.item_type === 'MESSAGE' ? (
                                                            <CommunicationIcon className="w-5 h-5 text-purple-300" />
                                                        ) : (
                                                            <CheckCircleIcon className="w-5 h-5 text-green-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-base font-semibold text-white">
                                                            {item.item_type === 'MESSAGE' ? 'Message sent' : 'Status updated'}
                                                        </div>
                                                        <div className="text-sm text-gray-300 mt-2 leading-relaxed">
                                                            {item.details?.message || item.item_type?.replace(/_/g, ' ')}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-3 font-medium">
                                                            {new Date(item.created_at).toLocaleString()} • {item.created_by_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Communication Tab */
                                <div className="flex flex-col h-full">
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-8">
                                        {loading.timeline ? (
                                            <div className="space-y-6">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="flex gap-6">
                                                        <SkeletonLoader className="w-10 h-10 rounded-full" />
                                                        <div className="space-y-3 flex-1">
                                                            <SkeletonLoader className="h-20 w-full rounded-xl" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : timeline.filter(t => t.item_type === 'MESSAGE').length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center">
                                                <CommunicationIcon className="w-20 h-20 text-gray-400 mb-6" />
                                                <h3 className="text-xl font-semibold text-gray-300 mb-3">No messages yet</h3>
                                                <p className="text-gray-500">Start the conversation with the parent</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {timeline
                                                    .filter(t => t.item_type === 'MESSAGE')
                                                    .map((item, idx) => (
                                                        <MessageBubble
                                                            key={idx}
                                                            message={item.details?.message || ''}
                                                            isAdmin={!item.is_admin}
                                                            timestamp={new Date(item.created_at).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                            sender={item.created_by_name || 'Unknown'}
                                                        />
                                                    ))}
                                                <div ref={commsEndRef} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div className="border-t border-gray-700 bg-gray-800/70 backdrop-blur-sm p-8">
                                        <form onSubmit={handleSendMessage} className="flex gap-6">
                                            <div className="flex-1">
                                                <textarea
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Type your message..."
                                                    className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none text-sm text-white placeholder-gray-400 transition-all duration-200"
                                                    rows={4}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim() || loading.sending}
                                                className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 font-semibold text-sm shadow-lg"
                                                style={{boxShadow: '0 2px 8px rgba(0,0,0,0.2)'}}
                                            >
                                                {loading.sending ? <Spinner size="sm" /> : <LocalSendIcon className="w-4 h-4" />}
                                                Send
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="bg-gray-800/70 backdrop-blur-sm border-t border-gray-700 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <select
                                value={enquiry.status}
                                onChange={(e) => handleStatusChange(e.target.value as EnquiryStatus)}
                                disabled={loading.saving}
                                className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white transition-all duration-200"
                                style={{boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'}}
                            >
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleQuickAction('welcome')}
                                    className="px-6 py-3 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-600/50 hover:border-gray-500 transition-all duration-200 text-sm font-semibold"
                                    style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
                                >
                                    Send Welcome
                                </button>
                                <button
                                    onClick={() => handleQuickAction('documents')}
                                    className="px-6 py-3 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-600/50 hover:border-gray-500 transition-all duration-200 text-sm font-semibold"
                                    style={{boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
                                >
                                    Request Documents
                                </button>
                            </div>
                        </div>

                        {enquiry.status !== 'CONVERTED' && (
                            <button
                                onClick={handleConvert}
                                disabled={loading.converting || !currentStatus.canConvert}
                                className={`px-8 py-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                                    currentStatus.canConvert
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                                style={{boxShadow: currentStatus.canConvert ? '0 4px 16px rgba(0,0,0,0.2)' : 'none'}}
                            >
                                {loading.converting ? (
                                    <div className="flex items-center gap-3">
                                        <Spinner size="sm" />
                                        Converting...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <GraduationCapIcon className="w-5 h-5" />
                                        Convert to Admission
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;
