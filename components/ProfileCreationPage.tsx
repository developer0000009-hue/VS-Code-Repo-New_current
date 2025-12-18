
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Role,
    ProfileData,
    SchoolAdminProfileData,
    ParentProfileData,
    StudentProfileData,
    TeacherProfileData,
    TransportProfileData,
    EcommerceProfileData,
    BuiltInRoles,
    UserProfile,
    AdmissionApplication
} from '../types';
import { supabase } from '../services/supabase';
import Spinner from './common/Spinner';

// Import all the new role-specific forms
import SchoolAdminForm from './profile_forms/SchoolAdminForm';
import ParentForm from './profile_forms/ParentForm';
import StudentForm from './profile_forms/StudentForm';
import TeacherForm from './profile_forms/TeacherForm';
import TransportForm from './profile_forms/TransportForm';
import EcommerceForm from './profile_forms/EcommerceForm';
import SecondaryParentForm from './profile_forms/SecondaryParentForm';
import ParentProfileCard from './parent_tabs/ParentProfileCard';
import SecondaryParentCard from './parent_tabs/SecondaryParentCard';
import TeacherProfileView from './teacher/TeacherProfileView';
import { countryCodes } from './data/countryCodes';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';


const UserIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
    </svg>
);

const InfoRow: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-foreground">{String(value)}</p>
        </div>
    );
};

const GenericProfileCard: React.FC<{
    profile: UserProfile;
    data: Partial<ProfileData>;
    onEdit: () => void;
}> = ({ profile, data, onEdit }) => {
    const renderDataFields = () => {
        const filteredData = Object.entries(data).filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at', 'phone'].includes(key));
        if (filteredData.length === 0) {
            return <p className="text-sm text-muted-foreground">No additional profile details available.</p>;
        }
        return filteredData.map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return <InfoRow key={key} label={label} value={value as string | number | null} />;
        });
    };

    return (
        <div className="bg-card-alt rounded-lg shadow-md overflow-hidden border border-border transition-shadow hover:shadow-lg h-full flex flex-col max-w-sm mx-auto">
            <div className="h-40 bg-muted flex items-center justify-center">
                <div className="h-24 w-24 p-4">
                    <UserIcon />
                </div>
            </div>
            <div className="p-4 flex-grow">
                <h3 className="text-lg font-bold text-foreground">{profile.display_name}</h3>
                <p className="text-sm text-muted-foreground">{profile.role}</p>
                <div className="mt-4 pt-4 border-t border-border space-y-3 text-sm">
                    {renderDataFields()}
                </div>
            </div>
            <div className="p-4 mt-auto border-t border-border">
                <button 
                    onClick={onEdit}
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground text-sm font-bold py-2 px-3 rounded-md transition-colors"
                >
                    Edit Profile
                </button>
            </div>
        </div>
    );
};

// Robust error formatter
const formatError = (err: any): string => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === 'string') {
        if (err.includes("[object Object]")) return "An unexpected error occurred. Please try again.";
        return err;
    }
    
    const message = err.message || err.error_description || err.details || err.hint;
    if (message && typeof message === 'string' && !message.includes("[object Object]")) {
        return message;
    }
    
    try {
        const json = JSON.stringify(err);
        if (json && json !== '{}' && json !== '[]') return json;
    } catch {
        // Ignore JSON errors
    }
    
    return "An unexpected system error occurred.";
};

// Helper to parse full phone number into country code and local number
const parsePhoneNumber = (fullPhoneNumber: string | null | undefined): { countryCode: string; localNumber: string } => {
    if (!fullPhoneNumber) {
        return { countryCode: '+91', localNumber: '' }; // Default to India
    }

    const sortedCountryCodes = [...countryCodes].sort((a, b) => b.dial_code.length - a.dial_code.length);

    for (const country of sortedCountryCodes) {
        if (fullPhoneNumber.startsWith(country.dial_code)) {
            return {
                countryCode: country.dial_code,
                localNumber: fullPhoneNumber.substring(country.dial_code.length),
            };
        }
    }
    
    return { countryCode: '+91', localNumber: fullPhoneNumber.replace(/\+/g, '') };
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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);
    const [editingSecondaryParent, setEditingSecondaryParent] = useState(false);
    
    // Lifted state for School Admin Tab persistence
    const [schoolAdminTab, setSchoolAdminTab] = useState<'details' | 'contact' | 'academic'>('details');
    
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(
        (role === BuiltInRoles.TEACHER && (profile as any).profile_picture_url)
            ? (profile as any).profile_picture_url 
            : null
    );

    const [myChildren, setMyChildren] = useState<AdmissionApplication[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(false);
    const [selectedChild, setSelectedChild] = useState<AdmissionApplication | null>(null);

    const formRef = useRef<HTMLFormElement>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    const isInitialCreation = !profile.profile_completed;
    const [mode, setMode] = useState<'view' | 'edit'>(isInitialCreation ? 'edit' : 'view');


    const fetchExistingProfileData = useCallback(async () => {
        if (!isMounted.current) return;
        
        const hasData = Object.keys(formData).length > 2; // Arbitrary check for populated data
        if (!hasData) setIsFetchingInitialData(true);

        let tableName = '';
        switch (role) {
            case BuiltInRoles.SCHOOL_ADMINISTRATION: tableName = 'school_admin_profiles'; break;
            case BuiltInRoles.PARENT_GUARDIAN: tableName = 'parent_profiles'; break;
            case BuiltInRoles.STUDENT: tableName = 'student_profiles'; break;
            case BuiltInRoles.TEACHER: tableName = 'teacher_profiles'; break;
            case BuiltInRoles.TRANSPORT_STAFF: tableName = 'transport_staff_profiles'; break;
            case BuiltInRoles.ECOMMERCE_OPERATOR: tableName = 'ecommerce_operator_profiles'; break;
        }

        let fetchedData: Partial<SchoolAdminProfileData> = {};
        let dataFoundInDB = false;
        if (tableName) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('user_id', profile.id)
                .single();
            
            if (data && !error && isMounted.current) {
                fetchedData = data;
                dataFoundInDB = true;
                if (role === BuiltInRoles.TEACHER && (data as TeacherProfileData).profile_picture_url) {
                    setProfilePhotoUrl((data as TeacherProfileData).profile_picture_url!);
                }
            }
        }
        
        if (!isMounted.current) return;

        const initialFormData: any = { 
            ...fetchedData, 
            phone: profile.phone || '', 
            display_name: profile.display_name || '' 
        };

        if (isInitialCreation && !dataFoundInDB && role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
            const { countryCode, localNumber } = parsePhoneNumber(profile.phone);
            initialFormData.admin_contact_name = profile.display_name;
            initialFormData.admin_contact_email = profile.email;
            initialFormData.admin_contact_phone_country_code = countryCode;
            initialFormData.admin_contact_phone_local = localNumber;
            initialFormData.admin_designation = 'Director';
        }
        
        setFormData(initialFormData);
        setIsFetchingInitialData(false);
    }, [role, profile.id]);

    const fetchChildrenList = useCallback(async () => {
        if (!profile.id) return;
        setLoadingChildren(true);
        const { data, error } = await supabase
            .from('admissions')
            .select('*')
            .eq('submitted_by', profile.id)
            .not('student_user_id', 'is', null);

        if (isMounted.current) {
            if (!error && data) {
                setMyChildren(data);
            } else if (error) {
                console.error('Error fetching enrolled children:', error);
            }
            setLoadingChildren(false);
        }
    }, [profile.id]);

    useEffect(() => {
        fetchExistingProfileData();

        if (role === BuiltInRoles.STUDENT && isInitialCreation) {
            fetchChildrenList();
        }
    }, [fetchExistingProfileData, role, isInitialCreation, profile.id, fetchChildrenList]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevFormData: any) => ({
            ...prevFormData,
            [name]: value
        }));
    };
    
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePhotoFile(e.target.files[0]);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isMounted.current) setProfilePhotoUrl(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        // --- Special Student Handling (Link to Parent's Admission) ---
        if (role === BuiltInRoles.STUDENT && isInitialCreation && selectedChild) {
            try {
                const { error: upsertError } = await supabase.from('student_profiles').upsert({
                    user_id: profile.id,
                    admission_id: selectedChild.id,
                    grade: selectedChild.grade,
                    branch_id: selectedChild.branch_id || null, 
                    parent_guardian_details: `(Parent view) Linked to ${profile.display_name}`
                }, { onConflict: 'user_id' });
                if (upsertError) throw upsertError;

                const { error: updateError } = await supabase.from('profiles').update({ role: 'Student', profile_completed: true, is_active: true }).eq('id', profile.id);
                if (updateError) throw updateError;
                
                if (isMounted.current) onComplete(); 
            } catch (err: any) {
                if (isMounted.current) setError(`Failed to set up student view: ${formatError(err)}`);
            } finally {
                if (isMounted.current) setLoading(false);
            }
            return;
        }

        // --- Teacher Photo Upload ---
        let finalPhotoUrl = (formData as TeacherProfileData).profile_picture_url || null;
        try {
            if (role === BuiltInRoles.TEACHER && profilePhotoFile) {
                if ((formData as TeacherProfileData).profile_picture_url) {
                    try {
                        const oldFilePath = new URL((formData as TeacherProfileData).profile_picture_url!).pathname.split('/teacher-avatars/').pop();
                        if (oldFilePath) await supabase.storage.from('teacher-avatars').remove([oldFilePath]);
                    } catch (e) { /* Ignore */ }
                }
                const fileExt = profilePhotoFile.name.split('.').pop();
                const filePath = `${profile.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('teacher-avatars').upload(filePath, profilePhotoFile);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('teacher-avatars').getPublicUrl(filePath);
                finalPhotoUrl = urlData.publicUrl;
            }

            // --- Construct Profile Data ---
            let formattedPhone = formData.phone;
            
            // Safe phone handling for School Admin
            if (role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                const cc = formData.admin_contact_phone_country_code || '+91';
                const local = formData.admin_contact_phone_local || '';
                formattedPhone = `${cc}${local}`;
            }

            const baseProfileUpdates = {
                display_name: formData.display_name,
                phone: formattedPhone,
                // Only mark complete for non-admin roles (Admin has more steps in OnboardingFlow)
                profile_completed: role !== BuiltInRoles.SCHOOL_ADMINISTRATION,
                is_active: true,
                // Ensure email is present to satisfy constraints on insert if needed
                email: profile.email
            };

            // 1. Upsert Base Profile to ensure existence (CRITICAL FIX for FK Violation)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: profile.id,
                    ...baseProfileUpdates
                }, { onConflict: 'id' });
            
            if (profileError) throw profileError;

            // 2. Update Role-Specific Tables Direct (Robustness Fix)
            let roleError = null;

            if (role === BuiltInRoles.SCHOOL_ADMINISTRATION) {
                const adminUpdates: any = {
                    user_id: profile.id,
                    school_name: formData.school_name,
                    address: formData.address,
                    country: formData.country,
                    state: formData.state,
                    city: formData.city,
                    admin_contact_name: formData.admin_contact_name,
                    admin_contact_email: formData.admin_contact_email,
                    admin_contact_phone: baseProfileUpdates.phone,
                    admin_designation: formData.admin_designation,
                    academic_board: formData.academic_board,
                    affiliation_number: formData.affiliation_number,
                    school_type: formData.school_type,
                    academic_year_start: formData.academic_year_start,
                    academic_year_end: formData.academic_year_end,
                    grade_range_start: formData.grade_range_start,
                    grade_range_end: formData.grade_range_end
                };
                
                // CRITICAL FIX: Ensure onboarding_step advances to 'pricing' if this is initial setup
                if (isInitialCreation) {
                    adminUpdates.onboarding_step = 'pricing';
                }

                const { error } = await supabase.from('school_admin_profiles').upsert(adminUpdates, { onConflict: 'user_id' });
                roleError = error;
            } 
            else if (role === BuiltInRoles.PARENT_GUARDIAN) {
                const { error } = await supabase.from('parent_profiles').upsert({
                    user_id: profile.id,
                    relationship_to_student: formData.relationship_to_student,
                    gender: formData.gender,
                    number_of_children: formData.number_of_children ? parseInt(formData.number_of_children) : null,
                    address: formData.address,
                    country: formData.country,
                    state: formData.state,
                    city: formData.city,
                    pin_code: formData.pin_code
                }, { onConflict: 'user_id' });
                roleError = error;
            }
            else if (role === BuiltInRoles.TEACHER) {
                 const { error } = await supabase.from('teacher_profiles').upsert({
                    user_id: profile.id,
                    subject: formData.subject,
                    qualification: formData.qualification,
                    experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
                    date_of_joining: formData.date_of_joining || null,
                    bio: formData.bio,
                    specializations: formData.specializations,
                    profile_picture_url: finalPhotoUrl || formData.profile_picture_url,
                    gender: formData.gender,
                    date_of_birth: formData.date_of_birth || null,
                    department: formData.department,
                    designation: formData.designation,
                    employee_id: formData.employee_id,
                    employment_type: formData.employment_type
                }, { onConflict: 'user_id' });
                roleError = error;
            }
            else if (role === BuiltInRoles.TRANSPORT_STAFF) {
                const { error } = await supabase.from('transport_staff_profiles').upsert({
                    user_id: profile.id,
                    route_id: formData.route_id ? parseInt(formData.route_id) : null,
                    vehicle_details: formData.vehicle_details,
                    license_info: formData.license_info
                }, { onConflict: 'user_id' });
                roleError = error;
            }
            else if (role === BuiltInRoles.ECOMMERCE_OPERATOR) {
                const { error } = await supabase.from('ecommerce_operator_profiles').upsert({
                    user_id: profile.id,
                    store_name: formData.store_name,
                    business_type: formData.business_type
                }, { onConflict: 'user_id' });
                roleError = error;
            }
            else if (role === BuiltInRoles.STUDENT) {
                // If manual student profile (not linked via admission code)
                const { error } = await supabase.from('student_profiles').upsert({
                    user_id: profile.id,
                    grade: formData.grade,
                    date_of_birth: formData.date_of_birth || null,
                    gender: formData.gender,
                    parent_guardian_details: formData.parent_guardian_details
                }, { onConflict: 'user_id' });
                roleError = error;
            }

            if (roleError) throw roleError;

            // Success Handlers
            if (isMounted.current) {
                setLoading(false);
                if (isInitialCreation) {
                    onComplete(); 
                } else {
                    await fetchExistingProfileData();
                    setMode('view');
                    setSuccessMessage("Profile updated successfully.");
                    setTimeout(() => setSuccessMessage(null), 4000);
                }
            }

        } catch (err: any) {
             if (isMounted.current) {
                 setError(formatError(err));
                 setLoading(false);
             }
        }
    };

    const handleSelectChild = async (child: AdmissionApplication) => {
        setSelectedChild(child);
        setFormData({
            applicant_name: child.applicant_name,
            grade: child.grade,
            date_of_birth: child.date_of_birth || '',
            gender: child.gender || '',
            parent_guardian_details: `(Parent Profile) Linked to ${profile.display_name}`
        });
    };

    const handleSecondaryParentSave = async (secondaryData: any) => {
        setLoading(true);
        setError(null);
        try {
            const { error: rpcError } = await supabase.rpc('update_secondary_parent_details', {
                p_name: secondaryData.name,
                p_relationship: secondaryData.relationship,
                p_gender: secondaryData.gender,
                p_email: secondaryData.email,
                p_phone: secondaryData.phone,
                p_user_id: profile.id // link to current user
            });

            if (rpcError) throw rpcError;

            await fetchExistingProfileData();
            setEditingSecondaryParent(false);
        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-background text-foreground animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    {showBackButton && (
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">{isInitialCreation ? 'Complete Your Profile' : 'My Profile'}</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {isInitialCreation ? `Please provide details for your ${role} account.` : 'Manage your personal information.'}
                        </p>
                    </div>
                </div>
                {/* Edit/View Toggle if not initial creation */}
                {!isInitialCreation && role !== BuiltInRoles.TEACHER && role !== BuiltInRoles.PARENT_GUARDIAN && (
                   <button onClick={() => setMode(mode === 'view' ? 'edit' : 'view')} className="text-sm font-bold text-primary hover:underline">
                       {mode === 'view' ? 'Edit Profile' : 'Cancel Editing'}
                   </button>
                )}
            </div>

            {/* Error/Success Messages */}
            {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6 text-sm font-medium">{error}</div>}
            {successMessage && <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-lg mb-6 text-sm font-medium flex items-center gap-2"><CheckCircleIcon className="w-4 h-4"/> {successMessage}</div>}

            {/* Main Content */}
            {isFetchingInitialData ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : (
                <>
                    {/* Role Specific Views/Forms */}
                    {role === BuiltInRoles.SCHOOL_ADMINISTRATION && (
                         <form onSubmit={handleSubmit}>
                             <SchoolAdminForm 
                                formData={formData} 
                                handleChange={handleChange} 
                                isInitialCreation={isInitialCreation}
                                activeTab={schoolAdminTab}
                                onTabChange={setSchoolAdminTab}
                             />
                             <div className="mt-8 flex justify-end">
                                 <button type="submit" disabled={loading} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50">
                                     {loading ? <Spinner size="sm" className="text-white"/> : 'Save & Continue'}
                                 </button>
                             </div>
                         </form>
                    )}

                    {role === BuiltInRoles.PARENT_GUARDIAN && (
                        <div className="space-y-8">
                            {mode === 'view' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ParentProfileCard profile={profile} data={formData} onEdit={() => setMode('edit')} />
                                    <SecondaryParentCard 
                                        data={formData} // formData contains secondary parent fields
                                        onAdd={() => setEditingSecondaryParent(true)} 
                                        onEdit={() => setEditingSecondaryParent(true)}
                                        onRemove={() => {
                                            if(confirm('Remove secondary parent?')) {
                                                handleSecondaryParentSave({ name: null, relationship: null, gender: null, email: null, phone: null });
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <ParentForm formData={formData} handleChange={handleChange} />
                                    <div className="mt-8 flex justify-end gap-4">
                                        {!isInitialCreation && <button type="button" onClick={() => setMode('view')} className="px-6 py-3 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted/80 transition-colors">Cancel</button>}
                                        <button type="submit" disabled={loading} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50">
                                            {loading ? <Spinner size="sm" className="text-white"/> : 'Save Profile'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Secondary Parent Modal/Form */}
                            {editingSecondaryParent && (
                                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                    <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6">
                                        <h3 className="text-lg font-bold mb-4">Secondary Parent Details</h3>
                                        <SecondaryParentForm 
                                            initialData={{
                                                name: formData.secondary_parent_name || '',
                                                relationship: formData.secondary_parent_relationship || '',
                                                gender: formData.secondary_parent_gender || '',
                                                email: formData.secondary_parent_email || '',
                                                phone: formData.secondary_parent_phone || ''
                                            }}
                                            onSave={handleSecondaryParentSave}
                                            onCancel={() => setEditingSecondaryParent(false)}
                                            loading={loading}
                                            primaryRelationship={formData.relationship_to_student}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {role === BuiltInRoles.TEACHER && (
                        mode === 'view' ? (
                            <TeacherProfileView profile={profile} teacherData={formData} onEdit={() => setMode('edit')} />
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <TeacherForm 
                                    formData={formData} 
                                    handleChange={handleChange} 
                                    photoPreviewUrl={profilePhotoUrl}
                                    onPhotoChange={handlePhotoChange}
                                    currentUserId={profile.id}
                                    isRestrictedView={!isInitialCreation} // Teachers can mostly only edit bio/photo after creation
                                />
                                <div className="mt-8 flex justify-end gap-4">
                                    {!isInitialCreation && <button type="button" onClick={() => setMode('view')} className="px-6 py-3 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted/80 transition-colors">Cancel</button>}
                                    <button type="submit" disabled={loading} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50">
                                        {loading ? <Spinner size="sm" className="text-white"/> : 'Save Profile'}
                                    </button>
                                </div>
                            </form>
                        )
                    )}

                    {([BuiltInRoles.TRANSPORT_STAFF, BuiltInRoles.ECOMMERCE_OPERATOR] as string[]).includes(role) && (
                         <form onSubmit={handleSubmit}>
                             {role === BuiltInRoles.TRANSPORT_STAFF && <TransportForm formData={formData} handleChange={handleChange} />}
                             {role === BuiltInRoles.ECOMMERCE_OPERATOR && <EcommerceForm formData={formData} handleChange={handleChange} />}
                             
                             <div className="mt-8 flex justify-end gap-4">
                                {!isInitialCreation && mode === 'edit' && <button type="button" onClick={() => setMode('view')} className="px-6 py-3 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted/80 transition-colors">Cancel</button>}
                                <button type="submit" disabled={loading} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50">
                                    {loading ? <Spinner size="sm" className="text-white"/> : 'Save Profile'}
                                </button>
                            </div>
                         </form>
                    )}

                    {role === BuiltInRoles.STUDENT && (
                         <form onSubmit={handleSubmit}>
                            <StudentForm formData={formData} handleChange={handleChange} profile={profile} />
                            {/* Students typically just view unless it's initial setup handled by Wizard */}
                            {isInitialCreation && (
                                 <div className="mt-8 flex justify-end">
                                     <button type="submit" disabled={loading} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50">
                                        {loading ? <Spinner size="sm" className="text-white"/> : 'Complete Registration'}
                                    </button>
                                </div>
                            )}
                         </form>
                    )}
                </>
            )}
        </div>
    );
};
