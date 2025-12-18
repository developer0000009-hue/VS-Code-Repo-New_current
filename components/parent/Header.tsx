
import React, { useState, useEffect, useRef } from 'react';
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

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_my_messages');
            if (!error && data) {
                // Map message_id to id
                const mappedData = data.map((item: any) => ({
                    ...item,
                    id: item.message_id
                }));
                setNotifications(mappedData);
            } else if (error) {
                console.error("Notification fetch error:", error.message || error);
            }
            setLoading(false);
        };
        fetchNotifications();
        
        // Optional: Set up a realtime subscription here if needed
    }, []);

    const toggleNotifications = () => {
        setIsNotifOpen(!isNotifOpen);
    };

    return (
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center flex-shrink-0">
                        <SchoolIcon className="h-8 w-8 text-primary" />
                        <span className="font-bold text-lg ml-3 hidden sm:block">Parent Portal</span>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 relative">
                        <ThemeSwitcher />
                        
                        <div className="relative">
                            <button 
                                ref={notifButtonRef}
                                onClick={toggleNotifications}
                                className={`p-2 rounded-full transition-colors relative ${isNotifOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
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
                                    // Assuming navigation to messages tab handles this via parent dashboard state
                                    const messagesTabBtn = document.querySelector('button[aria-label="Messages Tab"]'); // Or implement explicit nav callback
                                    if(messagesTabBtn) (messagesTabBtn as HTMLElement).click();
                                }}
                                notifications={notifications}
                                isLoading={loading}
                            />
                        </div>
                        
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
