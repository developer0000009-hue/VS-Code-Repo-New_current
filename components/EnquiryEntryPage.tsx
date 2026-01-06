import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, formatError } from '../services/supabase';
import { Enquiry } from '../types';
import Spinner from './common/Spinner';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

interface EnquiryEntryPageProps {
    branchId?: string | null;
    onNavigate?: (component: string) => void;
}

const EnquiryEntryPage: React.FC<EnquiryEntryPageProps> = ({ branchId, onNavigate }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
    const [loadingBranch, setLoadingBranch] = useState(true);

    const [formData, setFormData] = useState({
        applicant_name: '',
        grade: '',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        notes: ''
    });

    // Fetch current branch ID on mount
    useEffect(() => {
        const fetchCurrentBranch = async () => {
            try {
                // If branchId is provided as prop, use it
                if (branchId) {
                    setCurrentBranchId(branchId);
                    setLoadingBranch(false);
                    return;
                }

                // Otherwise, get the user's default branch
                const { data, error } = await supabase.rpc('get_my_branch_ids');
                if (error) throw error;

                if (data && data.length > 0) {
                    setCurrentBranchId(data[0].toString());
                }
            } catch (err) {
                console.error('Failed to fetch branch:', err);
                setError('Unable to determine branch context. Please refresh and try again.');
            } finally {
                setLoadingBranch(false);
            }
        };

        fetchCurrentBranch();
    }, [branchId]);

    const validateForm = () => {
        if (!formData.applicant_name.trim()) return 'Applicant name is required';
        if (!formData.grade.trim()) return 'Grade is required';
        if (!formData.parent_name.trim()) return 'Parent name is required';
        if (!formData.parent_email.trim()) return 'Parent email is required';
        if (!formData.parent_phone.trim()) return 'Parent phone is required';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Create enquiry record with proper branch assignment
            const enquiryData = {
                applicant_name: formData.applicant_name.trim(),
                grade: formData.grade.trim(),
                parent_name: formData.parent_name.trim(),
                parent_email: formData.parent_email.trim().toLowerCase(),
                parent_phone: formData.parent_phone.trim(),
                notes: formData.notes.trim() || null,
                branch_id: currentBranchId ? parseInt(currentBranchId) : null,
                status: 'New'
            };

            const { data, error: insertError } = await supabase
                .from('enquiries')
                .insert(enquiryData)
                .select()
                .single();

            if (insertError) throw insertError;

            setSuccess('Enquiry created successfully!');

            // Reset form
            setFormData({
                applicant_name: '',
                grade: '',
                parent_name: '',
                parent_email: '',
                parent_phone: '',
                notes: ''
            });

            // Navigate back to enquiries list after short delay
            setTimeout(() => {
                if (onNavigate) {
                    onNavigate('Enquiries');
                } else {
                    navigate(-1);
                }
            }, 2000);

        } catch (err: any) {
            console.error('Enquiry creation failed:', err);
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError(null); // Clear error on input change
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-32">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-10">
                    <div className="relative group shrink-0">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <div className="w-20 h-20 bg-indigo-600 rounded-[2.2rem] text-white flex items-center justify-center shadow-2xl border border-white/10 relative z-10 transform group-hover:rotate-6 transition-transform duration-700">
                            <SparklesIcon className="w-10 h-10" />
                        </div>
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-6 mb-3">
                            <h2 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tighter uppercase leading-none drop-shadow-2xl">Enquiry Entry</h2>
                        </div>
                        <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            Create New Enquiry • Manual Registration
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-between shadow-xl animate-in shake">
                    <div className="flex items-center gap-4">
                        <AlertTriangleIcon className="w-8 h-8 text-red-500 shrink-0" />
                        <div>
                            <p className="text-xs font-black uppercase text-red-500 tracking-widest">Entry Failed</p>
                            <p className="text-sm font-bold text-red-200/70 mt-1">{error}</p>
                        </div>
                    </div>
                    <button onClick={() => setError(null)} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">Dismiss</button>
                </div>
            )}

            {/* Success Display */}
            {success && (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-between shadow-xl animate-in fade-in">
                    <div className="flex items-center gap-4">
                        <CheckCircleIcon className="w-8 h-8 text-emerald-500 shrink-0" />
                        <div>
                            <p className="text-xs font-black uppercase text-emerald-500 tracking-widest">Entry Successful</p>
                            <p className="text-sm font-bold text-emerald-200/70 mt-1">{success}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Entry Form */}
            <div className="bg-[#0d0f14]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] overflow-hidden">
                <div className="p-12 md:p-20 space-y-12">
                    <div className="text-center space-y-4">
                        <h3 className="text-2xl font-serif font-black text-white uppercase tracking-tight">New Enquiry Registration</h3>
                        <p className="text-white/40 text-lg leading-relaxed font-serif italic">
                            Register a new student enquiry for admission processing
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
                        {/* Student Information */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-black uppercase text-white/60 tracking-[0.3em] border-b border-white/10 pb-2">
                                Student Information
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.applicant_name}
                                        onChange={(e) => handleInputChange('applicant_name', e.target.value)}
                                        placeholder="Enter student full name"
                                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:bg-black/60 focus:border-primary/50 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">
                                        Grade Level *
                                    </label>
                                    <select
                                        value={formData.grade}
                                        onChange={(e) => handleInputChange('grade', e.target.value)}
                                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:bg-black/60 focus:border-primary/50 outline-none transition-all"
                                        required
                                    >
                                        <option value="">Select Grade</option>
                                        {Array.from({length: 12}, (_, i) => i + 1).map(grade => (
                                            <option key={grade} value={grade.toString()}>{grade}</option>
                                        ))}
                                        <option value="13">Grade 13</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Parent Information */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-black uppercase text-white/60 tracking-[0.3em] border-b border-white/10 pb-2">
                                Parent/Guardian Information
                            </h4>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.parent_name}
                                        onChange={(e) => handleInputChange('parent_name', e.target.value)}
                                        placeholder="Enter parent/guardian full name"
                                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:bg-black/60 focus:border-primary/50 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.parent_email}
                                            onChange={(e) => handleInputChange('parent_email', e.target.value)}
                                            placeholder="parent@example.com"
                                            className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:bg-black/60 focus:border-primary/50 outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.parent_phone}
                                            onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                                            placeholder="+91 XXXXX XXXXX"
                                            className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:bg-black/60 focus:border-primary/50 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-black uppercase text-white/60 tracking-[0.3em] border-b border-white/10 pb-2">
                                Additional Information
                            </h4>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Any additional information about the enquiry..."
                                    rows={4}
                                    className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder:text-white/20 focus:bg-black/60 focus:border-primary/50 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center pt-8">
                            <button
                                type="submit"
                                disabled={loading || loadingBranch}
                                className="px-12 py-6 bg-primary text-white font-black text-sm uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-4 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Spinner size="sm" className="text-white" />
                                        Creating Enquiry...
                                    </>
                                ) : loadingBranch ? (
                                    <>
                                        <Spinner size="sm" className="text-white" />
                                        Loading Branch...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        Create Enquiry
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EnquiryEntryPage;
