
import React, { useEffect, useState } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
    colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, colorClass = "bg-primary text-primary-foreground" }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const numericValue = parseFloat(value.replace(/[^0-9.-]+/g,""));
        if (isNaN(numericValue)) return;

        let start = 0;
        const duration = 1500;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            
            setDisplayValue(easedProgress * numericValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(numericValue);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    const isNumeric = !isNaN(parseFloat(value.replace(/[^0-9.-]+/g,"")));
    let formattedValue = value;
    if (isNumeric) {
        const prefix = value.startsWith('$') ? '$' : '';
        const suffix = value.endsWith('%') ? '%' : '';
        formattedValue = `${prefix}${Math.round(displayValue).toLocaleString()}${suffix}`;
    }
    
    const isPositive = trend.includes('+') || trend === 'Stable';
    
    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClass} transition-transform duration-300 group-hover:scale-110 shadow-inner`}>
                    {icon}
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                    trend === 'Stable' ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' :
                    isPositive 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                }`}>
                    {trend !== 'Stable' && (isPositive ? '↑' : '↓')} {trend}
                </span>
            </div>
            
            <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 opacity-80">{title}</p>
                <h3 className="text-3xl font-extrabold text-foreground tracking-tight">{formattedValue}</h3>
            </div>
        </div>
    );
};

export default StatCard;
