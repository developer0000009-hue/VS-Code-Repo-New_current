
import React, { useState, useEffect, useMemo } from 'react';
import { supabase, formatError } from '../../services/supabase';
import { SchoolClass } from '../../types';
import Spinner from '../common/Spinner';
import { XIcon } from '../icons/XIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { BookIcon } from '../icons/BookIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { GridIcon } from '../icons/GridIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';

interface FeeMasterWizardProps {
    onClose: () => void;
    onSuccess: () => void;
    branchId: number | null;
}

const FREQUENCIES = ['One-time', 'Monthly', 'Quarterly', 'Annually'];

const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: currency === 'USD' ? 'USD' : 'INR',
        minimumFractionDigits: 0
    }).format(amount || 0);
};

const FeeMasterWizard: React.FC<FeeMasterWizardProps> = ({ onClose, onSuccess, branchId }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        academicYear: '2025-2026',
        targetGrade: '1',
        description: '',
        currency: 'INR' as 'INR' | 'USD'
    });

    const [components, setComponents] = useState<{ name: string; amount: number; frequency: string; is_mandatory: boolean }[]>([
        { name: 'Tuition Fees', amount: 0, frequency: 'Monthly', is_mandatory: true }
    ]);

    const handleAddComponent = () => {
        setComponents([...components, { name: '', amount: 0, frequency: 'Monthly', is_mandatory: false }]);
    };

    const handleRemoveComponent = (index: number) => {
        if (components.length === 1) return;
        setComponents(components.filter((_, i) => i !== index));
    };

    const updateComponent = (index: number, field: string, value: any) => {
        const newComponents = [...components];
        (newComponents[index] as any)[field] = value;
        setComponents(newComponents);
    };

    const totalYearlyAmount = useMemo(() => {
        return components.reduce((acc, c) => {
            const amount = Number(c.amount) || 0;
            let multiplier = 1;
            if (c.frequency === 'Monthly') multiplier = 12;
            else if (c.frequency === 'Quarterly') multiplier = 4;
            return acc + (amount * multiplier);
        }, 0);
    }, [components]);

    const generateAIDescription = async () => {
        if (!formData.name) return;
        setAiGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Write a professional school fee policy description for a fee structure titled "${formData.name}". Include details about standard academic billing, payment cycles, and institutional standards for Grade ${formData.targetGrade}. Keep it concise but formal.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });
            setFormData(prev => ({ ...prev, description: response.text || '' }));
        } catch (e) {
            console.warn("AI Generation fail", e);
        } finally {
            setAiGenerating(false);
        }
    };

    const handleFinalize = async (publish: boolean = false) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Create Structure Record
            const { data: struct, error: structError } = await supabase
                .from('fee_structures')
                .insert({
                    name: formData.name,
                    academic_year: formData.academicYear,
                    target_grade: formData.targetGrade,
                    description: formData.description,
                    currency: formData.currency,
                    status: publish ? 'Active' : 'Draft',
                    is_active: publish,
                    branch_id: branchId
                })
                .select()
                .single();

            if (structError) throw structError;

            // 2. Batch Create Components
            const componentsPayload = components.map(c => ({
                structure_id: struct.id,
                name: c.name || 'Miscellaneous Fee',
                amount: c.amount || 0,
                frequency: c.frequency,
                is_mandatory: c.is_mandatory
            }));

            const { error: compError } = await supabase.from('fee_components').insert(componentsPayload);
            if (compError) throw compError;

            onSuccess();
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-[#0c0d12] w-full max-w-3xl rounded-[3rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] border border-white/10 flex flex-col overflow-hidden max-h-[95vh] ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
                
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-primary/10 rounded-[1.2rem] text-primary shadow-inner border border-primary/20">
                            <BookIcon className="w-7 h-7"/>
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-black text-white tracking-tight uppercase">Master Architect</h3>
                            <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black">Billing Cycle Configuration • Step {step} of 3</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-all">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-12 bg-transparent">
                    {error && (
                        <div className="mb-8 p-6 bg-red-500/5 border border-red-500/10 rounded-[1.8rem] flex items-start gap-4 animate-in shake">
                             <AlertTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                             <div>
                                 <p className="text-xs font-black uppercase text-red-500 tracking-widest mb-1">Handshake Failure</p>
                                 <p className="text-sm font-medium text-red-200/60 leading-relaxed">{error}</p>
                             </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                            <div>
                                <h4 className="text-3xl font-serif font-black text-white tracking-tight uppercase">Base Protocol</h4>
                                <p className="text-lg text-white/40 mt-2 font-serif italic">Initialize the identity and regional standard for this fee node.</p>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Structure Designation</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. GRADE 10 STANDARDIZED CYCLE" 
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-base font-bold text-white focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none transition-all shadow-inner uppercase tracking-wider"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Monetary Standard</label>
                                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl shadow-inner">
                                            {['INR', 'USD'].map(curr => (
                                                <button 
                                                    key={curr}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, currency: curr as any})}
                                                    className={`py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${formData.currency === curr ? 'bg-primary text-white shadow-2xl' : 'text-white/20 hover:text-white/40'}`}
                                                >
                                                    {curr} {curr === 'INR' ? '(₹)' : '($)'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] ml-2">Academic Target</label>
                                        <select 
                                            className="w-full h-[62px] bg-black/40 border border-white/5 rounded-2xl px-6 text-sm font-black text-white focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none cursor-pointer appearance-none uppercase tracking-widest shadow-inner"
                                            value={formData.targetGrade}
                                            onChange={e => setFormData({...formData, targetGrade: e.target.value})}
                                        >
                                            {Array.from({length: 12}, (_, i) => i + 1).map(g => (
                                                <option key={g} value={String(g)}>GRADE {g} MODULE</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-2">
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Protocol Narrative</label>
                                        <button type="button" onClick={generateAIDescription} disabled={aiGenerating || !formData.name} className="text-[9px] font-black uppercase text-primary hover:text-white transition-colors flex items-center gap-2">
                                            {aiGenerating ? <Spinner size="sm"/> : <SparklesIcon className="w-3.5 h-3.5"/>} AI Synthesis
                                        </button>
                                    </div>
                                    <textarea 
                                        placeholder="Internal logic regarding concessions or scholarship mapping..." 
                                        className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 text-sm font-medium text-white/70 focus:ring-8 focus:ring-primary/5 focus:border-primary/40 outline-none h-32 resize-none shadow-inner leading-relaxed font-serif italic"
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                             <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="text-3xl font-serif font-black text-white tracking-tight uppercase">Ledger Components</h4>
                                    <p className="text-lg text-white/40 mt-2 font-serif italic">Map the specific billable nodes and their chronologies.</p>
                                </div>
                                <button 
                                    onClick={handleAddComponent}
                                    className="px-8 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-3 transform active:scale-95 border border-white/10"
                                >
                                    <PlusIcon className="w-4 h-4"/> Add Node
                                </button>
                            </div>

                            <div className="space-y-5">
                                {components.map((comp, idx) => (
                                    <div key={idx} className="flex items-center gap-6 p-8 bg-white/[0.01] border border-white/5 rounded-[2.5rem] group hover:border-primary/40 transition-all duration-500 shadow-2xl relative">
                                        <div className="flex-grow min-w-0">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. INFRASTRUCTURE DUES" 
                                                className="w-full bg-transparent border-none p-0 text-xl font-serif font-black text-white focus:ring-0 placeholder:text-white/5 uppercase tracking-tight"
                                                value={comp.name}
                                                onChange={e => updateComponent(idx, 'name', e.target.value.toUpperCase())}
                                            />
                                            <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em] mt-3">Identity Tag</p>
                                        </div>
                                        <div className="w-44">
                                            <div className="relative group/input">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-primary">{formData.currency === 'INR' ? '₹' : '$'}</span>
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-lg font-mono font-black text-white text-right focus:border-primary/40 outline-none transition-all shadow-inner"
                                                    value={comp.amount}
                                                    onChange={e => updateComponent(idx, 'amount', e.target.value)}
                                                />
                                            </div>
                                            <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em] mt-3 text-right">Magnitude</p>
                                        </div>
                                        <div className="w-40">
                                            <select 
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 appearance-none cursor-pointer text-center focus:border-primary/40 outline-none shadow-inner"
                                                value={comp.frequency}
                                                onChange={e => updateComponent(idx, 'frequency', e.target.value)}
                                            >
                                                {FREQUENCIES.map(f => <option key={f}>{f.toUpperCase()}</option>)}
                                            </select>
                                            <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em] mt-3 text-center">Frequency</p>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveComponent(idx)}
                                            className="p-3 text-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="p-10 bg-primary/5 border-2 border-dashed border-primary/20 rounded-[3rem] flex justify-between items-center relative overflow-hidden ring-1 ring-primary/10">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] animate-pulse"><TrendingUpIcon className="w-40 h-40" /></div>
                                <div className="relative z-10">
                                    <p className="text-[11px] font-black uppercase text-primary tracking-[0.5em] mb-2">Projected Annual Yield</p>
                                    <p className="text-sm text-white/30 font-medium font-serif italic">Automated summation based on selected node chronologies.</p>
                                </div>
                                <span className="text-5xl font-black text-primary font-mono drop-shadow-[0_0_20px_rgba(var(--primary),0.3)]">{formatCurrency(totalYearlyAmount, formData.currency)}</span>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-12 py-16 animate-in zoom-in-95 duration-700">
                             <div className="relative inline-block">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                                <div className="relative w-32 h-32 bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border border-emerald-500/20 ring-8 ring-emerald-500/5">
                                    <CheckCircleIcon className="w-16 h-16" />
                                </div>
                             </div>
                             <div className="max-w-md mx-auto">
                                <h4 className="text-5xl font-serif font-black text-white tracking-tighter uppercase leading-tight">Seal Protocol.</h4>
                                <p className="text-lg text-white/30 mt-6 font-serif italic leading-relaxed">Identity node <strong>{formData.name}</strong> is ready for synchronization with the master ledger.</p>
                             </div>
                             
                             <div className="max-w-sm mx-auto p-10 bg-black/40 rounded-[3rem] border border-white/5 shadow-inner backdrop-blur-xl">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/30 tracking-[0.4em] mb-6">
                                    <span>Valuation</span>
                                    <span className="text-white font-mono">{formatCurrency(totalYearlyAmount, formData.currency)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/30 tracking-[0.4em] mb-6">
                                    <span>Standard</span>
                                    <span className="text-primary font-mono font-bold tracking-widest">{formData.currency}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/30 tracking-[0.4em]">
                                    <span>Active Nodes</span>
                                    <span className="text-white">{components.length} Items</span>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-10 border-t border-white/5 bg-[#08090a] flex justify-between items-center relative z-20">
                    <button 
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="px-8 py-3 text-[10px] font-black text-white/20 uppercase tracking-[0.5em] hover:text-white transition-all flex items-center gap-3"
                        disabled={loading}
                    >
                        {step === 1 ? 'Abort' : <><ChevronLeftIcon className="w-4 h-4"/> Regression</>}
                    </button>
                    
                    <div className="flex gap-4">
                        {step === 3 && (
                            <button 
                                onClick={() => handleFinalize(true)}
                                disabled={loading}
                                className="px-10 py-5 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.4em] rounded-2xl shadow-2xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-30 ring-4 ring-emerald-500/10"
                            >
                                {loading ? <Spinner size="sm"/> : 'Finalize & Sync'}
                            </button>
                        )}
                        <button 
                            onClick={() => step === 3 ? handleFinalize(false) : setStep(step + 1)}
                            disabled={loading || (step === 1 && !formData.name)}
                            className="px-12 py-5 bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.4em] rounded-2xl shadow-[0_32px_64px_-16px_rgba(var(--primary),0.4)] hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-30 flex items-center gap-4 ring-4 ring-primary/10"
                        >
                            {loading ? <Spinner size="sm" className="text-white"/> : step === 3 ? 'Save Ledger Draft' : <>Next Protocol <ChevronRightIcon className="w-4 h-4"/></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeMasterWizard;
