import React, { useState } from 'react';
import { diagnoseElectricalFaultAndQuote } from '../services/geminiService';

interface AIElectricalAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyEstimate: (data: {
    narrative: string;
    materials: Array<{ description: string; qty: number; unitPrice: number; amount: number }>;
    labour: Array<{ description: string; hours: number; rate: number; amount: number }>;
    category?: string;
  }) => void;
}

const PRESET_ISSUES = [
  { 
    label: '🚗 Car Wash & Auto Detailing', 
    text: 'Full exterior snow foam wash, hand dry, two-stage machine paint polish, ceramic sealant, tire shine, and deep interior upholstery shampoo.' 
  },
  { 
    label: '🏪 Store / Retail Restock & Shelf Setup', 
    text: 'Stock intake and barcoding for 120 inventory units, assembly of two heavy-duty display shelves, damaged floor tile repair, and cash register POS scanner setup.' 
  },
  { 
    label: '🧰 General Labour & Site Maintenance', 
    text: 'Commercial premises exterior cleanup, high-pressure water washing of paving, disposal of rubble/waste bags, and security gate latch realignment.' 
  },
  { 
    label: '🛠️ Equipment Service & Inspection', 
    text: 'Preventative quarterly maintenance on commercial high-pressure washer and vacuum systems, oil change, seal replacement, and nozzle inspection.' 
  },
  { 
    label: '🧹 Deep Clean & Commercial Hygiene', 
    text: 'Full commercial kitchen and floor deep scrub, chemical degreasing of extractors, surface sanitization, and restocking of hygiene dispensers.' 
  },
  { 
    label: '⚡ General Electrical & Lighting Callout', 
    text: 'Trace intermittent lighting circuit tripping, replace faulty 16A breaker, install two LED weather-proof floodlights, and test circuit load.' 
  },
];

export const AIElectricalAssistantModal: React.FC<AIElectricalAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyEstimate,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDiagnose = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await diagnoseElectricalFaultAndQuote(prompt);
      setDiagnosis(res);
    } catch (e: any) {
      setError(e.message || 'Failed to analyze work scope. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!diagnosis) return;
    onApplyEstimate({
      narrative: diagnosis.suggestedNarrative || diagnosis.summary,
      materials: diagnosis.materials || [],
      labour: diagnosis.labour || [],
      category: 'General Service',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#161b22] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-[#0d1117]/70 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase italic tracking-tight">AI Operations Co-Pilot &amp; Estimator</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Universal Scope Analysis • Instant Materials &amp; Labour Quotes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Presets */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Industry Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ISSUES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(item.text)}
                  className="px-3 py-1.5 rounded-xl bg-[#0d1117] hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all text-left"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Area */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Describe the Service, Labour, or Task Scope
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Wash and valet 3 delivery vans, full interior vacuum and polish, or restock retail shelves and repair checkout counter..."
              className="w-full bg-[#0d1117] border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-blue-500/50 outline-none placeholder:text-slate-600 transition"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleDiagnose}
              disabled={isLoading || !prompt.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black uppercase text-[11px] tracking-wider shadow-lg shadow-blue-900/30 flex items-center gap-2 active:scale-95 transition"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing Scope &amp; Calculating Rates...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Generate Work Scope &amp; Quote Estimate
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Results Display */}
          {diagnosis && (
            <div className="space-y-6 pt-4 border-t border-slate-800 animate-in fade-in duration-300">
              {/* Technical Summary */}
              <div className="bg-[#0d1117] p-5 rounded-2xl border border-slate-800">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 block mb-1">Operational Scope Summary</span>
                <p className="text-sm font-bold text-white leading-relaxed">{diagnosis.summary}</p>
              </div>

              {/* Steps & Quality Guidelines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnosis.possibleCauses && diagnosis.possibleCauses.length > 0 && (
                  <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-2">Key Service Steps</span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {diagnosis.possibleCauses.map((cause: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {diagnosis.safetyGuidelines && diagnosis.safetyGuidelines.length > 0 && (
                  <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800">
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block mb-2">Quality &amp; Safety Checks</span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {diagnosis.safetyGuidelines.map((safe: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{safe}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Estimated Line Items */}
              <div className="bg-[#0d1117] p-5 rounded-2xl border border-slate-800 space-y-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block">
                  Generated Quote Line Items
                </span>

                {/* Materials / Supplies */}
                {diagnosis.materials && diagnosis.materials.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Suggested Supplies &amp; Parts:</span>
                    <div className="space-y-1.5">
                      {diagnosis.materials.map((m: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-200">{m.qty}x {m.description}</span>
                          <span className="font-mono font-bold text-white">R {(m.amount || (m.qty * m.unitPrice) || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Labour */}
                {diagnosis.labour && diagnosis.labour.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Estimated Labour / Service:</span>
                    <div className="space-y-1.5">
                      {diagnosis.labour.map((l: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-200">{l.hours} hrs — {l.description}</span>
                          <span className="font-mono font-bold text-white">R {(l.amount || (l.hours * l.rate) || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleApply}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/20 active:scale-95 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Apply Estimate to New Quote / Invoice
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d1117] border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 px-6">
          <span>Universal Operations AI Intelligence</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold uppercase">Close</button>
        </div>
      </div>
    </div>
  );
};
