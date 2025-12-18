
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Role, BuiltInRoles } from '../../types';
import { LogoutIcon } from '../icons/LogoutIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { useRoles } from '../../contexts/RoleContext';
// FIX: Add missing import for ROLE_ORDER, which is used for sorting roles in the dropdown.
import { ROLE_ICONS, ROLE_ORDER } from '../../constants';
import { PlusIcon } from '../icons/PlusIcon';
import { supabase } from '../../services/supabase';
import Spinner from './Spinner';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
// FIX: Add missing import for UserIcon, used as a fallback icon for roles.
import { UserIcon } from '../icons/UserIcon';

interface ProfileDropdownProps {
    profile: UserProfile;
    onSignOut: () => void;
    onSelectRole?: (role: Role, isExisting?: boolean) => void;
    onSwitchRole?: () => void;
    onProfileClick?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ profile, onSignOut, onSelectRole, onProfileClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { roles } = useRoles();
    
    const [existingRoles, setExistingRoles] = useState<Set<string>>(new Set());
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

    const checkRoles = useCallback(async () => {
        if (!profile) return;
        setCheckingRoles(true);
        
        try {
            const { data, error } = await supabase.rpc('get_user_completed_roles');
            
            if (!error && data) {
                const found = new Set<string>(data);
                if (profile.role) found.add(profile.role);
                setExistingRoles(found);
            } else {
                 const found = new Set<string>();
                 if (profile.role) found.add(profile.role);
                 setExistingRoles(found);
                 console.warn("Error fetching roles via RPC:", error);
            }
        } catch (e) {
            console.error("Exception fetching roles:", e);
        } finally {
            setCheckingRoles(false);
        }
    }, [profile]);

    useEffect(() => {
        if (isOpen) {
            checkRoles();
        }
    }, [isOpen, checkRoles]);

    const handleAction = (action?: () => void) => {
        if (action) action();
        setIsOpen(false);
    };
    
    const handleSignOutClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSignOut();
        setIsOpen(false);
    };
    
    const internalRoles: string[] = [
        BuiltInRoles.PRINCIPAL, 
        BuiltInRoles.HR_MANAGER, 
        BuiltInRoles.ACADEMIC_COORDINATOR,
        BuiltInRoles.BRANCH_ADMIN
    ];
    
    const availableProfiles = useMemo(() => roles
        .filter(r => existingRoles.has(r))
        .sort((a, b) => {
            if (a === profile.role) return -1;
            if (b === profile.role) return 1;
            // Use ROLE_ORDER for consistent sorting
            const indexA = ROLE_ORDER.indexOf(a);
            const indexB = ROLE_ORDER.indexOf(b);
            if (indexA > -1 && indexB > -1) return indexA - indexB;
            return a.localeCompare(b);
        }), [roles, existingRoles, profile.role]);
    
    const createNewProfiles = useMemo(() => roles
        .filter(r => !existingRoles.has(r) && !internalRoles.includes(r)), 
    [roles, existingRoles, internalRoles]);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all duration-300 group ${isOpen ? 'bg-muted shadow-inner' : 'hover:bg-muted/50'}`}
            >
                <div className="relative">
                    <img 
                        className="h-9 w-9 rounded-full object-cover border-2 border-background shadow-sm" 
                        src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                        alt="Avatar" 
                    />
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full z-10"></div>
                </div>
                
                <div className="hidden md:flex flex-col items-start text-left mr-1">
                    <span className="text-xs font-bold text-foreground leading-tight max-w-[100px] truncate">{profile.display_name}</span>
                    <span className="text-[10px] font-medium text-muted-foreground max-w-[100px] truncate">{profile.role || 'Guest'}</span>
                </div>
                
                <ChevronDownIcon className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'group-hover:text-foreground'}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-border origin-top-right ring-1 ring-black/5 focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex flex-col">
                        <div className="p-4 flex items-center gap-4 border-b border-border/60">
                             <img className="h-12 w-12 rounded-full object-cover" src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} alt="Avatar" />
                             <div className="min-w-0">
                                 <p className="font-bold text-foreground truncate">{profile.display_name}</p>
                                 <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                                 {profile.role && <div className="mt-1"><span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">{profile.role}</span></div>}
                             </div>
                        </div>
                        
                        <div className="p-2">
                             <button onClick={() => handleAction(onProfileClick)} className="w-full flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                                 <SettingsIcon className="w-4 h-4 text-muted-foreground" /> Manage Account
                             </button>
                        </div>

                        <div className="flex-grow max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar">
                            {checkingRoles ? <div className="py-8 flex justify-center"><Spinner /></div> : (
                                <>
                                    {availableProfiles.length > 1 && onSelectRole && (
                                        <div className="p-2">
                                            <p className="px-3 py-1 text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-widest">Switch Profile</p>
                                            {availableProfiles.map(role => {
                                                const Icon = ROLE_ICONS[role] || UserIcon;
                                                const isCurrent = role === profile.role;
                                                return (
                                                    <button key={role} onClick={() => !isCurrent && handleAction(() => onSelectRole(role, true))} disabled={isCurrent} className={`w-full flex items-center p-3 rounded-lg text-sm transition-colors ${isCurrent ? 'bg-primary/10 cursor-default' : 'hover:bg-muted'}`}>
                                                        <Icon className={`w-5 h-5 mr-3 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}/>
                                                        <div className="flex-grow text-left">
                                                            <span className={isCurrent ? 'font-bold text-primary' : 'font-medium text-foreground'}>{role}</span>
                                                            {isCurrent && <span className="block text-xs text-muted-foreground">Currently Active</span>}
                                                        </div>
                                                        {isCurrent && <CheckCircleIcon className="w-5 h-5 text-primary" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {createNewProfiles.length > 0 && onSelectRole && (
                                        <div className="p-2">
                                             <p className="px-3 py-1 text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-widest">Add New Profile</p>
                                             {createNewProfiles.map(role => {
                                                 const Icon = ROLE_ICONS[role] || UserIcon;
                                                 return (
                                                     <button key={role} onClick={() => handleAction(() => onSelectRole(role, false))} className="w-full flex items-center p-3 rounded-lg text-sm hover:bg-muted transition-colors">
                                                         <Icon className="w-5 h-5 mr-3 text-muted-foreground" />
                                                         <span className="font-medium text-foreground">{`Create ${role} Profile`}</span>
                                                         <PlusIcon className="w-4 h-4 ml-auto text-muted-foreground" />
                                                     </button>
                                                 )
                                             })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-2 border-t border-border/60">
                             <button onClick={handleSignOutClick} className="w-full flex items-center gap-3 p-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                                 <LogoutIcon className="w-4 h-4"/> Sign Out
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
