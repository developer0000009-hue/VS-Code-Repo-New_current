import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { MyEnquiry, TimelineItem, EnquiryStatus, Communication } from '../../types';
import Spinner from '../common/Spinner';
import { BellIcon } from '../icons/BellIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon'; 
import { SchoolIcon } from '../icons/SchoolIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { XIcon } from '../icons/XIcon';
// Fix: Added missing icon imports
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

type Tab = 'inbox' | 'enquiries';

const statusColors: { [key in EnquiryStatus]: string } = {
  'New': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  'Contacted': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  'In Review': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};

const TimelineEvent: React.FC<{ item: TimelineItem }> = ({ item }) => {
    let content = null;
    switch (item.details.type) {
        case 'STATUS_CHANGE':
            content = <>Status changed from <span className="font-semibold text-foreground">{item.details.data?.old}</span> to <span className="font-semibold text-foreground">{item.details.data?.new}</span></>;
            break;
        case 'NOTE_ADDED':
            content = <>added a new internal note.</>;
            break;
        case 'ADMISSION_STATUS_CHANGE':
            content = <>updated the admission status to <span className="font-semibold text-foreground">{item.details.data?.status}</span></>;
            break;
        case 'DOCUMENTS_REQUESTED':
            const docs = item.details.data?.documents as string[] || [];
            const message = item.details.data?.message;
            return (
                <div className="flex justify-center my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-card border border-border p-5 rounded-2xl shadow-sm max-w-md w-full relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                         <div className="flex items-center gap-2 mb-3 text-primary">
                            <DocumentTextIcon className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Document Verification Request</span>
                         </div>
                        <p className="text-sm text-muted-foreground mb-3 font-medium"><span className="font-bold text-foreground">{item.created_by_name}</span> requires the following:</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {docs.map((doc, i) => (
                                <span key={i} className="px-2 py-1 bg-muted rounded text-[10px] font-bold text-foreground/70 border border-border">{doc}</span>
                            ))}
                        </div>
                        {message && (
                            <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Administrative Note</p>
                                <p className="text-sm italic text-muted-foreground/80 font-medium">"{message}"</p>
                            </div>
                        )}
                        <p className="text-[9px] text-muted-foreground/50 mt-4 text-right">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                </div>
            );
        default:
            return null;
    }
    
    if (!content) return null;

    return (
        <div className="flex justify-center my-3 animate-in fade-in slide-in-from-top-1 duration-300">
            <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full border border-border/60 shadow-sm">
                <span className="text-foreground">{item.created_by_name}</span> {content} • <span className="opacity-60">{formatTimeAgo(item.created_at)}</span>
            </span>
        </div>
    );
};

const ConversationView: React.FC<{ enquiry: MyEnquiry, onBack: () => void, refreshEnquiries: () => void }> = ({ enquiry, onBack, refreshEnquiries }) => {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const commsEndRef = useRef<HTMLDivElement>(null);

    const fetchTimeline = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_enquiry_timeline', { p_enquiry_id: enquiry.id });
        if (!error && data) {
            setTimeline(data);
        }
        setLoading(false);
    }, [enquiry.id]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);
    
    useEffect(() => {
        commsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [timeline]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setIsSending(true);
        const { error } = await supabase.rpc('send_enquiry_message', {
            p_enquiry_id: enquiry.id,
            p_message: newMessage,
        });
        if (error) {
            alert(error.message);
        } else {
            setNewMessage('');
            await fetchTimeline();
            refreshEnquiries(); 
        }
        setIsSending(false);
    };

    return (
        <div className="flex flex-col h-full bg-card rounded-r-2xl border-l border-border/40">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 lg:px-8 lg:py-6 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground">
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <div>
                        <h2 className="text-base lg:text-xl font-black text-foreground tracking-tight uppercase font-serif">{enquiry.applicant_name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Enquiry Registry</span>
                            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">ID: #{enquiry.id}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border shadow-sm ${statusColors[enquiry.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {enquiry.status}
                    </span>
                </div>
            </div>

            {/* Timeline / Chat Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-muted/5 custom-scrollbar">
                 {loading ? <div className="flex flex-col justify-center items-center h-full space-y-3"><Spinner size="lg" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Decrypting secure line...</p></div> : 
                 timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-10 text-center opacity-30">
                        <CommunicationIcon className="w-16 h-16 mb-4" />
                        <h3 className="font-bold text-lg">No interaction history</h3>
                        <p className="text-sm max-w-xs mx-auto">Messages sent by the school or your responses will appear here for audit tracking.</p>
                    </div>
                 ) : timeline.map((item) =>
                    item.item_type === 'MESSAGE' ? (
                        <div key={`msg-${item.id}`} className={`flex flex-col ${!item.is_admin ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[85%] lg:max-w-[70%] p-5 rounded-[1.5rem] shadow-md relative ${!item.is_admin ? 'bg-primary text-primary-foreground rounded-tr-none shadow-primary/20' : 'bg-card border border-border/80 text-foreground rounded-tl-none shadow-black/5'}`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{item.details.message}</p>
                            </div>
                             <p className={`text-[9px] font-bold uppercase tracking-wider mt-2 px-1 ${!item.is_admin ? 'text-right text-muted-foreground' : 'text-left text-muted-foreground'}`}>
                                {item.created_by_name} • {formatTimeAgo(item.created_at)}
                            </p>
                        </div>
                    ) : <TimelineEvent key={`evt-${item.id}`} item={item} />
                )}
                <div ref={commsEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 lg:p-6 border-t border-border bg-card/80 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="flex gap-4 items-end max-w-4xl mx-auto">
                    <div className="relative flex-grow">
                        <textarea 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)} 
                            placeholder="Type a response to the school..." 
                            className="w-full p-4 pr-12 bg-muted/30 border border-input rounded-[1.5rem] focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-background outline-none transition-all resize-none text-sm min-h-[58px] max-h-[150px] font-medium leading-relaxed shadow-inner"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                        <div className="absolute right-4 bottom-4 text-[9px] font-black text-muted-foreground/30 pointer-events-none uppercase tracking-widest">Secure</div>
                    </div>
                    <button type="submit" disabled={isSending || !newMessage.trim()} className="h-[58px] w-[58px] bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 transition-all transform active:scale-95 flex-shrink-0 flex items-center justify-center">
                        {isSending ? <Spinner size="sm" className="text-current"/> : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

const AnnouncementDetail: React.FC<{ announcement: Communication, onClose: () => void }> = ({ announcement, onClose }) => {
    return (
        <div className="flex flex-col h-full bg-card animate-in fade-in slide-in-from-right-10 duration-500">
             <div className="px-6 py-4 lg:px-8 lg:py-6 border-b border-border bg-card/95 backdrop-blur sticky top-0 z-30 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground"><ChevronLeftIcon className="h-6 w-6"/></button>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-inner border border-primary/10">
                            <MegaphoneIcon className="h-6 w-6" />
                        </div>
                        <div>
                             <h3 className="font-black text-lg text-foreground tracking-tight uppercase font-serif">Broadcast Detail</h3>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Institutional Transmission</p>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-all"><XIcon className="w-6 h-6"/></button>
             </div>

             <div className="flex-grow overflow-y-auto p-6 md:p-12 lg:p-16 bg-background custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-10">
                    <div className="flex items-center gap-5 bg-muted/30 p-6 rounded-[2rem] border border-border/60 shadow-inner">
                         <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-primary to-indigo-700 text-white flex items-center justify-center text-2xl font-black shadow-xl ring-4 ring-primary/5">
                             {announcement.sender_name ? announcement.sender_name.charAt(0) : 'A'}
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-black text-lg text-foreground leading-tight">{announcement.sender_name || 'School Administration'}</h3>
                            <p className="text-xs font-bold text-indigo-500 mt-1 uppercase tracking-widest">
                                {announcement.sender_role || 'Staff Official'}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-1 flex items-center gap-1.5 opacity-60">
                                <ClockIcon className="w-3 h-3"/> {new Date(announcement.sent_at).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-3xl md:text-5xl font-serif font-black text-foreground leading-[1.1] tracking-tight text-balance">
                            {announcement.subject}
                        </h1>

                        <div className="h-1.5 w-24 bg-gradient-to-r from-primary to-transparent rounded-full opacity-30"></div>

                        <div className="prose dark:prose-invert prose-slate max-w-none text-foreground/80 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                            {announcement.body}
                        </div>
                    </div>
                </div>
             </div>

             <div className="p-6 border-t border-border bg-muted/10 flex justify-center backdrop-blur-md">
                 <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-background border border-border shadow-sm">
                     <CheckCircleIcon className="w-4 h-4 text-emerald-500"/>
                     <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Verified Institutional Content</p>
                 </div>
             </div>
        </div>
    );
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

            if (enqResult.error) throw enqResult.error;
            if (msgResult.error) throw msgResult.error;

            setEnquiries(enqResult.data as MyEnquiry[] || []);
            
            const mappedMessages = (msgResult.data as any[] || []).map(item => ({
                ...item,
                id: item.message_id
            }));
            setAnnouncements(mappedMessages);

            // Auto-select first in desktop if nothing selected
            if (window.innerWidth > 1024) {
                 if (activeTab === 'inbox' && mappedMessages.length > 0 && !selectedAnnouncement) {
                     setSelectedAnnouncement(mappedMessages[0]);
                 } else if (activeTab === 'enquiries' && enqResult.data?.length > 0 && !selectedEnquiry) {
                     setSelectedEnquiry(enqResult.data[0]);
                 }
            }

        } catch (err: any) {
            console.error("Communication center sync failure:", err.message);
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedAnnouncement, selectedEnquiry]);

    useEffect(() => {
        fetchData();
    }, []); // Only once on mount to avoid loops, explicit refresh handled by children

    const handleSelectAnnouncement = (msg: Communication) => {
        setSelectedAnnouncement(msg);
        setIsMobileDetailOpen(true);
    };

    const handleSelectEnquiry = (enq: MyEnquiry) => {
        setSelectedEnquiry(enq);
        setIsMobileDetailOpen(true);
    };

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setIsMobileDetailOpen(false);
        setSelectedAnnouncement(null);
        setSelectedEnquiry(null);
        // We'll re-fetch or rely on the effect above
    };

    if (loading && announcements.length === 0 && enquiries.length === 0) return <div className="flex flex-col justify-center items-center py-32 space-y-4"><Spinner size="lg" /><p className="text-xs font-black text-muted-foreground uppercase tracking-widest animate-pulse">Syncing Communication Hub...</p></div>;

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] min-h-[550px] bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in fade-in duration-500 pb-20 lg:pb-0">
            <div className="flex h-full">
                
                {/* LIST PANE */}
                <div className={`w-full lg:w-[380px] flex flex-col border-r border-border bg-card/30 backdrop-blur-xl ${isMobileDetailOpen ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-6 border-b border-border bg-muted/10">
                        <div className="flex p-1.5 bg-muted/60 rounded-2xl border border-border/40 shadow-inner">
                            <button 
                                onClick={() => handleTabChange('inbox')}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'inbox' ? 'bg-card text-primary shadow-lg ring-1 ring-black/5 scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Inbox
                            </button>
                            <button 
                                onClick={() => handleTabChange('enquiries')}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'enquiries' ? 'bg-card text-primary shadow-lg ring-1 ring-black/5 scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Chat Logs
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar bg-[#fafafa] dark:bg-black/5">
                        {activeTab === 'inbox' ? (
                            announcements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-10 text-center opacity-30 grayscale">
                                    <MegaphoneIcon className="w-16 h-16 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-[0.2em]">Transmission Void</p>
                                    <p className="text-xs mt-2 font-medium">No official broadcasts found for your profile.</p>
                                </div>
                            ) : announcements.map(msg => (
                                <button 
                                    key={msg.id} 
                                    onClick={() => handleSelectAnnouncement(msg)}
                                    className={`w-full text-left p-6 border-b border-border/60 transition-all hover:bg-white dark:hover:bg-white/5 group relative overflow-hidden ${selectedAnnouncement?.id === msg.id ? 'bg-white dark:bg-white/5 ring-2 ring-inset ring-primary shadow-xl z-10' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`font-black text-sm uppercase tracking-wide truncate pr-4 ${selectedAnnouncement?.id === msg.id ? 'text-primary' : 'text-foreground'}`}>{msg.sender_name || 'Admin'}</h4>
                                        <span className="text-[10px] font-bold text-muted-foreground/60 whitespace-nowrap uppercase">{formatTimeAgo(msg.sent_at)}</span>
                                    </div>
                                    <p className={`text-xs font-bold truncate mb-1.5 ${selectedAnnouncement?.id === msg.id ? 'text-foreground' : 'text-foreground/80'}`}>{msg.subject}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">{msg.body}</p>
                                    {selectedAnnouncement?.id === msg.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
                                </button>
                            ))
                        ) : (
                            enquiries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-10 text-center opacity-30 grayscale">
                                    <SearchIcon className="w-16 h-16 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-[0.2em]">Registry Empty</p>
                                    <p className="text-xs mt-2 font-medium">You have no active enquiry sessions with the school.</p>
                                </div>
                            ) : enquiries.map(enq => (
                                <button 
                                    key={enq.id} 
                                    onClick={() => handleSelectEnquiry(enq)}
                                    className={`w-full text-left p-6 border-b border-border/60 transition-all hover:bg-white dark:hover:bg-white/5 group relative overflow-hidden ${selectedEnquiry?.id === enq.id ? 'bg-white dark:bg-white/5 ring-2 ring-inset ring-primary shadow-xl z-10' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`font-black text-sm uppercase tracking-wide truncate pr-4 ${selectedEnquiry?.id === enq.id ? 'text-primary' : 'text-foreground'}`}>{enq.applicant_name}</h4>
                                        <span className="text-[10px] font-bold text-muted-foreground/60 whitespace-nowrap uppercase">{formatTimeAgo(enq.last_updated)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border shadow-sm ${statusColors[enq.status]}`}>
                                            {enq.status}
                                        </span>
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-lg border border-border">Grade {enq.grade}</span>
                                    </div>
                                    {selectedEnquiry?.id === enq.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* DETAIL PANE */}
                <div className={`flex-grow bg-background flex flex-col ${isMobileDetailOpen ? 'fixed inset-0 z-[60] lg:static' : 'hidden lg:flex'}`}>
                    {activeTab === 'inbox' ? (
                        selectedAnnouncement ? (
                            <AnnouncementDetail announcement={selectedAnnouncement} onClose={() => setIsMobileDetailOpen(false)} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-20 text-center animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-muted/30 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-dashed border-border group-hover:scale-105 transition-transform">
                                    <MegaphoneIcon className="w-10 h-10 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight uppercase font-serif">Inbox Standby</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">Select a broadcast from the left column to view the full announcement details and attachments.</p>
                            </div>
                        )
                    ) : (
                        selectedEnquiry ? (
                            <ConversationView enquiry={selectedEnquiry} onBack={() => setIsMobileDetailOpen(false)} refreshEnquiries={fetchData} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-20 text-center animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-muted/30 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-dashed border-border group-hover:scale-105 transition-transform">
                                    <SearchIcon className="w-10 h-10 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight uppercase font-serif">Enquiry Terminal</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">Choose an enquiry session to review status updates and communicate directly with the school registrar.</p>
                            </div>
                        )
                    )}
                </div>

            </div>
        </div>
    );
};

export default MessagesTab;