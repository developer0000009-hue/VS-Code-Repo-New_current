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
import { SettingsIcon } from './icons/SettingsIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { SearchIcon } from './icons/SearchIcon';

const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const STATUS_CONFIG: Record<string, { icon: React.ReactNode, label: string, color: string, ring: string, bg: string }> = {
    'ENQUIRY_ACTIVE': { icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>, label: 'Active', color: 'text-blue-700', ring: 'ring-blue-600', bg: 'bg-blue-50' },
    'ENQUIRY_VERIFIED': { icon: <ShieldCheckIcon className="w-4 h-4"/>, label: 'Verified', color: 'text-teal-700', ring: 'ring-teal-500', bg: 'bg-teal-50' },
    'ENQUIRY_IN_PROGRESS': { icon: <div className="w-2 h-2 rounded-full bg-purple-600"/>, label: 'In Progress', color: 'text-purple-700', ring: 'ring-purple-500', bg: 'bg-purple-50' },
    'CONVERTED': { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Converted', color: 'text-emerald-700', ring: 'ring-emerald-500', bg: 'bg-emerald-50' },
};

const ORDERED_STATUSES: EnquiryStatus[] = ['ENQUIRY_ACTIVE', 'ENQUIRY_VERIFIED', 'ENQUIRY_IN_PROGRESS', 'CONVERTED'];

const TimelineEntry: React.FC<{ item: TimelineItem }> = ({ item }) => {
    if (item.item_type === 'MESSAGE') {
        const isParent = !item.is_admin;
        return (
             <div className={`flex items-end gap-4 animate-in fade-in-up duration-500 w-full ${isParent ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-4 ${isParent ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md text-white flex-shrink-0 ${isParent ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                        {item.created_by_name.charAt(0)}
                    </div>
                    <div className={`p-5 rounded-[1.5rem] max-w-lg shadow-lg ${isParent ? 'bg-[#1a1d23] rounded-br-none' : 'bg-[#221f30] rounded-bl-none'}`}>
                         <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{item.details.message}</p>
                         <p className="text-[10px] text-white/30 mt-3 text-right">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex justify-center my-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5 shadow-inner">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                    {item.item_type.replace(/_/g, ' ')} / {new Date(item.created_at).toLocaleTimeString()}
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
    const [formData, setFormData] = useState({
        status: enquiry.status,
        notes: enquiry.notes || '',
        applicant_name: enquiry.applicant_name || '',
    });
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState({ timeline: true, saving: false, converting: false });
    const commsEndRef = useRef<HTMLDivElement>(null);

    const fetchTimeline = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(prev => ({ ...prev, timeline: true }));
        try {
            const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_node_id: enquiry.id });
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

    const handleSaveStatus = async (newStatus: EnquiryStatus) => {
        setLoading(prev => ({ ...prev, saving: true }));
        try {
            const { error } = await supabase
                .from('enquiries')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', enquiry.id);
            
            if (error) throw error;
            setFormData(prev => ({ ...prev, status: newStatus }));
            onUpdate();
            await fetchTimeline(true);
        } catch (err) {
            alert(`Save failed: ${formatError(err)}`);
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const handleConvert = async () => {
        setLoading(prev => ({ ...prev, converting: true }));
        try {
            const result = await EnquiryService.convertToAdmission(enquiry.id);
            if (result.success) {
                onUpdate();
                onClose();
                onNavigate?.('Admissions');
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
        if (!msg) return;
        
        try {
            const { error } = await supabase.rpc('send_enquiry_message', { 
                p_node_id: enquiry.id, 
                p_message: msg 
            });
            if (error) throw error;
            setNewMessage('');
            await fetchTimeline(true);
        } catch (err) {
            alert("Transmit Failure: " + formatError(err));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[150] p-4 md:p-6" onClick={onClose}>
            <div className="bg-[#09090b] rounded-[3.5rem] shadow-2xl w-full max-w-[1500px] h-[92vh] flex flex-col border border-white/10 overflow-hidden ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
                
                <header className="px-10 py-8 border-b border-white/5 bg-[#0f1115]/90 flex justify-between items-center z-40 relative">
                    <div className="flex items-center gap-8">
                        <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl border border-white/10">
                            <ClipboardListIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-5xl font-serif font-black text-white tracking-tighter uppercase leading-none">{enquiry.applicant_name}</h2>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-3">Enquiry Domain Node</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-full bg-white/5 text-white/30 hover:text-white transition-all"><XIcon className="w-8 h-8"/></button>
                </header>
                
                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    <div className="flex-1 flex flex-col bg-[#070708] relative">
                        <div className="flex-grow overflow-y-auto p-10 md:p-16 space-y-10 custom-scrollbar flex flex-col">
                            {loading.timeline && timeline.length === 0 ? (
                                <Spinner size="lg" className="m-auto text-primary" />
                            ) : (
                                <div className="space-y-12">
                                    {timeline.map((item, idx) => <TimelineEntry key={idx} item={item} />)}
                                    <div ref={commsEndRef} />
                                </div>
                            )}
                        </div>
                        
                        <div className="p-8 border-t border-white/5 bg-[#0a0a0c]/90">
                            <form onSubmit={handleSendMessage} className="flex gap-6 items-end max-w-4xl mx-auto">
                                <textarea 
                                    value={newMessage} 
                                    onChange={(e) => setNewMessage(e.target.value)} 
                                    placeholder="Type message to parent..." 
                                    className="flex-grow p-6 rounded-3xl bg-white/[0.02] border border-white/10 text-white outline-none resize-none font-serif h-18"
                                    rows={1}
                                />
                                <button type="submit" className="w-18 h-18 bg-primary text-white rounded-[1.8rem] flex items-center justify-center shadow-xl transform active:scale-90">
                                    <LocalSendIcon className="w-8 h-8" />
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="w-full lg:w-[460px] bg-[#0c0d12] border-l border-white/10 p-12 space-y-12 overflow-y-auto custom-scrollbar">
                        <section>
                            <h3 className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em] mb-8">Enquiry Lifecycle</h3>
                            <div className="space-y-3">
                                {ORDERED_STATUSES.map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => handleSaveStatus(s)}
                                        disabled={loading.saving || enquiry.status === 'CONVERTED'}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${enquiry.status === s ? 'bg-primary/10 border-primary text-white shadow-lg' : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5'}`}
                                    >
                                        {STATUS_CONFIG[s]?.icon}
                                        <span className="text-xs font-black uppercase tracking-widest">{STATUS_CONFIG[s]?.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {enquiry.status !== 'CONVERTED' && (
                            <section className="pt-10 border-t border-white/5">
                                <button 
                                    onClick={handleConvert}
                                    disabled={loading.converting || enquiry.status === 'ENQUIRY_ACTIVE'}
                                    className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2rem] text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                                >
                                    {loading.converting ? <Spinner size="sm" className="text-white"/> : <><GraduationCapIcon className="w-5 h-5 inline mr-3" /> Convert to Admission</>}
                                </button>
                                {enquiry.status === 'ENQUIRY_ACTIVE' && <p className="text-[9px] text-amber-500/60 font-bold uppercase mt-4 text-center">Identity verification required before conversion.</p>}
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;