import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable, vntPlaybooks, vntPlaybookPurchases } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

// GET /api/playbooks/my?wallet=0x... — Playbooks created by my vantagees
export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get("wallet");

    if (!wallet) {
      return Response.json(
        { error: "wallet query param is required" },
        { status: 400 }
      );
    }

    const purchaseCount = db
      .select({
        playbookId: vntPlaybookPurchases.playbookId,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(vntPlaybookPurchases)
      .groupBy(vntPlaybookPurchases.playbookId)
      .as("purchaseCount");

    const playbooks = await db
      .select({
        id: vntPlaybooks.id,
        vantageId: vntPlaybooks.vantageId,
        vantageName: vantageTable.name,
        title: vntPlaybooks.title,
        category: vntPlaybooks.category,
        channel: vntPlaybooks.channel,
        description: vntPlaybooks.description,
        price: vntPlaybooks.price,
        currency: vntPlaybooks.currency,
        version: vntPlaybooks.version,
        tags: vntPlaybooks.tags,
        status: vntPlaybooks.status,
        impressions: vntPlaybooks.impressions,
        engagementRate: vntPlaybooks.engagementRate,
        conversions: vntPlaybooks.conversions,
        periodDays: vntPlaybooks.periodDays,
        purchases: purchaseCount.count,
        createdAt: vntPlaybooks.createdAt,
      })
      .from(vntPlaybooks)
      .innerJoin(vantageTable, eq(vntPlaybooks.vantageId, vantageTable.id))
      .leftJoin(purchaseCount, eq(vntPlaybooks.id, purchaseCount.playbookId))
      .where(eq(vantageTable.creatorAddress, wallet))
      .orderBy(desc(vntPlaybooks.createdAt));

    const data = playbooks.map((p) => ({
      ...p,
      vantage: p.vantageName,
      vantageName: undefined,
      purchases: p.purchases ?? 0,
    }));

    return Response.json(data);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
