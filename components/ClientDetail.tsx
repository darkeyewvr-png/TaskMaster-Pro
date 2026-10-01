import React from 'react';
import { Client, Job, BillingDocument } from '../types';

interface ClientDetailProps {
  client: Client;
  jobs?: Job[];
  quotes?: BillingDocument[];
  invoices?: BillingDocument[];
  onSelectJob: (id: string, type: 'job' | 'quote' | 'invoice') => void;
  onEditClient?: (client: Client) => void;
  onDeleteClient?: (id: string) => void;
  onBack: () => void;
}

const getStatusStyles = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('done')) return 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50';
  if (s.includes('working')) return 'bg-blue-900/30 text-blue-400 border border-blue-900/50';
  return 'bg-slate-800 text-slate-400 border border-slate-700';
};

const ClientDetail: React.FC<ClientDetailProps> = ({ 
  client, 
  jobs = [], 
  quotes = [], 
  invoices = [], 
  onSelectJob, 
  onEditClient, 
  onDeleteClient, 
  onBack 
}) => {
  // Use fuzzy matching for the client name to ensure documents show up even with minor formatting differences
  const normalize = (s: string) => (s || '').toLowerCase().trim();
  const clientNameNorm = normalize(client?.name || '');

  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const safeQuotes = Array.isArray(quotes) ? quotes : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  const linkedJobs = safeJobs.filter(j => normalize(j.clientId) === clientNameNorm);
  const linkedQuotes = safeQuotes.filter(q => normalize(q.clientId) === clientNameNorm);
  const linkedInvoices = safeInvoices.filter(i => normalize(i.clientId) === clientNameNorm);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">{client.name}</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-1">
              {client.email && <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{client.email}</span>}
              {client.phone && <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{client.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#161b22] p-6 rounded-2xl border border-slate-800 shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lifetime Jobs</p>
          <p className="text-3xl font-black text-blue-500 italic">{linkedJobs.length}</p>
        </div>
        <div className="bg-[#161b22] p-6 rounded-2xl border border-slate-800 shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Open Quotes</p>
          <p className="text-3xl font-black text-amber-500 italic">{linkedQuotes.length}</p>
        </div>
        <div className="bg-[#161b22] p-6 rounded-2xl border border-slate-800 shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Invoices</p>
          <p className="text-3xl font-black text-emerald-500 italic">{linkedInvoices.length}</p>
        </div>
      </div>

      <div className="space-y-12">
        {/* Jobs Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Linked Work History
          </h3>
          <div className="bg-[#161b22] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0d1117] text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Job #</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {linkedJobs.map(job => (
                    <tr key={job.id} onClick={() => onSelectJob(job.id, 'job')} className="hover:bg-[#1c232e] cursor-pointer transition-colors group">
                      <td className="px-6 py-4 text-[10px] font-black text-blue-500 group-hover:text-blue-400">{job.jobNumber}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-white uppercase truncate max-w-xs">{job.category || 'General Service'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${getStatusStyles(job.status)}`}>{job.status}</span>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-slate-500 font-bold uppercase">{job.startDate?.toDate ? job.startDate.toDate().toLocaleDateString() : 'RECENT'}</td>
                    </tr>
                  ))}
                  {linkedJobs.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-700 italic font-black text-[10px] uppercase tracking-widest">No job records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Quotes Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
            Quotation Logs
          </h3>
          <div className="bg-[#161b22] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0d1117] text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Quote #</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {linkedQuotes.map(q => (
                    <tr key={q.id} onClick={() => onSelectJob(q.id!, 'quote')} className="hover:bg-[#1c232e] cursor-pointer transition-colors group">
                      <td className="px-6 py-4 text-[10px] font-black text-amber-500 group-hover:text-amber-400">{q.documentNumber}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-white uppercase truncate max-w-xs">{q.materials?.[0]?.description || q.narrative || 'Service Quote'}</td>
                      <td className="px-6 py-4 text-[10px] text-slate-500 font-bold uppercase">{q.date?.toDate ? q.date.toDate().toLocaleDateString() : 'RECENT'}</td>
                      <td className="px-6 py-4 text-[11px] font-black text-white text-right font-mono">R {q.total?.toLocaleString() || '0.00'}</td>
                    </tr>
                  ))}
                  {linkedQuotes.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-700 italic font-black text-[10px] uppercase tracking-widest">No quotation history found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Invoices Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Billing Archive
          </h3>
          <div className="bg-[#161b22] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0d1117] text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {linkedInvoices.map(i => (
                    <tr key={i.id} onClick={() => onSelectJob(i.id!, 'invoice')} className="hover:bg-[#1c232e] cursor-pointer transition-colors group">
                      <td className="px-6 py-4 text-[10px] font-black text-emerald-500 group-hover:text-emerald-400">{i.invoiceNumber || i.documentNumber}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-white uppercase truncate max-w-xs">{i.materials?.[0]?.description || i.narrative || 'Commercial Invoice'}</td>
                      <td className="px-6 py-4 text-[10px] text-slate-500 font-bold uppercase">{i.date?.toDate ? i.date.toDate().toLocaleDateString() : 'RECENT'}</td>
                      <td className="px-6 py-4 text-[11px] font-black text-white text-right font-mono">R {i.total?.toLocaleString() || '0.00'}</td>
                    </tr>
                  ))}
                  {linkedInvoices.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-700 italic font-black text-[10px] uppercase tracking-widest">No billing records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-neutral-800 flex flex-col md:flex-row md:justify-end gap-3 no-print">
         <button onClick={onBack} className="w-full md:w-auto px-10 py-5 rounded-xl bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Return to Directory</button>
         <button onClick={() => onEditClient(client)} className="w-full md:w-auto bg-blue-600 text-white px-10 py-5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/40 active:scale-95 transition-all">Edit Client Profile</button>
         <button onClick={() => onDeleteClient(client.id)} className="w-full md:w-auto bg-red-950/40 text-red-500 border border-red-900/50 px-10 py-5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Delete Client</button>
      </div>
    </div>
  );
};

export default ClientDetail;
