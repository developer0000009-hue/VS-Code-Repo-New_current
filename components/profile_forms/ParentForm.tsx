
import React, { useState, useMemo, useEffect } from 'react';
import { ParentProfileData } from '../../types';
import { countries, statesByCountry, citiesByState } from '../data/locations';
import { countryCodes } from '../data/countryCodes';
import { UsersIcon } from '../icons/UsersIcon';
import { UserIcon } from '../icons/UserIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { GlobeIcon } from '../icons/GlobeIcon';
import { LocationIcon } from '../icons/LocationIcon';
import { HomeIcon } from '../icons/HomeIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import CustomSelect from '../common/CustomSelect';

// --- Styled Components ---

const PremiumInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode; fullWidth?: boolean }> = ({ label, icon, fullWidth, className, ...props }) => (
    <div className={`relative group ${fullWidth ? 'w-full' : ''}`}>
        <div className="absolute top-1/2 -translate-y-1/2 left-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300 z-10 pointer-events-none">
            {icon}
        </div>
        <input
            {...props}
            placeholder=" "
            className={`peer block w-full h-14 rounded-xl border border-input bg-background/50 px-4 ${icon ? 'pl-11' : 'pl-4'} pt-5 pb-2 text-sm text-foreground font-medium shadow-sm transition-all duration-200 hover:bg-background hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none placeholder-transparent ${className}`}
        />
        <label className={`absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[10px] font-bold uppercase tracking-wider text-muted-foreground duration-200 
            peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-xs peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case
            peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:text-primary pointer-events-none ${icon ? 'peer-placeholder-shown:left-11' : ''}`}>
            {label}
        </label>
    </div>
);

const SectionHeader: React.FC<{ title: string, subtitle: string, icon: React.ReactNode, colorClass: string }> = ({ title, subtitle, icon, colorClass }) => (
    <div className="flex items-start gap-4 mb-8">
        <div className={`p-3 rounded-2xl ${colorClass} shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
            {icon}
        </div>
        <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">{subtitle}</p>
        </div>
    </div>
);

interface FormProps {
    formData: Partial<ParentProfileData & { phone: string; display_name: string; }>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const ParentForm: React.FC<FormProps> = ({ formData, handleChange }) => {
    const [activeTab, setActiveTab] = useState<'personal' | 'address'>('personal');
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const bannerInputRef = React.useRef<HTMLInputElement>(null);

    // Auto-set gender based on relationship
    useEffect(() => {
        const rel = formData.relationship_to_student;
        let newGender = '';
        if (rel === 'Father') newGender = 'Male';
        else if (rel === 'Mother') newGender = 'Female';

        if (newGender && formData.gender !== newGender) {
             // Manually trigger change handler to update state in parent
             handleChange({ target: { name: 'gender', value: newGender } } as any);
        }
    }, [formData.relationship_to_student, formData.gender, handleChange]);

    // Derive country code and local number directly from formData.phone to avoid state sync issues
    const { derivedCountryCode, derivedLocalPhone } = useMemo(() => {
        const fullPhone = formData.phone || '';
        // Sort codes by length (desc) to match longest prefix first (e.g. +1 vs +1242)
        const sortedCodes = [...countryCodes].sort((a, b) => b.dial_code.length - a.dial_code.length);
        
        const foundCode = sortedCodes.find(c => fullPhone.startsWith(c.dial_code));
        
        if (foundCode) {
            return {
                derivedCountryCode: foundCode.dial_code,
                derivedLocalPhone: fullPhone.substring(foundCode.dial_code.length)
            };
        }
        
        // Default fallback or if no prefix match
        return {
            derivedCountryCode: '+91', 
            derivedLocalPhone: fullPhone.replace(/^\+/, '') // Strip leading + if it was just a number
        };
    }, [formData.phone]);

    const handlePhonePartChange = (type: 'code' | 'number', value: string) => {
        let newFullPhone = '';
        if (type === 'code') {
            newFullPhone = `${value}${derivedLocalPhone}`;
        } else {
            const sanitizedNumber = value.replace(/\D/g, ''); // Only digits
            newFullPhone = `${derivedCountryCode}${sanitizedNumber}`;
        }
        
        // Update parent state directly
        handleChange({ target: { name: 'phone', value: newFullPhone } } as any);
    };

    const handleSelectChange = (name: string) => (value: string) => {
        handleChange({ target: { name, value } } as any);
    };

    const handleCountrySelect = (country: string) => {
        handleChange({ target: { name: 'country', value: country } } as any);
        handleChange({ target: { name: 'state', value: '' } } as any);
        handleChange({ target: { name: 'city', value: '' } } as any);
        
        // Auto-set phone code based on country selection if phone is empty
        if (!formData.phone) {
            const countryData = countryCodes.find(c => c.name === country);
            if (countryData) {
                // This updates phone to just the code, effectively setting the dropdown
                handleChange({ target: { name: 'phone', value: countryData.dial_code } } as any);
            }
        }
    };
    
    const handleStateSelect = (state: string) => {
        handleChange({ target: { name: 'state', value: state } } as any);
        handleChange({ target: { name: 'city', value: '' } } as any);
    };
    
    const availableStates = useMemo(() => formData.country ? statesByCountry[formData.country] || [] : [], [formData.country]);
    const availableCities = useMemo(() => formData.state ? citiesByState[formData.state] || [] : [], [formData.state]);

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setBannerPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const childrenOptions = [
        { value: "1", label: "1 Child" },
        { value: "2", label: "2 Children" },
        { value: "3", label: "3 Children" },
        { value: "4", label: "4 Children" },
        { value: "5", label: "5 Children" },
        { value: "6", label: "More than 5" }
    ];

    const isPhoneValid = derivedLocalPhone.length >= 7 && derivedLocalPhone.length <= 15;

    return (
        <div className="space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-20">
            
            {/* --- HERO SECTION --- */}
            <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-xl group">
                {/* Banner */}
                <div className="h-48 md:h-64 bg-muted relative group/banner">
                    {bannerPreview ? (
                         <img src={bannerPreview} alt="Profile Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-105" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center">
                             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                             <div className="text-center z-10 opacity-30">
                                <UserIcon className="w-20 h-20 mx-auto mb-2" />
                            </div>
                        </div>
                    )}
                    <div 
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[2px]"
                        onClick={() => bannerInputRef.current?.click()}
                    >
                        <span className="text-white font-bold text-sm flex items-center gap-2 bg-white/20 px-6 py-3 rounded-full border border-white/30 hover:bg-white/30 transition-all transform hover:scale-105 backdrop-blur-md shadow-lg">
                            <UploadIcon className="w-4 h-4"/> Change Cover
                        </span>
                    </div>
                    <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" />
                </div>

                {/* Profile Info Overlay */}
                <div className="px-8 md:px-12 pb-8 pt-0 relative">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-8 -mt-16">
                        {/* Profile Picture */}
                        <div className="relative group/logo flex-shrink-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-card shadow-2xl flex items-center justify-center overflow-hidden bg-background relative z-10 transition-transform duration-300 group-hover/logo:scale-[1.02]">
                                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                                    <span className="text-4xl md:text-5xl font-black text-primary/20 select-none">
                                        {formData.display_name?.charAt(0) || 'P'}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-primary border-4 border-card w-8 h-8 rounded-full z-20 shadow-md flex items-center justify-center text-white" title="Primary User">
                                <CheckCircleIcon className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Name & Role */}
                        <div className="flex-grow w-full pt-2 md:pb-4 space-y-1">
                            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                                {formData.display_name || 'Parent Profile'}
                            </h2>
                            <p className="text-lg text-muted-foreground font-medium flex items-center gap-2">
                                <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
                                    {formData.relationship_to_student || 'Guardian'}
                                </span>
                                {formData.gender && <span className="text-sm">• {formData.gender}</span>}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-8 md:px-12 mt-4 bg-muted/30 border-t border-border/60">
                    <div className="flex overflow-x-auto scrollbar-hide gap-8">
                        {[
                            { id: 'personal', label: 'Personal Details', icon: <UserIcon className="w-4 h-4"/> },
                            { id: 'address', label: 'Address & Contact', icon: <LocationIcon className="w-4 h-4"/> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center gap-2.5 py-5 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap
                                    ${activeTab === tab.id 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                    }
                                `}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- FORM SECTIONS --- */}
            <div className="pt-2">
                
                {activeTab === 'personal' && (
                    <div className="bg-card rounded-3xl border border-border/60 shadow-sm p-8 md:p-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader 
                            title="Primary Guardian Information" 
                            subtitle="Details of the main contact person for the student." 
                            icon={<UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400"/>}
                            colorClass="bg-blue-50 dark:bg-blue-900/20"
                        />
                        
                        <div className="space-y-8 max-w-4xl">
                            <PremiumInput 
                                label="Full Name" 
                                name="display_name" 
                                value={formData.display_name || ''} 
                                onChange={handleChange} 
                                required 
                                icon={<UserIcon className="w-5 h-5"/>} 
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <CustomSelect
                                    label="Relationship to Student"
                                    placeholder="Select Relationship"
                                    options={[{ value: "Father", label: "Father" }, { value: "Mother", label: "Mother" }, { value: "Guardian", label: "Guardian" }, { value: "Other", label: "Other" }]}
                                    value={formData.relationship_to_student || ''}
                                    onChange={handleSelectChange('relationship_to_student')}
                                    icon={<UsersIcon className="w-4 h-4"/>}
                                    required
                                />
                                
                                <CustomSelect
                                    label="Gender"
                                    placeholder="Select Gender"
                                    options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }, { value: "Prefer not to say", label: "Prefer not to say" }]}
                                    value={formData.gender || ''}
                                    onChange={handleSelectChange('gender')}
                                    disabled={formData.relationship_to_student === 'Father' || formData.relationship_to_student === 'Mother'}
                                    icon={<UserIcon className="w-4 h-4"/>}
                                />
                            </div>

                            <div>
                                <CustomSelect
                                    label="Number of Children Enrolling"
                                    placeholder="Select Count"
                                    options={childrenOptions}
                                    value={String(formData.number_of_children || '')}
                                    onChange={handleSelectChange('number_of_children')}
                                    icon={<UsersIcon className="w-4 h-4"/>}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'address' && (
                    <div className="bg-card rounded-3xl border border-border/60 shadow-sm p-8 md:p-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <SectionHeader 
                            title="Residential & Contact Details" 
                            subtitle="Where the student primarily resides and how to reach you." 
                            icon={<HomeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400"/>}
                            colorClass="bg-purple-50 dark:bg-purple-900/20"
                        />

                        <div className="space-y-8 max-w-4xl">
                            {/* Phone Input Group */}
                            <div className="space-y-2">
                                <div className="flex gap-4">
                                    <div className="w-[160px] flex-shrink-0">
                                        <CustomSelect
                                            label="Code"
                                            placeholder="+91"
                                            options={countryCodes.map(c => ({ value: c.dial_code, label: `${c.dial_code} (${c.code})` }))}
                                            value={derivedCountryCode}
                                            onChange={(val) => handlePhonePartChange('code', val)}
                                            icon={<GlobeIcon className="w-4 h-4"/>}
                                            searchable
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <PremiumInput 
                                            label="Phone Number" 
                                            name="localPhone" 
                                            type="tel"
                                            value={derivedLocalPhone} 
                                            onChange={(e) => handlePhonePartChange('number', e.target.value)} 
                                            icon={<PhoneIcon className="w-4 h-4"/>}
                                        />
                                    </div>
                                </div>
                                {derivedLocalPhone && (
                                    <p className={`text-xs font-bold flex items-center gap-1.5 ml-1 ${isPhoneValid ? 'text-green-600' : 'text-amber-600'}`}>
                                        {isPhoneValid 
                                            ? <><CheckCircleIcon className="w-3.5 h-3.5"/> Number looks valid</>
                                            : 'Please enter a valid phone number (7-15 digits)'
                                        }
                                    </p>
                                )}
                            </div>

                            <PremiumInput 
                                label="Street Address" 
                                name="address" 
                                value={formData.address || ''} 
                                onChange={handleChange} 
                                placeholder="Flat / House No / Street" 
                                icon={<LocationIcon className="w-4 h-4"/>}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <CustomSelect 
                                    label="Country" 
                                    placeholder="Select Country" 
                                    options={countries.map(c => ({ value: c, label: c }))}
                                    value={formData.country || ''}
                                    onChange={handleCountrySelect}
                                    icon={<GlobeIcon className="w-4 h-4"/>}
                                    searchable
                                    required
                                />
                                
                                <CustomSelect 
                                    label="State / Province" 
                                    placeholder="Select State" 
                                    options={availableStates.map(s => ({ value: s, label: s }))}
                                    value={formData.state || ''}
                                    onChange={handleStateSelect}
                                    icon={<LocationIcon className="w-4 h-4"/>}
                                    searchable
                                    disabled={availableStates.length === 0}
                                    required
                                />

                                <CustomSelect 
                                    label="City" 
                                    placeholder="Select City" 
                                    options={availableCities.map(c => ({ value: c, label: c }))}
                                    value={formData.city || ''}
                                    onChange={handleSelectChange('city')}
                                    icon={<LocationIcon className="w-4 h-4"/>}
                                    searchable
                                    disabled={availableCities.length === 0}
                                    required
                                />
                                
                                <PremiumInput 
                                    label="Pin Code / Zip Code" 
                                    name="pin_code" 
                                    value={formData.pin_code || ''} 
                                    onChange={handleChange} 
                                    icon={<LocationIcon className="w-4 h-4"/>} 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentForm;
