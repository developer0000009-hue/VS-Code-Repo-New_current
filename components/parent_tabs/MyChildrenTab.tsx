
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { AdmissionApplication, UserProfile } from '../../types';
import Spinner from '../common/Spinner';
import ChildProfileCard from './ChildProfileCard';
import ChildRegistrationModal from './ChildRegistrationModal';
import { PlusIcon } from '../icons/PlusIcon';
import { UsersIcon } from '../icons/UsersIcon'; 
import { SearchIcon } from '../icons/SearchIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ChevronUpIcon } from '../icons/ChevronUpIcon';
import { FilterIcon } from '../icons/FilterIcon';

interface MyChildrenTabProps {
    onManageDocuments: (admissionId: number) => void;
    profile: UserProfile;
}

type FilterType = 'All' | 'Approved' | 'Pending' | 'Rejected';

const MyChildrenTab: React.FC<MyChildrenTabProps> = ({ onManageDocuments, profile }) => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<AdmissionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<AdmissionApplication | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!profile.id) {
            setError("User ID not available. Please log in again.");
            setLoading(false);
            return;
        }
        
        const { data, error } = await supabase.rpc('get_my_children_profiles');
        
        if (error) {
            setError(error.message || 'Failed to fetch profiles');
        } else {
            setApplications((data as AdmissionApplication[]) || []);
        }
        
        setLoading(false);
    }, [profile.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); 

    const handleOpenModalForNew = () => {
        setEditingChild(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (child: AdmissionApplication) => {
        setEditingChild(child);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingChild(null);
    };

    const handleSave = () => {
        handleCloseModal();
        fetchData(); 
    };

    const handleNavigateDashboard = async (admissionId: number) => {
        const { error } = await supabase.rpc('parent_switch_student_view', { p_new_admission_id: admissionId });
        if (error) {
            alert(`Error switching dashboard: ${error.message}`);
        } else {
            navigate('/student');
        }
    };
    
    const toggleCardExpand = (id: number) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    const handleExpandAll = () => {
        if (expandedCards.size === applications.length) {
            setExpandedCards(new Set());
        } else {
            setExpandedCards(new Set(applications.map(a => a.id)));
        }
    };

    // Filtering Logic
    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesFilter = true;
            if (activeFilter === 'Approved') matchesFilter = app.status === 'Approved';
            else if (activeFilter === 'Rejected') matchesFilter = app.status === 'Rejected';
            else if (activeFilter === 'Pending') matchesFilter = app.status !== 'Approved' && app.status !== 'Rejected';
            
            return matchesSearch && matchesFilter;
        });
    }, [applications, activeFilter, searchTerm]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-32">
                    <Spinner size="lg" />
                    <p className="mt-6 text-muted-foreground font-medium animate-pulse">Loading profiles...</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center max-w-lg mx-auto mt-12">
                    <p className="text-destructive font-bold text-lg mb-2">Unable to load profiles</p>
                    <p className="text-sm text-destructive/80 mb-6">{typeof error === 'string' ? error : 'Unknown error occurred'}</p>
                    <button onClick={fetchData} className="px-6 py-2.5 bg-background border border-destructive/30 rounded-xl text-sm font-bold hover:bg-destructive/5 transition-colors shadow-sm">Retry</button>
                </div>
            );
        }

        if (applications.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500 bg-card border-2 border-dashed border-border rounded-[2rem]">
                    <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8 shadow-inner border border-primary/10">
                        <UsersIcon className="h-10 w-10 text-primary/40" />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground mb-3">Welcome, Parent!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-10 text-lg">
                        It looks like you haven't registered any children yet. Add your first child to start tracking their progress.
                    </p>
                     <button 
                        onClick={handleOpenModalForNew}
                        className="px-10 py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all flex items-center gap-3 group text-base"
                    >
                        <PlusIcon className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                        Register New Child
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Premium Toolbar */}
                <div className="sticky top-20 z-30 bg-card/80 backdrop-blur-xl p-3 rounded-[1.5rem] border border-border shadow-lg flex flex-col lg:flex-row justify-between items-center gap-4 transition-all duration-300">
                    <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar px-1">
                         <div className="flex bg-muted/50 p-1.5 rounded-xl border border-border/50 shadow-inner">
                            {(['All', 'Approved', 'Pending', 'Rejected'] as FilterType[]).map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                        activeFilter === filter 
                                        ? 'bg-background text-foreground shadow-md ring-1 ring-black/5 transform scale-[1.02]' 
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                        <div className="h-8 w-px bg-border mx-2 hidden lg:block"></div>
                        <button 
                            onClick={handleExpandAll}
                            className="hidden lg:flex items-center gap-2 px-5 py-3 text-xs font-bold text-muted-foreground hover:text-primary bg-muted/30 hover:bg-primary/10 rounded-xl transition-colors border border-transparent hover:border-primary/20"
                        >
                            {expandedCards.size === applications.length ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>}
                            {expandedCards.size === applications.length ? 'Collapse All' : 'Expand All'}
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full lg:w-auto pr-1">
                        <div className="relative flex-grow lg:w-80 group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search child..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-background/80 border border-input rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={handleOpenModalForNew}
                            className="p-3 bg-primary text-primary-foreground rounded-xl shadow-md hover:bg-primary/90 hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center aspect-square"
                            title="Register New Child"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start pb-20">
                    {filteredApplications.map((app) => (
                        <ChildProfileCard 
                            key={app.id} 
                            child={app}
                            isExpanded={expandedCards.has(app.id)}
                            onToggleExpand={() => toggleCardExpand(app.id)}
                            onEdit={() => handleOpenModalForEdit(app)}
                            onManageDocuments={() => onManageDocuments(app.id)}
                            onNavigateDashboard={() => handleNavigateDashboard(app.id)}
                        />
                    ))}
                    
                    {/* Add New Card (If not searching and filter is All) */}
                    {!searchTerm && activeFilter === 'All' && (
                        <button 
                            onClick={handleOpenModalForNew}
                            className="flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all group min-h-[260px] h-full opacity-70 hover:opacity-100 animate-in fade-in zoom-in-95 duration-500"
                        >
                            <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors mb-4 shadow-sm group-hover:shadow-md border border-border group-hover:border-primary/20">
                                <PlusIcon className="w-8 h-8 transform group-hover:rotate-90 transition-transform duration-300"/>
                            </div>
                            <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">Register Another Child</span>
                            <span className="text-sm text-muted-foreground mt-1">Add a sibling to your account</span>
                        </button>
                    )}
                </div>

                {filteredApplications.length === 0 && applications.length > 0 && (
                    <div className="text-center py-24 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border">
                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FilterIcon className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground font-medium text-lg">No profiles match your search.</p>
                        <button onClick={() => {setActiveFilter('All'); setSearchTerm('');}} className="mt-4 text-primary font-bold hover:underline text-sm bg-primary/10 px-6 py-2.5 rounded-xl transition-colors">Clear Filters</button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="mb-10">
                <h2 className="text-4xl font-serif font-extrabold text-foreground tracking-tight">My Children</h2>
                <p className="text-muted-foreground mt-3 max-w-3xl text-lg leading-relaxed">
                    Manage enrollment, track academic progress, and access student portals for all your children in one place.
                </p>
            </div>
            
            {renderContent()}

            {isModalOpen && (
                <ChildRegistrationModal 
                    child={editingChild}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    currentUserId={profile.id}
                />
            )}
        </div>
    );
};

export default MyChildrenTab;
