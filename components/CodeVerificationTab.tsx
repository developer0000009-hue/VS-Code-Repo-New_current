
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { VerifiedShareCodeData } from '../types';
import Spinner from './common/Spinner';
import { KeyIcon } from './icons/KeyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface InfoRowProps {
    label: string;
    value: string | null | undefined;
    valueClassName?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, valueClassName = "text-foreground font-medium" }) => (
    <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 opacity-80">{label}</p>
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

    // Reset state when branch changes
    useEffect(() => {
        setVerifiedData(null);
        setImportSuccessMessage(null);
        setError(null);
    }, [branchId]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        
        setLoading(true);
        setError(null);
        setVerifiedData(null);
        setImportSuccessMessage(null);

        const { data, error: rpcError } = await supabase.rpc('admin_verify_share_code', { p_code: code.trim().toUpperCase() });

        if (rpcError) {
            setError(`Error: ${rpcError.message}`);
        } else if (data.error) {
            setError(data.error);
        } else {
            setVerifiedData(data);
        }
        setLoading(false);
    };
    
    const handleImport = async () => {
        if (!verifiedData) return;
        if (!branchId) {
            setError("No active branch selected. Please select a branch from the top menu first.");
            return;
        }

        setLoading(true);
        setError(null);
        
        const { error: rpcError } = await supabase.rpc('admin_import_record_from_share_code', { 
            p_admission_id: verifiedData.admission_id,
            p_code_type: verifiedData.code_type,
            p_branch_id: branchId
        });

        if (rpcError) {
             setError(`Import failed: ${rpcError.message}`);
        } else {
            const destinationTab = verifiedData.code_type === 'Enquiry' ? 'Enquiries' : 'Admissions';
            setImportSuccessMessage(
                <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600"><CheckCircleIcon className="w-6 h-6" /></div>
                    <div>
                        <p className="font-bold text-green-700 dark:text-green-400">Import Successful!</p>
                        <p className="text-sm text-green-600/80 dark:text-green-300/80">Record added to <strong>{destinationTab}</strong>. You can now process it.</p>
                    </div>
                </div>
            );
            setVerifiedData(null); 
            setCode('');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header Section */}
            <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-primary/5 rotate-3">
                    <KeyIcon className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl font-serif font-extrabold text-foreground tracking-tight">Parent Verification</h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                    Enter the secure <strong>Share Code</strong> provided by the parent to fetch and import their application data instantly.
                </p>
            </div>

            {/* Verification Input Section */}
            <div className="max-w-xl mx-auto relative">
                <form onSubmit={handleVerify} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                        <SearchIcon className="h-6 w-6" />
                    </div>
                    <input
                        type="text"
                        placeholder="Enter Code (e.g. ENQ-A1B2C3)"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full bg-card border-2 border-border/60 hover:border-primary/30 rounded-2xl pl-14 pr-32 py-5 text-xl font-mono font-bold tracking-wider focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-lg shadow-black/5 uppercase placeholder:text-muted-foreground/30 text-foreground"
                        autoFocus
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !code.trim()}
                        className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
                    >
                        {loading && !verifiedData ? <Spinner size="sm" className="text-current" /> : <>Verify <ArrowRightIcon className="w-4 h-4"/></>}
                    </button>
                </form>

                {/* Status Messages */}
                <div className="mt-6 space-y-4">
                    {!branchId && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-1 text-center">
                            <span className="text-xl">⚠️</span> Warning: No active branch selected. You cannot import records until a branch is chosen.
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-6 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-1 text-center shadow-sm">
                            <XIcon className="w-5 h-5" /> {error}
                        </div>
                    )}
                    
                    {importSuccessMessage && (
                        <div className="bg-green-500/10 border border-green-500/20 px-6 py-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1 flex justify-center">
                            {importSuccessMessage}
                        </div>
                    )}
                </div>
            </div>

            {/* Results Section */}
            {verifiedData && (
                <div className="animate-in slide-in-from-bottom-8 duration-500 fade-in">
                    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5 relative group">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                        
                        <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                            {/* Applicant Column */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-bold text-sm border-2 border-background shadow-sm">
                                        {(verifiedData.applicant_name || 'A').charAt(0)}
                                    </span>
                                    <h4 className="text-sm font-extrabold text-muted-foreground uppercase tracking-widest">Applicant Details</h4>
                                </div>
                                <div className="space-y-5 pl-3 border-l-2 border-border ml-5">
                                    <InfoRow label="Full Name" value={verifiedData.applicant_name} valueClassName="text-2xl font-black text-foreground tracking-tight" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow label="Target Grade" value={verifiedData.grade} valueClassName="text-base font-bold bg-muted px-2 py-0.5 rounded w-fit"/>
                                        <InfoRow label="Gender" value={verifiedData.gender} />
                                    </div>
                                    <InfoRow label="Date of Birth" value={new Date(verifiedData.date_of_birth).toLocaleDateString(undefined, {dateStyle: 'long'})} />
                                </div>
                            </div>

                            {/* Parent Column */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                     <span className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center font-bold text-sm border-2 border-background shadow-sm">
                                        {(verifiedData.parent_name || 'P').charAt(0)}
                                    </span>
                                    <h4 className="text-sm font-extrabold text-muted-foreground uppercase tracking-widest">Guardian Info</h4>
                                </div>
                                <div className="space-y-5 pl-3 border-l-2 border-border ml-5">
                                    <InfoRow label="Guardian Name" value={verifiedData.parent_name} valueClassName="text-xl font-bold text-foreground" />
                                    <InfoRow label="Email Address" value={verifiedData.parent_email} />
                                    <InfoRow label="Phone Number" value={verifiedData.parent_phone} />
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="bg-muted/30 px-8 py-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background border border-border rounded-lg text-xs font-mono font-bold text-muted-foreground">
                                    {verifiedData.code_type.toUpperCase()} RECORD
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">Ready for import to {verifiedData.code_type === 'Enquiry' ? 'Enquiries' : 'Admissions'}</span>
                            </div>

                            {verifiedData.already_imported ? (
                                <div className="px-5 py-2.5 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
                                    <CheckCircleIcon className="w-5 h-5" /> Already Imported
                                </div>
                            ) : (
                                <button
                                    onClick={handleImport}
                                    disabled={!branchId || loading}
                                    className={`
                                        px-8 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95
                                        ${!branchId 
                                            ? 'bg-muted-foreground/30 cursor-not-allowed shadow-none' 
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                                        }
                                    `}
                                >
                                    {loading ? <Spinner size="sm" className="text-white"/> : <><CheckCircleIcon className="w-5 h-5"/> Confirm Import</>}
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
