import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface EnquiryAISummaryProps {
    enquiryId: string | number;
    grade: string;
    applicantName: string;
    timeline: any[];
    onGenerateSummary: () => Promise<string>;
    loading: boolean;
}

const EnquiryAISummary: React.FC<EnquiryAISummaryProps> = ({
    enquiryId,
    grade,
    applicantName,
    timeline,
    onGenerateSummary,
    loading
}) => {
    const [summary, setSummary] = useState<string | null>(null);

    const handleGenerateSummary = async () => {
        if (loading) return;

        try {
            const generatedSummary = await onGenerateSummary();
            setSummary(generatedSummary);
        } catch (error) {
            console.error('Failed to generate AI summary:', error);
            setSummary('Unable to generate summary at this time.');
        }
    };

    const handleClearSummary = () => {
        setSummary(null);
    };

    return (
        <section className="space-y-8 md:space-y-10">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase text-white/30 tracking-[0.5em]">Identity Analysis</h3>
                <button
                    onClick={handleGenerateSummary}
                    disabled={loading}
                    className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Generate AI summary"
                    title="AI Summarize"
                >
                    {loading ? (
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <SparklesIcon className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                </button>
            </div>

            {summary ? (
                <div className="bg-primary/5 border border-primary/20 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] relative group overflow-hidden animate-in fade-in slide-in-from-right-8 duration-1000">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:opacity-40 transition-opacity"></div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-4 flex items-center gap-2">
                        <SparklesIcon className="w-3.5 h-3.5" /> AI Synthesis
                    </p>
                    <p className="text-sm font-serif italic text-white/70 leading-loose">"{summary}"</p>
                    <button
                        onClick={handleClearSummary}
                        className="mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors"
                        aria-label="Clear summary"
                    >
                        Clear
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
                    <div className="flex flex-col gap-2 p-5 md:p-6 rounded-2xl md:rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Parent Link</span>
                        <p className="text-sm md:text-base text-white/80 font-medium font-serif italic truncate">
                            {`Enquiry #${enquiryId}`}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 p-5 md:p-6 rounded-2xl md:rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Node Scope</span>
                        <p className="text-sm md:text-base text-white/80 font-black font-serif italic tracking-wider">
                            GRADE {grade}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
};

export default EnquiryAISummary;
