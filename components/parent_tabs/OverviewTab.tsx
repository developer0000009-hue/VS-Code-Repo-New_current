import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../types';
import Spinner from '../common/Spinner';
import { UsersIcon } from '../icons/UsersIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { FinanceIcon } from '../icons/FinanceIcon';


interface ParentStats {
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
}

interface OverviewTabProps {
    profile?: UserProfile;
    setActiveComponent?: (componentId: string) => void;
}

const GreetingHeader: React.FC<{ name: string }> = ({ name }) => {
    const hour = new Date().getHours();
    let greeting = 'Hello';
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 18) greeting = 'Good Afternoon';
    else greeting = 'Good Evening';

    return (
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-8 shadow-sm mb-8">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary/5 rounded-full filter blur-3xl"></div>
            <div className="relative z-10">
                <h1 className="text-3xl font-serif font-bold md:text-4xl text-foreground">
                    {greeting}, {(name.split(' ')[0] || '').toUpperCase()}!
                </h1>
                <p className="mt-2 text-muted-foreground text-lg max-w-lg">
                    Welcome to your dashboard. Here’s a summary of what's happening with your applications today.
                </p>
            </div>
        </div>
    );
};

const StatWidget: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ReactNode;
    color: string;
    subtext?: string;
}> = ({ title, value, icon, color, subtext }) => {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
        <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className={`text-muted-foreground group-hover:${color} transition-colors`}>
                {icon}
            </div>
        </div>
        <div>
            <h3 className="text-4xl font-bold text-foreground mt-2">{value}</h3>
            {subtext && <p className="text-xs font-medium text-muted-foreground mt-1">{subtext}</p>}
        </div>
    </div>
  );
};


const activities = [
  { id: 1, icon: <CheckCircleIcon className="w-5 h-5" />, color: 'text-emerald-500 bg-emerald-500/10', title: "Application for 'Jane Doe' is Approved!", time: "2h ago", description: "The admission process is complete. You can now download the confirmation letter." },
  { id: 2, icon: <DocumentTextIcon className="w-5 h-5" />, color: 'text-blue-500 bg-blue-500/10', title: "Documents submitted for 'John Smith'", time: "1 day ago", description: "Your submitted documents are now under review by the administration." },
  { id: 3, icon: <CommunicationIcon className="w-5 h-5" />, color: 'text-purple-500 bg-purple-500/10', title: "New message from Admissions Office", time: "3 days ago", description: "Regarding: Follow-up questions for 'John Smith's application." },
  { id: 4, icon: <ClockIcon className="w-5 h-5" />, color: 'text-amber-500 bg-amber-500/10', title: "Application for 'Jane Doe' is 'In Review'", time: "4 days ago", description: "The school administration is currently reviewing the application details." },
];


const OverviewTab: React.FC<OverviewTabProps> = ({ profile, setActiveComponent }) => {
  const [stats, setStats] = useState<ParentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_parent_dashboard_stats');
      if (error) throw error;
      setStats(data);
    } catch (err: any) {
      setError(`Failed to load analytics: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const quickLinks = [
    { title: "Register New Child", description: "Start a new admission process.", icon: <PlusIcon className="w-5 h-5" />, componentId: 'My Children' },
    { title: "Manage Documents", description: "Upload or view required files.", icon: <DocumentTextIcon className="w-5 h-5" />, componentId: 'Documents' },
    { title: "View Fee Structure", description: "Check payment schedules.", icon: <FinanceIcon className="w-5 h-5" />, componentId: null }
  ];

  if (loading) {
      return <div className="flex justify-center items-center p-12"><Spinner size="lg" /></div>;
  }

  if (error) {
      return <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center border border-destructive/20">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <GreetingHeader name={profile?.display_name || 'Parent'} />

      {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatWidget 
                title="Total Applications" 
                value={stats.total_applications} 
                icon={<UsersIcon className="w-6 h-6" />}
                color="text-blue-500"
                subtext="Registered"
            />
            <StatWidget 
                title="Pending Actions" 
                value={stats.pending_applications} 
                icon={<ClockIcon className="w-6 h-6" />}
                color="text-amber-500"
                subtext="Need Attention"
            />
            <StatWidget 
                title="Approved" 
                value={stats.approved_applications} 
                icon={<CheckCircleIcon className="w-6 h-6" />}
                color="text-emerald-500"
                subtext="Students Enrolled"
            />
          </div>
      )}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity / Feed */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm">
              <div className="p-6 border-b border-border">
                  <h3 className="font-bold text-lg">Activity Feed</h3>
                  <p className="text-sm text-muted-foreground">Recent updates on your applications.</p>
              </div>
              <div className="p-6">
                  <ul className="space-y-2">
                      {activities.map((activity, activityIdx) => (
                          <li key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
                               {activityIdx !== activities.length - 1 ? (
                                  <div className="absolute left-5 top-5 h-full w-px bg-border" />
                              ) : null}
                              <div className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-background ${activity.color}`}>
                                  {activity.icon}
                              </div>
                              <div className="flex-grow pt-1">
                                  <div className="flex justify-between items-center text-sm">
                                      <p className="font-medium text-foreground">{activity.title}</p>
                                      <time className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 ml-4">{activity.time}</time>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                              </div>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>

          {/* Quick Links / Info */}
           <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                <div className="space-y-3">
                    {quickLinks.map(link => (
                        <button key={link.title} onClick={() => {
                            if (link.componentId && setActiveComponent) {
                                setActiveComponent(link.componentId);
                            } else {
                                alert('This feature is coming soon!');
                            }
                        }} className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-border transition-all group text-left">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-background rounded-lg text-primary shadow-sm">{link.icon}</div>
                                <div>
                                    <span className="font-semibold text-sm text-foreground">{link.title}</span>
                                    <p className="text-xs text-muted-foreground">{link.description}</p>
                                </div>
                            </div>
                            <svg className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    ))}
                </div>
            </div>
       </div>
    </div>
  );
};

export default OverviewTab;