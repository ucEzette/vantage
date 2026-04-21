import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyAgentApiKey } from "@/lib/auth";
import { createAgentWallet } from "@/lib/circle";

// GET /api/vantage/:id/wallet — Agent fetches its Circle wallet info at startup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const auth = await verifyAgentApiKey(request, id);
    if (!auth.ok) return auth.response;

    const vantage = await db
      .select({
        agentWalletId: vantageTable.agentWalletId,
        agentWalletAddress: vantageTable.agentWalletAddress,
      })
      .from(vantageTable)
      .where(eq(vantageTable.id, id))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!vantage?.agentWalletId) {
      return Response.json({ error: "No agent wallet created for this Vantage" }, { status: 404 });
    }

    return Response.json({
      walletId: vantage.agentWalletId,
      address: vantage.agentWalletAddress,
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/vantage/:id/wallet — Create Circle wallet for a Vantage that doesn't have one
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const auth = await verifyAgentApiKey(request, id);
    if (!auth.ok) return auth.response;

    // Check if wallet already exists
    const vantage = await db
      .select({
        agentWalletId: vantageTable.agentWalletId,
        agentWalletAddress: vantageTable.agentWalletAddress,
      })
      .from(vantageTable)
      .where(eq(vantageTable.id, id))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (vantage?.agentWalletId) {
      return Response.json({
        walletId: vantage.agentWalletId,
        address: vantage.agentWalletAddress,
        created: false,
      });
    }

    // Create new Circle MPC wallet
    const wallet = await createAgentWallet();

    await db
      .update(vantageTable)
      .set({
        agentWalletId: wallet.walletId,
        agentWalletAddress: wallet.address,
      })
      .where(eq(vantageTable.id, id));

    return Response.json({
      walletId: wallet.walletId,
      address: wallet.address,
      created: true,
    }, { status: 201 });
  } catch (err) {
    console.error("Wallet creation failed:", err);
    return Response.json({ error: "Wallet creation failed" }, { status: 500 });
  }
}
