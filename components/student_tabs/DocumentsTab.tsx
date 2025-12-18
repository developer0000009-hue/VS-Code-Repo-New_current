
import React, { useState } from 'react';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { SearchIcon } from '../icons/SearchIcon';

// Mock Data
const MOCK_DOCUMENTS = [
    { id: 1, title: 'Annual Report Card (2024-25)', date: '2025-03-15', category: 'Report Cards', type: 'PDF', size: '2.4 MB' },
    { id: 2, title: 'Merit Certificate - Science Fair', date: '2024-11-20', category: 'Certificates', type: 'PDF', size: '1.1 MB' },
    { id: 3, title: 'Fee Receipt - Q3', date: '2024-10-01', category: 'Finance', type: 'PDF', size: '0.8 MB' },
    { id: 4, title: 'Bonafide Certificate', date: '2024-08-10', category: 'Administrative', type: 'PDF', size: '0.5 MB' },
    { id: 5, title: 'Term 1 Marksheet', date: '2024-06-15', category: 'Report Cards', type: 'PDF', size: '1.8 MB' },
    { id: 6, title: 'Transfer Certificate', date: '2023-04-01', category: 'Administrative', type: 'PDF', size: '1.2 MB' },
];

const CATEGORIES = ['All', 'Report Cards', 'Certificates', 'Finance', 'Administrative'];

const DocumentsTab: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');

    const filteredDocs = MOCK_DOCUMENTS.filter(doc => {
        const matchesCategory = activeCategory === 'All' || doc.category === activeCategory;
        const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleDownload = (docTitle: string) => {
        alert(`Downloading ${docTitle}...`);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">My Documents</h2>
                    <p className="text-muted-foreground text-sm mt-1">Access and download your official academic records.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Search documents..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-card border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                            activeCategory === cat 
                            ? 'bg-primary text-primary-foreground shadow-md' 
                            : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Documents Grid */}
            {filteredDocs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocs.map(doc => (
                        <div key={doc.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <DocumentTextIcon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-bold uppercase bg-muted px-2 py-1 rounded text-muted-foreground">
                                    {doc.type}
                                </span>
                            </div>
                            
                            <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-2 min-h-[40px]">{doc.title}</h3>
                            <p className="text-xs text-muted-foreground mb-4">{new Date(doc.date).toLocaleDateString()} • {doc.size}</p>
                            
                            <button 
                                onClick={() => handleDownload(doc.title)}
                                className="w-full py-2.5 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary/30 text-sm font-bold text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2"
                            >
                                <DownloadIcon className="w-4 h-4" /> Download
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-muted/10 border-2 border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground font-medium">No documents found.</p>
                </div>
            )}
        </div>
    );
};

export default DocumentsTab;
