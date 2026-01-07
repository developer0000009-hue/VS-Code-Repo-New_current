import React from 'react';
import { EnquiryStatus } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';

interface EnquiryStatusManagerProps {
    currentStatus: EnquiryStatus;
    loading: boolean;
    onStatusChange: (status: EnquiryStatus) => Promise<void>;
    onConvert: () => Promise<void>;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode, label: string, color: string, ring: string, bg: string }> = {
    'ENQUIRY_ACTIVE': { icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>, label: 'Active', color: 'text-blue-700', ring: 'ring-blue-600', bg: 'bg-blue-50' },
    'ENQUIRY_VERIFIED': { icon: <div className="w-4 h-4 rounded-full bg-teal-500"/>, label: 'Verified', color: 'text-teal-700', ring: 'ring-teal-500', bg: 'bg-teal-50' },
    'ENQUIRY_IN_PROGRESS': { icon: <div className="w-4 h-4 rounded-full bg-purple-500"/>, label: 'In Progress', color: 'text-purple-700', ring: 'ring-purple-500', bg: 'bg-purple-50' },
    'CONVERTED': { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Converted', color: 'text-emerald-700', ring: 'ring-emerald-500', bg: 'bg-emerald-50' },
};

const ORDERED_STATUSES: EnquiryStatus[] = ['ENQUIRY_ACTIVE', 'ENQUIRY_VERIFIED', 'ENQUIRY_IN_PROGRESS', 'CONVERTED'];

const EnquiryStatusManager: React.FC<EnquiryStatusManagerProps> = ({
    currentStatus,
    loading,
    onStatusChange,
    onConvert
}) => {
    const handleStatusChange = async (newStatus: EnquiryStatus) => {
        if (loading || currentStatus === newStatus || currentStatus === 'CONVERTED') return;
        await onStatusChange(newStatus);
    };

    const handleConvert = async () => {
        if (loading || currentStatus === 'ENQUIRY_ACTIVE') return;
        await onConvert();
    };

    return (
        <section className="space-y-8 md:space-y-10">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase text-white/30 tracking-[0.5em]">Lifecycle Management</h3>
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse"></div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                {ORDERED_STATUSES.map(status => (
                    <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={loading || currentStatus === 'CONVERTED'}
                        className={`w-full flex items-center justify-between p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-700 group/btn relative overflow-hidden ${
                            currentStatus === status
                                ? 'bg-primary/10 border-primary text-white shadow-2xl'
                                : 'bg-black/20 border-white/5 text-white/30 hover:bg-white/5 hover:border-white/20'
                        }`}
                        aria-label={`Change status to ${STATUS_CONFIG[status]?.label}`}
                        aria-pressed={currentStatus === status}
                    >
                        <div className="flex items-center gap-3 md:gap-5 relative z-10">
                            <div className={`p-2 md:p-3 rounded-xl transition-all duration-700 ${
                                currentStatus === status ? 'bg-primary text-white shadow-lg rotate-3' : 'bg-white/5 text-white/20 group-hover/btn:scale-110'
                            }`}>
                                {STATUS_CONFIG[status]?.icon}
                            </div>
                            <span className={`text-[10px] md:text-sm font-black uppercase tracking-[0.2em] transition-colors duration-700 ${
                                currentStatus === status ? 'text-primary' : 'group-hover/btn:text-white'
                            }`}>
                                {STATUS_CONFIG[status]?.label}
                            </span>
                        </div>
                        {currentStatus === status && (
                            <CheckCircleIcon className="w-4 h-4 md:w-5 md:h-5 text-primary animate-in zoom-in duration-500 relative z-10" />
                        )}
                    </button>
                ))}
            </div>

            {currentStatus !== 'CONVERTED' && (
                <section className="pt-8 md:pt-10 border-t border-white/5 space-y-6 md:space-y-8 pb-10">
                    <button
                        onClick={handleConvert}
                        disabled={loading || currentStatus === 'ENQUIRY_ACTIVE'}
                        className={`w-full py-6 md:py-8 rounded-2xl md:rounded-[2.8rem] flex items-center justify-center gap-4 md:gap-6 font-black text-[10px] md:text-xs uppercase tracking-[0.5em] transition-all duration-700 shadow-2xl active:scale-95 ${
                            currentStatus !== 'ENQUIRY_ACTIVE'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20'
                                : 'bg-white/5 text-white/5 cursor-not-allowed border border-white/5 grayscale'
                        }`}
                        aria-label="Convert enquiry to admission"
                    >
                        {loading ? (
                            <div className="w-6 h-6 md:w-7 md:h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <GraduationCapIcon className="w-6 h-6 md:w-7 md:h-7 opacity-60" />
                                PROMOTE TO ADMISSION
                            </>
                        )}
                    </button>

                    {currentStatus === 'ENQUIRY_ACTIVE' && (
                        <p className="text-[8px] md:text-[9px] text-amber-500/60 font-black uppercase tracking-[0.2em] text-center leading-relaxed px-4">
                            Identity verification protocol required prior to promotion.
                        </p>
                    )}
                </section>
            )}
        </section>
    );
};

export default EnquiryStatusManager;
