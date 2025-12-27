
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../types';
import Spinner from '../common/Spinner';
import { UsersIcon } from '../icons/UsersIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';

interface ParentStats {
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
}

// --- Premium Minimal Charts (Design Tokens Compliant) ---

const EnrollmentTrendLine = () => {
    // Purpose: Show family progress over time
    const points = "0,35 25,28 50,30 75,15 100,5"; // lineWidth: 2, curve simulation
    return (
        <div className="h-12 w-28 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <path
                    d={`M ${points}`}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_8px_rgba(139,92,246,0.3)] animate-in fade-in slide-in-from-left duration-1000"
                />
                <circle cx="100" cy="5" r="3.5" fill="#8B5CF6" className="animate-pulse" />
            </svg>
        </div>
    );
};

const VerificationDonut = ({ pending, total }: { pending: number; total: number }) => {
    // Purpose: At-a-glance status
    const verified = total - pending;
    const percentage = total > 0 ? (verified / total) * 100 : 0;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDash = (percentage / 100) * circumference;
    
    return (
        <div className="relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
                <circle 
                    cx="50" cy="50" r={radius} 
                    stroke="#22C55E" 
                    strokeWidth="10" 
                    fill="none" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={circumference - strokeDash}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <span className="absolute text-[11px] font-bold text-white/50">{Math.round(percentage)}%</span>
        </div>
    );
};

// --- Metric Card (Design Tokens Compliant) ---

const MetricCard: React.FC<{ 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    chart?: React.ReactNode;
    subtitle?: string;
}> = ({ title, value, icon, chart, subtitle }) => (
    <div className="flex flex-col p-[18px] rounded-[18px] bg-gradient-to-b from-white/[0.06] to-white/[0.03] border border-white/[0.05] shadow-[0_12px_30px_rgba(0,0,0,0.45)] transition-all duration-[160ms] hover:-translate-y-[2px] group">
        <div className="flex justify-between items-start mb-6">
            <div className="p-2.5 rounded-xl bg-white/[0.04] text-white/30 group-hover:text-white/60 transition-colors border border-white/[0.05]">
                {icon}
            </div>
            {chart}
        </div>
        <div>
            <p className="text-[12px] font-medium text-white/30 uppercase tracking-[0.2em] mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-[26px] font-semibold text-white tracking-tight leading-none">{value}</h3>
                {subtitle && <span className="text-[12px] font-medium text-white/20 uppercase tracking-widest">{subtitle}</span>}
            </div>
        </div>
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
    <div className="flex flex-col justify-center items-center py-40 space-y-6">
      <Spinner size="lg" className="text-primary" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Aggregating Life-Cycle Telemetry</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-[28px] animate-in fade-in duration-700 pb-32">
      
      {/* 1. GREETING HEADER (Calm & Elegant) */}
      <section className="relative p-10 md:p-14 rounded-[32px] bg-[#0c0e12] border border-white/[0.05] overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 rounded-full bg-white/[0.03] text-primary text-[10px] font-black uppercase tracking-[0.4em] border border-white/[0.05]">Operational Hub</span>
                    <span className="text-[12px] font-medium text-white/20 uppercase tracking-widest italic">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <div>
                    <h1 className="text-[clamp(28px,2.6vw,36px)] font-serif font-black text-white tracking-[-0.02em] leading-[1.15] uppercase">
                        GREETINGS, <br/>
                        <span className="text-white/30 font-normal italic lowercase">{profile?.display_name?.split(' ')[0] || 'Guardian'}</span>
                    </h1>
                    <p className="text-[14px] text-white/40 leading-relaxed font-serif italic mt-6 max-w-xl border-l border-white/10 pl-8">
                        The institutional network reports stable connectivity. All family identity nodes are currently synchronized with the campus master ledger.
                    </p>
                </div>
              </div>
              
              <div className="flex items-center gap-5 p-5 rounded-[24px] bg-white/[0.03] border border-white/[0.05] shadow-inner">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                    <ShieldCheckIcon className="w-5 h-5"/>
                 </div>
                 <div className="pr-4">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Status</p>
                    <p className="text-[12px] font-black text-white uppercase tracking-widest">Synchronized</p>
                 </div>
              </div>
          </div>
      </section>

      {/* 2. SUMMARY METRIC CARDS (Consistent Height) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        <MetricCard 
            title="Registered Nodes" 
            value={stats.total_applications} 
            icon={<UsersIcon className="w-5 h-5" />} 
            chart={<EnrollmentTrendLine />}
            subtitle="Children"
        />
        <MetricCard 
            title="Verification Queue" 
            value={stats.pending_applications} 
            icon={<ClockIcon className="w-5 h-5" />} 
            chart={<VerificationDonut pending={stats.pending_applications} total={stats.total_applications} />}
            subtitle="Pending"
        />
        <MetricCard 
            title="Identity Clearance" 
            value={stats.approved_applications} 
            icon={<CheckCircleIcon className="w-5 h-5" />} 
            chart={<div className="p-2.5 rounded-full bg-emerald-500/10"><TrendingUpIcon className="w-4 h-4 text-emerald-500" /></div>}
            subtitle="Sealed"
        />
      </div>

      {/* 3. INSIGHTS & ACTIONS GRID */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-[28px] items-stretch">
          
          {/* CHARTS & CRITICAL TELEMETRY (Left Column) */}
          <div className="lg:col-span-8 space-y-[28px]">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-[18px] font-bold text-white/60 tracking-tight">Critical Insights</h3>
                 <button className="text-[12px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors">Full Protocol Audit</button>
              </div>
              
              <div className="bg-[#0f1115] border border-white/[0.05] rounded-[24px] p-10 min-h-[340px] flex flex-col justify-center relative overflow-hidden">
                  {/* Subtle Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  
                  {stats.pending_applications > 0 ? (
                      <div className="space-y-8 relative z-10">
                          <div 
                            className="group flex items-center justify-between p-7 rounded-[20px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all cursor-pointer shadow-lg"
                            onClick={() => setActiveComponent?.('Documents')}
                          >
                              <div className="flex items-center gap-6">
                                  <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-500/10">
                                      <DocumentTextIcon className="w-6 h-6"/>
                                  </div>
                                  <div>
                                      <p className="text-[18px] font-bold text-white tracking-tight">Pending Verification Request</p>
                                      <p className="text-[14px] text-white/30 mt-1 font-medium leading-relaxed max-w-md italic">
                                          Identity cross-check requires document synchronization for <span className="text-amber-500 font-bold">{stats.pending_applications} node(s)</span>.
                                      </p>
                                  </div>
                              </div>
                              <div className="p-3 rounded-full bg-white/[0.02] text-white/20 group-hover:text-primary transition-all group-hover:translate-x-1">
                                  <ChevronRightIcon className="w-5 h-5" />
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center text-center p-12 opacity-20 relative z-10">
                          <CheckCircleIcon className="w-16 h-16 text-emerald-500 mb-6"/>
                          <p className="text-[12px] font-black uppercase tracking-[0.4em] text-white">Registry Optimized</p>
                          <p className="text-[14px] mt-4 font-serif italic max-w-sm text-white/60 leading-relaxed">No high-priority synchronization tasks detected in the local queue.</p>
                      </div>
                  )}
              </div>
          </div>

          {/* QUICK ACTIONS PANEL (Right Column) */}
           <div className="lg:col-span-4 space-y-[28px]">
                <h3 className="text-[18px] font-bold text-white/60 tracking-tight px-2">Node Shortcuts</h3>
                <div className="grid grid-cols-1 gap-[12px]">
                    {[
                        { title: "Register Sibling", icon: <PlusIcon className="w-4 h-4" />, id: 'My Children', desc: 'Initialize new node' },
                        { title: "Verification Vault", icon: <DocumentTextIcon className="w-4 h-4" />, id: 'Documents', desc: 'Manage assets' },
                        { title: "View Inbox", icon: <CommunicationIcon className="w-4 h-4" />, id: 'Messages', desc: 'System broadcasts' }
                    ].map(link => (
                        <button 
                            key={link.title} 
                            onClick={() => setActiveComponent?.(link.id)} 
                            className="group w-full flex items-center justify-between p-6 rounded-[20px] bg-[#0c0e12] hover:bg-white/[0.02] border border-white/[0.04] hover:border-primary/20 transition-all duration-300 text-left"
                        >
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-white/[0.03] rounded-xl text-white/20 group-hover:text-primary transition-colors border border-white/[0.05]">
                                    {link.icon}
                                </div>
                                <div>
                                    <span className="font-bold text-[14px] text-white/80 group-hover:text-white transition-colors uppercase tracking-widest">{link.title}</span>
                                    <p className="text-[12px] font-medium text-white/20 group-hover:text-white/30 transition-colors mt-0.5">{link.desc}</p>
                                </div>
                            </div>
                            <ChevronRightIcon className="w-4 h-4 text-white/10 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
       </div>
       
       <div className="pt-10 border-t border-white/[0.05] flex justify-center opacity-10">
            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-white">Gurukul OS v9.5.1 Deployment Matrix</p>
       </div>
    </div>
  );
};

export default OverviewTab;
