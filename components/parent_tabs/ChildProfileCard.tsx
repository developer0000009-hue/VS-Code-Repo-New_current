
import React from 'react';
import { AdmissionApplication } from '../../types';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { GraduationCapIcon } from '../icons/GraduationCapIcon';
import { EditIcon } from '../icons/EditIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import PremiumAvatar from '../common/PremiumAvatar';

/**
 * Enterprise Card Tokens:
 * Radius: 18px
 * Padding: 18px
 * Integrity Bar: 4px
 * Transitions: 160ms cubic-bezier(0.4, 0, 0.2, 1)
 */

interface ChildProfileCardProps {
    child: AdmissionApplication;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onEdit: () => void;
    onManageDocuments: () => void;
    onNavigateDashboard: () => void;
    index?: number;
}

const ChildProfileCard: React.FC<ChildProfileCardProps> = ({ child, onEdit, onManageDocuments, onNavigateDashboard, index }) => {
    // Calculate sync progress based on status
    const getProgress = () => {
        if (child.status === 'Approved' || child.status === 'Verified') return 100;
        if (child.status === 'Documents Requested') return 65;
        if (child.status === 'Pending Review') return 40;
        return 20;
    };

    const progress = getProgress();
    const isVerified = progress === 100;
    const isPending = child.status === 'Pending Review' || child.status === 'Documents Requested';

    return (
        <div className="group relative bg-gradient-to-b from-white/[0.04] to-white/[0.02] border border-white/[0.05] rounded-[18px] shadow-[0_14px_34px_rgba(0,0,0,0.45)] inset-shadow-sm transition-all duration-[160ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_44px_rgba(0,0,0,0.55)] flex flex-col h-full overflow-hidden">
            
            {/* Inset Ring for Depth */}
            <div className="absolute inset-0 rounded-[18px] border border-white/[0.04] pointer-events-none"></div>

            <div className="p-[18px] flex-grow space-y-6 relative z-10">
                {/* --- Header: Exact Scale Identity --- */}
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <PremiumAvatar 
                            src={child.profile_photo_url} 
                            name={child.applicant_name} 
                            size="sm" 
                            statusColor={isVerified ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-primary'}
                            className="shadow-xl border border-white/10 w-[52px] h-[52px]"
                        />
                    </div>
                    <div className="flex-grow min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                             <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.15em] leading-none">Node</span>
                             <span className="text-[11px] font-mono text-white/30 tracking-tighter">{index ? `#${index}` : (child.application_number || '---')}</span>
                         </div>
                        <h3 className="text-[16px] font-serif font-bold text-white tracking-tight leading-tight truncate">
                            {child.applicant_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[12px] font-medium text-white/40 leading-none">
                                Grade {child.grade} Block
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- Integrity Status: Subtle Thin Bar --- */}
                <div className="bg-white/[0.02] p-4 rounded-[14px] border border-white/5">
                    <div className="flex justify-between items-end mb-3">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">
                                Integrity Index
                            </p>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[12px] font-bold tracking-tight ${isVerified ? 'text-emerald-500' : 'text-primary/80'}`}>{child.status}</span>
                                {isVerified && <ShieldCheckIcon className="w-3 h-3 text-emerald-500" />}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-xl font-bold font-serif tracking-tighter leading-none ${isVerified ? 'text-emerald-500' : 'text-white/70'}`}>
                                {progress}<span className="text-[10px] opacity-20 ml-0.5">%</span>
                            </p>
                        </div>
                    </div>
                    <div className="h-[4px] w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-[1000ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isVerified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-[#8B5CF6] shadow-[0_0_8px_rgba(139,92,246,0.2)]'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* --- Footer Actions: Refined & Compact --- */}
            <div className="px-[18px] pb-[18px] flex items-center justify-between gap-2.5 relative z-10">
                <button 
                    onClick={onManageDocuments}
                    className="flex-1 h-[34px] flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all group/btn active:scale-95"
                    title="Verification Vault"
                >
                    <DocumentTextIcon className="w-3.5 h-3.5 text-white/20 group-hover/btn:text-primary transition-colors" />
                    <span className="text-[11px] font-bold text-white/30 group-hover/btn:text-white/60">Vault</span>
                </button>

                <button 
                    onClick={onNavigateDashboard}
                    className="flex-1 h-[34px] flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all group/btn active:scale-95"
                    title="Academy Portal"
                >
                    <GraduationCapIcon className="w-3.5 h-3.5 text-white/20 group-hover/btn:text-primary transition-colors" />
                    <span className="text-[11px] font-bold text-white/30 group-hover/btn:text-white/60">Portal</span>
                </button>

                <button 
                    onClick={onEdit}
                    className="w-[34px] h-[34px] flex items-center justify-center rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all group/btn active:scale-95"
                    title="Profile Settings"
                >
                    <EditIcon className="w-3.5 h-3.5 text-white/20 group-hover/btn:text-white/60 transition-colors" />
                </button>
            </div>
        </div>
    );
};

export default ChildProfileCard;
