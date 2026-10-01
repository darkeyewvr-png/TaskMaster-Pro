import React, { useState, useMemo } from 'react';
import { InspectionReport, Company, UserRole } from '../types';

interface ComplianceListProps {
  reports: InspectionReport[];
  company: Company;
  userRole: UserRole;
  onOpenReport: (report: InspectionReport) => void;
  onNewReport: () => void;
  onDeleteReport?: (id: string) => void;
}

export const ComplianceList: React.FC<ComplianceListProps> = ({
  reports,
  company,
  userRole,
  onOpenReport,
  onNewReport,
  onDeleteReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return (reports || []).filter(r => {
      const matchSearch = 
        (r.reportNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.clientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.inspectorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.siteAddress && r.siteAddress.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [reports, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const safeReports = reports || [];
    const passed = safeReports.filter(r => r.status === 'PASSED').length;
    const conditional = safeReports.filter(r => r.status === 'CONDITIONAL').length;
    const failed = safeReports.filter(r => r.status === 'FAILED').length;
    return { passed, conditional, failed, total: safeReports.length };
  }, [reports]);

  const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 md:px-0">
      {/* Top Header */}
      <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Operations &amp; Workmanship Verification
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">
            Quality Inspections &amp; Sign-Offs
          </h2>
          <p className="text-xs text-slate-400">
            Digital service sign-offs, customer handover walkarounds, and quality assurance logs.
          </p>
        </div>

        <button
          onClick={onNewReport}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-emerald-900/30 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <span>✓</span>
          <span>New Service Sign-Off / QA</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sign-Offs</p>
          <p className="text-3xl font-black italic text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Passed / Verified</p>
          <p className="text-3xl font-black italic text-emerald-400 mt-1">{stats.passed}</p>
        </div>
        <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Conditional</p>
          <p className="text-3xl font-black italic text-amber-400 mt-1">{stats.conditional}</p>
        </div>
        <div className="bg-[#161b22] p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Failed / Rework</p>
          <p className="text-3xl font-black italic text-red-400 mt-1">{stats.failed}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#161b22] p-3 rounded-2xl border border-slate-800">
        <input
          type="text"
          placeholder="Search by Sign-off #, client, address, or supervisor..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-96 px-4 py-2.5 bg-[#0d1117] border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-blue-500"
        />

        <div className="flex gap-1 w-full sm:w-auto">
          {['ALL', 'PASSED', 'CONDITIONAL', 'FAILED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${
                filterStatus === st
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white bg-[#0d1117]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(rep => (
          <div
            key={rep.id}
            onClick={() => onOpenReport(rep)}
            className="bg-[#161b22] p-5 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer group shadow-xl relative"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs font-black text-emerald-400">{rep.reportNumber}</span>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                rep.status === 'PASSED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : rep.status === 'CONDITIONAL'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-red-950 text-red-400 border border-red-800'
              }`}>
                {rep.status}
              </span>
            </div>

            <h4 className="text-base font-black text-white uppercase group-hover:text-emerald-400 transition truncate">
              {rep.clientId}
            </h4>
            <p className="text-xs text-slate-400 truncate mt-0.5 italic">{rep.siteAddress || 'Service Site'}</p>

            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] grid grid-cols-2 gap-2 text-slate-400">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Supervisor / Staff</span>
                <span className="font-bold text-slate-300 truncate block">{rep.inspectorName}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 uppercase block">Date</span>
                <span className="font-mono text-slate-300">
                  {new Date(rep.inspectionDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Quick stats preview */}
            <div className="mt-3 p-2 bg-[#0d1117] rounded-xl text-[10px] font-mono flex items-center justify-between text-slate-400 border border-slate-800/60">
              <span>Type: <strong className="text-white truncate max-w-[120px] inline-block">{rep.type || 'Quality QA'}</strong></span>
              <span>Checklist: <strong className="text-emerald-400">{rep.checklist?.length || 0}</strong></span>
              <span>Photos: <strong className="text-blue-400">{rep.photos?.length || 0}</strong></span>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs pt-1">
              <span className="text-emerald-400 font-bold text-[10px] uppercase">
                View &amp; Print Sign-Off →
              </span>
              {isSuperAdmin && onDeleteReport && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete sign-off record ${rep.reportNumber}?`)) {
                      onDeleteReport(rep.id);
                    }
                  }}
                  className="text-slate-500 hover:text-red-400 text-xs p-1"
                  title="Delete Record"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-[#161b22]/50 border border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 font-black uppercase tracking-wider text-xs">No service sign-offs logged yet</p>
            <button
              onClick={onNewReport}
              className="mt-3 text-emerald-400 hover:text-emerald-300 font-bold text-xs uppercase"
            >
              + Create First Service Sign-Off
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
