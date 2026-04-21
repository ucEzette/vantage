import type {
  Vantage,
  VantageCreated,
  VantageDetail,
  CreateVantageParams,
  ReportActivityParams,
  Activity,
  ReportRevenueParams,
  Revenue,
  CreateApprovalParams,
  Approval,
  RegisterServiceParams,
  CommerceService,
  SignPaymentParams,
  SignedPayment,
  DiscoverServicesParams,
  PurchaseServiceParams,
  CommerceJob,
  Wallet,
} from "./types.js";

export interface VantageClientOptions {
  baseUrl?: string;
  apiKey?: string;
}

export class VantageClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(options: VantageClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "https://vantage-protocol-web.vercel.app").replace(/\/$/, "");
    this.headers = { "Content-Type": "application/json" };
    if (options.apiKey) {
      this.headers["Authorization"] = `Bearer ${options.apiKey}`;
    }
  }

  // ── Internal fetch helper ──────────────────────────────────

  private async request<T>(
    path: string,
    init?: RequestInit & { params?: Record<string, string> },
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (init?.params) {
      const qs = new URLSearchParams(init.params).toString();
      if (qs) url += `?${qs}`;
    }
    const res = await fetch(url, {
      ...init,
      headers: { ...this.headers, ...init?.headers },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new VantageAPIError(res.status, body, path);
    }
    return res.json() as Promise<T>;
  }

  // ── Vantage CRUD ────────────────────────────────────────────

  async listVantagees(): Promise<Vantage[]> {
    return this.request("/api/vantage");
  }

  async getVantage(id: string): Promise<VantageDetail> {
    return this.request(`/api/vantage/${id}`);
  }

  async getVantageMe(): Promise<VantageDetail> {
    return this.request("/api/vantage/me");
  }

  async createVantage(params: CreateVantageParams): Promise<VantageCreated> {
    return this.request("/api/vantage", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // ── Activity ───────────────────────────────────────────────

  async reportActivity(vantageId: string, params: ReportActivityParams): Promise<Activity> {
    return this.request(`/api/vantage/${vantageId}/activity`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // ── Revenue ────────────────────────────────────────────────

  async reportRevenue(vantageId: string, params: ReportRevenueParams): Promise<Revenue> {
    return this.request(`/api/vantage/${vantageId}/revenue`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // ── Approvals ──────────────────────────────────────────────

  async createApproval(vantageId: string, params: CreateApprovalParams): Promise<Approval> {
    return this.request(`/api/vantage/${vantageId}/approvals`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getApprovals(vantageId: string, status?: string): Promise<Approval[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    return this.request(`/api/vantage/${vantageId}/approvals`, { params });
  }

  async getApproval(vantageId: string, approvalId: string): Promise<Approval> {
    return this.request(`/api/vantage/${vantageId}/approvals/${approvalId}`);
  }

  // ── Status ─────────────────────────────────────────────────

  async updateStatus(vantageId: string, online: boolean): Promise<void> {
    await this.request(`/api/vantage/${vantageId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ agentOnline: online }),
    });
  }

  // ── Commerce / x402 ────────────────────────────────────────

  async registerService(vantageId: string, params: RegisterServiceParams): Promise<CommerceService> {
    return this.request(`/api/vantage/${vantageId}/service`, {
      method: "PUT",
      body: JSON.stringify(params),
    });
  }

  async discoverServices(params?: DiscoverServicesParams): Promise<CommerceService[]> {
    const p: Record<string, string> = {};
    if (params?.category) p.category = params.category;
    if (params?.target) p.target = params.target;
    return this.request("/api/services", { params: p });
  }

  async purchaseService(
    vantageId: string,
    params: PurchaseServiceParams,
  ): Promise<CommerceJob> {
    return this.request(`/api/vantage/${vantageId}/service`, {
      method: "POST",
      body: JSON.stringify({ payload: params.payload }),
      headers: { "X-PAYMENT": params.paymentHeader },
    });
  }

  // ── Wallet & Payments ──────────────────────────────────────

  async getWallet(vantageId: string): Promise<Wallet> {
    return this.request(`/api/vantage/${vantageId}/wallet`);
  }

  async signPayment(vantageId: string, params: SignPaymentParams): Promise<SignedPayment> {
    return this.request(`/api/vantage/${vantageId}/sign`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }
}

export class VantageAPIError extends Error {
  constructor(
    public status: number,
    public body: string,
    public path: string,
  ) {
    super(`Vantage API error ${status} on ${path}: ${body}`);
    this.name = "VantageAPIError";
  }
}
