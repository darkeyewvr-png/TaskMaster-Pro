import React, { useState } from 'react';
import { parseQuoteFromText } from '../services/geminiService';

interface AIImportModalProps {
  onImport: (data: any) => void;
  onClose: () => void;
  type: 'quote' | 'invoice';
}

const AIImportModal: React.FC<AIImportModalProps> = ({ onImport, onClose, type }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    // Use the pdfjs library loaded in index.html
    const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return fullText;
  };

  const handleProcess = async () => {
    let contentToParse = text;
    
    setLoading(true);
    try {
      if (file) {
        setStatusMsg("Reading PDF Content...");
        contentToParse = await extractTextFromPDF(file);
      }

      if (!contentToParse.trim()) {
        alert("No content found to parse. Please paste text or upload a PDF.");
        setLoading(false);
        return;
      }

      setStatusMsg(`AI Generating ${type === 'quote' ? 'Quote' : 'Invoice'}...`);
      const result = await parseQuoteFromText(contentToParse, type);
      onImport(result);
    } catch (e: any) {
      alert("Failed to process document: " + e.message);
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setText(''); // Clear text if file is chosen
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0d1117]/95 backdrop-blur-md no-print">
      <div className="bg-[#161b22] w-full max-w-2xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Smart Import</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Convert PDF or Text into a structured {type}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Option 1: Upload PDF {type === 'quote' ? 'Quote' : 'Invoice'}</label>
            <div className="relative group">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${file ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 bg-[#0d1117] group-hover:border-slate-700'}`}>
                <svg className={`w-8 h-8 mb-2 ${file ? 'text-blue-500' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <span className="text-[10px] font-black uppercase text-slate-400">
                  {file ? file.name : 'Click or Drop PDF here'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-[9px] font-black text-slate-600 uppercase">OR</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Option 2: Paste Document Text</label>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); if(e.target.value) setFile(null); }}
              placeholder={`Paste the text content from your ${type}...`}
              className="w-full h-40 bg-[#0d1117] border border-slate-800 rounded-2xl px-6 py-5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="pt-2">
          <button 
            disabled={loading || (!text.trim() && !file)}
            onClick={handleProcess} 
            className="w-full bg-blue-600 text-white py-5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/40 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {statusMsg}
              </>
            ) : (
              `Process as ${type === 'quote' ? 'Quote' : 'Invoice'}`
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-[9px] text-slate-600 font-bold uppercase">
          <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Gemini will automatically map items to the correct ${type} format.
        </div>
      </div>
    </div>
  );
};

export default AIImportModal;