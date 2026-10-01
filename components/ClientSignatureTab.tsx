import React, { useRef, useState, useEffect } from 'react';
import { ClientSignature } from '../types';

interface ClientSignatureTabProps {
  clientSignature?: ClientSignature | null;
  clientName: string;
  clientPhone: string;
  clientLocation: string;
  jobNumber: string;
  workDescription: string;
  technician: string;
  companyName?: string;
  onSignatureChange: (signature: ClientSignature | null) => void;
}

const SIGNER_ROLES = [
  'Property Owner',
  'Site / Facilities Manager',
  'Tenant',
  'Authorized Representative',
  'Business Manager',
  'Other',
];

export const ClientSignatureTab: React.FC<ClientSignatureTabProps> = ({
  clientSignature,
  clientName,
  clientPhone,
  clientLocation,
  jobNumber,
  workDescription,
  technician,
  companyName,
  onSignatureChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  
  const [signerName, setSignerName] = useState(clientSignature?.signerName || clientName || '');
  const [signerRole, setSignerRole] = useState(clientSignature?.signerRole || 'Property Owner');
  const [signerPhone, setSignerPhone] = useState(clientSignature?.signerPhone || clientPhone || '');
  const [satisfactionRating, setSatisfactionRating] = useState<number>(clientSignature?.satisfactionRating || 5);
  const [comments, setComments] = useState(clientSignature?.comments || '');
  const [isAgreed, setIsAgreed] = useState(true);
  const [isEditingExisting, setIsEditingExisting] = useState(!clientSignature?.signatureDataUrl);

  // Sync state if clientSignature changes from props
  useEffect(() => {
    if (clientSignature) {
      setSignerName(clientSignature.signerName || clientName || '');
      setSignerRole(clientSignature.signerRole || 'Property Owner');
      setSignerPhone(clientSignature.signerPhone || clientPhone || '');
      setSatisfactionRating(clientSignature.satisfactionRating || 5);
      setComments(clientSignature.comments || '');
      setIsEditingExisting(!clientSignature.signatureDataUrl);
    } else {
      setSignerName(clientName || '');
      setSignerPhone(clientPhone || '');
      setIsEditingExisting(true);
    }
  }, [clientSignature, clientName, clientPhone]);

  // Canvas Setup
  useEffect(() => {
    if (!isEditingExisting) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust for high-DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a'; // Deep slate / navy ink
  }, [isEditingExisting]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSaveSignature = () => {
    if (!signerName.trim()) {
      alert('Please enter the name of the person signing.');
      return;
    }

    if (!isAgreed) {
      alert('Please accept the work completion acknowledgment.');
      return;
    }

    let signatureDataUrl = clientSignature?.signatureDataUrl;

    if (isEditingExisting) {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        alert('Please draw your signature in the signature box before saving.');
        return;
      }
      signatureDataUrl = canvas.toDataURL('image/png');
    }

    const newSignature: ClientSignature = {
      signerName: signerName.trim(),
      signerRole,
      signerPhone: signerPhone.trim(),
      signatureDataUrl,
      signedAt: clientSignature?.signedAt || new Date().toISOString(),
      satisfactionRating,
      comments: comments.trim(),
    };

    onSignatureChange(newSignature);
    setIsEditingExisting(false);
  };

  const handleRemoveSignature = () => {
    if (confirm('Are you sure you want to remove the client signature from this job card?')) {
      onSignatureChange(null);
      setHasDrawn(false);
      setIsEditingExisting(true);
    }
  };

  const isSigned = !!clientSignature?.signatureDataUrl;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`p-4 md:p-5 rounded-2xl border transition-all ${
        isSigned
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
          : 'bg-amber-950/20 border-amber-500/30 text-amber-400'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border ${
              isSigned
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
            }`}>
              {isSigned ? '✓' : '✍️'}
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white">
                {isSigned ? 'Client Sign-off Verified' : 'Awaiting Client Sign-off'}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isSigned
                  ? `Signed by ${clientSignature.signerName} (${clientSignature.signerRole || 'Client'}) on ${new Date(clientSignature.signedAt).toLocaleDateString()} at ${new Date(clientSignature.signedAt).toLocaleTimeString()}`
                  : 'Customer signature on site verifies service delivery & work satisfaction'}
              </p>
            </div>
          </div>

          {isSigned && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingExisting(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-700 transition"
              >
                Re-sign
              </button>
              <button
                type="button"
                onClick={handleRemoveSignature}
                className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-red-900/40 transition"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scope / Work Overview Card */}
      <div className="bg-[#0d1117] p-4 md:p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Job Scope for Review</span>
          <span className="text-[10px] font-mono font-black text-blue-400">{jobNumber || 'DRAFT TICKET'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Client / Site</span>
            <p className="font-bold text-white uppercase">{clientName || 'Client Pending'}</p>
            <p className="text-[10px] text-slate-400">{clientLocation || 'Physical Site Address'}</p>
          </div>
          <div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Assigned Staff / Tech</span>
            <p className="font-bold text-white">{technician || 'Field Operator'}</p>
            <p className="text-[10px] text-slate-400">{companyName || 'Universal Service Operations'}</p>
          </div>
          <div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Quality & Standards</span>
            <p className="font-bold text-emerald-400">100% Quality Inspected</p>
            <p className="text-[10px] text-slate-400">Completed to client specifications</p>
          </div>
        </div>

        {workDescription && (
          <div className="mt-2 pt-2 border-t border-slate-800/60">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Work Performed</span>
            <p className="text-[11px] text-slate-300 leading-relaxed bg-[#161b22] p-3 rounded-xl border border-slate-800/80 max-h-32 overflow-y-auto">
              {workDescription}
            </p>
          </div>
        )}
      </div>

      {/* Signature Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Signer Information & Rating */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0d1117] p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Signatory Particulars</h4>
            
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Signer Full Name *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="e.g. John Doe / Sarah Smith"
                className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Capacity / Role
                </label>
                <select
                  value={signerRole}
                  onChange={e => setSignerRole(e.target.value)}
                  className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500 transition"
                >
                  {SIGNER_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={signerPhone}
                  onChange={e => setSignerPhone(e.target.value)}
                  placeholder="082 123 4567"
                  className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Satisfaction Rating */}
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Work Satisfaction Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSatisfactionRating(star)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all ${
                      star <= satisfactionRating
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm scale-105'
                        : 'bg-[#161b22] text-slate-600 border border-slate-800 hover:text-slate-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-[10px] font-black uppercase text-amber-400 ml-1 tracking-wider">
                  {satisfactionRating === 5 ? 'Exceptional' : satisfactionRating === 4 ? 'Good' : satisfactionRating === 3 ? 'Satisfactory' : 'Needs Review'}
                </span>
              </div>
            </div>

            {/* Comments / Remarks */}
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Client Remarks / Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Any client notes regarding the installation or operation..."
                className="w-full bg-[#161b22] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500 resize-none transition"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Signature Pad or Existing Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0d1117] p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Client Digital Signature</h4>
                <p className="text-[9px] text-slate-500">Sign directly on screen with touch, stylus or mouse</p>
              </div>
              {isEditingExisting && (
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-700 transition"
                >
                  Clear Pad
                </button>
              )}
            </div>

            {/* Canvas or Image */}
            <div className="relative">
              {isEditingExisting ? (
                <div className="relative bg-white rounded-2xl border-2 border-dashed border-slate-400 overflow-hidden shadow-inner touch-none">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-52 cursor-crosshair block"
                    style={{ touchAction: 'none' }}
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                      <span className="text-2xl mb-1">✍️</span>
                      <span className="text-xs font-bold uppercase tracking-wider">Sign Here</span>
                      <span className="text-[9px] text-slate-400">Touch or drag with finger/stylus</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-4 right-4 pointer-events-none border-b border-slate-300 flex justify-between text-[8px] text-slate-400 font-mono">
                    <span>X__________________________</span>
                    <span>CUSTOMER WORK SIGN-OFF</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-slate-300 flex flex-col items-center justify-center min-h-[208px]">
                  <img
                    src={clientSignature?.signatureDataUrl}
                    alt="Client Signature"
                    className="max-h-36 object-contain"
                  />
                  <div className="mt-2 pt-2 border-t border-slate-200 w-full flex justify-between items-center text-[9px] text-slate-600 font-medium">
                    <span className="font-bold uppercase">{clientSignature?.signerName} ({clientSignature?.signerRole})</span>
                    <span>{new Date(clientSignature?.signedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Terms & Work Acceptance Checkbox */}
            <label className="flex items-start gap-2.5 p-3 bg-[#161b22] border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={e => setIsAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0"
              />
              <span className="text-[10px] text-slate-400 leading-snug select-none">
                I confirm that the service / work described above has been completed to my satisfaction and accepted in good order. Any parts, goods or services remain the property of <strong className="text-slate-200">{companyName || 'the service provider'}</strong> until invoices are settled in full.
              </span>
            </label>

            {/* Action Buttons */}
            {isEditingExisting && (
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveSignature}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/40 active:scale-95 transition flex items-center gap-2"
                >
                  <span>✓ Confirm & Attach Signature</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
