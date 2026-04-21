import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable, vntPlaybooks, vntPlaybookPurchases } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/playbooks/:id — Playbook detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const purchaseCount = db
      .select({
        playbookId: vntPlaybookPurchases.playbookId,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(vntPlaybookPurchases)
      .where(eq(vntPlaybookPurchases.playbookId, id))
      .groupBy(vntPlaybookPurchases.playbookId)
      .as("purchaseCount");

    const result = await db
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
        content: vntPlaybooks.content,
        purchases: purchaseCount.count,
        createdAt: vntPlaybooks.createdAt,
        updatedAt: vntPlaybooks.updatedAt,
      })
      .from(vntPlaybooks)
      .innerJoin(vantageTable, eq(vntPlaybooks.vantageId, vantageTable.id))
      .leftJoin(purchaseCount, eq(vntPlaybooks.id, purchaseCount.playbookId))
      .where(eq(vntPlaybooks.id, id))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!result) {
      return Response.json({ error: "Playbook not found" }, { status: 404 });
    }

    return Response.json({
      ...result,
      vantage: result.vantageName,
      vantageName: undefined,
      purchases: result.purchases ?? 0,
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/playbooks/:id — Update playbook (requires vantage apiKey)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        { error: "Missing Authorization header. Use: Bearer <api_key>" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    const playbook = await db.query.vntPlaybooks.findFirst({
      where: eq(vntPlaybooks.id, id),
      with: {
        vantage: { columns: { apiKey: true } },
      },
    });

    if (!playbook) {
      return Response.json({ error: "Playbook not found" }, { status: 404 });
    }

    if (!playbook.vantage.apiKey || playbook.vantage.apiKey !== token) {
      return Response.json({ error: "Invalid API key" }, { status: 403 });
    }

    const body = await request.json();
    const allowed = [
      "title",
      "description",
      "price",
      "version",
      "status",
      "tags",
      "content",
      "impressions",
      "engagementRate",
      "conversions",
      "periodDays",
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        // Convert numeric fields to string for Decimal columns
        if ((key === "price" || key === "engagementRate") && typeof body[key] === "number") {
          data[key] = String(body[key]);
        } else {
          data[key] = body[key];
        }
      }
    }

    if (data.status && !["active", "inactive"].includes(data.status as string)) {
      return Response.json(
        { error: "status must be 'active' or 'inactive'" },
        { status: 400 }
      );
    }

    if (data.price !== undefined) {
      if (typeof body.price !== "number" || body.price <= 0) {
        return Response.json(
          { error: "price must be a positive number" },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(vntPlaybooks)
      .set(data)
      .where(eq(vntPlaybooks.id, id))
      .returning();

    return Response.json(updated);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
