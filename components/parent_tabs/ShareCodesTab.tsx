
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { ShareCode, AdmissionApplication, ShareCodeType } from '../../types';
import Spinner from '../common/Spinner';
import { KeyIcon } from '../icons/KeyIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { RefreshIcon } from '../icons/RefreshIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { MailIcon } from '../icons/MailIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { UsersIcon } from '../icons/UsersIcon';
import PremiumAvatar from '../common/PremiumAvatar';

/**
 * Enterprise Credential UI Tokens
 * Spacing: Vertical stack with standardized gaps
 * Typography: Mono-spaced Token for security context
 * Buttons: Primary (Handshake), Secondary (Revocation)
 */

const resolveSystemError = (err: any): string => {
    if (!err) return "Protocol synchronization failed.";
    const rawMsg = String(err.message || err);
    if (rawMsg.includes("best candidate function") || rawMsg.includes("42P13") || rawMsg.includes("42725")) {
        return "The authorization terminal is undergoing a mandatory security update. Please retry in a few moments.";
    }
    return typeof rawMsg === 'string' ? rawMsg : "Identity handshake is temporarily unavailable.";
};

const ShareCodesTab: React.FC = () => {
    const [codes, setCodes] = useState<ShareCode[]>([]);
    const [myApplications, setMyApplications] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedPermitId, setFocusedPermitId] = useState<number | null>(null);
    const [copyFeedback, setCopyFeedback] = useState(false);

    const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>('');
    const [permitType, setPermitType] = useState<ShareCodeType>('Enquiry');
    const [memo, setMemo] = useState('');

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const [appsRes, codesRes] = await Promise.all([
                supabase.rpc('get_my_children_profiles'),
                supabase.rpc('get_my_share_codes')
            ]);

            const apps = Array.isArray(appsRes.data) ? appsRes.data : [];
            const activeCodes = Array.isArray(codesRes.data) ? codesRes.data : [];

            setMyApplications(apps as AdmissionApplication[]);
            setCodes(activeCodes as ShareCode[]);
            
            if (!selectedAdmissionId && apps.length > 0) {
                setSelectedAdmissionId(apps[0].id.toString());
            }
        } catch (err: any) {
            console.error("Registry Sync Failure:", err);
            setError(resolveSystemError(err));
        } finally {
            setLoading(false);
        }
    }, [selectedAdmissionId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        const admId = Number(selectedAdmissionId);
        if (!admId || isNaN(admId) || actionLoading) return;
        
        setActionLoading(true);
        setError(null);
        
        try {
            const { data, error: rpcError } = await supabase.rpc('generate_admission_share_code', {
                p_admission_id: admId,
                p_purpose: memo || 'Institutional Handshake',
                p_code_type: String(permitType), 
            });

            if (rpcError) throw rpcError;

            if (data?.success) {
                setMemo('');
                await fetchData(true);
                if (data.id) setFocusedPermitId(data.id);
            } else {
                setError(data?.details || data?.error || "Permit provisioning protocol rejected.");
            }
        } catch (err: any) {
            setError(resolveSystemError(err));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevoke = async (id: number) => {
        if (!confirm("TERMINATION PROTOCOL: Decommissioning this permit immediately revokes campus access. Proceed?")) return;
        setActionLoading(true);
        try {
            const { error: rpcError } = await supabase.rpc('revoke_my_share_code', { p_code_id: id });
            if (rpcError) throw rpcError;
            await fetchData(true);
            if (focusedPermitId === id) setFocusedPermitId(null);
        } catch (err: any) {
            setError(resolveSystemError(err));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    const focusedPermit = useMemo(() => 
        (Array.isArray(codes) ? codes : []).find(c => c.id === focusedPermitId), 
    [codes, focusedPermitId]);

    if (loading && codes.length === 0 && !error) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Spinner size="lg" className="text-primary" />
                <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] animate-pulse">Establishing Secure Stream</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-16 animate-in fade-in duration-1000 pb-40">
            
            {/* --- HERO SECTION --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
                <div className="max-w-4xl space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-inner">
                            <ShieldCheckIcon className="w-6 h-6"/>
                        </div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em] border-l border-primary/30 pl-4">Authorization Terminal</span>
                    </div>
                    <div>
                        <h2 className="text-[clamp(34px,3.2vw,48px)] font-serif font-black text-white tracking-[-0.03em] leading-none uppercase">
                            Digital <span className="text-white/30 font-normal italic">Permits.</span>
                        </h2>
                        <p className="text-white/50 text-[18px] leading-relaxed font-serif italic mt-6 border-l-2 border-white/5 pl-8 max-w-2xl">
                            Provision cryptographic access tokens to authorize institutional administrators. Seamlessly resolve identity nodes and verification vaults with time-bound integrity.
                        </p>
                    </div>
                </div>
                <button onClick={() => fetchData()} className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white transition-all border border-white/5 group shadow-sm active:scale-95">
                    <RefreshIcon className={`w-5 h-5 ${actionLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-10 rounded-[3rem] flex items-start gap-8 animate-in shake duration-500 shadow-2xl relative overflow-hidden ring-1 ring-red-500/10">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 opacity-50"></div>
                    <AlertTriangleIcon className="w-10 h-10 shrink-0 mt-1" />
                    <div className="flex-grow">
                        <p className="text-xs font-black uppercase tracking-widest mb-3">Protocol Violation Detected</p>
                        <p className="text-[16px] font-medium leading-relaxed text-red-200/70">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="p-3 hover:bg-red-500/20 rounded-full transition-colors text-red-500"><XCircleIcon className="w-8 h-8"/></button>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                
                {/* --- PROVISIONING PANE --- */}
                <div className="xl:col-span-4 bg-[#0d0f14] border border-white/5 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden ring-1 ring-white/5 h-full">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none transform rotate-12 scale-150"><KeyIcon className="w-72 h-72 text-white" /></div>
                    
                    <form onSubmit={handleGenerate} className="space-y-12 relative z-10">
                        <div className="space-y-8">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] block ml-1">Identity Selection</label>
                            {(!myApplications || myApplications.length === 0) ? (
                                <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] group hover:border-primary/30 transition-all cursor-pointer" onClick={() => fetchData()}>
                                    <UsersIcon className="w-12 h-12 mx-auto mb-6 text-white/10 group-hover:text-primary transition-colors" />
                                    <p className="text-sm font-bold text-white/20 italic font-serif">No registered nodes found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-3">
                                    {myApplications.map(app => (
                                        <button
                                            key={app.id} type="button" onClick={() => setSelectedAdmissionId(app.id.toString())}
                                            className={`w-full flex items-center gap-5 p-5 rounded-[1.8rem] border transition-all duration-500 ${selectedAdmissionId === app.id.toString() ? 'bg-primary/10 border-primary/50 shadow-xl ring-1 ring-primary/20 scale-[1.02]' : 'bg-white/5 border-transparent hover:bg-white/[0.08]'}`}
                                        >
                                            <PremiumAvatar src={app.profile_photo_url} name={app.applicant_name} size="sm" className="w-12 h-12 shadow-lg" />
                                            <div className="text-left min-w-0 flex-grow">
                                                <p className={`font-black text-[15px] truncate tracking-tight ${selectedAdmissionId === app.id.toString() ? 'text-white' : 'text-white/60'}`}>{app.applicant_name}</p>
                                                <p className="text-[10px] text-white/20 font-bold uppercase mt-1 tracking-widest leading-none">Grade {app.grade} Node</p>
                                            </div>
                                            {selectedAdmissionId === app.id.toString() && <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center animate-in zoom-in"><CheckCircleIcon className="w-4 h-4" /></div>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-8">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] block ml-1">Handshake Scope</label>
                            <div className="grid grid-cols-1 gap-5">
                                {[
                                    { id: 'Enquiry', label: 'Discovery Mode', desc: 'Minimal metadata for basic campus review.', icon: <MailIcon className="w-5 h-5"/> },
                                    { id: 'Admission', label: 'Full Integrity', desc: 'Complete verified record & vault synchronization.', icon: <DocumentTextIcon className="w-5 h-5"/> }
                                ].map(type => (
                                    <button
                                        key={type.id} type="button" onClick={() => setPermitType(type.id as ShareCodeType)}
                                        className={`relative p-8 rounded-[2rem] border-2 text-left transition-all duration-500 group overflow-hidden ${permitType === type.id ? 'bg-primary/5 border-primary/40 shadow-xl ring-4 ring-primary/5 scale-[1.02]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="flex items-center gap-5 mb-4">
                                            <div className={`p-3 rounded-2xl transition-all duration-500 ${permitType === type.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/20'}`}>{type.icon}</div>
                                            <h4 className={`text-sm font-black uppercase tracking-[0.2em] ${permitType === type.id ? 'text-primary' : 'text-white/60'}`}>{type.label}</h4>
                                        </div>
                                        <p className="text-[12px] text-white/30 leading-relaxed font-medium pl-14">{type.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-1 block">Context Label</label>
                            <input 
                                type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="e.g. Principal Review"
                                className="w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] p-6 text-sm text-white font-medium focus:border-primary focus:bg-white/[0.04] outline-none transition-all shadow-inner placeholder:text-white/10"
                            />
                        </div>

                        <button 
                            type="submit" disabled={!selectedAdmissionId || actionLoading}
                            className={`w-full py-7 rounded-[1.8rem] text-sm font-black uppercase tracking-[0.3em] transition-all duration-500 transform flex items-center justify-center gap-4 ${!selectedAdmissionId || actionLoading ? 'bg-white/5 text-white/10 border border-white/5 cursor-not-allowed shadow-none' : 'bg-primary text-white shadow-2xl shadow-primary/40 hover:-translate-y-1 active:scale-95'}`}
                        >
                            {actionLoading ? <Spinner size="sm" className="text-white" /> : 'Provision Permit'}
                        </button>
                    </form>
                </div>

                {/* --- REGISTRY & DETAIL PANE --- */}
                <div className="xl:col-span-8 flex flex-col lg:flex-row gap-12 min-h-[700px]">
                    
                    {/* List */}
                    <div className="lg:w-1/2 flex flex-col space-y-8">
                        <div className="flex justify-between items-center px-4">
                             <h3 className="text-2xl font-serif font-black text-white tracking-tight uppercase">Permit <span className="text-white/20 italic">Registry.</span></h3>
                             <span className="text-[10px] font-black text-white/30 uppercase tracking-widest bg-white/[0.03] px-5 py-2.5 rounded-2xl border border-white/5">{(codes || []).length} Active Nodes</span>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[750px] custom-scrollbar pr-4">
                            {(!codes || codes.length === 0) ? (
                                <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3.5rem] bg-white/[0.01] opacity-40">
                                    <KeyIcon className="w-20 h-20 mx-auto mb-8 text-white/20" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 leading-relaxed px-16 text-center italic">Neural Registry Standby. No active permits provisioned.</p>
                                </div>
                            ) : (
                                codes.map(code => (
                                    <button 
                                        key={code.id} onClick={() => setFocusedPermitId(code.id)}
                                        className={`w-full text-left p-8 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden active:scale-[0.98] ${focusedPermitId === code.id ? 'bg-[#1a1d24] border-primary/40 shadow-2xl ring-2 ring-primary/5 z-10' : 'bg-[#0d0f14] border-white/5 hover:border-white/10'} ${code.status !== 'Active' ? 'opacity-40 grayscale blur-[0.5px]' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-6">
                                                <PremiumAvatar src={code.profile_photo_url} name={code.applicant_name} size="sm" className="w-14 h-14 border border-white/10 shadow-lg"/>
                                                <div>
                                                    <h4 className={`font-serif font-bold text-xl text-white transition-colors duration-500 ${focusedPermitId === code.id ? 'text-primary' : 'group-hover:text-primary'}`}>{code.applicant_name}</h4>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border backdrop-blur-md ${code.code_type === 'Admission' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{code.code_type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {focusedPermitId === code.id && (
                                                <div className="absolute right-8 top-1/2 -translate-y-1/2 animate-in slide-in-from-right-4 duration-500">
                                                    <ChevronRightIcon className="w-8 h-8 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Detail Card (The "Credential Artifact") */}
                    <div className="lg:w-1/2 bg-[#0d0f14] border border-white/5 rounded-[3.5rem] p-10 md:p-12 flex flex-col shadow-[0_48px_128px_-24px_rgba(0,0,0,1)] relative overflow-hidden ring-1 ring-white/5">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-600 to-primary opacity-40"></div>
                        
                        {focusedPermit ? (
                            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="flex-grow space-y-12">
                                    {/* Identity Section */}
                                    <div className="flex items-center gap-6">
                                        <div className="relative group/avatar">
                                            <div className="absolute -inset-1.5 bg-primary/10 rounded-full blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity"></div>
                                            <PremiumAvatar src={focusedPermit.profile_photo_url} name={focusedPermit.applicant_name} size="md" className="w-20 h-20 shadow-2xl relative z-10 border border-white/10" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1.5 leading-none">Identity Handshake</p>
                                            <h3 className="text-3xl font-serif font-bold text-white tracking-tight leading-none uppercase truncate">{focusedPermit.applicant_name}</h3>
                                        </div>
                                    </div>

                                    {/* The Token Block */}
                                    <div 
                                        className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 md:p-12 text-center shadow-inner group/code cursor-pointer active:scale-95 transition-all relative overflow-hidden" 
                                        onClick={() => handleCopy(focusedPermit.code)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.03] to-transparent pointer-events-none"></div>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8 relative z-10">Cryptographic Token</p>
                                        <span className="font-mono font-black text-4xl md:text-5xl text-white tracking-[0.4em] drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] group-hover/code:text-primary transition-colors duration-500 relative z-10">
                                            {focusedPermit.code}
                                        </span>
                                        <p className={`text-[10px] font-black uppercase mt-10 transition-all tracking-[0.3em] relative z-10 ${copyFeedback ? 'text-emerald-500 scale-105' : 'text-white/10 group-hover/code:text-white/30'}`}>
                                            {copyFeedback ? 'PROTOCOL SYNC COMPLETE' : 'INITIALIZE HANDSHAKE'}
                                        </p>
                                    </div>

                                    {/* Metadata Section */}
                                    <div className="space-y-6 px-2">
                                        <div className="flex items-start gap-6 group/info">
                                            <div className="p-3.5 bg-white/[0.03] rounded-2xl text-white/20 border border-white/5 shadow-sm transition-all group-hover/info:text-primary group-hover/info:bg-primary/10 group-hover/info:border-primary/20"><InfoIcon className="w-5.5 h-5.5"/></div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2 leading-none">Expiration Protocol</p>
                                                <p className="text-[15px] font-bold text-white/70 leading-relaxed font-serif">
                                                    {new Date(focusedPermit.expires_at).toLocaleString(undefined, { 
                                                        weekday: 'long', 
                                                        day: 'numeric', 
                                                        month: 'long', 
                                                        year: 'numeric',
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    }).replace(',', '')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 group/life">
                                            <div className="p-3.5 bg-white/[0.03] rounded-2xl text-white/20 border border-white/5 shadow-sm transition-all group-hover/life:text-emerald-400 group-hover/life:bg-emerald-500/10 group-hover/life:border-emerald-500/20"><ClockIcon className="w-5.5 h-5.5"/></div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2 leading-none">Node Status</p>
                                                <p className={`text-[13px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border shadow-[0_0_15px_rgba(16,185,129,0.1)] ${focusedPermit.status === 'Active' ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20' : 'text-white/20 bg-white/5 border-white/10'}`}>
                                                    {focusedPermit.status}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Bar */}
                                <div className="mt-auto pt-10 border-t border-white/5">
                                    <div className="flex gap-4">
                                        {focusedPermit.status === 'Active' && (
                                            <button 
                                                onClick={() => handleRevoke(focusedPermit.id)} disabled={actionLoading}
                                                className="flex-1 h-[62px] rounded-2xl bg-red-500/5 hover:bg-red-600 text-red-500 hover:text-white font-black text-[11px] uppercase tracking-[0.4em] transition-all border border-red-500/10 shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                                            >
                                                {actionLoading ? <Spinner size="sm" /> : <><TrashIcon className="w-4 h-4"/> Revoke Node</>}
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleCopy(focusedPermit.code)}
                                            className="flex-1 h-[62px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center"
                                        >
                                            Secure Share
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center px-16 animate-in fade-in duration-1000">
                                <div className="w-32 h-32 bg-white/5 rounded-[3rem] flex items-center justify-center mb-10 border border-white/10 shadow-2xl relative group">
                                    <ShieldCheckIcon className="w-12 h-12 text-white/10 relative z-10 transition-all group-hover:scale-110 group-hover:text-primary" />
                                    <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <h3 className="text-3xl font-serif font-black text-white mb-4 uppercase tracking-tight leading-none">Handshake Review</h3>
                                <p className="text-[15px] text-white/20 leading-relaxed font-medium max-w-sm italic font-serif">
                                    Select a node from the registry to inspect cryptographic metadata, temporal constraints, and access scope.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ShareCodesTab;
