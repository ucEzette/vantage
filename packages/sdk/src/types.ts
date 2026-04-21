// ── Request types ────────────────────────────────────────────────

export interface CreateVantageParams {
  name: string;
  category: string;
  description: string;
  totalSupply?: number;
  persona?: string;
  targetAudience?: string;
  channels?: string[];
  toneVoice?: string;
  approvalThreshold?: number;
  gtmBudget?: number;
  creatorAddress?: string;
  walletAddress?: string;
  onChainId?: number;
  agentName?: string;
  initialPrice?: number;
  minPatronPulse?: number;
  tokenAddress?: string;
  serviceName?: string;
  serviceDescription?: string;
  servicePrice?: number;
}

export interface ReportActivityParams {
  type: string;
  content: string;
  channel: string;
}

export interface ReportRevenueParams {
  amount: number;
  currency?: string;
  source: string;
  txHash?: string;
}

export interface CreateApprovalParams {
  type: string;
  title: string;
  description?: string;
  amount?: number;
}

export interface RegisterServiceParams {
  serviceName: string;
  description: string;
  price: number;
  walletAddress?: string;
}

export interface SignPaymentParams {
  payee: string;
  amount: number;
  tokenAddress?: string;
  chainId?: number;
}

export interface DiscoverServicesParams {
  category?: string;
  target?: string;
}

export interface PurchaseServiceParams {
  paymentHeader: string;
  payload?: Record<string, unknown>;
}

// ── Response types ───────────────────────────────────────────────

export interface Vantage {
  id: string;
  onChainId?: number;
  agentName?: string;
  name: string;
  category: string;
  description: string;
  status: string;
  tokenAddress?: string;
  pulsePrice: string;
  totalSupply: number;
  creatorShare: number;
  investorShare: number;
  treasuryShare: number;
  persona?: string;
  targetAudience?: string;
  channels: string[];
  toneVoice?: string;
  approvalThreshold: string;
  gtmBudget: string;
  minPatronPulse?: number;
  agentOnline: boolean;
  agentLastSeen?: string;
  walletAddress?: string;
  creatorAddress?: string;
  investorAddress?: string;
  treasuryAddress?: string;
  createdAt: string;
  updatedAt: string;
  patrons?: number;
}

export interface VantageDetail extends Vantage {
  apiKeyMasked?: string;
  activities?: Activity[];
  approvals?: Approval[];
  revenues?: Revenue[];
  commerceServices?: CommerceService[];
}

export interface VantageCreated extends Vantage {
  apiKeyOnce: string;
}

export interface Activity {
  id: string;
  vantageId: string;
  type: string;
  content: string;
  channel: string;
  status: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  vantageId: string;
  type: string;
  title: string;
  description?: string;
  amount?: string;
  status: string;
  decidedAt?: string;
  decidedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Revenue {
  id: string;
  vantageId: string;
  amount: string;
  currency: string;
  source: string;
  txHash?: string;
  createdAt: string;
}

export interface CommerceService {
  id: string;
  vantageId: string;
  serviceName: string;
  description?: string;
  price: string;
  currency: string;
  walletAddress: string;
  chains: string[];
  fulfillmentMode: string;
}

export interface CommerceJob {
  id: string;
  vantageId: string;
  requesterVantageId: string;
  serviceName: string;
  payload?: unknown;
  result?: unknown;
  status: string;
  amount: string;
  createdAt: string;
}

export interface PaymentDetails {
  price: number;
  payee: string;
  token: string;
  network: string;
}

export interface SignedPayment {
  paymentHeader: string;
  from: string;
  to: string;
  amount: string;
}

export interface Wallet {
  walletId: string;
  address: string;
}
