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
 * Fortified Enterprise Error Resolver.
 * Strips recursive pointers and ensures only primitive string payloads reach the UI state.
 */
const resolveSystemError = (err: any): string => {
    if (!err) return "Protocol synchronization failed.";
    
    if (err.error === "HANDSHAKE_RESTRICTED") {
        return err.details || "Access Denied: You do not have management precedence for this identity block.";
    }

    if (typeof err === 'string') {
        return (err.includes("[object Object]") || err === "{}") ? "Handshake protocol failure." : err;
    }
    
    const candidates = [
        err.message,
        err.error_description,
        err.details,
        err.hint,
        err.error?.message,
        err.error
    ];

    for (const val of candidates) {
        if (typeof val === 'string' && val.trim() !== "" && !val.includes("[object Object]") && val !== "{}") {
            if (val.includes("structure of query does not match")) return "REGISTRY MISMATCH: The institutional data schema has evolved. Refresh required.";
            if (val.includes("permission denied")) return "AUTHORIZATION FAILURE: Your security token does not have access to this node.";
            return val;
        }
        if (typeof val === 'object' && val !== null && val.message && typeof val.message === 'string') {
            return val.message;
        }
    }

    try {
        const json = JSON.stringify(err);
        if (json && json !== '{}' && !json.includes("[object Object]")) {
            return json.length > 200 ? json.substring(0, 197) + "..." : json;
        }
    } catch { }

    const raw = String(err);
    return raw.includes("[object Object]") ? "An unparsable institutional node exception occurred." : raw;
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

            if (appsRes.error) throw appsRes.error;
            if (codesRes.error) throw codesRes.error;
            
            const applications = (appsRes.data || []) as AdmissionApplication[];
            setMyApplications(applications);
            setCodes((codesRes.data || []) as ShareCode[]);
            
            if (!selectedAdmissionId && applications.length > 0) {
                setSelectedAdmissionId(applications[0].id.toString());
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
                p_purpose: memo,
                p_code_type: permitType,
            });

            if (rpcError) throw rpcError;

            if (data?.success) {
                setMemo('');
                await fetchData(true);
                if (data.id) setFocusedPermitId(data.id);
            } else {
                setError(data?.error || "Permit provision protocol rejected by authority.");
            }
        } catch (err: any) {
            setError(resolveSystemError(err));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevoke = async (id: number) => {
        if (!confirm("TERMINATION PROTOCOL: Decommissioning this permit will immediately revoke institutional access. Proceed?")) return;
        
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

    const focusedPermit = useMemo(() => (codes || []).find(c => c.id === focusedPermitId), [codes, focusedPermitId]);

    if (loading && codes.length === 0 && !error) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Spinner size="lg" className="text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Syncing Neural Registry</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-1000 pb-40 px-4">
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-inner border border-primary/20">
                            <ShieldCheckIcon className="w-6 h-6"/>
                        </div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.5em]">Authorization Terminal</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tighter leading-none mb-6">Digital <span className="text-white/30">Permits.</span></h2>
                    <p className="text-white/40 text-xl font-medium leading-relaxed font-serif italic border-l-2 border-white/10 pl-8 ml-2">
                        Issue unique cryptographic access keys to institutional administrators to authorize the review of student records and verification vaults.
                    </p>
                </div>
                <button 
                    onClick={() => fetchData()} 
                    className="p-4 rounded-[1.5rem] bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 shadow-xl group"
                >
                    <RefreshIcon className={`w-6 h-6 ${actionLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-[2.5rem] flex items-start gap-5 animate-in shake duration-500 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                    <AlertTriangleIcon className="w-6 h-6 shrink-0 mt-0.5" />
                    <div className="flex-grow">
                        <p className="text-sm font-black uppercase tracking-widest mb-1">Handshake Restriction</p>
                        <p className="text-sm font-medium leading-relaxed text-red-200/70 whitespace-pre-wrap">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-500">
                        <XCircleIcon className="w-5 h-5"/>
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                <div className="xl:col-span-4 bg-[#0d0f14] border border-white/5 p-8 md:p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden ring-1 ring-white/5">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none transform rotate-12"><KeyIcon className="w-64 h-64 text-white" /></div>
                    
                    <form onSubmit={handleGenerate} className="space-y-10 relative z-10">
                        <div className="space-y-6">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] block ml-1">Identity Selection</label>
                            {myApplications.length === 0 ? (
                                <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] group hover:border-primary/20 transition-all cursor-pointer" onClick={() => fetchData()}>
                                    <UsersIcon className="w-10 h-10 mx-auto mb-4 text-white/10 group-hover:text-primary transition-colors" />
                                    <p className="text-xs font-bold text-white/20 italic">No registered identities found.</p>
                                    <p className="text-[9px] font-black uppercase text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Retry Handshake</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myApplications.map(app => (
                                        <button
                                            key={app.id}
                                            type="button"
                                            onClick={() => setSelectedAdmissionId(app.id.toString())}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                                                selectedAdmissionId === app.id.toString() 
                                                ? 'bg-primary/10 border-primary shadow-2xl scale-[1.02] ring-1 ring-primary/20' 
                                                : 'bg-white/5 border-transparent hover:bg-white/[0.08]'
                                            }`}
                                        >
                                            <PremiumAvatar src={app.profile_photo_url} name={app.applicant_name} size="sm" />
                                            <div className="text-left min-w-0 flex-grow">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-black text-[11px] uppercase tracking-widest truncate ${selectedAdmissionId === app.id.toString() ? 'text-primary' : 'text-white/80'}`}>{app.applicant_name}</p>
                                                    <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-1.5 rounded border border-emerald-500/10">Hub Synced</span>
                                                </div>
                                                <p className="text-[9px] text-white/20 font-bold uppercase mt-0.5 tracking-wider">Grade {app.grade} Block</p>
                                            </div>
                                            {selectedAdmissionId === app.id.toString() && <CheckCircleIcon className="w-5 h-5 text-primary animate-in zoom-in" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] block ml-1">Handshake Scope</label>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'Enquiry', label: 'Discovery Mode', desc: 'Minimal metadata for initial campus visits.', icon: <MailIcon className="w-5 h-5"/> },
                                    { id: 'Admission', label: 'Full Integrity', desc: 'Complete verified record & document access.', icon: <DocumentTextIcon className="w-5 h-5"/> }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setPermitType(type.id as ShareCodeType)}
                                        className={`relative p-6 rounded-[2rem] border-2 text-left transition-all duration-500 group overflow-hidden ${
                                            permitType === type.id 
                                            ? 'bg-primary/5 border-primary shadow-2xl ring-4 ring-primary/5' 
                                            : 'bg-white/5 border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className={`p-2.5 rounded-xl transition-colors duration-500 ${permitType === type.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/30'}`}>
                                                {type.icon}
                                            </div>
                                            <h4 className={`text-sm font-black uppercase tracking-widest ${permitType === type.id ? 'text-primary' : 'text-white/60'}`}>{type.label}</h4>
                                        </div>
                                        <p className="text-[11px] text-white/30 leading-relaxed font-medium pl-12">{type.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-1 block">Context Label</label>
                            <input 
                                type="text"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                placeholder="e.g. Registrar Sync Session"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white font-medium focus:border-primary focus:bg-white/[0.08] outline-none transition-all shadow-inner placeholder:text-white/5"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={!selectedAdmissionId || actionLoading}
                            className={`w-full py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] transition-all duration-700 transform flex items-center justify-center gap-4 ${
                                !selectedAdmissionId || actionLoading
                                ? 'bg-white/5 text-white/10 border border-white/5 cursor-not-allowed shadow-none'
                                : 'bg-primary text-white shadow-2xl shadow-primary/40 hover:-translate-y-1 active:scale-95'
                            }`}
                        >
                            {actionLoading ? <Spinner size="sm" className="text-white" /> : 'Provision Digital Key'}
                        </button>
                    </form>
                </div>

                <div className="xl:col-span-8 flex flex-col lg:flex-row gap-8 min-h-[600px]">
                    <div className="lg:w-1/2 flex flex-col space-y-5">
                        <div className="flex justify-between items-center px-4">
                             <h3 className="text-xl font-serif font-black text-white tracking-tight uppercase">Permit <span className="text-white/30">Registry.</span></h3>
                             <span className="text-[10px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{codes.length} Active Records</span>
                        </div>

                        <div className="space-y-3 overflow-y-auto max-h-[620px] custom-scrollbar pr-3">
                            {codes.length === 0 ? (
                                <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3.5rem] bg-white/[0.01] opacity-40">
                                    <KeyIcon className="w-16 h-16 mx-auto mb-6 text-white/20" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 leading-relaxed px-12 text-center">Neural Registry Standby. No permits issued.</p>
                                </div>
                            ) : (
                                codes.map(code => (
                                    <button 
                                        key={code.id}
                                        onClick={() => setFocusedPermitId(code.id)}
                                        className={`w-full text-left p-6 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden active:scale-[0.98] ${
                                            focusedPermitId === code.id 
                                            ? 'bg-[#1a1d24] border-primary/40 shadow-2xl ring-2 ring-primary/10 z-10' 
                                            : 'bg-[#0d0f14] border-white/5 hover:border-white/10'
                                        } ${code.status !== 'Active' ? 'opacity-40 grayscale blur-[0.5px]' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <PremiumAvatar src={code.profile_photo_url} name={code.applicant_name} size="sm" className="border border-white/10"/>
                                                <h4 className={`font-serif font-bold text-lg text-white transition-colors ${focusedPermitId === code.id ? 'text-primary' : 'group-hover:text-primary'}`}>{code.applicant_name}</h4>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${code.status === 'Active' ? 'text-emerald-400' : 'text-white/20'}`}>{code.status}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                code.code_type === 'Admission' 
                                                ? 'bg-purple-50/10 text-purple-400 border-purple-500/20' 
                                                : 'bg-blue-50/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                {code.code_type} Scope
                                            </span>
                                            <span className="text-[9px] font-mono font-bold text-white/20 uppercase truncate max-w-[150px]">{code.purpose || 'Institutional Handshake'}</span>
                                        </div>
                                        {focusedPermitId === code.id && (
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 animate-in slide-in-from-right-4 duration-300">
                                                <ChevronRightIcon className="w-7 h-7 text-primary" />
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="lg:w-1/2 bg-[#0d0f14] border border-white/5 rounded-[3.5rem] p-10 flex flex-col shadow-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-600 to-primary opacity-40"></div>
                        
                        {focusedPermit ? (
                            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="flex-grow space-y-10">
                                    <div className="flex items-center gap-6">
                                        <PremiumAvatar src={focusedPermit.profile_photo_url} name={focusedPermit.applicant_name} size="md" />
                                        <div>
                                            <h3 className="text-3xl font-serif font-black text-white tracking-tighter leading-none uppercase">{focusedPermit.applicant_name}</h3>
                                            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-2">Neural Link: #{focusedPermit.id}</p>
                                        </div>
                                    </div>

                                    <div 
                                        className="bg-black/40 border border-white/10 rounded-[2.5rem] p-10 text-center shadow-inner group/code cursor-pointer active:scale-95 transition-all relative overflow-hidden" 
                                        onClick={() => handleCopy(focusedPermit.code)}
                                    >
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-5">Provisioned Secret</p>
                                        <span className="font-mono font-black text-4xl text-white tracking-[0.25em] drop-shadow-xl group-hover/code:text-primary transition-colors">
                                            {focusedPermit.code}
                                        </span>
                                        <p className={`text-[9px] font-black uppercase mt-6 transition-colors ${copyFeedback ? 'text-emerald-500' : 'text-white/20'}`}>
                                            {copyFeedback ? 'Sync Complete' : 'Click to Synchronize'}
                                        </p>
                                    </div>

                                    <div className="space-y-6 px-4">
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-white/5 rounded-2xl text-white/30 border border-white/5 shadow-sm transition-colors group-hover:text-primary"><InfoIcon className="w-5 h-5"/></div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Temporal Boundary</p>
                                                <p className="text-sm font-bold text-white/80">{new Date(focusedPermit.expires_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-white/5 rounded-2xl text-white/30 border border-white/5 shadow-sm transition-colors group-hover:text-primary"><ClockIcon className="w-5 h-5"/></div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active State</p>
                                                <p className={`text-sm font-black uppercase tracking-widest ${focusedPermit.status === 'Active' ? 'text-emerald-500' : 'text-white/20'}`}>{focusedPermit.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-10 border-t border-white/5">
                                    <div className="flex gap-4">
                                        {focusedPermit.status === 'Active' && (
                                            <button 
                                                onClick={() => handleRevoke(focusedPermit.id)}
                                                disabled={actionLoading}
                                                className="flex-1 py-5 rounded-2xl bg-red-500/10 hover:bg-red-50 text-red-500 hover:text-white font-black text-[11px] uppercase tracking-[0.25em] transition-all border border-red-500/20 shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {actionLoading ? <Spinner size="sm" className="text-current" /> : <><TrashIcon className="w-4 h-4"/> Decommission</>}
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleCopy(focusedPermit.code)}
                                            className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-[0.25em] transition-all border border-white/10 shadow-lg"
                                        >
                                            Secure Share
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center px-12 animate-in fade-in duration-1000">
                                <div className="w-24 h-24 bg-white/5 rounded-[3rem] flex items-center justify-center mb-8 border border-white/10 shadow-2xl relative group">
                                    <ShieldCheckIcon className="w-10 h-10 text-white/20 relative z-10 transition-all group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <h3 className="text-2xl font-serif font-black text-white mb-3 uppercase tracking-tight">Handshake Review</h3>
                                <p className="text-sm text-white/20 leading-relaxed font-medium max-w-xs">
                                    Select an entry from the registry to inspect its cryptographic metadata, temporal constraints, and sync scope.
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