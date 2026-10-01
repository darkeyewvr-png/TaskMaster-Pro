
import React from 'react';
import { Job } from '../types';

interface ClientHistoryProps {
  clientId: string;
  jobs?: Job[];
  onSelectJob: (id: string, type: 'job' | 'quote' | 'invoice') => void;
  onBack: () => void;
}

const ClientHistory: React.FC<ClientHistoryProps> = ({ clientId, jobs = [], onSelectJob, onBack }) => {
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  // Fixed: Use clientId which matches the property on the Job interface
  const clientJobs = safeJobs.filter(j => j.clientId === clientId);
  
  // Use quoteId, invoiceId and correct JobStatus enum values
  const actualJobs = clientJobs.filter(j => (!j.quoteId && !j.invoiceId) || j.status === 'WORKING' || j.status === 'OPEN');
  const quotes = clientJobs.filter(j => !!j.quoteId);
  const invoices = clientJobs.filter(j => !!j.invoiceId);

  // Job schema currently does not support lineItems; setting total to 0 to satisfy UI
  const totalSpent = 0;
  const activeJobsCount = actualJobs.length;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{clientId}</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Comprehensive History & Financials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161b22] p-6 rounded-2xl border border-slate-800 shadow-xl">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Billing</p>
           <p className="text-3xl font-black text-emerald-500 italic">R {totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-[#161b22] p-6 rounded-2xl border border-slate-800 shadow-xl">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Projects</p>
           <p className="text-3xl font-black text-blue-500 italic">{activeJobsCount}</p>
        </div>
        <div className="bg-[#161b22] p-6 rounded-2xl border border-slate-800 shadow-xl">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Documents</p>
           <p className="text-3xl font-black text-amber-500 italic">{quotes.length + invoices.length}</p>
        </div>
      </div>

      <div className="space-y-12">
        {/* Jobs Table */}
        <section className="space-y-4">
          <h3 className="text-sm font-black text-blue-500 uppercase italic tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Work Logs
          </h3>
          <div className="bg-[#161b22] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-[#0d1117] text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Job #</th>
                  <th className="px-6 py-4">Title / Category</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {actualJobs.map(job => (
                  <tr key={job.id} onClick={() => onSelectJob(job.id, 'job')} className="hover:bg-[#1c2128] cursor-pointer transition">
                    <td className="px-6 py-4 text-xs font-black text-blue-400">{job.jobNumber || 'PENDING'}</td>
                    {/* Use category as title property does not exist on Job interface */}
                    <td className="px-6 py-4 text-xs font-bold text-white uppercase">{job.category}</td>
                    {/* Correctly handle Firestore Timestamp conversion */}
                    <td className="px-6 py-4 text-[10px] text-slate-500 font-bold">{job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString() : 'RECENT'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[8px] font-black bg-blue-900/30 text-blue-400 uppercase tracking-widest">
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {actualJobs.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-700 italic font-bold text-[10px] uppercase">No active job logs</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quotes Table */}
        <section className="space-y-4">
          <h3 className="text-sm font-black text-amber-500 uppercase italic tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Quotation History
          </h3>
          <div className="bg-[#161b22] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-[#0d1117] text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Quote #</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {quotes.map(job => (
                  <tr key={job.id} onClick={() => onSelectJob(job.id, 'quote')} className="hover:bg-[#1c2128] cursor-pointer transition">
                    {/* Use quoteId instead of quoteNumber */}
                    <td className="px-6 py-4 text-xs font-black text-amber-500">{job.quoteId}</td>
                    {/* Use category as title property does not exist on Job interface */}
                    <td className="px-6 py-4 text-xs font-bold text-white uppercase">{job.category}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-400 font-mono">
                      R 0
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-0.5 rounded text-[8px] font-black bg-amber-900/30 text-amber-400 uppercase tracking-widest">
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {quotes.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-700 italic font-bold text-[10px] uppercase">No quotes on file</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Invoices Table */}
        <section className="space-y-4">
          <h3 className="text-sm font-black text-emerald-500 uppercase italic tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Invoice Archives
          </h3>
          <div className="bg-[#161b22] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-[#0d1117] text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoices.map(job => (
                  <tr key={job.id} onClick={() => onSelectJob(job.id, 'invoice')} className="hover:bg-[#1c2128] cursor-pointer transition">
                    {/* Use invoiceId instead of invoiceNumber */}
                    <td className="px-6 py-4 text-xs font-black text-emerald-500">{job.invoiceId}</td>
                    {/* Use category as title property does not exist on Job interface */}
                    <td className="px-6 py-4 text-xs font-bold text-white uppercase">{job.category}</td>
                    <td className="px-6 py-4 text-xs font-black text-emerald-400 font-mono">
                      R 0
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-0.5 rounded text-[8px] font-black bg-emerald-900/30 text-emerald-400 uppercase tracking-widest">
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-700 italic font-bold text-[10px] uppercase">No billing history found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ClientHistory;
