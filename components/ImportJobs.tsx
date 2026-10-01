
import React, { useState } from 'react';
import { parseJobFromPDFText } from '../services/geminiService';
import { Job } from '../types';

interface ImportJobsProps {
  onImport: (jobData: any) => Promise<void>;
  onCancel: () => void;
}

const ImportJobs: React.FC<ImportJobsProps> = ({ onImport, onCancel }) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return fullText;
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setStatus('processing');
    try {
      const rawText = await extractTextFromPDF(selectedFile);
      const parsed = await parseJobFromPDFText(rawText);
      
      await onImport({
        clientName: parsed.clientName || 'Unnamed Client',
        location: parsed.location || '',
        workDescription: parsed.workDescription || '',
        materialsUsed: parsed.materialsUsed || '',
        technicianNotes: parsed.technicianNotes || 'Imported from PDF',
        startDate: parsed.startDate || null,
        endDate: parsed.endDate || null,
        status: 'DONE',
        createdAt: null // Let handleSaveJob set this
      });
      setStatus('done');
    } catch (err) {
      alert("Import failed. PDF format not recognized.");
      setStatus('idle');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-10 bg-[#161b22] rounded-[3rem] border border-slate-800 shadow-2xl text-center space-y-8">
      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">PDF Record Migration</h2>
      <div className="h-48 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center bg-[#0d1117] relative">
        <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
        <span className="text-[10px] font-black uppercase text-slate-500">{selectedFile ? selectedFile.name : 'Drop Work Log PDF'}</span>
      </div>
      <div className="flex gap-4">
        <button onClick={onCancel} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-600">Cancel</button>
        <button onClick={handleImport} disabled={!selectedFile || status === 'processing'} className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/40 active:scale-95 transition-all disabled:opacity-30">
          {status === 'processing' ? 'Processing...' : 'Run Migration'}
        </button>
      </div>
    </div>
  );
};

export default ImportJobs;
