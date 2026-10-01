import React from 'react';
import { StockTake } from '../types';

interface StockTakeListProps {
  stockTakes: StockTake[];
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const StockTakeList: React.FC<StockTakeListProps> = ({ stockTakes, onSelect, onNew, onDelete }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Stock Take Logs</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Weekly Vehicle Inventory Tracking</p>
        </div>
        <button 
          onClick={onNew}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
        >
          New Stock Take
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stockTakes.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#161b22] rounded-3xl border border-dashed border-slate-800">
            <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No stock takes recorded yet</p>
            <button onClick={onNew} className="mt-4 text-blue-500 font-black uppercase text-[10px] tracking-widest hover:text-blue-400">Start First Log</button>
          </div>
        ) : (
          stockTakes.map((st) => (
            <div 
              key={st.id} 
              className="bg-[#161b22] p-6 rounded-2xl border border-slate-800 shadow-xl hover:border-slate-700 transition-all group cursor-pointer"
              onClick={() => onSelect(st.id!)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-900/30 text-blue-500 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest">
                  {st.vehicleId || 'Vehicle 1'}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(st.id!); }}
                  className="text-slate-700 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <h3 className="text-white font-black text-lg italic mb-1">
                {(() => {
                  const d = st.date;
                  // Fallback to current date if null (likely pending Firestore sync)
                  const dateObj = !d ? new Date() : (d.toDate ? d.toDate() : (d instanceof Date ? d : new Date(d)));
                  return dateObj.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
                })()}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                {st.items.length} Items Tracked
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Recorded by: {st.createdBy || 'Staff'}</span>
                <div className="text-blue-500 group-hover:translate-x-1 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StockTakeList;
