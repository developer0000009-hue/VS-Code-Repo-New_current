import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { VerifiedShareCodeData } from '../types';
import Spinner from './common/Spinner';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
// Fix: Import missing AlertTriangleIcon
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

interface InfoRowProps {
    label: string;
    value: string | null | undefined;
    valueClassName?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, valueClassName = "text-foreground font-medium" }) => (
    <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5 opacity-60">{label}</p>
        <p className={`text-sm ${valueClassName}`}>{value || '—'}</p>
    </div>
);

interface CodeVerificationTabProps {
    branchId?: number | null;
}

const CodeVerificationTab: React.FC<CodeVerificationTabProps> = ({ branchId }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifiedData, setVerifiedData] = useState<VerifiedShareCodeData | null>(null);
    const [importSuccessMessage, setImportSuccessMessage] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        setVerifiedData(null);
        setImportSuccessMessage(null);
        setError(null);
    }, [branchId]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) return;
        
        setLoading(true);
        setError(null);
        setVerifiedData(null);
        setImportSuccessMessage(null);

        try {
            // Verification Protocol: Checks validity, ownership, and scope
            const { data, error: rpcError } = await supabase.rpc('admin_verify_share_code', { 
                p_code: cleanCode 
            });

            if (rpcError) throw rpcError;
            
            if (data.error) {
                setError(data.error);
            } else if (!data.found) {
                setError("Cryptographic token not found or has been decommissioned.");
            } else {
                setVerifiedData(data);
            }
        } catch (err: any) {
            setError(`Handshake Failed: ${err.message || "Institutional server timed out."}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleImport = async () => {
        if (!verifiedData) return;
        if (!branchId) {
            setError("BRANCH CONTEXT MISSING: Select an active campus node before initiating record import.");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const { error: rpcError } = await supabase.rpc('admin_import_record_from_share_code', { 
                p_admission_id: verifiedData.admission_id,
                p_code_type: verifiedData.code_type,
                p_branch_id: branchId
            });

            if (rpcError) throw rpcError;

            const destinationTab = verifiedData.code_type === 'Enquiry' ? 'Enquiry Logs' : 'Admission Vault';
            setImportSuccessMessage(
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/20 shadow-xl animate-in zoom-in-95">
                    <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/30">
                        <CheckCircleIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="font-black text-emerald-600 uppercase tracking-widest text-xs">Identity Synchronized</p>
                        <p className="text-sm text-muted-foreground mt-1 font-medium leading-relaxed">
                            Encrypted payload for <strong>{verifiedData.applicant_name}</strong> successfully integrated into the <strong>{destinationTab}</strong>.
                        </p>
                    </div>
                </div>
            );
            setVerifiedData(null); 
            setCode('');
        } catch (err: any) {
            setError(`Import Protocol Failure: ${err.message || "Database synchronization failed."}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-40">
            
            {/* Header: Operational Intent */}
            <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-primary/5 transform rotate-3 hover:rotate-0 transition-transform duration-700 group">
                    <ShieldCheckIcon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <h2 className="text-5xl font-serif font-black text-foreground tracking-tighter uppercase">Identity Handshake</h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed font-medium">
                    Initialize a secure record import by entering the parent-provisioned <strong>Digital Permit Key</strong>.
                </p>
            </div>

            {/* Verification Console */}
            <div className="max-w-xl mx-auto relative">
                <form onSubmit={handleVerify} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                        <KeyIcon className="h-6 w-6" />
                    </div>
                    <input
                        type="text"
                        placeholder="ENTER PERMIT KEY (E.G. ADM-1A2B3C)"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full bg-card border-2 border-border/60 hover:border-primary/40 rounded-[2rem] pl-16 pr-36 py-6 text-2xl font-mono font-black tracking-[0.2em] focus:ring-8 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-2xl shadow-black/5 uppercase placeholder:text-muted-foreground/20 text-foreground"
                        autoFocus
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !code.trim()}
                        className="absolute right-3 top-3 bottom-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
                    >
                        {loading && !verifiedData ? <Spinner size="sm" className="text-current" /> : <>Verify <ArrowRightIcon className="w-4 h-4"/></>}
                    </button>
                </form>

                {/* Status Interface */}
                <div className="mt-8 space-y-4">
                    {!branchId && (
                        <div className="bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-8 py-5 rounded-3xl text-sm font-bold flex items-center justify-center gap-4 animate-in slide-in-from-top-2 text-center shadow-xl">
                            {/* Fix: use AlertTriangleIcon correctly */}
                            <AlertTriangleIcon className="w-6 h-6 flex-shrink-0 animate-pulse" />
                            <span className="leading-relaxed uppercase tracking-wide">Workstation Context Required: Node selection mandatory before permit resolution.</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-8 py-5 rounded-3xl text-sm font-bold flex items-center justify-center gap-4 animate-in shake duration-500 text-center shadow-xl">
                            <XIcon className="w-6 h-6 flex-shrink-0" /> <span className="uppercase tracking-wide">{error}</span>
                        </div>
                    )}
                    
                    {importSuccessMessage && (
                        <div className="animate-in fade-in slide-in-from-top-4 flex justify-center">
                            {importSuccessMessage}
                        </div>
                    )}
                </div>
            </div>

            {/* Results Deck */}
            {verifiedData && (
                <div className="animate-in slide-in-from-bottom-12 duration-700 fade-in">
                    <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-3xl ring-1 ring-black/10 relative group">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600"></div>
                        
                        <div className="p-10 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-16 relative">
                            {/* Applicant Data Segment */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-sm border border-blue-500/20 shadow-inner">
                                        {(verifiedData.applicant_name || 'A').charAt(0)}
                                    </div>
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Target Identity</h4>
                                </div>
                                <div className="space-y-6 pl-4 border-l-2 border-white/5 ml-6">
                                    <InfoRow label="Legal Name" value={verifiedData.applicant_name} valueClassName="text-3xl font-serif font-black text-foreground tracking-tighter uppercase" />
                                    <div className="grid grid-cols-2 gap-8">
                                        <InfoRow label="Academic Grade" value={verifiedData.grade} valueClassName="text-lg font-black bg-indigo-500/10 px-3 py-1 rounded-lg w-fit text-indigo-400 border border-indigo-500/20"/>
                                        <InfoRow label="Identity Gender" value={verifiedData.gender} />
                                    </div>
                                    <InfoRow label="Temporal Birth Record" value={new Date(verifiedData.date_of_birth).toLocaleDateString(undefined, {dateStyle: 'long'})} />
                                </div>
                            </div>

                            {/* Guardian Data Segment */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                     <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black text-sm border border-purple-500/20 shadow-inner">
                                        {(verifiedData.parent_name || 'P').charAt(0)}
                                    </div>
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Handshake Arbiter</h4>
                                </div>
                                <div className="space-y-6 pl-4 border-l-2 border-white/5 ml-6">
                                    <InfoRow label="Guardian Name" value={verifiedData.parent_name} valueClassName="text-2xl font-bold text-foreground tracking-tight" />
                                    <InfoRow label="Institutional Contact" value={verifiedData.parent_email} />
                                    <InfoRow label="Mobile Telemetry" value={verifiedData.parent_phone} />
                                </div>
                            </div>
                        </div>

                        {/* Control Dock */}
                        <div className="bg-muted/30 px-10 py-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-8 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-background border border-border rounded-2xl text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em] shadow-inner">
                                    {verifiedData.code_type} DATA_BLOCK
                                </div>
                                <div className="h-6 w-px bg-border hidden sm:block"></div>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest animate-pulse">Ready for system synchronization</span>
                            </div>

                            {verifiedData.already_imported ? (
                                <div className="px-8 py-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-3 shadow-inner">
                                    <CheckCircleIcon className="w-5 h-5 opacity-60" /> Redundant Synchronization Detected
                                </div>
                            ) : (
                                <button
                                    onClick={handleImport}
                                    disabled={!branchId || loading}
                                    className={`
                                        px-14 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] text-white shadow-2xl transition-all flex items-center gap-4 transform active:scale-95
                                        ${!branchId 
                                            ? 'bg-muted-foreground/20 cursor-not-allowed shadow-none grayscale opacity-30' 
                                            : 'bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-500/30 hover:-translate-y-1'
                                        }
                                    `}
                                >
                                    {loading ? <Spinner size="sm" className="text-white"/> : <><ShieldCheckIcon className="w-6 h-6"/> Seal & Integrate</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeVerificationTab;