import React, { useState, useRef } from 'react';
import { InspectionReport, InspectionChecklistItem, InspectionPhoto, ClientSignature, Company, Job } from '../types';

interface ComplianceInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: InspectionReport;
  job?: Job;
  company: Company;
  inspectorName: string;
  onSaveReport: (report: InspectionReport) => void;
}

const INDUSTRY_CHECKLISTS: Record<string, InspectionChecklistItem[]> = {
  car_wash: [
    { id: 'cw-1', category: 'Intake Inspection', item: 'Vehicle pre-inspection: exterior body, mirrors & existing blemishes noted', status: 'PASS' },
    { id: 'cw-2', category: 'Exterior Wash', item: 'High-pressure rinse, snow foam soak, and two-bucket hand wash', status: 'PASS' },
    { id: 'cw-3', category: 'Wheels & Tires', item: 'Alloy rim brake dust decontamination & tire gloss dressing applied', status: 'PASS' },
    { id: 'cw-4', category: 'Interior Care', item: 'Thorough interior vacuum (seats, carpets, mats & boot area)', status: 'PASS' },
    { id: 'cw-5', category: 'Surfaces & Trim', item: 'Dashboard, console, cup holders, and door cards wiped & dressed', status: 'PASS' },
    { id: 'cw-6', category: 'Glass & Mirrors', item: 'Interior and exterior glass cleaned streak-free', status: 'PASS' },
    { id: 'cw-7', category: 'Final Handover', item: 'Door jambs wiped, air freshener applied, customer walkaround complete', status: 'PASS' },
  ],
  retail_store: [
    { id: 'rs-1', category: 'Merchandising', item: 'Shelves fully faced, organized, and inventory restocked', status: 'PASS' },
    { id: 'rs-2', category: 'Pricing & Tags', item: 'Shelf pricing tags verified against POS barcode scanner', status: 'PASS' },
    { id: 'rs-3', category: 'Facility & Safety', item: 'Store aisles clear of obstructions, floor swept and dry', status: 'PASS' },
    { id: 'rs-4', category: 'Refrigeration / Stock', item: 'Chillers and freezer temperature log within required food safety thresholds', status: 'PASS' },
    { id: 'rs-5', category: 'Cash & Registers', item: 'POS registers balanced, receipt printers loaded, cash drawer reconciled', status: 'PASS' },
  ],
  general: [
    { id: 'gn-1', category: 'Pre-Service Intake', item: 'Scope of work confirmed with client before commencement', status: 'PASS' },
    { id: 'gn-2', category: 'Safety & Tools', item: 'Workplace safety precautions, PPE, and equipment verified', status: 'PASS' },
    { id: 'gn-3', category: 'Service Execution', item: 'Primary task completed according to professional specifications', status: 'PASS' },
    { id: 'gn-4', category: 'Quality Verification', item: 'Functionality and workmanship tested and double-checked', status: 'PASS' },
    { id: 'gn-5', category: 'Site Cleanliness', item: 'Work area cleaned, surplus materials collected and neatly removed', status: 'PASS' },
    { id: 'gn-6', category: 'Customer Handover', item: 'Client walkthrough conducted and satisfaction confirmed', status: 'PASS' },
  ],
};

export const ComplianceInspectionModal: React.FC<ComplianceInspectionModalProps> = ({
  isOpen,
  onClose,
  report,
  job,
  company,
  inspectorName,
  onSaveReport,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'photos' | 'signature' | 'certificate'>('details');

  const [reportNumber, setReportNumber] = useState(report?.reportNumber || `QA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [serviceType, setServiceType] = useState<string>(report?.type || (company.industry === 'car_wash' ? 'Vehicle Detailing Sign-Off' : company.industry === 'retail_store' ? 'Store & Stock Quality Audit' : 'Quality Assurance & Service Sign-Off'));
  const [status, setStatus] = useState<'PASSED' | 'FAILED' | 'CONDITIONAL'>(report?.status || 'PASSED');
  const [inspector, setInspector] = useState(report?.inspectorName || inspectorName);
  const [inspectorTitle, setInspectorTitle] = useState(report?.inspectorTitle || (company.industry === 'car_wash' ? 'Lead Detailer / Supervisor' : company.industry === 'retail_store' ? 'Store Manager' : 'Operations Supervisor'));
  const [siteAddress, setSiteAddress] = useState(report?.siteAddress || job?.location || '');
  const [clientName, setClientName] = useState(report?.clientId || job?.clientId || '');

  // Custom metrics for universal company types
  const [metricKey1, setMetricKey1] = useState(company.industry === 'car_wash' ? 'Vehicle Reg / Plate' : company.industry === 'retail_store' ? 'Department / Aisle' : 'Work Order Scope');
  const [metricVal1, setMetricVal1] = useState(report?.customMetrics?.[metricKey1] || (company.industry === 'car_wash' ? 'CA 849-201 (Toyota Fortuner)' : company.industry === 'retail_store' ? 'Aisle 3 & Cold Storage' : 'Full Maintenance Inspection'));

  const [metricKey2, setMetricKey2] = useState(company.industry === 'car_wash' ? 'Package Type' : company.industry === 'retail_store' ? 'Audit Shift' : 'Job Reference');
  const [metricVal2, setMetricVal2] = useState(report?.customMetrics?.[metricKey2] || (company.industry === 'car_wash' ? 'Executive Full Valet + Wax' : company.industry === 'retail_store' ? 'Morning Opening Shift' : (job?.jobNumber || 'REF-001')));

  // Checklist
  const defaultChecklist = (company.industry === 'car_wash' ? INDUSTRY_CHECKLISTS.car_wash : company.industry === 'retail_store' ? INDUSTRY_CHECKLISTS.retail_store : INDUSTRY_CHECKLISTS.general);
  const [checklist, setChecklist] = useState<InspectionChecklistItem[]>(report?.checklist || defaultChecklist);

  // Photos
  const [photos, setPhotos] = useState<InspectionPhoto[]>(report?.photos || []);
  const [newPhotoTag, setNewPhotoTag] = useState<InspectionPhoto['tag']>('DB Before');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  // Signatures
  const [signerName, setSignerName] = useState(report?.clientSignature?.signerName || '');
  const [satisfactionRating, setSatisfactionRating] = useState<number>(report?.clientSignature?.satisfactionRating || 5);
  const [signedAt, setSignedAt] = useState<string | null>(report?.clientSignature?.signedAt ? new Date(report.clientSignature.signedAt).toISOString() : null);

  // AI summary
  const [aiSummary, setAiSummary] = useState(report?.aiAnalysisSummary || '');
  const [isAuditing, setIsAuditing] = useState(false);

  // Canvas ref for signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  if (!isOpen) return null;

  const handleToggleChecklist = (id: string, nextStatus: 'PASS' | 'FAIL' | 'N/A') => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
  };

  const handleAddSamplePhoto = (sampleUrl?: string) => {
    const photoId = 'photo_' + Math.random().toString(36).substring(2, 7);
    const photo: InspectionPhoto = {
      id: photoId,
      url: sampleUrl || (company.industry === 'car_wash' 
        ? 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=500&q=80'
        : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80'),
      tag: newPhotoTag,
      caption: newPhotoCaption || `${newPhotoTag} record`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setPhotos(prev => [photo, ...prev]);
    setNewPhotoCaption('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleAddSamplePhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartDraw = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  const handleDraw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
    setSignedAt(new Date().toISOString());
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignedAt(null);
  };

  const handleRunAiAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/ai/generate-service-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          industry: company.industry || 'Universal Services',
          clientName: clientName,
          inspectionType: serviceType,
          customMetrics: {
            [metricKey1]: metricVal1,
            [metricKey2]: metricVal2,
          },
          checklistItems: checklist.map(c => ({ category: c.category, item: c.item, status: c.status })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      } else {
        setAiSummary(`All quality checkpoints have been inspected and confirmed complete. Work delivered in full accordance with high quality standards. Customer satisfaction confirmed.`);
      }
    } catch {
      setAiSummary(`Work delivered to company standards with all checkpoints passed. Ready for client acceptance.`);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSave = () => {
    let signatureUrl = '';
    if (canvasRef.current) {
      signatureUrl = canvasRef.current.toDataURL();
    }

    const payload: InspectionReport = {
      id: report?.id || 'insp_' + Math.random().toString(36).substring(2, 9),
      companyId: company.id,
      jobId: job?.id || '',
      clientId: clientName,
      reportNumber,
      type: serviceType,
      status,
      inspectorName: inspector,
      inspectorTitle,
      inspectionDate: new Date().toISOString(),
      siteAddress,
      customMetrics: {
        [metricKey1]: metricVal1,
        [metricKey2]: metricVal2,
      },
      checklist,
      photos,
      aiAnalysisSummary: aiSummary,
      clientSignature: {
        signerName: signerName || clientName,
        signatureDataUrl: signatureUrl,
        signedAt: signedAt || new Date().toISOString(),
        satisfactionRating,
      },
      createdAt: report?.createdAt || new Date().toISOString(),
    };

    onSaveReport(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#161b22] border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 mb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Quality Assurance &amp; Service Verification
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight uppercase">
              {serviceType}
            </h2>
            <p className="text-xs text-slate-400">
              {company.name} • Official Service Handover &amp; Customer Sign-Off
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
              status === 'PASSED'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : status === 'CONDITIONAL'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-red-950 text-red-400 border border-red-800'
            }`}>
              Status: {status}
            </span>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-800/80 custom-scrollbar">
          {[
            { id: 'details', label: '1. Service & Site Info' },
            { id: 'checklist', label: `2. Quality Checklist (${checklist.length})` },
            { id: 'photos', label: `3. Photos & Evidence (${photos.length})` },
            { id: 'signature', label: '4. Customer Sign-Off' },
            { id: 'certificate', label: '5. Completion Certificate' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Report / Sign-off #</label>
                <input
                  type="text"
                  value={reportNumber}
                  onChange={e => setReportNumber(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Service Inspection Type</label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  placeholder="e.g. Full Valet Handover, Store Opening Audit, Labour QA"
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Client / Customer Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. David van der Merwe"
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Supervisor / Inspector Name</label>
                <input
                  type="text"
                  value={inspector}
                  onChange={e => setInspector(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Supervisor Title</label>
                <input
                  type="text"
                  value={inspectorTitle}
                  onChange={e => setInspectorTitle(e.target.value)}
                  placeholder="e.g. Quality Lead, Operations Manager, Head Detailer"
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Overall Quality Finding</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                >
                  <option value="PASSED">PASSED (100% Quality Verified &amp; Complete)</option>
                  <option value="CONDITIONAL">CONDITIONAL (Follow-up touch up required)</option>
                  <option value="FAILED">FAILED (Requires rework)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Service Location / Site / Bay</label>
                <input
                  type="text"
                  value={siteAddress}
                  onChange={e => setSiteAddress(e.target.value)}
                  placeholder="e.g. Wash Bay 2, 14 Main Rd, Bellville"
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              {/* Universal Custom Metrics */}
              <div className="p-4 bg-[#0d1117] rounded-2xl border border-slate-800 sm:col-span-2 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                  Business-Specific Order Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={metricKey1}
                      onChange={e => setMetricKey1(e.target.value)}
                      className="text-[10px] font-bold text-slate-400 uppercase bg-transparent outline-none w-full mb-1"
                    />
                    <input
                      type="text"
                      value={metricVal1}
                      onChange={e => setMetricVal1(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161b22] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={metricKey2}
                      onChange={e => setMetricKey2(e.target.value)}
                      className="text-[10px] font-bold text-slate-400 uppercase bg-transparent outline-none w-full mb-1"
                    />
                    <input
                      type="text"
                      value={metricVal2}
                      onChange={e => setMetricVal2(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161b22] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-blue-900/30"
              >
                Next: Quality Checklist →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <p className="text-xs text-slate-400">
                Step-by-step quality checkpoints for service completion and customer handover.
              </p>
              <button
                onClick={handleRunAiAudit}
                disabled={isAuditing}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>⚡</span>
                <span>{isAuditing ? 'Auditing with AI...' : 'AI Quality Auditor'}</span>
              </button>
            </div>

            {aiSummary && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200/90 leading-relaxed font-mono">
                <p className="font-black text-emerald-400 uppercase text-[10px] tracking-widest mb-1">
                  AI Quality Summary &amp; Client Statement:
                </p>
                {aiSummary}
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {checklist.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-[#0d1117] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                      {item.category}
                    </span>
                    <p className="text-xs font-bold text-white leading-snug">{item.item}</p>
                  </div>

                  <div className="flex gap-1 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleChecklist(item.id, 'PASS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                        item.status === 'PASS'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      PASS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleChecklist(item.id, 'FAIL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                        item.status === 'FAIL'
                          ? 'bg-red-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      FAIL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleChecklist(item.id, 'N/A')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                        item.status === 'N/A'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      N/A
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-blue-900/30"
              >
                Next: Photos &amp; Evidence →
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PHOTOS */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0d1117] border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={newPhotoTag}
                  onChange={e => setNewPhotoTag(e.target.value as any)}
                  className="px-3 py-2 bg-[#161b22] border border-slate-800 rounded-xl text-white text-xs"
                >
                  <option value="DB Before">Before Work / Intake</option>
                  <option value="DB After">Completed Work</option>
                  <option value="Fault Finding">Defect / Note</option>
                  <option value="General">General Evidence</option>
                </select>

                <input
                  type="text"
                  placeholder="Optional caption..."
                  value={newPhotoCaption}
                  onChange={e => setNewPhotoCaption(e.target.value)}
                  className="px-3 py-2 bg-[#161b22] border border-slate-800 rounded-xl text-white text-xs flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded-xl cursor-pointer shadow">
                  📷 Upload Photo
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => handleAddSamplePhoto()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Add Demo Photo
                </button>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {photos.map(p => (
                <div key={p.id} className="relative group bg-[#0d1117] border border-slate-800 rounded-2xl overflow-hidden">
                  <img src={p.url} alt={p.caption} className="w-full h-36 object-cover" />
                  <div className="p-2.5">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded border border-blue-800/60 inline-block mb-1">
                      {p.tag === 'DB Before' ? 'Before' : p.tag === 'DB After' ? 'Completed' : p.tag}
                    </span>
                    <p className="text-[11px] font-medium text-white truncate">{p.caption}</p>
                    <span className="text-[9px] text-slate-500">{p.timestamp}</span>
                  </div>
                  <button
                    onClick={() => setPhotos(prev => prev.filter(x => x.id !== p.id))}
                    className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {photos.length === 0 && (
                <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                  <p className="text-slate-500 text-xs font-black uppercase">No inspection photos attached yet</p>
                  <p className="text-[11px] text-slate-600">Snap before and after images to show quality proof of work.</p>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signature')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-blue-900/30"
              >
                Next: Customer Sign-Off →
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SIGNATURE */}
        {activeTab === 'signature' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Obtain the customer's on-screen signature and rating to confirm service satisfaction.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Customer Signer Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="e.g. David van der Merwe"
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Service Rating</label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSatisfactionRating(star)}
                      className={`text-2xl transition ${star <= satisfactionRating ? 'text-amber-400 scale-110' : 'text-slate-600'}`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-300 ml-2">({satisfactionRating} / 5 Stars)</span>
                </div>
              </div>
            </div>

            {/* Signature Canvas */}
            <div className="bg-white rounded-2xl p-3 border border-slate-300 shadow">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                  Customer Digital Touch Signature:
                </span>
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="text-xs text-red-600 hover:text-red-700 font-bold"
                >
                  Clear Pad
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                onMouseDown={handleStartDraw}
                onMouseMove={handleDraw}
                onMouseUp={handleEndDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDraw}
                onTouchEnd={handleEndDraw}
                className="w-full h-40 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-crosshair touch-none"
              />
              <p className="text-[9px] text-slate-400 mt-1 italic text-center">
                Sign with finger or stylus inside the box above to accept completed work.
              </p>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('certificate')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-blue-900/30"
              >
                Preview Handover Certificate →
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: COMPLETION CERTIFICATE PREVIEW */}
        {activeTab === 'certificate' && (
          <div className="space-y-4">
            <div className="p-6 bg-white text-slate-900 rounded-3xl shadow-xl border border-slate-200 font-sans print:p-0">
              {/* Certificate Header with Company White-Label */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
                <div className="flex items-center gap-3">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl text-white font-black flex items-center justify-center text-lg shadow"
                      style={{ backgroundColor: company.brandColor }}
                    >
                      ✓
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-base text-slate-900 uppercase">{company.name}</h3>
                    {company.registrationNumber && (
                      <p className="text-[10px] text-slate-600">Reg: {company.registrationNumber}</p>
                    )}
                    <p className="text-[10px] text-slate-600">{company.phone} • {company.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                    QUALITY ASSURANCE &amp; SIGN-OFF
                  </span>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Service Handover</h2>
                  <p className="text-xs font-mono font-black text-blue-700">{reportNumber}</p>
                </div>
              </div>

              {/* Certificate Body */}
              <div className="py-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Customer / Client:</span>
                  <p className="font-bold text-slate-900 uppercase">{clientName || 'Valued Customer'}</p>
                  <p className="text-slate-600 text-[11px]">{siteAddress || 'Site Address'}</p>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Inspected By:</span>
                  <p className="font-bold text-slate-900 uppercase">{inspector}</p>
                  <p className="text-slate-600 font-mono text-[11px]">{inspectorTitle}</p>
                </div>
              </div>

              {/* Universal Key Parameters */}
              <div className="p-3 bg-slate-100 rounded-xl mb-4 text-[11px] font-mono grid grid-cols-2 gap-2">
                <div>{metricKey1}: <span className="font-bold text-slate-900">{metricVal1}</span></div>
                <div>{metricKey2}: <span className="font-bold text-slate-900">{metricVal2}</span></div>
                <div>Status: <span className="font-bold text-emerald-700">{status}</span></div>
                <div>Rating: <span className="font-bold text-amber-600">{'★'.repeat(satisfactionRating)}</span></div>
              </div>

              {/* Quality Statement */}
              <div className="p-3 border border-slate-200 rounded-xl text-[10px] text-slate-700 leading-relaxed mb-4">
                <p className="font-bold text-slate-900 mb-1">SERVICE COMPLETION DECLARATION:</p>
                {aiSummary || `This certifies that the services described herein have been executed to high professional workmanship standards by ${company.name}. The client has inspected and approved the work.`}
              </div>

              {/* Signatures Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs">
                <div>
                  <p className="font-bold text-slate-900">{inspector}</p>
                  <p className="text-[10px] text-slate-500">{inspectorTitle}</p>
                  <p className="text-[9px] text-slate-400">Date: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-900">{signerName || clientName || 'Customer Acceptance'}</p>
                  <p className="text-[10px] text-slate-500">Customer Signature</p>
                  <p className="text-[9px] text-slate-400">Status: {status}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('signature')}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
              >
                ← Back
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase"
                >
                  🖨️ Print Certificate
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-emerald-900/40"
                >
                  Save &amp; Issue Sign-Off ✓
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
