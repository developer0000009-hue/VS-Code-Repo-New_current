
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { StudentFeeSummary, StudentFinanceDetails, InvoiceStatus } from '../../types';
import Spinner from '../common/Spinner';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { BellIcon } from '../icons/BellIcon';
import { TagIcon } from '../icons/TagIcon';
import RecordPaymentModal from './RecordPaymentModal';

// Helper to format currency
const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

// Invoice Status Badge
const InvoiceStatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
    const styles: Record<InvoiceStatus, string> = {
        'Paid': 'bg-green-100 text-green-700 border-green-200',
        'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
        'Overdue': 'bg-red-100 text-red-700 border-red-200',
        'Partial': 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return <span className={`px-2.5 py-1 inline-flex text-[10px] font-bold rounded-full border uppercase tracking-wider ${styles[status]}`}>{status}</span>;
};


interface StudentFinanceDetailViewProps {
    student: StudentFeeSummary;
    onBack: () => void;
}

const StudentFinanceDetailView: React.FC<StudentFinanceDetailViewProps> = ({ student, onBack }) => {
    const [details, setDetails] = useState<StudentFinanceDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'concessions' | 'ledger'>('invoices');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_student_finance_details', { p_student_id: student.student_id });
            if (rpcError) throw rpcError;
            setDetails(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [student.student_id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        fetchData(); // Re-fetch all data to show updates
    };

    const renderTabContent = () => {
        if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
        if (error) return <p className="text-destructive text-center p-8">{error}</p>;
        if (!details) return <p className="text-muted-foreground text-center p-8">No financial records found.</p>;

        switch (activeTab) {
            case 'invoices':
                return (
                    <div className="space-y-4">
                        {details.invoices.map(inv => (
                            <div key={inv.id} className="bg-card p-4 rounded-xl border border-border/70 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm text-foreground">{inv.description}</p>
                                    <p className="text-xs text-muted-foreground">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-lg text-foreground">{formatCurrency(inv.amount)}</p>
                                        <p className="text-xs text-green-600 font-medium">Paid: {formatCurrency(inv.amount_paid)}</p>
                                    </div>
                                    <InvoiceStatusBadge status={inv.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'payments':
                 return (
                    <div className="space-y-3">
                        {details.payments.map(p => (
                            <div key={p.id} className="bg-card p-4 rounded-xl border border-border/70 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm text-foreground">Payment Received</p>
                                    <p className="text-xs text-muted-foreground">Receipt: {p.receipt_number}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-lg text-green-600">{formatCurrency(p.amount)}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                 );
            default:
                return <div className="text-center text-muted-foreground p-8 bg-muted/30 rounded-lg">Coming soon...</div>;
        }
    };
    
    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-primary mb-4"><ChevronLeftIcon className="w-4 h-4"/> Back to All Students</button>
            
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm mb-6">
                 <div className="flex justify-between items-start">
                     <div>
                        <h2 className="text-2xl font-bold text-foreground">{student.display_name}</h2>
                        <p className="text-muted-foreground">{student.class_name}</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={()=>setIsPaymentModalOpen(true)} className="btn-secondary text-xs"><PlusIcon className="w-4 h-4"/> Record Payment</button>
                        <button onClick={()=>alert('Feature coming soon!')} className="btn-secondary text-xs"><TagIcon className="w-4 h-4"/> Apply Concession</button>
                        <button onClick={()=>alert('Feature coming soon!')} className="btn-secondary text-xs"><BellIcon className="w-4 h-4"/> Send Reminder</button>
                     </div>
                 </div>
                 <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4">
                     <div className="text-center">
                         <p className="text-xs font-bold uppercase text-muted-foreground">Total Billed</p>
                         <p className="text-2xl font-bold text-foreground font-mono">{formatCurrency(student.total_billed)}</p>
                     </div>
                     <div className="text-center">
                         <p className="text-xs font-bold uppercase text-muted-foreground">Total Paid</p>
                         <p className="text-2xl font-bold text-emerald-500 font-mono">{formatCurrency(student.total_paid)}</p>
                     </div>
                      <div className="text-center">
                         <p className="text-xs font-bold uppercase text-muted-foreground">Balance Due</p>
                         <p className="text-2xl font-bold text-destructive font-mono">{formatCurrency(student.outstanding_balance)}</p>
                     </div>
                 </div>
            </div>
            
            <div className="flex space-x-1 border-b border-border mb-6 bg-card p-1 rounded-xl">
                <button onClick={() => setActiveTab('invoices')} className={`tab-button ${activeTab === 'invoices' && 'active'}`}>Invoices</button>
                <button onClick={() => setActiveTab('payments')} className={`tab-button ${activeTab === 'payments' && 'active'}`}>Payments</button>
                <button onClick={() => setActiveTab('concessions')} className={`tab-button ${activeTab === 'concessions' && 'active'}`}>Concessions & Refunds</button>
                <button onClick={() => setActiveTab('ledger')} className={`tab-button ${activeTab === 'ledger' && 'active'}`}>Ledger</button>
            </div>
            
            {renderTabContent()}

            {isPaymentModalOpen && (
                <RecordPaymentModal 
                    studentId={student.student_id}
                    studentName={student.display_name}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
             <style>{`
                .tab-button { padding: 0.6rem 1rem; font-size: 0.8rem; font-weight: 700; border-radius: 0.5rem; transition: all 0.2s; white-space: nowrap; border: 2px solid transparent; } .tab-button.active { background-color: hsl(var(--background)); border-color: hsl(var(--border)); color: hsl(var(--primary)); }
             `}</style>
        </div>
    );
};

export default StudentFinanceDetailView;
