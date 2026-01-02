import React, { useState, useEffect, useRef } from 'react';
import { supabase, formatError } from '../services/supabase';
import { VerifiedShareCodeData } from '../types';
import Spinner from './common/Spinner';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { LockIcon } from './icons/LockIcon';
import { UsersIcon } from './icons/UsersIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ActivityIcon } from './icons/ActivityIcon';
import { MailIcon } from './icons/MailIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { SchoolIcon } from './icons/SchoolIcon';

interface InfoRowProps {
    label: string;
    value: string | null | undefined;
    valueClassName?: string;
    subLabel?: string;
}

const TechnicalInfoRow: React.FC<InfoRowProps> = ({ label, value, valueClassName = "text-white font-bold", subLabel }) => (
    <div className="space-y-1.5 group/row">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em] group-hover/row:text-primary/60 transition-colors">{label}</p>
        <div className="flex flex-col">
            <p className={`text-base md:text-lg leading-tight truncate ${valueClassName}`}>{value || '—'}</p>
            {subLabel && <p className="text-[9px] text-white/20 uppercase font-bold mt-1 tracking-widest">{subLabel}</p>}
        </div>
    </div>
);

const SecurityScanner = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-40 animate-scanner-move shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.03)_0%,transparent_70%)] animate-pulse"></div>
    </div>
);

interface CodeVerificationTabProps {
    branchId?: number | null;
    onNavigate?: (component: string) => void;
}

const CodeVerificationTab: React.FC<CodeVerificationTabProps> = ({ branchId, onNavigate }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifiedData, setVerifiedData] = useState<VerifiedShareCodeData & { vault_access?: boolean } | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setVerifiedData(null);
        setImportSuccess(false);
        setError(null);
    }, [branchId]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) return;
        
        setVerifying(true);
        setError(null);
        setVerifiedData(null);
        setImportSuccess(false);

        // Simulation delay for the scanner animation to feel "high-fidelity"
        await new Promise(r => setTimeout(r, 1200));

        try {
            const { data, error: rpcError } = await supabase.rpc('admin_verify_share_code', { 
                p_code: cleanCode 
            });

            if (rpcError) throw rpcError;
            
            if (!data || !data.found) {
                setError("Security handshake failed: Protocol token is unrecognized or has expired.");
            } else {
                setVerifiedData({
                    ...data,
                    vault_access: data.code_type === 'Admission'
                });
            }
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setVerifying(false);
        }
    };
    
    const handleImport = async () => {
        if (!verifiedData || !branchId || error) return;

        setLoading(true);
        setError(null);
        
        try {
            const admissionId = String(verifiedData.admission_id);
            const { data, error: rpcError } = await supabase.rpc('admin_import_record_from_share_code', { 
                p_admission_id: admissionId,
                p_code_type: verifiedData.code_type,
                p_branch_id: Number(branchId)
            });

            if (rpcError) throw rpcError;

            if (data?.success) {
                setImportSuccess(true);
                if (onNavigate) {
                    const target = verifiedData.code_type === 'Admission' ? 'Admissions' : 'Enquiries';
                    setTimeout(() => onNavigate(target), 2000);
                }
            } else {
                setError(data?.message || "Import protocol rejected by the institutional node.");
            }

        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-16 py-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            
            {/* --- Hero Section --- */}
            <div className="text-center relative">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-[#101218] rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl ring-1 ring-white/5 transform rotate-6 hover:rotate-0 transition-transform duration-700">
                        <ShieldCheckIcon className="w-12 h-12 text-primary" />
                    </div>
                </div>
                <h2 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tighter uppercase mb-4 drop-shadow-2xl">
                    Quick <span className="text-white/20 italic">Verification.</span>
                </h2>
                <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium italic border-l-2 border-primary/20 pl-8 ml-auto mr-auto w-fit">
                    Resolve high-fidelity identity handshakes using secure, single-use cryptographic tokens.
                </p>
            </div>

            {/* --- Input Terminal --- */}
            <div className="max-w-2xl mx-auto relative px-4">
                <form onSubmit={handleVerify} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors duration-500">
                        <KeyIcon className="h-8 w-8" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="ENTER PROTOCOL KEY"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        disabled={verifying || importSuccess}
                        className="w-full bg-[#0d0f14]/80 backdrop-blur-3xl border-2 border-white/5 hover:border-white/10 rounded-[3rem] pl-20 pr-44 py-8 text-3xl font-mono font-black tracking-[0.4em] focus:ring-[15px] focus:ring-primary/5 focus:border-primary/50 outline-none transition-all shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] uppercase placeholder:text-white/5 text-white selection:bg-primary/30"
                    />
                    <button 
                        type="submit" 
                        disabled={verifying || !code.trim() || importSuccess}
                        className="absolute right-4 top-4 bottom-4 bg-primary text-primary-foreground font-black px-10 rounded-[2.2rem] shadow-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center min-w-[160px] uppercase tracking-[0.2em] text-xs ring-4 ring-primary/10"
                    >
                        {verifying ? (
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                                <span>Scanning</span>
                            </div>
                        ) : 'Initialize'}
                    </button>
                </form>

                {/* --- System Messages --- */}
                <div className="mt-10 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-8 py-6 rounded-[2rem] text-sm font-bold flex items-start gap-5 animate-in shake duration-500 shadow-2xl">
                            <AlertTriangleIcon className="w-8 h-8 shrink-0 mt-0.5" /> 
                            <div className="flex-grow">
                                <p className="uppercase tracking-widest leading-relaxed">Security Protocol Exception</p>
                                <p className="text-xs mt-2 opacity-60 italic font-medium">{error}</p>
                            </div>
                        </div>
                    )}
                    
                    {importSuccess && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-8 py-6 rounded-[2rem] text-sm font-bold flex items-center justify-between animate-in zoom-in-95 shadow-2xl ring-1 ring-emerald-500/30">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-emerald-500 rounded-full shadow-lg"><CheckCircleIcon className="w-6 h-6 text-white" /></div>
                                <span className="uppercase tracking-[0.2em]">Node Identity Integrated. Redirecting...</span>
                            </div>
                            <div className="h-6 w-6 border-3 border-emerald-500 border-t-transparent animate-spin rounded-full"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Decrypted Payload Display --- */}
            {verifiedData && !error && (
                <div className="animate-in slide-in-from-bottom-12 duration-1000 fade-in">
                    <div className="bg-[#0c0e14]/90 backdrop-blur-3xl border border-white/5 rounded-[4rem] overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,1)] ring-1 ring-white/10 relative group">
                        
                        <SecurityScanner />
                        
                        {/* Decorative HUD Elements */}
                        <div className="absolute top-10 left-10 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-1000">
                             <div className="flex gap-1.5 mb-2">{[...Array(3)].map((_,i) => <div key={i} className="w-1.5 h-1.5 bg-primary rounded-sm"></div>)}</div>
                             <div className="text-[8px] font-mono text-white/50">TRACE_ACTIVE: {Math.random().toString(16).slice(2, 10).toUpperCase()}</div>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
                            
                            {/* Panel A: Subject Identity */}
                            <div className="p-12 md:p-16 bg-[#0c0e14] flex flex-col justify-between group/panel">
                                <div className="space-y-12">
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-xl border border-indigo-500/20 shadow-inner group-hover/panel:scale-110 transition-transform duration-700">
                                            {(verifiedData.applicant_name || 'A').charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-1">Payload: A</h4>
                                            <p className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">SUB_CORE_IDENT_01</p>
                                        </div>
                                    </div>
                                    <div className="space-y-10 pl-6 border-l-2 border-white/5 ml-8">
                                        <TechnicalInfoRow label="Subject Identity" value={verifiedData.applicant_name} valueClassName="text-4xl font-serif font-black text-white tracking-tighter uppercase drop-shadow-lg" subLabel="Full Legal Nominal" />
                                        <div className="grid grid-cols-2 gap-12">
                                            <TechnicalInfoRow label="Grade Placement" value={`Grade ${verifiedData.grade}`} valueClassName="text-2xl font-black text-indigo-400" subLabel="Academic Cluster" />
                                            <TechnicalInfoRow label="Permit Scope" value={verifiedData.code_type} valueClassName={`text-base font-black uppercase ${verifiedData.code_access ? 'text-purple-400' : 'text-blue-400'}`} subLabel="Verification Level" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Panel B: Arbiter Control */}
                            <div className="p-12 md:p-16 bg-[#0a0c12] flex flex-col justify-between group/panel-b">
                                <div className="space-y-12">
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="w-16 h-16 rounded-[1.8rem] bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-inner group-hover/panel-b:scale-110 transition-transform duration-700">
                                            <UsersIcon className="w-8 h-8"/>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-1">Payload: B</h4>
                                            <p className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">ARB_CONTROL_NODE_02</p>
                                        </div>
                                    </div>
                                    <div className="space-y-10 pl-6 border-l-2 border-white/5 ml-8">
                                        <TechnicalInfoRow label="Primary Arbiter" value={verifiedData.parent_name} valueClassName="text-3xl font-bold text-white tracking-tight" subLabel="Guardian Delegate" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                                            <TechnicalInfoRow label="Secure Contact" value={verifiedData.parent_phone} valueClassName="text-lg font-mono text-white/80" subLabel="Encrypted Comms Line" />
                                            <TechnicalInfoRow label="Network Node" value="Integrated" valueClassName="text-lg font-black text-emerald-400" subLabel="Uplink Status" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- Vault Restriction Warning --- */}
                        {!verifiedData.vault_access && (
                            <div className="mx-12 mb-12 p-10 rounded-[3rem] bg-black/40 border border-white/5 flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-8 group/restrict shadow-inner">
                                <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-2xl group-hover/restrict:bg-primary/10 transition-all duration-500 group-hover/restrict:rotate-6">
                                    <LockIcon className="w-8 h-8 text-white/20 group-hover/restrict:text-primary transition-colors" />
                                </div>
                                <div className="max-w-lg">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Vault Access Protocol: Restricted</p>
                                    <p className="text-sm text-white/40 italic leading-relaxed">
                                        Enquiry-scoped permit confirmed. High-level document synchronization and final ledger verification require an <strong className="text-white/60">Admission-level</strong> cryptographic token.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* --- Footer Interaction Dock --- */}
                        <div className="bg-black/60 px-12 py-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                             <div className="flex items-center gap-6">
                                <div className={`px-6 py-3 rounded-2xl text-[11px] font-mono font-black uppercase tracking-[0.3em] shadow-2xl border border-white/10 ${verifiedData.vault_access ? 'text-purple-400 bg-purple-500/10' : 'text-blue-400 bg-blue-500/10'}`}>
                                    {verifiedData.code_type}_PROTOCOL_V.16
                                </div>
                                <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                                <div className="flex items-center gap-3 text-[10px] text-white/30 font-black uppercase tracking-[0.2em] animate-pulse">
                                    <ActivityIcon className="w-5 h-5 text-emerald-500" /> Integrity Sync Confirmed
                                </div>
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={!branchId || loading || !!error || importSuccess}
                                className={`
                                    relative overflow-hidden px-16 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] text-white shadow-[0_32px_64px_-16px_rgba(var(--primary),0.3)] transition-all duration-500 flex items-center gap-4 transform active:scale-95 group/import
                                    ${(!branchId || !!error) ? 'bg-white/5 text-white/10 cursor-not-allowed opacity-50 grayscale' : 'bg-primary hover:bg-primary/90 hover:shadow-primary/50 hover:-translate-y-1.5'}
                                `}
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/import:opacity-100 transition-opacity"></div>
                                {loading ? <Spinner size="sm" className="text-white"/> : <><ShieldCheckIcon className="w-6 h-6 group-hover/import:rotate-12 transition-transform duration-500"/> Integrate Identity</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes scanner-move {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scanner-move {
                    animation: scanner-move 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    );
};

export default CodeVerificationTab;
