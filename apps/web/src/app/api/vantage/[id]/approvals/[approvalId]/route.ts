import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable, vntApprovals, vntPatrons } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { verifyWorldIdProof, type WorldIdProof } from "@/lib/world-id";
import { recordApprovalOnChain } from "@/lib/hedera";

// PATCH /api/vantage/:id/approvals/:approvalId — Approve/reject
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
  const { id, approvalId } = await params;

  try {
    const vantage = await db
      .select({ id: vantageTable.id })
      .from(vantageTable)
      .where(eq(vantageTable.id, id))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!vantage) {
      return Response.json({ error: "Vantage not found" }, { status: 404 });
    }

    const existing = await db
      .select()
      .from(vntApprovals)
      .where(eq(vntApprovals.id, approvalId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!existing || existing.vantageId !== id) {
      return Response.json({ error: "Approval not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status, decidedBy, worldIdProof } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return Response.json(
        { error: "status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // World ID verification for human-in-the-loop approval decisions
    if (!worldIdProof) {
      return Response.json(
        { error: "World ID verification required for approval decisions" },
        { status: 400 }
      );
    }

    const worldIdResult = await verifyWorldIdProof(
      worldIdProof as WorldIdProof,
      process.env.WORLD_ACTION_APPROVE ?? "approve-decision",
      decidedBy ?? ""
    );

    if (!worldIdResult.success) {
      return Response.json(
        { error: worldIdResult.error ?? "World ID verification failed" },
        { status: 403 }
      );
    }

    // Verify the caller is an active Patron (Creator or Investor) of this Vantage
    console.log("[approval] decidedBy:", decidedBy, "vantageId:", id);
    if (decidedBy) {
      const patron = await db
        .select()
        .from(vntPatrons)
        .where(
          and(
            eq(vntPatrons.vantageId, id),
            eq(sql`lower(${vntPatrons.walletAddress})`, decidedBy.toLowerCase()),
            eq(vntPatrons.status, "active")
          )
        )
        .limit(1)
        .then((r) => r[0] ?? null);

      console.log("[approval] patron lookup result:", patron?.id ?? "NOT FOUND", "wallet:", decidedBy.toLowerCase());
      if (!patron) {
        return Response.json(
          { error: "Only active Patrons can approve or reject decisions" },
          { status: 403 }
        );
      }
    }

    const resolvedDecidedBy = decidedBy ?? worldIdResult.nullifier_hash;

    // Record approval decision on Hedera
    const onChainResult = await recordApprovalOnChain(
      approvalId, id, status, resolvedDecidedBy,
    );

    const [approval] = await db
      .update(vntApprovals)
      .set({
        status,
        decidedAt: new Date(),
        decidedBy: resolvedDecidedBy,
        txHash: onChainResult?.txHash ?? null,
      })
      .where(eq(vntApprovals.id, approvalId))
      .returning();

    return Response.json(approval);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
