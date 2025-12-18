import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SearchIcon } from '../icons/SearchIcon';

interface Option {
    value: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode; 
    label?: string; // Kept for prop-compatibility but no longer rendered as a floating label
    required?: boolean;
    disabled?: boolean;
    className?: string;
    searchable?: boolean;
}

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

const CustomSelect: React.FC<CustomSelectProps> = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select...", 
    icon, 
    label,
    required, 
    disabled, 
    className,
    searchable = false
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
        <div className={`relative group ${className || ''} ${disabled ? 'opacity-60 pointer-events-none' : ''}`} ref={containerRef}>
            <div className="relative h-[58px]">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        peer w-full h-full text-left rounded-xl border-2 transition-all duration-200 ease-in-out outline-none select-none
                        flex items-center
                        bg-transparent
                        px-4 ${icon ? 'pl-12' : 'pl-4'}
                        ${disabled ? 'cursor-not-allowed bg-muted/50 border-border' : 'cursor-pointer'}
                        ${isOpen 
                            ? 'border-primary ring-4 ring-primary/10 bg-card' 
                            : 'border-input hover:border-primary/50'
                        }
                    `}
                >
                    <span className="flex items-center h-full">
                        {selectedOption ? (
                            <span className="text-foreground font-medium text-sm">{selectedOption.label}</span>
                        ) : (
                            <span className="text-muted-foreground/80 font-medium text-sm">{placeholder}</span>
                        )}
                    </span>
                </button>
                
                {icon && (
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-all duration-300 ${isOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'}`}>
                        {icon}
                    </div>
                )}

                <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <ChevronDownIcon className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                </span>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-card rounded-xl shadow-2xl border border-border overflow-hidden origin-top animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                    
                    {searchable && (
                        <div className="p-2 border-b border-border bg-muted/30 sticky top-0 z-10">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>
                    )}

                    <div className="max-h-60 overflow-auto p-1.5 custom-scrollbar">
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
                                        w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-150 group select-none cursor-pointer
                                        ${value === option.value 
                                            ? 'bg-primary/10 text-primary font-bold' 
                                            : 'text-foreground/80 hover:bg-muted'
                                        }
                                    `}
                                >
                                    {option.icon && (
                                        <div className={`p-1.5 rounded-md transition-colors ${value === option.value ? 'bg-primary/20' : 'bg-muted/50 group-hover:bg-primary/5'}`}>
                                            <option.icon className={`w-4 h-4 ${value === option.value ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'}`} />
                                        </div>
                                    )}
                                    <span className="flex-grow text-left truncate">{option.label}</span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-xs text-muted-foreground text-center italic select-none">
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