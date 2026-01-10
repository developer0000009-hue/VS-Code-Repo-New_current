import React, { useState, useEffect } from 'react';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { Enquiry, EnquiryStatus, TimelineItem } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { SendIcon } from './icons/SendIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { MailIcon } from './icons/MailIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { UserIcon } from './icons/UserIcon';
import { CameraIcon } from './icons/CameraIcon';
import { ClockIcon } from './icons/ClockIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    onNavigate?: (component: string) => void;
}

type Status = 'NEW' | 'CONTACTED' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'CONVERTED' | 'IN_REVIEW';

const STATUS_CONFIG: Record<Status, {
    color: string;
    bg: string;
    text: string;
    icon: React.ReactNode;
    label: string;
}> = {
    'NEW': {
        color: 'border-gray-300 bg-gray-50',
        bg: 'bg-gray-400',
        text: 'text-gray-700',
        icon: <div className="w-2 h-2 rounded-full bg-gray-400" />,
        label: 'New Enquiry'
    },
    'CONTACTED': {
        color: 'border-purple-300 bg-purple-50',
        bg: 'bg-purple-500',
        text: 'text-purple-700',
        icon: <div className="w-2 h-2 rounded-full bg-purple-500" />,
        label: 'Contacted'
    },
    'VERIFIED': {
        color: 'border-blue-300 bg-blue-50',
        bg: 'bg-blue-500',
        text: 'text-blue-700',
        icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />,
        label: 'Verified'
    },
    'APPROVED': {
        color: 'border-teal-300 bg-teal-50',
        bg: 'bg-teal-500',
        text: 'text-teal-700',
        icon: <CheckCircleIcon className="w-4 h-4 text-teal-500" />,
        label: 'Approved'
    },
    'REJECTED': {
        color: 'border-red-300 bg-red-50',
        bg: 'bg-red-500',
        text: 'text-red-700',
        icon: <XIcon className="w-4 h-4 text-red-500" />,
        label: 'Rejected'
    },
    'IN_REVIEW': {
        color: 'border-orange-300 bg-orange-50',
        bg: 'bg-orange-500',
        text: 'text-orange-700',
        icon: <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />,
        label: 'In Review'
    },
    'CONVERTED': {
        color: 'border-green-300 bg-green-50',
        bg: 'bg-green-500',
        text: 'text-green-700',
        icon: <CheckCircleIcon className="w-4 h-4 text-green-500" />,
        label: 'Converted to Admission'
    }
};

const REJECTION_REASONS = [
    'Not interested',
    'Budget constraints', 
    'Location not suitable',
    'Grade not available',
    'Found another school',
    'Timing not right',
    'Other'
];

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({
    enquiry,
    onClose,
    onUpdate,
    onNavigate
}) => {
    // Debug logging
    console.log('EnquiryDetailsModal rendered with enquiry:', {
        id: enquiry.id,
        status: enquiry.status,
        applicant_name: enquiry.applicant_name,
        hasSource: !!(enquiry as any).source
    });

    const [status, setStatus] = useState<Status>(enquiry.status as Status);
    const [followUpNote, setFollowUpNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [loading, setLoading] = useState({ 
        converting: false, 
        rejecting: false, 
        messaging: false,
        updating: false 
    });
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showConvertConfirm, setShowConvertConfirm] = useState(false);

    // Load timeline data
    useEffect(() => {
        loadTimeline();
    }, [enquiry.id]);

    const loadTimeline = async () => {
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', {
                p_enquiry_id: enquiry.id
            });

            if (error) throw error;

            // Transform the data to match TimelineItem interface with error handling
            const transformedTimeline: TimelineItem[] = (data || []).map((item: any) => {
                try {
                    return {
                        id: item.id || `item-${Date.now()}`,
                        item_type: item.item_type || 'MESSAGE',
                        is_admin: item.is_admin || false,
                        created_by_name: item.created_by_name || 'System',
                        created_at: item.created_at || new Date().toISOString(),
                        details: item.details || { message: 'Status update' }
                    };
                } catch (mappingError) {
                    console.warn('Error mapping timeline item:', mappingError);
                    return {
                        id: `fallback-${Date.now()}`,
                        item_type: 'MESSAGE' as const,
                        is_admin: false,
                        created_by_name: 'System',
                        created_at: new Date().toISOString(),
                        details: { message: 'Timeline event' }
                    };
                }
            });

            setTimeline(transformedTimeline);
        } catch (err) {
            console.error('Failed to load timeline:', err);
            // Set empty timeline on error instead of failing silently
            setTimeline([]);
        }
    };

    const handleCallParent = () => {
        window.open(`tel:${enquiry.parent_phone}`, '_self');
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Hi, this is regarding ${enquiry.applicant_name}'s admission enquiry for Grade ${enquiry.grade}.`);
        window.open(`https://wa.me/${enquiry.parent_phone}?text=${message}`, '_blank');
    };

    const handleSendMessage = async () => {
        if (!followUpNote.trim()) return;
        
        setLoading(prev => ({ ...prev, messaging: true }));
        try {
            const { error } = await supabase
                .from('enquiry_messages')
                .insert({
                    enquiry_id: enquiry.id,
                    message: followUpNote,
                    is_admin_message: true,
                    sender_id: (await supabase.auth.getUser()).data.user?.id
                });
            
            if (error) throw error;
            setFollowUpNote('');
            await loadTimeline(); // Refresh timeline
        } catch (err) {
            alert("Message send failed: " + formatError(err));
        } finally {
            setLoading(prev => ({ ...prev, messaging: false }));
        }
    };

    const handleConvert = () => {
        if (status !== 'VERIFIED' && status !== 'IN_REVIEW') {
            alert('Enquiry must be verified or in review to convert');
            return;
        }
        // Additional check: ensure enquiry has VERIFIED status in database
        if (enquiry.verification_status !== 'VERIFIED') {
            alert('Enquiry must be verified before conversion');
            return;
        }
        setShowConvertConfirm(true);
    };

    const confirmConvert = async () => {
        setShowConvertConfirm(false);
        setLoading(prev => ({ ...prev, converting: true }));
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                setStatus('CONVERTED');
                onUpdate();
                onNavigate?.('Admissions');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(prev => ({ ...prev, converting: false }));
        }
    };

    const handleReject = async () => {
        if (!rejectionReason) {
            alert('Please select a reason for rejection');
            return;
        }

        setLoading(prev => ({ ...prev, rejecting: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ 
                    status: 'REJECTED',
                    notes: `Rejection reason: ${rejectionReason}`,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', enquiry.id);
            
            if (error) throw error;
            setStatus('REJECTED' as Status);
            setShowRejectForm(false);
            setRejectionReason('');
            onUpdate();
        } catch (err) {
            alert(`Rejection failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, rejecting: false }));
        }
    };

    const updateStatus = async (newStatus: Status) => {
        setLoading(prev => ({ ...prev, updating: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', enquiry.id);
            
            if (error) throw error;
            setStatus(newStatus);
        } catch (err) {
            alert(`Status update failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, updating: false }));
        }
    };

    // Calculate days active
    const daysActive = Math.floor(
        (new Date().getTime() - new Date(enquiry.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate progress percentage
    const getProgressPercentage = () => {
        const steps: Status[] = ['NEW', 'CONTACTED', 'VERIFIED', 'APPROVED', 'IN_REVIEW', 'CONVERTED'];
        const currentIndex = steps.indexOf(status);
        return Math.round(((currentIndex + 1) / steps.length) * 100);
    };

    // Timeline items for visual progress
    const getTimelineProgress = () => {
        const steps: Status[] = ['NEW', 'CONTACTED', 'VERIFIED', 'APPROVED', 'IN_REVIEW', 'CONVERTED'];
        const currentIndex = steps.indexOf(status);

        return steps.map((step, index) => ({
            step,
            completed: currentIndex >= 0 && index <= currentIndex,
            current: index === currentIndex
        }));
    };

    const progress = getTimelineProgress();
    const progressPercentage = getProgressPercentage();

    // Calculate priority score
    const getPriorityScore = () => {
        const baseScore = 100 - (daysActive * 2); // Decay over time
        const verificationBonus = enquiry.verification_status === 'VERIFIED' ? 20 : 0;
        const statusBonus = status === 'VERIFIED' || status === 'IN_REVIEW' ? 15 : 0;
        return Math.max(0, Math.min(100, baseScore + verificationBonus + statusBonus));
    };

    const priorityScore = getPriorityScore();
    const priorityLevel = priorityScore >= 80 ? 'High' : priorityScore >= 60 ? 'Medium' : 'Low';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Enhanced Header & Identity Section */}
                <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-gray-200 flex justify-between items-start flex-shrink-0">
                    <div className="flex items-start space-x-6">
                        {/* Premium Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                {enquiry.applicant_name.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Identity & Status */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-4 mb-3">
                                <h1 className="text-3xl font-bold text-gray-900 truncate">{enquiry.applicant_name}</h1>
                                {/* Premium Status Badge */}
                                <div className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center space-x-2 shadow-sm ${
                                    status === 'VERIFIED' ? 'border-green-200 bg-green-50 text-green-800' :
                                    status === 'CONVERTED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
                                    status === 'IN_REVIEW' ? 'border-orange-200 bg-orange-50 text-orange-800' :
                                    'border-blue-200 bg-blue-50 text-blue-800'
                                }`}>
                                    {STATUS_CONFIG[status]?.icon}
                                    <span>{STATUS_CONFIG[status]?.label || status}</span>
                                </div>
                            </div>

                            {/* Badges Row */}
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium flex items-center space-x-1">
                                    <AcademicCapIcon className="w-4 h-4" />
                                    <span>Grade {enquiry.grade}</span>
                                </div>
                                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                    Enquiry #{enquiry.id.toString().slice(-6).toUpperCase()}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    priorityLevel === 'High' ? 'bg-red-100 text-red-700' :
                                    priorityLevel === 'Medium' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {priorityLevel} Priority
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="flex items-center space-x-4">
                                <div className="flex-1 max-w-xs">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">Progress</span>
                                        <span className="text-sm text-gray-500">{progressPercentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 flex items-center space-x-1">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>{daysActive} days active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleCallParent}
                            className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all duration-200 hover:scale-105 shadow-sm"
                            title="Call Parent"
                        >
                            <PhoneIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            className="p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 transition-all duration-200 hover:scale-105 shadow-sm"
                            title="WhatsApp"
                        >
                            <CommunicationIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-xl hover:bg-gray-100 text-gray-400 transition-all duration-200 hover:scale-105"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Content - Premium Layout */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left Column - Enhanced Information */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Progress Timeline - Step by Step */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <DocumentTextIcon className="w-6 h-6 mr-3 text-blue-600" />
                                Enquiry Progress
                            </h3>

                            <div className="relative">
                                {/* Connection Line */}
                                <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-gray-200"></div>

                                <div className="space-y-8">
                                    {progress.map((item, index) => {
                                        const stepLabels = {
                                            'NEW': 'Enquiry Created',
                                            'CONTACTED': 'Initial Contact Made',
                                            'VERIFIED': 'Documents Verified',
                                            'APPROVED': 'Application Approved',
                                            'IN_REVIEW': 'Final Review',
                                            'CONVERTED': 'Converted to Admission'
                                        };

                                        return (
                                            <div key={item.step} className="flex items-start space-x-6 relative">
                                                {/* Step Circle */}
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                                                    item.completed
                                                        ? 'bg-green-500 text-white shadow-green-200'
                                                        : item.current
                                                            ? 'bg-blue-500 text-white shadow-blue-200 animate-pulse'
                                                            : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {item.completed ? (
                                                        <CheckCircleIcon className="w-6 h-6" />
                                                    ) : (
                                                        <div className="w-3 h-3 rounded-full bg-current" />
                                                    )}
                                                </div>

                                                {/* Step Content */}
                                                <div className="flex-1 pb-8">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h4 className={`text-lg font-semibold ${
                                                            item.completed ? 'text-green-800' :
                                                            item.current ? 'text-blue-800' :
                                                            'text-gray-500'
                                                        }`}>
                                                            {stepLabels[item.step as keyof typeof stepLabels]}
                                                        </h4>
                                                        {item.current && (
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                                Current Step
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 text-sm">
                                                        {item.completed ? 'Completed successfully' :
                                                         item.current ? 'In progress' :
                                                         'Pending'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Information Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Student Information Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                    <UserIcon className="w-5 h-5 mr-3 text-indigo-600" />
                                    Student Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-gray-600 font-medium">Full Name</span>
                                        <span className="text-gray-900 font-semibold">{enquiry.applicant_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-gray-600 font-medium">Grade Applying For</span>
                                        <span className="text-gray-900 font-semibold">Grade {enquiry.grade}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-gray-600 font-medium">Enquiry ID</span>
                                        <span className="text-gray-900 font-semibold">#{enquiry.id.toString().slice(-6).toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-gray-600 font-medium">Enquiry Date</span>
                                        <span className="text-gray-900 font-semibold">
                                            {new Date(enquiry.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Parent Contact Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                    <UserIcon className="w-5 h-5 mr-3 text-green-600" />
                                    Parent Contact
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-gray-600 font-medium">Parent Name</span>
                                        <span className="text-gray-900 font-semibold">{enquiry.parent_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-gray-600 font-medium">Phone</span>
                                        <button
                                            onClick={handleCallParent}
                                            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors flex items-center space-x-1"
                                        >
                                            <span>{enquiry.parent_phone}</span>
                                            <PhoneIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-gray-600 font-medium">Email</span>
                                        <a
                                            href={`mailto:${enquiry.parent_email}`}
                                            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors flex items-center space-x-1"
                                        >
                                            <span>{enquiry.parent_email}</span>
                                            <MailIcon className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                                <ClockIcon className="w-5 h-5 mr-3 text-orange-600" />
                                Recent Activity
                            </h3>
                            <div className="space-y-4">
                                {timeline.length > 0 ? (
                                    timeline.slice(0, 5).map((item) => (
                                        <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 font-medium">
                                                    {item.details?.message || 'Status update'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(item.created_at).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <CommunicationIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Actions & Intelligence */}
                    <div className="w-96 border-l border-gray-200 flex flex-col bg-gray-50">
                        {/* Intelligence Panel */}
                        <div className="p-6 border-b border-gray-200 bg-white">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Intelligence</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                                    <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Priority Score</div>
                                    <div className="text-2xl font-bold text-blue-800 mt-1">{priorityScore}</div>
                                    <div className="text-xs text-blue-600 mt-1">{priorityLevel} Priority</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                                    <div className="text-xs text-green-600 font-semibold uppercase tracking-wide">Progress</div>
                                    <div className="text-2xl font-bold text-green-800 mt-1">{progressPercentage}%</div>
                                    <div className="text-xs text-green-600 mt-1">Complete</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                                    <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Days Active</div>
                                    <div className="text-2xl font-bold text-purple-800 mt-1">{daysActive}</div>
                                    <div className="text-xs text-purple-600 mt-1">Since enquiry</div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                                    <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Source</div>
                                    <div className="text-lg font-bold text-orange-800 mt-1">
                                        {(enquiry as any).source || 'Website'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Panel */}
                        <div className="p-6 border-b border-gray-200 bg-white">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
                            <div className="space-y-3">
                                {/* Primary Action - Convert */}
                                <button
                                    onClick={handleConvert}
                                    disabled={loading.converting || (status !== 'VERIFIED' && status !== 'IN_REVIEW') || enquiry.conversion_state === 'CONVERTED'}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-base"
                                >
                                    {loading.converting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-5 h-5" />
                                            <span>Convert to Admission</span>
                                        </>
                                    )}
                                </button>

                                {/* Secondary Actions */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => updateStatus('CONTACTED')}
                                        disabled={loading.updating || status === 'CONTACTED'}
                                        className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
                                    >
                                        <CommunicationIcon className="w-4 h-4" />
                                        <span>Contact</span>
                                    </button>
                                    <button
                                        onClick={() => updateStatus('VERIFIED')}
                                        disabled={loading.updating || status === 'VERIFIED'}
                                        className="px-4 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
                                    >
                                        <CheckCircleIcon className="w-4 h-4" />
                                        <span>Verify</span>
                                    </button>
                                </div>

                                {/* Reject Action */}
                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    disabled={loading.rejecting || status === 'REJECTED'}
                                    className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
                                >
                                    {loading.rejecting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <XIcon className="w-4 h-4" />
                                            <span>Reject Enquiry</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Enhanced Communication Panel */}
                        <div className="p-6 flex-1 flex flex-col bg-white">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <CommunicationIcon className="w-5 h-5 mr-3 text-blue-600" />
                                Communication
                            </h3>

                            {/* Message History */}
                            <div className="flex-1 mb-4">
                                <div className="text-sm text-gray-600 mb-3 font-medium">Message History</div>
                                <div className="space-y-3 max-h-48 overflow-y-auto">
                                    {timeline.filter(item => item.item_type === 'MESSAGE').length > 0 ? (
                                        timeline
                                            .filter(item => item.item_type === 'MESSAGE')
                                            .slice(-3)
                                            .map((item) => (
                                                <div key={item.id} className={`p-3 rounded-lg text-sm ${
                                                    item.is_admin
                                                        ? 'bg-blue-50 text-blue-900 ml-4'
                                                        : 'bg-gray-50 text-gray-900 mr-4'
                                                }`}>
                                                    <p className="font-medium text-xs mb-1">
                                                        {item.is_admin ? 'You' : enquiry.parent_name}
                                                    </p>
                                                    <p>{item.details?.message}</p>
                                                    <p className="text-xs opacity-70 mt-1">
                                                        {new Date(item.created_at).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-center py-6 text-gray-400 text-sm">
                                            No messages yet
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Message Composer */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="space-y-3">
                                    <textarea
                                        value={followUpNote}
                                        onChange={(e) => setFollowUpNote(e.target.value)}
                                        placeholder="Type your message to the parent..."
                                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                                        rows={3}
                                    />

                                    <div className="flex items-center space-x-3">
                                        <button
                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Attach file"
                                        >
                                            <CameraIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={loading.messaging || !followUpNote.trim()}
                                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-md hover:shadow-lg"
                                        >
                                            {loading.messaging ? (
                                                <Spinner size="sm" />
                                            ) : (
                                                <>
                                                    <SendIcon className="w-4 h-4" />
                                                    <span>Send Message</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Convert Confirmation Modal */}
            {showConvertConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Convert to Admission</h3>
                            <p className="text-gray-600 mb-6">
                                This will convert <strong>{enquiry.applicant_name}</strong> from an enquiry to an admission record.
                                The student will be moved to the Admission Vault and removed from the Enquiry Desk.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowConvertConfirm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmConvert}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Confirm Conversion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Form Modal */}
            {showRejectForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XIcon className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Reject Enquiry</h3>
                            <p className="text-gray-600 mb-4">
                                Please select a reason for rejecting <strong>{enquiry.applicant_name}</strong>'s enquiry:
                            </p>
                            <div className="space-y-3 mb-6">
                                {REJECTION_REASONS.map((reason) => (
                                    <label key={reason} className="flex items-center space-x-3">
                                        <input
                                            type="radio"
                                            name="rejectionReason"
                                            value={reason}
                                            checked={rejectionReason === reason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-4 h-4 text-red-600"
                                        />
                                        <span className="text-gray-700">{reason}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowRejectForm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectionReason}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
                                >
                                    Reject Enquiry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnquiryDetailsModal;

