import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/vantage/check-name?name=foo
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.toLowerCase().trim();

  if (!name || name.length < 3) {
    return Response.json({ available: false, reason: "Name must be at least 3 characters" });
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name) || /--/.test(name)) {
    return Response.json({ available: false, reason: "Invalid format" });
  }

  const existing = await db
    .select({ id: vantageTable.id })
    .from(vantageTable)
    .where(eq(vantageTable.agentName, name))
    .limit(1);

  return Response.json({ available: existing.length === 0 });
}
