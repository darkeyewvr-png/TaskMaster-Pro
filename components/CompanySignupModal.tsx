import React, { useState } from 'react';
import { Company, StaffUser } from '../types';

interface CompanySignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (company: Company, owner: StaffUser) => void;
}

const INDUSTRY_PRESETS = [
  { id: 'car_wash', label: '🚗 Car Wash & Auto Detailing', defaultColor: '#0284c7', example: 'Crystal Clean Car Wash & Valet' },
  { id: 'retail_store', label: '🏪 Store / Retail / Shop Owner', defaultColor: '#10b981', example: 'Metro Corner Store & Provisions' },
  { id: 'general_labour', label: '🔨 General Labour & Maintenance', defaultColor: '#f59e0b', example: 'Apex Labour & Handyman Services' },
  { id: 'cleaning_janitorial', label: '✨ Cleaning & Janitorial', defaultColor: '#06b6d4', example: 'Sparkle Commercial Cleaning' },
  { id: 'trades_services', label: '⚡ Trades & Field Operations', defaultColor: '#2563eb', example: 'ProField Contractors (PTY) LTD' },
  { id: 'equipment_repair', label: '⚙️ Equipment & Workshop Repair', defaultColor: '#6366f1', example: 'Speedy Mechanical & Equipment' },
  { id: 'other_services', label: '💼 Professional & Custom Services', defaultColor: '#8b5cf6', example: 'Universal Service Group' },
];

const COLOR_PRESETS = [
  { name: 'Ocean Blue', hex: '#0284c7' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Warm Amber', hex: '#f59e0b' },
  { name: 'Royal Indigo', hex: '#2563eb' },
  { name: 'Purple Titanium', hex: '#8b5cf6' },
  { name: 'Slate Steel', hex: '#475569' },
];

export const CompanySignupModal: React.FC<CompanySignupModalProps> = ({
  isOpen,
  onClose,
  onCompanyCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Industry
  const [industry, setIndustry] = useState<string>('car_wash');

  // Step 1: Owner Details
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  // Step 2: Company Details
  const [companyName, setCompanyName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#0284c7');
  const [currency, setCurrency] = useState<'ZAR' | 'USD' | 'EUR' | 'GBP'>('ZAR');
  const [taxRate, setTaxRate] = useState(15);

  // Step 3: Invites
  const [invites, setInvites] = useState<{ email: string; name: string; role: 'technician' | 'super_admin'; specialty: string }[]>([
    { email: '', name: '', role: 'technician', specialty: 'Service & Field Staff' }
  ]);

  if (!isOpen) return null;

  const handleSelectIndustry = (indId: string) => {
    setIndustry(indId);
    const found = INDUSTRY_PRESETS.find(i => i.id === indId);
    if (found) {
      setBrandColor(found.defaultColor);
      if (!companyName) {
        setCompanyName(found.example);
      }
    }
  };

  const handleAddInviteRow = () => {
    setInvites(prev => [...prev, { email: '', name: '', role: 'technician', specialty: 'Team Member' }]);
  };

  const handleUpdateInvite = (index: number, field: string, val: string) => {
    setInvites(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveInvite = (index: number) => {
    setInvites(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompleteSignup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/saas/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            name: companyName,
            industry,
            registrationNumber: regNumber,
            vatNumber,
            phone: phone || ownerPhone,
            email: ownerEmail,
            address,
            website,
            logoUrl,
            brandColor,
            currency,
            taxRate,
          },
          owner: {
            name: ownerName,
            email: ownerEmail,
            phone: ownerPhone,
            specialty: 'Business Owner & General Manager',
          },
        }),
      });

      let companyData: Company;
      let ownerUser: StaffUser;

      if (res.ok) {
        const data = await res.json();
        companyData = data.company;
        ownerUser = data.user;
      } else {
        // Fallback local creation
        const compId = 'comp_' + Math.random().toString(36).substring(2, 9);
        const uid = 'usr_' + Math.random().toString(36).substring(2, 9);
        companyData = {
          id: compId,
          name: companyName,
          industry,
          registrationNumber: regNumber,
          vatNumber,
          phone: phone || ownerPhone,
          email: ownerEmail,
          address,
          website,
          logoUrl,
          brandColor,
          currency,
          currencySymbol: currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : 'R',
          taxRate,
          subscriptionTier: 'pro',
          subscriptionStatus: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          billingGateway: 'payfast',
          planAmount: 1299,
          createdAt: new Date().toISOString(),
        };
        ownerUser = {
          uid,
          companyId: compId,
          name: ownerName,
          email: ownerEmail,
          phone: ownerPhone,
          role: 'super_admin',
          specialty: 'Business Owner & General Manager',
          isWorking: false,
          hourlyRate: 350,
        };
      }

      // Send invitations
      const validInvites = invites.filter(i => i.email && i.name);
      for (const inv of validInvites) {
        fetch('/api/saas/invite-technician', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: companyData.id,
            email: inv.email,
            name: inv.name,
            role: inv.role,
            specialty: inv.specialty,
          }),
        }).catch(console.warn);
      }

      onCompanyCreated(companyData, ownerUser);
      onClose();
    } catch (e: any) {
      alert('Signup error: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#161b22] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              🏢
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Universal Business &amp; Operations Portal
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tight">
                {step === 1 && 'Step 1: Owner & Business Account'}
                {step === 2 && 'Step 2: Company Profile & Industry'}
                {step === 3 && 'Step 3: Invite Team Members'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className={`h-1.5 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full ${step >= 3 ? 'bg-blue-500' : 'bg-slate-800'}`} />
        </div>

        {/* STEP 1: OWNER */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Create your business owner account to manage job dispatch, staff rosters, invoices, quotes, and quality verification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Business Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. owner@business.co.za"
                  value={ownerEmail}
                  onChange={e => setOwnerEmail(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Password *</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={ownerPassword}
                  onChange={e => setOwnerPassword(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mobile / WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 082 555 0192"
                  value={ownerPhone}
                  onChange={e => setOwnerPhone(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                disabled={!ownerName.trim() || !ownerEmail.trim()}
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-blue-900/30"
              >
                Next: Business Profile →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: COMPANY PROFILE & INDUSTRY */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Industry Selector */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                Select Your Business Industry / Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INDUSTRY_PRESETS.map(ind => (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => handleSelectIndustry(ind.id)}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between ${
                      industry === ind.id
                        ? 'bg-slate-800 border-white text-white'
                        : 'bg-[#0d1117] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{ind.label}</span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ind.defaultColor }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Company / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crystal Clean Car Wash or Metro Store"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Business Reg Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 2024/048561/07"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">VAT / Tax ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 4520288192"
                  value={vatNumber}
                  onChange={e => setVatNumber(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Physical Address / Workshop / Storefront</label>
                <input
                  type="text"
                  placeholder="e.g. 12 Main Road, Bellville, Cape Town"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Business Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 021 555 9182"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as any)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                >
                  <option value="ZAR">South African Rand (ZAR - R)</option>
                  <option value="USD">US Dollar (USD - $)</option>
                  <option value="EUR">Euro (EUR - €)</option>
                  <option value="GBP">British Pound (GBP - £)</option>
                </select>
              </div>

              {/* White Label Branding Color */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">
                  Brand Theme Color
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setBrandColor(preset.hex)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                        brandColor === preset.hex
                          ? 'border-white text-white bg-slate-800'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.hex }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                  <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-xl border border-slate-800">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={e => setBrandColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-slate-300">{brandColor}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!companyName.trim()}
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-blue-900/30"
              >
                Next: Invite Team →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: INVITE STAFF */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Invite your employees, field staff, store clerks, or detailers.
              </p>
              <button
                type="button"
                onClick={handleAddInviteRow}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-bold"
              >
                + Add Member
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {invites.map((inv, idx) => (
                <div key={idx} className="p-3 bg-[#0d1117] border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-2 relative">
                  <div>
                    <input
                      type="text"
                      placeholder="Staff Name"
                      value={inv.name}
                      onChange={e => handleUpdateInvite(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-[#161b22] border border-slate-800 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={inv.email}
                      onChange={e => handleUpdateInvite(idx, 'email', e.target.value)}
                      className="w-full px-3 py-2 bg-[#161b22] border border-slate-800 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <select
                      value={inv.role}
                      onChange={e => handleUpdateInvite(idx, 'role', e.target.value)}
                      className="w-full px-3 py-2 bg-[#161b22] border border-slate-800 rounded-lg text-white text-xs"
                    >
                      <option value="technician">Staff / Operator</option>
                      <option value="super_admin">Manager / Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Role (e.g. Lead Detailer, Cashier)"
                      value={inv.specialty}
                      onChange={e => handleUpdateInvite(idx, 'specialty', e.target.value)}
                      className="w-full px-3 py-2 bg-[#161b22] border border-slate-800 rounded-lg text-white text-xs"
                    />
                    {invites.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInvite(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-blue-300 uppercase tracking-tight">14-Day Free Pro SaaS Trial Included</p>
                <p className="text-[11px] text-blue-400/80">Unlimited team members, live work orders, quality sign-offs, and invoicing.</p>
              </div>
              <span className="px-2.5 py-1 bg-blue-600 text-white font-mono text-[10px] font-black rounded-lg">R0.00 TODAY</span>
            </div>

            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleCompleteSignup}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-emerald-900/40 flex items-center gap-2"
              >
                {isLoading ? (
                  <span>Setting up your portal...</span>
                ) : (
                  <span>Launch Operations Portal 🚀</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
