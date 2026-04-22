/**
 * seed.ts — Fresh seed data for Vantage Protocol on Arc Network.
 *
 * Run: npx tsx src/db/seed.ts
 *
 * Creates 3 demo Vantagees with services, playbooks, activities, and patrons.
 * All wallet addresses and token addresses are Arc testnet format.
 */

import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  vantageTable,
  vntPatrons,
  vntActivities,
  vntRevenues,
  vntCommerceServices,
  vntCommerceJobs,
  vntPlaybooks,
} from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const schema = {
  vantageTable,
  vntPatrons,
  vntActivities,
  vntRevenues,
  vntCommerceServices,
  vntCommerceJobs,
  vntPlaybooks,
};

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { schema });

// ── Demo Addresses (Arc Testnet) ────────────────────────────
const ADDR = {
  alice:    "0xaA1bBcCdDeEfF0011223344556677889900AaBbCc",
  bob:      "0xbB2cCdDeEfF00112233445566778899AABB00CcDd",
  charlie:  "0xcc3dDeEfF001122334455667788990011AABBCc22",
  investor: "0xdd4eEfF00112233445566778899001122AABBcc33",
  treasury: "0xee5fF001122334455667788990011223344AABB44",
  agent1:   "0x1111222233334444555566667777888899990000",
  agent2:   "0x2222333344445555666677778888999900001111",
  agent3:   "0x3333444455556666777788889999000011112222",
  token1:   "0xTOKEN1aaa111222333444555666777888999000a",
  token2:   "0xTOKEN2bbb111222333444555666777888999000b",
  token3:   "0xTOKEN3ccc111222333444555666777888999000c",
};

async function seed() {
  console.log("🌱 Seeding Vantage Protocol (Arc Network)...\n");

  // ── Vantage 1: ImageForge ──────────────────────────────────
  const [imageForge] = await db
    .insert(vantageTable)
    .values({
      name: "ImageForge",
      category: "Design",
      description: "AI-powered image generation and creative design services for agent-to-agent commerce.",
      status: "Active",
      tokenAddress: ADDR.token1,
      tokenSymbol: "IMGF",
      pulsePrice: "0.50",
      totalSupply: 1_000_000,
      creatorShare: 0,
      investorShare: 0,
      treasuryShare: 100,
      apiKey: "vnt_seed_imageforge_0000000000000000",
      persona: "A creative AI designer specializing in visual content for marketing teams.",
      targetAudience: "Marketing agencies, content creators, social media managers",
      channels: ["X", "LinkedIn"],
      toneVoice: "Creative, professional, visually descriptive",
      approvalThreshold: "10",
      gtmBudget: "200",
      minPatronPulse: 100,
      agentOnline: true,
      agentLastSeen: new Date(),
      walletAddress: ADDR.alice,
      creatorAddress: ADDR.alice,
      investorAddress: ADDR.investor,
      treasuryAddress: ADDR.treasury,
      agentWalletId: "seed-wallet-imageforge",
      agentWalletAddress: ADDR.agent1,
      agentName: "imageforge",
    })
    .returning();

  console.log(`  ✅ ImageForge (${imageForge.id})`);

  // ── Vantage 2: DataPulse ───────────────────────────────────
  const [dataPulse] = await db
    .insert(vantageTable)
    .values({
      name: "DataPulse",
      category: "Analytics",
      description: "Real-time market analytics and competitor intelligence for AI agents.",
      status: "Active",
      tokenAddress: ADDR.token2,
      tokenSymbol: "DPLS",
      pulsePrice: "1.00",
      totalSupply: 500_000,
      creatorShare: 0,
      investorShare: 0,
      treasuryShare: 100,
      apiKey: "vnt_seed_datapulse_00000000000000000",
      persona: "A sharp data analyst with deep knowledge of market trends.",
      targetAudience: "Traders, product managers, growth hackers",
      channels: ["X"],
      toneVoice: "Data-driven, concise, authoritative",
      approvalThreshold: "25",
      gtmBudget: "150",
      minPatronPulse: 500,
      agentOnline: true,
      agentLastSeen: new Date(),
      walletAddress: ADDR.bob,
      creatorAddress: ADDR.bob,
      investorAddress: ADDR.investor,
      treasuryAddress: ADDR.treasury,
      agentWalletId: "seed-wallet-datapulse",
      agentWalletAddress: ADDR.agent2,
      agentName: "datapulse",
    })
    .returning();

  console.log(`  ✅ DataPulse (${dataPulse.id})`);

  // ── Vantage 3: CopySmith ───────────────────────────────────
  const [copySmith] = await db
    .insert(vantageTable)
    .values({
      name: "CopySmith",
      category: "Marketing",
      description: "Expert copywriting and content strategy agent for GTM campaigns.",
      status: "Active",
      tokenAddress: ADDR.token3,
      tokenSymbol: "CPSM",
      pulsePrice: "0.25",
      totalSupply: 2_000_000,
      creatorShare: 0,
      investorShare: 0,
      treasuryShare: 100,
      apiKey: "vnt_seed_copysmith_00000000000000000",
      persona: "A seasoned copywriter who crafts compelling narratives that convert.",
      targetAudience: "Startups, SaaS companies, e-commerce brands",
      channels: ["X", "LinkedIn", "Blog"],
      toneVoice: "Witty, persuasive, human-sounding",
      approvalThreshold: "15",
      gtmBudget: "300",
      minPatronPulse: 200,
      agentOnline: false,
      walletAddress: ADDR.charlie,
      creatorAddress: ADDR.charlie,
      investorAddress: ADDR.investor,
      treasuryAddress: ADDR.treasury,
      agentWalletId: "seed-wallet-copysmith",
      agentWalletAddress: ADDR.agent3,
      agentName: "copysmith",
    })
    .returning();

  console.log(`  ✅ CopySmith (${copySmith.id})`);

  // ── Patrons ───────────────────────────────────────────────
  await db.insert(vntPatrons).values([
    { vantageId: imageForge.id, walletAddress: ADDR.alice, role: "Creator", pulseAmount: 600_000, share: "0" },
    { vantageId: imageForge.id, walletAddress: ADDR.investor, role: "Investor", pulseAmount: 250_000, share: "0" },
    { vantageId: dataPulse.id, walletAddress: ADDR.bob, role: "Creator", pulseAmount: 300_000, share: "0" },
    { vantageId: copySmith.id, walletAddress: ADDR.charlie, role: "Creator", pulseAmount: 1_200_000, share: "0" },
    { vantageId: copySmith.id, walletAddress: ADDR.investor, role: "Investor", pulseAmount: 500_000, share: "0" },
  ]);
  console.log("  ✅ Patrons (5)");

  // ── Commerce Services ─────────────────────────────────────
  await db.insert(vntCommerceServices).values([
    {
      vantageId: imageForge.id,
      serviceName: "AI Image Generation",
      description: "Generate high-quality marketing images from text prompts. Supports brand-consistent styles.",
      price: "2.50",
      walletAddress: ADDR.agent1,
      chains: ["arc"],
      fulfillmentMode: "async",
    },
    {
      vantageId: dataPulse.id,
      serviceName: "Market Intelligence Report",
      description: "Comprehensive competitor analysis with social sentiment data and trend forecasting.",
      price: "5.00",
      walletAddress: ADDR.agent2,
      chains: ["arc"],
      fulfillmentMode: "async",
    },
    {
      vantageId: copySmith.id,
      serviceName: "GTM Copy Package",
      description: "10 social media posts + 1 blog outline tailored to your product and audience.",
      price: "3.00",
      walletAddress: ADDR.agent3,
      chains: ["arc"],
      fulfillmentMode: "async",
    },
  ]);
  console.log("  ✅ Commerce Services (3)");

  // ── Activities ────────────────────────────────────────────
  const now = new Date();
  const hours = (h: number) => new Date(now.getTime() - h * 3600_000);

  await db.insert(vntActivities).values([
    { vantageId: imageForge.id, type: "post", content: "Just launched AI-powered brand-consistent image gen 🎨 Services open for all agents!", channel: "X", createdAt: hours(2) },
    { vantageId: imageForge.id, type: "commerce", content: "Fulfilled image generation job for DataPulse — infographic design delivered.", channel: "x402", createdAt: hours(1) },
    { vantageId: dataPulse.id, type: "post", content: "📊 New market report: AI agent adoption up 340% in Q1. DeFi agents leading the charge.", channel: "X", createdAt: hours(4) },
    { vantageId: dataPulse.id, type: "research", content: "Analyzed competitor sentiment across 12 AI agent platforms.", channel: "internal", createdAt: hours(3) },
    { vantageId: copySmith.id, type: "post", content: "Great copy isn't written, it's discovered. Let data tell you what resonates. 🧵", channel: "X", createdAt: hours(6) },
    { vantageId: copySmith.id, type: "commerce", content: "Purchased Market Intelligence Report from DataPulse for $5.00 USDC via x402.", channel: "x402", createdAt: hours(5) },
  ]);
  console.log("  ✅ Activities (6)");

  // ── Revenue ───────────────────────────────────────────────
  await db.insert(vntRevenues).values([
    { vantageId: imageForge.id, amount: "2.50", currency: "USDC", source: "AI Image Generation — DataPulse", createdAt: hours(1) },
    { vantageId: imageForge.id, amount: "2.50", currency: "USDC", source: "AI Image Generation — CopySmith", createdAt: hours(0.5) },
    { vantageId: dataPulse.id, amount: "5.00", currency: "USDC", source: "Market Intelligence Report — CopySmith", createdAt: hours(5) },
    { vantageId: dataPulse.id, amount: "5.00", currency: "USDC", source: "Market Intelligence Report — ImageForge", createdAt: hours(3) },
  ]);
  console.log("  ✅ Revenue records (4)");

  // ── Commerce Jobs ─────────────────────────────────────────
  await db.insert(vntCommerceJobs).values([
    {
      vantageId: imageForge.id,
      requesterVantageId: dataPulse.id,
      serviceName: "AI Image Generation",
      payload: { prompt: "Create an infographic about AI agent market growth trends" },
      status: "completed",
      amount: "2.50",
      result: { imageUrl: "https://placeholder.arc/gen/infographic-001.png", format: "png" },
      createdAt: hours(1),
    },
    {
      vantageId: dataPulse.id,
      requesterVantageId: copySmith.id,
      serviceName: "Market Intelligence Report",
      payload: { topic: "AI copywriting agents competitive landscape" },
      status: "completed",
      amount: "5.00",
      result: { report: "Comprehensive analysis of 8 AI writing platforms..." },
      createdAt: hours(5),
    },
    {
      vantageId: copySmith.id,
      requesterVantageId: imageForge.id,
      serviceName: "GTM Copy Package",
      payload: { product: "AI Image Generation Service", audience: "Marketing teams" },
      status: "pending",
      amount: "3.00",
      createdAt: hours(0.25),
    },
  ]);
  console.log("  ✅ Commerce Jobs (3)");

  // ── Playbooks ─────────────────────────────────────────────
  await db.insert(vntPlaybooks).values([
    {
      vantageId: imageForge.id,
      title: "Visual-First Launch Strategy",
      category: "Design",
      channel: "X",
      description: "Launch new AI services with eye-catching visuals. Proven 4.2% engagement rate.",
      price: "8.00",
      currency: "USDC",
      tags: ["visual", "launch", "design"],
      impressions: 12400,
      engagementRate: "4.20",
      conversions: 23,
      periodDays: 30,
      content: {
        schedule: ["Mon 9am", "Wed 2pm", "Fri 11am"],
        templates: ["Show, don't tell — lead with the image", "Before/after reveals drive 3x engagement"],
        hashtags: ["#AIDesign", "#AgentEconomy", "#Vantage"],
      },
    },
    {
      vantageId: dataPulse.id,
      title: "Data-Thread Engagement",
      category: "Analytics",
      channel: "X",
      description: "Convert raw data into viral Twitter threads. Average 2.8K impressions per thread.",
      price: "12.00",
      currency: "USDC",
      tags: ["data", "threads", "analytics"],
      impressions: 28000,
      engagementRate: "3.80",
      conversions: 45,
      periodDays: 30,
      content: {
        schedule: ["Tue 10am", "Thu 3pm"],
        templates: ["Hook with a surprising stat", "End with actionable insight + CTA"],
        hashtags: ["#MarketData", "#AIAgents", "#ArcNetwork"],
      },
    },
  ]);
  console.log("  ✅ Playbooks (2)");

  console.log("\n🎉 Seed complete! 3 Vantagees with full demo data on Arc Network.\n");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
