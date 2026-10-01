import React from 'react';
import { StockItem } from '../types';

interface PrintableStockTakeProps {
  vehicleId: string;
  items: StockItem[];
  notes?: string;
  createdBy: string;
  date: any;
}

const PrintableStockTake: React.FC<PrintableStockTakeProps> = ({ vehicleId, items, notes, createdBy, date }) => {
  const dateObj = date?.toDate ? date.toDate() : (date instanceof Date ? date : new Date());
  const formattedDate = dateObj.toLocaleDateString('en-ZA', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="print-page bg-white text-slate-900 font-sans p-[15mm] min-h-[297mm] w-[210mm] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Stock Take Log</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Universal Inventory &amp; Supplies Management</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400">Date Recorded</p>
          <p className="text-sm font-bold">{formattedDate}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-1">Vehicle / Location</h3>
          <p className="text-lg font-bold uppercase">{vehicleId}</p>
        </div>
        <div className="text-right">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-1">Recorded By</h3>
          <p className="text-lg font-bold uppercase">{createdBy}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="text-left py-3 text-[10px] font-black uppercase tracking-widest">Item Description</th>
              <th className="text-right py-3 text-[10px] font-black uppercase tracking-widest w-32">Quantity</th>
              <th className="text-right py-3 text-[10px] font-black uppercase tracking-widest w-24">Unit</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-4 text-sm font-bold uppercase">{item.description}</td>
                <td className="py-4 text-right text-sm font-black italic">{item.quantity}</td>
                <td className="py-4 text-right text-xs font-bold text-slate-500 uppercase">{item.unit}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="py-12 text-center text-slate-400 italic text-sm">No items recorded in this log.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Notes & Footer */}
      <div className="mt-12 pt-8 border-t-2 border-slate-900">
        {notes && (
          <div className="mb-8">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2">Notes / Comments</h3>
            <p className="text-sm leading-relaxed">{notes}</p>
          </div>
        )}
        
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="w-48 border-b border-slate-900 pb-1">
              <p className="text-[8px] font-black uppercase text-slate-400">Signature</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black uppercase text-slate-400">System Generated Document</p>
            <p className="text-[10px] font-bold italic">Basson Elektries Job Tracker v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableStockTake;
