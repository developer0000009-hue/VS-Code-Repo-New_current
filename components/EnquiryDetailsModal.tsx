import React, { useState, useEffect, useCallback } from 'react';
import { supabase, formatError } from '../services/supabase';
import { EnquiryService } from '../services/enquiry';
import { Enquiry, TimelineItem, EnquiryStatus } from '../types';
import EnquiryErrorBoundary from './common/EnquiryErrorBoundary';
import EnquiryTimeline from './EnquiryTimeline';
import EnquiryStatusManager from './EnquiryStatusManager';
import EnquiryMessageComposer from './EnquiryMessageComposer';
import EnquiryAISummary from './EnquiryAISummary';
import { XIcon } from './icons/XIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { GoogleGenAI } from '@google/genai';

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
    const [loading, setLoading] = useState({
        timeline: true,
        saving: false,
        converting: false,
        ai: false
    });

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', {
                p_node_id: enquiry.id
            });
            if (error) throw error;
            setTimeline(data || []);
        } catch (e) {
            console.error("Timeline Sync Error:", e);
        } finally {
            if (!isSilent) setLoading(prev => ({ ...prev, timeline: false }));
        }
    }, [enquiry.id]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    const handleStatusChange = useCallback(async (newStatus: EnquiryStatus) => {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', enquiry.id);

            if (error) throw error;
            onUpdate();
            await fetchTimeline(true);
        } catch (err) {
            console.error('Status update failed:', err);
            throw new Error(formatError(err));
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    }, [enquiry.id, onUpdate, fetchTimeline]);

    const handleConvert = useCallback(async () => {
        setLoading(prev => ({ ...prev, converting: true }));
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                onUpdate();
                onClose();
                onNavigate?.('Admissions');
            } else {
                throw new Error(result.message || 'Conversion failed');
            }
        } catch (err: any) {
            console.error('Conversion failed:', err);
            throw new Error(err.message || 'Failed to convert enquiry to admission');
        } finally {
            setLoading(prev => ({ ...prev, converting: false }));
        }
    }, [enquiry.id, onUpdate, onClose, onNavigate]);

    const handleSendMessage = useCallback(async (message: string) => {
        try {
            const { error } = await supabase.rpc('send_enquiry_message', {
                p_node_id: enquiry.id,
                p_message: message
            });
            if (error) throw error;
            await fetchTimeline(true);
        } catch (err) {
            console.error('Message send failed:', err);
            throw new Error(formatError(err));
        }
    }, [enquiry.id, fetchTimeline]);

    const handleGenerateSummary = useCallback(async (): Promise<string> => {
        setLoading(prev => ({ ...prev, ai: true }));
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GOOGLE_AI_API_KEY });
            const conversationText = timeline
                .filter(t => t.item_type === 'MESSAGE')
                .map(t => `${t.is_admin ? 'Admin' : 'Parent'}: ${t.details.message}`)
                .join('\n');

            const prompt = `Summarize the following school admission enquiry conversation for ${enquiry.applicant_name} (Grade ${enquiry.grade}). Provide a concise analysis of the parent's primary concerns and the current status of the handshake. Tone: Executive and Brief.\n\nConversation:\n${conversationText}`;

            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt
            });

            return response.response?.text() || "Summary unavailable.";
        } catch (err) {
            console.error("AI Context Failure:", err);
            throw new Error('Failed to generate AI summary');
        } finally {
            setLoading(prev => ({ ...prev, ai: false }));
        }
    }, [timeline, enquiry.applicant_name, enquiry.grade]);

    const stringId = String(enquiry.id);

    return (
        <EnquiryErrorBoundary>
            <div
                className="fixed inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[150] p-0 md:p-4 lg:p-6"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-labelledby="enquiry-modal-title"
            >
                <div
                    className="bg-[#09090b] rounded-none md:rounded-[3rem] lg:rounded-[4.5rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,1)] w-full max-w-[1700px] h-full md:h-[94vh] flex flex-col border-0 md:border md:border-white/5 overflow-hidden ring-0 md:ring-1 md:ring-white/10 animate-in zoom-in-95 duration-500"
                    onClick={e => e.stopPropagation()}
                >
                    <header className="px-6 md:px-10 lg:px-16 py-6 md:py-10 border-b border-white/5 bg-[#0f1115]/95 backdrop-blur-2xl flex flex-wrap justify-between items-center z-40 relative shadow-2xl shrink-0">
                        <div className="flex items-center gap-4 md:gap-10 min-w-0">
                            <div className="relative group shrink-0 hidden sm:block">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="w-12 h-12 md:w-20 md:h-20 bg-indigo-600 rounded-2xl md:rounded-[2.2rem] text-white flex items-center justify-center shadow-2xl border border-white/10 relative z-10 transform group-hover:rotate-6 transition-transform duration-700">
                                    <ClipboardListIcon className="w-6 h-6 md:w-10 md:h-10" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-1.5 md:mb-3">
                                    <h2
                                        id="enquiry-modal-title"
                                        className="text-2xl md:text-4xl lg:text-6xl font-serif font-black text-white tracking-tighter uppercase leading-none truncate drop-shadow-2xl"
                                    >
                                        {enquiry.applicant_name}
                                    </h2>
                                    <span className="px-3 md:px-4 py-1 rounded-lg md:xl bg-white/5 border border-white/10 text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] shadow-inner backdrop-blur-md">
                                        Node 0x{stringId.substring(0,6).toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-[9px] md:text-[11px] font-black text-white/20 uppercase tracking-[0.5em] flex items-center gap-2 md:gap-3">
                                    <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    <span className="truncate">Grade {enquiry.grade} Context Node</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 md:p-4 rounded-xl md:rounded-[1.5rem] bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all transform active:scale-90 border border-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                            aria-label="Close enquiry details"
                        >
                            <XIcon className="w-6 h-6 md:w-8 md:h-8" />
                        </button>
                    </header>

                    <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>

                        <div className="flex-1 flex flex-col bg-transparent relative z-10 overflow-hidden">
                            <EnquiryTimeline
                                timeline={timeline}
                                loading={loading.timeline}
                                onTimelineUpdate={() => fetchTimeline(true)}
                            />

                            <EnquiryMessageComposer
                                onSendMessage={handleSendMessage}
                                loading={loading.saving}
                            />
                        </div>

                        <div className="w-full lg:w-[420px] xl:w-[480px] bg-[#0c0d12]/90 backdrop-blur-3xl border-l border-white/10 p-8 md:p-12 lg:p-16 space-y-12 md:space-y-16 overflow-y-auto custom-scrollbar relative z-20 shrink-0 border-t lg:border-t-0 border-white/5">
                            <EnquiryStatusManager
                                currentStatus={enquiry.status}
                                loading={loading.saving || loading.converting}
                                onStatusChange={handleStatusChange}
                                onConvert={handleConvert}
                            />

                            <EnquiryAISummary
                                enquiryId={enquiry.id}
                                grade={enquiry.grade}
                                applicantName={enquiry.applicant_name}
                                timeline={timeline}
                                onGenerateSummary={handleGenerateSummary}
                                loading={loading.ai}
                            />

                            <div className="mt-auto opacity-5 hover:opacity-100 transition-opacity duration-1000 hidden lg:block">
                                <p className="text-[8px] font-mono text-white break-all text-center uppercase tracking-tighter">
                                    Cipher Ledger: {btoa(stringId).substring(0, 32)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </EnquiryErrorBoundary>
    );
};

export default EnquiryDetailsModal;
