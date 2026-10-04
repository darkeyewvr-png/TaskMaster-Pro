import React, { useState } from 'react';
import { StaffUser, UserRole } from '../types';

export const UNIVERSAL_RANK_PRESETS = [
  'Operations Manager & Field Lead',
  'Managing Director & Business Owner',
  'Supervisor & Quality Controller',
  'Service Technician / Specialist',
  'Detailer & Valet Specialist',
  'Store Associate & Inventory Lead',
  'Crew Leader & Labour Specialist',
  'Maintenance & Field Operator',
  'Customer Service & Dispatcher',
  'Admin & Accounts Coordinator',
];

export const ELECTRICAL_RANK_PRESETS = UNIVERSAL_RANK_PRESETS;

interface OperatorSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOperator: {
    uid: string;
    email: string;
    name: string;
    role: UserRole;
    specialty?: string;
    phone?: string;
  };
  staffList: StaffUser[];
  onSelectOperator: (op: { uid: string; email: string; name: string; role: UserRole; specialty?: string; phone?: string }) => void;
  onAddOperator: (op: { email: string; name: string; role: UserRole; specialty?: string; phone?: string }) => void;
  onUpdateOperator: (uid: string, op: { email: string; name: string; role: UserRole; specialty?: string; phone?: string }) => void;
  onDeleteOperator: (uid: string, email: string) => void;
}

export const OperatorSwitcherModal: React.FC<OperatorSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentOperator,
  staffList,
  onSelectOperator,
  onAddOperator,
  onUpdateOperator,
  onDeleteOperator,
}) => {
  const [modalMode, setModalMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingUid, setEditingUid] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('staff');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formPhone, setFormPhone] = useState('');

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('staff');
    setFormSpecialty('Service Specialist');
    setFormPhone('');
    setEditingUid(null);
    setModalMode('add');
  };

  const handleOpenEdit = (op: StaffUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUid(op.uid);
    setFormName(op.name || '');
    setFormEmail(op.email || '');
    setFormRole(op.role || 'staff');
    setFormSpecialty(op.specialty || 'Service Specialist');
    setFormPhone(op.phone || '');
    setModalMode('edit');
  };

  const handleDelete = (op: StaffUser, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrent = op.uid === currentOperator.uid || op.email.toLowerCase() === currentOperator.email.toLowerCase();
    const confirmMsg = isCurrent
      ? `Are you sure you want to remove ${op.name || op.email}? This is your currently active profile.`
      : `Are you sure you want to remove ${op.name || op.email} from the system?`;

    if (confirm(confirmMsg)) {
      onDeleteOperator(op.uid, op.email);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Please provide both full name and email address.');
      return;
    }

    if (modalMode === 'add') {
      const newOp = {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        specialty: formSpecialty.trim() || (formRole === 'admin' ? 'Operations Manager' : 'Service Specialist'),
        phone: formPhone.trim(),
      };
      onAddOperator(newOp);
      setModalMode('list');
    } else if (modalMode === 'edit' && editingUid) {
      const updatedOp = {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        specialty: formSpecialty.trim() || (formRole === 'admin' ? 'Operations Manager' : 'Service Specialist'),
        phone: formPhone.trim(),
      };
      onUpdateOperator(editingUid, updatedOp);
      setModalMode('list');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#161b22] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-[#0d1117]/70 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase italic tracking-tight">
                {modalMode === 'add' ? 'Add Team Member' : modalMode === 'edit' ? 'Edit Rank & Profile' : 'Active Operator'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {modalMode === 'list' ? 'Switch profile or manage technician ranks' : 'Configure personnel rank and access'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {modalMode === 'list' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Team Members ({staffList.length})
                </label>
                <span className="text-[9px] text-slate-500 font-medium">Click to select • Use icons to edit rank/delete</span>
              </div>

              <div className="space-y-2.5">
                {staffList.map(op => {
                  const isCurrent = op.email.toLowerCase() === currentOperator.email.toLowerCase() || op.uid === currentOperator.uid;
                  return (
                    <div
                      key={op.uid}
                      onClick={() => {
                        onSelectOperator(op);
                        onClose();
                      }}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                        isCurrent
                          ? 'bg-blue-600/10 border-blue-500/60 ring-1 ring-blue-500/40 shadow-lg shadow-blue-950/20'
                          : 'bg-[#0d1117] border-slate-800 hover:border-slate-700 hover:bg-[#161b22]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase shrink-0 ${
                          op.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {(op.name || op.email).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-white truncate">{op.name || op.email.split('@')[0]}</p>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                              op.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {op.role}
                            </span>
                            {isCurrent && (
                              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-amber-300/90 font-medium truncate mt-0.5">
                            {op.specialty || (op.role === 'admin' ? 'Operations Manager' : 'Service Specialist')}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {op.email} {op.phone ? `• ${op.phone}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons on card */}
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={e => handleOpenEdit(op, e)}
                          title="Edit rank & particulars"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 border border-slate-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {staffList.length > 1 && (
                          <button
                            type="button"
                            onClick={e => handleDelete(op, e)}
                            title="Remove operator"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-red-600/30 text-slate-400 hover:text-red-400 border border-slate-700 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Button */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-800 hover:border-blue-500/50 text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-[#0d1117]/50 hover:bg-[#0d1117]"
              >
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Add New Technician / Operator</span>
              </button>
            </div>
          ) : (
            /* Add / Edit Form */
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800 space-y-3.5">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Work Email *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. operator@company.co.za"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    System Rank & Access Level *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormRole('admin')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                        formRole === 'admin'
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/40'
                          : 'bg-[#161b22] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase">
                        <span>⭐</span> Administrator
                      </div>
                      <span className="text-[9px] text-slate-400">Full master rights, invoicing & settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormRole('staff')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                        formRole === 'staff'
                          ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 ring-1 ring-blue-500/40'
                          : 'bg-[#161b22] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase">
                        <span>🔧</span> Technician / Staff
                      </div>
                      <span className="text-[9px] text-slate-400">Field logs, job cards & clock-in</span>
                    </button>
                  </div>
                </div>

                {/* Rank / Designation / Specialty */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Rank Title / Designation
                    </label>
                    <span className="text-[8px] text-amber-400 font-bold uppercase">Displayed on Job Cards & Documents</span>
                  </div>
                  <input
                    type="text"
                    list="rank-presets"
                    placeholder="e.g. Operations Manager / Lead Valet / Store Supervisor"
                    value={formSpecialty}
                    onChange={e => setFormSpecialty(e.target.value)}
                    className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-medium"
                  />
                  <datalist id="rank-presets">
                    {ELECTRICAL_RANK_PRESETS.map(rank => (
                      <option key={rank} value={rank} />
                    ))}
                  </datalist>

                  {/* Preset quick chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ELECTRICAL_RANK_PRESETS.slice(0, 5).map(rank => (
                      <button
                        key={rank}
                        type="button"
                        onClick={() => setFormSpecialty(rank)}
                        className={`text-[8px] font-bold px-2 py-1 rounded-lg border transition ${
                          formSpecialty === rank
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                            : 'bg-[#161b22] text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {rank}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 082 123 4567"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode('list')}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-900/40 transition active:scale-98"
                >
                  {modalMode === 'add' ? 'Save Personnel' : 'Update Rank & Profile'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d1117] border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 px-6">
          <span>Staff &amp; Personnel Registry</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-wider">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
