import React, { useEffect, useRef } from 'react';
import { TimelineItem } from '../types';
import { CommunicationIcon } from './icons/CommunicationIcon';
import Spinner from './common/Spinner';

interface EnquiryTimelineProps {
    timeline: TimelineItem[];
    loading: boolean;
    onTimelineUpdate: () => void;
}

const TimelineEntry: React.FC<{ item: TimelineItem }> = ({ item }) => {
    if (item.item_type === 'MESSAGE') {
        const isParent = !item.is_admin;
        return (
            <div className={`flex items-end gap-3 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full ${isParent ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-2 md:gap-5 max-w-[90%] sm:max-w-[75%] ${isParent ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 md:w-11 md:h-11 rounded-xl md:rounded-[1.1rem] flex items-center justify-center font-black text-[10px] md:text-sm shadow-2xl text-white flex-shrink-0 border border-white/5 ${isParent ? 'bg-indigo-600' : 'bg-[#252833]'}`}>
                        {item.created_by_name.charAt(0)}
                    </div>
                    <div className={`p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-2xl ring-1 ring-white/5 overflow-hidden relative ${isParent ? 'bg-[#1a1d23] rounded-br-none' : 'bg-[#221f30] rounded-bl-none text-white/90'}`}>
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        <p className="text-[14px] md:text-[17px] leading-relaxed relative z-10 whitespace-pre-wrap font-medium">{item.details.message}</p>
                        <div className={`flex items-center gap-3 mt-4 md:mt-6 relative z-10 opacity-30 ${isParent ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">{item.created_by_name}</span>
                            <span className="w-1 h-1 rounded-full bg-white"></span>
                            <span className="text-[8px] md:text-[9px] font-mono">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center my-6 md:my-10 animate-in fade-in zoom-in-95 duration-1000">
            <div className="flex items-center gap-4 px-4 md:px-6 py-2 rounded-full bg-white/[0.02] border border-white/5 shadow-inner backdrop-blur-sm">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-white/20 text-center">
                    {item.item_type.replace(/_/g, ' ')} • {new Date(item.created_at).toLocaleTimeString()}
                </span>
            </div>
        </div>
    );
};

const EnquiryTimeline: React.FC<EnquiryTimelineProps> = ({ timeline, loading, onTimelineUpdate }) => {
    const commsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (commsEndRef.current) {
            commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [timeline]);

    if (loading && timeline.length === 0) {
        return (
            <div className="m-auto flex flex-col items-center gap-6">
                <Spinner size="lg" className="text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Retrieving Communication Ledger</p>
            </div>
        );
    }

    if (timeline.length === 0) {
        return (
            <div className="m-auto flex flex-col items-center text-center opacity-10 space-y-8 md:space-y-10">
                <CommunicationIcon className="w-32 h-32 md:w-48 md:h-48" />
                <p className="text-2xl md:text-4xl font-serif italic text-white max-w-lg leading-relaxed">No communications exchanged yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 md:space-y-16">
            {timeline.map((item, idx) => (
                <TimelineEntry key={`${item.item_type}-${item.created_at}-${idx}`} item={item} />
            ))}
            <div ref={commsEndRef} className="h-4" />
        </div>
    );
};

export default EnquiryTimeline;
