import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Job, BillingDocument, Client, Service, StockTake } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs?: Job[];
  quotes?: BillingDocument[];
  invoices?: BillingDocument[];
  clients?: Client[];
  services?: Service[];
  stockTakes?: StockTake[];
  onNavigate?: (view: any, id?: string, type?: string) => void;
  onSelectJob?: (id: string, type?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  jobs = [],
  quotes = [],
  invoices = [],
  clients = [],
  services = [],
  stockTakes = [],
  onNavigate,
  onSelectJob,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAction = (viewType: string, id?: string, docType?: string) => {
    if (onNavigate) {
      onNavigate(viewType, id, docType);
    } else if (onSelectJob && id) {
      onSelectJob(id, docType);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const list: Array<{
      category: 'Job' | 'Invoice' | 'Quote' | 'Client' | 'Service' | 'Stock Take';
      title: string;
      subtitle: string;
      tag?: string;
      tagColor?: string;
      action: () => void;
    }> = [];

    // Search Jobs
    (jobs || []).forEach(job => {
      if (
        (job.jobNumber || '').toLowerCase().includes(q) ||
        (job.clientId || '').toLowerCase().includes(q) ||
        (job.location || '').toLowerCase().includes(q) ||
        (job.category || '').toLowerCase().includes(q) ||
        (job.notes || '').toLowerCase().includes(q) ||
        (job.description || '').toLowerCase().includes(q)
      ) {
        list.push({
          category: 'Job',
          title: `${job.jobNumber || 'JOB'} — ${job.clientId || 'Client'}`,
          subtitle: `${job.category || 'General'} • ${job.location || 'No site address'}`,
          tag: job.status,
          tagColor: job.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' : job.status === 'WORKING' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400',
          action: () => {
            handleAction('job-edit', job.id, 'job');
            onClose();
          }
        });
      }
    });

    // Search Invoices
    (invoices || []).forEach(inv => {
      const docNum = inv.invoiceNumber || inv.documentNumber || '';
      if (
        docNum.toLowerCase().includes(q) ||
        (inv.clientId || '').toLowerCase().includes(q) ||
        (inv.address || '').toLowerCase().includes(q) ||
        (inv.narrative || '').toLowerCase().includes(q)
      ) {
        list.push({
          category: 'Invoice',
          title: `${docNum} — ${inv.clientId}`,
          subtitle: `Total: R ${(inv.total || 0).toLocaleString()} • ${inv.address || 'Address pending'}`,
          tag: inv.isPaid ? 'PAID' : 'UNPAID',
          tagColor: inv.isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400',
          action: () => {
            handleAction('invoice-edit', inv.id, 'invoice');
            onClose();
          }
        });
      }
    });

    // Search Quotes
    (quotes || []).forEach(qte => {
      const docNum = qte.documentNumber || '';
      if (
        docNum.toLowerCase().includes(q) ||
        (qte.clientId || '').toLowerCase().includes(q) ||
        (qte.address || '').toLowerCase().includes(q) ||
        (qte.narrative || '').toLowerCase().includes(q)
      ) {
        list.push({
          category: 'Quote',
          title: `${docNum} — ${qte.clientId}`,
          subtitle: `Estimated: R ${(qte.total || 0).toLocaleString()} • ${qte.address || 'Site pending'}`,
          tag: 'QUOTE',
          tagColor: 'bg-blue-500/20 text-blue-400',
          action: () => {
            handleAction('quote-edit', qte.id, 'quote');
            onClose();
          }
        });
      }
    });

    // Search Clients
    (clients || []).forEach(client => {
      if (
        (client.name || '').toLowerCase().includes(q) ||
        (client.email || '').toLowerCase().includes(q) ||
        (client.phone || '').toLowerCase().includes(q) ||
        (client.address || '').toLowerCase().includes(q)
      ) {
        list.push({
          category: 'Client',
          title: client.name,
          subtitle: `${client.phone || 'No phone'} • ${client.address || 'No address'}`,
          tag: 'CLIENT',
          tagColor: 'bg-purple-500/20 text-purple-400',
          action: () => {
            handleAction('client-detail', client.id);
            onClose();
          }
        });
      }
    });

    // Search Services
    (services || []).forEach(serv => {
      if (
        (serv.description || '').toLowerCase().includes(q) ||
        (serv.type || '').toLowerCase().includes(q)
      ) {
        list.push({
          category: 'Service',
          title: serv.description,
          subtitle: `Rate: R ${serv.price.toLocaleString()} • Type: ${serv.type}`,
          tag: serv.type,
          tagColor: serv.type === 'LABOUR' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400',
          action: () => {
            handleAction('services');
            onClose();
          }
        });
      }
    });

    // Search Stock Takes
    (stockTakes || []).forEach(st => {
      if (
        (st.vehicleId || '').toLowerCase().includes(q) ||
        (st.notes || '').toLowerCase().includes(q) ||
        (st.items || []).some(i => (i.description || '').toLowerCase().includes(q))
      ) {
        list.push({
          category: 'Stock Take',
          title: `${st.vehicleId || 'Vehicle Stock'} (${st.items.length} items)`,
          subtitle: `Notes: ${st.notes || 'Routine check'} • By: ${st.createdBy}`,
          tag: 'INVENTORY',
          tagColor: 'bg-emerald-500/20 text-emerald-400',
          action: () => {
            onNavigate('stock-take-edit', st.id);
            onClose();
          }
        });
      }
    });

    return list.slice(0, 15);
  }, [query, jobs, invoices, quotes, clients, services, stockTakes, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-start justify-center p-4 pt-16 md:pt-24 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#161b22] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center gap-3 bg-[#0d1117]/60">
          <svg className="w-6 h-6 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search jobs, quotes, invoices, clients, stock items, or rates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-500 text-base md:text-lg font-medium outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <kbd className="hidden md:inline-block px-2.5 py-1 text-[10px] font-mono font-bold text-slate-400 bg-slate-800 rounded-lg border border-slate-700">ESC</kbd>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Command Search</p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-sm mx-auto">
                Type client name, job number, address, phone number, circuit part, or invoice code.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm font-bold text-slate-400">No matching records found for "{query}"</p>
              <p className="text-xs text-slate-600 mt-1">Try searching by client name, job code, or phone number</p>
            </div>
          ) : (
            results.map((res, idx) => (
              <button
                key={idx}
                onClick={res.action}
                className="w-full text-left p-3.5 rounded-2xl bg-[#0d1117]/50 hover:bg-[#1f2937] border border-slate-800/80 hover:border-blue-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 shrink-0 border border-slate-700">
                    {res.category}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {res.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {res.subtitle}
                    </p>
                  </div>
                </div>
                {res.tag && (
                  <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0 ml-3 tracking-widest border border-current/20 ${res.tagColor}`}>
                    {res.tag}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-[#0d1117] border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-medium px-6">
          <span>Universal Operations Index</span>
          <span>Press ESC or click outside to close</span>
        </div>
      </div>
    </div>
  );
};
