
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatError } from '../services/supabase';
import { Enquiry, TimelineItem, EnquiryStatus } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { UserIcon } from './icons/UserIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ClockIcon } from './icons/ClockIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon'; 
import { SearchIcon } from './icons/SearchIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

const STATUS_CONFIG: Record<EnquiryStatus, { icon: React.ReactNode, label: string, color: string, ring: string, bg: string }> = {
    'New': { icon: <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"/>, label: 'New', color: 'text-purple-700', ring: 'ring-purple-600', bg: 'bg-purple-50' },
    'Contacted': { icon: <MegaphoneIcon className="w-4 h-4"/>, label: 'Contacted', color: 'text-amber-700', ring: 'ring-amber-500', bg: 'bg-amber-50' },
    'In Review': { icon: <SearchIcon className="w-4 h-4"/>, label: 'Review', color: 'text-blue-700', ring: 'ring-blue-500', bg: 'bg-blue-50' },
    'Inquiry Active': { icon: <div className="w-2 h-2 rounded-full bg-indigo-600"/>, label: 'Integrated', color: 'text-indigo-700', ring: 'ring-indigo-500', bg: 'bg-indigo-50' },
    'Completed': { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Converted', color: 'text-emerald-700', ring: 'ring-emerald-500', bg: 'bg-emerald-50' },
};

const ORDERED_STATUSES: EnquiryStatus[] = ['New', 'Contacted', 'In Review', 'Inquiry Active', 'Completed'];

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "JUST NOW";
    if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
    return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase();
};

const WorkflowStepper: React.FC<{ 
    currentStatus: EnquiryStatus, 
    onChange: (status: EnquiryStatus) => void,
    disabled?: boolean 
}> = ({ currentStatus, onChange, disabled }) => {
    const currentIndex = ORDERED_STATUSES.indexOf(currentStatus);
    return (
        <div className="w-full relative py-6 px-2 select-none">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/5 -z-10 rounded-full transform -translate-y-1/2"></div>
            <div 
                className="absolute top-1/2 left-4 h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500 -z-10 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform -translate-y-1/2 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                style={{ width: `calc(${(currentIndex / (ORDERED_STATUSES.length - 1)) * 100}% - 1rem)` }}
            ></div>
            <div className="flex justify-between items-center w-full relative">
                {ORDERED_STATUSES.map((step, index) => {
                    const isActive = index === currentIndex;
                    const isCompleted = index < currentIndex;
                    const config = STATUS_CONFIG[step];
                    return (
                        <button
                            key={step}
                            type="button"
                            onClick={() => !disabled && onChange(step)}
                            disabled={disabled}
                            className={`flex flex-col items-center gap-3 group focus:outline-none transition-all duration-500 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-700 z-10 
                                ${isActive ? `bg-background ${config.ring} ring-2 ring-offset-4 ring-offset-[#09090b] scale-125 shadow-[0_0_20px_rgba(139,92,246,0.3)]` : isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-[#1a1d23] border-white/5 text-white/10 hover:border-white/20'}
                            `}>
                                {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : (isActive ? config.icon : <div className="w-2 h-2 bg-current opacity-20 group-hover:opacity-100 transition-opacity"></div>)}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${isActive ? 'text-primary' : 'text-white/20 group-hover:text-white/40'}`}>{config.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const TimelineEntry: React.FC<{ item: TimelineItem }> = ({ item }) => {
    const isMessage = item.item_type === 'MESSAGE';
    return (
        <div className={`flex flex-col ${item.is_admin ? 'items-end' : 'items-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-700`}>
            {isMessage ? (
                <div className={`max-w-[85%] md:max-w-[75%] p-6 rounded-[2rem] text-sm leading-loose shadow-2xl ring-1 ring-white/5 transform transition-transform hover:scale-[1.01] ${item.is_admin ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/20' : 'bg-[#14161d] text-white/80 rounded-bl-none shadow-black/50'}`}>
                    <p className="whitespace-pre-wrap italic font-serif leading-relaxed">{item.details.message}</p>
                    <div className="flex items-center justify-between mt-6 opacity-40 pt-4 border-t border-white/10">
                         <span className="text-[9px] font-black uppercase tracking-[0.3em] truncate max-w-[150px]">{item.created_by_name}</span>
                         <span className="text-[9px] font-mono font-bold">{formatTimeAgo(item.created_at)}</span>
                    </div>
                </div>
            ) : (
                <div className="w-full flex justify-center my-6">
                    <div className="px-6 py-2 rounded-full bg-white/[0.02] border border-white/5 text-white/20 flex items-center gap-3 shadow-inner group hover:bg-white/5 transition-all">
                        <ClockIcon className="w-3.5 h-3.5 opacity-40 group-hover:text-primary transition-colors"/>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">{item.created_by_name} / {item.details.new || 'LIFECYCLE UPDATE'} / {formatTimeAgo(item.created_at)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

interface EnquiryDetailsModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onUpdate: () => void;
    currentBranchId?: number | null; 
}

const EnquiryDetailsModal: React.FC<EnquiryDetailsModalProps> = ({ enquiry, onClose, onUpdate }) => {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [formData, setFormData] = useState({
        status: enquiry.status,
        notes: enquiry.notes || '',
        applicant_name: enquiry.applicant_name || '',
    });
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({ timeline: true, saving: false, sending: false });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const commsEndRef = useRef<HTMLDivElement>(null);
    const primaryId = (enquiry.admission_id || enquiry.id).toString();

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!primaryId) return;
        if (!isSilent) setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_node_id: primaryId });
            if (error) throw error;
            setTimeline(data || []);
        } catch (e) {
            console.error("Timeline Sync Error:", formatError(e));
        } finally {
            if (!isSilent) setLoading(prev => ({ ...prev, timeline: false }));
        }
    }, [primaryId]);

    useEffect(() => {
        fetchTimeline();
        const channel = supabase.channel(`enquiry-terminal-${primaryId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiry_messages', filter: `admission_id=eq.${primaryId}` }, () => fetchTimeline(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'admission_audit_logs', filter: `admission_id=eq.${primaryId}` }, () => fetchTimeline(true))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchTimeline, primaryId]);

    useEffect(() => {
        if (commsEndRef.current) commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [timeline]);

    const handleSave = async (finalize: boolean = false) => {
        setLoading(prev => ({ ...prev, saving: true }));
        setSuccessMessage(null);
        try {
            if (finalize) {
                const { data, error: transitionError } = await supabase.rpc('admin_transition_admission', {
                    p_admission_id: primaryId,
                    p_next_status: 'Approved'
                });
                if (transitionError) throw transitionError;
                if (!data.success) throw new Error(data.message);
                
                onUpdate();
                onClose();
                return;
            }

            const { error } = await supabase.rpc('update_enquiry_lifecycle', {
                p_node_id: primaryId,
                p_status: formData.status,
                p_notes: formData.notes,
                p_metadata: { applicant_name: formData.applicant_name },
                p_finalize: false
            });
            
            if (error) throw error;
            
            setSuccessMessage("Node Data Persisted.");
            setTimeout(() => setSuccessMessage(null), 3000);
            onUpdate();
            await fetchTimeline(true);
        } catch (err) {
            alert(`Protocol Error: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = newMessage.trim();
        if (!msg || loading.sending) return;
        
        setLoading(prev => ({ ...prev, sending: true }));
        try {
            const { error } = await supabase.rpc('send_enquiry_message', { 
                p_node_id: primaryId, 
                p_message: msg 
            });
            
            if (error) throw error;
            setNewMessage('');
            await fetchTimeline(true);
        } catch (err) {
            alert("Transmit Failure: " + formatError(err));
        } finally {
            setLoading(prev => ({ ...prev, sending: false }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[150] p-4 md:p-6" onClick={onClose}>
            <div 
                className="bg-[#09090b] rounded-[3.5rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] w-full max-w-[1500px] h-[92vh] flex flex-col border border-white/10 overflow-hidden animate-in zoom-in-95 duration-700 ring-1 ring-white/5" 
                onClick={e => e.stopPropagation()}
            >
                {/* Station Header */}
                <header className="px-10 py-8 border-b border-white/5 bg-[#0f1115]/90 backdrop-blur-3xl flex justify-between items-center z-40 relative">
                    <div className="flex items-center gap-8">
                        <div className="relative group">
                             <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur opacity-40 group-hover:opacity-100 transition-opacity"></div>
                             <div className="relative p-4 bg-indigo-600 rounded-2xl text-white shadow-xl border border-white/10 group-hover:scale-105 group-hover:rotate-2 transition-all">
                                <ClipboardListIcon className="w-8 h-8" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-5xl font-serif font-black text-white tracking-tighter uppercase truncate leading-none">{formData.applicant_name}</h2>
                            <div className="flex items-center gap-4 mt-3">
                                <span className="text-[10px] font-mono font-black text-white/20 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 uppercase tracking-widest">ID: {primaryId.slice(0, 12)}</span>
                                <div className="h-4 w-px bg-white/10"></div>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-2">
                                    <ShieldCheckIcon className="w-4 h-4" /> Inquiry Lead Node
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         {successMessage && (
                             <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-4">
                                 {successMessage}
                             </div>
                         )}
                         <div className="hidden md:flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Uplink Stable</span>
                         </div>
                         <button onClick={onClose} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all"><XIcon className="w-8 h-8"/></button>
                    </div>
                </header>
                
                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
                    <div className="flex-1 flex flex-col bg-[#070708] relative">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')]"></div>
                        <div className="flex-grow overflow-y-auto p-10 md:p-16 space-y-10 custom-scrollbar relative z-10 flex flex-col">
                            {loading.timeline && timeline.length === 0 ? (
                                <div className="flex-grow flex flex-col items-center justify-center gap-6">
                                    <Spinner size="lg" className="text-primary" />
                                    <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.5em] animate-pulse">Establishing Secure Context</p>
                                </div>
                            ) : timeline.length === 0 ? (
                                <div className="flex-grow flex flex-col items-center justify-center opacity-20 text-center px-24">
                                    <MegaphoneIcon className="w-24 h-24 mb-10 text-white/20" />
                                    <h4 className="text-3xl font-serif font-black uppercase tracking-widest text-white leading-none">Payload Idle</h4>
                                    <p className="text-xl font-serif italic mt-6 text-white/40 leading-relaxed">No communication signatures found.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-12">
                                        {timeline.map((item, idx) => <TimelineEntry key={idx} item={item} />)}
                                    </div>
                                    <div ref={commsEndRef} className="h-1" />
                                </>
                            )}
                        </div>
                        
                        <div className="p-8 border-t border-white/5 bg-[#0a0a0c]/90 backdrop-blur-3xl relative z-20 shadow-2xl">
                            <form onSubmit={handleSendMessage} className="flex gap-6 items-end max-w-4xl mx-auto group">
                                <div className="flex-grow relative">
                                    <textarea 
                                        value={newMessage} 
                                        onChange={(e) => setNewMessage(e.target.value)} 
                                        onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) handleSendMessage(e); }}
                                        placeholder="Type message to parent..." 
                                        className="w-full p-6 pr-16 rounded-3xl bg-white/[0.02] border border-white/10 text-white text-base focus:border-primary/50 focus:bg-white/[0.04] outline-none resize-none shadow-inner italic font-serif h-18 transition-all"
                                        rows={1}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                        <SparklesIcon className="w-5 h-5 text-primary animate-pulse" />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading.sending || !newMessage.trim()} className="w-18 h-18 aspect-square bg-primary text-white rounded-[1.8rem] hover:bg-primary/90 transition-all flex items-center justify-center shadow-2xl shadow-primary/30 transform active:scale-90 disabled:opacity-20 disabled:grayscale group/send">
                                    {loading.sending ? <Spinner size="md" className="text-white"/> : <LocalSendIcon className="w-8 h-8 group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="w-full lg:w-[460px] bg-[#0c0d12] border-l border-white/10 flex flex-col h-full overflow-y-auto custom-scrollbar relative z-30 shadow-[-40px_0_80px_rgba(0,0,0,0.6)]">
                        <div className="p-12 space-y-14 flex-grow">
                            <section>
                                <h3 className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em] mb-8 flex items-center gap-3">
                                    <ClockIcon className="w-5 h-5 text-primary opacity-60"/> Lead Stage
                                </h3>
                                <div className="bg-black/40 rounded-[2.5rem] p-6 border border-white/5 shadow-inner ring-1 ring-white/5">
                                    <WorkflowStepper currentStatus={formData.status as EnquiryStatus} onChange={s => setFormData(prev => ({...prev, status: s}))} />
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em] flex items-center gap-3">
                                    <ClipboardListIcon className="w-5 h-5 text-amber-500 opacity-60"/> Notes
                                </h3>
                                <textarea 
                                    value={formData.notes} 
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Internal notes..."
                                    className="w-full h-48 p-8 rounded-[2.5rem] bg-amber-500/[0.02] border border-amber-500/10 text-sm italic font-serif leading-loose text-white/80 outline-none focus:border-amber-500/30 transition-all shadow-inner focus:bg-amber-500/[0.05]"
                                />
                            </section>

                            <section className="space-y-10">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                    <UsersIcon className="w-5 h-5 text-indigo-400 opacity-60" />
                                    <h3 className="text-[10px] font-black uppercase text-white/60 tracking-[0.4em]">Nominal Data</h3>
                                </div>
                                <div className="space-y-8">
                                    <div className="group">
                                        <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] block mb-3 ml-2 group-focus-within:text-primary transition-colors">Applicant Nominal</label>
                                        <input value={formData.applicant_name} onChange={e => setFormData({...formData, applicant_name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5 text-base font-serif font-bold text-white focus:border-primary/50 outline-none transition-all shadow-inner"/>
                                    </div>
                                    <div className="opacity-60 group relative cursor-not-allowed">
                                        <div className="absolute inset-0 z-10"></div>
                                        <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] block mb-3 ml-2">Arbiter Contact</label>
                                        <div className="w-full px-6 py-4 rounded-2xl bg-white/[0.01] border border-white/5 text-sm text-white/40 flex items-center gap-4 shadow-inner">
                                            <PhoneIcon className="w-5 h-5 opacity-30"/> 
                                            <span className="font-mono tracking-widest">{enquiry.parent_phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        
                        <div className="p-10 border-t border-white/5 bg-[#09090b]/98 backdrop-blur-3xl sticky bottom-0 z-50 flex gap-5 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
                            <button onClick={() => handleSave(false)} disabled={loading.saving} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white/70 font-black rounded-[1.8rem] text-[11px] uppercase tracking-[0.3em] transition-all border border-white/5 active:scale-95 disabled:opacity-30">
                                {loading.saving ? <Spinner size="sm"/> : 'Update Data'}
                            </button>
                            <button onClick={() => handleSave(true)} disabled={loading.saving} className="flex-1 py-5 bg-primary text-white font-black rounded-[1.8rem] text-[11px] uppercase tracking-[0.3em] shadow-[0_12px_40px_rgba(var(--primary),0.3)] hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 group/finalize">
                                {loading.saving ? <Spinner size="sm" className="text-white"/> : <><GraduationCapIcon className="w-5 h-5 group-hover/finalize:rotate-6 transition-transform" /> Apply Updates</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;
