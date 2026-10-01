import React, { useState, useMemo } from 'react';
import { Job, UserRole, BillingDocument, Company } from '../types';
import EmptyState from './EmptyState';
import ListToolbar from './ListToolbar';

interface JobListProps {
  jobs: Job[];
  category: 'job-logs' | 'quotes' | 'invoices';
  quotes: BillingDocument[];
  invoices: BillingDocument[];
  company?: Company;
  onSelectJob: (id: string, type?: string) => void;
  onNewJob: (type: 'job' | 'quote' | 'invoice', initial?: any) => void;
  onDeleteJob?: (id: string) => void;
  onDeleteDoc?: (id: string, type: 'quotes' | 'invoices') => void;
  onTogglePaid?: (id: string, currentStatus: boolean) => void;
  userRole: UserRole;
  onAIImport?: () => void;
  onConvertQuoteToInvoice?: (id: string) => void;
}

const getStatusStyles = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('done') || s.includes('paid')) return 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50';
  if (s.includes('working')) return 'bg-blue-900/30 text-blue-400 border border-blue-900/50';
  return 'bg-slate-800 text-slate-400 border border-slate-700';
};

const parseAmount = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

const getInvoiceAmount = (inv: BillingDocument): number => {
  const directTotal = parseAmount(inv.total);
  if (directTotal > 0) return directTotal;
  const mat = (inv.materials || []).reduce((sum, item) => sum + parseAmount(item.amount || (Number(item.qty) * Number(item.unitPrice))), 0);
  const lab = (inv.labour || []).reduce((sum, item) => sum + parseAmount(item.amount || (Number(item.hours) * Number(item.rate))), 0);
  return mat + lab;
};

const formatCurrency = (val: number, symbol = 'R'): string => {
  return `${symbol} ` + (val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const JobList: React.FC<JobListProps> = ({ 
  jobs = [], 
  category, 
  quotes = [], 
  invoices = [], 
  company,
  onSelectJob, 
  onNewJob, 
  onDeleteJob, 
  onDeleteDoc, 
  onTogglePaid, 
  onAIImport, 
  userRole,
  onConvertQuoteToInvoice 
}) => {
  const safeJobs = useMemo(() => Array.isArray(jobs) ? jobs : [], [jobs]);
  const safeQuotes = useMemo(() => Array.isArray(quotes) ? quotes : [], [quotes]);
  const safeInvoices = useMemo(() => Array.isArray(invoices) ? invoices : [], [invoices]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const invoiceStats = useMemo(() => {
    if (category !== 'invoices') return null;

    let totalOutstanding = 0;
    let countOutstanding = 0;
    let totalPaid = 0;
    let countPaid = 0;
    let totalOverall = 0;
    const countOverall = invoices.length;

    invoices.forEach(inv => {
      const amount = getInvoiceAmount(inv);
      totalOverall += amount;
      if (inv.isPaid) {
        totalPaid += amount;
        countPaid += 1;
      } else {
        totalOutstanding += amount;
        countOutstanding += 1;
      }
    });

    return {
      totalOutstanding,
      countOutstanding,
      totalPaid,
      countPaid,
      totalOverall,
      countOverall
    };
  }, [invoices, category]);

  const statusOptions = useMemo(() => {
    if (category === 'job-logs') {
      return [
        { label: 'All Statuses', value: 'ALL' },
        { label: 'Open', value: 'OPEN' },
        { label: 'Working', value: 'WORKING' },
        { label: 'Done', value: 'DONE' }
      ];
    }
    if (category === 'invoices') {
      return [
        { label: invoiceStats ? `All Invoices (${formatCurrency(invoiceStats.totalOverall)})` : 'All Invoices', value: 'ALL' },
        { label: invoiceStats ? `Unpaid / Outstanding (${formatCurrency(invoiceStats.totalOutstanding)})` : 'Unpaid', value: 'UNPAID' },
        { label: invoiceStats ? `Paid Income (${formatCurrency(invoiceStats.totalPaid)})` : 'Paid', value: 'PAID' }
      ];
    }
    return [
      { label: 'All Documents', value: 'ALL' },
      { label: 'Standard', value: 'STD' },
      { label: 'File Uploads', value: 'FILE' }
    ];
  }, [category, invoiceStats]);

  const displayList = useMemo(() => {
    const s = search.toLowerCase();
    let filtered: any[] = [];
    
    if (category === 'job-logs') {
      filtered = safeJobs.map(j => ({ 
        ...j, 
        displayId: j.jobNumber, 
        title: j.clientId, 
        sub: j.location, 
        date: j.createdAt, 
        type: 'job',
        isSigned: !!j.clientSignature?.signatureDataUrl,
      }));
    } else if (category === 'quotes') {
      filtered = safeQuotes.map(q => ({ 
        ...q, 
        displayId: q.documentNumber, 
        title: q.clientId, 
        sub: q.type === 'file' ? (q.title || 'Attached Quote') : (q.total ? `R ${q.total.toLocaleString()}` : 'Value Pending'), 
        date: q.date, 
        type: q.type === 'file' ? 'file' : 'quote' 
      }));
    } else if (category === 'invoices') {
      filtered = safeInvoices.map(i => {
        const invAmount = getInvoiceAmount(i);
        return { 
          ...i, 
          displayId: i.invoiceNumber || i.documentNumber, 
          title: i.clientId, 
          sub: invAmount > 0 ? formatCurrency(invAmount, company?.currencySymbol || 'R') : (i.total ? `${company?.currencySymbol || 'R'} ${Number(i.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'Value Pending'), 
          date: i.date, 
          type: 'invoice',
          isPaid: i.isPaid || false,
          amountValue: invAmount
        };
      });
    }

    filtered = filtered.filter(item => 
      (item.title || '').toLowerCase().includes(s) ||
      (item.displayId || '').toLowerCase().includes(s) ||
      (item.sub || '').toLowerCase().includes(s)
    );

    if (statusFilter !== 'ALL') {
      if (category === 'job-logs') {
        filtered = filtered.filter(j => j.status === statusFilter);
      } else if (category === 'invoices') {
        filtered = filtered.filter(i => statusFilter === 'PAID' ? i.isPaid : !i.isPaid);
      } else {
        filtered = filtered.filter(d => statusFilter === 'FILE' ? d.type === 'file' : d.type !== 'file');
      }
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter(item => {
        const itemDate = item.date?.toDate ? item.date.toDate().getTime() : 0;
        return itemDate >= start;
      });
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      filtered = filtered.filter(item => {
        const itemDate = item.date?.toDate ? item.date.toDate().getTime() : 0;
        return itemDate <= end;
      });
    }

    if (category === 'job-logs') {
      const statusWeight: Record<string, number> = { 'DONE': 1, 'OPEN': 2, 'WORKING': 3 };
      filtered.sort((a, b) => {
        const weightA = statusWeight[a.status] || 99;
        const weightB = statusWeight[b.status] || 99;
        if (weightA !== weightB) return weightA - weightB;
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
        return dateB - dateA;
      });
    } else if (category === 'invoices') {
      filtered.sort((a, b) => {
        if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
        return dateB - dateA;
      });
    } else {
      filtered.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
        return dateB - dateA;
      });
    }

    return filtered;
  }, [jobs, quotes, invoices, search, category, statusFilter, startDate, endDate]);

  const handleActionClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (item.fileUrl) window.open(item.fileUrl, '_blank');
  };

  const handleDeleteClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (category === 'job-logs') onDeleteJob?.(item.id);
    else onDeleteDoc?.(item.id, category === 'quotes' ? 'quotes' : 'invoices');
  };

  const handleTogglePaidClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    onTogglePaid?.(item.id, !!item.isPaid);
  };

  const handleConvertQuoteToInvoiceClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    onConvertQuoteToInvoice?.(item.id);
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const labels = {
    'job-logs': { 
      singular: 'Job Record', 
      title: 'No Job Records Yet', 
      desc: 'Start tracking your field operations by creating a new job log.' 
    },
    'quotes': { 
      singular: 'Quote', 
      title: 'No Quotations Found', 
      desc: 'Create a professional quote or import an existing PDF to begin.' 
    },
    'invoices': { 
      singular: 'Invoice', 
      title: 'Billing History Empty', 
      desc: 'Generate your first invoice to keep track of completed work billing.' 
    }
  }[category];

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 md:px-0">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
            {category.replace('-', ' ')}
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Operational Records</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          {(category === 'quotes' || category === 'invoices') && (
            <button 
              onClick={onAIImport} 
              className="bg-[#1c232e] text-slate-400 border border-slate-800 px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all w-full md:w-auto hover:text-white hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              AI Import
            </button>
          )}
          <button 
            onClick={() => onNewJob(category === 'job-logs' ? 'job' : category === 'quotes' ? 'quote' : 'invoice')} 
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/40 active:scale-95 transition-all w-full md:w-auto"
          >
            New {labels.singular}
          </button>
        </div>
      </div>

      {category === 'invoices' && invoiceStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-2">
          {/* Outstanding / Unpaid Invoices Tab */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'UNPAID' ? 'ALL' : 'UNPAID')}
            className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
              statusFilter === 'UNPAID'
                ? 'bg-amber-950/30 border-amber-500/80 shadow-xl shadow-amber-950/40 ring-2 ring-amber-500/20'
                : 'bg-[#161b22] border-slate-800/80 hover:border-amber-500/40 hover:bg-[#1a202c]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${invoiceStats.countOutstanding > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                Outstanding Money
              </span>
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                statusFilter === 'UNPAID' 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20'
              }`}>
                {invoiceStats.countOutstanding} Unpaid
              </span>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-amber-400 tracking-tight font-mono">
                {formatCurrency(invoiceStats.totalOutstanding)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-between">
                <span>Awaiting Payment</span>
                {statusFilter === 'UNPAID' && (
                  <span className="text-amber-400 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Filtering Active
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Paid Income Tab */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'PAID' ? 'ALL' : 'PAID')}
            className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
              statusFilter === 'PAID'
                ? 'bg-emerald-950/30 border-emerald-500/80 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/20'
                : 'bg-[#161b22] border-slate-800/80 hover:border-emerald-500/40 hover:bg-[#1a202c]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Paid Income
              </span>
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                statusFilter === 'PAID' 
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20'
              }`}>
                {invoiceStats.countPaid} Paid
              </span>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-emerald-400 tracking-tight font-mono">
                {formatCurrency(invoiceStats.totalPaid)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-between">
                <span>Received Revenue</span>
                {statusFilter === 'PAID' && (
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Filtering Active
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Total Invoiced Tab */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-blue-950/30 border-blue-500/80 shadow-xl shadow-blue-950/40 ring-2 ring-blue-500/20'
                : 'bg-[#161b22] border-slate-800/80 hover:border-blue-500/40 hover:bg-[#1a202c]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Total Invoiced
              </span>
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                statusFilter === 'ALL' 
                  ? 'bg-blue-500 text-white font-black shadow-sm' 
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20'
              }`}>
                {invoiceStats.countOverall} Total
              </span>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-white tracking-tight font-mono">
                {formatCurrency(invoiceStats.totalOverall)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-between">
                <span>All Billing Records</span>
                {statusFilter === 'ALL' && (
                  <span className="text-blue-400 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    All Invoices
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      <ListToolbar 
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onReset={handleReset}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusOptions={statusOptions}
      />

      {displayList.length === 0 ? (
        <EmptyState 
          title={labels.title}
          description={labels.desc}
          primaryAction={{
            label: `New ${labels.singular}`,
            onClick: () => onNewJob(category === 'job-logs' ? 'job' : category === 'quotes' ? 'quote' : 'invoice')
          }}
          secondaryAction={category !== 'job-logs' ? {
            label: 'AI Import PDF',
            onClick: onAIImport!
          } : undefined}
        />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayList.map((item: any) => (
                <div key={item.id} onClick={() => item.type !== 'file' && onSelectJob(item.id, item.type)} className={`bg-[#161b22] p-6 rounded-3xl border border-slate-800 shadow-xl transition-all group ${item.type !== 'file' ? 'cursor-pointer hover:bg-[#1c232e] hover:border-slate-700' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${getStatusStyles(item.type === 'invoice' && item.isPaid ? 'paid' : (item.status || 'LOGGED'))}`}>
                        {item.type === 'invoice' ? (item.isPaid ? 'PAID' : 'UNPAID') : (item.status || (item.type === 'file' ? 'ATTACHED' : 'LOGGED'))}
                      </span>
                      {item.type === 'job' && item.isSigned && (
                        <span className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span>✓</span> Signed
                        </span>
                      )}
                    </div>
                    <span className="text-blue-500 text-[10px] font-black tracking-tighter">{item.displayId}</span>
                  </div>
                  <h3 className="text-[13px] font-black text-white uppercase truncate leading-tight">{item.title}</h3>
                  <p className="text-slate-500 text-[9px] font-bold uppercase truncate italic mt-1.5">{item.sub || 'NO DETAILS'}</p>
                  
                  {item.type === 'invoice' && (
                    <div className="mt-4">
                      <button 
                        onClick={(e) => handleTogglePaidClick(e, item)} 
                        className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${item.isPaid ? 'bg-emerald-900/10 text-emerald-500 border-emerald-900/30' : 'bg-red-900/20 text-red-500 border-red-900/50 hover:bg-red-900/40'}`}
                      >
                        {item.isPaid ? 'Payment Confirmed' : 'Paid'}
                      </button>
                    </div>
                  )}

                  {item.type === 'file' && (
                    <div className="mt-4">
                      <button 
                        onClick={(e) => handleActionClick(e, item)} 
                        className="w-full bg-[#0d1117] hover:bg-blue-600/10 hover:text-blue-400 text-slate-500 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-slate-800"
                      >
                        Open Attachment
                      </button>
                    </div>
                  )}

                  {item.type === 'quote' && (
                    <div className="mt-4">
                      <button 
                        onClick={(e) => handleConvertQuoteToInvoiceClick(e, item)} 
                        className="w-full bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-emerald-500/20 hover:border-transparent flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Convert to Invoice
                      </button>
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-slate-800/50 flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                      {item.date?.toDate ? item.date.toDate().toLocaleDateString() : 'RECENT'}
                    </div>
                    <button 
                      onClick={(e) => handleDeleteClick(e, item)} 
                      className="text-red-900/60 hover:text-red-500 transition-colors uppercase"
                      title="Delete Entry"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#161b22] rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#0d1117] border-b border-slate-800">
                    <tr className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      <th className="px-6 py-4">Identity</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Summary</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {displayList.map((item: any) => (
                      <tr 
                        key={item.id} 
                        onClick={() => item.type !== 'file' && onSelectJob(item.id, item.type)}
                        className={`hover:bg-[#1c232e] transition-colors group ${item.type !== 'file' ? 'cursor-pointer' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-white uppercase">{item.title}</span>
                            <span className="text-[9px] font-bold text-blue-500 tracking-tighter">{item.displayId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest ${getStatusStyles(item.type === 'invoice' && item.isPaid ? 'paid' : (item.status || 'LOGGED'))}`}>
                              {item.type === 'invoice' ? (item.isPaid ? 'PAID' : 'UNPAID') : (item.status || 'ATTACHED')}
                            </span>
                            {item.type === 'job' && item.isSigned && (
                              <span className="px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                                Signed ✓
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {item.date?.toDate ? item.date.toDate().toLocaleDateString() : 'RECENT'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px] inline-block">
                            {item.sub || '---'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {item.type === 'invoice' && (
                              <button 
                                onClick={(e) => handleTogglePaidClick(e, item)}
                                className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${item.isPaid ? 'bg-emerald-900/10 text-emerald-500 border border-emerald-900/30' : 'bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40'}`}
                              >
                                {item.isPaid ? 'Paid √' : 'Paid'}
                              </button>
                            )}
                            {item.type === 'quote' && (
                              <button 
                                onClick={(e) => handleConvertQuoteToInvoiceClick(e, item)}
                                className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 hover:border-transparent text-emerald-500 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                              >
                                Convert to Invoice
                              </button>
                            )}
                            {item.type === 'file' ? (
                              <button onClick={(e) => handleActionClick(e, item)} className="p-2 bg-[#0d1117] rounded-lg text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </button>
                            ) : (
                              <button className="p-2 bg-[#0d1117] rounded-lg text-slate-600 group-hover:text-blue-500 transition-all shadow-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            )}
                            <button onClick={(e) => handleDeleteClick(e, item)} className="p-2 bg-[#0d1117] rounded-lg text-red-900/60 hover:text-red-500 transition-all shadow-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobList;