import React, { useState, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { SchoolBranch, UserProfile, SchoolAdminProfileData } from '../types';
import Spinner from './common/Spinner';
import { SchoolIcon } from './icons/SchoolIcon';
import { PlusIcon } from './icons/PlusIcon';
import { EditIcon } from './icons/EditIcon';
import { XIcon } from './icons/XIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { MailIcon } from './icons/MailIcon';
import ConfirmationModal from './common/ConfirmationModal';
import { countries, statesByCountry, citiesByState } from './data/locations';
import { LocationIcon } from './icons/LocationIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SearchIcon } from './icons/SearchIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

interface BranchManagementTabProps {
    isHeadOfficeAdmin: boolean;
    branches: SchoolBranch[];
    isLoading: boolean;
    error?: string | null;
    onBranchUpdate: (updatedBranch: SchoolBranch, isDelete?: boolean) => void;
    onSelectBranch?: (branchId: number) => void;
    schoolProfile?: SchoolAdminProfileData | null;
}

const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred";
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string') return message;
    return "An unexpected system error occurred.";
};

// --- Reusable Premium Form Components ---
const FloatingLabelInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon?: React.ReactNode }> = ({ label, icon, ...props }) => (
    <div className="relative group">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors z-10">{icon}</div>
        <input {...props} placeholder=" " className="peer block w-full rounded-xl border border-input/50 bg-background/50 px-4 py-4 pl-12 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none" />
        <label className="absolute left-11 top-0 -translate-y-1/2 bg-card/95 px-1.5 text-[10px] font-bold uppercase text-muted-foreground/80 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:text-primary">{label}</label>
    </div>
);

const StyledSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, icon?: React.ReactNode }> = ({ label, icon, children, ...props }) => (
    <div className="relative group">
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors z-10">{icon}</div>
        <select {...props} className="peer block w-full appearance-none rounded-xl border border-input/50 bg-background/50 px-4 py-4 pl-12 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer">
            {children}
        </select>
        <label className="absolute left-11 top-0 -translate-y-1/2 bg-card/95 px-1.5 text-[10px] font-bold uppercase text-primary">{label}</label>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg></div>
    </div>
);

// --- New Branch Card Component ---
const BranchCard: React.FC<{ branch: SchoolBranch, onEdit?: () => void, onDelete?: () => void }> = ({ branch, onEdit, onDelete }) => (
    <div className="group relative bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg shadow-black/10 hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
        <div className="p-5 flex flex-col flex-grow relative">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl shadow-inner ${branch.is_main_branch ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}><SchoolIcon className="w-6 h-6"/></div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {onEdit && <button onClick={onEdit} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary"><EditIcon className="w-4 h-4" /></button>}
                    {!branch.is_main_branch && onDelete && <button onClick={onDelete} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"><XIcon className="w-4 h-4" /></button>}
                </div>
            </div>
            <h3 className="text-lg font-bold text-foreground truncate">{branch.name}</h3>
            <p className="text-xs text-muted-foreground font-medium">{[branch.address, branch.city, branch.state, branch.country].filter(Boolean).join(', ')}</p>
            {branch.is_main_branch && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full self-start mt-2 border border-primary/20">HEAD OFFICE</span>}
            <div className="mt-auto pt-4 border-t border-white/5">
                {branch.admin_name ? (
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">ADMINISTRATOR</p>
                        <p className="text-sm font-semibold text-foreground truncate">{branch.admin_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{branch.admin_email}</p>
                    </div>
                ) : (
                    <p className="text-xs text-amber-600 font-semibold bg-amber-500/10 p-2 rounded-md border border-amber-500/20">Admin Pending</p>
                )}
            </div>
        </div>
    </div>
);


export const BranchManagementTab: React.FC<BranchManagementTabProps> = ({ isHeadOfficeAdmin, branches, isLoading, error, onBranchUpdate, schoolProfile }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<SchoolBranch | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [deletingBranch, setDeletingBranch] = useState<SchoolBranch | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'head' | 'satellite'>('all');

    const [formData, setFormData] = useState({
        name: '', address: '', country: 'India', city: '', state: '', email: '',
        adminName: '', adminPhone: '', adminEmail: '', isMain: false
    });
    
    const safeBranches = useMemo(() => Array.isArray(branches) ? branches : [], [branches]);

    const filteredBranches = useMemo(() => {
        return safeBranches.filter(branch => {
            const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || (branch.city || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterType === 'all' ? true : filterType === 'head' ? branch.is_main_branch : !branch.is_main_branch;
            return matchesSearch && matchesFilter;
        });
    }, [safeBranches, searchTerm, filterType]);

    const handleOpenCreate = () => {
        setEditingBranch(null);
        setFormData({
            name: '', address: '', country: schoolProfile?.country || 'India', city: '', state: '', email: '',
            adminName: '', adminPhone: '', adminEmail: '', isMain: safeBranches.length === 0
        });
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (branch: SchoolBranch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            address: branch.address,
            country: branch.country || schoolProfile?.country || 'India',
            state: branch.state || '',
            city: branch.city || '',
            email: branch.email || '',
            adminName: branch.admin_name || '',
            adminPhone: branch.admin_phone || '',
            adminEmail: branch.admin_email || '',
            isMain: branch.is_main_branch
        });
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setModalError(null);
        try {
            const payload = {
                p_name: formData.name, p_address: formData.address, p_city: formData.city, p_state: formData.state,
                p_country: formData.country,
                p_contact_number: " ", p_is_main: formData.isMain, p_email: formData.email,
                p_admin_name: formData.adminName, p_admin_phone: formData.adminPhone, p_admin_email: formData.adminEmail
            };

            if (editingBranch) {
                const { data, error } = await supabase.rpc('update_school_branch', { ...payload, p_branch_id: editingBranch.id });
                if (error) throw error;
                onBranchUpdate(data[0]);
            } else {
                const { data, error } = await supabase.rpc('create_school_branch', payload);
                if (error) throw error;
                onBranchUpdate(data[0]);
            }
            setIsModalOpen(false);
        } catch (err: any) {
            setModalError(formatError(err));
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!deletingBranch) return;
        setIsDeleting(true);
        const { error } = await supabase.rpc('delete_school_branch', { p_branch_id: deletingBranch.id });
        if (error) {
            alert(`Failed to delete: ${formatError(error)}`);
        } else {
            onBranchUpdate(deletingBranch, true);
        }
        setIsDeleting(false);
        setDeletingBranch(null);
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, country: e.target.value, state: '', city: '' });
    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, state: e.target.value, city: '' });
    const availableStates = useMemo(() => formData.country ? statesByCountry[formData.country] || [] : [], [formData.country]);
    const availableCities = useMemo(() => formData.state ? citiesByState[formData.state] || [] : [], [formData.state]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">{isHeadOfficeAdmin ? 'Branches & Admins' : 'My Branch'}</h2>
                    <p className="text-muted-foreground mt-1">{isHeadOfficeAdmin ? 'Manage all your school locations and their primary administrators.' : 'Details of your assigned branch.'}</p>
                </div>
            </div>
            
             {isHeadOfficeAdmin && (
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/60 p-4 rounded-xl border border-border/50 shadow-sm">
                    <div className="relative w-full sm:w-72 group">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input type="text" placeholder="Search branch or city..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full h-11 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="w-full sm:w-auto h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm cursor-pointer">
                            <option value="all">All Locations</option>
                            <option value="head">Head Office</option>
                            <option value="satellite">Satellite</option>
                        </select>
                        <button onClick={handleOpenCreate} disabled={isLoading} className="h-11 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                            <PlusIcon className="w-4 h-4" /> New Branch
                        </button>
                    </div>
                </div>
            )}

            {isLoading && safeBranches.length === 0 ? (
                <div className="flex justify-center p-16"><Spinner size="lg" /></div>
            ) : error ? (
                <div className="p-4 bg-destructive/10 text-destructive rounded-xl">{error}</div>
            ) : filteredBranches.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/20 border-2 border-dashed border-border rounded-xl">
                    <p>No branches found. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBranches.map(branch => (
                        <BranchCard 
                            key={branch.id} 
                            branch={branch}
                            onEdit={() => handleOpenEdit(branch)}
                            onDelete={isHeadOfficeAdmin ? () => setDeletingBranch(branch) : undefined}
                        />
                    ))}
                </div>
            )}
            
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-card w-full max-w-2xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-border/40 bg-muted/20 flex justify-between items-center"><h3 className="text-2xl font-extrabold text-foreground">{editingBranch ? 'Edit Branch' : (safeBranches.length === 0 ? 'Create Head Office' : 'Add New Branch')}</h3><button onClick={() => setIsModalOpen(false)}><XIcon className="w-6 h-6"/></button></div>
                        <form onSubmit={handleSave} className="flex flex-col flex-grow overflow-hidden">
                            <div className="flex-grow overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {modalError && <div className="bg-destructive/10 text-destructive p-3 rounded-xl text-sm">{modalError}</div>}
                                <div className="space-y-6">
                                     <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Campus Details</h4>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2"><FloatingLabelInput label="Branch Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required icon={<SchoolIcon className="w-4 h-4"/>} /></div>
                                        <div className="md:col-span-2"><FloatingLabelInput label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required icon={<LocationIcon className="w-4 h-4"/>} /></div>
                                        <StyledSelect label="Country" required value={formData.country} onChange={handleCountryChange} icon={<GlobeIcon className="w-4 h-4"/>}>{countries.map(c => <option key={c} value={c}>{c}</option>)}</StyledSelect>
                                        <StyledSelect label="State" required value={formData.state} onChange={handleStateChange} disabled={!formData.country} icon={<LocationIcon className="w-4 h-4"/>}><option value="">Select State</option>{availableStates.map(s => <option key={s} value={s}>{s}</option>)}</StyledSelect>
                                        {availableCities.length > 0 ? <StyledSelect label="City" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} disabled={!formData.state} icon={<LocationIcon className="w-4 h-4"/>}><option value="">Select City</option>{availableCities.map(c => <option key={c} value={c}>{c}</option>)}</StyledSelect> : <FloatingLabelInput label="City" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} disabled={!formData.state} icon={<LocationIcon className="w-4 h-4"/>} />}
                                     </div>
                                </div>
                                <div className="space-y-6 pt-4 border-t border-border">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Branch IT Administrator</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FloatingLabelInput label="Admin Name" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} icon={<UsersIcon className="w-4 h-4"/>} />
                                        <FloatingLabelInput label="Admin Phone" type="tel" value={formData.adminPhone} onChange={e => setFormData({...formData, adminPhone: e.target.value})} icon={<PhoneIcon className="w-4 h-4"/>} />
                                        <div className="md:col-span-2"><FloatingLabelInput label="Login Email" type="email" required value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} icon={<MailIcon className="w-4 h-4"/>} /></div>
                                    </div>
                                </div>
                                {isHeadOfficeAdmin && <div className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer" onClick={() => setFormData({...formData, isMain: !formData.isMain})}><div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${formData.isMain ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/50'}`}>{formData.isMain && <CheckCircleIcon className="w-4 h-4 text-white"/>}</div><label className="text-sm font-medium">Set as Head Office</label></div>}
                            </div>
                            <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-4 flex-shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 flex items-center min-w-[140px] justify-center">
                                    {isSaving ? <Spinner size="sm" /> : (editingBranch ? 'Update' : 'Add Branch')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <ConfirmationModal isOpen={!!deletingBranch} onClose={() => setDeletingBranch(null)} onConfirm={handleDelete} title="Delete Branch" message={`Are you sure you want to delete the "${deletingBranch?.name}" branch? This action cannot be undone.`} confirmText="Yes, Delete" loading={isDeleting} />
        </div>
    );
};