
import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, primaryAction, secondaryAction, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-10 bg-gradient-to-b from-[#161b22] to-[#0d1117] rounded-[3rem] border border-slate-800/50 shadow-2xl animate-in fade-in zoom-in-95 duration-700">
      <div className="w-24 h-24 bg-[#0d1117] rounded-[2rem] flex items-center justify-center mb-8 border border-slate-800 shadow-[0_0_50px_-20px_rgba(59,130,246,0.3)]">
        {icon || (
          <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-3 text-center leading-none">{title}</h3>
      <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-10 text-center max-w-sm leading-relaxed">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {primaryAction && (
          <button 
            onClick={primaryAction.onClick}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-900/30 active:scale-95 transition-all"
          >
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button 
            onClick={secondaryAction.onClick}
            className="flex-1 bg-[#1c232e] text-slate-400 border border-slate-800 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all hover:text-white hover:bg-slate-700 hover:border-slate-600"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
