import React, { useState } from 'react';
import { Company, StaffUser, Plan, SUBSCRIPTION_PLANS } from '../types';
import { handlePayFastCheckout, PAYFAST_CONFIG } from '../src/lib/payfast';

interface PricingPageProps {
  company?: Company;
  currentOperator?: StaffUser | null;
  onBack?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  company,
  currentOperator,
  onBack,
}) => {
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Derive active company_id strictly from user profile or company
  const companyId = currentOperator?.companyId || company?.id || 'comp_aquashine_001';
  const companyName = company?.name || 'Your Business';
  const currentTier = company?.subscriptionTier || 'starter';

  const onSubscribe = (plan: Plan) => {
    setSubscribingPlanId(plan.id);
    try {
      handlePayFastCheckout(companyId, plan);
    } catch (err: any) {
      console.error('[PayFast Checkout Error]:', err);
      alert('Unable to launch PayFast checkout: ' + (err?.message || 'Please try again.'));
      setSubscribingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d13] text-slate-100 font-sans antialiased pb-20">
      {/* Background Decorative Glow Accents */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[500px] bg-emerald-600/5 blur-[160px] pointer-events-none -z-10" />

      {/* Top Header / Navigation */}
      <div className="border-b border-slate-800/80 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
              >
                <span>←</span>
                <span>Back</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-sm">
                ⚡
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-white uppercase italic">
                  TaskMaster Pro
                </span>
                <span className="text-[10px] text-slate-400 ml-2 hidden sm:inline font-medium">
                  Commercial Fleet &amp; Operations Billing
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>Organization:</span>
              <span className="font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700 truncate max-w-[160px]">
                {companyName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PayFast Live Gateway</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 pt-12 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-4">
          <span>🇿🇦</span>
          <span>Transparent South African Rand (ZAR) Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase italic max-w-3xl mx-auto">
          Predictable Pricing for High-Performance Teams
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-2xl mx-auto leading-relaxed">
          Manage job cards, quotations, digital sign-offs, and invoicing with automated monthly PayFast recurring subscriptions. Cancel or adjust anytime.
        </p>

        {/* PayFast Verification Pill */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Instant EFT &amp; Card
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Verified Merchant ID: <code className="text-blue-400 font-mono font-bold">{PAYFAST_CONFIG.merchantId}</code>
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> PayFast Monthly Recurring (Code 3)
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {SUBSCRIPTION_PLANS.map(plan => {
          const isPro = plan.id === 'pro';
          const isCurrent = currentTier === plan.id;
          const isSubmitting = subscribingPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                isPro
                  ? 'bg-gradient-to-b from-[#161f30] to-[#101726] border-2 border-blue-500 shadow-2xl shadow-blue-950/70 md:-translate-y-2'
                  : 'bg-[#10151e] border border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Popular Badge */}
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg shadow-blue-900/50">
                  Most Popular &bull; Recommended
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {plan.id === 'basic' && 'Essential tools for small crews & solo teams'}
                      {plan.id === 'pro' && 'Full commercial operations & fleet tracking'}
                      {plan.id === 'enterprise' && 'Multi-branch operations & dedicated SLA'}
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400">
                      Active
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="my-6 pb-6 border-b border-slate-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                      R{plan.amount.toFixed(0)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">/ month</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    PayFast Recurring Frequency Code {plan.billingFrequency} (Monthly)
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    What's included:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                    {plan.id === 'basic' && (
                      <>
                        <li className="flex items-start gap-2.5 text-slate-400">
                          <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                          <span>Quotes, Invoicing &amp; WhatsApp Sharing</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-slate-400">
                          <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                          <span>Digital Client Sign-Off</span>
                        </li>
                      </>
                    )}
                    {plan.id === 'pro' && (
                      <>
                        <li className="flex items-start gap-2.5 text-slate-300 font-medium">
                          <span className="text-blue-400 font-bold shrink-0 mt-0.5">✓</span>
                          <span>Live GPS Fleet Tracking &amp; Shift Clock-In</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-slate-300 font-medium">
                          <span className="text-blue-400 font-bold shrink-0 mt-0.5">✓</span>
                          <span>White-Label Invoices with Custom Colors</span>
                        </li>
                      </>
                    )}
                    {plan.id === 'enterprise' && (
                      <>
                        <li className="flex items-start gap-2.5 text-slate-300 font-medium">
                          <span className="text-purple-400 font-bold shrink-0 mt-0.5">✓</span>
                          <span>Regional Multi-Branch Partitioning</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-slate-300 font-medium">
                          <span className="text-purple-400 font-bold shrink-0 mt-0.5">✓</span>
                          <span>Discord &amp; Custom Webhook Integrations</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={() => onSubscribe(plan)}
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 ${
                    isPro
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Opening PayFast...</span>
                    </>
                  ) : (
                    <span>{isCurrent ? 'Subscribe (Renew)' : 'Subscribe'}</span>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-500 mt-2 font-medium">
                  Instant activation upon completion
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* PayFast Payment Guarantee Banner */}
      <div className="max-w-4xl mx-auto px-4 mt-16">
        <div className="p-6 bg-[#10151e] rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0">
              🔒
            </div>
            <div>
              <h4 className="text-base font-black text-white uppercase italic">
                Bank-Grade PayFast Security
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-md">
                Payments are securely processed directly on PayFast's PCI DSS Level 1 certified checkout page using your card or instant EFT.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300">
              Mastercard / Visa
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300">
              Capitec Pay
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300">
              Instant EFT
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-3xl mx-auto px-4 mt-16 text-left">
        <h3 className="text-xl font-black text-white uppercase italic text-center mb-8">
          Frequently Asked Questions
        </h3>
        
        <div className="space-y-4">
          <div className="p-5 bg-[#10151e] rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-1">
              How does PayFast subscription billing work?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              When you click Subscribe, you are redirected to PayFast's official checkout. Once authorized, your subscription renews automatically every month. PayFast notifies your TaskMaster Pro instance instantly via secure ITN webhook.
            </p>
          </div>

          <div className="p-5 bg-[#10151e] rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-1">
              Can I upgrade or downgrade my tier?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes, you can upgrade your organization from Basic (R299) to Pro (R599) or Enterprise (R1299) at any time. Your new tier and limits take effect immediately.
            </p>
          </div>

          <div className="p-5 bg-[#10151e] rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-1">
              Are payments made in South African Rand?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes, all plans are billed strictly in South African Rand (ZAR) via South Africa's leading payment gateway, PayFast.
            </p>
          </div>

          <div className="p-5 bg-[#10151e] rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-1">
              What happens if my payment fails?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              PayFast will retry processing and alert your organization. Your data remains completely safe and accessible in read-only mode during the grace period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
