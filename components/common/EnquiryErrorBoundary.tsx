import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { RefreshIcon } from '../icons/RefreshIcon';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

class EnquiryErrorBoundary extends React.Component<Props, State> {
    public state: State = { hasError: false };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('EnquiryErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[150] p-4">
                    <div className="bg-[#09090b] rounded-[3rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col border border-white/5 overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-500">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangleIcon className="w-8 h-8 text-red-500" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-serif font-black text-white uppercase tracking-tighter">
                                    System Anomaly
                                </h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    An unexpected error occurred while loading the enquiry details. This has been logged for investigation.
                                </p>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="bg-black/20 rounded-xl p-4 text-left">
                                    <summary className="text-xs font-black text-red-400 uppercase tracking-widest cursor-pointer">
                                        Error Details (Development)
                                    </summary>
                                    <pre className="text-xs text-red-300 mt-2 overflow-auto whitespace-pre-wrap break-all">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}

                            <button
                                onClick={this.handleRetry}
                                className="w-full py-4 bg-primary text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1 active:scale-95"
                            >
                                <RefreshIcon className="w-5 h-5" />
                                Retry Loading
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default EnquiryErrorBoundary;
