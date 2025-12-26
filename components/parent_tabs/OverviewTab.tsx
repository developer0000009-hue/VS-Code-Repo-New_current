import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../types';
import Spinner from '../common/Spinner';
import { UsersIcon } from '../icons/UsersIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';

interface ParentStats {
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
}

const StatWidget: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className="bg-[#0f1115] border border-white/5 rounded-[2rem] p-6 md:p-8 flex flex-col justify-between hover:border-white/20 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden h-full shadow-lg shadow-black/40">
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-700`}></div>
        <div className="flex justify-between items-start relative z-10 mb-6">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{title}</p>
            <div className={`p-3 rounded-2xl bg-white/5 ${color} shadow-inner ring-1 ring-inset ring-white/5`}>{icon}</div>
        </div>
        <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter relative z-10">{value}</h3>
    </div>
);

const OverviewTab: React.FC<{ profile?: UserProfile; setActiveComponent?: (id: string) => void }> = ({ profile, setActiveComponent }) => {
  const [stats, setStats] = useState<ParentStats>({ total_applications: 0, pending_applications: 0, approved_applications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_parent_dashboard_stats');
        if (!error && data) setStats(data);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 gap-6">
      <Spinner size="lg" className="text-primary" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Aggregating Life-Cycle Telemetry</p>
    </div>
  );

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-1000">
      {/* Responsive Hero Welcome */}
      <section className="relative overflow-hidden bg-[#0c0e12] border border-white/5 p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl shadow-black/50 ring-1 ring-white/10">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none opacity-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[0.3em] border border-primary/20">Operational Hub</span>
                    <div className="w-1 h-1 rounded-full bg-white/20"></div>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
                </div>
                <h1 className="text-4xl md:text-7xl font-serif font-black text-white tracking-tighter leading-none uppercase">
                    Greetings, <span className="text-white/20 italic">{profile?.display_name?.split(' ')[0] || 'Guardian'}</span>
                </h1>
                <p className="text-white/40 text-lg md:text-xl font-medium leading-relaxed font-serif italic max-w-xl">
                    Institutional status is currently stable. Your family's academic telemetry is synchronized across all active nodes.
                </p>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
                 <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-inner"><ShieldCheckIcon className="w-6 h-6"/></div>
                 <div className="pr-4">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Global Status</p>
                    <p className="text-sm font-black text-white uppercase tracking-wider">Synchronized</p>
                 </div>
              </div>
          </div>
      </section>

      {/* Adaptive Grid for Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <StatWidget title="Registration Nodes" value={stats.total_applications} icon={<UsersIcon className="w-6 h-6" />} color="text-blue-500" />
        <StatWidget title="Verification Queue" value={stats.pending_applications} icon={<ClockIcon className="w-6 h-6" />} color="text-amber-500" />
        <StatWidget title="Active Enrollment" value={stats.approved_applications} icon={<CheckCircleIcon className="w-6 h-6" />} color="text-emerald-500" />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* Priority Tasks */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-xs font-black uppercase text-white/30 tracking-[0.4em]">Priority Ledger</h3>
                 <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Full Protocol History</button>
              </div>
              
              <div className="bg-[#0f1115] border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-4 md:p-8 shadow-3xl min-h-[300px] flex flex-col justify-center">
                  {stats.pending_applications > 0 ? (
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl animate-in slide-in-from-top-4 transition-all cursor-pointer group hover:bg-amber-500/10" onClick={() => setActiveComponent?.('Documents')}>
                              <div className="flex items-center gap-5">
                                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl shadow-inner border border-amber-500/20"><DocumentTextIcon className="w-6 h-6"/></div>
                                  <div>
                                      <p className="font-bold text-white text-base">Action Required: Documents</p>
                                      <p className="text-xs text-white/40 mt-1">Verification is pending for {stats.pending_applications} profile nodes.</p>
                                  </div>
                              </div>
                              <div className="p-2 rounded-full bg-white/5 text-amber-500 transition-transform group-hover:translate-x-1"><ChevronRightIcon className="w-5 h-5" /></div>
                          </div>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center text-center p-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-2xl"><CheckCircleIcon className="w-8 h-8"/></div>
                          <p className="text-xs font-black uppercase tracking-[0.4em] text-white">Registry Clear</p>
                          <p className="text-sm mt-3 font-medium font-serif italic max-w-xs leading-relaxed">No high-priority administrative tasks detected in your queue.</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Quick Access Grid */}
           <div className="lg:col-span-5 space-y-6 md:space-y-8">
                <h3 className="text-xs font-black uppercase text-white/30 tracking-[0.4em] px-2">Node Shortcuts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                    {[
                        { title: "Register Sibling", icon: <PlusIcon className="w-5 h-5" />, id: 'My Children', desc: 'Initialize enrollment' },
                        { title: "Verification Vault", icon: <DocumentTextIcon className="w-5 h-5" />, id: 'Documents', desc: 'Manage assets' },
                        { title: "Institutional Sync", icon: <ShieldCheckIcon className="w-5 h-5" />, id: 'Share Codes', desc: 'Auth protocol' }
                    ].map(link => (
                        <button 
                            key={link.title} 
                            onClick={() => setActiveComponent?.(link.id)} 
                            className="group w-full flex items-center justify-between p-6 rounded-3xl bg-[#0c0e12] hover:bg-[#12141a] border border-white/5 hover:border-primary/40 transition-all duration-500 text-left shadow-xl shadow-black/50 ring-1 ring-white/[0.02]"
                        >
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-white/5 rounded-2xl text-white/30 group-hover:text-primary group-hover:bg-primary/10 transition-all duration-500 shadow-inner border border-white/5 group-hover:border-primary/20">
                                    {link.icon}
                                </div>
                                <div>
                                    <span className="font-bold text-sm md:text-base text-white group-hover:text-primary transition-colors tracking-tight">{link.title}</span>
                                    <p className="text-[10px] font-black uppercase text-white/10 tracking-widest mt-1 group-hover:text-white/20">{link.desc}</p>
                                </div>
                            </div>
                            <div className="p-2 rounded-full bg-white/5 text-white/10 transition-all group-hover:text-primary group-hover:translate-x-1"><ChevronRightIcon className="w-5 h-5" /></div>
                        </button>
                    ))}
                </div>
            </div>
       </div>
    </div>
  );
};

const PlusIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const ChevronRightIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);

export default OverviewTab;