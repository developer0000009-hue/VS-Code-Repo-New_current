import React, { useState, useEffect } from 'react';
import { SchoolIcon } from '../icons/SchoolIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { MenuGroup } from './AdminMenuConfig';

interface SidebarProps {
    activeComponent: string;
    setActiveComponent: (component: string) => void;
    isCollapsed: boolean;
    setCollapsed: (isCollapsed: boolean) => void;
    isBranchAdmin: boolean;
    isHeadOfficeAdmin: boolean;
    menuGroups: MenuGroup[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
    activeComponent, 
    setActiveComponent, 
    isCollapsed, 
    setCollapsed, 
    isHeadOfficeAdmin,
    menuGroups
}) => {
    // State for the currently open accordion group
    const [expandedGroup, setExpandedGroup] = useState<string | null>('overview');

    // Auto-expand the group containing the active component
    useEffect(() => {
        if (!isCollapsed) {
            const activeGroup = menuGroups.find(group => group.items.some(item => item.id === activeComponent));
            if (activeGroup) {
                setExpandedGroup(activeGroup.id);
            }
        }
    }, [activeComponent, isCollapsed, menuGroups]); // FIX: Removed `expandedGroup` from dependencies to prevent state reversal on manual accordion clicks.

    const handleGroupClick = (groupId: string) => {
        if (isCollapsed) {
            setCollapsed(false);
            setTimeout(() => setExpandedGroup(groupId), 150);
        } else {
            setExpandedGroup(expandedGroup === groupId ? null : groupId);
        }
    };

    return (
        <aside 
            className={`hidden lg:flex fixed top-0 left-0 h-full flex-col bg-card/95 backdrop-blur-xl border-r border-border/60 shadow-xl transition-all duration-300 ease-in-out z-50 ${isCollapsed ? 'w-20' : 'w-[280px]'}`}
            aria-label="Sidebar Navigation"
        >
            {/* Brand Header */}
            <div className={`flex items-center border-b border-border/40 p-4 h-20 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <button 
                    className="flex items-center gap-3 min-w-0 outline-none group" 
                    onClick={() => setActiveComponent('Dashboard')}
                    title="Go to Dashboard"
                >
                    <div className="bg-gradient-to-br from-primary to-indigo-600 p-2 rounded-xl text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                        <SchoolIcon className="h-6 w-6" />
                    </div>
                    {!isCollapsed && <span className="font-serif font-bold text-xl text-foreground tracking-tight truncate">Admin Portal</span>}
                </button>
                {!isCollapsed && (
                    <button 
                        onClick={() => setCollapsed(!isCollapsed)} 
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                        aria-label="Collapse Sidebar"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Mobile Collapse Trigger (when sidebar is collapsed) */}
            {isCollapsed && (
                 <button 
                    onClick={() => setCollapsed(!isCollapsed)} 
                    className="mx-auto mt-4 p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label="Expand Sidebar"
                >
                    <ChevronRightIcon className="h-5 w-5" />
                </button>
            )}
            
            {/* Navigation Items */}
            <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto custom-scrollbar">
                {menuGroups.map((group) => {
                    const isActiveGroup = expandedGroup === group.id;
                    const hasActiveItem = group.items.some(item => item.id === activeComponent);
                    
                    // Collapsed View (Flat List with Dividers)
                    if (isCollapsed) {
                        return (
                            <div key={group.id} className="flex flex-col items-center space-y-2">
                                <div className="h-px w-8 bg-border/60 my-2" />
                                {group.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveComponent(item.id)}
                                        className={`p-2.5 rounded-xl transition-all duration-200 relative group/item ${
                                            activeComponent === item.id
                                                ? 'bg-primary text-primary-foreground shadow-md'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                        title={item.label}
                                    >
                                        {item.icon}
                                        {/* Tooltip on Hover */}
                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-bold rounded-lg shadow-lg opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-border">
                                            {item.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        );
                    }

                    // Expanded View (Accordion)
                    return (
                        <div key={group.id} className="space-y-1">
                            <button
                                onClick={() => handleGroupClick(group.id)}
                                aria-expanded={isActiveGroup}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group/header focus:outline-none focus:ring-2 focus:ring-primary/20
                                    ${hasActiveItem && !isActiveGroup ? 'bg-primary/5 text-primary font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                                `}
                            >
                                <span className="text-xs font-extrabold uppercase tracking-widest group-hover/header:tracking-[0.15em] transition-all duration-300">
                                    {group.title}
                                </span>
                                <ChevronDownIcon 
                                    className={`h-4 w-4 transition-transform duration-300 ease-in-out ${isActiveGroup ? 'rotate-180 text-primary' : 'text-muted-foreground/50'}`} 
                                />
                            </button>

                            <div 
                                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isActiveGroup ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                            >
                                <ul className="overflow-hidden">
                                    {group.items.map((item) => {
                                        const isActive = activeComponent === item.id;
                                        return (
                                            <li key={item.id} className="mb-1 last:mb-2">
                                                <button
                                                    onClick={() => setActiveComponent(item.id)}
                                                    className={`
                                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ml-1 relative overflow-hidden
                                                        ${isActive 
                                                            ? 'text-primary bg-primary/10 shadow-sm font-bold' 
                                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                                        }
                                                    `}
                                                >
                                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></div>}
                                                    <span className={`transition-transform duration-300 ${isActive ? 'scale-110 translate-x-1' : 'group-hover:scale-105'}`}>
                                                        {item.icon}
                                                    </span>
                                                    <span className="truncate">{item.label}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            {!isCollapsed && (
                <div className="p-4 border-t border-border/60 bg-muted/5">
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/10 text-center">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">School Management OS</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">v3.5.2 Enterprise</p>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;