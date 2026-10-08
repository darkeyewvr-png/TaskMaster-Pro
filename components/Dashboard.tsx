import React, { useMemo, useState } from 'react';
import { Job, BillingDocument, Company, StaffUser } from '../types';

interface DashboardProps {
  jobs: Job[];
  quotes?: BillingDocument[];
  invoices?: BillingDocument[];
  company: Company;
  currentOperator: StaffUser;
  isWorking: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  onSelectJob: (id: string) => void;
  onNewJob: (type: 'job' | 'quote' | 'invoice', initialData?: any) => void;
  onOpenAI: () => void;
  onOpenSearch: () => void;
  onOpenStockTake?: () => void;
  onOpenMap?: () => void;
  onOpenSubscription?: () => void;
  onOpenPricing?: () => void;
  onOpenCompliance?: () => void;
  onExportToDiscord?: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({
  jobs = [],
  quotes = [],
  invoices = [],
  company,
  currentOperator,
  isWorking,
  onClockIn,
  onClockOut,
  onSelectJob,
  onNewJob,
  onOpenAI,
  onOpenSearch,
  onOpenStockTake,
  onOpenMap,
  onOpenSubscription,
  onOpenPricing,
  onOpenCompliance,
  onExportToDiscord,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const safeJobs = useMemo(() => Array.isArray(jobs) ? jobs : [], [jobs]);
  const safeQuotes = useMemo(() => Array.isArray(quotes) ? quotes : [], [quotes]);
  const safeInvoices = useMemo(() => Array.isArray(invoices) ? invoices : [], [invoices]);

  const isSuperAdmin = currentOperator?.role === 'super_admin' || currentOperator?.role === 'admin';
  const currencySymbol = company?.currencySymbol || 'R';
  const brandColor = company?.brandColor || '#2563eb';

  const handleExport = async () => {
    if (!onExportToDiscord) return;
    setIsExporting(true);
    try {
      await onExportToDiscord();
      alert("All operational data successfully synced and exported to Discord!");
    } catch (error: any) {
      alert("Failed to export: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const metrics = useMemo(() => {
    const open = safeJobs.filter(j => j.status === 'OPEN').length;
    const working = safeJobs.filter(j => j.status === 'WORKING').length;
    const done = safeJobs.filter(j => j.status === 'DONE').length;
    const emergencies = safeJobs.filter(j => j.priority === 'EMERGENCY' && j.status !== 'DONE').length;

    // Financial metrics
    const totalInvoiced = safeInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const unpaidInvoices = safeInvoices.filter(inv => !inv.isPaid);
    const totalUnpaid = unpaidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const paidInvoices = safeInvoices.filter(inv => inv.isPaid);
    const totalPaid = paidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);

    // My assigned jobs (for technician view)
    const myJobs = safeJobs.filter(j => 
      j.assignedTechUid === currentOperator?.uid || 
      (j.technician && j.technician.toLowerCase().includes((currentOperator?.name || '').toLowerCase()))
    );

    return {
      open,
      working,
      done,
      emergencies,
      totalInvoiced,
      unpaidCount: unpaidInvoices.length,
      totalUnpaid,
      paidCount: paidInvoices.length,
      totalPaid,
      myJobsCount: myJobs.length,
      myWorkingCount: myJobs.filter(j => j.status === 'WORKING').length,
    };
  }, [safeJobs, safeInvoices, currentOperator]);

  const parseDate = (dateVal: any) => {
    if (!dateVal) return null;
    if (dateVal.toDate) return dateVal.toDate();
    const d = new Date(dateVal);
    if (typeof dateVal === 'string' && dateVal.length === 10) {
      const [y, m, d_part] = dateVal.split('-').map(Number);
      return new Date(y, m - 1, d_part);
    }
    return d;
  };

  const todaysJobs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return safeJobs.filter(job => {
      if (filterCategory !== 'ALL' && job.status !== filterCategory) return false;
      const start = parseDate(job.startDate);
      if (!start) return false;
      start.setHours(0, 0, 0, 0);
      const end = job.endDate ? parseDate(job.endDate) : start;
      if (end) end.setHours(0, 0, 0, 0);
      return today >= start && (end ? today <= end : today <= start);
    });
  }, [safeJobs, filterCategory]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const getJobsForDate = (date: Date | null) => {
    if (!date) return [];
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return safeJobs.filter(job => {
      const start = parseDate(job.startDate);
      if (!start) return false;
      start.setHours(0, 0, 0, 0);
      const end = job.endDate ? parseDate(job.endDate) : start;
      if (end) end.setHours(0, 0, 0, 0);
      return checkDate >= start && (end ? checkDate <= end : checkDate <= start);
    });
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 md:px-0 animate-in fade-in duration-500 pb-20">
      {/* SaaS Multi-Tenant Banner & Tenant Switcher */}
      <div className="bg-[#161b22] p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-12 w-auto object-contain max-w-[120px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg"
                style={{ backgroundColor: brandColor }}
              >
                {company.name.charAt(0) || '⚡'}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Active Tenant: {company.name}
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                company.subscriptionStatus === 'active'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-blue-950 text-blue-400 border border-blue-800'
              }`}>
                {company.subscriptionTier.toUpperCase()} ({company.subscriptionStatus.toUpperCase()})
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter">
              {isSuperAdmin ? 'Operations Command' : 'Field Technician Portal'}
            </h2>
            <p className="text-xs text-slate-400">
              Logged in as <span className="text-white font-bold">{currentOperator.name || currentOperator.email}</span> ({isSuperAdmin ? '👑 Super Admin' : '🔧 Field Tech'})
            </p>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2">


          {isSuperAdmin && onOpenSubscription && (
            <button
              onClick={onOpenSubscription}
              className="bg-[#0d1117] hover:bg-slate-800 text-amber-400 hover:text-amber-300 px-3.5 py-2.5 rounded-2xl border border-slate-700 transition flex items-center gap-2 text-xs font-bold"
            >
              <span>💳 SaaS Billing</span>
            </button>
          )}

          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="bg-[#0d1117] hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 px-3.5 py-2.5 rounded-2xl border border-slate-700 transition flex items-center gap-2 text-xs font-bold"
            >
              <span>💎 TaskMaster Pricing</span>
            </button>
          )}

          <button
            onClick={() => onNewJob('quote')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-wider transition active:scale-95 flex items-center gap-1.5"
          >
            <span>+ Quote</span>
          </button>

          <button
            onClick={onOpenAI}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-wider shadow-lg shadow-blue-900/30 active:scale-95 transition flex items-center gap-2"
          >
            <span>✨ AI Co-Pilot</span>
          </button>

          <button
            onClick={() => onNewJob('job')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-wider transition active:scale-95 flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
          >
            <span>+ New Job</span>
          </button>
        </div>
      </div>

      {/* Account Past Due Warning (Simulated Locking Slot) */}
      {company.subscriptionStatus === 'past_due' && (
        <div className="bg-red-950/60 border border-red-500 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-sm font-black text-red-200 uppercase tracking-tight">Subscription Payment Past Due!</p>
              <p className="text-xs text-red-300/80">Account access restricted to read-only until payment is renewed via PayFast or Stripe.</p>
            </div>
          </div>
          {onOpenSubscription && (
            <button
              onClick={onOpenSubscription}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-red-950/80 transition"
            >
              Reactivate Subscription →
            </button>
          )}
        </div>
      )}

      {/* Emergency Alert Banner (if any) */}
      {metrics.emergencies > 0 && (
        <div className="bg-red-950/40 border border-red-500/50 p-4 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-black">
              ⚡
            </div>
            <div>
              <p className="text-sm font-black text-red-300 uppercase tracking-tight">
                {metrics.emergencies} Emergency Callout{metrics.emergencies > 1 ? 's' : ''} Active!
              </p>
              <p className="text-xs text-red-400/80">Immediate attention required on critical site safety</p>
            </div>
          </div>
          <button
            onClick={() => setFilterCategory('OPEN')}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-950/50"
          >
            View Urgent
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Shift Card */}
        <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden ${
          isWorking ? 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-500/5' : 'bg-[#161b22] border-slate-800 shadow-xl'
        }`}>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">My Shift Status</p>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-3 h-3 rounded-full ${isWorking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
              <p className={`text-2xl font-black italic tracking-tight ${isWorking ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isWorking ? 'ON DUTY' : 'OFF DUTY'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onClockIn}
                disabled={isWorking}
                className={`py-2 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all active:scale-95 ${
                  !isWorking
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 hover:bg-emerald-500'
                    : 'bg-slate-800/80 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                Clock In
              </button>
              <button
                onClick={onClockOut}
                disabled={!isWorking}
                className={`py-2 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all active:scale-95 ${
                  isWorking
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/30 hover:bg-red-500'
                    : 'bg-slate-800/80 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                Clock Out
              </button>
            </div>
          </div>
        </div>

        {/* Pending Dispatch */}
        <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800/80 shadow-xl hover:border-amber-500/30 transition-all group">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-300">Pending Dispatch</p>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <p className="text-4xl font-black italic tracking-tight text-amber-400 my-1">{metrics.open}</p>
          <p className="text-[11px] text-slate-500 font-medium">Ready for tech assignment</p>
        </div>

        {/* Active On-Site */}
        <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800/80 shadow-xl hover:border-blue-500/30 transition-all group">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-300">Active On-Site</p>
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          </div>
          <p className="text-4xl font-black italic tracking-tight text-blue-400 my-1">{metrics.working}</p>
          <p className="text-[11px] text-slate-500 font-medium">Technicians currently on site</p>
        </div>

        {/* Financial Revenue (Super Admin) or My Jobs (Technician) */}
        {isSuperAdmin ? (
          <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800/80 shadow-xl hover:border-emerald-500/30 transition-all group">
            <div className="flex justify-between items-start mb-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-300">Total Invoiced</p>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-3xl font-black italic tracking-tight text-white my-1 font-mono">
              {currencySymbol} {metrics.totalInvoiced.toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>{metrics.unpaidCount} Unpaid ({currencySymbol} {metrics.totalUnpaid.toLocaleString()})</span>
              <span className="text-emerald-400 font-bold">{metrics.paidCount} Paid</span>
            </div>
          </div>
        ) : (
          <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800/80 shadow-xl hover:border-purple-500/30 transition-all group">
            <div className="flex justify-between items-start mb-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-300">My Assigned Jobs</p>
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            </div>
            <p className="text-4xl font-black italic tracking-tight text-purple-400 my-1">{metrics.myJobsCount}</p>
            <p className="text-[11px] text-slate-500 font-medium">{metrics.myWorkingCount} in progress now</p>
          </div>
        )}
      </div>

      {/* Calendar Operations Matrix */}
      <div className="bg-[#161b22] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
        <header className="px-6 sm:px-8 py-5 bg-[#0d1117]/60 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider italic">
              Dispatch Schedule — {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-xs font-bold text-slate-300 hover:text-white border border-slate-800"
            >
              Today
            </button>
            <button onClick={prevMonth} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition">
              ◀
            </button>
            <button onClick={nextMonth} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition">
              ▶
            </button>
          </div>
        </header>

        <div className="overflow-x-auto custom-scrollbar">
          <div className="grid grid-cols-7 min-w-[700px] gap-px bg-slate-800/40">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="bg-[#161b22] py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
            {calendarDays.map((date, idx) => {
              const dateJobs = getJobsForDate(date);
              const isToday = date && date.toDateString() === new Date().toDateString();
              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 bg-[#161b22] hover:bg-[#1c232e] transition group border-r border-b border-slate-800/30 ${
                    !date ? 'opacity-10' : ''
                  } ${isToday ? 'bg-blue-950/20' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    {date && (
                      <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${
                        isToday ? 'bg-blue-600 text-white' : 'text-slate-400 group-hover:text-white'
                      }`}>
                        {date.getDate()}
                      </span>
                    )}
                    {dateJobs.length > 0 && (
                      <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow">
                        {dateJobs.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dateJobs.slice(0, 3).map(job => (
                      <div
                        key={job.id}
                        onClick={(e) => { e.stopPropagation(); onSelectJob(job.id); }}
                        className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg truncate border cursor-pointer active:scale-95 transition flex items-center justify-between ${
                          job.priority === 'EMERGENCY'
                            ? 'bg-red-950/60 text-red-300 border-red-700/60 animate-pulse'
                            : job.status === 'DONE'
                              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30 opacity-60'
                              : job.status === 'WORKING'
                                ? 'bg-blue-900/40 text-blue-300 border-blue-800/50'
                                : 'bg-amber-900/30 text-amber-300 border-amber-900/40'
                        }`}
                      >
                        <span className="truncate">{job.clientId}</span>
                        {job.priority === 'EMERGENCY' && <span className="text-red-400 font-bold ml-1">⚡</span>}
                      </div>
                    ))}
                    {dateJobs.length > 3 && (
                      <span className="text-[8px] text-slate-500 font-bold block text-center">
                        +{dateJobs.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Active Schedule & Fast Callout Actions */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">
              Today's Field Roster &amp; Active Job Cards
            </h3>
          </div>
          {/* Filters */}
          <div className="flex gap-1 bg-[#161b22] p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
            {['ALL', 'OPEN', 'WORKING', 'DONE'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider transition ${
                  filterCategory === cat ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todaysJobs.map(job => (
            <div
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className="bg-[#161b22] p-6 rounded-3xl border border-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer group shadow-xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">{job.jobNumber}</span>
                <div className="flex items-center gap-1.5">
                  {job.priority === 'EMERGENCY' && (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white tracking-widest animate-pulse">
                      EMERGENCY
                    </span>
                  )}
                  <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border tracking-widest ${
                    job.status === 'DONE' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' :
                    job.status === 'WORKING' ? 'bg-blue-900/40 text-blue-400 border-blue-800/50' :
                    'bg-amber-900/40 text-amber-400 border-amber-800/50'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>

              <h4 className="text-base font-black text-white uppercase truncate group-hover:text-blue-400 transition-colors">
                {job.clientId}
              </h4>
              <p className="text-xs text-slate-400 truncate mt-1 italic font-medium">{job.location || 'Site address pending'}</p>

              {job.category && (
                <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  {job.category}
                </span>
              )}

              {/* Quick Communication Links & Directions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {job.phone && (
                    <a
                      href={`tel:${job.phone}`}
                      className="p-2 rounded-xl bg-[#0d1117] hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 transition"
                      title="Call Client"
                    >
                      📞
                    </a>
                  )}
                  {job.phone && (
                    <a
                      href={`https://wa.me/${job.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${job.clientId}, this is ${company.name} regarding job ${job.jobNumber}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#0d1117] hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 border border-slate-800 transition"
                      title="WhatsApp Client"
                    >
                      💬
                    </a>
                  )}
                  {job.location && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#0d1117] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                      title="Open in Google Maps"
                    >
                      🗺️
                    </a>
                  )}
                </div>

                <span className="text-blue-400 font-bold text-[11px] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Manage Job Card →
                </span>
              </div>
            </div>
          ))}

          {todaysJobs.length === 0 && (
            <div className="col-span-full py-14 text-center bg-[#161b22]/50 border border-dashed border-slate-800 rounded-[2.5rem]">
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">No active jobs found for this filter</p>
              <button
                onClick={() => onNewJob('job')}
                className="mt-3 text-blue-400 hover:text-blue-300 font-bold text-xs uppercase tracking-wider"
              >
                + Dispatch New Job Card
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
