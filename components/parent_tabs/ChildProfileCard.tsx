import React from 'react';
import { AdmissionApplication } from '../../types';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { ChecklistIcon } from '../icons/ChecklistIcon';
import { FinanceIcon } from '../icons/FinanceIcon';
import { EditIcon } from '../icons/EditIcon';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import PremiumAvatar from '../common/PremiumAvatar';

interface ChildProfileCardProps {
    child: AdmissionApplication;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onEdit: () => void;
    onManageDocuments: () => void;
    onNavigateDashboard: () => void;
}

const ChildProfileCard: React.FC<ChildProfileCardProps> = ({ child, onEdit, onManageDocuments, onNavigateDashboard }) => {
    // Calculate sync progress based on status
    const getProgress = () => {
        if (child.status === 'Approved') return 100;
        if (child.status === 'Documents Requested') return 65;
        if (child.status === 'Pending Review') return 40;
        return 20;
    };

    const progress = getProgress();
    const isVerified = progress === 100;

    return (
        <div className="group relative bg-[#0d0f14] border border-white/5 rounded-[3rem] shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8),0_0_24px_rgba(var(--primary),0.03)] hover:border-white/10 hover:-translate-y-2 flex flex-col h-full overflow-hidden ring-1 ring-black/50">
            
            {/* Ambient Accent Glow */}
            <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-[80px] -mr-40 -mt-40 pointer-events-none transition-opacity opacity-30 group-hover:opacity-60 duration-1000 ${isVerified ? 'from-emerald-500/10' : ''}`}></div>

            {/* Quick Actions Floating Overlay */}
            <div className="absolute top-8 right-8 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-4 rounded-2xl bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all border border-white/10 backdrop-blur-3xl shadow-xl active:scale-95"
                    title="Modify Identity Block"
                >
                    <EditIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="p-8 md:p-10 flex-grow space-y-10 relative z-10">
                {/* --- Header: Balanced Identity --- */}
                <div className="flex items-center gap-6 md:gap-8">
                    <div className="relative shrink-0">
                        <PremiumAvatar 
                            src={child.profile_photo_url} 
                            name={child.applicant_name} 
                            size="md" 
                            statusColor={isVerified ? 'bg-emerald-500' : 'bg-amber-500'}
                            className="shadow-2xl border-4 border-[#0d0f14]"
                        />
                        <div className={`absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl flex items-center justify-center border-2 border-[#0d0f14] shadow-xl ${isVerified ? 'bg-emerald-500 animate-bounce-subtle' : 'bg-amber-500'}`}>
                            {isVerified ? <ShieldCheckIcon className="w-4 h-4 text-white" /> : <ClockIcon className="w-4 h-4 text-white" />}
                        </div>
                    </div>
                    <div className="flex-grow min-w-0">
                         <div className="flex items-center gap-3 mb-2">
                             <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] leading-none opacity-80">Identity Node</span>
                             <div className="h-1 w-1 rounded-full bg-white/10"></div>
                             <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">{child.application_number || `#${child.id}`}</span>
                         </div>
                        <h3 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight leading-none mb-3 truncate group-hover:text-primary transition-colors duration-700">
                            {child.applicant_name}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border backdrop-blur-md transition-all duration-700 ${isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/40 border-white/5'}`}>
                                Grade {child.grade}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- Lifecycle Metrics --- */}
                <div className="space-y-5 bg-white/[0.01] p-6 rounded-[2.5rem] border border-white/5 shadow-inner">
                    <div className="flex justify-between items-end px-1">
                        <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1.5">
                                Lifecycle Index
                            </p>
                            <p className={`text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-700 ${isVerified ? 'text-emerald-500' : 'text-white/50'}`}>{child.status}</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-black font-mono tracking-tighter transition-colors duration-700 ${isVerified ? 'text-emerald-500' : 'text-primary'}`}>
                                {progress}<span className="text-sm opacity-40 ml-0.5">%</span>
                            </p>
                        </div>
                    </div>
                    <div className="h-2.5 w-full bg-black/60 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5 p-0.5">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] relative ${isVerified ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-primary to-indigo-600 shadow-[0_0_12px_rgba(var(--primary),0.3)]'}`}
                            style={{ width: `${progress}%` }}
                        >
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Footer: Scaled Action Nodes --- */}
            <div className="px-10 pb-10 flex items-center justify-between gap-6 relative z-10">
                <button 
                    onClick={onManageDocuments}
                    className="flex flex-col items-center gap-3 flex-1 group/node transition-all hover:-translate-y-1.5"
                >
                    <div className="w-full h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/node:bg-primary/10 group-hover/node:border-primary/30 transition-all duration-500 shadow-inner">
                        <DocumentTextIcon className="w-6 h-6 text-white/20 group-hover/node:text-primary transition-all" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 group-hover/node:text-white transition-colors">Vault</span>
                </button>

                <button 
                    onClick={onNavigateDashboard}
                    className="flex flex-col items-center gap-3 flex-1 group/node transition-all hover:-translate-y-1.5"
                >
                    <div className="w-full h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/node:bg-indigo-500/10 group-hover/node:border-indigo-500/30 transition-all duration-500 shadow-inner">
                        <GraduationCapIcon className="w-6 h-6 text-white/20 group-hover/node:text-indigo-400 transition-all" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 group-hover/node:text-white transition-colors">Academic</span>
                </button>

                <button 
                    onClick={onNavigateDashboard}
                    className="flex flex-col items-center gap-3 flex-1 group/node transition-all hover:-translate-y-1.5"
                >
                    <div className="w-full h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/node:bg-emerald-500/10 group-hover/node:border-emerald-500/30 transition-all duration-500 shadow-inner">
                        <FinanceIcon className="w-6 h-6 text-white/20 group-hover/node:text-emerald-400 transition-all" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 group-hover/node:text-white transition-colors">Ledger</span>
                </button>
            </div>
            
            {/* Visual Floor Decor */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-48 h-1.5 bg-white/[0.02] rounded-full blur-sm"></div>
        </div>
    );
};

export default ChildProfileCard;