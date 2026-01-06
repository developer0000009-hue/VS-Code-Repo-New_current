import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { Enquiry, TimelineItem, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { UserIcon } from './icons/UserIcon';
import { MailIcon } from './icons/MailIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EditIcon } from './icons/EditIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';



const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const STATUS_CONFIG: Record<string, { icon: React.ReactNode, label: string, color: string, ring: string, bg: string }> = {
    'New': { icon: <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"/>, label: 'New', color: 'text-gray-700', ring: 'ring-gray-600', bg: 'bg-gray-50' },
    'ENQUIRY_ACTIVE': { icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>, label: 'Active', color: 'text-blue-700', ring: 'ring-blue-600', bg: 'bg-blue-50' },
    'ENQUIRY_VERIFIED': { icon: <ShieldCheckIcon className="w-4 h-4"/>, label: 'Verified', color: 'text-teal-700', ring: 'ring-teal-500', bg: 'bg-teal-50' },
    'VERIFIED': { icon: <ShieldCheckIcon className="w-4 h-4"/>, label: 'Verified', color: 'text-teal-700', ring: 'ring-teal-500', bg: 'bg-teal-50' },
    'ENQUIRY_IN_PROGRESS': { icon: <div className="w-2 h-2 rounded-full bg-purple-600"/>, label: 'In Progress', color: 'text-purple-700', ring: 'ring-purple-500', bg: 'bg-purple-50' },
    'IN_REVIEW': { icon: <div className="w-2 h-2 rounded-full bg-purple-600"/>, label: 'In Review', color: 'text-purple-700', ring: 'ring-purple-500', bg: 'bg-purple-50' },
    'CONVERTED': { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Converted', color: 'text-emerald-700', ring: 'ring-emerald-500', bg: 'bg-emerald-50' },
    'Completed': { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Completed', color: 'text-emerald-700', ring: 'ring-emerald-500', bg: 'bg-emerald-50' },
};

const ORDERED_STATUSES: EnquiryStatus[] = ['ENQUIRY_ACTIVE', 'ENQUIRY_VERIFIED', 'ENQUIRY_IN_PROGRESS', 'CONVERTED'];

const TimelineEntry: React.FC<{ item: TimelineItem }> = ({ item }) => {
    if (item.item_type === 'MESSAGE') {
        const isParent = !item.is_admin;
        const message = item.details?.message || '[Message content unavailable]';
        const createdByName = item.created_by_name || 'Unknown';

        return (
             <div className={`flex items-end gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full ${isParent ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-5 max-w-[85%] sm:max-w-[75%] ${isParent ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-11 h-11 rounded-[1.1rem] flex items-center justify-center font-black text-sm shadow-2xl text-white flex-shrink-0 border border-white/5 ${isParent ? 'bg-indigo-600' : 'bg-[#252833]'}`}>
                        {createdByName.charAt(0)}
                    </div>
                    <div className={`p-6 md:p-8 rounded-[2.5rem] shadow-2xl ring-1 ring-white/5 overflow-hidden relative ${isParent ? 'bg-[#1a1d23] rounded-br-none' : 'bg-[#221f30] rounded-bl-none text-white/90'}`}>
                         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                         <p className="text-[15px] md:text-[17px] leading-relaxed relative z-10 whitespace-pre-wrap font-medium">{message}</p>
                         <div className={`flex items-center gap-3 mt-6 relative z-10 opacity-30 ${isParent ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[9px] font-black uppercase tracking-widest">{createdByName}</span>
                            <span className="w-1 h-1 rounded-full bg-white"></span>
                            <span className="text-[9px] font-mono">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center my-10 animate-in fade-in zoom-in-95 duration-1000">
            <div className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/[0.02] border border-white/5 shadow-inner backdrop-blur-sm">
                <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
                    {item.item_type?.replace(/_/g, ' ') || 'Unknown Event'} / {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></div>
            </div>
        </div>
    );
};

interface EnquiryDetailsPageProps {
    onNavigate?: (component: string) => void;
}

const EnquiryDetailsPage: React.FC<EnquiryDetailsPageProps> = ({ onNavigate }) => {
    const { enquiry_id } = useParams<{ enquiry_id: string }>();
    const navigate = useNavigate();

    const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [formData, setFormData] = useState({
        status: '',
        notes: '',
        applicant_name: '',
    });
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({ enquiry: true, timeline: false, saving: false, converting: false });
    const [error, setError] = useState<string | null>(null);
    const commsEndRef = useRef<HTMLDivElement>(null);

    const validateEnquiry = (enquiry: Enquiry): { isValid: boolean; error?: string } => {
        if (!enquiry) {
            return { isValid: false, error: 'Enquiry data is missing' };
        }
        if (!enquiry.id) {
            return { isValid: false, error: 'Enquiry ID is required' };
        }
        if (!enquiry.applicant_name) {
            return { isValid: false, error: 'Applicant name is required' };
        }
        // Make parent_name optional for defensive handling
        // if (!enquiry.parent_name) {
        //     return { isValid: false, error: 'Parent name is required' };
        // }
        if (!enquiry.grade) {
            return { isValid: false, error: 'Grade information is required' };
        }
        return { isValid: true };
    };

    const fetchEnquiry = useCallback(async () => {
        if (!enquiry_id) {
            setError('Invalid enquiry ID provided');
            setLoading(prev => ({ ...prev, enquiry: false }));
            return;
        }

        const parsedId = parseInt(enquiry_id);
        if (isNaN(parsedId) || parsedId <= 0) {
            setError('Invalid enquiry ID format');
            setLoading(prev => ({ ...prev, enquiry: false }));
            return;
        }

        setLoading(prev => ({ ...prev, enquiry: true }));
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('enquiries')
                .select('*')
                .eq('id', parsedId)
                .single();

            if (fetchError) {
                // Handle specific RLS or permission errors
                if (fetchError.code === 'PGRST116') {
                    setError('Enquiry not found or access denied. You may not have permission to view this enquiry.');
                } else if (fetchError.message?.includes('permission denied') || fetchError.message?.includes('RLS')) {
                    setError('Access denied. You do not have permission to view this enquiry.');
                } else {
                    throw fetchError;
                }
                setEnquiry(null);
                return;
            }

            if (!data) {
                setError('Enquiry not found in the system');
                setEnquiry(null);
                return;
            }

            const validation = validateEnquiry(data as Enquiry);
            if (!validation.isValid) {
                setError(validation.error || 'Enquiry data is incomplete or invalid');
                setEnquiry(null);
                return;
            }

            setEnquiry(data as Enquiry);
            setFormData({
                status: data.status,
                notes: data.notes || '',
                applicant_name: data.applicant_name || '',
            });
        } catch (err: any) {
            console.error("Enquiry Fetch Error:", err);
            const formattedError = formatError(err);
            if (formattedError.includes('Synchronization Idle') || formattedError.includes('Institutional system exception')) {
                setError('Unable to load enquiry. Please check your connection and try again.');
            } else {
                setError(formattedError);
            }
        } finally {
            setLoading(prev => ({ ...prev, enquiry: false }));
        }
    }, [enquiry_id]);

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!enquiry) return;

        if (!isSilent) setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: enquiry.id });
            if (error) throw error;
            setTimeline(data || []);
        } catch (err) {
            console.error("Timeline Sync Error:", err);
            // Set error for timeline issues
            if (!error) setError("Failed to load conversation timeline. Please try again.");
        } finally {
            if (!isSilent) setLoading(prev => ({ ...prev, timeline: false }));
        }
    }, [enquiry]);

    useEffect(() => {
        fetchEnquiry();
    }, [fetchEnquiry]);

    useEffect(() => {
        if (enquiry) {
            fetchTimeline();
        }
    }, [enquiry, fetchTimeline]);

    useEffect(() => {
        if (commsEndRef.current) {
            commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [timeline]);



    const handleSaveStatus = async (newStatus: EnquiryStatus) => {
        if (!enquiry) return;

        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', enquiry.id);

            if (error) throw error;
            setFormData(prev => ({ ...prev, status: newStatus }));
            setEnquiry(prev => prev ? { ...prev, status: newStatus } : null);
            await fetchTimeline(true);
        } catch (err) {
            alert(`Save failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleConvert = async () => {
        if (!enquiry) return;

        setLoading(prev => ({ ...prev, converting: true }));
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                onNavigate?.('Admissions');
                navigate(-1); // Go back to enquiry list
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(prev => ({ ...prev, converting: false }));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = newMessage.trim();
        if (!msg || !enquiry) return;

        try {
            const { error } = await supabase.rpc('send_enquiry_message', {
                p_enquiry_id: enquiry.id,
                p_message: msg
            });
            if (error) throw error;
            setNewMessage('');
            await fetchTimeline(true);
        } catch (err) {
            alert("Transmit Failure: " + formatError(err));
        }
    };

    if (loading.enquiry) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner size="lg" className="text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Loading Enquiry Details</p>
            </div>
        );
    }

    if (error || !enquiry) {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-serif font-black text-white uppercase tracking-tight">Enquiry Details</h1>
                </div>

                <div className="m-auto flex flex-col items-center gap-6 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                        <XIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-serif font-black text-white uppercase tracking-tight">Access Error</h3>
                        <p className="text-white/60 font-serif italic">{error || 'Enquiry not found or access denied'}</p>
                        <button
                            onClick={() => onNavigate?.('Enquiries')}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-sm font-bold uppercase tracking-wide transition-all border border-white/10"
                        >
                            Return to Enquiry Node
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Helper function to get status color
    const getStatusColor = (status: string) => {
        const colors = {
            'New': 'bg-blue-500',
            'ENQUIRY_ACTIVE': 'bg-blue-500',
            'ENQUIRY_VERIFIED': 'bg-emerald-500',
            'VERIFIED': 'bg-emerald-500',
            'ENQUIRY_IN_PROGRESS': 'bg-amber-500',
            'IN_REVIEW': 'bg-amber-500',
            'CONVERTED': 'bg-green-600',
            'Completed': 'bg-green-600'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-500';
    };

    // Helper function to get priority color
    const getPriorityColor = () => {
        const daysSinceCreated = Math.floor((new Date().getTime() - new Date(enquiry.received_at).getTime()) / (1000 * 3600 * 24));
        if (daysSinceCreated > 7) return 'bg-red-500';
        if (daysSinceCreated > 3) return 'bg-amber-500';
        return 'bg-green-500';
    };

    // Calculate some stats
    const daysActive = Math.floor((new Date().getTime() - new Date(enquiry.received_at).getTime()) / (1000 * 3600 * 24));
    const messageCount = timeline.filter(t => t.item_type === 'MESSAGE').length;

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            {/* Hero Header - Full Width */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-black border-b border-white/5">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`, backgroundSize: '20px 20px' }}></div>

                {/* Navigation */}
                <div className="relative z-10 px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10 hover:border-white/20 group"
                        >
                            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Back to Enquiries</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs font-mono text-white/60">
                                <span>Last updated</span>
                                <span className="text-white/40">
                                    {new Date(enquiry.updated_at).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
                                <SettingsIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 px-8 py-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-8">
                                {/* Student Avatar */}
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl border-4 border-white/10">
                                        {enquiry.applicant_name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-[#0a0a0c] flex items-center justify-center">
                                        <CheckIcon className="w-4 h-4 text-white" />
                                    </div>
                                </div>

                                {/* Student Info */}
                                <div className="space-y-4">
                                    <div>
                                        <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-2">
                                            {enquiry.applicant_name}
                                        </h1>
                                        <div className="flex items-center gap-4">
                                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-bold border border-indigo-500/20">
                                                Grade {enquiry.grade}
                                            </span>
                                            <span className="text-white/60 text-sm">
                                                Enquiry #{enquiry.id.toString().substring(0, 8).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Pills */}
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${getStatusColor(enquiry.status)} text-white shadow-lg`}>
                                            {STATUS_CONFIG[enquiry.status]?.icon}
                                            {STATUS_CONFIG[enquiry.status]?.label || enquiry.status}
                                        </div>

                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${getPriorityColor()} text-white`}>
                                            <AlertTriangleIcon className="w-3 h-3" />
                                            {daysActive > 7 ? 'High Priority' : daysActive > 3 ? 'Medium Priority' : 'Normal Priority'}
                                        </div>

                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                                            <ClockIcon className="w-3 h-3" />
                                            {daysActive} days active
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-2xl font-black text-white">{messageCount}</div>
                                    <div className="text-xs font-medium text-white/60 uppercase tracking-wider">Messages</div>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-2xl font-black text-emerald-400">
                                        {enquiry.status === 'CONVERTED' ? '100%' : enquiry.status === 'ENQUIRY_VERIFIED' ? '75%' : enquiry.status === 'ENQUIRY_IN_PROGRESS' ? '50%' : '25%'}
                                    </div>
                                    <div className="text-xs font-medium text-white/60 uppercase tracking-wider">Progress</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="flex h-[calc(100vh-280px)] bg-[#0a0a0c]">
                {/* Left Column - Timeline & Status Flow */}
                <div className="w-80 bg-[#0f1115]/50 backdrop-blur-xl border-r border-white/5 flex flex-col">
                    {/* Timeline Header */}
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-lg font-bold text-white mb-2">Activity Timeline</h2>
                        <p className="text-sm text-white/60">Real-time enquiry progress</p>
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Status Progress */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Progress Status</h3>
                            <div className="space-y-3">
                                {[
                                    { step: 'Enquiry Created', status: 'completed', date: enquiry.received_at },
                                    { step: 'Documents Requested', status: enquiry.status !== 'New' ? 'completed' : 'pending' },
                                    { step: 'Verification', status: ['ENQUIRY_VERIFIED', 'ENQUIRY_IN_PROGRESS', 'CONVERTED'].includes(enquiry.status) ? 'completed' : 'pending' },
                                    { step: 'Review', status: ['ENQUIRY_IN_PROGRESS', 'CONVERTED'].includes(enquiry.status) ? 'completed' : 'pending' },
                                    { step: 'Converted', status: enquiry.status === 'CONVERTED' ? 'completed' : 'pending' }
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                                            item.status === 'completed'
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : item.status === 'current'
                                                ? 'border-indigo-500 text-indigo-400'
                                                : 'border-white/20 text-white/40'
                                        }`}>
                                            {item.status === 'completed' ? (
                                                <CheckIcon className="w-4 h-4" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-current"></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className={`text-sm font-medium ${item.status === 'completed' ? 'text-white' : 'text-white/60'}`}>
                                                {item.step}
                                            </div>
                                            {item.date && (
                                                <div className="text-xs text-white/40">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Timeline Feed */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Recent Activity</h3>
                            <div className="space-y-4">
                                {timeline.slice(0, 10).map((item, idx) => (
                                    <div key={idx} className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                            {item.item_type === 'MESSAGE' ? (
                                                <CommunicationIcon className="w-4 h-4 text-indigo-400" />
                                            ) : (
                                                <SettingsIcon className="w-4 h-4 text-indigo-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white truncate">
                                                {item.item_type === 'MESSAGE' ? 'Message sent' : 'Status updated'}
                                            </div>
                                            <div className="text-xs text-white/60">
                                                {new Date(item.created_at).toLocaleString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Column - Core Details */}
                <div className="flex-1 flex flex-col bg-[#0a0a0c]">
                    {/* Information Cards */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {/* Student Information Card */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Student Information</h3>
                                </div>
                                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Full Name</label>
                                    <p className="text-white font-medium">{enquiry.applicant_name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Grade Level</label>
                                    <p className="text-white font-medium">Grade {enquiry.grade}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Date of Birth</label>
                                    <p className="text-white font-medium">Not specified</p>
                                </div>
                            </div>
                        </div>

                        {/* Parent/Guardian Information Card */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                        <UsersIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Parent/Guardian Details</h3>
                                </div>
                                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Full Name</label>
                                    <p className="text-white font-medium">{enquiry.parent_name || 'Not provided'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Relationship</label>
                                    <p className="text-white font-medium">Parent</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Email Address</label>
                                    <p className="text-white font-medium">{enquiry.parent_email || 'Not provided'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Phone Number</label>
                                    <p className="text-white font-medium">{enquiry.parent_phone || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Academic Interest Card */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                                        <AcademicCapIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Academic Interest</h3>
                                </div>
                                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Target Grade</label>
                                    <p className="text-white font-medium">Grade {enquiry.grade}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Admission Timeline</label>
                                    <p className="text-white font-medium">Immediate (Current Session)</p>
                                </div>
                            </div>
                        </div>

                        {/* Enquiry Source Card */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                                        <DocumentTextIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Enquiry Source</h3>
                                </div>
                                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                    <EyeIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Source Type</label>
                                    <p className="text-white font-medium">
                                        {enquiry.admission_id ? 'Parent Portal Registration' : 'Direct School Enquiry'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1 block">Created Date</label>
                                    <p className="text-white font-medium">
                                        {new Date(enquiry.received_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Communication Input - Bottom */}
                    <div className="border-t border-white/10 p-6 bg-[#0f1115]/50 backdrop-blur-xl">
                        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                            <div className="flex gap-4 items-end">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Send a message to the parent..."
                                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 outline-none resize-none focus:bg-white/10 focus:border-indigo-500/50 transition-all duration-300"
                                        rows={3}
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e as any);
                                            }
                                        }}
                                    />
                                    <div className="absolute right-3 bottom-3 text-xs text-white/40">
                                        Press Enter to send
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || loading.saving}
                                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading.saving ? <Spinner size="sm" /> : <ArrowRightIcon className="w-4 h-4" />}
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column - Actions & Intelligence */}
                <div className="w-80 bg-[#0f1115]/50 backdrop-blur-xl border-l border-white/5 flex flex-col">
                    {/* Actions Header */}
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-lg font-bold text-white mb-2">Actions & Intelligence</h2>
                        <p className="text-sm text-white/60">Contextual operations</p>
                    </div>

                    {/* Actions Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Primary Actions */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Primary Actions</h3>

                            {/* Convert to Admission - HIGHEST PRIORITY */}
                            {enquiry.status !== 'CONVERTED' && (
                                <button
                                    onClick={handleConvert}
                                    disabled={loading.converting || enquiry.status === 'ENQUIRY_ACTIVE'}
                                    className={`w-full p-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                                        enquiry.status !== 'ENQUIRY_ACTIVE'
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-white/10 text-white/40 cursor-not-allowed'
                                    }`}
                                >
                                    {loading.converting ? <Spinner size="sm" /> : <GraduationCapIcon className="w-5 h-5" />}
                                    Convert to Admission
                                </button>
                            )}

                            {/* Status Management */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Update Status</label>
                                <select
                                    value={enquiry.status}
                                    onChange={(e) => handleSaveStatus(e.target.value as EnquiryStatus)}
                                    disabled={loading.saving}
                                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500/50 transition-all"
                                >
                                    {ORDERED_STATUSES.map(status => (
                                        <option key={status} value={status}>
                                            {STATUS_CONFIG[status]?.label || status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Communication Actions */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Communication</h3>

                            <button
                                onClick={() => {
                                    setNewMessage("Thank you for your interest in our school. We have received your enquiry and will get back to you shortly.");
                                }}
                                className="w-full p-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 hover:text-indigo-300 transition-all duration-300 text-left"
                            >
                                <div className="font-medium text-sm">Send Welcome Message</div>
                                <div className="text-xs opacity-70">Automated response</div>
                            </button>

                            <button
                                onClick={() => {
                                    setNewMessage("Please provide the following documents to complete your application:\n\n• Birth Certificate\n• Address Proof\n• Previous School Records\n• Medical Certificate (if applicable)\n\nYou can upload these documents directly through your Parent Portal.");
                                }}
                                className="w-full p-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300 transition-all duration-300 text-left"
                            >
                                <div className="font-medium text-sm">Request Documents</div>
                                <div className="text-xs opacity-70">Document checklist</div>
                            </button>
                        </div>

                        {/* Intelligence Panel */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Intelligence</h3>

                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Response Time</div>
                                    <div className="text-lg font-black text-white">
                                        {messageCount > 0 ? '< 24h' : 'Pending'}
                                    </div>
                                </div>

                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Engagement Score</div>
                                    <div className="text-lg font-black text-emerald-400">
                                        {Math.min(95, 60 + (messageCount * 10))}%
                                    </div>
                                </div>

                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Priority Level</div>
                                    <div className={`text-sm font-bold ${
                                        daysActive > 7 ? 'text-red-400' :
                                        daysActive > 3 ? 'text-amber-400' : 'text-green-400'
                                    }`}>
                                        {daysActive > 7 ? 'High' : daysActive > 3 ? 'Medium' : 'Normal'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Archive/Delete Actions */}
                        <div className="space-y-4 border-t border-white/10 pt-6">
                            <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">Administrative</h3>

                            <button className="w-full p-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-300 flex items-center justify-center gap-2">
                                <ArchiveIcon className="w-4 h-4" />
                                <span className="font-medium text-sm">Archive Enquiry</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsPage;
