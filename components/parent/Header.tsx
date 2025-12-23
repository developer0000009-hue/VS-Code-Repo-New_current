import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Role, Communication } from '../../types';
import { supabase } from '../../services/supabase';
import ThemeSwitcher from '../common/ThemeSwitcher';
import { BellIcon } from '../icons/BellIcon';
import { SchoolIcon } from '../icons/SchoolIcon';
import ProfileDropdown from '../common/ProfileDropdown';
import NotificationPopover from '../common/NotificationPopover';

interface HeaderProps {
    profile: UserProfile;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
    onSignOut: () => void;
    onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ profile, onSelectRole, onSignOut, onProfileClick }) => {
    const [notifications, setNotifications] = useState<Communication[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const notifButtonRef = useRef<HTMLButtonElement>(null);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            // CRITICAL FIX: The function get_my_messages is expected to return message_id, subject, etc.
            const { data, error } = await supabase.rpc('get_my_messages');
            
            if (error) {
                console.warn("RPC: get_my_messages not found or errored. Check schema v16.2.0 installation.", error.message);
                // Graceful fallback to prevent UI breakage
                setNotifications([]);
                return;
            }

            if (data) {
                // Map message_id to id for consistency with the Communication type
                const mappedData = data.map((item: any) => ({
                    ...item,
                    id: item.message_id
                }));
                setNotifications(mappedData);
            }
        } catch (err) {
            console.error("Critical error fetching notifications:", err);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        
        // Listen for new communications in realtime if the table is enabled
        const channel = supabase
            .channel('public:communications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'communications' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNotifications]);

    const toggleNotifications = () => {
        setIsNotifOpen(!isNotifOpen);
    };

    return (
        <header className="bg-card/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    <div className="flex items-center flex-shrink-0 cursor-pointer group" onClick={() => window.location.hash = '#/'}>
                        <div className="p-2 bg-primary/10 rounded-xl transition-colors group-hover:bg-primary/20">
                            <SchoolIcon className="h-6 w-6 text-primary" />
                        </div>
                        <span className="font-serif font-bold text-xl ml-3 hidden sm:block tracking-tight text-foreground">Parent Portal</span>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 relative">
                        <ThemeSwitcher />
                        
                        <div className="relative">
                            <button 
                                ref={notifButtonRef}
                                onClick={toggleNotifications}
                                className={`p-2.5 rounded-full transition-all relative ${isNotifOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                aria-label="Notifications"
                            >
                                <BellIcon className="h-5 w-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-card animate-pulse"></span>
                                )}
                            </button>
                            
                            <NotificationPopover 
                                isOpen={isNotifOpen}
                                onClose={() => setIsNotifOpen(false)}
                                onViewAll={() => {
                                    setIsNotifOpen(false);
                                    // Navigation handled by ParentDashboard tabs
                                }}
                                notifications={notifications}
                                isLoading={loading}
                            />
                        </div>
                        
                        <div className="h-8 w-px bg-border/50 mx-1 hidden md:block"></div>
                        
                        <ProfileDropdown
                            profile={profile}
                            onSignOut={onSignOut}
                            onSelectRole={onSelectRole}
                            onProfileClick={onProfileClick}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;