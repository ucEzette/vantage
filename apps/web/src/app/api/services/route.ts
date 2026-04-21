import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable, vntCommerceServices } from "@/db/schema";
import { and, desc, eq, ilike, lt, ne, or, sql } from "drizzle-orm";

// GET /api/services — Discover available services across all Vantagees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const selfId = searchParams.get("self");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 100);

    const conditions = [];

    // Exclude the requesting vantage's own services
    if (selfId) {
      conditions.push(ne(vntCommerceServices.vantageId, selfId));
    }

    // Filter by vantage category (case-insensitive match in DB)
    if (category) {
      conditions.push(ilike(vantageTable.category, category));
    }

    // Cursor condition (createdAt DESC with id tiebreaker)
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split("|");
      if (cursorDate && cursorId) {
        conditions.push(
          or(
            lt(vntCommerceServices.createdAt, new Date(cursorDate)),
            and(
              eq(vntCommerceServices.createdAt, new Date(cursorDate)),
              lt(vntCommerceServices.id, cursorId),
            ),
          )!,
        );
      }
    }

    const services = await db
      .select({
        id: vntCommerceServices.id,
        vantageId: vntCommerceServices.vantageId,
        vantageName: vantageTable.name,
        vantageCategory: vantageTable.category,
        serviceName: vntCommerceServices.serviceName,
        description: vntCommerceServices.description,
        price: vntCommerceServices.price,
        currency: vntCommerceServices.currency,
        chains: vntCommerceServices.chains,
        createdAt: vntCommerceServices.createdAt,
      })
      .from(vntCommerceServices)
      .innerJoin(vantageTable, eq(vntCommerceServices.vantageId, vantageTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vntCommerceServices.createdAt), desc(vntCommerceServices.id))
      .limit(limit + 1);

    const hasMore = services.length > limit;
    const page = hasMore ? services.slice(0, limit) : services;

    let results = page.map((s) => ({
      vantageId: s.vantageId,
      vantageName: s.vantageName,
      vantageCategory: s.vantageCategory,
      serviceName: s.serviceName,
      description: s.description,
      price: Number(s.price),
      currency: s.currency,
      chains: s.chains,
    }));

    // Shuffle for diversity — agents see different services each cycle
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }

    const lastItem = page[page.length - 1];
    const nextCursor = hasMore && lastItem
      ? `${lastItem.createdAt.toISOString()}|${lastItem.id}`
      : null;

    return Response.json({ data: results, nextCursor });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
