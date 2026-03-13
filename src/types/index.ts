export type Category = 'jewish' | 'education' | 'arts';
export type GrantType = 'annual' | 'multi-year';
export type GrantStatus = 'considering' | 'committed' | 'paid' | 'acknowledged';
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Grant {
  id: string;
  granteeId: string;
  granteeName: string;
  category: Category;
  purpose: string;
  amount: number;
  grantType: GrantType;
  paymentDate: string;
  status: GrantStatus;
  commitmentId?: string;
  commitmentYear?: number;
  commitmentTotalYears?: number;
  commitmentTotalPledge?: number;
  acknowledgmentReceived: boolean;
  notes: string;
  addedBy: string;
  addedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Grantee {
  id: string;
  name: string;
  ein: string;
  primaryCategory: Category;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
  relationshipNotes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Commitment {
  id: string;
  granteeId: string;
  granteeName: string;
  category: Category;
  totalPledge: number;
  totalYears: number;
  annualPayment: number;
  startYear: number;
  grantIds: Record<number, string>;
  createdAt: string;
}

export interface FMVEntry {
  month: number;
  value: number;
}

export interface Year {
  id: string;
  fmvEntries: FMVEntry[];
  budgetTargets?: {
    jewish?: number;
    education?: number;
    arts?: number;
  };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  photoURL?: string;
}

/** Display names for categories used throughout the UI */
export const CATEGORY_LABELS: Record<Category, string> = {
  jewish: 'Jewish Life & Community',
  education: 'Education',
  arts: 'Arts & Dance',
};

/** Category → brand color mapping */
export const CATEGORY_COLORS: Record<Category, { bg: string; text: string; dot: string }> = {
  jewish: { bg: 'bg-purple-light', text: 'text-purple-dark', dot: 'bg-purple' },
  education: { bg: 'bg-gold-light', text: 'text-gold-dark', dot: 'bg-gold' },
  arts: { bg: 'bg-warm-gray-lt', text: 'text-warm-gray', dot: 'bg-warm-gray' },
};
