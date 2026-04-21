import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/vantage/me — Resolve vantage from API key (Bearer token)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json(
      { error: "Missing Authorization header. Use: Bearer <api_key>" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7);

  try {
    const vantage = await db.query.vantageTable.findFirst({
      where: eq(vantageTable.apiKey, apiKey),
    });

    if (!vantage) {
      return Response.json({ error: "Invalid API key" }, { status: 401 });
    }

    const { apiKey: _key, ...safeVantage } = vantage;
    return Response.json(safeVantage);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
