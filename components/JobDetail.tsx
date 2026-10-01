import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Job, Client, JobPriority, JobChecklistItem, ClientSignature, Company, StaffUser } from '../types';
import { generateJobDescription } from '../services/geminiService';
import { ClientSignatureTab } from './ClientSignatureTab';

interface JobDetailProps {
  job?: Job;
  initialData?: any;
  clients: Client[];
  company?: Company;
  staffList?: StaffUser[];
  onOpenCompliance?: (job: Job) => void;
  onSave: (job: any) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  onConvertToDoc?: (type: 'quote' | 'invoice', data: any) => void;
}

const DEFAULT_CHECKLIST: JobChecklistItem[] = [
  { id: '1', label: 'Pre-Service Intake & Customer Scope Confirmed', completed: false },
  { id: '2', label: 'Core Work Order Executed to Quality Specifications', completed: false },
  { id: '3', label: 'Supplies, Parts & Materials Accounted For', completed: false },
  { id: '4', label: 'Work Area Cleaned & Surplus Debris Cleared', completed: false },
  { id: '5', label: 'Quality Handover & Customer Satisfaction Confirmed', completed: false },
];

const UNIVERSAL_CATEGORIES = [
  'Standard Service',
  'Wash & Valet / Detail',
  'Repair & Maintenance',
  'Installation & Assembly',
  'Stock Audit & Inventory',
  'Deep Clean & Sanitize',
  'Priority Emergency Callout',
  'General Labour',
  'Custom Order',
];

const JobDetail: React.FC<JobDetailProps> = ({
  job,
  initialData,
  clients,
  company,
  staffList = [],
  onOpenCompliance,
  onSave,
  onCancel,
  onDelete,
  onConvertToDoc,
}) => {
  const getLocalDateStr = (val: any) => {
    if (!val) return '';
    const date = val.toDate ? val.toDate() : new Date(val);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [activeTab, setActiveTab] = useState<'details' | 'sign'>('details');

  const [formData, setFormData] = useState({
    clientId: job?.clientId || initialData?.clientId || '',
    location: job?.location || initialData?.location || '',
    phone: job?.phone || initialData?.phone || '',
    email: job?.email || initialData?.email || '',
    category: job?.category || initialData?.category || 'Standard Service',
    priority: (job?.priority || initialData?.priority || 'MEDIUM') as JobPriority,
    startDate: getLocalDateStr(job?.startDate || initialData?.startDate) || new Date().toISOString().split('T')[0],
    endDate: getLocalDateStr(job?.endDate),
    notes: job?.notes || '',
    description: job?.description || '',
    technician: job?.technician || 'Field Operator',
    status: job?.status || 'OPEN',
    jobNumber: job?.jobNumber || '',
    checklist: job?.checklist || DEFAULT_CHECKLIST,
    clientSignature: (job?.clientSignature || null) as ClientSignature | null,
  });

  const [isAiLoading, setIsAiLoading] = useState(false);

  // Client selector helper
  const handleClientSelect = (clientName: string) => {
    const selected = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    if (selected) {
      setFormData(prev => ({
        ...prev,
        clientId: selected.name,
        location: selected.address || prev.location,
        phone: selected.phone || prev.phone,
        email: selected.email || prev.email,
      }));
    } else {
      setFormData(prev => ({ ...prev, clientId: clientName }));
    }
  };

  const handleAILog = async () => {
    if (!formData.description && !formData.notes) {
      alert("Please enter some brief notes first.");
      return;
    }
    setIsAiLoading(true);
    try {
      const polished = await generateJobDescription(formData.description || formData.notes);
      setFormData(prev => ({ ...prev, description: polished }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const handleSignatureUpdate = (signature: ClientSignature | null) => {
    setFormData(prev => ({
      ...prev,
      clientSignature: signature,
      // If signed, optionally update status to DONE if it was working
      status: signature && prev.status === 'OPEN' ? 'WORKING' : prev.status,
    }));
  };

  const handleWhatsAppShare = () => {
    const jobNum = formData.jobNumber || 'DRAFT';
    let message = `⚡ *Basson Elektries Job Ticket - ${jobNum}*\n`;
    message += `👤 *Client:* ${formData.clientId || 'Pending'}\n`;
    message += `📍 *Site:* ${formData.location || 'N/A'}\n`;
    message += `🚨 *Priority:* ${formData.priority}\n`;
    message += `🔧 *Category:* ${formData.category}\n`;
    message += `👷 *Technician:* ${formData.technician}\n`;
    message += `📊 *Status:* ${formData.status}\n`;
    message += `📅 *Date:* ${formData.startDate || 'TBD'}\n`;

    if (formData.clientSignature?.signatureDataUrl) {
      message += `✍️ *Client Sign-off:* Verified by ${formData.clientSignature.signerName} (${formData.clientSignature.signerRole || 'Client'}) on ${new Date(formData.clientSignature.signedAt).toLocaleDateString()}\n`;
      if (formData.clientSignature.satisfactionRating) {
        message += `⭐ *Client Rating:* ${'★'.repeat(formData.clientSignature.satisfactionRating)} (${formData.clientSignature.satisfactionRating}/5)\n`;
      }
    } else {
      message += `✍️ *Client Sign-off:* Pending\n`;
    }

    message += `\n📝 *Work Narrative:*\n${formData.description || 'Inspection underway.'}\n`;

    if (formData.notes) {
      message += `\n🔒 *Site Notes:*\n${formData.notes}`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleConvert = (type: 'quote' | 'invoice') => {
    if (onConvertToDoc) {
      onConvertToDoc(type, {
        clientId: formData.clientId,
        jobId: job?.id || '',
        narrative: formData.description || formData.notes,
        address: formData.location,
        contactDetails: formData.phone,
      });
    }
  };

  const isSigned = !!formData.clientSignature?.signatureDataUrl;

  const compName = company?.name || 'Universal Field & Labour Services';
  const compReg = company?.registrationNumber || '';
  const compVat = company?.vatNumber || '';
  const compPhone = company?.phone || '';
  const compEmail = company?.email || '';
  const compBrandColor = company?.brandColor || '#2563eb';

  const PrintableContent = () => (
    <div className="print-page text-slate-900 bg-white min-h-screen flex flex-col p-8 font-sans">
      <div className="flex justify-between items-start mb-6 border-b-2 border-slate-900 pb-6">
        <div className="flex gap-4 items-start">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={compName} className="h-16 w-auto object-contain max-w-[160px]" />
          ) : (
            <div
              className="w-16 h-16 text-white flex flex-col items-center justify-center rounded-xl p-2 font-black text-center leading-none"
              style={{ backgroundColor: compBrandColor }}
            >
              <span className="text-base">🏢</span>
              <span className="text-[9px] uppercase tracking-tighter mt-1">{compName.split(' ')[0]}</span>
            </div>
          )}
          <div className="text-[10px] leading-tight font-medium pt-1">
            <p className="font-black text-[13px] text-slate-900">{compName}</p>
            <p>{compPhone ? `${compPhone} | ` : ''}{compEmail}</p>
            <p>{company?.address || 'Operational Headquarters & Service Centre'}</p>
            <p className="text-slate-500 text-[9px] mt-0.5">
              {compReg ? `Reg: ${compReg} • ` : ''}{compVat ? `VAT: ${compVat} • ` : ''}Professional Service Standard
            </p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">Official Job Card</h1>
          <div className="text-[11px] font-mono font-bold text-blue-700">
            {formData.jobNumber || 'DRAFT'}
          </div>
          <div className="mt-1">
            <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-100 border border-slate-300 rounded">
              Priority: {formData.priority}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <h3 className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Client & Site Location</h3>
            <p className="font-black text-[13px] text-slate-900 uppercase">{formData.clientId || 'Client Pending'}</p>
            <p className="text-[10px] text-slate-600 font-medium">{formData.location || 'Location not specified'}</p>
            <p className="text-[10px] text-slate-600">Contact: {formData.phone || 'N/A'}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 pb-1">Work Narrative</h3>
            <div className="text-[10px] text-slate-800 leading-relaxed whitespace-pre-line min-h-[300px] bg-white p-3 border border-slate-200 rounded-xl">
              {formData.description || 'No work details logged.'}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Tracking & Assigned Tech</h3>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-semibold">Status:</span>
                <span className="font-bold text-blue-600">{formData.status}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-semibold">Category:</span>
                <span className="font-bold">{formData.category}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-semibold">Technician:</span>
                <span className="font-bold">{formData.technician}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-semibold">Date Started:</span>
                <span className="font-bold">{formData.startDate || 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Date Completed:</span>
                <span className="font-bold">{formData.endDate || 'IN PROGRESS'}</span>
              </div>
            </div>
          </div>

          {/* Universal Quality Checklist */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Service Quality &amp; Verification Checklist</h3>
            <div className="space-y-1.5">
              {formData.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-[9px]">
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center font-bold text-[8px] border ${
                    item.completed ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white border-slate-400 text-transparent'
                  }`}>
                    ✓
                  </span>
                  <span className={item.completed ? 'font-bold text-slate-900' : 'text-slate-600'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Sign-off & Quality Acceptance */}
          <div className="p-4 border border-slate-200 rounded-xl bg-white text-[8px] text-slate-500 leading-tight space-y-2">
            <p className="font-bold text-slate-800 uppercase mb-1">Customer Acceptance &amp; Quality Sign-Off</p>
            <p>All work delivered to professional standards. Workmanship guaranteed. Materials and products remain property of {compName} until paid in full.</p>
            
            <div className="pt-2 border-t border-slate-300 grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold block text-slate-700 uppercase tracking-wider text-[7px] mb-1">Customer Acceptance</span>
                {formData.clientSignature?.signatureDataUrl ? (
                  <div className="space-y-1">
                    <img
                      src={formData.clientSignature.signatureDataUrl}
                      alt="Customer Signature"
                      className="h-10 max-w-[140px] object-contain border-b border-slate-400 block"
                    />
                    <p className="font-black text-[9px] text-slate-900 uppercase">
                      {formData.clientSignature.signerName}
                    </p>
                    <p className="text-[7px] text-slate-600">
                      {formData.clientSignature.signerRole || 'Customer'} • {new Date(formData.clientSignature.signedAt).toLocaleDateString()}
                    </p>
                    {formData.clientSignature.satisfactionRating && (
                      <p className="text-[7px] text-amber-600 font-bold">
                        Rating: {'★'.repeat(formData.clientSignature.satisfactionRating)} ({formData.clientSignature.satisfactionRating}/5)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="h-12 flex items-end border-b border-slate-400 text-slate-400 italic text-[8px] pb-0.5">
                    Pending on-site customer sign-off
                  </div>
                )}
              </div>

              <div>
                <span className="font-bold block text-slate-700 uppercase tracking-wider text-[7px] mb-1">Lead Operator / Staff</span>
                <div className="h-10 flex items-end border-b border-slate-400 text-slate-900 font-bold text-[9px] uppercase pb-0.5">
                  {formData.technician || 'Staff Operator'}
                </div>
                <p className="text-[7px] text-slate-600 mt-1">Authorized Operations Staff</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
        Official Field Service Record • {compName}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32 px-2 md:px-0">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center px-2 gap-3 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest ${
              formData.priority === 'EMERGENCY' ? 'bg-red-600 text-white animate-pulse' :
              formData.priority === 'HIGH' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {formData.priority}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {formData.category}
            </span>
            {isSigned && (
              <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-[8px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest flex items-center gap-1">
                <span>✓</span> Signed
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mt-1">
            {formData.jobNumber || 'New Job Ticket'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {formData.location && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#161b22] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>Map Site</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('sign')}
            className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5"
            title="Collect customer digital signature & sign-off"
          >
            <span>✍️</span>
            <span>Client Sign-Off</span>
          </button>
          <button
            onClick={() => handleConvert('quote')}
            className="bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500/40 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition"
          >
            To Quote
          </button>
          <button
            onClick={() => handleConvert('invoice')}
            className="bg-slate-800 text-slate-300 border border-slate-700 hover:border-emerald-500/40 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition"
          >
            To Invoice
          </button>
          <button
            onClick={() => onSave(formData)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-900/30 flex items-center gap-1.5 active:scale-95 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>Save Ticket</span>
          </button>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-[#161b22] rounded-[2rem] p-6 md:p-8 border border-slate-800 shadow-2xl space-y-6 no-print">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-[#0d1117] rounded-2xl border border-slate-800 w-full sm:w-auto self-start">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
              activeTab === 'details'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Ticket Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sign')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
              activeTab === 'sign'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Client Sign</span>
            {isSigned ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Pending
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Ticket Details */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Client, Category, Narrative */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client & Site Information</h3>
              
              <div className="space-y-3">
                {/* Client Auto-select / Search */}
                <div className="bg-[#0d1117] border border-slate-800 rounded-2xl p-3.5 focus-within:border-blue-500 transition">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Client Name</label>
                  <input
                    list="clients-datalist"
                    value={formData.clientId}
                    onChange={e => handleClientSelect(e.target.value)}
                    placeholder="Select or enter client name"
                    className="w-full bg-transparent border-none text-sm text-white font-bold outline-none"
                  />
                  <datalist id="clients-datalist">
                    {clients.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                {/* Site Address */}
                <div className="bg-[#0d1117] border border-slate-800 rounded-2xl p-3.5 focus-within:border-blue-500 transition">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Site Location / Address</label>
                  <input
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Physical site address"
                    className="w-full bg-transparent border-none text-xs text-white outline-none"
                  />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0d1117] border border-slate-800 rounded-2xl p-3 focus-within:border-blue-500 transition">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Phone</label>
                    <input
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="082 123 4567"
                      className="w-full bg-transparent border-none text-xs text-white outline-none"
                    />
                  </div>
                  <div className="bg-[#0d1117] border border-slate-800 rounded-2xl p-3 focus-within:border-blue-500 transition">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Email</label>
                    <input
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="client@email.com"
                      className="w-full bg-transparent border-none text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Work Narrative */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Work Narrative / Fault Log</h3>
                  <button
                    type="button"
                    onClick={handleAILog}
                    disabled={isAiLoading}
                    className="text-[9px] font-black uppercase text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isAiLoading ? 'Polishing...' : '⚡ AI Polish Narrative'}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0d1117] border border-slate-800 rounded-2xl p-4 text-xs text-white focus:border-blue-500 outline-none resize-none leading-relaxed"
                  placeholder="Details of faults found, circuits repaired, components replaced..."
                />
              </div>
            </div>

            {/* Right Column: Priority, Category, Status, SANS Checklist */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operations & Safety Checklist</h3>

              {/* Status & Priority Row */}
              <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800 space-y-3">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Ticket Status</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['OPEN', 'WORKING', 'DONE'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: s })}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition tracking-wider ${
                          formData.status === s
                            ? s === 'DONE' ? 'bg-emerald-600 text-white shadow-lg' : s === 'WORKING' ? 'bg-blue-600 text-white shadow-lg' : 'bg-amber-600 text-white shadow-lg'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Priority Level</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['ROUTINE', 'MEDIUM', 'HIGH', 'EMERGENCY'] as JobPriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition tracking-wider ${
                          formData.priority === p
                            ? p === 'EMERGENCY' ? 'bg-red-600 text-white shadow-md shadow-red-950 animate-pulse' : p === 'HIGH' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category & Tech */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
                    >
                      {UNIVERSAL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Assigned Tech</label>
                    <input
                      value={formData.technician}
                      onChange={e => setFormData({ ...formData, technician: e.target.value })}
                      placeholder="Technician name"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Completed Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Service Quality Checklist Box */}
              <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block">
                  Service Quality & Scope Checklist
                </span>
                <div className="space-y-2">
                  {formData.checklist.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`w-full text-left p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition ${
                        item.completed
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-md flex items-center justify-center font-bold text-[10px] border shrink-0 ${
                        item.completed ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'border-slate-600'
                      }`}>
                        {item.completed ? '✓' : ''}
                      </span>
                      <span className="leading-snug">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Private Notes */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Internal Tech / Operator Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#0d1117] border border-slate-800 rounded-2xl p-3 text-xs text-white focus:border-blue-500 outline-none resize-none"
                  placeholder="Bay or shelf details, access codes, customer instructions, tool requirements..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Client Sign */}
        {activeTab === 'sign' && (
          <ClientSignatureTab
            clientSignature={formData.clientSignature}
            clientName={formData.clientId}
            clientPhone={formData.phone}
            clientLocation={formData.location}
            jobNumber={formData.jobNumber}
            workDescription={formData.description}
            technician={formData.technician}
            companyName={compName}
            onSignatureChange={handleSignatureUpdate}
          />
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 py-3 sm:py-4 bg-[#0d1117]/95 backdrop-blur-md border-t border-slate-800 z-[60] flex items-center justify-center px-3 sm:px-6 no-print">
        <div className="max-w-5xl w-full flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onCancel}
              className="px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl sm:rounded-2xl font-black uppercase text-[11px] sm:text-xs tracking-wider active:scale-95 transition flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            {job?.id && onDelete && (
              <button
                onClick={() => onDelete(job.id)}
                title="Delete Ticket"
                className="p-2.5 sm:px-4 sm:py-3 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-xl sm:rounded-2xl font-black uppercase text-[11px] sm:text-xs tracking-wider active:scale-95 transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end min-w-0">
            <button
              onClick={handleWhatsAppShare}
              title="Share via WhatsApp"
              className="bg-[#25D366] hover:bg-[#20b859] text-white p-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl font-black uppercase text-[11px] sm:text-xs tracking-wider shadow-lg active:scale-95 transition flex items-center gap-1.5 shrink-0"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={() => window.print()}
              title="Print Job Card"
              className="bg-white hover:bg-slate-100 text-slate-950 p-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl font-black uppercase text-[11px] sm:text-xs tracking-wider shadow-lg active:scale-95 transition flex items-center gap-1.5 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden md:inline">Print / PDF</span>
            </button>

            <button
              onClick={() => onSave(formData)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-7 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl shadow-blue-900/40 active:scale-95 transition flex items-center justify-center gap-1.5 flex-1 sm:flex-initial min-w-[120px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {createPortal(<PrintableContent />, document.getElementById('print-root')!)}
    </div>
  );
};

export default JobDetail;
