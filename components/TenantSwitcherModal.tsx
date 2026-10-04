import React from 'react';
import { Company, StaffUser } from '../types';

interface TenantSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  activeCompany: Company;
  currentOperator: StaffUser;
  onSelectTenant: (company: Company, user: StaffUser) => void;
  onOpenCompanySignup: () => void;
}

export const TenantSwitcherModal: React.FC<TenantSwitcherModalProps> = ({
  isOpen,
  onClose,
  companies,
  activeCompany,
  currentOperator,
  onSelectTenant,
  onOpenCompanySignup,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Multi-Tenant Architecture
            </span>
            <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">
              Switch Tenant &amp; Persona
            </h2>
            <p className="text-xs text-slate-400">
              Verify strict Row Level Security (RLS) and cross-tenant data isolation.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">✕</button>
        </div>

        {/* Company List */}
        <div className="space-y-4 mb-6">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Independent Tenant Companies:</p>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {companies.map(comp => {
              const isActive = comp.id === activeCompany.id;

              return (
                <div
                  key={comp.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-blue-950/20 border-blue-500/60 shadow-lg shadow-blue-950/40'
                      : 'bg-[#0d1117] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {comp.logoUrl ? (
                        <img src={comp.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow"
                          style={{ backgroundColor: comp.brandColor }}
                        >
                          {comp.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-black text-white uppercase italic">{comp.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          Tier: <span className="font-bold text-slate-300 uppercase">{comp.subscriptionTier}</span> • Status: <span className="font-bold text-emerald-400 uppercase">{comp.subscriptionStatus}</span>
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-600 text-white tracking-widest">
                        Active Tenant
                      </span>
                    )}
                  </div>

                  {/* Persona Role Switcher for this tenant */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        const adminUser: StaffUser = {
                          uid: `admin_${comp.id}`,
                          companyId: comp.id,
                          email: comp.email,
                          name: `${comp.name.split(' ')[0]} Owner`,
                          role: 'super_admin',
                          specialty: 'Operations Director & Business Owner',
                          isWorking: false,
                        };
                        onSelectTenant(comp, adminUser);
                        onClose();
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isActive && currentOperator.role === 'super_admin'
                          ? 'bg-blue-600 text-white font-black'
                          : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>👑 Super Admin</span>
                    </button>

                    <button
                      onClick={() => {
                        const techUser: StaffUser = {
                          uid: `tech_${comp.id}`,
                          companyId: comp.id,
                          email: `tech@${comp.email.split('@')[1] || 'domain.com'}`,
                          name: `Field Staff (${comp.name.split(' ')[0]})`,
                          role: 'technician',
                          specialty: 'Field Technician & Service Specialist',
                          isWorking: true,
                        };
                        onSelectTenant(comp, techUser);
                        onClose();
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isActive && currentOperator.role === 'technician'
                          ? 'bg-blue-600 text-white font-black'
                          : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>🔧 Field Tech</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create New Tenant Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenCompanySignup();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>Create &amp; Register New Contractor Company</span>
          </button>
        </div>
      </div>
    </div>
  );
};
