import React, { useState, useEffect, useMemo } from 'react';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, orderBy, runTransaction, serverTimestamp, where, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from './firebase';
import { 
  Job, 
  BillingDocument, 
  Client, 
  Service, 
  StockTake, 
  ShiftLog, 
  StaffUser, 
  Company, 
  UserRole 
} from './types';
import { getNextInvoiceNumber } from './utils/getNextInvoiceNumber';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import JobDetail from './components/JobDetail';
import DocumentDetail from './components/DocumentDetail';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import StockTakeList from './components/StockTakeList';
import StockTakeDetail from './components/StockTakeDetail';
import LocationTracker from './components/LocationTracker';
import LiveMap from './components/LiveMap';
import StaffList from './components/StaffList';
import { SubscriptionBillingModal } from './components/SubscriptionBillingModal';
import { CompanySignupModal } from './components/CompanySignupModal';
import { TenantSwitcherModal } from './components/TenantSwitcherModal';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AIElectricalAssistantModal } from './components/AIElectricalAssistantModal';

function cleanForFirestore(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (typeof obj.toDate === 'function') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore);
  }

  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = cleanForFirestore(obj[key]);
    }
  }
  return cleaned;
}

// Pre-seeded Multi-Tenant Independent Companies (Car Wash, General Labour, Retail Store)
const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_aquashine_001',
    name: 'AquaShine Auto Valet & Car Wash',
    slug: 'aquashine-valet',
    registrationNumber: '2024/091823/07',
    vatNumber: '4190283719',
    phone: '021 439 8812',
    email: 'info@aquashinevalet.co.za',
    address: '22 Main Road, Sea Point, Cape Town',
    website: 'https://aquashinevalet.co.za',
    brandColor: '#0284c7', // Sky Blue
    accentColor: '#38bdf8',
    currency: 'ZAR',
    currencySymbol: 'R',
    taxRate: 15,
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    billingGateway: 'payfast',
    planAmount: 1299,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'comp_cornerstone_002',
    name: 'Cornerstone Labour & Field Services',
    slug: 'cornerstone-labour',
    registrationNumber: '2023/182910/07',
    vatNumber: '4910293812',
    phone: '011 445 9182',
    email: 'dispatch@cornerstonefield.co.za',
    address: 'Unit 8, Stikland Industrial Park, Bellville, Cape Town',
    website: 'https://cornerstonefield.co.za',
    brandColor: '#2563eb', // Royal Blue
    accentColor: '#10b981',
    currency: 'ZAR',
    currencySymbol: 'R',
    taxRate: 15,
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    nextBillingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    billingGateway: 'stripe',
    planAmount: 1299,
    createdAt: '2026-02-15T00:00:00.000Z',
  },
  {
    id: 'comp_metro_003',
    name: 'Metro Express Retail & Store Supplies',
    slug: 'metro-retail',
    registrationNumber: '2022/448102/07',
    vatNumber: '4820194821',
    phone: '011 883 2000',
    email: 'operations@metroexpress.co.za',
    address: 'Shop 14, Sandton City Center, Johannesburg',
    website: 'https://metroexpress.co.za',
    brandColor: '#059669', // Emerald Green
    accentColor: '#f59e0b',
    currency: 'ZAR',
    currencySymbol: 'R',
    taxRate: 15,
    subscriptionTier: 'starter',
    subscriptionStatus: 'active',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    nextBillingDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    billingGateway: 'payfast',
    planAmount: 499,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
];

// Pre-seeded Tenant Users
const SEED_STAFF_BY_COMPANY: Record<string, StaffUser[]> = {
  comp_aquashine_001: [
    {
      uid: 'alex-owner-01',
      companyId: 'comp_aquashine_001',
      email: 'alex@aquashinevalet.co.za',
      name: 'Alex Morgan',
      role: 'super_admin',
      specialty: 'Detailing Operations Manager & Owner',
      phone: '082 555 0192',
      isWorking: false,
    },
    {
      uid: 'thabo-valet-02',
      companyId: 'comp_aquashine_001',
      email: 'thabo@aquashinevalet.co.za',
      name: 'Thabo Ndlovu',
      role: 'technician',
      specialty: 'Lead Valet Specialist & Paint Correction',
      phone: '072 999 8877',
      isWorking: false,
    },
  ],
  comp_cornerstone_002: [
    {
      uid: 'gerrit-admin-01',
      companyId: 'comp_cornerstone_002',
      email: 'gerrit@cornerstonefield.co.za',
      name: 'Gerrit Basson',
      role: 'super_admin',
      specialty: 'Field Services Director',
      phone: '083 444 0183',
      isWorking: false,
    },
    {
      uid: 'kobus-tech-02',
      companyId: 'comp_cornerstone_002',
      email: 'kobus@cornerstonefield.co.za',
      name: 'Kobus van der Merwe',
      role: 'technician',
      specialty: 'Commercial Maintenance & Pressure Washing',
      phone: '071 333 0174',
      isWorking: false,
    },
  ],
  comp_metro_003: [
    {
      uid: 'sarah-manager-01',
      companyId: 'comp_metro_003',
      email: 'sarah@metroexpress.co.za',
      name: 'Sarah Jenkins',
      role: 'super_admin',
      specialty: 'Store General Manager',
      phone: '082 111 4455',
      isWorking: false,
    },
    {
      uid: 'liam-inventory-02',
      companyId: 'comp_metro_003',
      email: 'liam@metroexpress.co.za',
      name: 'Liam Pillay',
      role: 'technician',
      specialty: 'Inventory & POS Fixtures Specialist',
      phone: '084 777 2233',
      isWorking: false,
    },
  ],
};

// Seed Jobs for Tenant A (AquaShine Auto Valet & Car Wash)
const SEED_JOBS_AQUASHINE: Job[] = [
  {
    id: 'job-aqua-01',
    companyId: 'comp_aquashine_001',
    jobNumber: 'VALET-2026-081',
    clientId: 'Protea Hotel Fleet Vehicles',
    phone: '021 555 9182',
    email: 'maintenance@proteawaterfront.co.za',
    location: 'Portswood Rd, V&A Waterfront, Cape Town',
    category: 'Wash & Valet / Detail',
    priority: 'HIGH',
    status: 'WORKING',
    assignedTechUid: 'thabo-valet-02',
    technician: 'Thabo Ndlovu',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    notes: '3 VIP executive shuttles require full decontamination wash and interior steam clean before airport pickup.',
    description: 'Executed high foam snow pre-wash, two-bucket hand wash, wheel iron fallout removal, interior upholstery steam extraction, and ceramic spray sealant.',
    quoteId: null,
    invoiceId: 'inv-aqua-01',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'job-aqua-02',
    companyId: 'comp_aquashine_001',
    jobNumber: 'VALET-2026-082',
    clientId: 'Cape Logistics Express Couriers',
    phone: '083 456 7890',
    email: 'fleet@capelogistics.co.za',
    location: 'Airport Industria, Cape Town',
    category: 'Standard Service',
    priority: 'MEDIUM',
    status: 'OPEN',
    assignedTechUid: 'alex-owner-01',
    technician: 'Alex Morgan',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    notes: 'Routine weekly fleet wash for 5 delivery vans.',
    description: 'High-pressure undercarriage wash, bug removal, window clarity polish, and dashboard anti-static sanitization.',
    quoteId: 'qte-aqua-01',
    invoiceId: null,
    createdAt: new Date().toISOString(),
  },
];

// Seed Jobs for Tenant B (Cornerstone Labour & Field Services)
const SEED_JOBS_CORNERSTONE: Job[] = [
  {
    id: 'job-corn-01',
    companyId: 'comp_cornerstone_002',
    jobNumber: 'COR-2026-101',
    clientId: 'Sandton Corporate Office Park',
    phone: '011 883 2000',
    email: 'facilities@sandtoncorp.co.za',
    location: 'Rivonia Rd & 5th St, Sandton, Johannesburg',
    category: 'General Labour',
    priority: 'EMERGENCY',
    status: 'WORKING',
    assignedTechUid: 'kobus-tech-02',
    technician: 'Kobus van der Merwe',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    notes: 'Urgent site cleanup and pressure washing required before board of directors visit.',
    description: 'Paving water-blasting to remove oil buildup, debris clearance and waste bagging, and maintenance check on parking boom gate mechanism.',
    quoteId: null,
    invoiceId: null,
    createdAt: new Date().toISOString(),
  },
];

// Seed Jobs for Tenant C (Metro Express Retail)
const SEED_JOBS_METRO: Job[] = [
  {
    id: 'job-met-01',
    companyId: 'comp_metro_003',
    jobNumber: 'METRO-2026-042',
    clientId: 'Sandton Central Storefront',
    phone: '011 784 1000',
    email: 'store@metroexpress.co.za',
    location: 'Shop 14, Sandton Mall, Johannesburg',
    category: 'Stock Audit & Inventory',
    priority: 'HIGH',
    status: 'OPEN',
    assignedTechUid: 'liam-inventory-02',
    technician: 'Liam Pillay',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    notes: 'Delivery arrival from distribution depot: 15 pallets of dry groceries and household merchandise.',
    description: 'Pallet barcode receiving, stock intake count, shelf replenishment across aisles 1-4, and POS scanner wireless sync verification.',
    quoteId: null,
    invoiceId: null,
    createdAt: new Date().toISOString(),
  },
];

// Seed Invoices for AquaShine
const SEED_INVOICES_AQUASHINE: BillingDocument[] = [
  {
    id: 'inv-aqua-01',
    companyId: 'comp_aquashine_001',
    type: 'INVOICE',
    documentNumber: 'INV-2026-0045',
    invoiceNumber: 'INV-2026-0045',
    jobId: 'job-aqua-01',
    clientId: 'Protea Hotel Fleet Vehicles',
    date: new Date(),
    materials: [
      { description: 'Premium Ceramic Coating Sealant & Foam Shampoo', qty: 3, unitPrice: 350, amount: 1050 },
      { description: 'Leather Interior Conditioner & Anti-Bacterial Sanitizer', qty: 3, unitPrice: 180, amount: 540 },
    ],
    labour: [
      { description: 'Full Valet Detailing & Interior Steam Extraction', hours: 4.5, rate: 450, amount: 2025 },
    ],
    subtotal: 3615,
    discount: 0,
    includeVat: true,
    vatRate: 15,
    vatAmount: 542.25,
    total: 4157.25,
    isPaid: true,
    status: 'PAID',
    address: 'V&A Waterfront, Cape Town',
    contactDetails: '021 555 9182',
    narrative: 'Executive valet treatment and interior sanitization for 3 fleet shuttles.',
  },
];

const App: React.FC = () => {
  // 1. Multi-Tenant Companies State
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem('saas_contractor_companies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_COMPANIES;
    } catch {
      return INITIAL_COMPANIES;
    }
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('saas_active_company_id');
      const found = INITIAL_COMPANIES.find(c => c.id === saved);
      return found ? found.id : INITIAL_COMPANIES[0].id;
    } catch {
      return INITIAL_COMPANIES[0].id;
    }
  });

  const activeCompany = useMemo(() => {
    return companies.find(c => c.id === activeCompanyId) || companies[0] || INITIAL_COMPANIES[0];
  }, [companies, activeCompanyId]);

  // Save companies and active ID to storage
  useEffect(() => {
    localStorage.setItem('saas_contractor_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('saas_active_company_id', activeCompany.id);
  }, [activeCompany.id]);

  // 2. Current Operator User & Role State (Defaults to null - logged out state)
  const [currentOperator, setCurrentOperator] = useState<StaffUser | null>(() => {
    try {
      const saved = localStorage.getItem('saas_current_operator');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Exclude legacy mock Wayne van Rooyen
        if (
          parsed?.uid &&
          parsed.uid !== 'wayne-owner-01' &&
          parsed.uid !== 'user_default' &&
          parsed.email !== 'wayne@aquashinevalet.co.za' &&
          parsed.name !== 'Wayne van Rooyen'
        ) {
          return parsed;
        }
      }
    } catch {}
    // Default to null (logged out state)
    return null;
  });

  useEffect(() => {
    if (currentOperator) {
      localStorage.setItem('saas_current_operator', JSON.stringify(currentOperator));
    } else {
      localStorage.removeItem('saas_current_operator');
    }
  }, [currentOperator]);

  const isSuperAdmin = currentOperator?.role === 'super_admin' || currentOperator?.role === 'admin';

  // 3. Modals State
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCompanySignupModal, setShowCompanySignupModal] = useState(false);
  const [showTenantSwitcherModal, setShowTenantSwitcherModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // 4. Data State for All Tenants (with fallback pre-seeding)
  const [allJobs, setAllJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem('saas_all_jobs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [...SEED_JOBS_AQUASHINE, ...SEED_JOBS_CORNERSTONE, ...SEED_JOBS_METRO];
    } catch {
      return [...SEED_JOBS_AQUASHINE, ...SEED_JOBS_CORNERSTONE, ...SEED_JOBS_METRO];
    }
  });

  const [allBilling, setAllBilling] = useState<BillingDocument[]>(() => {
    try {
      const saved = localStorage.getItem('saas_all_billing');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return SEED_INVOICES_AQUASHINE;
    } catch {
      return SEED_INVOICES_AQUASHINE;
    }
  });

  const [allStaff, setAllStaff] = useState<Record<string, StaffUser[]>>(() => {
    try {
      const saved = localStorage.getItem('saas_all_staff');
      if (saved) return JSON.parse(saved);
      return SEED_STAFF_BY_COMPANY;
    } catch {
      return SEED_STAFF_BY_COMPANY;
    }
  });

  const [allClients, setAllClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('saas_all_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return [
        { id: 'cli-01', companyId: 'comp_aquashine_001', name: 'Protea Hotel Fleet Vehicles', phone: '021 555 9182', email: 'maintenance@proteawaterfront.co.za', address: 'Portswood Rd, V&A Waterfront, Cape Town' },
        { id: 'cli-02', companyId: 'comp_aquashine_001', name: 'Cape Logistics Express Couriers', phone: '083 456 7890', email: 'fleet@capelogistics.co.za', address: 'Airport Industria, Cape Town' },
        { id: 'cli-03', companyId: 'comp_cornerstone_002', name: 'Sandton Corporate Office Park', phone: '011 883 2000', email: 'facilities@sandtoncorp.co.za', address: 'Rivonia Rd & 5th St, Sandton' },
        { id: 'cli-04', companyId: 'comp_metro_003', name: 'Sandton Central Storefront', phone: '011 784 1000', email: 'store@metroexpress.co.za', address: 'Shop 14, Sandton Mall, Johannesburg' },
      ];
    } catch {
      return [];
    }
  });

  const [allStockTakes, setAllStockTakes] = useState<StockTake[]>(() => {
    try {
      const saved = localStorage.getItem('saas_all_stocktakes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [allShiftLogs, setAllShiftLogs] = useState<ShiftLog[]>(() => {
    try {
      const saved = localStorage.getItem('saas_all_shiftlogs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist data locally
  useEffect(() => { localStorage.setItem('saas_all_jobs', JSON.stringify(allJobs)); }, [allJobs]);
  useEffect(() => { localStorage.setItem('saas_all_billing', JSON.stringify(allBilling)); }, [allBilling]);
  useEffect(() => { localStorage.setItem('saas_all_staff', JSON.stringify(allStaff)); }, [allStaff]);
  useEffect(() => { localStorage.setItem('saas_all_clients', JSON.stringify(allClients)); }, [allClients]);
  useEffect(() => { localStorage.setItem('saas_all_stocktakes', JSON.stringify(allStockTakes)); }, [allStockTakes]);
  useEffect(() => { localStorage.setItem('saas_all_shiftlogs', JSON.stringify(allShiftLogs)); }, [allShiftLogs]);

  // 5. Tenant Partitioned Data (Row Level Isolation)
  const tenantJobs = useMemo(() => {
    if (!Array.isArray(allJobs) || !activeCompany?.id) return [];
    return allJobs.filter(j => j && j.companyId === activeCompany.id);
  }, [allJobs, activeCompany?.id]);

  const tenantQuotes = useMemo(() => {
    if (!Array.isArray(allBilling) || !activeCompany?.id) return [];
    return allBilling.filter(b => b && b.companyId === activeCompany.id && b.type === 'QUOTE');
  }, [allBilling, activeCompany?.id]);

  const tenantInvoices = useMemo(() => {
    if (!Array.isArray(allBilling) || !activeCompany?.id) return [];
    return allBilling.filter(b => b && b.companyId === activeCompany.id && b.type === 'INVOICE');
  }, [allBilling, activeCompany?.id]);

  const tenantClients = useMemo(() => {
    if (!Array.isArray(allClients) || !activeCompany?.id) return [];
    return allClients.filter(c => c && c.companyId === activeCompany.id);
  }, [allClients, activeCompany?.id]);

  const tenantStaff = useMemo(() => {
    if (!activeCompany?.id) return [];
    return allStaff[activeCompany.id] || [];
  }, [allStaff, activeCompany?.id]);

  const tenantStockTakes = useMemo(() => {
    if (!Array.isArray(allStockTakes) || !activeCompany?.id) return [];
    return allStockTakes.filter(s => s && s.companyId === activeCompany.id);
  }, [allStockTakes, activeCompany?.id]);

  const tenantShiftLogs = useMemo(() => {
    if (!Array.isArray(allShiftLogs) || !activeCompany?.id) return [];
    return allShiftLogs.filter(s => s && s.companyId === activeCompany.id);
  }, [allShiftLogs, activeCompany?.id]);

  // Standard commercial services & supplies rates catalog
  const services: Service[] = useMemo(() => [
    { id: 'srv-1', companyId: activeCompany.id, description: 'Standard Service Call-Out & Intake Inspection', price: 450, type: 'LABOUR', category: 'Call-Out' },
    { id: 'srv-2', companyId: activeCompany.id, description: 'Standard Hourly Service / Labour Rate', price: 380, type: 'LABOUR', category: 'Labour' },
    { id: 'srv-3', companyId: activeCompany.id, description: 'Premium Service / Full Valet / Deep Inspection Package', price: 950, type: 'LABOUR', category: 'Service Package' },
    { id: 'srv-4', companyId: activeCompany.id, description: 'Consumables, Cleaning Chemicals & Operational Supplies', price: 280, type: 'MATERIAL', category: 'Supplies' },
    { id: 'srv-5', companyId: activeCompany.id, description: 'Replacement Hardware / Parts & Materials', price: 650, type: 'MATERIAL', category: 'Parts' },
  ], [activeCompany.id]);

  // View state
  const [view, setView] = useState<'dashboard' | 'job-logs' | 'quotes' | 'invoices' | 'clients' | 'client-detail' | 'job-edit' | 'quote-edit' | 'invoice-edit' | 'stock-take' | 'live-track' | 'staff' | 'subscription'>('dashboard');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedStockTakeId, setSelectedStockTakeId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [isWorking, setIsWorking] = useState(currentOperator?.isWorking || false);

  // Keyboard shortcut for Global Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Theme support
  const [isDarkMode, setIsDarkMode] = useState(true);
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handlers for Tenant Switching & Auth
  const handleSelectTenant = (company: Company, user?: StaffUser) => {
    setActiveCompanyId(company.id);
    if (user) {
      setCurrentOperator(user);
    } else {
      const staffForCompany = allStaff[company.id] || [];
      if (staffForCompany.length > 0) {
        setCurrentOperator(staffForCompany[0]);
      } else {
        setCurrentOperator({
          uid: 'user_' + Date.now(),
          companyId: company.id,
          email: company.email || 'owner@' + company.slug + '.co.za',
          name: company.name + ' Admin',
          role: 'super_admin',
          specialty: 'Operations & Management',
          isWorking: false,
        });
      }
    }
    setView('dashboard');
  };

  const handleCompanyCreated = (newCompany: Company, owner: StaffUser) => {
    setCompanies(prev => [newCompany, ...prev]);
    setAllStaff(prev => ({
      ...prev,
      [newCompany.id]: [owner],
    }));
    setActiveCompanyId(newCompany.id);
    setCurrentOperator(owner);
    setShowCompanySignupModal(false);
    setView('dashboard');
  };

  const handleUpdateCompany = (updated: Company) => {
    setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleLogout = () => {
    setCurrentOperator(null);
    localStorage.removeItem('saas_current_operator');
    setView('dashboard');
  };

  // Job Actions
  const handleSelectJob = (id: string, type?: 'job' | 'quote' | 'invoice') => {
    if (type === 'quote') {
      setSelectedDocId(id);
      setView('quote-edit');
    } else if (type === 'invoice') {
      setSelectedDocId(id);
      setView('invoice-edit');
    } else {
      setSelectedJobId(id);
      setView('job-edit');
    }
  };

  const handleNewJob = (type: 'job' | 'quote' | 'invoice', data?: any) => {
    setSelectedJobId(null);
    setSelectedDocId(null);
    setInitialData(data || null);
    if (type === 'quote') {
      setView('quote-edit');
    } else if (type === 'invoice') {
      setView('invoice-edit');
    } else {
      setView('job-edit');
    }
  };

  const handleSaveJob = (jobData: any) => {
    if (jobData.id) {
      setAllJobs(prev => prev.map(j => j.id === jobData.id ? { ...j, ...jobData } : j));
    } else {
      const newJob: Job = {
        ...jobData,
        id: 'job_' + Date.now(),
        companyId: activeCompany.id,
        jobNumber: jobData.jobNumber || `JOB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString(),
      };
      setAllJobs(prev => [newJob, ...prev]);
    }
    setView('job-logs');
  };

  const handleDeleteJob = (id: string) => {
    if (!isSuperAdmin) {
      alert("Permission denied. Only Super Admins can delete job records.");
      return;
    }
    if (confirm("Are you sure you want to permanently delete this job card?")) {
      setAllJobs(prev => prev.filter(j => j.id !== id));
      setView('job-logs');
    }
  };

  // Document (Quote/Invoice) Handlers
  const handleSaveDoc = (docData: BillingDocument) => {
    if (docData.id) {
      setAllBilling(prev => prev.map(d => d.id === docData.id ? docData : d));
    } else {
      const newDoc: BillingDocument = {
        ...docData,
        id: 'doc_' + Date.now(),
        companyId: activeCompany.id,
        createdAt: new Date().toISOString(),
      };
      setAllBilling(prev => [newDoc, ...prev]);
    }
    setView(docData.type === 'QUOTE' ? 'quotes' : 'invoices');
  };

  const handleDeleteDoc = (id: string) => {
    if (!isSuperAdmin) {
      alert("Permission denied. Only Super Admins can delete billing documents.");
      return;
    }
    if (confirm("Are you sure you want to delete this document?")) {
      setAllBilling(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleTogglePaid = (id: string, currentStatus: boolean) => {
    if (!isSuperAdmin) {
      alert("Permission denied. Only Super Admins can alter invoice payment status.");
      return;
    }
    setAllBilling(prev => prev.map(b => b.id === id ? { ...b, isPaid: !currentStatus, status: !currentStatus ? 'PAID' : 'UNPAID' } : b));
  };

  // Shift & Clock in/out
  const handleClockIn = () => {
    setIsWorking(true);
    setCurrentOperator(prev => ({ ...prev, isWorking: true }));
    const log: ShiftLog = {
      id: 'shift_' + Date.now(),
      companyId: activeCompany.id,
      userId: currentOperator.uid,
      userName: currentOperator.name || currentOperator.email,
      clockIn: new Date().toISOString(),
      status: 'active',
    };
    setAllShiftLogs(prev => [log, ...prev]);
  };

  const handleClockOut = () => {
    setIsWorking(false);
    setCurrentOperator(prev => ({ ...prev, isWorking: false }));
    setAllShiftLogs(prev => prev.map(s => {
      if (s.userId === currentOperator.uid && s.status === 'active') {
        const end = new Date();
        const start = new Date(s.clockIn);
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return {
          ...s,
          clockOut: end.toISOString(),
          durationHours: Number(durationHours.toFixed(2)),
          status: 'completed',
        };
      }
      return s;
    }));
  };

  // Staff Management Handlers
  const handleAddStaff = (newStaff: { email: string; name: string; role: UserRole; specialty?: string; phone?: string }) => {
    const user: StaffUser = {
      ...newStaff,
      uid: 'staff_' + Date.now(),
      companyId: activeCompany.id,
      isWorking: false,
    };
    setAllStaff(prev => ({
      ...prev,
      [activeCompany.id]: [...(prev[activeCompany.id] || []), user],
    }));
  };

  const handleUpdateStaff = (uid: string, updated: Partial<StaffUser>) => {
    setAllStaff(prev => ({
      ...prev,
      [activeCompany.id]: (prev[activeCompany.id] || []).map(s => s.uid === uid ? { ...s, ...updated } : s),
    }));
  };

  const handleDeleteStaff = (uid: string) => {
    if (!isSuperAdmin) {
      alert("Permission denied. Only Super Admins can remove staff members.");
      return;
    }
    setAllStaff(prev => ({
      ...prev,
      [activeCompany.id]: (prev[activeCompany.id] || []).filter(s => s.uid !== uid),
    }));
  };

  // Lookup items for editing
  const currentJob = useMemo(() => {
    return tenantJobs.find(j => j.id === selectedJobId);
  }, [tenantJobs, selectedJobId]);

  const currentDoc = useMemo(() => {
    return allBilling.find(b => b.id === selectedDocId);
  }, [allBilling, selectedDocId]);

  // If user is not authenticated, show the Sign In / Sign Up page by default
  if (!currentOperator) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#0d1117]' : 'bg-slate-50'}`}>
        <AuthScreen
          companies={companies}
          onLogin={handleSelectTenant}
          onOpenCompanySignup={() => setShowCompanySignupModal(true)}
        />
        <CompanySignupModal
          isOpen={showCompanySignupModal}
          onClose={() => setShowCompanySignupModal(false)}
          onCompanyCreated={handleCompanyCreated}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isDarkMode ? 'dark bg-[#0d1117] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* SaaS Multi-Tenant Header */}
      <header className="sticky top-0 z-40 bg-[#0d1117]/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Tenant Identity & Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTenantSwitcherModal(true)}
              className="flex items-center gap-2.5 p-1.5 hover:bg-slate-800/80 rounded-2xl transition border border-slate-800 text-left group"
              title="Switch Tenant / Organization"
            >
              {activeCompany.logoUrl ? (
                <img src={activeCompany.logoUrl} alt={activeCompany.name} className="w-8 h-8 rounded-xl object-contain bg-white/5 p-1" />
              ) : (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md"
                  style={{ backgroundColor: activeCompany.brandColor || '#2563eb' }}
                >
                  🏢
                </div>
              )}
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white group-hover:text-blue-400 transition leading-none truncate max-w-[180px]">
                    {activeCompany.name}
                  </span>
                  <span className="text-[10px] text-slate-500">▼</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-1 rounded border border-emerald-500/20">
                    {activeCompany.subscriptionTier?.toUpperCase()}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    • {tenantJobs.length} Jobs
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Center Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-400 bg-[#161b22] p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-2 rounded-xl transition ${view === 'dashboard' ? 'bg-blue-600 text-white font-black' : 'hover:text-white hover:bg-slate-800/60'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setView('job-logs')}
              className={`px-3 py-2 rounded-xl transition ${view === 'job-logs' ? 'bg-blue-600 text-white font-black' : 'hover:text-white hover:bg-slate-800/60'}`}
            >
              Job Cards ({tenantJobs.length})
            </button>
            <button
              onClick={() => setView('quotes')}
              className={`px-3 py-2 rounded-xl transition ${view === 'quotes' ? 'bg-blue-600 text-white font-black' : 'hover:text-white hover:bg-slate-800/60'}`}
            >
              Quotes ({tenantQuotes.length})
            </button>
            <button
              onClick={() => setView('invoices')}
              className={`px-3 py-2 rounded-xl transition ${view === 'invoices' ? 'bg-blue-600 text-white font-black' : 'hover:text-white hover:bg-slate-800/60'}`}
            >
              Invoices ({tenantInvoices.length})
            </button>
            <button
              onClick={() => setView('clients')}
              className={`px-3 py-2 rounded-xl transition ${view === 'clients' ? 'bg-blue-600 text-white font-black' : 'hover:text-white hover:bg-slate-800/60'}`}
            >
              Clients ({tenantClients.length})
            </button>
            <button
              onClick={() => setView('live-track')}
              className={`px-3 py-2 rounded-xl transition ${view === 'live-track' ? 'bg-blue-600 text-white font-black' : 'hover:text-white hover:bg-slate-800/60'}`}
            >
              Live Fleet
            </button>
            <button
              onClick={() => setView('staff')}
              className={`px-3 py-2 rounded-xl transition ${view === 'staff' ? 'bg-blue-600 text-white font-black' : 'hover:text-white hover:bg-slate-800/60'}`}
            >
              Team
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="px-3 py-2 rounded-xl text-amber-400 hover:bg-slate-800/60 font-black transition flex items-center gap-1"
              >
                <span>💳 Billing</span>
              </button>
            )}
          </nav>

          {/* User Status & Fast Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-2.5 rounded-xl bg-[#161b22] hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Search (Ctrl+K)"
            >
              🔍
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-[#161b22] hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#161b22] hover:bg-slate-800 border border-slate-800 transition"
              title="Switch Operator Persona"
            >
              <span className={`w-2 h-2 rounded-full ${isWorking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <div className="text-left hidden md:block">
                <p className="text-xs font-black text-white leading-none truncate max-w-[120px]">
                  {currentOperator.name || currentOperator.email}
                </p>
                <p className="text-[9px] text-slate-400 uppercase leading-none mt-0.5">
                  {isSuperAdmin ? 'Super Admin' : 'Field Operator'}
                </p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-[#161b22] hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 transition flex items-center gap-1.5"
              title="Sign Out"
            >
              <span>🚪</span>
              <span className="hidden xl:inline text-[10px] font-black uppercase tracking-wider">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {view === 'dashboard' && (
          <Dashboard
            jobs={tenantJobs}
            quotes={tenantQuotes}
            invoices={tenantInvoices}
            company={activeCompany}
            currentOperator={currentOperator}
            isWorking={isWorking}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            onSelectJob={handleSelectJob}
            onNewJob={handleNewJob}
            onOpenAI={() => setShowAIModal(true)}
            onOpenSearch={() => setShowSearchModal(true)}
            onOpenStockTake={() => setView('stock-take')}
            onOpenMap={() => setView('live-track')}
            onOpenSubscription={() => setShowSubscriptionModal(true)}
            onOpenTenantSwitcher={() => setShowTenantSwitcherModal(true)}
          />
        )}

        {view === 'job-logs' && (
          <JobList
            jobs={tenantJobs}
            category="job-logs"
            quotes={tenantQuotes}
            invoices={tenantInvoices}
            company={activeCompany}
            onSelectJob={handleSelectJob}
            onNewJob={handleNewJob}
            onDeleteJob={handleDeleteJob}
            userRole={currentOperator.role}
          />
        )}

        {view === 'quotes' && (
          <JobList
            jobs={tenantJobs}
            category="quotes"
            quotes={tenantQuotes}
            invoices={tenantInvoices}
            company={activeCompany}
            onSelectJob={handleSelectJob}
            onNewJob={handleNewJob}
            onDeleteDoc={handleDeleteDoc}
            userRole={currentOperator.role}
          />
        )}

        {view === 'invoices' && (
          <JobList
            jobs={tenantJobs}
            category="invoices"
            quotes={tenantQuotes}
            invoices={tenantInvoices}
            company={activeCompany}
            onSelectJob={handleSelectJob}
            onNewJob={handleNewJob}
            onDeleteDoc={handleDeleteDoc}
            onTogglePaid={handleTogglePaid}
            userRole={currentOperator.role}
          />
        )}

        {view === 'clients' && (
          <ClientList
            clients={tenantClients}
            jobs={tenantJobs}
            onSelectClient={(c) => {
              setSelectedClientId(c.id);
              setView('client-detail');
            }}
            onNewClient={(clientData) => {
              const newClient: Client = {
                ...clientData,
                id: 'client_' + Math.random().toString(36).substring(2, 9),
                companyId: activeCompany.id,
              };
              setAllClients(prev => [newClient, ...prev]);
            }}
            onAddClient={(clientData) => {
              const newClient: Client = {
                ...clientData,
                id: 'client_' + Math.random().toString(36).substring(2, 9),
                companyId: activeCompany.id,
              };
              setAllClients(prev => [newClient, ...prev]);
            }}
            onUpdateClient={(updated) => {
              setAllClients(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
            }}
            onDeleteClient={(id) => {
              setAllClients(prev => prev.filter(c => c.id !== id));
            }}
          />
        )}

        {view === 'client-detail' && selectedClientId && tenantClients.find(c => c.id === selectedClientId) && (
          <ClientDetail
            client={tenantClients.find(c => c.id === selectedClientId)!}
            jobs={(tenantJobs || []).filter(j => j && j.clientId === tenantClients.find(c => c.id === selectedClientId)?.name)}
            quotes={(tenantQuotes || []).filter(q => q && q.clientId === tenantClients.find(c => c.id === selectedClientId)?.name)}
            invoices={(tenantInvoices || []).filter(i => i && i.clientId === tenantClients.find(c => c.id === selectedClientId)?.name)}
            onBack={() => setView('clients')}
            onSelectJob={handleSelectJob}
          />
        )}

        {view === 'job-edit' && (
          <JobDetail
            job={currentJob}
            initialData={initialData}
            clients={tenantClients}
            company={activeCompany}
            staffList={tenantStaff}
            onSave={handleSaveJob}
            onCancel={() => setView('job-logs')}
            onDelete={handleDeleteJob}
            onConvertToDoc={(type, data) => {
              handleNewJob(type, data);
            }}
          />
        )}

        {view === 'quote-edit' && (
          <DocumentDetail
            mode="quote"
            jobs={tenantJobs}
            clients={tenantClients}
            services={services}
            company={activeCompany}
            existingDoc={currentDoc}
            initialData={initialData}
            onSave={handleSaveDoc}
            onCancel={() => setView('quotes')}
            onConvertToInvoice={() => {
              if (currentDoc) {
                const invoiceDoc: BillingDocument = {
                  ...currentDoc,
                  id: undefined,
                  type: 'INVOICE',
                  documentNumber: `INV-${Date.now().toString().slice(-4)}`,
                };
                handleSaveDoc(invoiceDoc);
              }
            }}
          />
        )}

        {view === 'invoice-edit' && (
          <DocumentDetail
            mode="invoice"
            jobs={tenantJobs}
            clients={tenantClients}
            services={services}
            company={activeCompany}
            existingDoc={currentDoc}
            initialData={initialData}
            onSave={handleSaveDoc}
            onCancel={() => setView('invoices')}
          />
        )}

        {view === 'live-track' && (
          <LiveMap jobs={tenantJobs} onSelectJob={handleSelectJob} />
        )}

        {view === 'stock-take' && (
          <StockTakeList
            stockTakes={tenantStockTakes}
            onSelectStockTake={(st) => {
              setSelectedStockTakeId(st.id);
              setView('dashboard');
            }}
            onNewStockTake={() => {
              setSelectedStockTakeId(null);
            }}
            currentUser={currentOperator.email}
          />
        )}

        {view === 'staff' && (
          <StaffList
            staff={tenantStaff}
            logs={tenantShiftLogs}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (No COC button) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117]/95 border-t border-slate-800 backdrop-blur-md px-2 py-2 flex items-center justify-around text-[10px] font-bold">
        <button
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 ${view === 'dashboard' ? 'text-blue-400 font-black' : 'text-slate-400'}`}
        >
          <span className="text-base">📊</span>
          <span>Home</span>
        </button>

        <button
          onClick={() => setView('job-logs')}
          className={`flex flex-col items-center gap-1 p-1 ${view === 'job-logs' ? 'text-blue-400 font-black' : 'text-slate-400'}`}
        >
          <span className="text-base">🔧</span>
          <span>Jobs</span>
        </button>

        <button
          onClick={() => setView('quotes')}
          className={`flex flex-col items-center gap-1 p-1 ${view === 'quotes' ? 'text-blue-400 font-black' : 'text-slate-400'}`}
        >
          <span className="text-base">📑</span>
          <span>Quotes</span>
        </button>

        <button
          onClick={() => setView('invoices')}
          className={`flex flex-col items-center gap-1 p-1 ${view === 'invoices' ? 'text-blue-400 font-black' : 'text-slate-400'}`}
        >
          <span className="text-base">📄</span>
          <span>Invoices</span>
        </button>

        <button
          onClick={() => setShowTenantSwitcherModal(true)}
          className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-white"
        >
          <span className="text-base">🏢</span>
          <span>Tenant</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 p-1 text-slate-400 hover:text-red-400"
          title="Sign Out"
        >
          <span className="text-base">🚪</span>
          <span>Log Out</span>
        </button>
      </div>

      {/* Modals & Dialogs */}
      <CompanySignupModal
        isOpen={showCompanySignupModal}
        onClose={() => setShowCompanySignupModal(false)}
        onCompanyCreated={handleCompanyCreated}
      />

      <SubscriptionBillingModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        company={activeCompany}
        onUpdateCompany={handleUpdateCompany}
      />

      <TenantSwitcherModal
        isOpen={showTenantSwitcherModal}
        onClose={() => setShowTenantSwitcherModal(false)}
        companies={companies}
        activeCompany={activeCompany}
        currentOperator={currentOperator}
        onSelectTenant={handleSelectTenant}
        onOpenCompanySignup={() => setShowCompanySignupModal(true)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        companies={companies}
        onLogin={handleSelectTenant}
        onOpenCompanySignup={() => setShowCompanySignupModal(true)}
      />

      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        jobs={tenantJobs}
        quotes={tenantQuotes}
        invoices={tenantInvoices}
        clients={tenantClients}
        services={services}
        stockTakes={tenantStockTakes}
        onSelectJob={handleSelectJob}
        onNavigate={(viewName, id, type) => {
          if (type === 'quote' || viewName === 'quote-edit') {
            setSelectedDocId(id || null);
            setView('quote-edit');
          } else if (type === 'invoice' || viewName === 'invoice-edit') {
            setSelectedDocId(id || null);
            setView('invoice-edit');
          } else if (viewName === 'client-detail') {
            setSelectedClientId(id || null);
            setView('client-detail');
          } else {
            setSelectedJobId(id || null);
            setView('job-edit');
          }
        }}
      />

      <AIElectricalAssistantModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApplyEstimate={(est) => {
          handleNewJob('quote', {
            narrative: est.narrative,
            materials: est.materials,
            labour: est.labour,
            category: est.category || 'General Service',
          });
        }}
      />
    </div>
  );
};

export default App;
