
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { ShareCode, ShareCodeStatus, AdmissionApplication, ShareCodeType } from '../../types';
import Spinner from '../common/Spinner';
import { MailIcon } from '../icons/MailIcon';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';

// --- Local Icons ---
const CopyIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1-2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
    </svg>
);
const CheckIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const ShareIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);
const RefreshIcon: React.FC<{ className?: string }> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.185m-3.181 9.348a8.25 8.25 0 00-11.664 0l-3.18 3.185m3.181-9.348l-3.18-3.183a8.25 8.25 0 00-11.664 0l-3.18 3.185" />
    </svg>
);
const SortIcon: React.FC<{ className?: string }> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
);

const ClockIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
);

const statusConfig: { [key in ShareCodeStatus]: { text: string; bg: string; border: string; icon: React.ReactNode } } = {
  'Active': { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', icon: <CheckCircleIcon className="w-3 h-3"/> },
  'Expired': { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', icon: <ClockIcon className="w-3 h-3"/> },
  'Revoked': { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-900', icon: <XCircleIcon className="w-3 h-3"/> },
  'Redeemed': { text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-900', icon: <CheckCircleIcon className="w-3 h-3"/> },
};

const ShareCodesTab: React.FC = () => {
  const [codes, setCodes] = useState<ShareCode[]>([]);
  const [myApplications, setMyApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedAdmission, setSelectedAdmission] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [codeType, setCodeType] = useState<ShareCodeType>('Enquiry');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  
  // UX State
  const [isCopied, setIsCopied] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const [appsRes, codesRes] = await Promise.all([
        supabase.rpc('get_my_children_profiles'),
        supabase.rpc('get_my_share_codes')
    ]);

    if (appsRes.error) {
      setError(`Failed to fetch profiles: ${appsRes.error.message}`);
    } else {
      setMyApplications(appsRes.data || []);
      if (appsRes.data && appsRes.data.length > 0 && !selectedAdmission) {
        setSelectedAdmission(String(appsRes.data[0].id));
      }
    }

    if (codesRes.error) {
      setError(`Failed to fetch codes: ${codesRes.error.message}`);
    } else {
      setCodes(codesRes.data || []);
    }

    setLoading(false);
  }, [selectedAdmission]);

  useEffect(() => {
    fetchData();
  }, []);

  const sortedCodes = useMemo(() => {
      return [...codes].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [codes, sortOrder]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
      setFeedback({ type, message });
      setTimeout(() => setFeedback(null), 4000);
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) {
      showFeedback('error', 'Please select a child profile first.');
      return;
    }
    
    setGenerating(true);
    setGeneratedCode(null);
    setFeedback(null);

    try {
      const { data, error } = await supabase.rpc('generate_admission_share_code', {
        p_admission_id: Number(selectedAdmission),
        p_purpose: purpose,
        p_code_type: codeType,
      });

      if (error) throw error;

      setGeneratedCode(data);
      
      // Auto-copy
      if (data) {
          navigator.clipboard.writeText(data).then(() => {
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
              showFeedback('success', 'Code generated and copied to clipboard!');
          });
      }
      
      setPurpose('');
      await fetchData(); // Refresh history immediately

    } catch (err: any) {
      showFeedback('error', `Failed to generate code: ${err.message}`);
    } finally {
        setGenerating(false);
    }
  };
  
  const handleRevokeCode = async (id: number) => {
    if (!window.confirm('Are you sure you want to revoke this access code? It will no longer be usable.')) {
        return;
    }

    setRevokingId(id);
    try {
        const { error } = await supabase.rpc('revoke_my_share_code', { p_code_id: id });
        if (error) throw error;
        
        showFeedback('success', 'Access code revoked successfully.');
        await fetchData();
    } catch (err: any) {
        showFeedback('error', `Unable to revoke code: ${err.message}`);
    } finally {
        setRevokingId(null);
    }
  };
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
        setIsCopied(true);
        showFeedback('success', 'Access code copied to clipboard!');
        setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const handleShareCode = (code: string) => {
      if (navigator.share) {
          navigator.share({ 
              title: 'School Access Code', 
              text: `Here is my secure access code for school verification: ${code}` 
          }).catch(console.error);
      } else {
          handleCopyCode(code);
      }
  };

  const renderHistory = () => {
    if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
    
    if (codes.length === 0) return (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">No Access Codes</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">Generate a secure code to share your child's profile with the school administration.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {sortedCodes.map(code => (
                <div key={code.id} className="group bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${code.status === 'Active' ? 'bg-emerald-500' : 'bg-muted'}`}></div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pl-3">
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-mono font-bold text-lg text-primary tracking-wide">{code.code}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusConfig[code.status].bg} ${statusConfig[code.status].text} ${statusConfig[code.status].border}`}>
                                    {statusConfig[code.status].icon} {code.status}
                                </span>
                            </div>
                            <p className="font-semibold text-foreground text-sm">{code.applicant_name}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    {code.code_type === 'Enquiry' ? <MailIcon className="w-3 h-3"/> : <DocumentTextIcon className="w-3 h-3"/>}
                                    {code.code_type}
                                </span>
                                <span>•</span>
                                <span>Expires: {new Date(code.expires_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                            <button 
                                onClick={() => handleCopyCode(code.code)}
                                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy Code"
                            >
                                <CopyIcon className="w-4 h-4" />
                            </button>
                            {code.status === 'Active' && (
                                <button 
                                    onClick={() => handleRevokeCode(code.id)} 
                                    disabled={revokingId === code.id}
                                    className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg transition-colors"
                                    title="Revoke Access"
                                >
                                    {revokingId === code.id ? <Spinner size="sm" className="text-red-600"/> : <TrashIcon className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
            <div>
                <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground">Secure Access Codes</h2>
                <p className="text-muted-foreground mt-2 text-lg">Generate temporary keys to share your child's profile safely.</p>
            </div>
            <button 
                onClick={fetchData} 
                disabled={loading}
                className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-2 bg-background px-4 py-2 rounded-xl border border-border hover:bg-muted transition-all shadow-sm active:scale-95"
            >
                <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh History
            </button>
        </div>
        
        {/* Feedback Toast */}
        {feedback && (
            <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 border ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {feedback.type === 'success' ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
                <span className="font-bold text-sm">{feedback.message}</span>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* --- LEFT PANEL: CREATE --- */}
            <div className="lg:col-span-5 space-y-6">
                 <div className="bg-card p-6 rounded-2xl shadow-lg border border-border/60 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div className="mb-6 relative z-10">
                        <h3 className="font-bold text-xl text-foreground">Generate New Code</h3>
                        <p className="text-sm text-muted-foreground mt-1">Create a time-limited access key.</p>
                    </div>

                    <form onSubmit={handleGenerateCode} className="space-y-6 relative z-10">
                        {/* Profile Select */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase text-muted-foreground tracking-wider">Select Child Profile</label>
                            <div className="relative group">
                                <select 
                                    value={selectedAdmission} 
                                    onChange={(e) => setSelectedAdmission(e.target.value)} 
                                    required 
                                    className="w-full p-3.5 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none text-sm font-medium shadow-sm cursor-pointer hover:bg-muted/50" 
                                    disabled={myApplications.length === 0}
                                >
                                    {myApplications.length === 0 ? <option disabled>No profiles found</option> : <option value="" disabled>Select Child...</option>}
                                    {myApplications.map(app => <option key={app.id} value={app.id}>{app.applicant_name} (Grade {app.grade})</option>)}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            {myApplications.length === 0 && !loading && (
                                <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                                    <XCircleIcon className="w-3 h-3"/> Please add a child profile first.
                                </p>
                            )}
                        </div>

                        {/* Access Type Toggle */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Access Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setCodeType('Enquiry')} 
                                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 flex flex-col gap-2 ${codeType === 'Enquiry' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' : 'border-border bg-card hover:border-blue-200 hover:bg-muted/30'}`}
                                >
                                    <div className={`p-2 rounded-lg w-fit ${codeType === 'Enquiry' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        <MailIcon className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <span className={`block font-bold text-sm ${codeType === 'Enquiry' ? 'text-blue-700 dark:text-blue-400' : 'text-foreground'}`}>Enquiry</span>
                                        <span className="block text-[10px] text-muted-foreground mt-0.5 leading-tight">Limited profile access for initial visits.</span>
                                    </div>
                                </button>

                                <button 
                                    type="button" 
                                    onClick={() => setCodeType('Admission')} 
                                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 flex flex-col gap-2 ${codeType === 'Admission' ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 shadow-sm' : 'border-border bg-card hover:border-purple-200 hover:bg-muted/30'}`}
                                >
                                    <div className={`p-2 rounded-lg w-fit ${codeType === 'Admission' ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        <DocumentTextIcon className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <span className={`block font-bold text-sm ${codeType === 'Admission' ? 'text-purple-700 dark:text-purple-400' : 'text-foreground'}`}>Admission</span>
                                        <span className="block text-[10px] text-muted-foreground mt-0.5 leading-tight">Full document sharing for enrollment.</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        {/* Note Input */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase text-muted-foreground tracking-wider">Note <span className="font-normal text-muted-foreground/60 ml-1">(Optional)</span></label>
                            <input 
                                type="text" 
                                placeholder="e.g. For Principal meeting" 
                                value={purpose} 
                                onChange={(e) => setPurpose(e.target.value)} 
                                className="w-full p-3.5 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium shadow-sm placeholder:text-muted-foreground/50" 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={generating || myApplications.length === 0} 
                            className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        >
                            {generating ? <Spinner size="sm" className="text-white" /> : 'Generate Secure Code'}
                        </button>
                    </form>
                </div>
            </div>

            {/* --- RIGHT PANEL: HISTORY & RESULT --- */}
            <div className="lg:col-span-7 space-y-8">
                
                {/* Result Card */}
                {generatedCode && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-slate-900 text-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800 relative">
                            <div className="p-8 pb-6 text-center relative z-10 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
                                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
                                    <CheckCircleIcon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-1 text-white tracking-tight">Code Generated!</h3>
                                <p className="text-slate-400 text-sm font-medium">Ready to share with school administration.</p>
                            </div>
                            
                            <div className="p-8 relative z-10 bg-slate-900">
                                <div 
                                    className="border-2 border-dashed border-slate-700 bg-slate-800/50 rounded-2xl p-8 text-center mb-8 relative group cursor-pointer transition-colors hover:border-slate-600 hover:bg-slate-800" 
                                    onClick={() => handleCopyCode(generatedCode)}
                                >
                                     <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mb-3">Verification Code</p>
                                     <div className="text-4xl sm:text-6xl font-mono font-black text-blue-400 tracking-widest select-all drop-shadow-lg">{generatedCode}</div>
                                     <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl backdrop-blur-sm">
                                         <span className="text-white font-bold text-sm flex items-center gap-2"><CopyIcon className="w-5 h-5"/> Click to Copy</span>
                                     </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-4">
                                     <button 
                                        type="button" 
                                        onClick={() => handleCopyCode(generatedCode)} 
                                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isCopied ? 'bg-emerald-600 text-white cursor-default ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 hover:-translate-y-0.5'}`} 
                                        disabled={isCopied}
                                    >
                                        {isCopied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}{isCopied ? 'Copied!' : 'Copy Code'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleShareCode(generatedCode)} 
                                        className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600"
                                    >
                                        <ShareIcon className="w-5 h-5" /> Share
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-500 text-center mt-6 uppercase tracking-wider font-medium flex items-center justify-center gap-2">
                                    <ClockIcon className="w-3 h-3"/> Valid for 7 days
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* History List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-foreground">History</h3>
                            {codes.length > 0 && <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border">{codes.length}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Sort:</span>
                            <div className="relative">
                                <select 
                                    value={sortOrder} 
                                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                                    className="appearance-none bg-card border border-input rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <SortIcon className="w-3 h-3"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {renderHistory()}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ShareCodesTab;
