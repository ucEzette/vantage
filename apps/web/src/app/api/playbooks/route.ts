import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable, vntPlaybooks, vntPlaybookPurchases } from "@/db/schema";
import { and, arrayContains, desc, eq, ilike, lt, or, sql } from "drizzle-orm";

const VALID_CATEGORIES = [
  "Channel Strategy",
  "Content Templates",
  "Targeting",
  "Response",
  "Growth Hacks",
];
const VALID_CHANNELS = ["X", "LinkedIn", "Reddit", "Product Hunt"];

// GET /api/playbooks — List playbooks (with optional filters and cursor pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const channel = searchParams.get("channel");
    const search = searchParams.get("search");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 100);

    const conditions = [eq(vntPlaybooks.status, "active")];

    if (category && category !== "All") {
      conditions.push(eq(vntPlaybooks.category, category));
    }
    if (channel && channel !== "All") {
      conditions.push(eq(vntPlaybooks.channel, channel));
    }
    if (search) {
      conditions.push(
        or(
          ilike(vntPlaybooks.title, `%${search}%`),
          ilike(vntPlaybooks.description, `%${search}%`),
          arrayContains(vntPlaybooks.tags, [search.toLowerCase()]),
        )!
      );
    }

    // Cursor condition (createdAt DESC with id tiebreaker)
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split("|");
      if (cursorDate && cursorId) {
        conditions.push(
          or(
            lt(vntPlaybooks.createdAt, new Date(cursorDate)),
            and(
              eq(vntPlaybooks.createdAt, new Date(cursorDate)),
              lt(vntPlaybooks.id, cursorId),
            ),
          )!,
        );
      }
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
        content: vntPlaybooks.content,
        purchases: purchaseCount.count,
        createdAt: vntPlaybooks.createdAt,
      })
      .from(vntPlaybooks)
      .innerJoin(vantageTable, eq(vntPlaybooks.vantageId, vantageTable.id))
      .leftJoin(purchaseCount, eq(vntPlaybooks.id, purchaseCount.playbookId))
      .where(and(...conditions))
      .orderBy(desc(vntPlaybooks.createdAt), desc(vntPlaybooks.id))
      .limit(limit + 1);

    const hasMore = playbooks.length > limit;
    const page = hasMore ? playbooks.slice(0, limit) : playbooks;

    const data = page.map((p) => ({
      ...p,
      vantage: p.vantageName,
      vantageName: undefined,
      purchases: p.purchases ?? 0,
    }));

    const lastItem = page[page.length - 1];
    const nextCursor = hasMore && lastItem
      ? `${lastItem.createdAt.toISOString()}|${lastItem.id}`
      : null;

    return Response.json({ data, nextCursor });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/playbooks — Create a playbook (requires vantage apiKey)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        { error: "Missing Authorization header. Use: Bearer <api_key>" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const vantage = await db
      .select({ id: vantageTable.id, apiKey: vantageTable.apiKey })
      .from(vantageTable)
      .where(eq(vantageTable.apiKey, token))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!vantage) {
      return Response.json({ error: "Invalid API key" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      category,
      channel,
      description,
      price,
      tags,
      content,
      impressions,
      engagementRate,
      conversions,
      periodDays,
    } = body;

    if (!title || !category || !channel || !description || price == null) {
      return Response.json(
        { error: "title, category, channel, description, price are required" },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return Response.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!VALID_CHANNELS.includes(channel)) {
      return Response.json(
        { error: `channel must be one of: ${VALID_CHANNELS.join(", ")}` },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return Response.json(
        { error: "price must be a positive number" },
        { status: 400 }
      );
    }

    const [playbook] = await db
      .insert(vntPlaybooks)
      .values({
        vantageId: vantage.id,
        title,
        category,
        channel,
        description,
        price: String(price),
        tags: tags ?? [],
        content: content ?? null,
        impressions: impressions ?? 0,
        engagementRate: String(engagementRate ?? 0),
        conversions: conversions ?? 0,
        periodDays: periodDays ?? 30,
      })
      .returning();

    return Response.json(playbook, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
