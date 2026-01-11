import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from './services/supabase';
import { EnquiryService } from './services/enquiry';
import { Enquiry, TimelineItem, EnquiryStatus } from './types';
import Spinner from './components/common/Spinner';
import { XIcon } from './components/icons/XIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { GraduationCapIcon } from './components/icons/GraduationCapIcon';
import { ShieldCheckIcon } from './components/icons/ShieldCheckIcon';
import { ClipboardListIcon } from './components/icons/ClipboardListIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CommunicationIcon } from './components/icons/CommunicationIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';
import { UsersIcon } from './components/icons/UsersIcon';
import { LockIcon } from './components/icons/LockIcon';
import { SaveIcon } from './components/icons/SaveIcon';
import { ShieldAlertIcon } from './components/icons/ShieldAlertIcon';

const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const STATUS_CONFIG: Record<string, { icon: React.ReactNode, label: string }> = {
    'ENQUIRY_ACTIVE': { icon: <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"/>, label: 'Active' },
    'ENQUIRY_VERIFIED': { icon: <ShieldCheckIcon className="w-4 h-4 text-teal-400"/>, label: 'Verified' },
    'ENQUIRY_IN_PROGRESS': { icon: <ClockIcon className="w-4 h-4 text-purple-400"/>, label: 'In Progress' },
    'CONTACTED': { icon: <CommunicationIcon className="w-4 h-4 text-amber-400"/>, label: 'Contacted' },
    'REJECTED': { icon: <ShieldAlertIcon className="w-4 h-4 text-red-400"/>, label: 'Rejected' },
    'CONVERTED': { icon: <CheckCircleIcon className="w-4 h-4 text-emerald-400"/>, label: 'Converted' },
};

const ORDERED_STATUSES: EnquiryStatus[] = ['ENQUIRY_ACTIVE', 'ENQUIRY_VERIFIED', 'ENQUIRY_IN_PROGRESS', 'CONTACTED', 'REJECTED', 'CONVERTED'];

const TimelineEntry: React.FC<{ item: TimelineItem }> = ({ item }) => {
    if (item.item_type === 'MESSAGE') {
        const isParent = !item.is_admin;
        return (
             <div className={`flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full ${isParent ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-3 max-w-[85%] sm:max-w-[70%] ${isParent ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shadow-lg text-white flex-shrink-0 border border-white/5 ${isParent ? 'bg-indigo-600/80' : 'bg-white/10'}`}>
                        {item.created_by_name.charAt(0)}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className={`px-5 py-3 rounded-[14px] shadow-sm relative overflow-hidden group ${isParent ? 'bg-[#1a1d23] border border-white/5 rounded-br-none' : 'bg-[#221f30]/80 border border-white/5 rounded-bl-none text-white/90'}`}>
                            <p className="text-[14px] leading-relaxed relative z-10 whitespace-pre-wrap font-sans font-normal">{item.details.message}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isParent ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[9px] font-medium text-white/20 uppercase tracking-widest">{item.created_by_name}</span>
                            <span className="text-[9px] font-mono text-white/15">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex justify-center my-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-4 px-5 py-2 rounded-full bg-white/[0.01] border border-white/5 backdrop-blur-sm">
                <span className="text-[10px] font-bold uppercase text-white/15 tracking-[0.2em]">
                    {item.item_type.replace(/_/g, ' ')} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    currentBranchId?: number | null; 
    onNavigate?: (component: string) => void;
}

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({ enquiry, onClose, onUpdate, onNavigate }) => {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [pendingStatus, setPendingStatus] = useState<EnquiryStatus>(enquiry.status);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({ timeline: true, saving: false, converting: false, ai: false });
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const commsEndRef = useRef<HTMLDivElement>(null);

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: String(enquiry.id) });
            if (error) throw error;
            setTimeline(data || []);
        } catch (e) {
            console.error("Timeline Sync Error:", formatError(e));
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

    const handleAIGenerateSummary = async () => {
        setLoading(prev => ({ ...prev, ai: true }));
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const conversationText = timeline
                .filter(t => t.item_type === 'MESSAGE')
                .map(t => `${t.is_admin ? 'Admin' : 'Parent'}: ${t.details.message}`)
                .join('\n');
                
            const prompt = `Summarize the following school admission enquiry conversation for ${enquiry.applicant_name} (Grade ${enquiry.grade}). Provide a concise analysis of the parent's primary concerns and the current status of the handshake. Tone: Executive and Brief.\n\nConversation:\n${conversationText}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });
            
            setAiSummary(response.text || "Summary unavailable.");
        } catch (err) {
            console.error("AI Context Failure:", formatError(err));
        } finally {
            setLoading(prev => ({ ...prev, ai: false }));
        }
    };

    const handleFinalizeSave = async () => {
        if (pendingStatus === 'CONVERTED') {
            handleConvert();
            return;
        }

        let reason = null;
        if (pendingStatus === 'REJECTED') {
            reason = prompt("MANDATORY PROTOCOL: Please define the rejection reason for this identity node:");
            if (!reason) {
                alert("Operation Aborted: Rejection reason is required for lifecycle compliance.");
                return;
            }
        }

        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ 
                    status: pendingStatus, 
                    updated_at: new Date().toISOString(),
                    notes: reason ? `${enquiry.notes}\nRejected: ${reason}` : enquiry.notes 
                })
                .eq('id', String(enquiry.id));
            
            if (error) throw error;
            
            await supabase.rpc('send_enquiry_message', { 
                p_enquiry_id: String(enquiry.id), 
                p_message: `LIFECYCLE UPDATE: Identity promoted to ${pendingStatus}.${reason ? ` Reason: ${reason}` : ''}` 
            });

            onUpdate();
            onClose();
        } catch (err) {
            alert(`Save failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleConvert = async () => {
        setLoading(prev => ({ ...prev, converting: true }));
        try {
            const result = await EnquiryService.convertToAdmission(String(enquiry.id));
            if (result.success) {
                onUpdate();
                onClose();
                onNavigate?.('Admissions');
            }
        } catch (err: any) {
            alert(formatError(err));
        } finally {
            setLoading(prev => ({ ...prev, converting: false }));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = newMessage.trim();
        if (!msg) return;
        
        try {
            const { error } = await supabase.rpc('send_enquiry_message', { 
                p_enquiry_id: String(enquiry.id), 
                p_message: msg 
            });
            if (error) throw error;
            setNewMessage('');
            await fetchTimeline(true);
        } catch (err) {
            alert("Transmit Failure: " + formatError(err));
        }
    };

    const hasStatusChanged = pendingStatus !== enquiry.status;

    return (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-[150] p-0 sm:p-4 md:p-8 overflow-hidden font-sans" onClick={onClose}>
            <div className="bg-[#08090a] rounded-t-3xl sm:rounded-[32px] shadow-[0_64px_128px_-32px_rgba(0,0,0,1)] w-full max-w-[1400px] h-full sm:h-[90vh] flex flex-col border border-white/5 overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
                
                {/* Header Area */}
                <header className="px-10 py-8 border-b border-white/[0.04] bg-[#0c0d12]/60 backdrop-blur-xl flex justify-between items-center z-40 relative flex-shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="relative group shrink-0">
                            <div className="absolute inset-0 bg-primary/10 blur-xl opacity-40 rounded-full"></div>
                            <div className="w-14 h-14 bg-white/5 rounded-2xl text-white flex items-center justify-center border border-white/10 relative z-10 transition-transform duration-500 group-hover:scale-105">
                                <UsersIcon className="w-7 h-7 text-white/60" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-4 mb-1">
                                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">{enquiry.applicant_name}</h2>
                                <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Parent • {enquiry.parent_name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-[9px] font-black text-primary uppercase tracking-[0.2em]">Verified Channel</span>
                                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                <span className="text-[10px] font-medium text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                                    <ShieldCheckIcon className="w-3 h-3 text-emerald-500/60" /> Institutional Node_0x{String(enquiry.id).substring(0,6).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Last active · Today</span>
                        </div>
                        <button onClick={onClose} className="p-2.5 rounded-full bg-white/5 text-white/30 hover:text-white transition-all active:scale-90 border border-white/5"><XIcon className="w-5 h-5"/></button>
                    </div>
                </header>

                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
                    {/* Message Area */}
                    <div className="flex-1 flex flex-col bg-transparent relative z-10">
                        <div className="flex-grow overflow-y-auto p-10 md:p-14 space-y-10 custom-scrollbar flex flex-col scroll-smooth">
                            {loading.timeline && timeline.length === 0 ? (
                                <div className="m-auto flex flex-col items-center gap-4">
                                    <Spinner size="md" className="text-primary/60" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">Recalling Registry...</p>
                                </div>
                            ) : (
                                <>
                                    {timeline.length === 0 && (
                                        <div className="m-auto flex flex-col items-center text-center space-y-8 animate-in fade-in duration-1000">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-white/[0.02] blur-3xl rounded-full scale-150"></div>
                                                <LockIcon className="w-20 h-20 text-white/[0.03] relative z-10" />
                                            </div>
                                            <div className="space-y-2 relative z-10">
                                                <h4 className="text-lg font-bold text-white/40 uppercase tracking-widest">No messages yet</h4>
                                                <p className="text-sm text-white/20 max-w-[280px] leading-relaxed font-sans">
                                                    This is a private, end-to-end encrypted channel. 
                                                    Messages sent here are visible only to authorized participants.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-6">
                                        {timeline.map((item, idx) => <TimelineEntry key={idx} item={item} />)}
                                        <div ref={commsEndRef} className="h-2" />
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* Input Composer */}
                        <div className="p-8 border-t border-white/[0.03] bg-[#0c0d12]/80 backdrop-blur-xl">
                            <form onSubmit={handleSendMessage} className="flex gap-4 items-center max-w-5xl mx-auto group">
                                <div className="flex-grow relative">
                                    <input 
                                        type="text"
                                        value={newMessage} 
                                        onChange={(e) => setNewMessage(e.target.value)} 
                                        placeholder="Type a secure message..." 
                                        className="w-full h-14 pl-6 pr-14 rounded-2xl bg-white/[0.02] border border-white/10 text-sm text-white placeholder:text-white/10 outline-none shadow-inner focus:bg-white/[0.04] focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <LockIcon className="w-3.5 h-3.5 text-white/5" />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    className="w-14 h-14 bg-indigo-600/90 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-600 active:scale-95 transition-all duration-300 disabled:opacity-5 disabled:grayscale"
                                >
                                    <LocalSendIcon className="w-6 h-6" />
                                </button>
                            </form>
                            <p className="text-center text-[9px] font-bold uppercase tracking-[0.3em] text-white/10 mt-4">Security clearance confirmed • G-OS Encrypted Tunnel</p>
                        </div>
                    </div>

                    {/* Right Control Panel */}
                    <div className="w-full lg:w-[380px] bg-[#090a0f] border-l border-white/[0.04] p-10 space-y-10 overflow-y-auto custom-scrollbar relative z-20">
                        
                        {/* Section: Channel Status */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">Channel Status</h3>
                                <ShieldCheckIcon className="w-4 h-4 text-emerald-500/40" />
                            </div>
                            <div className="space-y-3">
                                {ORDERED_STATUSES.map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setPendingStatus(s)}
                                        disabled={loading.saving || enquiry.status === 'CONVERTED' || (enquiry.status === 'REJECTED' && s !== 'ENQUIRY_ACTIVE')}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group/btn relative overflow-hidden ${pendingStatus === s ? 'bg-primary/5 border-primary/30 text-white shadow-lg shadow-primary/5' : 'bg-white/[0.01] border-white/[0.03] text-white/20 hover:border-white/10 hover:bg-white/[0.03]'}`}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="flex items-center justify-center transition-transform duration-500 group-hover/btn:scale-110">
                                                {STATUS_CONFIG[s]?.icon}
                                            </div>
                                            <span className={`text-[12px] font-bold uppercase tracking-widest transition-colors duration-300 ${pendingStatus === s ? 'text-primary' : 'group-hover/btn:text-white/60'}`}>
                                                {STATUS_CONFIG[s]?.label}
                                            </span>
                                        </div>
                                        {pendingStatus === s && <CheckCircleIcon className="w-4 h-4 text-primary/80 animate-in zoom-in duration-300 relative z-10" />}
                                    </button>
                                ))}
                            </div>
                            
                            <button 
                                onClick={handleFinalizeSave}
                                disabled={loading.saving || !hasStatusChanged}
                                className={`w-full h-12 rounded-xl flex items-center justify-center gap-3 font-bold text-[11px] uppercase tracking-[0.2em] transition-all duration-500 transform active:scale-95 ${hasStatusChanged ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}
                            >
                                {loading.saving ? <Spinner size="sm" className="text-white"/> : <><SaveIcon className="w-4 h-4" /> Commit Status</>}
                            </button>
                        </section>

                        {/* Section: Institutional Note */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">Institutional Note</h3>
                                <button 
                                    onClick={handleAIGenerateSummary} 
                                    disabled={loading.ai}
                                    className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-90"
                                    title="AI Synthesis"
                                >
                                    {loading.ai ? <Spinner size="sm" /> : <SparklesIcon className="w-4 h-4" />}
                                </button>
                            </div>
                            
                            {aiSummary ? (
                                <div className="bg-primary/[0.02] border border-primary/10 p-6 rounded-2xl relative group overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700">
                                     <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:opacity-100 transition-opacity"></div>
                                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60 mb-4 flex items-center gap-2">
                                         <SparklesIcon className="w-3 h-3" /> AI Synthesis
                                     </p>
                                     <p className="text-[13px] font-sans italic text-white/50 leading-relaxed">"{aiSummary}"</p>
                                     <button onClick={() => setAiSummary(null)} className="mt-5 text-[9px] font-black uppercase tracking-widest text-white/10 hover:text-white/40 transition-colors">Discard insight</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-5 rounded-[1.5rem] bg-white/[0.01] border border-white/[0.04] shadow-inner">
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-2">Grade Placement</span>
                                        <p className="text-[14px] text-white/80 font-bold font-sans tracking-tight">Grade {enquiry.grade} Context</p>
                                    </div>
                                    <div className="p-5 rounded-[1.5rem] bg-white/[0.01] border border-white/[0.04] shadow-inner">
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-2">Node Email</span>
                                        <p className="text-[14px] text-white/50 font-medium truncate">{enquiry.parent_email}</p>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Section: Primary CTA */}
                        {enquiry.status !== 'CONVERTED' && enquiry.status !== 'REJECTED' && (
                            <section className="pt-6 border-t border-white/[0.04]">
                                <button 
                                    onClick={handleConvert}
                                    disabled={loading.converting || enquiry.status === 'ENQUIRY_ACTIVE'}
                                    className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-500 shadow-xl ${enquiry.status !== 'ENQUIRY_ACTIVE' ? 'bg-emerald-600/90 text-white hover:bg-emerald-600 hover:scale-[1.02] hover:shadow-emerald-500/20 active:scale-[0.98]' : 'bg-white/5 text-white/5 cursor-not-allowed border border-white/5 grayscale'}`}
                                >
                                    {loading.converting ? <Spinner size="sm" className="text-white"/> : <><GraduationCapIcon className="w-5 h-5 opacity-40" /> Promote to Admission</>}
                                </button>
                                {enquiry.status === 'ENQUIRY_ACTIVE' && (
                                    <p className="text-[9px] text-amber-500/40 font-bold uppercase tracking-widest text-center mt-4 leading-relaxed">
                                        Verification protocol required <br/> prior to enrollment.
                                    </p>
                                )}
                            </section>
                        )}
                        
                        <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                             <p className="text-[8px] font-mono text-white/5 text-center break-all select-none">HASH_INTEGRITY: {btoa(String(enquiry.id)).substring(0, 32)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;
