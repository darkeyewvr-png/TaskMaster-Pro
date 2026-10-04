import React, { useState } from 'react';
import { StaffUser, ShiftLog, UserRole } from '../types';
import { ELECTRICAL_RANK_PRESETS } from './OperatorSwitcherModal';

interface StaffListProps {
  staff: StaffUser[];
  logs: ShiftLog[];
  onAddStaff?: (staff: { name: string; email: string; role: UserRole; specialty?: string; phone?: string }) => void;
  onUpdateStaff?: (uid: string, staff: { name: string; email: string; role: UserRole; specialty?: string; phone?: string }) => void;
  onDeleteStaff?: (uid: string, email: string) => void;
  onToggleDuty?: (uid: string, currentStatus: boolean) => void;
}

const StaffList: React.FC<StaffListProps> = ({
  staff,
  logs,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onToggleDuty,
}) => {
  const [modalMode, setModalMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editingUid, setEditingUid] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('staff');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const calculateDuration = (start: any, end: any) => {
    if (!start || !end) return 'Active';
    const startTime = start.toDate ? start.toDate().getTime() : new Date(start).getTime();
    const endTime = end.toDate ? end.toDate().getTime() : new Date(end).getTime();
    const diffMs = endTime - startTime;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}h ${diffMins}m`;
  };

  const handleOpenAdd = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('staff');
    setFormSpecialty('Service Specialist');
    setFormPhone('');
    setEditingUid(null);
    setModalMode('add');
  };

  const handleOpenEdit = (member: StaffUser) => {
    setEditingUid(member.uid);
    setFormName(member.name || '');
    setFormEmail(member.email || '');
    setFormRole(member.role || 'staff');
    setFormSpecialty(member.specialty || 'Service Specialist');
    setFormPhone(member.phone || '');
    setModalMode('edit');
  };

  const handleDelete = (member: StaffUser) => {
    if (!onDeleteStaff) return;
    if (confirm(`Are you sure you want to remove ${member.name || member.email} from the personnel registry?`)) {
      onDeleteStaff(member.uid, member.email);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Please provide name and email');
      return;
    }

    const payload = {
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      specialty: formSpecialty.trim() || (formRole === 'admin' ? 'Operations Manager' : 'Service Specialist'),
      phone: formPhone.trim(),
    };

    if (modalMode === 'add' && onAddStaff) {
      onAddStaff(payload);
    } else if (modalMode === 'edit' && editingUid && onUpdateStaff) {
      onUpdateStaff(editingUid, payload);
    }
    setModalMode('none');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Staff Management</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Fleet Personnel, Ranks & Attendance</p>
        </div>

        {onAddStaff && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-900/30 transition active:scale-98"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Team Member</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Staff Status Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
              Active Personnel ({staff.length})
            </h3>
            <span className="text-[9px] text-slate-500 font-bold uppercase">Rank & Access</span>
          </div>

          <div className="space-y-3">
            {staff.map(member => (
              <div
                key={member.uid}
                className="bg-[#161b22] p-5 rounded-2xl border border-slate-800 flex flex-col gap-3 shadow-md hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase shrink-0 ${
                      member.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {(member.name || member.email).charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-black text-white uppercase truncate">
                          {member.name || member.email.split('@')[0]}
                        </p>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                          member.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-400/90 font-bold truncate">
                        {member.specialty || (member.role === 'admin' ? 'Operations Manager' : 'Service Specialist')}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">
                        {member.email} {member.phone ? `• ${member.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleDuty && onToggleDuty(member.uid, !!member.isWorking)}
                    className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border shrink-0 transition ${
                      member.isWorking
                        ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/50'
                        : 'bg-slate-800/80 text-slate-500 border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${member.isWorking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                      {member.isWorking ? 'On Duty' : 'Off Duty'}
                    </span>
                  </button>
                </div>

                {/* Card footer actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">
                    ID: {member.uid.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(member)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600/20 text-slate-400 hover:text-blue-300 border border-slate-700 text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Rank
                    </button>
                    {staff.length > 1 && onDeleteStaff && (
                      <button
                        type="button"
                        onClick={() => handleDelete(member)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-slate-700 text-[9px] font-black uppercase tracking-wider transition"
                        title="Remove Team Member"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Logs Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
              Recent Shift Logs ({logs.length})
            </h3>
            <span className="text-[9px] text-slate-500 font-bold uppercase">Time & Attendance Tracking</span>
          </div>

          <div className="bg-[#161b22] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d1117]/60 border-b border-slate-800">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Staff Member</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Shift Start</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Shift End</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-[#1c232e] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-[11px] font-black text-white uppercase">{log.name || log.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{log.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                        {formatTime(log.startTime)}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                        {log.endTime ? formatTime(log.endTime) : <span className="text-emerald-500 font-black uppercase tracking-widest text-[8px]">In Progress</span>}
                      </td>
                      <td className="px-6 py-4">
                         <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${log.status === 'active' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
                            {calculateDuration(log.startTime, log.endTime)}
                         </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-600 font-black uppercase tracking-widest text-[10px]">
                        No shift records found in the system
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Personnel Modal */}
      {modalMode !== 'none' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#161b22] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 bg-[#0d1117]/70 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tight">
                    {modalMode === 'add' ? 'Add New Personnel' : 'Edit Rank & Details'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Manage Technician Profile & Permissions
                  </p>
                </div>
              </div>
              <button onClick={() => setModalMode('none')} className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-slate-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800 space-y-3.5">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Dawie Venter"
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
                    placeholder="e.g. staff@mycompany.co.za"
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
                      <span className="text-[9px] text-slate-400">Master access, rates & approvals</span>
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
                      <span className="text-[9px] text-slate-400">Field logs & job operations</span>
                    </button>
                  </div>
                </div>

                {/* Rank Title / Specialty */}
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Rank Title / Designation
                  </label>
                  <input
                    type="text"
                    list="staff-rank-presets"
                    placeholder="e.g. Operations Manager / Lead Valet / Store Supervisor"
                    value={formSpecialty}
                    onChange={e => setFormSpecialty(e.target.value)}
                    className="w-full bg-[#161b22] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-medium"
                  />
                  <datalist id="staff-rank-presets">
                    {ELECTRICAL_RANK_PRESETS.map(rank => (
                      <option key={rank} value={rank} />
                    ))}
                  </datalist>

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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode('none')}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;
