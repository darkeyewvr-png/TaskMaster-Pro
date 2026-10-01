import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Job, BillingDocument, BillingLineItemMaterial, BillingLineItemLabour, Client, Service, Company } from '../types';
import PrintableDocument from './PrintableDocument';
import { draftBillingItems } from '../services/geminiService';

interface DocumentDetailProps {
  mode: 'quote' | 'invoice';
  jobs?: Job[];
  clients?: Client[];
  services?: Service[];
  existingDoc?: BillingDocument;
  initialData?: any;
  company?: Company;
  onSave: (doc: BillingDocument) => void;
  onCancel: () => void;
  onConvertToInvoice?: () => void;
}

const DocumentDetail: React.FC<DocumentDetailProps> = ({
  mode,
  jobs,
  clients,
  services,
  existingDoc,
  initialData,
  company,
  onSave,
  onCancel,
  onConvertToInvoice,
}) => {
  const [jobId, setJobId] = useState(existingDoc?.jobId || initialData?.jobId || '');
  const [clientId, setClientId] = useState(existingDoc?.clientId || initialData?.clientId || '');
  const [narrative, setNarrative] = useState(existingDoc?.narrative || initialData?.narrative || '');
  const [activeTab, setActiveTab] = useState<'info' | 'inventory' | 'labour' | 'terms'>('info');
  const [showLibrary, setShowLibrary] = useState(false);

  const [materials, setMaterials] = useState<BillingLineItemMaterial[]>(
    existingDoc?.materials || initialData?.materials || [{ description: '', qty: 1, unitPrice: 0, amount: 0 }]
  );
  const [labour, setLabour] = useState<BillingLineItemLabour[]>(
    existingDoc?.labour || initialData?.labour || [{ description: '', hours: 1, rate: 0, amount: 0 }]
  );

  const [contactDetails, setContactDetails] = useState(existingDoc?.contactDetails || initialData?.contactDetails || '');
  const [address, setAddress] = useState(existingDoc?.address || initialData?.address || '');
  const [customerVat, setCustomerVat] = useState(existingDoc?.customerVat || initialData?.customerVat || '');

  // VAT & Payment features
  const [includeVat, setIncludeVat] = useState<boolean>(existingDoc?.includeVat ?? false);
  const [discount, setDiscount] = useState<number>(existingDoc?.discount || 0);
  const [isPaid, setIsPaid] = useState<boolean>(existingDoc?.isPaid ?? false);
  const [paymentMethod, setPaymentMethod] = useState<'EFT' | 'Cash' | 'Card' | 'SnapScan'>(existingDoc?.paymentMethod || 'EFT');
  const [paymentTerms, setPaymentTerms] = useState<string>(
    existingDoc?.paymentTerms && !existingDoc.paymentTerms.toLowerCase().includes('7')
      ? existingDoc.paymentTerms
      : ''
  );

  const [isAiDrafting, setIsAiDrafting] = useState(false);

  const selectedJob = useMemo(() => (jobs || []).find(j => j.id === jobId), [jobId, jobs]);

  useEffect(() => {
    if (jobId && !existingDoc && !initialData) {
      if (selectedJob) {
        setClientId(selectedJob.clientId);
        if (!contactDetails) setContactDetails(selectedJob.phone || '');
        if (!address) setAddress(selectedJob.location || '');
        if (selectedJob.description) setNarrative(selectedJob.description);
      }
    }
  }, [jobId, jobs, existingDoc, initialData, selectedJob]);

  const subtotalMaterials = useMemo(() => materials.reduce((sum, item) => sum + (item.amount || 0), 0), [materials]);
  const subtotalLabour = useMemo(() => labour.reduce((sum, item) => sum + (item.amount || 0), 0), [labour]);
  const subtotal = subtotalMaterials + subtotalLabour;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const vatAmount = includeVat ? discountedSubtotal * 0.15 : 0;
  const grandTotal = discountedSubtotal + vatAmount;

  const updateMaterial = (index: number, field: keyof BillingLineItemMaterial, value: any) => {
    const newItems = [...materials];
    const item = { ...newItems[index], [field]: value };
    if (field === 'qty' || field === 'unitPrice') item.amount = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
    newItems[index] = item;
    setMaterials(newItems);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateLabour = (index: number, field: keyof BillingLineItemLabour, value: any) => {
    const newItems = [...labour];
    const item = { ...newItems[index], [field]: value };
    if (field === 'hours' || field === 'rate') item.amount = (Number(item.hours) || 0) * (Number(item.rate) || 0);
    newItems[index] = item;
    setLabour(newItems);
  };

  const removeLabour = (index: number) => {
    setLabour(labour.filter((_, i) => i !== index));
  };

  const addFromLibrary = (service: Service) => {
    if (service.type === 'LABOUR') {
      setLabour([...labour, { description: service.description, hours: 1, rate: service.price, amount: service.price }]);
      setActiveTab('labour');
    } else {
      setMaterials([...materials, { description: service.description, qty: 1, unitPrice: service.price, amount: service.price }]);
      setActiveTab('inventory');
    }
    setShowLibrary(false);
  };

  const handleLinkClient = (id: string) => {
    if (!id) return;
    const client = clients.find(c => c.id === id);
    if (client) {
      setClientId(client.name);
      setContactDetails(client.phone || '');
      setAddress(client.address || '');
      if (client.vatNumber) setCustomerVat(client.vatNumber);
    }
  };

  const handleAIDraft = async () => {
    if (!narrative) {
      alert("Please enter a work narrative or job description first.");
      return;
    }
    setIsAiDrafting(true);
    try {
      const draft = await draftBillingItems(narrative);
      if (draft.materials?.length) setMaterials(draft.materials);
      if (draft.labour?.length) setLabour(draft.labour);
      setActiveTab('inventory');
    } catch (e) {
      console.error(e);
      alert("Failed to draft billing items via AI. Check your internet connection.");
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleSave = () => {
    const docNumber = existingDoc?.documentNumber || existingDoc?.invoiceNumber || (mode === 'quote' ? `QTE-${Date.now().toString().slice(-4)}` : `INV-${Date.now().toString().slice(-4)}`);
    const docData: BillingDocument = {
      ...(existingDoc || {}),
      type: mode === 'quote' ? 'QUOTE' : 'INVOICE',
      jobId,
      clientId,
      date: existingDoc?.date || new Date(),
      materials,
      labour,
      subtotal,
      includeVat,
      vatRate: includeVat ? 15 : 0,
      vatAmount,
      discount,
      total: grandTotal,
      documentNumber: docNumber,
      invoiceNumber: mode === 'invoice' ? docNumber : existingDoc?.invoiceNumber,
      contactDetails,
      address,
      customerVat,
      narrative,
      isPaid: mode === 'invoice' ? isPaid : false,
      paymentMethod,
      paymentTerms,
      status: mode === 'invoice' ? (isPaid ? 'PAID' : 'UNPAID') : 'DRAFT',
    };
    onSave(docData);
  };

  const handleWhatsAppShare = () => {
    const docNum = existingDoc?.invoiceNumber || existingDoc?.documentNumber || (mode === 'quote' ? 'QUOTE DRAFT' : 'INVOICE DRAFT');
    let message = `⚡ *Basson Elektries (PTY) LTD*\n`;
    message += `📄 *${mode.toUpperCase()}: ${docNum}*\n`;
    message += `👤 *Client:* ${clientId || 'Client'}\n`;
    message += `📍 *Site:* ${address || 'On File'}\n\n`;
    message += `*Line Items:*\n`;

    materials.forEach(m => {
      if (m.description) message += `• ${m.qty}x ${m.description} - R ${m.amount.toLocaleString()}\n`;
    });
    labour.forEach(l => {
      if (l.description) message += `• ${l.hours}h Labour (${l.description}) - R ${l.amount.toLocaleString()}\n`;
    });

    if (discount > 0) message += `\n*Discount:* -R ${discount.toLocaleString()}\n`;
    if (includeVat) message += `*VAT (15%):* R ${vatAmount.toLocaleString()}\n`;
    message += `\n💰 *Total Due:* R ${grandTotal.toLocaleString()}\n`;
    
    if (mode === 'invoice') {
      message += `\n*Banking Details for EFT:*\nBank: FNB\nAccount: 63105432982\nBranch: 256655\nRef: ${docNum}\n`;
      if (paymentTerms && !paymentTerms.toLowerCase().includes('7')) {
        message += `*Payment Terms:* ${paymentTerms}\n`;
      }
    }

    message += `\nThank you for choosing Basson Elektries!`;
    
    const encoded = encodeURIComponent(message);
    const phoneClean = contactDetails.replace(/[^0-9]/g, '');
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-32 px-2 md:px-0">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center px-2 gap-3 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest ${
              mode === 'quote' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {mode === 'quote' ? 'Official Quotation' : 'Tax Invoice'}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              {existingDoc?.documentNumber || existingDoc?.invoiceNumber || 'NEW DRAFT'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter mt-1">
            {clientId || (mode === 'quote' ? 'New Quote Builder' : 'New Invoice Builder')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'quote' && onConvertToInvoice && (
            <button
              onClick={onConvertToInvoice}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition active:scale-95 flex items-center gap-2"
            >
              Convert to Invoice →
            </button>
          )}
          <button
            onClick={handleWhatsAppShare}
            className="bg-[#25D366] hover:bg-[#20b859] text-white px-4 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>WhatsApp Client</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Tabs & Line Items on Left, Live Totals on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Left 2 Cols: Form Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex bg-[#161b22] p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'info' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Client & Details
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'inventory' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Materials ({materials.length})
            </button>
            <button
              onClick={() => setActiveTab('labour')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'labour' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Labour ({labour.length})
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'terms' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Payment & VAT
            </button>
          </div>

          {/* TAB 1: Info */}
          {activeTab === 'info' && (
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client Information</h3>
                <select
                  onChange={e => handleLinkClient(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white px-3 py-1.5 rounded-xl outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Link existing client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Client Name</label>
                  <input
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    placeholder="e.g. John Doe / Cape Flats Property"
                    className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Phone Number</label>
                  <input
                    value={contactDetails}
                    onChange={e => setContactDetails(e.target.value)}
                    placeholder="082 123 4567"
                    className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Site Address</label>
                  <input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="12 Main Road, Bellville"
                    className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Customer VAT No (Optional)</label>
                  <input
                    value={customerVat}
                    onChange={e => setCustomerVat(e.target.value)}
                    placeholder="4910238491"
                    className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Work Scope / Scope of Services</label>
                  <button
                    type="button"
                    onClick={handleAIDraft}
                    disabled={isAiDrafting}
                    className="text-[9px] font-black uppercase text-amber-400 hover:text-amber-300 flex items-center gap-1 transition disabled:opacity-50"
                  >
                    {isAiDrafting ? 'Drafting...' : '✨ AI Auto-Estimate Line Items'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={narrative}
                  onChange={e => setNarrative(e.target.value)}
                  placeholder="Describe work or service to be performed..."
                  className="w-full bg-[#0d1117] border border-slate-800 rounded-2xl p-4 text-xs text-white outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Materials */}
          {activeTab === 'inventory' && (
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Materials & Parts</h3>
                  <p className="text-[10px] text-slate-500">Add breakers, cable, conduits, switches, and solar accessories</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLibrary(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                  >
                    + From Rates Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterials([...materials, { description: '', qty: 1, unitPrice: 0, amount: 0 }])}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded-xl transition"
                  >
                    + Add Custom Part
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {materials.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 bg-[#0d1117] p-3 rounded-2xl border border-slate-800 items-center">
                    <input
                      type="text"
                      placeholder="Item description (e.g. 20A CBI Breaker, 100m 2.5mm² Surfix)"
                      value={item.description}
                      onChange={e => updateMaterial(idx, 'description', e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white outline-none px-2"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.qty || ''}
                        onChange={e => updateMaterial(idx, 'qty', Number(e.target.value))}
                        className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-center outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Price (R)"
                        value={item.unitPrice || ''}
                        onChange={e => updateMaterial(idx, 'unitPrice', Number(e.target.value))}
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-right font-mono outline-none"
                      />
                      <span className="text-xs font-mono font-bold text-white w-24 text-right">
                        R {(item.amount || 0).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMaterial(idx)}
                        className="text-slate-600 hover:text-red-400 p-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {materials.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-6">No materials added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Labour */}
          {activeTab === 'labour' && (
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Professional Labour & Call-out</h3>
                  <p className="text-[10px] text-slate-500">Hourly technical rates, COC inspection fees, and callouts</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLibrary(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                  >
                    + From Rates Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabour([...labour, { description: 'Standard Labour / Service Fee', hours: 1, rate: 450, amount: 450 }])}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase rounded-xl transition"
                  >
                    + Add Labour
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {labour.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 bg-[#0d1117] p-3 rounded-2xl border border-slate-800 items-center">
                    <input
                      type="text"
                      placeholder="Service description (e.g. Master Electrician Labour / Fault Finding)"
                      value={item.description}
                      onChange={e => updateLabour(idx, 'description', e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white outline-none px-2"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        placeholder="Hours"
                        value={item.hours || ''}
                        onChange={e => updateLabour(idx, 'hours', Number(e.target.value))}
                        className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-center outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Rate (R)"
                        value={item.rate || ''}
                        onChange={e => updateLabour(idx, 'rate', Number(e.target.value))}
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-right font-mono outline-none"
                      />
                      <span className="text-xs font-mono font-bold text-white w-24 text-right">
                        R {(item.amount || 0).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLabour(idx)}
                        className="text-slate-600 hover:text-red-400 p-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {labour.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-6">No labour entries added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Payment Terms & VAT */}
          {activeTab === 'terms' && (
            <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-5 animate-in fade-in duration-200">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Payment Terms & Tax Settings</h3>

              {/* VAT Switch */}
              <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Apply South African VAT (15%)</p>
                  <p className="text-xs text-slate-400">Calculate 15% value-added tax on subtotal</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeVat(!includeVat)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${includeVat ? 'bg-emerald-600' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform transform ${includeVat ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Discount */}
              <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Special Discount (Rands)</p>
                  <p className="text-xs text-slate-400">Direct deduction from document subtotal</p>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  className="w-32 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-right text-xs text-white font-mono outline-none"
                />
              </div>

              {/* Payment Method & Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="EFT">EFT (Bank Transfer)</option>
                    <option value="Cash">Cash on Delivery / On Site</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="SnapScan">SnapScan / QR Pay</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="">None / Not Specified</option>
                    <option value="Immediate">Immediate on Completion</option>
                    <option value="14 Days">14 Days Net</option>
                    <option value="30 Days">30 Days (Commercial)</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>

              {/* Paid Status Toggle (Invoice mode) */}
              {mode === 'invoice' && (
                <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Mark Invoice as PAID</p>
                    <p className="text-xs text-slate-400">Record full payment received into bank account</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPaid(!isPaid)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                      isPaid ? 'bg-emerald-600 text-white shadow-lg' : 'bg-red-950/40 text-red-400 border border-red-800/40'
                    }`}
                  >
                    {isPaid ? '✓ PAID IN FULL' : 'UNPAID'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Invoice Summary Card & Banking Details */}
        <div className="space-y-4">
          <div className="bg-[#161b22] p-6 rounded-3xl border border-slate-800 space-y-4 sticky top-6 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-3">
              Financial Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Materials Subtotal:</span>
                <span className="font-mono font-bold text-white">R {subtotalMaterials.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Labour Subtotal:</span>
                <span className="font-mono font-bold text-white">R {subtotalLabour.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">-R {discount.toLocaleString()}</span>
                </div>
              )}
              {includeVat && (
                <div className="flex justify-between text-slate-400">
                  <span>VAT (15%):</span>
                  <span className="font-mono font-bold text-white">R {vatAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-black uppercase text-white tracking-tight">Grand Total:</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  R {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Banking Details preview */}
            <div className="bg-[#0d1117] p-3.5 rounded-2xl border border-slate-800 text-[11px] space-y-1 text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">EFT Bank Account</span>
              <div className="flex justify-between"><span className="text-slate-500">Bank:</span><span className="font-bold text-white">FNB Cheque</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Account:</span><span className="font-mono font-bold text-white">63105432982</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Branch:</span><span className="font-mono text-white">256655</span></div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-blue-900/30 active:scale-95 transition"
              >
                Save {mode === 'quote' ? 'Quotation' : 'Invoice'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full bg-white hover:bg-slate-100 text-slate-950 py-3 rounded-2xl font-black uppercase text-xs tracking-wider transition"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#0d1117]/95 backdrop-blur-md border-t border-slate-800 z-[60] flex items-center justify-center px-4 no-print">
        <div className="max-w-6xl w-full flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase text-xs tracking-wider transition"
          >
            Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-emerald-400 hidden sm:inline-block">
              Total: R {grandTotal.toLocaleString()}
            </span>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg shadow-blue-900/30 transition"
            >
              Save Document
            </button>
          </div>
        </div>
      </div>

      {/* Service Rates Catalog Modal */}
      {showLibrary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-slate-700 rounded-3xl p-6 max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-black text-white uppercase italic">Services &amp; Labour Rates Catalog</h3>
                <p className="text-[10px] text-slate-400">Click to insert item into billing document</p>
              </div>
              <button onClick={() => setShowLibrary(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="overflow-y-auto space-y-2 flex-1 custom-scrollbar">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => addFromLibrary(s)}
                  className="w-full p-3 rounded-xl bg-[#0d1117] hover:bg-slate-800 border border-slate-800 text-left flex justify-between items-center group transition"
                >
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition">{s.description}</p>
                    <span className="text-[9px] text-slate-500 uppercase">{s.type}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">R {s.price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Printable PDF Portal */}
      {createPortal(
        <PrintableDocument
          company={company}
          data={{
            type: mode === 'quote' ? 'QUOTE' : 'INVOICE',
            companyId: company?.id || 'comp_basson_001',
            documentNumber: existingDoc?.documentNumber || existingDoc?.invoiceNumber || (mode === 'quote' ? 'QTE-DRAFT' : 'INV-DRAFT'),
            jobId,
            clientId,
            date: existingDoc?.date || new Date(),
            address,
            contactDetails,
            customerVat,
            narrative,
            materials,
            labour,
            total: grandTotal,
            subtotal,
            includeVat,
            vatAmount,
            discount,
            isPaid,
            paymentMethod,
            paymentTerms,
          }}
        />,
        document.getElementById('print-root')!
      )}
    </div>
  );
};

export default DocumentDetail;
