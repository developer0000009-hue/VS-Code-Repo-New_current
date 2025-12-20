
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

// Robust error formatter helper
const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') return err;
    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string' && !message.includes("[object Object]")) return message;
    return "An unexpected error occurred while processing the payment.";
};

interface PayableInvoice {
    id: number;
    description: string;
    amount_due: number;
}

interface RecordPaymentModalProps {
    studentId: string;
    studentName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ studentId, studentName, onClose, onSuccess }) => {
    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [invoices, setInvoices] = useState<PayableInvoice[]>([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchPayableInvoices = async () => {
            const { data, error } = await supabase.rpc('get_payable_invoices_for_student', { p_student_id: studentId });
            if (data) {
                setInvoices(data);
                if (data.length > 0) {
                    setSelectedInvoiceId(String(data[0].id));
                    setAmount(String(data[0].amount_due));
                }
            }
        };
        fetchPayableInvoices();
    }, [studentId]);

    useEffect(() => {
        const selected = invoices.find(inv => inv.id === Number(selectedInvoiceId));
        if (selected) {
            setAmount(String(selected.amount_due));
        }
    }, [selectedInvoiceId, invoices]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setStep('processing');
        setLoading(true);
        
        try {
            const { error: rpcError } = await supabase.rpc('record_fee_payment', {
                p_invoice_id: Number(selectedInvoiceId),
                p_amount: parseFloat(amount),
                p_method: paymentMethod,
                p_reference: `${reference} ${notes ? `| Notes: ${notes}`: ''}`.trim()
            });

            if (rpcError) throw rpcError;
            
            setStep('success');
            setTimeout(() => {
                onSuccess();
            }, 1500); 
        } catch (err: any) {
            setError(formatError(err));
            setStep('form');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (step === 'processing' || loading) {
            return (
                <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
                    <Spinner size="lg" />
                    <h3 className="font-bold text-foreground">Recording Payment...</h3>
                    <p className="text-sm text-muted-foreground">Updating student ledger and invoice status.</p>
                </div>
            );
        }

        if (step === 'success') {
            return (
                <div className="p-12 flex flex-col items-center justify-center gap-2 text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircleIcon className="w-8 h-8"/>
                    </div>
                    <h3 className="font-bold text-xl text-foreground">Payment Recorded!</h3>
                    <p className="text-sm text-muted-foreground">The student's financial records have been updated.</p>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="p-6 overflow-y-auto space-y-5">
                    {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20 font-medium">{error}</div>}

                    <div>
                        <label className="input-label">Invoice to Pay</label>
                        <select value={selectedInvoiceId} onChange={e => setSelectedInvoiceId(e.target.value)} className="input-base w-full">
                            {invoices.length === 0 && <option>No payable invoices found</option>}
                            {invoices.map(inv => (
                                <option key={inv.id} value={inv.id}>{inv.description} - Due: ${inv.amount_due.toFixed(2)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="input-label">Amount</label>
                            <div className="relative">
                                <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="input-base w-full pl-8" />
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Payment Method</label>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input-base w-full">
                                <option>Cash</option><option>Cheque</option><option>Bank Transfer</option><option>Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="input-label">Payment Date</label>
                            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="input-base w-full" />
                        </div>
                        <div>
                            <label className="input-label">Reference # (Optional)</label>
                            <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="Cheque No, Txn ID..." className="input-base w-full" />
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Notes (Optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input-base w-full" />
                    </div>
                </div>

                <footer className="p-6 border-t border-border flex justify-end gap-3 bg-muted/20 mt-auto">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={!selectedInvoiceId} className="btn-primary min-w-[150px]">
                        Record Payment
                    </button>
                </footer>
            </form>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-border bg-muted/20 flex justify-between items-center bg-muted/20">
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Record Payment</h3>
                        <p className="text-xs text-muted-foreground">For: {studentName}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-muted"><XIcon className="w-5 h-5"/></button>
                </header>
                {renderContent()}
            </div>
            <style>{`
                .input-base { width: 100%; background-color: hsl(var(--background)); border: 1px solid hsl(var(--input)); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.2s; }
                .input-base:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 2px hsl(var(--primary) / 0.1); }
                .input-label { font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem; display: block; }
                .btn-primary { padding: 0.75rem 1.5rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 0.5rem; font-weight: 700; font-size: 0.9rem; display: inline-flex; align-items: center; justify-content: center; } .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
                .btn-secondary { padding: 0.75rem 1.5rem; background-color: hsl(var(--muted)); color: hsl(var(--foreground)); border-radius: 0.5rem; font-weight: 600; }
            `}</style>
        </div>
    );
};

export default RecordPaymentModal;
