import React, { useState, useEffect } from 'react';
import { StockTake, StockItem } from '../types';
import { createPortal } from 'react-dom';
import PrintableStockTake from './PrintableStockTake';

interface StockTakeDetailProps {
  stockTake?: StockTake;
  onSave: (data: any) => void;
  onCancel: () => void;
  userEmail: string;
}

const StockTakeDetail: React.FC<StockTakeDetailProps> = ({ stockTake, onSave, onCancel, userEmail }) => {
  const [vehicleId, setVehicleId] = useState(stockTake?.vehicleId || 'Vehicle 1');
  const [items, setItems] = useState<StockItem[]>(stockTake?.items || []);
  const [notes, setNotes] = useState(stockTake?.notes || '');
  const [isPrinting, setIsPrinting] = useState(false);

  const [newItem, setNewItem] = useState({ description: '', quantity: 0, unit: 'pcs' });

  const addItem = () => {
    if (!newItem.description) return;
    setItems([...items, { ...newItem, id: Math.random().toString(36).substr(2, 9) }]);
    setNewItem({ description: '', quantity: 0, unit: 'pcs' });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleSave = () => {
    onSave({
      vehicleId,
      items,
      notes,
      createdBy: userEmail,
      date: stockTake?.date || new Date()
    });
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleWhatsAppShare = () => {
    const dateStr = stockTake?.date?.toDate ? stockTake.date.toDate().toLocaleDateString() : new Date().toLocaleDateString();
    let message = `*Stock Take - ${vehicleId}*\nDate: ${dateStr}\n\n`;
    items.forEach(item => {
      message += `• ${item.description}: ${item.quantity} ${item.unit}\n`;
    });
    if (notes) message += `\nNotes: ${notes}`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col md:flex-row">
      {/* Sidebar Editor */}
      <div className="w-full md:w-[450px] bg-[#161b22] border-r border-slate-800 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Stock Take Editor</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weekly Inventory Log</p>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Header Info */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Vehicle / Location</label>
              <input 
                type="text" 
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. Vehicle 1, Main Store"
              />
            </div>
          </div>

          {/* Add Item Form */}
          <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Add Stock Item</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Item Description"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="w-full bg-[#161b22] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Qty"
                  value={newItem.quantity || ''}
                  onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                  className="flex-1 bg-[#161b22] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
                <input 
                  type="text" 
                  placeholder="Unit (pcs, m, etc)"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                  className="w-24 bg-[#161b22] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
              <button 
                onClick={addItem}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors"
              >
                Add to List
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Inventory</h3>
            {items.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic">No items added yet...</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-[#0d1117] p-3 rounded-xl border border-slate-800 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate uppercase">{item.description}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase">{item.quantity} {item.unit}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Additional Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0d1117] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-medium focus:border-blue-500 outline-none transition-all h-24 resize-none"
              placeholder="Any discrepancies or comments..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-[#0d1117] space-y-3">
          <button 
            onClick={handleSave}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 active:scale-95 transition-all"
          >
            Save Stock Take
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handlePrint}
              className="bg-slate-800 text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print PDF
            </button>
            <button 
              onClick={handleWhatsAppShare}
              className="bg-[#25D366] text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-[#0d1117] overflow-y-auto p-8 hidden md:flex justify-center items-start custom-scrollbar">
        <div className="preview-card shadow-2xl">
          <PrintableStockTake 
            vehicleId={vehicleId}
            items={items}
            notes={notes}
            createdBy={userEmail}
            date={stockTake?.date || new Date()}
          />
        </div>
      </div>

      {/* Print Root Portal */}
      {isPrinting && createPortal(
        <PrintableStockTake 
          vehicleId={vehicleId}
          items={items}
          notes={notes}
          createdBy={userEmail}
          date={stockTake?.date || new Date()}
        />,
        document.getElementById('print-root')!
      )}
    </div>
  );
};

export default StockTakeDetail;
