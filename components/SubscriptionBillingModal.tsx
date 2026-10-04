import React, { useState } from 'react';
import { Company, SubscriptionTier, SubscriptionStatus } from '../types';

interface SubscriptionBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  onUpdateCompany: (updated: Partial<Company>) => void;
}

export const SubscriptionBillingModal: React.FC<SubscriptionBillingModalProps> = ({
  isOpen,
  onClose,
  company,
  onUpdateCompany,
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'branding' | 'history'>('plans');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedGateway, setSelectedGateway] = useState<'payfast' | 'stripe'>('payfast');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<SubscriptionTier>('pro');

  // Branding state
  const [brandColor, setBrandColor] = useState(company.brandColor || '#2563eb');
  const [accentColor, setAccentColor] = useState(company.accentColor || '#f59e0b');
  const [companyName, setCompanyName] = useState(company.name || '');
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '');
  const [regNumber, setRegNumber] = useState(company.registrationNumber || '');
  const [vatNumber, setVatNumber] = useState(company.vatNumber || '');
  const [address, setAddress] = useState(company.address || '');
  const [phone, setPhone] = useState(company.phone || '');
  const [taxRate, setTaxRate] = useState(company.taxRate || 15);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const currencySymbol = company.currencySymbol || 'R';

  const PLANS = [
    {
      id: 'starter' as SubscriptionTier,
      name: 'Starter Dispatch',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      description: 'Ideal for solo contractors, car washes, store owners & small teams (1-3 users).',
      features: [
        'Up to 3 Field & Shop Operators',
        'Unlimited Job Cards & Timestamps',
        'Quotes & Invoicing Module',
        'WhatsApp Client Sharing',
        'Standard Email Support',
      ],
      popular: false,
    },
    {
      id: 'pro' as SubscriptionTier,
      name: 'Pro Business',
      monthlyPrice: 1299,
      yearlyPrice: 12990,
      description: 'Complete commercial operations platform for service companies, stores & contractors.',
      features: [
        'Unlimited Operators & Fleet Tracking',
        'Custom Service Checklists & Digital Sign-Off',
        'AI Operations Co-Pilot & Smart Estimator',
        'White-Label Branding & Custom Colors',
        'PayFast & Stripe Automated Billing',
        'Live GPS Tracking & Shift Clock-in',
      ],
      popular: true,
    },
    {
      id: 'enterprise' as SubscriptionTier,
      name: 'Enterprise Fleet',
      monthlyPrice: 2999,
      yearlyPrice: 29990,
      description: 'Multi-branch franchises & service enterprises requiring dedicated SLA.',
      features: [
        'Everything in Pro Plan',
        'Multi-Branch & Regional Tenant Partitioning',
        'Custom Domain (e.g. app.mybusiness.co.za)',
        'Discord & ERP Webhook Integrations',
        'Dedicated 24/7 Account Manager',
        'Priority Phone Support & Data Backups',
      ],
      popular: false,
    },
  ];

  const handleStartCheckout = (tier: SubscriptionTier) => {
    setCheckoutTier(tier);
    setCheckoutModalOpen(true);
  };

  const handleSimulatePayment = async (status: 'success' | 'failed') => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/saas/webhook/payfast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          payment_status: status === 'success' ? 'COMPLETE' : 'FAILED',
          status,
          tier: checkoutTier,
        }),
      });

      if (res.ok || true) {
        const nextStatus: SubscriptionStatus = status === 'success' ? 'active' : 'past_due';
        const nextDate = new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString();
        
        onUpdateCompany({
          subscriptionTier: checkoutTier,
          subscriptionStatus: nextStatus,
          nextBillingDate: nextDate,
          billingGateway: selectedGateway,
        });

        setCheckoutModalOpen(false);
        if (status === 'success') {
          alert(`Success! Your ${checkoutTier.toUpperCase()} subscription is now ACTIVE via ${selectedGateway.toUpperCase()}.`);
        } else {
          alert(`Simulated payment failed. Account status has been set to PAST DUE for testing access locking.`);
        }
      }
    } catch (e: any) {
      alert('Payment processing error: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveBranding = async () => {
    setIsProcessing(true);
    try {
      await fetch('/api/saas/update-branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          name: companyName,
          brandColor,
          accentColor,
          logoUrl,
          registrationNumber: regNumber,
          vatNumber,
          phone,
          address,
          taxRate,
        }),
      });

      onUpdateCompany({
        name: companyName,
        brandColor,
        accentColor,
        logoUrl,
        registrationNumber: regNumber,
        vatNumber,
        phone,
        address,
        taxRate,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Error updating branding: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#161b22] border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                SaaS Commercial Monetization & White-Labeling
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight uppercase">
              Subscription & White-Label Hub
            </h2>
            <p className="text-xs text-slate-400">
              Manage tenant subscription tiers, automated payment gateways, and company branding.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider ${
              company.subscriptionStatus === 'active'
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                : company.subscriptionStatus === 'trial'
                  ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60'
                  : 'bg-red-950/60 text-red-400 border border-red-800/60 animate-pulse'
            }`}>
              ● {company.subscriptionStatus.toUpperCase()} ({company.subscriptionTier.toUpperCase()})
            </span>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-800/80 pb-3">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Subscription Plans & Gateway
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'branding'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            White-Label & Colors
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Billing Audit & Gateways
          </button>
        </div>

        {/* TAB 1: PLANS */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* Billing Cycle Switcher */}
            <div className="flex items-center justify-between bg-[#0d1117] p-3 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300">Choose Billing Frequency:</span>
              <div className="flex gap-1 bg-[#161b22] p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    billingCycle === 'monthly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly Recurring
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    billingCycle === 'yearly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Yearly</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">SAVE 17%</span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map(plan => {
                const isCurrent = company.subscriptionTier === plan.id;
                const price = billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12);

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-6 border transition-all flex flex-col justify-between relative ${
                      plan.popular
                        ? 'bg-blue-950/20 border-blue-500/60 shadow-xl shadow-blue-950/50'
                        : 'bg-[#0d1117] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-0.5 rounded-full tracking-widest shadow">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-black text-white uppercase italic">{plan.name}</h3>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-400">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mb-4 min-h-[32px]">{plan.description}</p>

                      <div className="mb-6 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white font-mono">{currencySymbol}{price}</span>
                        <span className="text-xs text-slate-400 font-medium">/ month</span>
                      </div>

                      <ul className="space-y-2 mb-6 text-xs text-slate-300">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleStartCheckout(plan.id)}
                      className={`w-full py-3 rounded-2xl font-black uppercase text-xs tracking-wider transition-all active:scale-95 ${
                        isCurrent
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : plan.popular
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isCurrent ? 'Manage Plan' : `Upgrade to ${plan.name.split(' ')[0]}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Test Simulation Controls */}
            <div className="bg-[#0d1117] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-slate-300 uppercase tracking-tight">SaaS Developer Testing Bar</p>
                <p className="text-[11px] text-slate-500">Test how your tenant handles simulated payments and access locks.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSimulatePayment('success')}
                  className="px-3 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition"
                >
                  ⚡ Force Activate (Paid)
                </button>
                <button
                  onClick={() => handleSimulatePayment('failed')}
                  className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition"
                >
                  🔒 Simulate Past Due (Lock)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BRANDING */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <p className="text-xs text-slate-400">
              White-label your business portal so it reflects your company identity on job cards, invoices, work orders, client sign-offs, and navigation menus.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Company Brand Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Company Reg Number</label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">VAT / Tax Number</label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={e => setVatNumber(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Default Tax %</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-full mt-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Logo URL / Image</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png or /assets/logo.png"
                    className="flex-1 px-4 py-3 bg-[#0d1117] border border-slate-800 rounded-xl text-white font-medium text-sm focus:border-blue-500 outline-none"
                  />
                  {logoUrl && (
                    <div className="w-12 h-12 bg-white rounded-xl p-1 shrink-0 flex items-center justify-center border border-slate-700">
                      <img src={logoUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Color Themes */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Brand Color</label>
                <div className="flex items-center gap-2 mt-1 bg-[#0d1117] p-2 rounded-xl border border-slate-800">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="bg-transparent text-white font-mono text-xs outline-none w-24"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Accent Color</label>
                <div className="flex items-center gap-2 mt-1 bg-[#0d1117] p-2 rounded-xl border border-slate-800">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="bg-transparent text-white font-mono text-xs outline-none w-24"
                  />
                </div>
              </div>
            </div>

            {/* Live White-Label Preview Card */}
            <div className="p-4 bg-[#0d1117] border border-slate-800 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Live Header Preview</p>
              <div className="flex items-center justify-between p-4 bg-[#161b22] rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow"
                      style={{ backgroundColor: brandColor }}
                    >
                      {companyName.charAt(0) || 'C'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-black text-white uppercase italic">{companyName || 'Your Company Name'}</h4>
                    <p className="text-[10px] text-slate-400">VAT: {vatNumber || 'Pending'} • Reg: {regNumber || 'Pending'}</p>
                  </div>
                </div>

                <button
                  className="px-4 py-2 rounded-xl font-black text-white text-xs uppercase tracking-wider shadow"
                  style={{ backgroundColor: brandColor }}
                >
                  Brand Action Button
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {saveSuccess && <span className="text-xs text-emerald-400 font-bold">✓ Branding settings saved!</span>}
              <div className="ml-auto">
                <button
                  onClick={handleSaveBranding}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-blue-900/40"
                >
                  {isProcessing ? 'Saving...' : 'Apply White-Label Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GATEWAYS */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-[#0d1117] p-5 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-black text-white uppercase mb-2">Configured Payment Gateways</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇿🇦</span>
                    <div>
                      <p className="text-xs font-black text-white uppercase">PayFast (South Africa)</p>
                      <p className="text-[10px] text-slate-400">Instant EFT, Cards, SnapScan</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                    READY
                  </span>
                </div>

                <div className="p-4 bg-[#161b22] border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <p className="text-xs font-black text-white uppercase">Stripe (Global)</p>
                      <p className="text-[10px] text-slate-400">Recurring Credit Cards, Apple Pay</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                    READY
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#0d1117] p-5 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-black text-white uppercase mb-3">Subscription Invoices History</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 bg-[#161b22] rounded-xl border border-slate-800/60 font-mono">
                  <div>
                    <span className="text-white font-bold">SAAS-INV-2026-001</span>
                    <span className="text-slate-500 ml-2">({company.subscriptionTier.toUpperCase()} Monthly)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{currencySymbol}{company.planAmount || 1299}.00</span>
                    <span className="text-emerald-400 font-black text-[10px] uppercase">PAID</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHECKOUT MODAL POPUP */}
        {checkoutModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#161b22] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-white uppercase italic">
                  Complete {checkoutTier.toUpperCase()} Subscription
                </h3>
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-[#0d1117] rounded-2xl border border-slate-800 mb-4">
                <div className="flex justify-between items-center text-sm font-bold text-white mb-1">
                  <span>{checkoutTier.toUpperCase()} Plan ({billingCycle})</span>
                  <span>{currencySymbol}{checkoutTier === 'starter' ? '499' : checkoutTier === 'pro' ? '1299' : '2999'}.00</span>
                </div>
                <p className="text-[11px] text-slate-400">Automated recurring billing. Cancel anytime from settings.</p>
              </div>

              {/* Gateway Selector */}
              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Payment Gateway:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedGateway('payfast')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                      selectedGateway === 'payfast'
                        ? 'border-blue-500 bg-blue-950/30 text-white'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    🇿🇦 PayFast (ZAR)
                  </button>
                  <button
                    onClick={() => setSelectedGateway('stripe')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                      selectedGateway === 'stripe'
                        ? 'border-blue-500 bg-blue-950/30 text-white'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    🌍 Stripe Card
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleSimulatePayment('success')}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-emerald-900/40"
                >
                  {isProcessing ? 'Connecting Gateway...' : `Authorize & Pay with ${selectedGateway.toUpperCase()}`}
                </button>

                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs uppercase rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
