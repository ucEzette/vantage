import { db } from "@/db";
import {
  vntCommerceJobs,
  vntCommerceServices,
  vntPlaybookPurchases,
  vntPlaybooks,
  vantageTable,
} from "@/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export type Transaction = {
  id: string;
  type: "service" | "playbook";
  sellerName: string;
  sellerAgent: string | null;
  buyerName: string;
  buyerAgent: string | null;
  itemName: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  txHash: string | null;
};

export type ActivityStats = {
  totalTransactions: number;
  totalVolume: number;
  activeAgents: number;
  totalAgents: number;
  registeredServices: number;
  playbooksTraded: number;
};

export async function fetchActivityStats(): Promise<ActivityStats> {
  const [agentStats, registeredServiceCount, jobTotal, pbTotal] = await Promise.all([
    db
      .select({
        totalAgents: count(vantageTable.id),
        activeAgents: sql<number>`count(*) filter (where ${vantageTable.agentOnline} = true)::int`,
      })
      .from(vantageTable)
      .then((r) => r[0]),
    db
      .select({ count: count(vntCommerceServices.id) })
      .from(vntCommerceServices)
      .then((r) => r[0]?.count ?? 0),
    db.select({ count: count(vntCommerceJobs.id), vol: sql<number>`coalesce(sum(${vntCommerceJobs.amount}::numeric), 0)::float` }).from(vntCommerceJobs).then((r) => r[0]),
    db.select({ count: count(vntPlaybookPurchases.id), vol: sql<number>`coalesce(sum(${vntPlaybooks.price}::numeric), 0)::float` }).from(vntPlaybookPurchases).innerJoin(vntPlaybooks, eq(vntPlaybookPurchases.playbookId, vntPlaybooks.id)).then((r) => r[0]),
  ]);

  return {
    totalTransactions: (jobTotal?.count ?? 0) + (pbTotal?.count ?? 0),
    totalVolume: (jobTotal?.vol ?? 0) + (pbTotal?.vol ?? 0),
    activeAgents: agentStats?.activeAgents ?? 0,
    totalAgents: agentStats?.totalAgents ?? 0,
    registeredServices: registeredServiceCount,
    playbooksTraded: pbTotal?.count ?? 0,
  };
}

export async function fetchActivityTransactions(
  limit: number,
  cursor?: string | null,
): Promise<{ transactions: Transaction[]; nextCursor: string | null }> {
  const buyerVantage = alias(vantageTable, "buyerVantage");
  const pbBuyerVantage = alias(vantageTable, "pbBuyerVantage");

  let cursorDate: Date | null = null;
  if (cursor) {
    const dateStr = cursor.split("|")[0];
    if (dateStr) cursorDate = new Date(dateStr);
  }

  const jobCursorCond = cursorDate
    ? [sql`${vntCommerceJobs.createdAt} < ${cursorDate}`]
    : [];
  const pbCursorCond = cursorDate
    ? [sql`${vntPlaybookPurchases.createdAt} < ${cursorDate}`]
    : [];

  const [jobs, playbookTrades] = await Promise.all([
    db
      .select({
        id: vntCommerceJobs.id,
        serviceName: vntCommerceJobs.serviceName,
        amount: vntCommerceJobs.amount,
        status: vntCommerceJobs.status,
        txHash: vntCommerceJobs.txHash,
        createdAt: vntCommerceJobs.createdAt,
        sellerName: vantageTable.name,
        sellerAgent: vantageTable.agentName,
        buyerName: buyerVantage.name,
        buyerAgent: buyerVantage.agentName,
      })
      .from(vntCommerceJobs)
      .leftJoin(vantageTable, eq(vntCommerceJobs.vantageId, vantageTable.id))
      .leftJoin(buyerVantage, eq(vntCommerceJobs.requesterVantageId, buyerVantage.id))
      .where(jobCursorCond.length ? jobCursorCond[0] : undefined)
      .orderBy(desc(vntCommerceJobs.createdAt))
      .limit(limit + 1),

    db
      .select({
        id: vntPlaybookPurchases.id,
        buyerAddress: vntPlaybookPurchases.buyerAddress,
        txHash: vntPlaybookPurchases.txHash,
        createdAt: vntPlaybookPurchases.createdAt,
        playbookTitle: vntPlaybooks.title,
        playbookPrice: vntPlaybooks.price,
        playbookCurrency: vntPlaybooks.currency,
        sellerName: vantageTable.name,
        sellerAgent: vantageTable.agentName,
        buyerName: pbBuyerVantage.name,
        buyerAgent: pbBuyerVantage.agentName,
      })
      .from(vntPlaybookPurchases)
      .innerJoin(vntPlaybooks, eq(vntPlaybookPurchases.playbookId, vntPlaybooks.id))
      .leftJoin(vantageTable, eq(vntPlaybooks.vantageId, vantageTable.id))
      .leftJoin(
        pbBuyerVantage,
        sql`${pbBuyerVantage.id} = ${vntPlaybookPurchases.buyerAddress} OR ${pbBuyerVantage.agentName} = ${vntPlaybookPurchases.buyerAddress}`,
      )
      .where(pbCursorCond.length ? pbCursorCond[0] : undefined)
      .orderBy(desc(vntPlaybookPurchases.createdAt))
      .limit(limit + 1),
  ]);

  const transactions: Transaction[] = [];

  for (const j of jobs) {
    transactions.push({
      id: j.id,
      type: "service",
      sellerName: j.sellerName ?? "Unknown",
      sellerAgent: j.sellerAgent ?? null,
      buyerName: j.buyerName ?? "Unknown",
      buyerAgent: j.buyerAgent ?? null,
      itemName: j.serviceName,
      amount: Number(j.amount),
      currency: "USDC",
      status: j.status,
      timestamp: j.createdAt.toISOString(),
      txHash: j.txHash ?? null,
    });
  }

  for (const p of playbookTrades) {
    transactions.push({
      id: p.id,
      type: "playbook",
      sellerName: p.sellerName ?? "Unknown",
      sellerAgent: p.sellerAgent ?? null,
      buyerName: p.buyerName ?? `${p.buyerAddress.slice(0, 6)}...${p.buyerAddress.slice(-4)}`,
      buyerAgent: p.buyerAgent ?? null,
      itemName: p.playbookTitle,
      amount: Number(p.playbookPrice),
      currency: p.playbookCurrency,
      status: "completed",
      timestamp: p.createdAt.toISOString(),
      txHash: p.txHash ?? null,
    });
  }

  transactions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const hasMore = transactions.length > limit;
  const page = hasMore ? transactions.slice(0, limit) : transactions;

  const lastItem = page[page.length - 1];
  const nextCursor = hasMore && lastItem ? lastItem.timestamp : null;

  return { transactions: page, nextCursor };
}
