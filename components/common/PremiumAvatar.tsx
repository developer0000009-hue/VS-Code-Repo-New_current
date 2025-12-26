
import React, { useState, useEffect, useMemo } from 'react';

interface PremiumAvatarProps {
    src?: string | null;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    statusColor?: string;
    className?: string;
}

const PremiumAvatar: React.FC<PremiumAvatarProps> = ({ src, name, size = 'md', statusColor, className }) => {
    const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');
    
    const displayUrl = useMemo(() => {
        if (!src) return null;
        if (src.includes('supabase.co')) {
            const separator = src.includes('?') ? '&' : '?';
            return `${src}${separator}t=${Date.now()}`;
        }
        return src;
    }, [src]);

    useEffect(() => {
        if (src) {
            setImgStatus('loading');
        } else {
            setImgStatus('error');
        }
    }, [src]);

    const sizeMap = {
        sm: 'w-10 h-10 text-[10px]',
        md: 'w-20 h-20 text-xl',
        lg: 'w-32 h-32 md:w-36 md:h-36 text-2xl',
        xl: 'w-48 h-48 text-4xl'
    };

    const getInitials = (n: string) => {
        if (!n) return '?';
        return n.split(' ').map(i => i[0]).slice(0, 2).join('').toUpperCase();
    };

    const getColorFromHash = (n: string) => {
        const colors = [
            'from-indigo-600 to-blue-700',
            'from-purple-700 to-pink-600',
            'from-emerald-600 to-teal-700',
            'from-rose-600 to-orange-600',
            'from-cyan-600 to-sky-700'
        ];
        let hash = 0;
        for (let i = 0; i < n.length; i++) {
            hash = n.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={`relative flex-shrink-0 ${sizeMap[size]} ${className} group/avatar`}>
            {/* Ambient Aura Base */}
            <div className={`absolute -inset-3 rounded-[35%] blur-2xl opacity-10 transition-all duration-1000 ${statusColor || 'bg-primary'} group-hover/avatar:opacity-25`}></div>
            
            {/* Main Surface */}
            <div className="relative w-full h-full rounded-[2.2rem] md:rounded-[3rem] overflow-hidden bg-[#13151b] border border-white/10 shadow-2xl ring-1 ring-white/5 flex items-center justify-center transition-all duration-700 group-hover/avatar:scale-[1.03]">
                
                {/* Visual Glass Reflection Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.08] pointer-events-none z-20"></div>

                {src && imgStatus !== 'error' && (
                    <img 
                        src={displayUrl || undefined} 
                        alt={name}
                        onLoad={() => setImgStatus('loaded')}
                        onError={() => setImgStatus('error')}
                        className={`w-full h-full object-cover transition-all duration-1000 ease-out z-10 ${imgStatus === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                    />
                )}

                {imgStatus === 'loading' && (
                    <div className="absolute inset-0 bg-[#1a1d23] overflow-hidden z-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                )}

                {imgStatus === 'error' && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${getColorFromHash(name)} flex items-center justify-center shadow-inner animate-in fade-in zoom-in-95 duration-700 z-10`}>
                        <span className="font-serif font-black text-white/90 drop-shadow-2xl tracking-tighter">
                            {getInitials(name)}
                        </span>
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                )}
            </div>

            {/* Depth Edge Shadow */}
            <div className="absolute -bottom-1.5 inset-x-3 h-5 bg-black/40 blur-xl rounded-full -z-10 group-hover/avatar:scale-110 transition-transform"></div>
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default PremiumAvatar;
