import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Role, BuiltInRoles } from '../../types';
import { LogoutIcon } from '../icons/LogoutIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { useRoles } from '../../contexts/RoleContext';
import { ROLE_ICONS, ROLE_ORDER } from '../../constants';
import { PlusIcon } from '../icons/PlusIcon';
import { supabase } from '../../services/supabase';
import Spinner from './Spinner';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { UserIcon } from '../icons/UserIcon';
import { SwitchRoleIcon } from '../icons/SwitchRoleIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';

interface ProfileDropdownProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSelectRole?: (role: Role, isExisting?: boolean) => void;
    onProfileClick?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ profile, onSignOut, onSelectRole, onProfileClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [processingRole, setProcessingRole] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { roles } = useRoles();
    
    // tracks roles that have an actual authorized profile established
    const [completedRoles, setCompletedRoles] = useState<Set<string>>(new Set());
    const [checkingRoles, setCheckingRoles] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const discoverIdentities = useCallback(async () => {
        if (!profile?.id) return;
        setCheckingRoles(true);
        try {
            // This RPC strictly checks for sub-profile records (e.g. parent_profiles table)
            const { data, error } = await supabase.rpc('get_user_completed_roles');
            if (!error && data) {
                const found = new Set<string>();
                (data as any[]).forEach(item => {
                    if (item.is_completed) found.add(item.role_name);
                });
                
                // Safety: the current active profile we are looking at is by definition completed if they are in the dashboard
                if (profile.role && profile.profile_completed) {
                    found.add(profile.role);
                }
                
                setCompletedRoles(found);
            }
        } catch (e) {
            console.error("Identity Discovery Protocol failure:", e);
        } finally {
            setCheckingRoles(false);
        }
    }, [profile?.id, profile?.role, profile?.profile_completed]);

    useEffect(() => {
        if (isOpen) discoverIdentities();
    }, [isOpen, discoverIdentities]);

    const handleAction = async (actionRole: Role, isExisting: boolean) => {
        if (!onSelectRole) return;
        setProcessingRole(actionRole);
        try {
            await onSelectRole(actionRole, isExisting);
            setIsOpen(false);
        } finally {
            setProcessingRole(null);
        }
    };
    
    // Roles that ALREADY have an established authorized profile
    const switchableIdentities = useMemo(() => roles
        .filter(r => completedRoles.has(r))
        .sort((a, b) => {
            if (a === profile.role) return -1;
            if (b === profile.role) return 1;
            return ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b);
        }), [roles, completedRoles, profile.role]);
    
    // Roles that are NEW and require onboarding/registration
    const creatableIdentities = useMemo(() => roles
        .filter(r => !completedRoles.has(r) && r !== BuiltInRoles.SUPER_ADMIN && r !== BuiltInRoles.MINIMAL_ADMIN)
        .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b)), 
    [roles, completedRoles]);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all group ${isOpen ? 'bg-muted shadow-inner' : 'hover:bg-muted/50'}`}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <div className="relative">
                    <img className="h-9 w-9 rounded-full object-cover border-2 border-background shadow-sm" src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} alt="Avatar" />
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full z-10 shadow-sm"></div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left mr-1">
                    <span className="text-xs font-bold text-foreground leading-tight max-w-[100px] truncate">{profile.display_name}</span>
                    <span className="text-[10px] font-medium text-muted-foreground max-w-[100px] truncate uppercase tracking-wider">{profile.role || 'Unregistered'}</span>
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#0d0f14] rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-white/5 origin-top-right ring-1 ring-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col">
                        {/* Profile Summary */}
                        <div className="p-8 flex items-center gap-5 border-b border-white/5 bg-white/[0.01] relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                             <img className="h-16 w-16 rounded-2xl object-cover shadow-2xl border border-white/10 relative z-10" src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}`} alt="Avatar" />
                             <div className="min-w-0 relative z-10">
                                 <p className="font-serif font-black text-white text-xl truncate leading-tight uppercase tracking-tight">{profile.display_name}</p>
                                 <p className="text-[11px] text-white/30 truncate mt-1.5 font-medium italic">{profile.email}</p>
                             </div>
                        </div>

                        {/* Node Settings */}
                        <div className="p-2 border-b border-white/5">
                             <button 
                                onClick={() => { onProfileClick?.(); setIsOpen(false); }} 
                                className="w-full flex items-center gap-4 p-4 rounded-2xl text-xs font-black text-white/50 hover:text-white hover:bg-white/5 transition-all uppercase tracking-[0.2em] group"
                             >
                                 <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                     <SettingsIcon className="w-4 h-4 text-white/20 group-hover:text-primary" />
                                 </div>
                                 NODE MANAGEMENT
                             </button>
                        </div>

                        {/* Scopes Section */}
                        <div className="flex-grow max-h-[460px] overflow-y-auto custom-scrollbar bg-black/20">
                            {checkingRoles ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-6">
                                    <Spinner size="md" className="text-primary" />
                                    <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em] animate-pulse">Recalling Authorized Nodes</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {/* AUTHORIZED SCOPES */}
                                    {switchableIdentities.length > 0 && (
                                        <div className="px-3 pt-4 pb-3">
                                            <p className="px-4 py-3 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-2">
                                                <SwitchRoleIcon className="w-3.5 h-3.5 opacity-50"/> AUTHORIZED SCOPES
                                            </p>
                                            <div className="space-y-1.5">
                                                {switchableIdentities.map(roleName => {
                                                    const Icon = ROLE_ICONS[roleName] || UserIcon;
                                                    const isCurrent = roleName === profile.role;
                                                    return (
                                                        <button 
                                                            key={roleName} 
                                                            onClick={() => !isCurrent && handleAction(roleName, true)} 
                                                            disabled={processingRole === roleName}
                                                            className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${isCurrent ? 'bg-primary/10 ring-1 ring-primary/20 cursor-default' : 'hover:bg-white/[0.03]'}`}
                                                        >
                                                            <div className={`p-3 rounded-xl mr-5 transition-all duration-500 shadow-lg ${isCurrent ? 'bg-primary text-white scale-110' : 'bg-white/5 text-white/20 group-hover:scale-105'}`}>
                                                                <Icon className="w-5 h-5"/>
                                                            </div>
                                                            <div className="flex-grow text-left">
                                                                <span className={`block text-[11px] font-black uppercase tracking-widest ${isCurrent ? 'text-primary' : 'text-white/60 group-hover:text-white'}`}>{roleName}</span>
                                                                {isCurrent && (
                                                                    <div className="flex items-center gap-2 mt-1.5">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                        <span className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em]">Active Session</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {processingRole === roleName ? (
                                                                <Spinner size="sm" />
                                                            ) : isCurrent && (
                                                                <div className="p-1.5 bg-primary/10 rounded-full border border-primary/20">
                                                                    <CheckCircleIcon className="w-4 h-4 text-primary" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* REGISTER NEW SCOPE */}
                                    {creatableIdentities.length > 0 && (
                                        <div className="px-3 pt-4 pb-6 border-t border-white/5">
                                             <p className="px-4 py-3 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-2">
                                                 <PlusIcon className="w-3.5 h-3.5 opacity-50"/> REGISTER NEW SCOPE
                                             </p>
                                             <div className="space-y-1.5">
                                                {creatableIdentities.map(roleName => {
                                                    const Icon = ROLE_ICONS[roleName] || UserIcon;
                                                    return (
                                                        <button 
                                                            key={roleName} 
                                                            onClick={() => handleAction(roleName, false)} 
                                                            disabled={!!processingRole}
                                                            className="w-full flex items-center p-4 rounded-2xl hover:bg-white/[0.04] transition-all group/item duration-300 disabled:opacity-30"
                                                        >
                                                            <div className="p-3 rounded-xl transition-all duration-500 bg-white/5 text-white/20 mr-5 group-hover/item:text-primary group-hover/item:bg-primary/10 border border-transparent shadow-inner">
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-[11px] font-black text-white/40 uppercase tracking-widest group-hover/item:text-white transition-colors">
                                                               Onboard as {roleName}
                                                            </span>
                                                            {processingRole === roleName ? (
                                                                <Spinner size="sm" className="ml-auto" />
                                                            ) : (
                                                                <ChevronRightIcon className="w-4 h-4 ml-auto text-white/10 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                             </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sign Out Section */}
                        <div className="p-4 bg-black/40 border-t border-white/5 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] relative z-20">
                             <button 
                                onClick={onSignOut} 
                                className="w-full flex items-center justify-center gap-4 p-5 rounded-3xl text-[11px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] group"
                             >
                                 <LogoutIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> TERMINATE SESSION
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;