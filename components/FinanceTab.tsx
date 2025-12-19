
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
    FinanceData, InvoiceStatus, FeeStructure, FeeComponent, SchoolClass, 
    StudentFeeSummary, StudentFinanceDetails, StudentInvoiceDetails, Payment, Refund, Concession, FeeFrequency, UserProfile
} from '../types';
import Spinner from './common/Spinner';
import { FinanceIcon } from './icons/FinanceIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { RefreshCwIcon } from './icons/RefreshCwIcon';
import { UsersIcon } from './icons/UsersIcon';
import { InfoIcon } from './icons/InfoIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { TagIcon } from './icons/TagIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { LinkIcon } from './icons/LinkIcon';
import { TrashIcon } from './icons/TrashIcon';
import DuesDashboard from './finance/DuesDashboard';
import ExpenseDashboard from './finance/ExpenseDashboard';
import FinanceReports from './finance/FinanceReports';
import { ChartBarIcon } from './icons/ChartBarIcon';
import RevenueChart from './finance/charts/RevenueChart';
import CollectionChart from './finance/charts/CollectionChart';
import PaymentModesChart from './finance/charts/PaymentModesChart';
import StudentFinanceDetailView from './finance/StudentFinanceDetailView';

// --- CONSTANTS ---
const CURRENCIES = [ { code: 'USD', symbol: '$', label: 'USD ($)' }, { code: 'INR', symbol: '₹', label: 'INR (₹)' }, { code: 'EUR', symbol: '€', label: 'EUR (€)' }, ];

// --- UTILITY FUNCTIONS ---
const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

const getStatusPill = (status: string) => {
    const statusMap: { [key: string]: string } = {
        'Paid': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', 
        'Overdue': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        'No Invoices': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusMap[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
};


// --- MODALS & SUB-COMPONENTS ---

const KPICard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend: string; trendColor: string; }> = ({ title, value, icon, trend, trendColor }) => {
    const TrendIcon = trend.startsWith('+') ? TrendingUpIcon : trend.startsWith('-') ? TrendingUpIcon : InfoIcon;
    const trendIconClass = trend.startsWith('+') ? '' : trend.startsWith('-') ? 'rotate-180' : '';
    
    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <p className="text-sm font-bold text-muted-foreground">{title}</p>
                    <span className="text-3xl font-black text-foreground mt-2 tracking-tight">{value}</span>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                    {icon}
                </div>
            </div>
            <p className={`text-xs font-bold mt-4 flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className={`w-4 h-4 ${trendIconClass}`}/> {trend}
            </p>
        </div>
    );
};


interface CreateStructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const CreateStructureModal: React.FC<CreateStructureModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [academicYear, setAcademicYear] = useState('2025-2026');
    const [components, setComponents] = useState<Partial<FeeComponent>[]>([{ name: '', amount: 0, frequency: 'Annually' }]);
    const [loading, setLoading] = useState(false);

    const handleAddComponent = () => {
        setComponents([...components, { name: '', amount: 0, frequency: 'Annually' }]);
    };

    const handleComponentChange = (index: number, field: keyof FeeComponent, value: any) => {
        const newComponents = [...components];
        newComponents[index] = { ...newComponents[index], [field]: value };
        setComponents(newComponents);
    };

    const handleRemoveComponent = (index: number) => {
        setComponents(components.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: structureData, error: structureError } = await supabase
                .from('fee_structures')
                .insert({
                    name,
                    description,
                    academic_year: academicYear
                })
                .select()
                .single();

            if (structureError) throw structureError;

            if (components.length > 0 && components.some(c => c.name && c.amount)) {
                const componentData = components
                    .filter(c => c.name && c.amount)
                    .map(c => ({
                        structure_id: structureData.id,
                        name: c.name,
                        amount: c.amount,
                        frequency: c.frequency,
                    }));

                const { error: componentError } = await supabase
                    .from('fee_components')
                    .insert(componentData);
                
                if (componentError) throw componentError;
            }

            onSave();
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                        <h3 className="text-lg font-bold">Create New Fee Structure</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-muted"><XIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="p-6 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Structure Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input-base w-full" placeholder="e.g., Grade 10 Annual Fees"/>
                            </div>
                             <div>
                                <label className="input-label">Academic Year</label>
                                <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="input-base w-full">
                                    <option>2024-2025</option>
                                    <option>2025-2026</option>
                                    <option>2026-2027</option>
                                </select>
                            </div>
                        </div>
                         <div>
                            <label className="input-label">Description (Optional)</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input-base w-full" placeholder="Details about this fee structure"/>
                        </div>
                        <h4 className="font-semibold pt-4 border-t border-border">Fee Components</h4>
                        <div className="space-y-3">
                            {components.map((comp, index) => (
                                <div key={index} className="flex gap-3 items-end p-3 bg-muted/20 rounded-lg border border-border/50">
                                    <div className="flex-1">
                                        <label className="text-xs font-medium text-muted-foreground">Component Name</label>
                                        <input type="text" value={comp.name || ''} onChange={e => handleComponentChange(index, 'name', e.target.value)} required className="w-full mt-1 input-base" placeholder="e.g., Tuition Fee" />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-xs font-medium text-muted-foreground">Amount</label>
                                        <input type="number" value={comp.amount || ''} onChange={e => handleComponentChange(index, 'amount', parseFloat(e.target.value))} required className="w-full mt-1 input-base" />
                                    </div>
                                    <div className="w-40">
                                        <label className="text-xs font-medium text-muted-foreground">Frequency</label>
                                        <select value={comp.frequency} onChange={e => handleComponentChange(index, 'frequency', e.target.value as FeeFrequency)} className="w-full mt-1 input-base">
                                            <option>One-time</option>
                                            <option>Annually</option>
                                            <option>Quarterly</option>
                                            <option>Monthly</option>
                                        </select>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveComponent(index)} className="h-10 w-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddComponent} className="text-sm text-primary font-bold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Component</button>
                    </div>
                    <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/20">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
                            {loading ? <Spinner size="sm" /> : 'Save Structure'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const OnlinePaymentGatewayModal: React.FC<{
    invoice: StudentInvoiceDetails;
    onClose: () => void;
    onSuccess: (receiptNo: string, invoiceId: number) => void;
}> = ({ invoice, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');

    const amountToPay = invoice.amount - (invoice.amount_paid || 0) - (invoice.concession_amount || 0);

    const handlePayment = async () => {
        setStep('processing');
        setLoading(true);
        
        await new Promise(resolve => setTimeout(resolve, 2500));

        try {
            const { data, error } = await supabase.rpc('record_fee_payment', {
                p_invoice_id: invoice.id,
                p_amount: amountToPay,
                p_method: 'Online',
                p_reference: `stripe_txn_${Date.now()}`
            });

            if (error) throw error;
            
            setStep('success');
            onSuccess(data, invoice.id);
        } catch (err: any) {
            alert(`Payment failed: ${err.message}`);
            setLoading(false);
            setStep('confirm');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
                {step === 'confirm' && (
                    <>
                        <div className="p-6 border-b border-border bg-muted/20 text-center">
                            <h3 className="text-lg font-bold">Secure Online Payment</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <p className="text-sm text-muted-foreground text-center">You are paying for <strong className="text-foreground">{invoice.description}</strong></p>
                            <div className="text-center bg-background border border-border rounded-xl p-4">
                                <p className="text-xs font-bold uppercase text-muted-foreground">Amount Due</p>
                                <p className="text-4xl font-black text-primary font-mono tracking-tight">{formatCurrency(amountToPay)}</p>
                            </div>
                            <button onClick={handlePayment} className="w-full btn-primary flex items-center justify-center gap-2"><CreditCardIcon className="w-4 h-4"/> Proceed to Pay</button>
                        </div>
                    </>
                )}
                {step === 'processing' && (
                    <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
                        <Spinner size="lg" />
                        <h3 className="font-bold text-foreground">Processing Payment...</h3>
                        <p className="text-sm text-muted-foreground">Please do not close this window.</p>
                    </div>
                )}
                 {step === 'success' && (
                    <div className="p-12 flex flex-col items-center justify-center gap-2 text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
                           <CheckCircleIcon className="w-8 h-8"/>
                        </div>
                        <h3 className="font-bold text-xl text-foreground">Payment Successful!</h3>
                        <p className="text-sm text-muted-foreground">The student ledger has been updated and a receipt has been auto-generated.</p>
                        <button onClick={onClose} className="mt-4 btn-primary w-full">Done</button>
                    </div>
                )}
            </div>
             <style>{`.btn-primary { padding: 0.75rem 1.5rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 0.5rem; font-weight: 700; font-size: 0.9rem; }`}</style>
        </div>
    );
};

// FIX: Update component to accept `profile` prop to resolve type error and enable role-based logic.
const FinanceTab: React.FC<{ profile: UserProfile }> = ({ profile }) => {
    const [activeView, setActiveView] = useState<'overview' | 'dues' | 'expenses' | 'structures' | 'accounts' | 'settings' | 'reports'>('overview');
    const [financeData, setFinanceData] = useState<FinanceData | null>(null);
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [studentFeeSummaries, setStudentFeeSummaries] = useState<StudentFeeSummary[]>([]);
    
    const [loading, setLoading] = useState({ dashboard: true, students: true, structures: true });
    const [error, setError] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateStructOpen, setIsCreateStructOpen] = useState(false);
    const [onlinePaymentInvoice, setOnlinePaymentInvoice] = useState<StudentInvoiceDetails | null>(null);

    const [gateways, setGateways] = useState({ razorpay: false, stripe: true, paytm: false });
    
    const [selectedStudent, setSelectedStudent] = useState<StudentFeeSummary | null>(null);

    const fetchAllData = useCallback(async () => {
        setError(null);
        try {
            setLoading({ dashboard: true, students: true, structures: true });
            
            const [finRes, structRes, studentRes] = await Promise.all([
                supabase.rpc('get_finance_dashboard_data'),
                supabase.from('fee_structures').select('*, components:fee_components(*)'),
                supabase.rpc('get_student_fee_dashboard')
            ]);

            if (finRes.error) throw finRes.error;
            setFinanceData(finRes.data);

            if (structRes.error) throw structRes.error;
            setFeeStructures(structRes.data || []);
            
            if (studentRes.error) throw studentRes.error;
            setStudentFeeSummaries(studentRes.data || []);

        } catch (err: any) {
            setError(err.message);
            console.error("FinanceTab Error:", err);
        } finally {
            setLoading({ dashboard: false, students: false, structures: false });
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handlePaymentSuccess = () => {
        fetchAllData();
        setOnlinePaymentInvoice(null);
    };

    const isLoading = loading.dashboard || loading.students || loading.structures;

    const renderContent = () => {
        if (isLoading && !financeData) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
        if (error) return <p className="text-center text-destructive p-8">{error}</p>;
        if (!financeData) return <p className="text-center text-muted-foreground p-8">No financial data available.</p>;

        switch (activeView) {
            case 'overview':
                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <KPICard title="Revenue (YTD)" value={formatCurrency(financeData.revenue_ytd)} icon={<DollarSignIcon className="w-6 h-6"/>} trend="+12.5% vs LY" trendColor="text-emerald-500" />
                            <KPICard title="Collections (Month)" value={formatCurrency(financeData.collections_this_month)} icon={<TrendingUpIcon className="w-6 h-6"/>} trend="+8.1% vs LM" trendColor="text-emerald-500" />
                            <KPICard title="Pending Dues" value={formatCurrency(financeData.pending_dues)} icon={<CreditCardIcon className="w-6 h-6"/>} trend="-2.4% vs LM" trendColor="text-red-500" />
                            <KPICard title="Overdue Accounts" value={financeData.overdue_accounts.toString()} icon={<UsersIcon className="w-6 h-6"/>} trend="+3 new" trendColor="text-red-500" />
                            <KPICard title="Online Payments" value={formatCurrency(financeData.online_payments)} icon={<CreditCardIcon className="w-6 h-6"/>} trend="72% of total" trendColor="text-blue-500" />
                            <KPICard title="Refunds Processed" value={formatCurrency(financeData.refunds_processed)} icon={<RefreshCwIcon className="w-6 h-6"/>} trend="4 refunds this month" trendColor="text-muted-foreground" />
                        </div>
                         <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-3 bg-card p-6 rounded-2xl border border-border shadow-sm">
                                <h3 className="font-bold text-foreground mb-4">Revenue Trends (YTD)</h3>
                                <div className="h-72">
                                    <RevenueChart />
                                </div>
                            </div>
                            <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                                <h3 className="font-bold text-foreground mb-4">Payment Modes</h3>
                                <div className="flex-grow flex items-center">
                                    <PaymentModesChart />
                                </div>
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                            <h3 className="font-bold text-foreground mb-4">Collections vs Dues (Monthly)</h3>
                            <div className="h-24">
                                <CollectionChart />
                            </div>
                        </div>
                    </div>
                );
            case 'dues':
                return financeData.dues_data ? <DuesDashboard data={financeData.dues_data} /> : <Spinner />;
            case 'expenses':
                return financeData.expense_data ? <ExpenseDashboard data={financeData.expense_data} onRefresh={fetchAllData} /> : <Spinner />;
            case 'structures':
                return (
                    <div className="bg-card p-6 rounded-2xl border border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Fee Structures</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {feeStructures.map(fs => (
                                <div key={fs.id} className="bg-background p-4 rounded-lg border border-border/70 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-foreground">{fs.name}</h4>
                                            <p className="text-xs text-muted-foreground font-mono mt-1">{fs.academic_year}</p>
                                        </div>
                                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">{fs.components?.length || 0} Comp.</span>
                                    </div>
                                    {fs.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{fs.description}</p>}
                                </div>
                            ))}
                             <button onClick={() => setIsCreateStructOpen(true)} className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                                 <div className="w-10 h-10 bg-muted group-hover:bg-primary/10 rounded-full flex items-center justify-center mb-2 text-muted-foreground group-hover:text-primary transition-colors">
                                    <PlusIcon className="w-5 h-5"/>
                                 </div>
                                 <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">New Structure</span>
                             </button>
                        </div>
                    </div>
                );
            case 'accounts':
                 if (selectedStudent) {
                     return <StudentFinanceDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
                 }
                 return (
                    <div className="bg-card p-6 rounded-2xl border border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Student Accounts</h3>
                            <input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-base w-full max-w-sm"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {studentFeeSummaries.filter(s => s.display_name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                <button key={s.student_id} onClick={() => setSelectedStudent(s)} className="bg-background p-4 rounded-lg border border-border/70 hover:shadow-md transition-shadow group text-left w-full hover:-translate-y-1">
                                    <div className="flex justify-between items-start">
                                         <div>
                                            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{s.display_name}</h4>
                                            <p className="text-xs text-muted-foreground">{s.class_name}</p>
                                        </div>
                                        {getStatusPill(s.overall_status)}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-baseline">
                                        <span className="text-xs font-bold text-muted-foreground">BALANCE</span>
                                         <span className={`font-mono font-bold text-lg ${s.outstanding_balance > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                                            {formatCurrency(s.outstanding_balance)}
                                         </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'reports':
                return <FinanceReports />;
            case 'settings':
                return (
                    <div>
                         <h3 className="text-2xl font-bold mb-2">Payment Gateways</h3>
                         <p className="text-muted-foreground text-sm mb-8 max-w-2xl">Connect to popular payment gateways to enable seamless online fee collection. Student and parent payments will be automatically recorded.</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <GatewayCard name="Stripe" description="Global online payments." connected={gateways.stripe} onToggle={() => setGateways(g => ({...g, stripe: !g.stripe}))} icon={<CreditCardIcon className="w-6 h-6"/>} />
                            <GatewayCard name="Razorpay" description="Payments for India." connected={gateways.razorpay} onToggle={() => setGateways(g => ({...g, razorpay: !g.razorpay}))} icon={<DollarSignIcon className="w-6 h-6"/>} />
                            <GatewayCard name="Paytm" description="Popular Indian wallet." connected={gateways.paytm} onToggle={() => setGateways(g => ({...g, paytm: !g.paytm}))} icon={<CreditCardIcon className="w-6 h-6"/>} />
                         </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Finance Module</h2>
                    <p className="text-muted-foreground text-sm">Central hub for all financial operations and analytics.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                     <button className="btn-secondary text-xs"><PlusIcon className="w-4 h-4"/> Create Invoice</button>
                     <button onClick={() => setIsCreateStructOpen(true)} className="btn-secondary text-xs"><PlusIcon className="w-4 h-4"/> Add Fee Structure</button>
                     <button className="btn-secondary text-xs"><DownloadIcon className="w-4 h-4"/> Download Report</button>
                </div>
             </div>

            <div className="flex space-x-2 border-b border-border overflow-x-auto scrollbar-hide">
                <button onClick={() => setActiveView('overview')} className={`tab-button ${activeView === 'overview' && 'active'}`}>Overview</button>
                <button onClick={() => setActiveView('dues')} className={`tab-button ${activeView === 'dues' && 'active'}`}>Dues &amp; Follow-up</button>
                <button onClick={() => setActiveView('expenses')} className={`tab-button ${activeView === 'expenses' && 'active'}`}>Expense Mgmt</button>
                <button onClick={() => setActiveView('accounts')} className={`tab-button ${activeView === 'accounts' && 'active'}`}>Student Accounts</button>
                <button onClick={() => setActiveView('structures')} className={`tab-button ${activeView === 'structures' && 'active'}`}>Fee Structures</button>
                <button onClick={() => setActiveView('reports')} className={`tab-button ${activeView === 'reports' && 'active'}`}>Reporting</button>
                <button onClick={() => setActiveView('settings')} className={`tab-button ${activeView === 'settings' && 'active'}`}>Settings</button>
            </div>
            
            <div className="animate-in fade-in slide-in-from-bottom-2">
                {renderContent()}
            </div>
            
            <CreateStructureModal isOpen={isCreateStructOpen} onClose={() => setIsCreateStructOpen(false)} onSave={fetchAllData} />
            {onlinePaymentInvoice && (
                <OnlinePaymentGatewayModal 
                    invoice={onlinePaymentInvoice}
                    onClose={() => setOnlinePaymentInvoice(null)}
                    onSuccess={() => { handlePaymentSuccess(); }}
                />
            )}
             <style>{`
                .tab-button { padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; } .tab-button.active { border-color: hsl(var(--primary)); color: hsl(var(--primary)); }
                .btn-secondary { display: inline-flex; align-items: center; gap: 0.5rem; background-color: hsl(var(--card)); border: 1px solid hsl(var(--border)); color: hsl(var(--foreground)); padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-weight: 600; } .btn-secondary:hover { background-color: hsl(var(--muted)); }
                .btn-primary { padding: 0.75rem 1.5rem; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 0.5rem; font-weight: 700; font-size: 0.9rem; display: inline-flex; align-items: center; justify-content: center; } .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
                .input-base { width: 100%; background-color: hsl(var(--background)); border: 1px solid hsl(var(--input)); border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
                .input-label { font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem; display: block; }
             `}</style>
        </div>
    );
};

const GatewayCard: React.FC<{name: string, description: string, connected: boolean, onToggle: ()=>void, icon: React.ReactNode}> = ({name, description, connected, onToggle, icon}) => (
    <div className={`bg-card p-6 rounded-2xl border-2 transition-all duration-300 ${connected ? 'border-green-500/50 bg-green-500/5' : 'border-border'}`}>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${connected ? 'bg-green-100/50 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-lg">{name}</h4>
                     <div className={`mt-1 px-2 py-0.5 inline-block rounded-md text-xs font-bold border ${connected ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted text-muted-foreground border-border'}`}>
                        {connected ? 'Active' : 'Not Connected'}
                    </div>
                </div>
            </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4 h-10">{description}</p>
        <button onClick={onToggle} className={`w-full mt-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${connected ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
            {connected ? <XIcon className="w-4 h-4"/> : <LinkIcon className="w-4 h-4"/>}
            {connected ? 'Disconnect' : 'Connect'}
        </button>
    </div>
);

export default FinanceTab;
