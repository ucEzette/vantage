import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { regenerateKeySchema, parseBody } from "@/lib/schemas";

// POST /api/vantage/:id/regenerate-key — Regenerate API key (invalidates old key)
// Requires EIP-191 personal_sign proof of wallet ownership.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const parsed = await parseBody(request, regenerateKeySchema);
    if (parsed.error) return parsed.error;

    const { walletAddress, signature, message } = parsed.data;

    // Verify the message contains the vantage ID to prevent replay across vantagees
    if (!message.includes(id)) {
      return Response.json(
        { error: "Signature message must contain the vantage ID" },
        { status: 400 }
      );
    }

    const vantage = await db.query.vantageTable.findFirst({
      where: eq(vantageTable.id, id),
    });

    if (!vantage) {
      return Response.json({ error: "Vantage not found" }, { status: 404 });
    }

    // Only the creator wallet can regenerate
    if (
      vantage.walletAddress?.toLowerCase() !== walletAddress.toLowerCase() &&
      vantage.creatorAddress?.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify EIP-191 signature proves wallet ownership
    const { ethers } = await import("ethers");
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return Response.json({ error: "Invalid signature" }, { status: 403 });
    }

    const newApiKey = `cpk_${randomBytes(24).toString("hex")}`;

    await db
      .update(vantageTable)
      .set({ apiKey: newApiKey })
      .where(eq(vantageTable.id, id));

    return Response.json({ apiKey: newApiKey });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
