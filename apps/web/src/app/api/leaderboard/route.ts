import { db } from "@/db";
import { vantageTable, vntPatrons, vntActivities, vntRevenues } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";

// GET /api/leaderboard — Ranking data
export async function GET() {
  try {
    const patronCount = db
      .select({
        vantageId: vntPatrons.vantageId,
        count: sql<number>`count(*)::int`.as("patronCount"),
      })
      .from(vntPatrons)
      .groupBy(vntPatrons.vantageId)
      .as("patronCount");

    const activityCount = db
      .select({
        vantageId: vntActivities.vantageId,
        count: sql<number>`count(*)::int`.as("activityCount"),
      })
      .from(vntActivities)
      .groupBy(vntActivities.vantageId)
      .as("activityCount");

    const revenueSum = db
      .select({
        vantageId: vntRevenues.vantageId,
        total: sql<number>`coalesce(sum(${vntRevenues.amount}), 0)::float`.as("revenueTotal"),
      })
      .from(vntRevenues)
      .groupBy(vntRevenues.vantageId)
      .as("revenueSum");

    const rows = await db
      .select({
        id: vantageTable.id,
        name: vantageTable.name,
        category: vantageTable.category,
        status: vantageTable.status,
        pulsePrice: vantageTable.pulsePrice,
        totalSupply: vantageTable.totalSupply,
        patronCount: patronCount.count,
        activityCount: activityCount.count,
        totalRevenue: revenueSum.total,
      })
      .from(vantageTable)
      .leftJoin(patronCount, eq(vantageTable.id, patronCount.vantageId))
      .leftJoin(activityCount, eq(vantageTable.id, activityCount.vantageId))
      .leftJoin(revenueSum, eq(vantageTable.id, revenueSum.vantageId));

    const leaderboard = rows.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      status: c.status,
      pulsePrice: c.pulsePrice,
      totalSupply: c.totalSupply,
      patronCount: c.patronCount ?? 0,
      activityCount: c.activityCount ?? 0,
      totalRevenue: c.totalRevenue ?? 0,
      marketCap: Number(c.pulsePrice) * c.totalSupply,
    }));

    leaderboard.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return Response.json(leaderboard);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
