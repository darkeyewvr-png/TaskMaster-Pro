
import React, { useState, useEffect, useMemo } from 'react';
import { Client, Job } from '../types';

interface ClientListProps {
  clients: Client[];
  jobs?: Job[];
  onAddClient?: (client: Client) => void;
  onNewClient?: (clientData: any) => void;
  onUpdateClient?: (client: Client) => void;
  onDeleteClient?: (id: string) => void;
  onSelectClient: (id: string) => void;
  initialEditId?: string | null;
  onClearInitialEdit?: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ 
  clients = [], 
  jobs = [], 
  onAddClient, 
  onNewClient,
  onUpdateClient, 
  onDeleteClient, 
  onSelectClient,
  initialEditId,
  onClearInitialEdit
}) => {
  const safeJobs = useMemo(() => Array.isArray(jobs) ? jobs : [], [jobs]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialEditId) {
      const client = clients.find(c => c.id === initialEditId);
      if (client) {
        setEditingId(client.id);
        setFormData({ name: client.name, email: client.email, phone: client.phone, address: client.address });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      onClearInitialEdit?.();
    }
  }, [initialEditId, clients]);

  const filteredClients = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return clients;
    return clients.filter(c => 
      c.name.toLowerCase().includes(s) || 
      (c.email || '').toLowerCase().includes(s) || 
      (c.phone || '').toLowerCase().includes(s)
    );
  }, [clients, search]);

  const getClientStats = (clientName: string) => {
    const clientJobs = safeJobs.filter(j => j.clientId === clientName);
    const lastJob = clientJobs[0];
    return {
      total: clientJobs.length,
      lastDate: lastJob?.createdAt?.toDate ? lastJob.createdAt.toDate().toLocaleDateString() : (clientJobs.length > 0 ? 'Recent' : 'N/A'),
      jobNumbers: clientJobs.map(j => j.jobNumber).slice(0, 3).join(', ') + (clientJobs.length > 3 ? '...' : '')
    };
  };

  const handleEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setEditingId(client.id);
    setFormData({ name: client.name, email: client.email, phone: client.phone, address: client.address });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteClient) onDeleteClient(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      if (onUpdateClient) onUpdateClient({ id: editingId, ...formData });
    } else {
      if (onAddClient) onAddClient({ id: '', ...formData });
      else if (onNewClient) onNewClient(formData);
    }
    setFormData({ name: '', email: '', phone: '', address: '' });
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-1 md:px-0">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Client Directory</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Contact Records</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', email: '', phone: '', address: '' }); }}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition active:scale-95 w-full md:w-auto"
        >
          {showForm ? 'Close Form' : 'New Client'}
        </button>
      </div>

      <div className="bg-[#161b22] p-4 rounded-[2rem] border border-slate-800/60 shadow-xl">
        <div className="relative">
          <svg className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search clients by name, email or phone..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full bg-[#0d1117] border border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-[13px] text-white outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/40 transition-all placeholder:text-slate-700 font-medium"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#161b22] p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic">{editingId ? 'Edit Client Record' : 'Create New Record'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Client Full Name</label>
              <input required placeholder="Client Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-4 py-4 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Email Address</label>
              <input placeholder="Email Address (Optional)" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-4 py-4 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Phone Number</label>
              <input placeholder="Phone Number (Optional)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-4 py-4 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Site Address</label>
              <input placeholder="Site Address (Optional)" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-4 py-4 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3">
             <button type="submit" className={`flex-1 ${editingId ? 'bg-blue-600' : 'bg-emerald-600'} text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl`}>
              {editingId ? 'Update Record' : 'Add Client to Database'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-none px-8 bg-slate-800 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredClients.map(client => {
          const stats = getClientStats(client.name);
          return (
            <div key={client.id} onClick={() => onSelectClient(client.id)} className="bg-[#161b22] p-5 md:p-6 rounded-2xl border border-slate-800 shadow-xl group cursor-pointer hover:bg-[#1c232e] transition-all relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-blue-500 font-black text-lg shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-white uppercase text-sm truncate">{client.name}</h3>
                    <div className="flex gap-3 shrink-0 ml-2">
                      <button onClick={(e) => handleEdit(e, client)} className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">Edit</button>
                      <button onClick={(e) => handleDelete(e, client.id)} className="text-[9px] font-black text-red-900/60 hover:text-red-500 uppercase tracking-widest transition-colors">Delete</button>
                    </div>
                  </div>
                  <p className="text-slate-500 text-[9px] font-bold uppercase truncate">{client.email || 'NO EMAIL'}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold">{client.phone || 'NO PHONE'}</p>
                  <p className="text-[9px] text-slate-600 truncate italic">{client.address || 'NO ADDRESS'}</p>
                </div>
                
                <div className="bg-[#0d1117] p-3 rounded-xl border border-slate-800/50 space-y-2">
                   <div className="flex justify-between text-[8px] font-black uppercase">
                     <span className="text-slate-600">Total Jobs</span>
                     <span className="text-blue-500">{stats.total}</span>
                   </div>
                   <div className="flex justify-between text-[8px] font-black uppercase">
                     <span className="text-slate-600">Last Visit</span>
                     <span className="text-white">{stats.lastDate}</span>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredClients.length === 0 && search && (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">No clients found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientList;
