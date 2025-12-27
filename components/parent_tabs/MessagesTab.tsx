
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
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';

/**
 * Enterprise Typography & Spacing System
 * Hero Title: font-serif black
 * Metadata: text-[9px] uppercase tracking-[0.3em]
 * Transitions: 300ms ease-out
 */

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

    // Auto-selection logic: Selects the top item if nothing is focused
    const autoSelectFirst = useCallback((tab: Tab, currentAnnouncements: Communication[], currentEnquiries: MyEnquiry[]) => {
        if (tab === 'inbox' && currentAnnouncements.length > 0 && !selectedAnnouncement) {
            setSelectedAnnouncement(currentAnnouncements[0]);
        } else if (tab === 'enquiries' && currentEnquiries.length > 0 && !selectedEnquiry) {
            setSelectedEnquiry(currentEnquiries[0]);
        }
    }, [selectedAnnouncement, selectedEnquiry]);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [enqResult, msgResult] = await Promise.all([
                supabase.rpc('get_my_enquiries'),
                supabase.rpc('get_my_messages') 
            ]);
            
            const fetchedEnquiries = (enqResult.data as MyEnquiry[]) || [];
            const fetchedAnnouncements = ((msgResult.data as any[]) || []).map(i => ({...i, id: i.message_id || i.id}));
            
            setEnquiries(fetchedEnquiries);
            setAnnouncements(fetchedAnnouncements);

            // Intelligence: Auto-focus first payload on initial load
            if (!isSilent) {
                if (activeTab === 'inbox' && fetchedAnnouncements.length > 0) {
                    setSelectedAnnouncement(fetchedAnnouncements[0]);
                } else if (activeTab === 'enquiries' && fetchedEnquiries.length > 0) {
                    setSelectedEnquiry(fetchedEnquiries[0]);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { 
        fetchData(); 

        // Real-time synchronization for the communications pipeline
        const channel = supabase
            .channel('public:communications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'communications' }, () => {
                fetchData(true);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchData]);

    const handleTabSwitch = (t: Tab) => {
        setActiveTab(t);
        setIsMobileDetailOpen(false);
        // On switch, auto-select if nothing selected for that tab
        if (t === 'inbox' && announcements.length > 0) setSelectedAnnouncement(announcements[0]);
        if (t === 'enquiries' && enquiries.length > 0) setSelectedEnquiry(enquiries[0]);
    };

    const handleBack = () => {
        setIsMobileDetailOpen(false);
    };

    if (loading && announcements.length === 0 && enquiries.length === 0) return (
        <div className="flex flex-col justify-center items-center py-40 space-y-8">
            <Spinner size="lg" className="text-primary" />
            <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Synchronizing Communication Pipeline</p>
                <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest">v9.5 Secure Handshake</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-16rem)] min-h-[500px] md:min-h-[750px] bg-[#0d0f14] border border-white/5 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_48px_128px_-24px_rgba(0,0,0,1)] overflow-hidden ring-1 ring-black/50 animate-in fade-in duration-1000">
            <div className="flex h-full relative">
                
                {/* --- REGISTRY PANE: THE LEFT LIST --- */}
                <div className={`w-full lg:w-[420px] flex flex-col border-r border-white/5 bg-[#0a0a0c]/60 backdrop-blur-3xl transition-all duration-500 z-20 ${isMobileDetailOpen ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-8 border-b border-white/5 bg-[#0f1115]/50 backdrop-blur-md">
                        <div className="flex p-1.5 bg-black/40 rounded-full border border-white/5 shadow-inner">
                            {(['inbox', 'enquiries'] as Tab[]).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => handleTabSwitch(t)}
                                    className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.25em] rounded-full transition-all duration-500 relative overflow-hidden group ${activeTab === t ? 'bg-[#1a1d24] text-primary shadow-2xl ring-1 ring-white/10 scale-[1.02]' : 'text-white/20 hover:text-white/40'}`}
                                >
                                    <span className="relative z-10">{t === 'inbox' ? 'Broadcasts' : 'Enquiries'}</span>
                                    {activeTab === t && <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar bg-black/20 pb-20 md:pb-0">
                        {activeTab === 'inbox' ? (
                            announcements.length === 0 ? <EmptyState type="inbox" /> : announcements.map((msg, idx) => (
                                <button 
                                    key={msg.id} 
                                    onClick={() => { setSelectedAnnouncement(msg); setIsMobileDetailOpen(true); }}
                                    className={`w-full text-left p-8 border-b border-white/5 transition-all duration-300 group relative overflow-hidden active:scale-[0.98] ${selectedAnnouncement?.id === msg.id ? 'bg-[#12141a] z-10 shadow-2xl' : 'hover:bg-white/[0.02]'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg border transition-colors ${selectedAnnouncement?.id === msg.id ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'}`}>
                                                <MegaphoneIcon className="w-3.5 h-3.5" />
                                            </div>
                                            <h4 className={`font-black text-[10px] uppercase tracking-[0.2em] truncate pr-4 transition-colors ${selectedAnnouncement?.id === msg.id ? 'text-primary' : 'text-white/30'}`}>{msg.sender_name || 'Authority'}</h4>
                                        </div>
                                        <span className="text-[9px] font-bold text-white/20 whitespace-nowrap uppercase tracking-widest">{formatTimeAgo(msg.sent_at)}</span>
                                    </div>
                                    <p className={`text-[16px] font-serif font-black tracking-tight truncate mb-2 transition-colors ${selectedAnnouncement?.id === msg.id ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{msg.subject}</p>
                                    <p className="text-[13px] text-white/20 line-clamp-2 leading-relaxed font-medium group-hover:text-white/40 transition-colors">{msg.body}</p>
                                    
                                    {/* Intelligence Marker: Glow indicator for active selection */}
                                    {selectedAnnouncement?.id === msg.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_20px_rgba(var(--primary),0.8)] animate-in slide-in-from-left-4"></div>
                                    )}
                                </button>
                            ))
                        ) : (
                            enquiries.length === 0 ? <EmptyState type="enquiries" /> : enquiries.map(enq => (
                                <button 
                                    key={enq.id} 
                                    onClick={() => { setSelectedEnquiry(enq); setIsMobileDetailOpen(true); }}
                                    className={`w-full text-left p-8 border-b border-white/5 transition-all duration-300 group relative overflow-hidden active:scale-[0.98] ${selectedEnquiry?.id === enq.id ? 'bg-[#12141a] z-10 shadow-2xl' : 'hover:bg-white/[0.02]'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                             <div className={`p-1.5 rounded-lg border transition-colors ${selectedEnquiry?.id === enq.id ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'}`}>
                                                <CommunicationIcon className="w-3.5 h-3.5" />
                                            </div>
                                            <h4 className={`font-black text-[10px] uppercase tracking-[0.2em] truncate pr-4 transition-colors ${selectedEnquiry?.id === enq.id ? 'text-indigo-400' : 'text-white/30'}`}>{enq.applicant_name}</h4>
                                        </div>
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{formatTimeAgo(enq.last_updated)}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border shadow-inner tracking-widest transition-all ${statusColors[enq.status] || 'bg-white/5 text-white/20 border-white/5'}`}>
                                            {enq.status}
                                        </span>
                                        <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.25em]">Grade {enq.grade} Node</span>
                                    </div>
                                    {selectedEnquiry?.id === enq.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-in slide-in-from-left-4"></div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* --- PAYLOAD PANE: THE RIGHT CONTENT --- */}
                <div className={`flex-grow bg-[#09090b] flex flex-col transition-all duration-700 relative ${isMobileDetailOpen ? 'fixed inset-0 z-[60] lg:static' : 'hidden lg:flex'}`}>
                    
                    {/* Ambient Background Accents */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/5 rounded-full blur-[120px] pointer-events-none opacity-30"></div>

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
    <div className="flex flex-col items-center justify-center py-40 px-10 text-center opacity-40 animate-in fade-in duration-1000">
        <div className="w-20 h-20 bg-white/[0.03] rounded-[1.8rem] flex items-center justify-center mb-8 border border-white/5 shadow-inner">
            {type === 'inbox' ? <MegaphoneIcon className="w-10 h-10 text-white/20" /> : <SearchIcon className="w-10 h-10 text-white/20" />}
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white leading-relaxed">Registry Standby</p>
        <p className="text-[14px] mt-4 font-serif italic text-white/30 max-w-xs mx-auto leading-relaxed">No active telemetry has been detected for this communication node.</p>
    </div>
);

const ReadingStandby = ({ type }: { type: Tab }) => (
    <div className="flex flex-col items-center justify-center h-full p-20 text-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="w-32 h-32 bg-white/[0.02] rounded-[3.5rem] flex items-center justify-center mb-12 border border-white/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            {type === 'inbox' ? <MegaphoneIcon className="w-14 h-14 text-white/10 group-hover:text-primary group-hover:scale-110 transition-all duration-700" /> : <CommunicationIcon className="w-14 h-14 text-white/10 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-700" />}
        </div>
        <h3 className="text-4xl font-serif font-black text-white tracking-tight uppercase leading-none mb-6">Payload <span className="text-white/20 italic">Standby.</span></h3>
        <p className="text-white/40 text-[18px] font-medium leading-relaxed italic max-w-sm font-serif">Select an entry from the registry to decrypt and establish a high-fidelity connection.</p>
    </div>
);

const AnnouncementDetail = ({ announcement, onClose }: any) => (
    <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-700 relative z-10">
         <div className="px-8 md:px-16 py-8 md:py-12 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-3xl flex justify-between items-center relative z-20 shadow-2xl">
            <div className="flex items-center gap-6">
                <button onClick={onClose} className="p-4 -ml-4 rounded-2xl bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all active:scale-95"><ChevronLeftIcon className="h-6 w-6"/></button>
                <div>
                    <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] leading-none mb-1">Authenticated Broadcast</h3>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{formatTimeAgo(announcement.sent_at)} • Log ID: {announcement.id?.slice(0,8)}</p>
                </div>
            </div>
            <button className="p-3.5 rounded-2xl bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all"><XIcon className="w-6 h-6"/></button>
         </div>
         
         <div className="flex-grow overflow-y-auto p-8 md:p-24 custom-scrollbar bg-transparent">
             <div className="max-w-4xl mx-auto space-y-16">
                <div className="flex items-center gap-8 group">
                    <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-primary/30 to-indigo-600/30 text-white flex items-center justify-center text-3xl font-serif font-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 transition-transform group-hover:rotate-3 duration-500">
                        {announcement.sender_name?.[0] || 'A'}
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-black text-white leading-none tracking-tight">{announcement.sender_name || 'Institutional Hub'}</h2>
                        <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mt-3 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 w-fit">{announcement.sender_role || 'System Node'}</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <h1 className="text-5xl md:text-8xl font-serif font-black text-white leading-[0.95] tracking-tighter uppercase drop-shadow-2xl">
                        {announcement.subject}
                    </h1>
                    <div className="w-32 h-2 bg-gradient-to-r from-primary to-transparent rounded-full opacity-60"></div>
                    <div className="text-white/60 text-[20px] md:text-[24px] leading-relaxed font-serif italic border-l-4 border-white/5 pl-12 whitespace-pre-wrap selection:bg-primary/20 selection:text-primary">
                        {announcement.body}
                    </div>
                </div>
                
                <div className="pt-20 opacity-20 hover:opacity-100 transition-opacity duration-700">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-white">
                        <ShieldCheckIcon className="w-5 h-5 text-emerald-500" /> Integrity Confirmed • Gurukul OS v9.5 Deployment
                    </div>
                </div>
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
            await fetchTimeline();
            refreshEnquiries(true);
        }
        setSending(false);
    };

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-700 relative z-10">
            <header className="p-8 md:p-12 border-b border-white/5 bg-[#0f1115]/90 backdrop-blur-3xl flex items-center justify-between shadow-2xl relative z-20">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-3.5 -ml-2 rounded-2xl bg-white/5 text-white/30 hover:text-white transition-all active:scale-95"><ChevronLeftIcon className="h-7 w-7"/></button>
                    <div className="min-w-0">
                        <h3 className="font-serif font-black text-2xl md:text-4xl text-white truncate uppercase tracking-tighter leading-none">{enquiry.applicant_name}</h3>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-3">Node context: Grade {enquiry.grade} Communication Chain</p>
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    <span className={`text-[10px] font-black uppercase px-5 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl tracking-[0.2em] ${statusColors[enquiry.status] || 'bg-white/5 text-white/20'}`}>
                        {enquiry.status}
                    </span>
                </div>
            </header>

            <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 md:p-16 space-y-8 bg-black/40 custom-scrollbar relative">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Spinner className="text-indigo-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/10">Establishing Secure Uplink</p>
                    </div>
                ) : timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/10 text-center space-y-6">
                        <CommunicationIcon className="w-20 h-20 opacity-20" />
                        <p className="font-serif italic text-lg max-w-xs">Chain initialized. Awaiting institutional response.</p>
                    </div>
                ) : timeline.map((item, idx) => (
                    <div key={idx} className={`flex ${item.is_admin ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-500`} style={{ animationDelay: `${idx * 20}ms` }}>
                         <div className={`max-w-[85%] md:max-w-[65%] p-6 md:p-8 rounded-[2.2rem] text-[15px] md:text-[17px] leading-relaxed shadow-3xl ring-1 ring-white/5 transition-all hover:ring-white/10 ${
                            item.is_admin 
                            ? 'bg-[#1a1d24]/80 backdrop-blur-md text-white/80 rounded-bl-none' 
                            : 'bg-gradient-to-br from-primary to-indigo-700 text-white rounded-br-none shadow-[0_20px_50px_rgba(var(--primary),0.3)]'
                         }`}>
                             <p className="font-medium selection:bg-white/20">{item.item_type === 'MESSAGE' ? item.details.message : 'System Handshake Acknowledged'}</p>
                             <div className={`text-[9px] font-black uppercase mt-6 tracking-[0.3em] opacity-40 border-t border-white/5 pt-4 flex items-center gap-2 ${item.is_admin ? 'justify-start' : 'justify-end'}`}>
                                <CheckCircleIcon className="w-3 h-3 text-emerald-400" /> {item.created_by_name} • {formatTimeAgo(item.created_at)}
                             </div>
                         </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-8 md:p-12 border-t border-white/5 bg-[#0f1115]/95 backdrop-blur-3xl flex gap-6 shadow-[0_-24px_48px_-12px_rgba(0,0,0,0.5)] z-20">
                <input 
                    type="text" 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Enter message text here..."
                    className="flex-grow p-5 md:p-7 rounded-[2rem] md:rounded-[2.5rem] bg-black/60 border border-white/10 text-white placeholder:text-white/10 focus:border-primary/50 focus:bg-black/80 outline-none transition-all shadow-inner font-medium text-base md:text-lg"
                />
                <button 
                    type="submit" 
                    disabled={!newMessage.trim() || sending} 
                    className="h-16 w-16 md:h-20 md:w-20 bg-primary text-white flex items-center justify-center rounded-[2rem] md:rounded-[2.5rem] shadow-[0_15px_30px_rgba(var(--primary),0.3)] hover:bg-primary/90 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                >
                    {sending ? <Spinner size="sm" className="text-white" /> : <LocalSendIcon className="w-8 h-8" />}
                </button>
            </form>
        </div>
    );
};

const LocalSendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

export default MessagesTab;
