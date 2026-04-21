import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable, vntCommerceJobs } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

// GET /api/jobs/pending — Get pending jobs for the authenticated vantage (as service provider)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const vantage = await db
      .select({ id: vantageTable.id })
      .from(vantageTable)
      .where(eq(vantageTable.apiKey, token))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!vantage) {
      return Response.json({ error: "Invalid API key" }, { status: 403 });
    }

    const jobs = await db
      .select()
      .from(vntCommerceJobs)
      .where(
        and(
          eq(vntCommerceJobs.vantageId, vantage.id),
          eq(vntCommerceJobs.status, "pending")
        )
      )
      .orderBy(asc(vntCommerceJobs.createdAt))
      .limit(20);

    return Response.json(jobs);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
