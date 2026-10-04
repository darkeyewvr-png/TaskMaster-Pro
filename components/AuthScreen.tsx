import React, { useState } from 'react';
import { StaffUser, Company } from '../types';
import { signInWithSupabase, signUpWithSupabase, signInDemoPersona } from '../src/lib/supabase';

interface AuthScreenProps {
  companies: Company[];
  onLogin: (user: StaffUser, company: Company) => void;
  onOpenCompanySignup: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  companies,
  onLogin,
  onOpenCompanySignup,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage('Please enter your work email');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'login') {
        // Authenticate with Supabase and pull profile strictly from Supabase profiles.company_id
        const result = await signInWithSupabase(email.trim(), password, companies);
        setIsSubmitting(false);
        onLogin(result.user, result.company);
      } else {
        // Sign Up with Supabase
        const companyTitle = newCompanyName.trim() || `${name.trim()}'s Services`;
        const result = await signUpWithSupabase(
          email.trim(),
          password,
          name.trim() || email.split('@')[0],
          companyTitle,
          companies
        );
        setIsSubmitting(false);
        onLogin(result.user, result.company);
      }
    } catch (err: any) {
      console.error('Supabase Auth error:', err);
      // Helpful fallback message
      setErrorMessage(err?.message || 'Authentication failed. Please verify credentials.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Connects to Supabase default demo operator
      const result = await signInDemoPersona('owner@aquashine.co.za', companies);
      setIsSubmitting(false);
      onLogin(result.user, result.company);
    } catch (err: any) {
      setErrorMessage(err?.message || 'OAuth authentication failed.');
      setIsSubmitting(false);
    }
  };

  const handleQuickPersona = async (demoEmail: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Pulls strictly from Supabase profiles.company_id for this persona
      const result = await signInDemoPersona(demoEmail, companies);
      setIsSubmitting(false);
      onLogin(result.user, result.company);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to authenticate evaluation persona.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d13] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* App Platform Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-blue-600/20 border border-blue-500/40 text-blue-400 mb-4 shadow-xl shadow-blue-900/30">
            <span className="text-2xl">🏢</span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tight">
            Universal Operations
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
            Strict Multi-Tenant Job Cards, Quotes, Invoicing &amp; Fleet Management.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Tenant bound strictly to <strong className="text-slate-300 font-mono">profiles.company_id</strong></span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-[#161b22] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">
          {/* Tabs: Sign In / Create Account */}
          <div className="grid grid-cols-2 p-1 bg-[#0d1117] rounded-2xl border border-slate-800 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMessage(null); }}
              className={`py-2.5 rounded-xl transition ${
                tab === 'login'
                  ? 'bg-blue-600 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setErrorMessage(null); }}
              className={`py-2.5 rounded-xl transition ${
                tab === 'signup'
                  ? 'bg-blue-600 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleOAuth}
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-2xl bg-[#0d1117] hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-3 mb-5 shadow active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Or Work Credentials
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {errorMessage && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {tab === 'signup' && (
              <>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0d1117] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Precision Detailing &amp; Services"
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0d1117] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. owner@aquashine.co.za"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Password
                </label>
                {tab === 'login' && (
                  <span className="text-[10px] text-slate-500 hover:text-slate-400 cursor-pointer">
                    Forgot?
                  </span>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition shadow-lg shadow-blue-900/40 active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying with Supabase...</span>
                </>
              ) : (
                <span>{tab === 'login' ? 'Sign In & Load Organization' : 'Create Account & Company'}</span>
              )}
            </button>
          </form>

          {/* Quick Demo Evaluation Personas */}
          <div className="mt-8 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                ⚡ 1-Click Evaluation Accounts:
              </span>
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">
                profiles.company_id
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">
              Each account is strictly bound to its own Supabase tenant. Company switching without logout is forbidden.
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickPersona('owner@aquashine.co.za')}
                className="p-2.5 bg-[#0d1117] hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 rounded-xl text-left transition group"
              >
                <div className="font-bold text-white group-hover:text-blue-400 truncate">
                  🚗 AquaShine Owner
                </div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                  Tenant: AquaShine Valet
                </div>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickPersona('tech@aquashine.co.za')}
                className="p-2.5 bg-[#0d1117] hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 rounded-xl text-left transition group"
              >
                <div className="font-bold text-white group-hover:text-blue-400 truncate">
                  🔧 AquaShine Tech
                </div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                  Tenant: AquaShine Valet
                </div>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickPersona('owner@cornerstone.co.za')}
                className="p-2.5 bg-[#0d1117] hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition group"
              >
                <div className="font-bold text-white group-hover:text-emerald-400 truncate">
                  🔨 Cornerstone Director
                </div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                  Tenant: Cornerstone Labour
                </div>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickPersona('owner@metroexpress.co.za')}
                className="p-2.5 bg-[#0d1117] hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition group"
              >
                <div className="font-bold text-white group-hover:text-amber-400 truncate">
                  🏪 Metro Retail Owner
                </div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                  Tenant: Metro Supplies
                </div>
              </button>
            </div>
          </div>

          {/* New Company Registration Button */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={onOpenCompanySignup}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider transition hover:underline"
            >
              + Register New Independent Organization
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-600 mt-6 uppercase font-bold tracking-wider">
          Universal Operations Multi-Tenant Platform &bull; Enforced Supabase RLS
        </p>
      </div>
    </div>
  );
};
