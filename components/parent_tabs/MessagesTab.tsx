
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

// --- Types & Constants ---

type Tab = 'inbox' | 'enquiries';

const statusColors: { [key in EnquiryStatus]: string } = {
  'New': 'bg-blue-100 text-blue-700 border-blue-200',
  'Contacted': 'bg-amber-100 text-amber-700 border-amber-200',
  'In Review': 'bg-purple-100 text-purple-700 border-purple-200',
  'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
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

// --- Sub-Components ---

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
                <div className="flex justify-center my-4">
                    <div className="bg-card border border-border p-4 rounded-xl shadow-sm max-w-md w-full">
                         <div className="flex items-center gap-2 mb-2 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2-2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            <span className="text-xs font-bold uppercase tracking-wider">Document Request</span>
                         </div>
                        <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold text-foreground">{item.created_by_name}</span> requested:</p>
                        <ul className="list-disc list-inside text-sm space-y-1 ml-1 text-foreground">
                            {docs.map((doc, i) => <li key={i}>{doc}</li>)}
                        </ul>
                        {message && (
                            <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Note:</p>
                                <p className="text-sm italic text-muted-foreground/80">"{message}"</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        default:
            return null;
    }
    
    if (!content) return null;

    return (
        <div className="flex justify-center my-3">
            <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border">
                {item.created_by_name} {content} • {formatTimeAgo(item.created_at)}
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
        <div className="flex flex-col h-full bg-card rounded-r-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 border-b border-border bg-card">
                <div className="flex items-center gap-2 lg:gap-3">
                    <button onClick={onBack} className="lg:hidden p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <h2 className="text-base lg:text-lg font-bold text-foreground leading-tight">{enquiry.applicant_name}</h2>
                        <p className="text-xs text-muted-foreground">Enquiry ID: #{enquiry.id}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[enquiry.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {enquiry.status}
                </span>
            </div>

            {/* Timeline / Chat Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-[#fafafa] dark:bg-background/50">
                 {loading ? <div className="flex justify-center items-center h-full"><Spinner /></div> : 
                 timeline.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                 ) : timeline.map((item) =>
                    item.item_type === 'MESSAGE' ? (
                        <div key={`msg-${item.id}`} className={`flex flex-col ${!item.is_admin ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] lg:max-w-[70%] p-4 rounded-2xl shadow-sm relative ${!item.is_admin ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white dark:bg-card border border-border text-foreground rounded-tl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.details.message}</p>
                            </div>
                             <p className={`text-[10px] mt-1 px-1 ${!item.is_admin ? 'text-right text-muted-foreground' : 'text-left text-muted-foreground'}`}>
                                {item.created_by_name} • {formatTimeAgo(item.created_at)}
                            </p>
                        </div>
                    ) : <TimelineEvent key={`evt-${item.id}`} item={item} />
                )}
                <div ref={commsEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card flex gap-3 items-end">
                <div className="relative flex-grow">
                    <textarea 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        placeholder="Type your message..." 
                        className="w-full p-3 pr-10 bg-muted/50 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-sm min-h-[50px] max-h-[150px]"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                    />
                </div>
                <button type="submit" disabled={isSending || !newMessage.trim()} className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-transform active:scale-95 flex-shrink-0">
                    {isSending ? <Spinner size="sm" className="text-current"/> : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
};

const AnnouncementDetail: React.FC<{ announcement: Communication, onClose: () => void }> = ({ announcement, onClose }) => {
    return (
        <div className="flex flex-col h-full bg-card animate-in fade-in slide-in-from-right-10 duration-300 lg:animate-none">
             {/* Enhanced Header */}
             <div className="px-4 py-3 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 sticky top-0 z-30 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onClose} 
                        className="lg:hidden flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground transition-colors font-medium text-sm"
                        aria-label="Back to list"
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                        <span>Back</span>
                    </button>
                    
                    <div className="hidden lg:flex items-center gap-2 text-muted-foreground px-2">
                        <MegaphoneIcon className="h-4 w-4 opacity-70" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-70">Announcement</span>
                    </div>
                </div>
                
                <button 
                    onClick={onClose} 
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Close"
                >
                    <XIcon className="h-5 w-5" />
                </button>
             </div>

             {/* Main Content */}
             <div className="flex-grow overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto p-6 sm:p-8 lg:p-10">
                    
                    {/* Sender Info Block */}
                    <div className="flex items-center gap-4 mb-8">
                         <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg shadow-primary/20 shrink-0 transform rotate-3">
                             {announcement.sender_name ? announcement.sender_name.charAt(0) : 'A'}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">{announcement.sender_name || 'School Administration'}</h3>
                            <p className="text-sm text-muted-foreground font-medium">{announcement.sender_role || 'Administrator'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                {new Date(announcement.sent_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} 
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                                {new Date(announcement.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>

                    {/* Subject */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-snug mb-6 tracking-tight">
                        {announcement.subject}
                    </h1>
                    
                     {/* Context Tags */}
                     {announcement.target_criteria?.type === 'class' && (
                         <div className="mb-6">
                            <span className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                <SchoolIcon className="w-3 h-3" /> Class Announcement
                            </span>
                         </div>
                    )}

                    <div className="w-full h-px bg-border mb-8"></div>

                    {/* Message Body */}
                    <div className="prose dark:prose-invert prose-slate max-w-none text-foreground/90 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                        {announcement.body}
                    </div>
                </div>
             </div>

             {/* Footer */}
             <div className="p-4 border-t border-border bg-muted/5 flex justify-center text-xs text-muted-foreground">
                 <span className="opacity-70 bg-muted px-3 py-1 rounded-full">Broadcast Message • Replies Disabled</span>
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
    
    // Mobile View Logic
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        
        // NOTE: Using the new 'get_my_messages' RPC for parents
        const [enqResult, msgResult] = await Promise.all([
            supabase.rpc('get_my_enquiries'),
            supabase.rpc('get_my_messages') 
        ]);

        if (enqResult.error) {
             console.error("Enquiries fetch error:", enqResult.error.message);
        } else {
             // Sort enquiries by last updated
             const sorted = (enqResult.data as MyEnquiry[] || []).sort((a, b) => 
                 new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
             );
             setEnquiries(sorted);
        }

        if (msgResult.error) {
             console.error("Messages fetch error:", msgResult.error.message || msgResult.error);
        } else {
             // Map message_id to id and sort announcements by date
             const mappedMessages = (msgResult.data as any[] || []).map(item => ({
                 ...item,
                 id: item.message_id
             }));
             const sorted = mappedMessages.sort((a: any, b: any) => 
                 new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
             );
             setAnnouncements(sorted);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Select first item on desktop load
    useEffect(() => {
        if (!loading && window.innerWidth >= 1024) {
            if (activeTab === 'inbox' && announcements.length > 0 && !selectedAnnouncement) {
                setSelectedAnnouncement(announcements[0]);
            } else if (activeTab === 'enquiries' && enquiries.length > 0 && !selectedEnquiry) {
                setSelectedEnquiry(enquiries[0]);
            }
        }
    }, [loading, activeTab, announcements, enquiries]);

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
        if (window.innerWidth >= 1024) {
            if (tab === 'inbox') {
                setSelectedAnnouncement(announcements[0] || null);
                setSelectedEnquiry(null);
            } else {
                setSelectedEnquiry(enquiries[0] || null);
                setSelectedAnnouncement(null);
            }
        }
    };
    
    const handleCloseDetail = () => {
        setIsMobileDetailOpen(false);
        // On desktop, we want to clear selection or just keep it but visually indicate closed state if needed.
        // Here we clear it to return to 'placeholder' state on desktop or just close overlay on mobile.
        if (activeTab === 'inbox') setSelectedAnnouncement(null);
        else setSelectedEnquiry(null);
    };

    if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

    return (
        <div className="flex flex-col h-[calc(100vh-9rem)] min-h-[600px] max-w-7xl mx-auto bg-background lg:bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="flex h-full">
                
                {/* --- LEFT PANE: LIST --- */}
                <div className={`w-full lg:w-1/3 flex flex-col border-r border-border bg-card ${isMobileDetailOpen ? 'hidden lg:flex' : 'flex'}`}>
                    {/* Tabs Header */}
                    <div className="p-4 border-b border-border bg-card">
                        <div className="flex p-1 bg-muted/50 rounded-xl">
                            <button 
                                onClick={() => handleTabChange('inbox')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'inbox' ? 'bg-background text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Announcements
                                {announcements.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                            </button>
                            <button 
                                onClick={() => handleTabChange('enquiries')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'enquiries' ? 'bg-background text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Enquiries
                            </button>
                        </div>
                    </div>

                    {/* List Content */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar bg-muted/10">
                        {activeTab === 'inbox' ? (
                            announcements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <MegaphoneIcon className="w-8 h-8 text-muted-foreground/40" />
                                    </div>
                                    <p className="font-medium text-foreground">No announcements</p>
                                    <p className="text-sm text-muted-foreground mt-1">School updates will appear here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {announcements.map(msg => (
                                        <button 
                                            key={msg.id} 
                                            onClick={() => handleSelectAnnouncement(msg)}
                                            className={`w-full text-left p-4 transition-all hover:bg-muted/40 relative group border-l-4 ${selectedAnnouncement?.id === msg.id ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                                                        <MegaphoneIcon className="w-4 h-4" />
                                                    </span>
                                                    <h4 className="font-bold text-sm text-foreground line-clamp-1">{msg.sender_name || 'School Admin'}</h4>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatTimeAgo(msg.sent_at)}</span>
                                            </div>
                                            <p className="text-sm font-semibold text-foreground mt-2 mb-1 line-clamp-1">{msg.subject}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{msg.body}</p>
                                        </button>
                                    ))}
                                </div>
                            )
                        ) : (
                            enquiries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <SearchIcon className="w-8 h-8 text-muted-foreground/40" />
                                    </div>
                                    <p className="font-medium text-foreground">No enquiries found</p>
                                    <p className="text-sm text-muted-foreground mt-1">Start a new enquiry for your child.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {enquiries.map(enq => (
                                        <button 
                                            key={enq.id} 
                                            onClick={() => handleSelectEnquiry(enq)}
                                            className={`w-full text-left p-4 transition-all hover:bg-muted/40 relative border-l-4 ${selectedEnquiry?.id === enq.id ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-sm text-foreground truncate">{enq.applicant_name}</h4>
                                                <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatTimeAgo(enq.last_updated)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusColors[enq.status]}`}>
                                                    {enq.status}
                                                </span>
                                                {enq.grade && <span className="text-xs text-muted-foreground">Grade {enq.grade}</span>}
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <ClockIcon className="w-3 h-3" /> 
                                                Last updated {new Date(enq.last_updated).toLocaleDateString()}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* --- RIGHT PANE: DETAIL --- */}
                <div className={`w-full lg:w-2/3 bg-card flex flex-col ${isMobileDetailOpen ? 'flex fixed inset-0 z-50' : 'hidden lg:flex'}`}>
                    {activeTab === 'inbox' ? (
                        selectedAnnouncement ? (
                            <AnnouncementDetail announcement={selectedAnnouncement} onClose={handleCloseDetail} />
                        ) : (
                            <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-10 bg-muted/10">
                                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <BellIcon className="w-10 h-10 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Select an Announcement</h3>
                                <p className="text-muted-foreground mt-2 max-w-xs">Choose a message from the list to view details.</p>
                            </div>
                        )
                    ) : (
                        selectedEnquiry ? (
                            <ConversationView enquiry={selectedEnquiry} onBack={handleCloseDetail} refreshEnquiries={fetchData} />
                        ) : (
                            <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-10 bg-muted/10">
                                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <SearchIcon className="w-10 h-10 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Select an Enquiry</h3>
                                <p className="text-muted-foreground mt-2 max-w-xs">Choose an enquiry to view the conversation status.</p>
                            </div>
                        )
                    )}
                </div>

            </div>
        </div>
    );
};

export default MessagesTab;
