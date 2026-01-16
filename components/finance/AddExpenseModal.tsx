
import React, { useState, useRef } from 'react';
import { supabase, formatError } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

const EXPENSE_CATEGORIES = [
    'Salaries', 'Utilities', 'Transport', 'Lab & Supplies', 'Maintenance', 'Events', 'Marketing', 'Administrative', 'Other'
];

interface AddExpenseModalProps {
    onClose: () => void;
    onSave: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        category: 'Utilities',
        amount: '',
        vendor_name: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        payment_mode: 'Online Transfer',
    });
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        let invoiceUrl: string | null = null;
        try {
            if (invoiceFile) {
                const filePath = `expense_vault/${Date.now()}_${invoiceFile.name}`;
                const { error: uploadError } = await supabase.storage.from('guardian-documents').upload(filePath, invoiceFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('guardian-documents').getPublicUrl(filePath);
                invoiceUrl = publicUrl;
            }
            
            const { error: insertError } = await supabase.from('school_expenses').insert({
                category: formData.category,
                amount: parseFloat(formData.amount),
                vendor_name: formData.vendor_name,
                expense_date: formData.expense_date,
                description: formData.description,
                payment_mode: formData.payment_mode,
                invoice_url: invoiceUrl,
                status: 'Approved'
            });
            
            if (insertError) throw insertError;
            
            onSave();
            onClose();
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-500" onClick={onClose}>
            <div className="bg-[#0c0d12] w-full max-w-2xl rounded-[3.5rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] border border-white/10 flex flex-col overflow-hidden max-h-[95vh] ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <header className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative overflow-hidden group">
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner border border-primary/20 group-hover:rotate-6 transition-transform duration-700">
                                <BriefcaseIcon className="w-7 h-7"/>
                            </div>
                            <div>
                                <h3 className="text-3xl font-serif font-black text-white uppercase tracking-tight">Record Expense</h3>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-1">Institutional Artifact Archive</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-white/20 transition-all"><XIcon className="w-6 h-6"/></button>
                    </header>

                    <main className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-grow">
                        {error && (
                            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-4 animate-in shake">
                                <span className="text-2xl">⚠️</span>
                                <p className="text-xs font-black uppercase text-red-500 tracking-wider leading-relaxed">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Center Focus</label>
                                <select 
                                    name="category" 
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-sm font-black text-white/80 focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none appearance-none cursor-pointer shadow-inner uppercase tracking-widest"
                                >
                                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Monetary Magnitude</label>
                                <div className="relative">
                                    <DollarSignIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-60"/>
                                    <input 
                                        type="number" 
                                        name="amount" 
                                        value={formData.amount} 
                                        onChange={e => setFormData({...formData, amount: e.target.value})} 
                                        required 
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 pl-12 text-lg font-mono font-black text-white focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none shadow-inner" 
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Entity Arbiter / Vendor</label>
                                <input 
                                    type="text" 
                                    name="vendor_name" 
                                    value={formData.vendor_name} 
                                    onChange={e => setFormData({...formData, vendor_name: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-sm font-bold text-white/80 focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none shadow-inner uppercase tracking-wider" 
                                    placeholder="CENTRAL_SUPPLY_NODE"
                                />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Registry Pulse Date</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10"/>
                                    <input 
                                        type="date" 
                                        name="expense_date" 
                                        value={formData.expense_date} 
                                        onChange={e => setFormData({...formData, expense_date: e.target.value})} 
                                        required 
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 pl-12 text-sm font-black text-white focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none shadow-inner"
                                    />
                                </div>
                             </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Payload Description</label>
                            <textarea 
                                name="description" 
                                value={formData.description} 
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                                required 
                                rows={2} 
                                className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 text-sm font-medium text-white/70 focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none shadow-inner leading-relaxed font-serif italic" 
                                placeholder="Describe the transaction rationale..."
                            />
                        </div>
                        
                        <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Artifact Archival</label>
                             <div 
                                className={`p-10 border-2 border-dashed rounded-[2.5rem] text-center cursor-pointer transition-all duration-700 bg-black/20 ${invoiceFile ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'border-white/5 hover:border-primary/40 hover:bg-white/[0.01]'}`}
                                onClick={() => fileInputRef.current?.click()}
                             >
                                <div className={`p-4 rounded-2xl w-fit mx-auto mb-4 shadow-xl transition-all duration-500 ${invoiceFile ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/10'}`}>
                                    <UploadIcon className="w-8 h-8"/>
                                </div>
                                <p className={`text-lg font-serif font-black transition-colors ${invoiceFile ? 'text-white' : 'text-white/20'}`}>{invoiceFile ? invoiceFile.name.toUpperCase() : 'UPLOAD INVOICE ARTIFACT'}</p>
                                <p className="text-[10px] text-white/10 mt-2 font-black uppercase tracking-widest">PDF / PNG / JPG • MAX 5MB</p>
                                <input type="file" ref={fileInputRef} onChange={e => setInvoiceFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
                             </div>
                        </div>
                    </main>

                    <footer className="p-10 border-t border-white/5 bg-black/20 flex flex-col md:flex-row justify-between items-center gap-8">
                        <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all order-2 md:order-1">Decommission Form</button>
                        <button 
                            type="submit" 
                            disabled={loading || !formData.amount} 
                            className="w-full md:w-auto px-12 py-5 bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all transform active:scale-95 disabled:opacity-30 flex items-center justify-center gap-4 group order-1 md:order-2 ring-8 ring-primary/5"
                        >
                            {loading ? <Spinner size="sm" className="text-white" /> : <><CheckCircleIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Authorize & Sync</>}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddExpenseModal;
