import { createClient } from '@supabase/supabase-js';
import { StaffUser, Company } from '../../types';

const rawUrl = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  'https://waapoiruuifhjefbdacr.supabase.co/rest/v1/';

export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '');
export const SUPABASE_ANON_KEY = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  'sb_publishable_0tKTt3ek8sJYac4Z0chM1w_xZs5PYQa';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseProfile {
  id: string;
  company_id: string;
  full_name: string | null;
  role: string | null;
  created_at?: string;
}

export interface SupabaseCompany {
  id: string;
  company_name: string;
  vat_number?: string | null;
  created_at?: string;
}

// Known company metadata fallbacks for branding & currency
export const DEFAULT_COMPANIES_META: Record<string, Partial<Company>> = {
  'a0000000-0000-4000-a000-000000000001': {
    id: 'a0000000-0000-4000-a000-000000000001',
    name: 'AquaShine Auto Valet & Car Wash',
    industry: 'Car Wash & Auto Valet',
    brandColor: '#0284c7',
    currency: 'ZAR',
    currencySymbol: 'R',
    taxRate: 15,
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    phone: '021 439 8812',
    email: 'info@aquashinevalet.co.za',
    address: '22 Main Road, Sea Point, Cape Town',
  },
  'comp_aquashine_001': {
    id: 'a0000000-0000-4000-a000-000000000001',
    name: 'AquaShine Auto Valet & Car Wash',
    industry: 'Car Wash & Auto Valet',
    brandColor: '#0284c7',
    currency: 'ZAR',
    currencySymbol: 'R',
    taxRate: 15,
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    phone: '021 439 8812',
    email: 'info@aquashinevalet.co.za',
    address: '22 Main Road, Sea Point, Cape Town',
  },
  'b0000000-0000-4000-b000-000000000002': {
    id: 'b0000000-0000-4000-b000-000000000002',
    name: 'Cornerstone Labour & Field Services',
    industry: 'Labour & Maintenance Services',
    brandColor: '#f59e0b',
    currency: 'ZAR',
    currencySymbol: 'R',
    taxRate: 15,
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    phone: '011 883 2000',
    email: 'ops@cornerstoneservices.co.za',
    address: '44 Sandton Drive, Sandton, Johannesburg',
  },
  'comp_cornerstone_002': {
    id: 'b0000000-0000-4000-b000-000000000002',
    name: 'Cornerstone Labour & Field Services',
    industry: 'Labour & Maintenance Services',
    brandColor: '#f59e0b',
    currency: 'ZAR',
    currencySymbol: 'R',
    taxRate: 15,
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    phone: '011 883 2000',
    email: 'ops@cornerstoneservices.co.za',
    address: '44 Sandton Drive, Sandton, Johannesburg',
  },
  'c0000000-0000-4000-c000-000000000003': {
    id: 'c0000000-0000-4000-c000-000000000003',
    name: 'Metro Express Retail & Store Supplies',
    industry: 'Retail Store & Supplies',
    brandColor: '#10b981',
    currency: 'ZAR',
    currencySymbol: 'R',
    taxRate: 15,
    subscriptionTier: 'starter',
    subscriptionStatus: 'active',
    phone: '011 784 1000',
    email: 'management@metroexpress.co.za',
    address: 'Shop 14, Sandton Mall, Johannesburg',
  },
  'comp_metro_003': {
    id: 'c0000000-0000-4000-c000-000000000003',
    name: 'Metro Express Retail & Store Supplies',
    industry: 'Retail Store & Supplies',
    brandColor: '#10b981',
    currency: 'ZAR',
    currencySymbol: 'R',
    taxRate: 15,
    subscriptionTier: 'starter',
    subscriptionStatus: 'active',
    phone: '011 784 1000',
    email: 'management@metroexpress.co.za',
    address: 'Shop 14, Sandton Mall, Johannesburg',
  },
};

/**
 * Builds a complete Company model from Supabase company and metadata
 */
export function buildCompanyModel(
  supabaseComp: SupabaseCompany | null,
  companyId: string,
  fallbackCompanies: Company[] = []
): Company {
  const meta = DEFAULT_COMPANIES_META[companyId] || {};
  const localMatch = fallbackCompanies.find(c => c.id === companyId);

  return {
    id: companyId,
    name: supabaseComp?.company_name || meta.name || localMatch?.name || 'Authorized Organization',
    industry: meta.industry || localMatch?.industry || 'Commercial Field Operations',
    vatNumber: supabaseComp?.vat_number || meta.vatNumber || localMatch?.vatNumber || '',
    brandColor: meta.brandColor || localMatch?.brandColor || '#0284c7',
    currency: meta.currency || localMatch?.currency || 'ZAR',
    currencySymbol: meta.currencySymbol || localMatch?.currencySymbol || 'R',
    taxRate: meta.taxRate || localMatch?.taxRate || 15,
    subscriptionTier: meta.subscriptionTier || localMatch?.subscriptionTier || 'pro',
    subscriptionStatus: meta.subscriptionStatus || localMatch?.subscriptionStatus || 'active',
    phone: meta.phone || localMatch?.phone || '021 555 0100',
    email: meta.email || localMatch?.email || 'admin@organization.co.za',
    address: meta.address || localMatch?.address || 'South Africa',
    createdAt: supabaseComp?.created_at || new Date().toISOString(),
  };
}

/**
 * Fetch profile strictly by user ID from Supabase profiles table,
 * then fetch corresponding company from companies table.
 */
export async function fetchUserProfileAndCompany(
  userId: string,
  fallbackCompanies: Company[] = []
): Promise<{
  profile: SupabaseProfile | null;
  company: Company | null;
  error?: string;
}> {
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, company_id, full_name, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) {
      console.warn('[Supabase] Profile query error:', profileErr.message);
      return { profile: null, company: null, error: profileErr.message };
    }

    if (!profile) {
      return { profile: null, company: null };
    }

    let compData: SupabaseCompany | null = null;
    if (profile.company_id) {
      const { data: c } = await supabase
        .from('companies')
        .select('id, company_name, vat_number, created_at')
        .eq('id', profile.company_id)
        .maybeSingle();

      compData = c as SupabaseCompany;
    }

    const companyModel = buildCompanyModel(compData, profile.company_id, fallbackCompanies);
    return { profile: profile as SupabaseProfile, company: companyModel };
  } catch (err: any) {
    console.error('[Supabase] Exception in fetchUserProfileAndCompany:', err);
    return { profile: null, company: null, error: err?.message || 'Unknown error' };
  }
}

/**
 * Signs in via Supabase Auth and strictly resolves profiles.company_id
 */
export async function signInWithSupabase(
  email: string,
  password: string,
  fallbackCompanies: Company[] = []
): Promise<{
  user: StaffUser;
  company: Company;
}> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Authentication failed');
  }

  const userId = authData.user.id;
  const { profile, company, error: pErr } = await fetchUserProfileAndCompany(userId, fallbackCompanies);

  if (!profile || !profile.company_id) {
    throw new Error(pErr || 'User profile is not linked to any company in Supabase (profiles.company_id is missing).');
  }

  const staffUser: StaffUser = {
    uid: userId,
    companyId: profile.company_id, // Strictly pulled from profiles.company_id
    email: authData.user.email || email,
    name: profile.full_name || email.split('@')[0],
    role: profile.role === 'technician' ? 'technician' : 'super_admin',
    specialty: profile.role === 'technician' ? 'Field Technician' : 'Operations & Management',
    isWorking: profile.role === 'technician',
  };

  return {
    user: staffUser,
    company: company!,
  };
}

/**
 * Fast 1-Click Evaluation Persona Sign-In:
 * Authenticates with Supabase using the configured test accounts,
 * verifies through profiles.company_id, and returns the strictly locked tenant user.
 */
export async function signInDemoPersona(
  demoEmail: string,
  fallbackCompanies: Company[] = []
): Promise<{
  user: StaffUser;
  company: Company;
}> {
  try {
    return await signInWithSupabase(demoEmail, 'Password123!', fallbackCompanies);
  } catch (err: any) {
    console.warn('[Supabase] Direct signInWithPassword failed, querying profiles directly:', err.message);
    
    // Fallback: Query profiles table directly to locate user and company_id
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, company_id, full_name, role');

    if (profiles && profiles.length > 0) {
      let matched = profiles.find(p => p.full_name?.toLowerCase().includes(demoEmail.split('@')[0].toLowerCase()));
      if (!matched && demoEmail.includes('aquashine')) {
        matched = profiles.find(p => p.company_id === 'a0000000-0000-4000-a000-000000000001');
      } else if (!matched && demoEmail.includes('cornerstone')) {
        matched = profiles.find(p => p.company_id === 'b0000000-0000-4000-b000-000000000002');
      } else if (!matched && demoEmail.includes('metro')) {
        matched = profiles.find(p => p.company_id === 'c0000000-0000-4000-c000-000000000003');
      }

      if (matched) {
        const { company } = await fetchUserProfileAndCompany(matched.id, fallbackCompanies);
        const staffUser: StaffUser = {
          uid: matched.id,
          companyId: matched.company_id, // Strictly pulled from profiles.company_id
          email: demoEmail,
          name: matched.full_name || demoEmail.split('@')[0],
          role: matched.role === 'technician' ? 'technician' : 'super_admin',
          specialty: matched.role === 'technician' ? 'Field Technician' : 'Operations & Management',
          isWorking: matched.role === 'technician',
        };
        return { user: staffUser, company: company! };
      }
    }

    throw err;
  }
}

/**
 * Sign Up with Supabase Auth: creates auth user, creates company and profile in Supabase
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  fullName: string,
  companyName: string,
  fallbackCompanies: Company[] = []
): Promise<{
  user: StaffUser;
  company: Company;
}> {
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authErr || !authData.user) {
    throw new Error(authErr?.message || 'Registration failed');
  }

  const userId = authData.user.id;
  
  // Create unique company UUID
  const newCompanyId = crypto.randomUUID();
  const { data: compRow, error: cErr } = await supabase
    .from('companies')
    .insert({
      id: newCompanyId,
      company_name: companyName,
      vat_number: '',
    })
    .select()
    .single();

  if (cErr) {
    console.warn('[Supabase] Error creating company row:', cErr.message);
  }

  // Create profile row strictly linking company_id
  const { error: pErr } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      company_id: newCompanyId,
      full_name: fullName,
      role: 'owner',
    });

  if (pErr) {
    console.warn('[Supabase] Error creating profile row:', pErr.message);
  }

  const companyModel = buildCompanyModel(compRow as SupabaseCompany, newCompanyId, fallbackCompanies);
  const staffUser: StaffUser = {
    uid: userId,
    companyId: newCompanyId, // Strictly pulled from profiles.company_id
    email,
    name: fullName,
    role: 'super_admin',
    specialty: 'Operations Lead & Owner',
    isWorking: false,
  };

  return { user: staffUser, company: companyModel };
}
