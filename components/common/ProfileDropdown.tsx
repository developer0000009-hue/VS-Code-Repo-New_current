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
import PremiumAvatar from './PremiumAvatar';

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
            const { data, error } = await supabase.rpc('get_user_completed_roles');
            
            if (!error && data) {
                const found = new Set<string>();
                (data as any[]).forEach(item => {
                    if (item.is_completed) found.add(item.role_name);
                });
                
                if (profile.role && profile.profile_completed) {
                    found.add(profile.role);
                }
                
                setCompletedRoles(found);
            } else {
                if (profile.role && profile.profile_completed) {
                    setCompletedRoles(new Set([profile.role]));
                }
            }
        } catch (e) {
            console.error("Identity Discovery Failure:", e);
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
            if (isExisting) setIsOpen(false);
            await onSelectRole(actionRole, isExisting);
            if (!isExisting) setIsOpen(false);
        } finally {
            setProcessingRole(null);
        }
    };
    
    const authorizedScopes = useMemo(() => roles
        .filter(r => completedRoles.has(r))
        .sort((a, b) => {
            if (a === profile.role) return -1;
            if (b === profile.role) return 1;
            return ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b);
        }), [roles, completedRoles, profile.role]);
    
    const registerableScopes = useMemo(() => roles
        .filter(r => !completedRoles.has(r) && r !== BuiltInRoles.SUPER_ADMIN), 
    [roles, completedRoles]);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all group ${isOpen ? 'bg-white/5 shadow-inner' : 'hover:bg-white/5'}`}
            >
                <div className="relative">
                    <PremiumAvatar 
                        src={profile.profile_photo_url} 
                        name={profile.display_name} 
                        size="xs" 
                        className="w-8 h-8 rounded-full border-2 border-background"
                    />
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-[#08090a] rounded-full z-10"></div>
                </div>
                <div className="hidden md:flex flex-col items-start text-left mr-1">
                    <span className="text-xs font-bold text-white leading-tight max-w-[100px] truncate">{profile.display_name}</span>
                    <span className="text-[9px] font-black text-white/30 max-w-[100px] truncate uppercase tracking-widest">{profile.role || 'Provisioning'}</span>
                </div>
                <ChevronDownIcon className={`h-3 w-3 text-white/20 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-[#0d0f14] rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-white/5 origin-top-right ring-1 ring-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex flex-col">
                        {/* Profile Brief */}
                        <div className="p-8 pb-6 flex items-center gap-5 border-b border-white/5">
                             <PremiumAvatar 
                                src={profile.profile_photo_url} 
                                name={profile.display_name} 
                                size="sm" 
                                className="w-14 h-14 rounded-2xl shadow-xl border border-white/10"
                             />
                             <div className="min-w-0">
                                 <p className="font-serif font-black text-white text-lg truncate leading-tight uppercase tracking-tight">{profile.display_name}</p>
                                 <p className="text-[11px] text-white/30 truncate mt-1 font-medium">{profile.email}</p>
                             </div>
                        </div>

                        {/* Node Management Section Header */}
                        <div className="p-2 border-b border-white/5">
                             <button onClick={() => { onProfileClick?.(); setIsOpen(false); }} className="w-full flex items-center gap-3 p-4 rounded-2xl text-[10px] font-black text-white/40 hover:text-white hover:bg-white/5 transition-all uppercase tracking-[0.4em] group">
                                 <SettingsIcon className="w-4 h-4 text-white/10 group-hover:text-primary transition-colors" /> Node Management
                             </button>
                        </div>

                        {/* Scopes Content */}
                        <div className="flex-grow max-h-[480px] overflow-y-auto custom-scrollbar">
                            {checkingRoles ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <Spinner size="md" className="text-primary" />
                                    <p className="text-[9px] font-black uppercase text-white/10 tracking-[0.5em] animate-pulse">Syncing Matrix</p>
                                </div>
                            ) : (
                                <>
                                    {/* Authorized Scopes */}
                                    {authorizedScopes.length > 0 && (
                                        <div className="p-4 pt-6">
                                            <p className="px-5 py-3 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <SwitchRoleIcon className="w-3.5 h-3.5 opacity-40"/> Authorized Scopes
                                            </p>
                                            <div className="space-y-2">
                                                {authorizedScopes.map(roleName => {
                                                    const Icon = ROLE_ICONS[roleName] || UserIcon;
                                                    const isCurrent = roleName === profile.role;
                                                    return (
                                                        <button 
                                                            key={roleName} 
                                                            disabled={processingRole !== null}
                                                            onClick={() => !isCurrent && handleAction(roleName, true)} 
                                                            className={`w-full flex items-center p-4 rounded-[1.8rem] text-sm transition-all relative overflow-hidden group/item ${isCurrent ? 'bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.05)] cursor-default' : 'hover:bg-white/5 active:scale-[0.98] border border-transparent'}`}
                                                        >
                                                            <div className={`p-2.5 rounded-xl mr-5 transition-all duration-700 ${isCurrent ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-white/20'}`}>
                                                                <Icon className="w-5 h-5"/>
                                                            </div>
                                                            <div className="flex-grow text-left">
                                                                <span className={`block text-[11px] font-black uppercase tracking-[0.15em] ${isCurrent ? 'text-primary' : 'text-white/60'}`}>{roleName}</span>
                                                                {isCurrent && <span className="block text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] mt-1">Primary Session</span>}
                                                            </div>
                                                            {processingRole === roleName ? <Spinner size="sm" /> : isCurrent && <CheckCircleIcon className="w-5 h-5 text-primary" />}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Register New Scope */}
                                    {registerableScopes.length > 0 && (
                                        <div className="p-4 pt-2 border-t border-white/5 mt-2 bg-black/20">
                                             <p className="px-5 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                                                 <PlusIcon className="w-3.5 h-3.5 opacity-40"/> Register New Scope
                                             </p>
                                             <div className="space-y-1.5">
                                                {registerableScopes.map(roleName => {
                                                    const Icon = ROLE_ICONS[roleName] || UserIcon;
                                                    return (
                                                        <button 
                                                            key={roleName} 
                                                            disabled={processingRole !== null}
                                                            onClick={() => handleAction(roleName, false)} 
                                                            className="w-full flex items-center p-4 rounded-2xl hover:bg-white/5 transition-all group/item active:scale-[0.98]"
                                                        >
                                                            <div className="p-2.5 rounded-xl bg-white/5 text-white/20 mr-5 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-all duration-500">
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.1em] group-hover/item:text-white transition-colors">
                                                                Onboard as {roleName}
                                                            </span>
                                                            {processingRole === roleName ? <Spinner size="sm" className="ml-auto" /> : <ChevronRightIcon className="w-4 h-4 ml-auto text-white/10 group-hover/item:translate-x-1 transition-all" />}
                                                        </button>
                                                    )
                                                })}
                                             </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Logout Footer */}
                        <div className="p-6 bg-black/40 border-t border-white/5">
                             <button 
                                onClick={onSignOut} 
                                className="w-full flex items-center justify-center gap-4 p-5 rounded-[1.8rem] text-[10px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-[0.4em] shadow-2xl active:scale-[0.97] group/logout"
                             >
                                 <LogoutIcon className="w-5 h-5 transition-transform group-hover/logout:-translate-x-1" /> Terminate Node Session
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;