import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { SchoolBranch, BulkImportResult } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { TransferIcon } from '../icons/TransferIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import { BookIcon } from '../icons/BookIcon';
import { FileSpreadsheetIcon } from '../icons/FileSpreadsheetIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { CommunicationIcon } from '../icons/CommunicationIcon';
import { MegaphoneIcon } from '../icons/MegaphoneIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { DownloadIcon } from '../icons/DownloadIcon';

export type BulkActionType = 'status' | 'department' | 'subject' | 'transfer' | 'import' | 'message';

interface BulkActionsModalProps {
    action: BulkActionType;
    selectedIds: string[]; // Teacher IDs
    onClose: () => void;
    onSuccess: () => void;
    branchId: number | null;
}

const BulkActionsModal: React.FC<BulkActionsModalProps> = ({ action, selectedIds, onClose, onSuccess, branchId }) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'config' | 'processing' | 'summary'>('config');
    const [value, setValue] = useState('');
    const [branches, setBranches] = useState<SchoolBranch[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [importStats, setImportStats] = useState<BulkImportResult | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    
    // Message State
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    useEffect(() => {
        if (action === 'transfer') {
            const fetchBranches = async () => {
                const { data } = await supabase.rpc('get_school_branches');
                if (data) setBranches(data);
            };
            fetchBranches();
        }
    }, [action]);

    const processBatch = async () => {
        if (action === 'import') {
            await handleImport();
            return;
        }

        setLoading(true);
        try {
            let updates: any = {};
            if (action === 'status') updates.employment_status = value;
            if (action === 'department') updates.department = value;
            if (action === 'subject') updates.subject = value;
            if (action === 'transfer') updates.branch_id = value;

            const { error } = await supabase.rpc('bulk_update_teacher_profiles', {
                p_teacher_ids: selectedIds,
                p_updates: updates
            });

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(`Bulk update failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleImport = async () => {
        if (!file) return;
        setStep('processing');
        setLoading(true);
        setImportStats(null);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) { setLoading(false); return; }
            
            const lines = text.split('\n');
            const dataRows = lines.slice(1).filter(line => line.trim() !== '');
            const records: any[] = [];
            const validationErrors: any[] = [];

            dataRows.forEach((line, index) => {
                const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
                if (cleanCols.length < 2) return; 

                const [name, email, phone, dept, desig, status, subject, exp] = cleanCols;
                const rowNum = index + 2;

                if (!name || !email) {
                    validationErrors.push({ row: rowNum, name: name || 'Unknown', error: 'Missing Name or Email' });
                    return;
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    validationErrors.push({ row: rowNum, name: name, error: 'Invalid Email Format' });
                    return;
                }

                records.push({
                    row_index: rowNum, 
                    display_name: name,
                    email: email,
                    phone: phone || null,
                    department: dept || null,
                    designation: desig || 'Teacher',
                    subject: subject || null,
                    experience_years: exp && !isNaN(parseInt(exp)) ? parseInt(exp) : null,
                    employment_status: status || 'Active',
                    qualification: null
                });
            });

            try {
                 const { data, error } = await supabase.rpc('bulk_import_teachers', { 
                    p_records: records,
                    p_branch_id: branchId
                 });
                 
                 if (error) throw error;
                 
                 const serverErrors = data.errors || [];
                 const formattedServerErrors = serverErrors.map((err: any) => ({
                     row: err.row, name: err.name, error: err.error
                 }));

                 const finalErrors = [...validationErrors, ...formattedServerErrors].sort((a, b) => a.row - b.row);
                 const successCount = data.success_count || 0;
                 const failureCount = (data.failure_count || 0) + validationErrors.length;

                 setImportStats({
                     success_count: successCount,
                     failure_count: failureCount,
                     errors: finalErrors
                 });
                 setStep('summary');
            } catch (err: any) {
                console.error(err);
                alert(`Import failed: ${err.message}`);
                setStep('config');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setImportStats(null);
            
            const reader = new FileReader();
            reader.onload = (evt) => {
                const text = evt.target?.result as string;
                if (text) {
                    const lines = text.split('\n').slice(1).filter(l => l.trim() !== '');
                    const preview = lines.map(line => {
                        const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                        const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
                        if (cleanCols.length < 2) return null;
                        const [name, email] = cleanCols;
                        return { name, email };
                    }).filter(Boolean);
                    setPreviewData(preview as any[]);
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const getTitle = () => {
        switch (action) {
            case 'status': return 'Bulk Status Update';
            case 'department': return 'Assign Department';
            case 'subject': return 'Assign Primary Subject';
            case 'transfer': return 'Transfer Faculty';
            case 'import': return 'Import Teachers';
            case 'message': return 'Broadcast Message';
            default: return 'Bulk Action';
        }
    };

    const getIcon = () => {
        switch (action) {
            case 'status': return <CheckCircleIcon className="w-6 h-6 text-primary"/>;
            case 'department': return <BriefcaseIcon className="w-6 h-6 text-primary"/>;
            case 'subject': return <BookIcon className="w-6 h-6 text-primary"/>;
            case 'transfer': return <TransferIcon className="w-6 h-6 text-primary"/>;
            case 'import': return <FileSpreadsheetIcon className="w-6 h-6 text-primary"/>;
            case 'message': return <MegaphoneIcon className="w-6 h-6 text-primary"/>;
            default: return null;
        }
    };
    
    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Full Name,Email,Phone,Department,Designation,Status,Subject,Experience(Yrs)\nJohn Doe,john@school.com,1234567890,Science,Senior Teacher,Active,Physics,5";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "teacher_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (step === 'summary' && importStats) {
        return (
             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in" onClick={onClose}>
                <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-border bg-muted/10 text-center"><h3 className="text-xl font-bold text-foreground">Import Summary</h3></div>
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-muted/50 p-4 rounded-xl text-center border border-border"><p className="text-[10px] font-bold text-muted-foreground uppercase">Total</p><p className="text-3xl font-extrabold text-foreground mt-1">{importStats.success_count + importStats.failure_count}</p></div>
                            <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 text-center"><p className="text-[10px] font-bold text-green-700 uppercase">Successful</p><p className="text-3xl font-extrabold text-green-600 mt-1">{importStats.success_count}</p></div>
                            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center"><p className="text-[10px] font-bold text-red-700 uppercase">Failed</p><p className="text-3xl font-extrabold text-red-600 mt-1">{importStats.failure_count}</p></div>
                        </div>
                        {importStats.errors.length > 0 ? (
                            <div className="border border-red-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-red-50 p-3 border-b border-red-100 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4 text-red-600"/><span className="text-xs font-bold text-red-800 uppercase">Error Report</span></div>
                                <div className="max-h-60 overflow-y-auto p-0 bg-white"><table className="w-full text-left text-xs"><thead className="bg-red-50/50 sticky top-0"><tr className="border-b border-red-100"><th className="p-3 font-semibold text-red-700 w-16">Row</th><th className="p-3 font-semibold text-red-700 w-1/3">Name</th><th className="p-3 font-semibold text-red-700">Issue</th></tr></thead><tbody className="divide-y divide-red-100">{importStats.errors.map((err, idx) => (<tr key={idx} className="hover:bg-red-50/30"><td className="p-3 font-mono text-muted-foreground bg-red-50/10">{err.row}</td><td className="p-3 font-medium text-foreground">{err.name}</td><td className="p-3 text-red-600 font-medium">{err.error}</td></tr>))}</tbody></table></div>
                            </div>
                        ) : ( <div className="p-8 bg-green-50 rounded-xl border border-green-200 text-green-800 text-center"><CheckCircleIcon className="w-10 h-10 mx-auto mb-2 text-green-600"/><p className="font-bold">Perfect Import!</p></div> )}
                    </div>
                    <div className="p-6 border-t border-border bg-muted/10 flex justify-end"><button onClick={() => { onSuccess(); onClose(); }} className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl">Close & Refresh</button></div>
                </div>
            </div>
         );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center"><div className="flex items-center gap-3"><div className="p-2.5 bg-primary/10 rounded-xl text-primary">{getIcon()}</div><div><h3 className="font-bold text-lg leading-tight">{getTitle()}</h3></div></div><button onClick={onClose}><XIcon className="w-5 h-5 text-muted-foreground hover:text-foreground"/></button></div>
                {(action === 'import' && step === 'config') ? (
                    <div className="p-6 space-y-4">
                        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer relative group bg-muted/5">
                            <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-primary/10"><UploadIcon className="w-7 h-7" /></div>
                            <p className="font-bold text-foreground text-sm">{file ? file.name : 'Click to upload CSV'}</p>
                            <p className="text-xs text-muted-foreground mt-1">{file ? `${(file.size / 1024).toFixed(1)} KB • Ready` : 'Drag and drop or browse'}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <button onClick={handleDownloadTemplate} className="text-xs font-bold text-primary hover:underline flex items-center gap-1"><FileSpreadsheetIcon className="w-3.5 h-3.5"/> Download Template</button>
                            {previewData.length > 0 && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">{previewData.length} records found</span>}
                        </div>
                    </div>
                ) : step === 'processing' ? (
                     <div className="p-12 flex flex-col items-center justify-center gap-4 text-center"><Spinner size="lg" /><h3 className="font-bold text-foreground">Processing...</h3></div>
                ) : ( <form onSubmit={(e) => { e.preventDefault(); processBatch(); }} className="p-6 space-y-5">{/* Other forms would go here */}</form> )}
                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted">Cancel</button>
                    <button onClick={processBatch} disabled={loading || (action === 'import' && !file)} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                        {loading ? <Spinner size="sm"/> : action === 'import' ? 'Start Import' : 'Apply Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkActionsModal;
