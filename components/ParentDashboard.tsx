
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, Role } from '../types';
import Header from './parent/Header';
import { ProfileCreationPage } from './ProfileCreationPage';

// Import the tab components
import OverviewTab from './parent_tabs/OverviewTab';
import MyChildrenTab from './parent_tabs/MyChildrenTab';
import DocumentsTab from './parent_tabs/DocumentsTab';
import ShareCodesTab from './parent_tabs/ShareCodesTab';
import MessagesTab from './parent_tabs/MessagesTab';
import { HomeIcon } from './icons/HomeIcon';
import { StudentsIcon } from './icons/StudentsIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CommunicationIcon } from './icons/CommunicationIcon';
import { ReceiptIcon } from './icons/ReceiptIcon'; // Using ReceiptIcon as proxy for "Code/Ticket"

interface ParentDashboardProps {
    profile: UserProfile;
    onSelectRole: (role: Role, isExisting?: boolean) => void;
    onProfileUpdate: () => void;
    onSignOut: () => void;
}

const navItems = [
    { id: 'Overview', label: 'Overview', icon: <HomeIcon className="w-5 h-5" /> },
    { id: 'My Children', label: 'My Children', icon: <StudentsIcon className="w-5 h-5" /> },
    { id: 'Documents', label: 'Documents', icon: <DocumentTextIcon className="w-5 h-5" /> },
    { id: 'Messages', label: 'Messages', icon: <CommunicationIcon className="w-5 h-5" /> },
    { id: 'Share Codes', label: 'Share Codes', icon: <ReceiptIcon className="w-5 h-5" /> },
];

const ParentDashboard: React.FC<ParentDashboardProps> = ({ profile, onSelectRole, onProfileUpdate, onSignOut }) => {
    const [activeComponent, setActiveComponent] = useState('Overview');
    const [focusedAdmissionId, setFocusedAdmissionId] = useState<number | null>(null);

    const handleManageDocuments = (admissionId: number) => {
        setFocusedAdmissionId(admissionId);
        setActiveComponent('Documents');
    };

    const components: { [key: string]: React.ReactNode } = {
        'Overview': <OverviewTab profile={profile} setActiveComponent={setActiveComponent} />,
        'My Children': <MyChildrenTab onManageDocuments={handleManageDocuments} profile={profile} />,
        'Documents': <DocumentsTab focusOnAdmissionId={focusedAdmissionId} onClearFocus={() => setFocusedAdmissionId(null)} />,
        'Messages': <MessagesTab />,
        'Share Codes': <ShareCodesTab />,
        'My Profile': <ProfileCreationPage 
                            profile={profile} 
                            role={profile.role!} 
                            onComplete={onProfileUpdate}
                            onBack={() => setActiveComponent('Overview')} 
                            showBackButton={true} 
                        />,
    };

    const renderComponent = () => {
        return components[activeComponent] || <OverviewTab profile={profile} />;
    };
    
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header 
                profile={profile}
                onSelectRole={onSelectRole}
                onSignOut={onSignOut}
                onProfileClick={() => setActiveComponent('My Profile')}
            />
             <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeComponent !== 'My Profile' && (
                    <div className="mb-8 overflow-x-auto pb-1 scrollbar-hide">
                        <nav className="flex space-x-2 bg-muted/40 p-1.5 rounded-xl border border-border/50 min-w-max" aria-label="Tabs">
                            {navItems.map(item => {
                                const isActive = activeComponent === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveComponent(item.id)}
                                        aria-label={`${item.label} Tab`}
                                        className={`
                                            flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ease-out select-none
                                            ${isActive 
                                                ? 'bg-card text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                            }
                                        `}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                )}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    {renderComponent()}
                </div>
            </main>
        </div>
    );
};

export default ParentDashboard;
