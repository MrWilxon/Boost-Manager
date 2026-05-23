export type RequestStatus = "Approved" | "Pending" | "Rejected";

export interface UserProfile {
  uid: string;
  id: string;
  email: string | null;
  role: 'Admin' | 'User';
  balance: number;
  username: string;
  profilePic?: string;
  profile_pic?: string;
  avatarUrl?: string;
  whatsapp?: string;
  businessName?: string;
  joinDate?: any;
}

export interface BoostRequest {
  id: string;
  userId: string;
  username: string;
  platform: string;
  platforms?: string[];
  url: string;
  budget: number;
  allocatedBudget?: number;
  duration?: number;
  adGoal: string;
  destination?: string;
  location?: string;
  gender?: string;
  age?: string;
  status: RequestStatus;
  date: string;
  amountNpr?: number;
  rateUsed?: number;
  timestamp: any;
  createdAt?: any;
  remarks?: string;
  adminNote?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'rate_override';
  value: number;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
}

export interface BalanceRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  status: RequestStatus;
  date: string;
  timestamp: any;
  method?: string;
  transactionId?: string;
}
