
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Role, BuiltInRoles, UserProfile } from '../types';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';
import SchoolAdminForm from './profile_forms/SchoolAdminForm';
import ParentForm from './profile_forms/ParentForm';
import StudentForm from './profile_forms/StudentForm';
import TeacherForm from './profile_forms/TeacherForm';
import { UserIcon } from './icons/UserIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

const formatError = (err: any): string => {
    if (!err) return "Synchronization failed.";
    if (typeof err === 'string') return err;
    return err.message || "Institutional system error.";
};

interface ProfileCreationPageProps {
    profile: UserProfile;
    role: Role;
    onComplete: () => void;
    onBack: () => void;
    showBackButton: boolean;
}

export const ProfileCreationPage: React.FC<ProfileCreationPageProps> = ({ profile, role, onComplete, onBack, showBackButton }) => {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'contact'>('details');
    
    const isMounted = useRef(true);
    useEffect(() => { return () => { isMounted.current = false; }; }, []);

    const fetchExistingProfileData = useCallback(async () => {
        if (!isMounted.current) return;
        setIsFetchingInitialData(true);

        let tableName = '';
        switch (role) {
            case BuiltInRoles.SCHOOL_ADMINISTRATION: tableName = 'school_admin_profiles'; break;
            case BuiltInRoles.PARENT_GUARDIAN: tableName = 'parent_profiles'; break;
            case BuiltInRoles.TEACHER: tableName = 'teacher_profiles'; break;
            case BuiltInRoles.STUDENT: tableName = 'student_profiles'; break;
        }

        let fetchedData: any = {};
        if (tableName) {
            const { data } = await supabase.from(tableName).select('*').eq('user_id', profile.id).maybeSingle();
            if (data) fetchedData = data;
        }
        
        if (isMounted.current) {
            setFormData({ 
                ...fetchedData, 
                phone: profile.phone || '', 
                display_name: profile.display_name || '',
                email: profile.email || '',
                country: fetchedData.country || 'India'
            });
            setIsFetchingInitialData(false);
        }
    }, [role, profile.id, profile.display_name, profile.phone, profile.email]);

    useEffect(() => { fetchExistingProfileData(); }, [fetchExistingProfileData]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const isFormValid = useMemo(() => {
        if (!formData.display_name?.trim()) return false;
        if (role === BuiltInRoles.PARENT_GUARDIAN && !formData.relationship_to_student) return false;
        return true;
    }, [formData, role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) {
            setError("Mandatory identity parameters are missing.");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            if (role === BuiltInRoles.TEACHER) {
                const { error: tError } = await supabase.rpc('upsert_teacher_profile', {
                    p_user_id: profile.id,
                    p_display_name: formData.display_name,
                    p_email: profile.email,
                    p_phone: formData.phone,
                    p_department: formData.department,
                    p_designation: formData.designation,
                    p_subject: formData.subject,
                    p_qualification: formData.qualification,
                    p_experience: Number(formData.experience_years) || 0,
                    p_doj: formData.date_of_joining || new Date().toISOString().split('T')[0]
                });
                if (tError) throw tError;
            } else if (role === BuiltInRoles.PARENT_GUARDIAN) {
                const { error: pError } = await supabase.from('parent_profiles').upsert({
                    user_id: profile.id,
                    relationship_to_student: formData.relationship_to_student,
                    gender: formData.gender,
                    number_of_children: Number(formData.number_of_children) || 1,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    pin_code: formData.pin_code
                });
                if (pError) throw pError;
            } else if (role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                 const { error: sError } = await supabase.from('school_admin_profiles').upsert({
                     user_id: profile.id,
                     school_name: formData.school_name,
                     address: formData.address,
                     city: formData.city,
                     state: formData.state,
                     country: formData.country,
                     admin_contact_name: formData.admin_contact_name,
                     admin_contact_phone: formData.admin_contact_phone,
                     onboarding_step: 'completed'
                 });
                 if (sError) throw sError;
            }

            const { error: profileError } = await supabase.from('profiles').update({
                display_name: formData.display_name,
                phone: formData.phone,
                profile_completed: true,
                role: role
            }).eq('id', profile.id);
            
            if (profileError) throw profileError;

            if (isMounted.current) {
                setLoading(false);
                onComplete(); 
            }
        } catch (err: any) {
             if (isMounted.current) {
                 setError(formatError(err));
                 setLoading(false);
             }
        }
    };

    if (isFetchingInitialData) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            <div className="relative bg-[#0d0f14] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl ring-1 ring-white/10">
                <div className="p-10 md:p-14 flex flex-col items-center relative z-10">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#1a1d23] border-4 border-primary/20 flex items-center justify-center text-5xl md:text-7xl font-serif font-black text-white/90 shadow-2xl mb-8">
                        {(formData.display_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tighter text-center">
                        {formData.display_name || 'Identity Node'}
                    </h2>
                    <p className="text-primary text-xs font-black uppercase tracking-[0.3em] mt-4">{role}</p>
                </div>

                <div className="px-10 border-t border-white/5 flex justify-center gap-12 bg-white/[0.01]">
                    <button onClick={() => setActiveTab('details')} className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all ${activeTab === 'details' ? 'text-primary' : 'text-white/30'}`}>
                        Core Registry {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>}
                    </button>
                    <button onClick={() => setActiveTab('contact')} className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all ${activeTab === 'contact' ? 'text-primary' : 'text-white/30'}`}>
                        Contact & Node {activeTab === 'contact' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-[2rem] flex items-center gap-5 animate-in shake">
                    <XIcon className="w-6 h-6 shrink-0" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="bg-[#0a0c10]/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 md:p-16 shadow-2xl">
                    {role === BuiltInRoles.PARENT_GUARDIAN ? (
                        <ParentForm formData={formData} handleChange={handleFormChange} activeTab={activeTab} />
                    ) : role === BuiltInRoles.TEACHER ? (
                        <TeacherForm formData={formData} handleChange={handleFormChange} photoPreviewUrl={null} onPhotoChange={() => {}} currentUserId={profile.id} isRestrictedView={true} />
                    ) : role === BuiltInRoles.SCHOOL_ADMINISTRATION ? (
                        <SchoolAdminForm formData={formData} handleChange={handleFormChange} isInitialCreation={false} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <FloatingPremiumInput label="Legal Name" name="display_name" value={formData.display_name} onChange={handleFormChange} icon={<UserIcon className="w-5 h-5"/>} />
                            <FloatingPremiumInput label="Contact Number" name="phone" value={formData.phone} onChange={handleFormChange} icon={<PhoneIcon className="w-5 h-5"/>} />
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mt-16 px-4">
                    {showBackButton ? (
                        <button type="button" onClick={onBack} className="text-[10px] font-black text-white/30 hover:text-white transition-all uppercase tracking-[0.3em] flex items-center gap-3">
                            <ChevronLeftIcon className="w-4 h-4" /> Exit Setup
                        </button>
                    ) : <div/>}
                    
                    <button type="submit" disabled={loading || !isFormValid} className={`px-14 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center gap-4 ${!isFormValid || loading ? 'bg-white/5 text-white/10 cursor-not-allowed' : 'bg-primary text-white shadow-2xl shadow-primary/20 hover:-translate-y-1 active:scale-95'}`}>
                        {loading ? <Spinner size="sm" className="text-white"/> : <><CheckCircleIcon className="w-6 h-6"/> Complete Onboarding</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

const FloatingPremiumInput = ({ label, icon, ...props }: any) => (
    <div className="relative group w-full">
        <div className="absolute top-1/2 -translate-y-1/2 left-5 text-white/20 group-focus-within:text-primary transition-colors duration-300 z-10 pointer-events-none">{icon}</div>
        <input {...props} placeholder=" " className="peer block w-full h-[68px] rounded-2xl border border-white/10 bg-black/40 px-6 pl-14 text-sm text-white font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none" />
        <label className="absolute left-14 top-0 -translate-y-1/2 bg-[#0d0f14] px-2 text-[10px] font-black uppercase text-white/40 tracking-[0.2em] peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-black peer-focus:uppercase peer-focus:text-primary transition-all duration-300 pointer-events-none">
            {label}
        </label>
    </div>
);
