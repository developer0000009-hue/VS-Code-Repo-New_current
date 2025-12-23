import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../types';
import Spinner from '../common/Spinner';
import { UsersIcon } from '../icons/UsersIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';

interface ParentStats {
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
}

interface OverviewTabProps {
    profile?: UserProfile;
    setActiveComponent?: (componentId: string) => void;
}

const StatWidget: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between hover:shadow-lg transition-all group">
        <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className={`${color}`}>{icon}</div>
        </div>
        <h3 className="text-4xl font-bold text-foreground mt-2">{value}</h3>
    </div>
);

const OverviewTab: React.FC<OverviewTabProps> = ({ profile, setActiveComponent }) => {
  const [stats, setStats] = useState<ParentStats>({ total_applications: 0, pending_applications: 0, approved_applications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_parent_dashboard_stats');
        if (!error && data) {
            setStats(data);
        }
      } catch (err) {
        console.error("Stats sync error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center items-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-card border border-border p-8 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold">Welcome, {profile?.display_name?.split(' ')[0] || 'Parent'}</h1>
            <p className="text-muted-foreground mt-1">Manage your family's educational lifecycle efficiently.</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget title="My Applications" value={stats.total_applications} icon={<UsersIcon className="w-6 h-6" />} color="text-blue-500" />
        <StatWidget title="Awaiting Review" value={stats.pending_applications} icon={<ClockIcon className="w-6 h-6" />} color="text-amber-500" />
        <StatWidget title="Enrolled Students" value={stats.approved_applications} icon={<CheckCircleIcon className="w-6 h-6" />} color="text-emerald-500" />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[240px]">
              <h3 className="font-bold text-lg border-b border-border pb-4 mb-4">Latest School Alerts</h3>
              <p className="text-muted-foreground italic text-sm text-center py-10">No recent messages from the school administration.</p>
          </div>

           <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4">Quick Shortcuts</h3>
                <div className="space-y-3">
                    {[
                        { title: "Register Sibling", icon: <PlusIcon className="w-5 h-5" />, id: 'My Children' },
                        { title: "Review Documents", icon: <DocumentTextIcon className="w-5 h-5" />, id: 'Documents' },
                        { title: "Generate Access Code", icon: <CommunicationIcon className="w-5 h-5" />, id: 'Share Codes' }
                    ].map(link => (
                        <button key={link.title} onClick={() => setActiveComponent?.(link.id)} className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-border transition-all text-left">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-background rounded-lg text-primary shadow-sm">{link.icon}</div>
                                <span className="font-semibold text-sm">{link.title}</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-muted-foreground"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </button>
                    ))}
                </div>
            </div>
       </div>
    </div>
  );
};

export default OverviewTab;