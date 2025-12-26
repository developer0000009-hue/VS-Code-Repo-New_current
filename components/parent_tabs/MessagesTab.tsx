import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { MyEnquiry, TimelineItem, EnquiryStatus, Communication } from '../../types';
import Spinner from '../common/Spinner';
import { MegaphoneIcon } from '../icons/MegaphoneIcon'; 
import { SearchIcon } from '../icons/SearchIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { XIcon } from '../icons/XIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

type Tab = 'inbox' | 'enquiries';

const statusColors: { [key in EnquiryStatus]: string } = {
  'New': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  'Contacted': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  'In Review': 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  'Completed': 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const MessagesTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('inbox');
    const [enquiries, setEnquiries] = useState<MyEnquiry[]>([]);
    const [announcements, setAnnouncements] = useState<Communication[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEnquiry, setSelectedEnquiry] = useState<MyEnquiry | null>(null);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Communication | null>(null);
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [enqResult, msgResult] = await Promise.all([
                supabase.rpc('get_my_enquiries'),
                supabase.rpc('get_my_messages') 
            ]);
            setEnquiries(enqResult.data as MyEnquiry[] || []);
            setAnnouncements((msgResult.data as any[] || []).map(i => ({...i, id: i.message_id})));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleBack = () => {
        setIsMobileDetailOpen(false);
        setSelectedAnnouncement(null);
        setSelectedEnquiry(null);
    };

    if (loading && announcements.length === 0 && enquiries.length === 0) return (
        <div className="flex flex-col justify-center items-center py-40 space-y-6">
            <Spinner size="lg" className="text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Syncing Communication Cloud</p>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-16rem)] min-h-[500px] md:min-h-[700px] bg-[#0d0f14] border border-white/5 rounded-[2rem] md:rounded-[3.5rem] shadow-3xl overflow-hidden ring-1 ring-black/50 animate-in fade-in duration-1000">
            <div className="flex h-full relative">
                
                {/* --- RESPONSIVE LIST PANE --- */}
                <div className={`w-full lg:w-[400px] flex flex-col border-r border-white/5 bg-[#0a0a0c]/60 backdrop-blur-3xl transition-all duration-500 ${isMobileDetailOpen ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-6 md:p-8 border-b border-white/5 bg-[#0f1115]/50">
                        <div className="flex p-1 bg-black/40 rounded-full border border-white/5 shadow-inner">
                            {(['inbox', 'enquiries'] as Tab[]).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => { setActiveTab(t); setSelectedAnnouncement(null); setSelectedEnquiry(null); }}
                                    className={`flex-1 py-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-500 ${activeTab === t ? 'bg-[#1a1d24] text-primary shadow-2xl ring-1 ring-white/10 scale-[1.02]' : 'text-white/30 hover:text-white'}`}
                                >
                                    {t === 'inbox' ? 'Broadcasts' : 'Enquiries'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar bg-black/20 pb-20 md:pb-0">
                        {activeTab === 'inbox' ? (
                            announcements.length === 0 ? <EmptyState type="inbox" /> : announcements.map(msg => (
                                <button 
                                    key={msg.id} 
                                    onClick={() => { setSelectedAnnouncement(msg); setIsMobileDetailOpen(true); }}
                                    className={`w-full text-left p-6 md:p-8 border-b border-white/5 transition-all duration-500 group relative overflow-hidden active:scale-[0.98] ${selectedAnnouncement?.id === msg.id ? 'bg-[#12141a] z-10' : 'hover:bg-white/[0.02]'}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className={`font-black text-[9px] uppercase tracking-[0.2em] truncate pr-4 ${selectedAnnouncement?.id === msg.id ? 'text-primary' : 'text-white/40'}`}>{msg.sender_name || 'Admin'}</h4>
                                        <span className="text-[8px] font-bold text-white/20 whitespace-nowrap uppercase tracking-widest">{formatTimeAgo(msg.sent_at)}</span>
                                    </div>
                                    <p className={`text-sm md:text-base font-serif font-black tracking-tight truncate mb-2 ${selectedAnnouncement?.id === msg.id ? 'text-white' : 'text-white/80'}`}>{msg.subject}</p>
                                    <p className="text-xs text-white/30 line-clamp-2 leading-relaxed font-medium">{msg.body}</p>
                                    {selectedAnnouncement?.id === msg.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>}
                                </button>
                            ))
                        ) : (
                            enquiries.length === 0 ? <EmptyState type="enquiries" /> : enquiries.map(enq => (
                                <button 
                                    key={enq.id} 
                                    onClick={() => { setSelectedEnquiry(enq); setIsMobileDetailOpen(true); }}
                                    className={`w-full text-left p-6 md:p-8 border-b border-white/5 transition-all duration-500 group relative overflow-hidden active:scale-[0.98] ${selectedEnquiry?.id === enq.id ? 'bg-[#12141a] z-10' : 'hover:bg-white/[0.02]'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className={`font-black text-[9px] uppercase tracking-[0.2em] truncate pr-4 ${selectedEnquiry?.id === enq.id ? 'text-primary' : 'text-white/40'}`}>{enq.applicant_name}</h4>
                                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{formatTimeAgo(enq.last_updated)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border shadow-inner tracking-widest ${statusColors[enq.status] || 'bg-white/5 text-white/20'}`}>
                                            {enq.status}
                                        </span>
                                        <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Grade {enq.grade}</span>
                                    </div>
                                    {selectedEnquiry?.id === enq.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* --- READING PANE (DESKTOP & MOBILE TRANSITION) --- */}
                <div className={`flex-grow bg-[#0a0a0c] flex flex-col transition-all duration-500 ${isMobileDetailOpen ? 'fixed inset-0 z-[60] lg:static' : 'hidden lg:flex'}`}>
                    {activeTab === 'inbox' ? (
                        selectedAnnouncement ? <AnnouncementDetail announcement={selectedAnnouncement} onClose={handleBack} /> : <ReadingStandby type="inbox" />
                    ) : (
                        selectedEnquiry ? <ConversationView enquiry={selectedEnquiry} onBack={handleBack} refreshEnquiries={fetchData} /> : <ReadingStandby type="enquiries" />
                    )}
                </div>
            </div>
        </div>
    );
};

const EmptyState = ({ type }: { type: Tab }) => (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            {type === 'inbox' ? <MegaphoneIcon className="w-8 h-8" /> : <SearchIcon className="w-8 h-8" />}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Registry Standby</p>
        <p className="text-xs mt-2 font-medium italic">No active telemetry found for this channel.</p>
    </div>
);

const ReadingStandby = ({ type }: { type: Tab }) => (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/10 shadow-2xl relative ring-1 ring-white/5 group">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {type === 'inbox' ? <MegaphoneIcon className="w-10 h-10 text-white/20 group-hover:text-primary transition-colors" /> : <CommunicationIcon className="w-10 h-10 text-white/20 group-hover:text-primary transition-colors" />}
        </div>
        <h3 className="text-3xl font-serif font-black text-white tracking-tight uppercase leading-none mb-4">Payload Standby</h3>
        <p className="text-white/40 text-lg font-medium leading-relaxed italic max-w-sm">Select an item from the left registry to establish a high-fidelity connection.</p>
    </div>
);

const AnnouncementDetail = ({ announcement, onClose }: any) => (
    <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-700">
         <div className="px-6 md:px-12 py-6 md:py-10 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-3xl flex justify-between items-center relative z-20 shadow-xl">
            <button onClick={onClose} className="p-3 -ml-2 rounded-2xl bg-white/5 text-white/40 hover:text-white transition-all"><ChevronLeftIcon className="h-6 w-6"/></button>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Decrypted Broadcast</span>
            <div className="w-10"></div> 
         </div>
         <div className="flex-grow overflow-y-auto p-6 md:p-20 custom-scrollbar bg-[#0a0a0c]">
             <div className="max-w-3xl mx-auto space-y-12">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-2xl font-black shadow-inner border border-primary/20 uppercase">
                        {announcement.sender_name?.[0] || 'A'}
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-black text-white leading-none">{announcement.sender_name || 'System'}</h2>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2">{announcement.sender_role || 'Institutional Node'}</p>
                    </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-serif font-black text-white leading-[1.1] tracking-tighter uppercase">{announcement.subject}</h1>
                <div className="w-20 h-1.5 bg-primary/40 rounded-full"></div>
                <div className="text-white/60 text-lg md:text-xl leading-relaxed font-serif italic border-l-2 border-white/10 pl-8 whitespace-pre-wrap">{announcement.body}</div>
             </div>
         </div>
    </div>
);

const ConversationView = ({ enquiry, onBack, refreshEnquiries }: any) => {
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchTimeline = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: enquiry.id });
        if (!error) setTimeline(data || []);
        setLoading(false);
    }, [enquiry.id]);

    useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [timeline]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;
        setSending(true);
        const { error } = await supabase.rpc('send_enquiry_message', { p_enquiry_id: enquiry.id, p_message: newMessage });
        if (!error) {
            setNewMessage('');
            fetchTimeline();
            refreshEnquiries();
        }
        setSending(true);
    };

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-700">
            <header className="p-6 md:p-8 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-3xl flex items-center justify-between shadow-xl">
                <button onClick={onBack} className="p-2 -ml-2 rounded-xl bg-white/5 text-white/40 hover:text-white lg:hidden transition-all"><ChevronLeftIcon className="h-6 w-6"/></button>
                <div className="min-w-0 px-4">
                    <h3 className="font-serif font-black text-xl md:text-2xl text-white truncate uppercase tracking-tight">{enquiry.applicant_name}</h3>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Grade {enquiry.grade} Enquiry Node</p>
                </div>
                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border shadow-inner tracking-widest ${statusColors[enquiry.status]}`}>{enquiry.status}</span>
            </header>

            <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 md:p-10 space-y-6 bg-black/20 custom-scrollbar">
                {loading ? <div className="flex justify-center py-10"><Spinner /></div> : timeline.map((item, idx) => (
                    <div key={idx} className={`flex ${item.is_admin ? 'justify-start' : 'justify-end'}`}>
                         <div className={`max-w-[85%] md:max-w-[70%] p-4 md:p-6 rounded-[1.8rem] text-sm md:text-base leading-relaxed shadow-2xl ring-1 ring-white/5 ${
                            item.is_admin ? 'bg-white/5 text-white/70 rounded-bl-none' : 'bg-primary text-white rounded-br-none shadow-primary/20'
                         }`}>
                             {item.item_type === 'MESSAGE' ? item.details.message : 'System Event Notification'}
                             <div className={`text-[9px] font-black uppercase mt-3 tracking-widest opacity-40 ${item.is_admin ? 'text-left' : 'text-right'}`}>
                                {item.created_by_name} • {formatTimeAgo(item.created_at)}
                             </div>
                         </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-6 md:p-8 border-t border-white/5 bg-[#0f1115]/80 backdrop-blur-3xl flex gap-4 shadow-3xl">
                <input 
                    type="text" 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Enter your response protocol..."
                    className="flex-grow p-4 md:p-5 rounded-2xl md:rounded-3xl bg-black/40 border border-white/10 text-white placeholder:text-white/10 focus:border-primary outline-none transition-all shadow-inner font-medium text-sm md:text-base"
                />
                <button type="submit" disabled={!newMessage.trim() || sending} className="px-8 py-4 md:px-10 md:py-5 bg-primary text-white font-black text-xs md:text-sm rounded-2xl md:rounded-3xl shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all uppercase tracking-[0.2em] active:scale-95 disabled:opacity-30">
                    Send
                </button>
            </form>
        </div>
    );
};

export default MessagesTab;