import { db } from "@/db";
import { vantageTable, vntCommerceJobs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { VantageDetailClient } from "./detail-client";

export default async function VantageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Run both DB queries in parallel
  const [vantage, [jobStatsRow]] = await Promise.all([
    db.query.vantageTable.findFirst({
      where: eq(vantageTable.id, id),
      with: {
        patrons: true,
        activities: { orderBy: (a, { desc }) => [desc(a.createdAt)], limit: 20 },
        approvals: { orderBy: (a, { desc }) => [desc(a.createdAt)], limit: 10 },
        revenues: { orderBy: (r, { desc }) => [desc(r.createdAt)], limit: 20 },
        commerceServices: true,
        // Only recent jobs for the "Recent Jobs" list — stats come from DB aggregation
        commerceJobs: { orderBy: (j, { desc: d }) => [d(j.createdAt)], limit: 10 },
      },
    }),
    db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${vntCommerceJobs.status} = 'completed')::int`,
        failed: sql<number>`count(*) filter (where ${vntCommerceJobs.status} = 'failed')::int`,
        pending: sql<number>`count(*) filter (where ${vntCommerceJobs.status} = 'pending')::int`,
        totalRevenue: sql<number>`coalesce(sum(${vntCommerceJobs.amount}::numeric) filter (where ${vntCommerceJobs.status} = 'completed'), 0)::float`,
        jobsToday: sql<number>`count(*) filter (where ${vntCommerceJobs.createdAt} >= ${todayStart})::int`,
      })
      .from(vntCommerceJobs)
      .where(eq(vntCommerceJobs.vantageId, id)),
  ]);

  if (!vantage) notFound();

  const totalRevenue = vantage.revenues.reduce(
    (sum, r) => sum + Number(r.amount),
    0
  );

  // Aggregate revenue by month
  const revenueByMonth = new Map<string, number>();
  for (const r of vantage.revenues) {
    const d = new Date(r.createdAt);
    const key = `${d.toLocaleString("en-US", { month: "short" })} ${String(d.getFullYear()).slice(-2)}`;
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(r.amount));
  }
  const revenueHistory = Array.from(revenueByMonth.entries())
    .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))
    .slice(-6);

  // Agent activity stats (today)
  const todayActivities = vantage.activities.filter(
    (a) => new Date(a.createdAt) >= todayStart
  );
  const agentStats = {
    postsToday: todayActivities.filter((a) => a.type === "post").length,
    repliesToday: todayActivities.filter((a) => a.type === "reply").length,
    researchesToday: todayActivities.filter((a) => a.type === "research").length,
  };

  const successRate = jobStatsRow.total > 0
    ? Math.round((jobStatsRow.completed / jobStatsRow.total) * 100)
    : null;

  // Serialize for client
  const data = {
    id: vantage.id,
    name: vantage.name,
    agentName: vantage.agentName,
    category: vantage.category,
    description: vantage.description,
    status: vantage.status,
    tokenAddress: vantage.tokenAddress ?? "",
    tokenSymbol: vantage.tokenSymbol ?? "PULSE",
    pulsePrice: `$${Number(vantage.pulsePrice).toFixed(2)}`,
    totalSupply: vantage.totalSupply,
    creatorAddress: vantage.creatorAddress,
    persona: vantage.persona ?? "",
    targetAudience: vantage.targetAudience ?? "",
    channels: vantage.channels,
    approvalThreshold: Number(vantage.approvalThreshold),
    gtmBudget: Number(vantage.gtmBudget),
    minPatronPulse: vantage.minPatronPulse,
    agentOnline: vantage.agentOnline,
    agentLastSeen: vantage.agentLastSeen?.toISOString() ?? null,
    createdAt: vantage.createdAt.toISOString().split("T")[0],
    revenue: `$${totalRevenue.toLocaleString()}`,
    patronCount: vantage.patrons.length,
    patrons: vantage.patrons.map((p) => ({
      walletAddress: p.walletAddress,
      role: p.role,
      pulseAmount: p.pulseAmount,
      share: Number(p.share),
      status: p.status,
    })),
    activities: vantage.activities.map((a) => ({
      id: a.id,
      type: a.type,
      content: a.content,
      channel: a.channel,
      status: a.status,
      timestamp: getRelativeTime(a.createdAt),
    })),
    revenueHistory,
    agentStats,
    // Commerce
    service: vantage.commerceServices
      ? {
          name: vantage.commerceServices.serviceName,
          description: vantage.commerceServices.description,
          price: Number(vantage.commerceServices.price),
          currency: vantage.commerceServices.currency,
          walletAddress: vantage.commerceServices.walletAddress,
          chains: vantage.commerceServices.chains,
        }
      : null,
    jobStats: {
      total: jobStatsRow.total,
      completed: jobStatsRow.completed,
      failed: jobStatsRow.failed,
      pending: jobStatsRow.pending,
      successRate,
      totalRevenue: jobStatsRow.totalRevenue,
      jobsToday: jobStatsRow.jobsToday,
    },
    recentJobs: (vantage.commerceJobs ?? []).map((j) => ({
      id: j.id,
      serviceName: j.serviceName,
      status: j.status,
      amount: Number(j.amount),
      createdAt: getRelativeTime(j.createdAt),
    })),
  };

  return <VantageDetailClient vantage={data} />;
}

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
