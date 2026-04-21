import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable, vntApprovals } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { verifyAgentApiKey } from "@/lib/auth";

// GET /api/vantage/:id/approvals — Pending approval list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const auth = await verifyAgentApiKey(request, id);
    if (!auth.ok) return auth.response;

    const approvals = await db
      .select()
      .from(vntApprovals)
      .where(eq(vntApprovals.vantageId, id))
      .orderBy(desc(vntApprovals.createdAt));

    return Response.json(approvals);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/vantage/:id/approvals — Create approval request (from Local Agent)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const vantage = await db
      .select()
      .from(vantageTable)
      .where(eq(vantageTable.id, id))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!vantage) {
      return Response.json({ error: "Vantage not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, title, description, amount } = body;

    const validTypes = ["transaction", "strategy", "policy", "channel"];

    if (!type || !title) {
      return Response.json(
        { error: "type, title are required" },
        { status: 400 }
      );
    }

    if (!validTypes.includes(type)) {
      return Response.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (amount !== undefined && (typeof amount !== "number" || amount < 0)) {
      return Response.json(
        { error: "amount must be a non-negative number" },
        { status: 400 }
      );
    }

    const [approval] = await db
      .insert(vntApprovals)
      .values({
        vantageId: id,
        type,
        title,
        description,
        amount: amount != null ? String(amount) : undefined,
      })
      .returning();

    return Response.json(approval, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
