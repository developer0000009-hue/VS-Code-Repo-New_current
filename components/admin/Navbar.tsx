import React, { useState } from 'react';
import { MenuIcon } from '../icons/MenuIcon';
import { XIcon } from '../icons/XIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { BellIcon } from '../icons/BellIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import ThemeSwitcher from '../common/ThemeSwitcher';
import ProfileDropdown from '../common/ProfileDropdown';
import { UserProfile, Role, SchoolBranch } from '../../types';
import { MenuGroup } from './AdminMenuConfig';

interface NavbarProps {
    activeComponent: string;
    setActiveComponent: (component: string) => void;
    isBranchAdmin: boolean;
    isHeadOfficeAdmin: boolean;
    profile: UserProfile;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
    onSignOut: () => void;
    branches: SchoolBranch[];
    currentBranchId: number | null;
    onSwitchBranch: (id: number) => void;
    menuGroups: MenuGroup[];
}

const Navbar: React.FC<NavbarProps> = ({ 
    activeComponent, 
    setActiveComponent, 
    isBranchAdmin, 
    isHeadOfficeAdmin,
    profile,
    onSelectRole,
    onSignOut,
    branches,
    currentBranchId,
    onSwitchBranch,
    menuGroups
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const currentBranch = branches.find(b => b.id === currentBranchId);

    return (
        <>
            {/* Desktop Navbar - Clean, Right Aligned */}
            <nav className="hidden lg:flex items-center justify-end h-20 px-8 bg-card/75 backdrop-blur-2xl border-b border-border/60 sticky top-0 z-40 transition-all duration-300">
                <div className="flex items-center gap-4">
                    {branches.length > 0 && (
                        <div className="relative group mr-2">
                            {isBranchAdmin ? (
                                <div className="flex items-center gap-2 pl-3 pr-4 py-2 text-xs font-bold text-foreground rounded-full bg-muted/50 border border-border shadow-sm">
                                    <span className="truncate max-w-[150px]">{currentBranch?.name}</span>
                                    {currentBranch?.is_main_branch && <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-extrabold tracking-wide">HO</span>}
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        value={currentBranchId || ''}
                                        onChange={(e) => onSwitchBranch(parseInt(e.target.value))}
                                        className="appearance-none bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border/60 pl-4 pr-10 py-2 rounded-full text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all min-w-[200px] shadow-sm"
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}{b.is_main_branch ? ' - Head Office' : (b.city ? ` - ${b.city}` : '')}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                        <ChevronDownIcon className="w-3 h-3" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="h-6 w-px bg-border/60"></div>

                    <div className="relative hidden xl:block">
                        <button className="p-2.5 text-muted-foreground hover:bg-muted/60 hover:text-primary rounded-full transition-all duration-200">
                            <SearchIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <ThemeSwitcher />
                    
                    <button className="relative p-2.5 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-200 group">
                        <BellIcon className="h-5 w-5 group-hover:animate-swing" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-card animate-pulse"></span>
                    </button>
                    
                    <div className="pl-2">
                        <ProfileDropdown
                            profile={profile}
                            onSignOut={onSignOut}
                            onSelectRole={onSelectRole}
                            onProfileClick={() => setActiveComponent('Profile')}
                        />
                    </div>
                </div>
            </nav>

            {/* Mobile Navbar */}
            <nav className="lg:hidden flex items-center justify-between h-16 px-4 bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <span className="font-serif font-bold text-lg text-foreground">Admin Portal</span>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeSwitcher />
                    <ProfileDropdown profile={profile} onSignOut={onSignOut} onSelectRole={onSelectRole} />
                </div>
            </nav>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className="absolute left-0 top-0 bottom-0 w-80 bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="p-5 border-b border-border flex justify-between items-center bg-muted/10">
                             <div className="flex items-center gap-3">
                                <div className="bg-primary p-2 rounded-lg text-primary-foreground shadow-md"><SchoolIcon className="h-5 w-5" /></div>
                                <span className="font-bold text-lg">Menu</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><XIcon className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {menuGroups.map((group) => (
                                <div key={group.title} className="space-y-1">
                                    <p className="px-4 py-2 text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{group.title}</p>
                                    <div className="space-y-1">
                                        {group.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => { setActiveComponent(item.id); setIsMobileMenuOpen(false); }}
                                                className={`
                                                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                                                    ${activeComponent === item.id 
                                                        ? 'bg-primary text-primary-foreground shadow-md' 
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                    }
                                                `}
                                            >
                                                <span className={`${activeComponent === item.id ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`}>
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-5 border-t border-border bg-muted/20">
                            {branches.length > 0 && (
                                <div className="mb-5">
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Current Branch</label>
                                    <div className="relative">
                                        <select
                                            value={currentBranchId || ''}
                                            onChange={(e) => onSwitchBranch(parseInt(e.target.value))}
                                            className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
                                            disabled={isBranchAdmin}
                                        >
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}{b.is_main_branch ? ' - Head Office' : (b.city ? ` - ${b.city}` : '')}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border shadow-sm">
                                <img className="h-10 w-10 rounded-full object-cover border border-border" src={`https://api.dicebear.com/8.x/initials/svg?seed=${profile.display_name}`} alt="" />
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold truncate text-foreground">{profile.display_name}</p>
                                    <p className="text-xs text-muted-foreground truncate font-medium">{profile.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;