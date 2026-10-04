export type JobStatus = "OPEN" | "WORKING" | "ON_HOLD" | "DONE";
export type JobPriority = "EMERGENCY" | "HIGH" | "MEDIUM" | "ROUTINE";
export type UserRole = 'super_admin' | 'technician' | 'admin' | 'staff';

export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'cancelled';
export type CurrencyCode = 'ZAR' | 'USD' | 'EUR' | 'GBP';

export interface Company {
  id: string;
  name: string;
  industry?: string; // e.g. Car Wash, Retail Store, General Labour, Cleaning, Maintenance, Plumbing, etc.
  slug?: string;
  registrationNumber?: string;
  vatNumber?: string;
  phone: string;
  email: string;
  address: string;
  website?: string;
  logoUrl?: string;
  brandColor: string; // Hex color code e.g. #2563eb or #d97706
  accentColor?: string;
  currency: CurrencyCode;
  currencySymbol: string;
  taxRate: number; // e.g. 15 for 15% VAT
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: any;
  nextBillingDate?: any;
  billingGateway?: 'payfast' | 'stripe' | 'manual';
  planAmount?: number;
  createdAt: any;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vatNumber?: string;
  notes?: string;
  createdAt?: any;
}

export interface Service {
  id: string;
  companyId: string;
  description: string;
  price: number;
  type: 'MATERIAL' | 'LABOUR';
  category?: string;
}

export interface BillingLineItemMaterial {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface BillingLineItemLabour {
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface BillingDocument {
  id?: string;
  companyId: string;
  type: "QUOTE" | "INVOICE" | "file";
  jobId: string;
  clientId: string;
  date: any; // Firestore Timestamp
  materials?: BillingLineItemMaterial[];
  labour?: BillingLineItemLabour[];
  subtotal?: number;
  includeVat?: boolean;
  vatRate?: number;
  vatAmount?: number;
  discount?: number;
  total?: number;
  documentNumber: string;
  invoiceNumber?: string;
  contactDetails?: string;
  address?: string;
  customerVat?: string;
  title?: string;
  fileUrl?: string;
  narrative?: string;
  isPaid?: boolean;
  paymentMethod?: 'EFT' | 'Cash' | 'Card' | 'SnapScan' | 'PayFast' | 'Stripe';
  paymentTerms?: string;
  dueDate?: any;
  status?: 'PAID' | 'UNPAID' | 'OVERDUE' | 'DRAFT';
  createdAt?: any;
}

export interface StockItem {
  id: string;
  companyId: string;
  description: string;
  quantity: number;
  unit: string;
  category?: string;
  minThreshold?: number;
  unitCost?: number;
}

export interface StockTake {
  id?: string;
  companyId: string;
  date: any; // Firestore Timestamp
  vehicleId: string;
  items: StockItem[];
  notes?: string;
  createdBy: string;
}

export interface ShiftLog {
  id?: string;
  companyId: string;
  uid?: string;
  userId?: string;
  email?: string;
  userName?: string;
  startTime?: any; // Firestore Timestamp
  endTime?: any;   // Firestore Timestamp | null
  clockIn?: any;
  clockOut?: any;
  durationHours?: number;
  status: 'active' | 'completed';
}

export interface StaffUser {
  uid: string;
  companyId: string;
  email: string;
  name?: string;
  role: UserRole;
  isWorking: boolean;
  lastShiftToggle?: any;
  phone?: string;
  avatarColor?: string;
  specialty?: string;
  hourlyRate?: number;
}

export interface UserLocation {
  uid: string;
  companyId: string;
  email: string;
  name?: string;
  latitude: number;
  longitude: number;
  lastUpdated: any; // Firestore Timestamp
  status: 'active' | 'idle' | 'offline';
}

export interface JobChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface ClientSignature {
  signerName: string;
  signatureDataUrl?: string;
  signedAt?: any;
  comments?: string;
  satisfactionRating?: number;
  signerRole?: string;
  signerPhone?: string;
}

export interface InspectionPhoto {
  id: string;
  url: string;
  caption: string;
  tag: 'DB Before' | 'DB After' | 'Earth Spike' | 'Fault Finding' | 'Certificate Label' | 'General';
  timestamp: string;
}

export type IndustrySector = 
  | 'car_wash' 
  | 'retail_store' 
  | 'general_labour' 
  | 'cleaning_janitorial' 
  | 'construction_handyman' 
  | 'equipment_repair' 
  | 'logistics_delivery'
  | 'trades_services' 
  | 'other_services';

export interface InspectionChecklistItem {
  id: string;
  code?: string;
  category: string;
  item: string;
  status: 'PASS' | 'FAIL' | 'N/A';
  notes?: string;
}

export type ComplianceChecklistItem = InspectionChecklistItem;

export interface InspectionReport {
  id: string;
  companyId: string;
  jobId: string;
  clientId: string;
  reportNumber: string;
  type: string; // e.g. 'QUALITY_ASSURANCE' | 'SERVICE_SIGN_OFF' | 'FACILITY_AUDIT' | 'VEHICLE_INSPECTION'
  status: 'PASSED' | 'FAILED' | 'CONDITIONAL';
  inspectorName: string;
  inspectorTitle?: string;
  inspectorRegNumber?: string;
  inspectionDate: any;
  siteAddress: string;
  serviceCategory?: string;
  
  // Custom specifications / metrics (e.g. Wash stage, Odometer, Temperature, Meter reading)
  customMetrics?: Record<string, string>;
  earthLoopImpedance?: string; // legacy support
  earthLeakageTripCurrent?: string; // legacy support

  checklist: InspectionChecklistItem[];
  photos: InspectionPhoto[];
  aiAnalysisSummary?: string;
  inspectorSignature?: ClientSignature;
  clientSignature?: ClientSignature;
  createdAt: any;
}

export type ComplianceReport = InspectionReport;

export interface JobPhoto {
  id: string;
  url: string;
  label: string;
  timestamp: string;
}

export interface Job {
  id: string;
  companyId: string;
  jobNumber: string;
  clientId: string;
  phone: string;
  email: string;
  location: string;
  category: string;
  priority?: JobPriority;

  startDate: any; // Firestore Timestamp
  endDate: any;   // Firestore Timestamp
  
  notes: string;
  description?: string;
  technician?: string;
  assignedTechUid?: string;
  checklist?: JobChecklistItem[];
  clientSignature?: ClientSignature | null;
  photos?: JobPhoto[];

  status: JobStatus;

  quoteId: string | null;
  invoiceId: string | null;
  complianceReportId?: string | null;

  createdAt: any; // Firestore Timestamp
}
