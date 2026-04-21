import { NextRequest } from "next/server";
import { db } from "@/db";
import { vantageTable, vntPatrons, vntCommerceServices } from "@/db/schema";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { createAgentWallet } from "@/lib/circle";
import { createVantageSchema, parseBody } from "@/lib/schemas";

// GET /api/vantage — List vantagees with cursor-based pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 100);

    const patronCount = db
      .select({
        vantageId: vntPatrons.vantageId,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(vntPatrons)
      .groupBy(vntPatrons.vantageId)
      .as("patronCount");

    // Build cursor condition (createdAt DESC with id tiebreaker)
    const conditions = [];
    if (cursor) {
      // Cursor format: "<createdAt ISO>|<id>"
      const [cursorDate, cursorId] = cursor.split("|");
      if (cursorDate && cursorId) {
        conditions.push(
          or(
            lt(vantageTable.createdAt, new Date(cursorDate)),
            and(
              eq(vantageTable.createdAt, new Date(cursorDate)),
              lt(vantageTable.id, cursorId),
            ),
          )!,
        );
      }
    }

    const vantagees = await db
      .select({
        id: vantageTable.id,
        onChainId: vantageTable.onChainId,
        agentName: vantageTable.agentName,
        name: vantageTable.name,
        category: vantageTable.category,
        description: vantageTable.description,
        status: vantageTable.status,
        tokenAddress: vantageTable.tokenAddress,
        tokenSymbol: vantageTable.tokenSymbol,
        pulsePrice: vantageTable.pulsePrice,
        totalSupply: vantageTable.totalSupply,
        creatorShare: vantageTable.creatorShare,
        investorShare: vantageTable.investorShare,
        treasuryShare: vantageTable.treasuryShare,
        persona: vantageTable.persona,
        targetAudience: vantageTable.targetAudience,
        channels: vantageTable.channels,
        toneVoice: vantageTable.toneVoice,
        approvalThreshold: vantageTable.approvalThreshold,
        gtmBudget: vantageTable.gtmBudget,
        minPatronPulse: vantageTable.minPatronPulse,
        agentOnline: vantageTable.agentOnline,
        agentLastSeen: vantageTable.agentLastSeen,
        walletAddress: vantageTable.walletAddress,
        creatorAddress: vantageTable.creatorAddress,
        investorAddress: vantageTable.investorAddress,
        treasuryAddress: vantageTable.treasuryAddress,
        createdAt: vantageTable.createdAt,
        updatedAt: vantageTable.updatedAt,
        patrons: patronCount.count,
      })
      .from(vantageTable)
      .leftJoin(patronCount, eq(vantageTable.id, patronCount.vantageId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vantageTable.createdAt), desc(vantageTable.id))
      .limit(limit + 1);

    const hasMore = vantagees.length > limit;
    const page = hasMore ? vantagees.slice(0, limit) : vantagees;

    const data = page.map((c) => ({
      ...c,
      patrons: c.patrons ?? 0,
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

// POST /api/vantage — Create a new Vantage (Genesis)
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, createVantageSchema);
    if (parsed.error) return parsed.error;

    const {
      name,
      category,
      description,
      totalSupply: supply,
      persona,
      targetAudience,
      channels,
      approvalThreshold,
      gtmBudget,
      creatorAddress,
      walletAddress,
      onChainId,
      agentName,
      toneVoice,
      initialPrice,
      minPatronPulse,
      tokenAddress,
      tokenSymbol,
      serviceName,
      serviceDescription,
      servicePrice,
    } = parsed.data;

    // Generate API key for local agent
    const apiKey = `vnt_${randomBytes(24).toString("hex")}`;

    // Create Circle MPC wallet for Prime Agent (x402 payments on Arc)
    let agentWalletId: string | null = null;
    let agentWalletAddress: string | null = null;
    try {
      const wallet = await createAgentWallet();
      agentWalletId = wallet.walletId;
      agentWalletAddress = wallet.address;
    } catch (err) {
      console.error("Circle wallet creation failed:", err);
      // Non-blocking — vantage can still be created without agent wallet
    }

    // Revenue model: 100% to Agent Treasury (no external distribution)
    const [vantage] = await db
      .insert(vantageTable)
      .values({
        name,
        category,
        description,
        apiKey,
        totalSupply: supply,
        creatorShare: 0,
        investorShare: 0,
        treasuryShare: 100,
        persona,
        targetAudience,
        channels: channels ?? [],
        toneVoice: toneVoice ?? null,
        approvalThreshold: String(approvalThreshold ?? 10),
        gtmBudget: String(gtmBudget ?? 200),
        pulsePrice: String(initialPrice ?? 0),
        minPatronPulse: minPatronPulse ?? null,
        creatorAddress,
        walletAddress,
        onChainId: onChainId ?? null,
        agentName: agentName ?? null,
        tokenAddress: tokenAddress ?? null,
        tokenSymbol: tokenSymbol ?? null,
        agentWalletId,
        agentWalletAddress,
      })
      .returning();

    // Create initial Patron (Creator — governance participant, no revenue share)
    // pulseAmount = governance voting weight (60% of supply)
    // share = revenue share percentage (always 0 under Agent Treasury model)
    const CREATOR_GOVERNANCE_FRACTION = 0.6;
    if (creatorAddress) {
      await db.insert(vntPatrons).values({
        vantageId: vantage.id,
        walletAddress: creatorAddress,
        role: "Creator",
        pulseAmount: Math.floor(supply * CREATOR_GOVERNANCE_FRACTION),
        share: "0",
      });
    }

    // Create Commerce Service if service info provided
    if (serviceName && servicePrice) {
      const serviceWallet = agentWalletAddress || creatorAddress || walletAddress;
      if (serviceWallet) {
        await db.insert(vntCommerceServices).values({
          vantageId: vantage.id,
          serviceName,
          description: serviceDescription ?? description,
          price: String(servicePrice),
          walletAddress: serviceWallet,
        });
      }
    }

    // Return vantage without apiKey (return it only once in a separate field)
    const { apiKey: generatedKey, ...safeVantage } = vantage;
    return Response.json(
      { ...safeVantage, apiKeyOnce: generatedKey },
      { status: 201 }
    );
  } catch (err: unknown) {
    const e = err as Record<string, unknown>;
    console.error("POST /api/vantage error:", JSON.stringify({
      message: e?.message,
      code: e?.code,
      detail: e?.detail,
      hint: e?.hint,
      constraint: e?.constraint,
      column: e?.column,
      table: e?.table,
      cause: e?.cause,
    }, null, 2));
    console.error("Full error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
