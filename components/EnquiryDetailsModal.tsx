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

const EncryptionIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
    </svg>
);

// Status configuration with enterprise-grade styling
const STATUS_CONFIG: Record<string, {
    label: string;
    color: string;
    bg: string;
    description: string;
    canPromote: boolean;
}> = {
    'ENQUIRY_ACTIVE': {
        label: 'Active',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border border-blue-500/20',
        description: 'Initial contact established',
        canPromote: false
    },
    'ENQUIRY_VERIFIED': {
        label: 'Verified',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border border-emerald-500/20',
        description: 'Parent details confirmed',
        canPromote: true
    },
    'ENQUIRY_IN_PROGRESS': {
        label: 'In Progress',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border border-amber-500/20',
        description: 'Document review in progress',
        canPromote: true
    },
    'CONVERTED': {
        label: 'Converted',
        color: 'text-gray-400',
        bg: 'bg-gray-500/10 border border-gray-500/20',
        description: 'Promoted to admission',
        canPromote: false
    }
};

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    currentBranchId?: string | null;
    onNavigate?: (component: string) => void;
}

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({
    enquiry,
    onClose,
    onUpdate,
    onNavigate
}) => {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({
        timeline: true,
        statusUpdate: false,
        sending: false,
        promoting: false
    });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPromotionConfirm, setShowPromotionConfirm] = useState(false);
    const commsEndRef = useRef<HTMLDivElement>(null);

    // Current status info
    const currentStatus = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG['ENQUIRY_ACTIVE'];

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
        if (commsEndRef.current) {
            commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [timeline]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleStatusChange = async (newStatus: EnquiryStatus) => {
        setLoading(prev => ({ ...prev, statusUpdate: true }));
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
            setLoading(prev => ({ ...prev, statusUpdate: false }));
        }
    };

    const handlePromoteToAdmission = async () => {
        if (!currentStatus.canPromote) {
            setError('Cannot promote: enquiry must be verified first');
            return;
        }

        setLoading(prev => ({ ...prev, promoting: true }));
        setError(null);
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                setSuccessMessage('Successfully promoted to admission');
                onUpdate();
                setTimeout(() => {
                    onClose();
                    onNavigate?.('Admissions');
                }, 1500);
            } else {
                throw new Error(result.message || 'Promotion failed');
            }
        } catch (err: any) {
            console.error('Promotion error:', err);
            setError(`Promotion failed: ${err.message || 'Please try again'}`);
        } finally {
            setLoading(prev => ({ ...prev, promoting: false }));
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-gray-700/50" style={{boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'}}>

                {/* Success/Error Messages */}
                {(successMessage || error) && (
                    <div className={`px-8 py-4 text-sm font-medium border-b backdrop-blur-sm ${
                        successMessage ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                        'bg-red-500/10 text-red-300 border-red-500/20'
                    }`}>
                        {successMessage || error}
                    </div>
                )}

                {/* Header Section */}
                <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700/50 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={onClose}
                                className="p-3 hover:bg-gray-800/80 rounded-xl transition-all duration-200 hover:scale-105"
                                style={{boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}
                            >
                                <ChevronLeftIcon className="w-5 h-5 text-gray-300" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg">
                                    {enquiry.applicant_name.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white" style={{fontFamily: 'Inter, sans-serif'}}>
                                        {enquiry.applicant_name}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30">
                                            Grade {enquiry.grade}
                                        </span>
                                        <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs font-mono rounded-full border border-gray-500/30">
                                            #{enquiry.id.toString().slice(-6)}
                                        </span>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${currentStatus.bg} ${currentStatus.color}`}>
                                            {currentStatus.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-gray-800/80 rounded-xl transition-all duration-200 hover:scale-105"
                            style={{boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}
                        >
                            <XIcon className="w-5 h-5 text-gray-300" />
                        </button>
                    </div>
                </div>

                {/* Two-Panel Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Enquiry Communication Channel */}
                    <div className="flex-1 bg-gray-900 flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                        <CommunicationIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white" style={{fontFamily: 'Inter, sans-serif'}}>
                                        Enquiry Communication
                                    </h2>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                        <EncryptionIcon className="w-3 h-3 text-emerald-400" />
                                        <span className="text-xs text-emerald-300 font-medium">Encrypted</span>
                                    </div>
                                </div>

                                {/* Messages */}
                                {loading.timeline ? (
                                    <div className="space-y-6">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex gap-6">
                                                <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse" />
                                                <div className="space-y-3 flex-1">
                                                    <div className="h-20 bg-gray-700/50 rounded-xl animate-pulse" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : timeline.filter(t => t.item_type === 'MESSAGE').length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
                                            <CommunicationIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-300 mb-3">No encrypted messages exchanged yet</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                                            Messages are enquiry-stage only and will appear here once communication begins.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {timeline
                                            .filter(t => t.item_type === 'MESSAGE')
                                            .map((item, idx) => (
                                                <div key={idx} className={`flex gap-4 ${item.is_admin ? 'justify-end' : 'justify-start'} mb-6`}>
                                                    {!item.is_admin && (
                                                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg">
                                                            {item.created_by_name?.charAt(0) || 'P'}
                                                        </div>
                                                    )}
                                                    <div className={`max-w-[75%] ${item.is_admin ? 'order-first' : ''}`}>
                                                        <div className={`p-4 rounded-2xl shadow-lg backdrop-blur-sm ${
                                                            item.is_admin ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'bg-gray-800/70 border border-gray-600/50 text-gray-100'
                                                        }`} style={{boxShadow: item.is_admin ? '0 4px 16px rgba(147,51,234,0.3)' : '0 2px 8px rgba(0,0,0,0.2)'}}>
                                                            <p className="text-sm leading-relaxed">{item.details?.message || ''}</p>
                                                        </div>
                                                        <div className={`text-xs text-gray-500 mt-2 flex items-center gap-2 ${item.is_admin ? 'text-right justify-end' : 'text-left justify-start'}`}>
                                                            <span>{item.created_by_name || 'Unknown'}</span>
                                                            <span>•</span>
                                                            <span>{new Date(item.created_at).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}</span>
                                                            {!item.is_admin && <EncryptionIcon className="w-3 h-3 text-emerald-400" />}
                                                        </div>
                                                    </div>
                                                    {item.is_admin && (
                                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg">
                                                            {item.created_by_name?.charAt(0) || 'A'}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        <div ref={commsEndRef} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Message Composer */}
                        <div className="border-t border-gray-700/50 bg-gray-800/70 backdrop-blur-sm p-8">
                            {enquiry.status === 'CONVERTED' ? (
                                <div className="text-center py-4">
                                    <div className="flex items-center justify-center gap-3 text-gray-400">
                                        <ShieldCheckIcon className="w-5 h-5" />
                                        <p className="text-sm">Message input disabled - enquiry has been converted to admission</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="flex gap-6">
                                    <div className="flex-1">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Send a message to the parent (Enquiry channel)"
                                            className="w-full p-4 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none text-sm text-white placeholder-gray-400 transition-all duration-200 backdrop-blur-sm"
                                            rows={3}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || loading.sending}
                                        className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 font-semibold text-sm shadow-lg hover:shadow-xl"
                                        style={{boxShadow: '0 4px 16px rgba(147,51,234,0.3)'}}
                                    >
                                        {loading.sending ? <Spinner size="sm" /> : <LocalSendIcon className="w-4 h-4" />}
                                        Send
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Enquiry Control & Intelligence */}
                    <div className="w-96 bg-gray-800/70 backdrop-blur-sm border-l border-gray-700/50 flex flex-col">
                        {/* Lifecycle Management */}
                        <div className="p-8 border-b border-gray-700/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <ClipboardListIcon className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white" style={{fontFamily: 'Inter, sans-serif'}}>
                                    Lifecycle Management
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { key: 'ENQUIRY_ACTIVE', label: 'Active', desc: 'Initial contact established' },
                                    { key: 'ENQUIRY_VERIFIED', label: 'Verified', desc: 'Parent details confirmed' },
                                    { key: 'ENQUIRY_IN_PROGRESS', label: 'In Progress', desc: 'Document review in progress' },
                                    { key: 'CONVERTED', label: 'Converted', desc: 'Promoted to admission (system)', disabled: true }
                                ].map((status) => (
                                    <label key={status.key} className="flex items-start gap-4 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="enquiryStatus"
                                            value={status.key}
                                            checked={enquiry.status === status.key}
                                            onChange={(e) => handleStatusChange(e.target.value as EnquiryStatus)}
                                            disabled={status.disabled || loading.statusUpdate}
                                            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500 focus:ring-2 mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <span className={`text-sm font-medium transition-colors ${
                                                status.disabled ? 'text-gray-500' :
                                                enquiry.status === status.key ? 'text-purple-300' : 'text-gray-300 group-hover:text-gray-200'
                                            }`}>
                                                {status.label}
                                                {status.disabled && ' (System Only)'}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">{status.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Enquiry Identity Snapshot */}
                        <div className="p-8 border-b border-gray-700/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                                    <UsersIcon className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white" style={{fontFamily: 'Inter, sans-serif'}}>
                                    Enquiry Identity
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 px-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                                    <span className="text-sm text-gray-400">Parent Email</span>
                                    <span className="text-sm text-white font-medium truncate ml-2">{enquiry.parent_email || 'Not provided'}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 px-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                                    <span className="text-sm text-gray-400">Applied Grade</span>
                                    <span className="text-sm text-white font-medium">Grade {enquiry.grade}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 px-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                                    <span className="text-sm text-gray-400">Enquiry Source</span>
                                    <span className="text-sm text-gray-400">Web Form</span>
                                </div>
                            </div>
                        </div>

                        {/* Primary Action */}
                        <div className="p-8">
                            <button
                                onClick={() => setShowPromotionConfirm(true)}
                                disabled={!currentStatus.canPromote || loading.promoting}
                                className={`w-full px-6 py-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-3 ${
                                    currentStatus.canPromote
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-[1.02]'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                                style={currentStatus.canPromote ? {boxShadow: '0 8px 32px rgba(16,185,129,0.3)'} : {}}
                            >
                                {loading.promoting ? (
                                    <>
                                        <Spinner size="sm" />
                                        Promoting...
                                    </>
                                ) : (
                                    <>
                                        <GraduationCapIcon className="w-5 h-5" />
                                        Promote to Admission
                                    </>
                                )}
                            </button>
                            {!currentStatus.canPromote && enquiry.status !== 'CONVERTED' && (
                                <p className="text-xs text-gray-500 mt-3 text-center">Must be verified to promote</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Promotion Confirmation Modal */}
                {showPromotionConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-700/50" style={{boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'}}>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                    <GraduationCapIcon className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">Promote to Admission</h3>
                                <p className="text-gray-300 mb-8 leading-relaxed text-sm">
                                    This will convert the enquiry to an admission record, lock the enquiry, and redirect you to the Admission Vault.
                                    This action cannot be undone.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowPromotionConfirm(false)}
                                        className="flex-1 px-6 py-3 bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-600/50 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPromotionConfirm(false);
                                            handlePromoteToAdmission();
                                        }}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-semibold"
                                    >
                                        Confirm Promotion
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;
