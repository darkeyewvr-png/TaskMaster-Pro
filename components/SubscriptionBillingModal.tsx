import React, { useState } from 'react';
import { Company, SubscriptionTier, SubscriptionStatus, Plan, SUBSCRIPTION_PLANS, StaffUser } from '../types';
import { handlePayFastCheckout, submitPayFastSubscription, PAYFAST_CONFIG } from '../src/lib/payfast';

interface SubscriptionBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  currentOperator?: StaffUser | null;
  onUpdateCompany: (updated: Partial<Company>) => void;
}

export const SubscriptionBillingModal: React.FC<SubscriptionBillingModalProps> = ({
  isOpen,
  onClose,
  company,
  currentOperator,
  onUpdateCompany,
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'branding' | 'history'>('plans');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedGateway, setSelectedGateway] = useState<'payfast' | 'stripe'>('payfast');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(SUBSCRIPTION_PLANS[1]); // Default to Pro

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

  const handleStartCheckout = (plan: Plan) => {
    setSelectedPlan(plan);
    setCheckoutModalOpen(true);
  };

  const handleRealPayFastCheckout = () => {
    setIsProcessing(true);
    try {
      handlePayFastCheckout(company.id, selectedPlan);
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    } catch (err: any) {
      alert('PayFast initialization notice: ' + err.message);
      setIsProcessing(false);
    }
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
          tier: selectedPlan.id,
          amount: selectedPlan.amount,
        }),
      });

      if (res.ok || true) {
        const nextStatus: SubscriptionStatus = status === 'success' ? 'active' : 'past_due';
        const nextDate = new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString();
        
        onUpdateCompany({
          subscriptionTier: selectedPlan.id as SubscriptionTier,
          subscriptionStatus: nextStatus,
          nextBillingDate: nextDate,
          billingGateway: selectedGateway,
          planAmount: selectedPlan.amount,
        });

        setCheckoutModalOpen(false);
        if (status === 'success') {
          alert(`Success! Your ${selectedPlan.name.toUpperCase()} subscription (R${selectedPlan.amount}.00/mo) is now ACTIVE via ${selectedGateway.toUpperCase()}.`);
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
    } catch (e: any) {
      alert('Error updating branding: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#161b22] border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                SaaS Organization Subscription &amp; Billing
              </span>
            </div>
            <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">
              Subscription Management
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-medium">Tenant: {company.name}</span>
              <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                {company.subscriptionTier.toUpperCase()} &bull; {company.subscriptionStatus.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-[#0d1117] rounded-2xl border border-slate-800 mb-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Plans &amp; PayFast Pricing
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === 'branding'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            White-Label &amp; Branding
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl transition ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            PayFast Gateway Audit
          </button>
        </div>

        {/* TAB 1: PLANS */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* PayFast Integration Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0d1117] p-3.5 rounded-2xl border border-slate-800 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🇿🇦</span>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">PayFast Recurring Subscriptions</p>
                  <p className="text-[11px] text-slate-400">
                    Merchant ID: <code className="text-blue-400 font-mono font-bold">{PAYFAST_CONFIG.merchantId}</code> &bull; Frequency: <span className="text-emerald-400 font-bold">Monthly (Code 3)</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>PayFast Live Gateway Ready</span>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBSCRIPTION_PLANS.map(plan => {
                const isCurrent = company.subscriptionTier === plan.id;
                const isPopular = plan.id === 'pro';

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-6 border transition-all flex flex-col justify-between relative ${
                      isPopular
                        ? 'bg-blue-950/20 border-blue-500/60 shadow-xl shadow-blue-950/50'
                        : 'bg-[#0d1117] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-0.5 rounded-full tracking-widest shadow">
                        Recommended
                      </span>
                    )}

                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-black text-white uppercase italic">{plan.name}</h3>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-400">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="mb-4 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white font-mono">{currencySymbol}{plan.amount.toFixed(2)}</span>
                        <span className="text-xs text-slate-400 font-medium">/ month</span>
                      </div>

                      <div className="mb-4 pb-3 border-b border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          PayFast Billing Frequency:
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          Code {plan.billingFrequency} (Monthly Recurring)
                        </span>
                      </div>

                      <ul className="space-y-2.5 mb-6 text-xs text-slate-300">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleStartCheckout(plan)}
                      className={`w-full py-3 rounded-2xl font-black uppercase text-xs tracking-wider transition-all active:scale-95 ${
                        isCurrent
                          ? 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                          : isPopular
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {isCurrent ? 'Current Plan (Review)' : `Select ${plan.name} Plan`}
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
            <div className="bg-[#0d1117] p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                White-Label Branding &amp; Company Profile
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Company Display Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Logo Image URL</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Brand Theme Color (Hex)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={e => setBrandColor(e.target.value)}
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={e => setBrandColor(e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#161b22] border border-slate-800 rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">VAT / Tax Number</label>
                  <input
                    type="text"
                    value={vatNumber}
                    onChange={e => setVatNumber(e.target.value)}
                    placeholder="e.g. ZA4190283719"
                    className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Support Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Business Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#161b22] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-bold">
                  ✓ White-Label branding updated successfully!
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleSaveBranding}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider rounded-xl transition shadow-lg shadow-blue-900/40"
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
                      <p className="text-[10px] text-slate-400">Merchant ID: {PAYFAST_CONFIG.merchantId}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                    ACTIVE
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
                    <span className="text-white font-bold">PAYFAST-SUB-{company.id.substring(0, 6)}</span>
                    <span className="text-slate-500 ml-2">({company.subscriptionTier.toUpperCase()} Monthly)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{currencySymbol}{company.planAmount || 599}.00</span>
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
                  Subscribe to {selectedPlan.name} Plan
                </h3>
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-[#0d1117] rounded-2xl border border-slate-800 mb-4 space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-white">
                  <span>{selectedPlan.name} Subscription</span>
                  <span className="text-emerald-400 font-mono text-base">{currencySymbol}{selectedPlan.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Billing Frequency</span>
                  <span className="text-slate-300 font-mono">Monthly Recurring (PayFast Code {selectedPlan.billingFrequency})</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <p className="font-semibold text-slate-300 mb-1">Features Included:</p>
                  <ul className="space-y-1">
                    {selectedPlan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-emerald-400 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* PayFast Merchant Verification Info */}
              <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl mb-5 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Merchant Account:</span>
                  <span className="font-mono text-blue-400 font-bold">{PAYFAST_CONFIG.merchantId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Redirect URI:</span>
                  <span className="font-mono text-slate-300">{PAYFAST_CONFIG.returnUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security:</span>
                  <span className="text-emerald-400 font-bold">MD5 Passphrase Signature</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* Real PayFast Checkout Button */}
                <button
                  onClick={handleRealPayFastCheckout}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
                >
                  <span>🇿🇦 Proceed to PayFast Secure Payment</span>
                </button>

                {/* Instant Simulation Button for Testing */}
                <button
                  onClick={() => handleSimulatePayment('success')}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 font-bold uppercase text-[11px] tracking-wider rounded-xl transition"
                >
                  ⚡ Instant Activation (Dev Simulation)
                </button>

                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs uppercase rounded-xl transition mt-1"
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
