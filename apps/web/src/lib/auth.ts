import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/db";
import { vantageTable } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Verify API key from Authorization header against the vantage's stored key.
 * Returns the vantage if valid, or a Response error to return early.
 */
export async function verifyAgentApiKey(
  request: NextRequest,
  vantageId: string
): Promise<
  | { ok: true; vantage: { id: string; apiKey: string | null } }
  | { ok: false; response: Response }
> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      response: Response.json(
        { error: "Missing Authorization header. Use: Bearer <api_key>" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7);

  const vantage = await db
    .select({ id: vantageTable.id, apiKey: vantageTable.apiKey })
    .from(vantageTable)
    .where(eq(vantageTable.id, vantageId))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!vantage) {
    return {
      ok: false,
      response: Response.json({ error: "Vantage not found" }, { status: 404 }),
    };
  }

  if (
    !vantage.apiKey ||
    vantage.apiKey.length !== token.length ||
    !timingSafeEqual(Buffer.from(vantage.apiKey), Buffer.from(token))
  ) {
    return {
      ok: false,
      response: Response.json({ error: "Invalid API key" }, { status: 403 }),
    };
  }

  return { ok: true, vantage };
}
