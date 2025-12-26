
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SearchIcon } from '../icons/SearchIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface Option {
    value: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode; 
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    searchable?: boolean;
    isSynced?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select...", 
    icon, 
    label,
    disabled, 
    className,
    searchable = false,
    isSynced = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchTerm) return options;
        const lowerTerm = searchTerm.toLowerCase();
        return options.filter(opt => opt.label.toLowerCase().includes(lowerTerm));
    }, [options, searchTerm, searchable]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen, searchable]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative group w-full ${className || ''} ${disabled ? 'opacity-60 grayscale-[0.5]' : ''}`} ref={containerRef}>
            {label && (
                <label className={`absolute left-10 top-0 -translate-y-1/2 bg-[#0a0a0c] px-2 text-[9px] font-black uppercase tracking-[0.3em] z-20 transition-all duration-300 
                    ${isOpen ? 'text-primary' : isSynced ? 'text-primary' : 'text-white/30'}`}>
                    {label}
                </label>
            )}
            
            <div className="relative h-[64px]">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        peer w-full h-full text-left rounded-[1.5rem] border transition-all duration-500 ease-in-out outline-none select-none
                        flex items-center px-6 pt-4 pb-1
                        ${icon ? 'pl-14' : 'pl-6'}
                        ${disabled ? 'cursor-not-allowed border-white/5 bg-black/40' : 'cursor-pointer'}
                        ${isSynced ? 'border-primary/40 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]' : 'border-white/10 bg-white/[0.02]'}
                        ${isOpen 
                            ? 'border-primary ring-8 ring-primary/5 shadow-[0_0_30px_rgba(var(--primary),0.1)]' 
                            : 'hover:border-white/20'
                        }
                    `}
                >
                    <span className="flex items-center h-full min-w-0 flex-grow">
                        {selectedOption ? (
                            <span className="text-white font-bold text-sm tracking-tight truncate">{selectedOption.label}</span>
                        ) : (
                            <span className="text-white/20 font-medium text-sm truncate">{placeholder}</span>
                        )}
                    </span>
                </button>
                
                {icon && (
                    <div className={`absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-all duration-300 ${isOpen ? 'text-primary' : isSynced ? 'text-primary' : 'text-white/20'}`}>
                        {icon}
                    </div>
                )}

                <span className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                    <ChevronDownIcon className={`h-5 w-5 text-white/20 transition-transform duration-500 ${isOpen ? 'rotate-180 text-primary opacity-100' : 'group-hover:opacity-60'}`} />
                </span>
            </div>

            {isOpen && (
                <div className="absolute z-[110] mt-3 w-full bg-[#13151b] rounded-[1.8rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.95)] border border-white/10 overflow-hidden origin-top animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 backdrop-blur-3xl ring-1 ring-white/10">
                    
                    {searchable && (
                        <div className="p-3 border-b border-white/5 bg-white/[0.02] sticky top-0 z-10">
                            <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Filter options..."
                                    className="w-full pl-11 pr-4 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder:text-white/10 font-bold uppercase tracking-widest"
                                />
                            </div>
                        </div>
                    )}

                    <div className="max-h-64 overflow-auto p-2 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(option.value);
                                    }}
                                    className={`
                                        w-full flex items-center gap-4 px-5 py-3.5 text-sm rounded-2xl transition-all duration-200 group select-none cursor-pointer mb-1 last:mb-0
                                        ${value === option.value 
                                            ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02] z-10' 
                                            : 'text-white/60 hover:bg-white/[0.05] hover:text-white border border-transparent'
                                        }
                                    `}
                                >
                                    <span className={`flex-grow text-left truncate font-bold uppercase tracking-widest text-[9px] ${value === option.value ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>{option.label}</span>
                                    {value === option.value && (
                                        <CheckCircleIcon className="w-4 h-4 text-primary-foreground" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-6 py-10 text-xs text-white/20 text-center italic select-none font-black uppercase tracking-[0.3em]">
                                No matches found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
