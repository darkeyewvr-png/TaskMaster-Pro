
import React from 'react';

interface ListToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onReset: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  statusOptions: { label: string; value: string }[];
}

const ListToolbar: React.FC<ListToolbarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onReset,
  viewMode,
  onViewModeChange,
  statusOptions
}) => {
  return (
    <div className="bg-[#161b22] p-5 md:p-7 rounded-[2.5rem] border border-slate-800/60 shadow-2xl space-y-5 mb-8">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search operational records..." 
            value={search} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="w-full bg-[#0d1117] border border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-[13px] text-white outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/40 transition-all placeholder:text-slate-700 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-4">
          {/* Status Filter */}
          <div className="relative flex-1 sm:flex-none">
            <select 
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full bg-[#0d1117] border border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl px-6 py-4 outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/40 transition-all"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
          </div>

          {/* View Toggle */}
          <div className="flex bg-[#0d1117] p-1.5 rounded-2xl border border-slate-800">
            <button 
              onClick={() => onViewModeChange('grid')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'text-slate-600 hover:text-slate-400'}`}
              title="Grid Layout"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
            </button>
            <button 
              onClick={() => onViewModeChange('list')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'text-slate-600 hover:text-slate-400'}`}
              title="List Layout"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/></svg>
            </button>
          </div>

          <button 
            onClick={onReset}
            className="hidden sm:block text-[10px] font-black uppercase text-slate-600 hover:text-red-500 transition-colors px-4 tracking-widest"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-slate-800/40">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Start Date:</span>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="bg-[#0d1117] border border-slate-800 text-white text-[10px] font-bold rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/40 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">End Date:</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="bg-[#0d1117] border border-slate-800 text-white text-[10px] font-bold rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/40 transition-all"
          />
        </div>
        <button 
          onClick={onReset}
          className="sm:hidden text-[10px] font-black uppercase text-slate-600 hover:text-red-500 transition-colors tracking-widest"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default ListToolbar;
