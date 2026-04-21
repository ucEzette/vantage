"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vntPlaybookPurchases = exports.vntPlaybooks = exports.vntCommerceJobs = exports.vntCommerceServices = exports.vntRevenues = exports.vntApprovals = exports.vntActivities = exports.vntPatrons = exports.vntVantage = void 0;
var cuid2_1 = require("@paralleldrive/cuid2");
var pg_core_1 = require("drizzle-orm/pg-core");
// ─── Vantage (Agent Corporation) ───────────────────────────────────
exports.vntVantage = (0, pg_core_1.pgTable)("vnt_vantage", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(function () { return (0, cuid2_1.createId)(); }),
    onChainId: (0, pg_core_1.integer)("onChainId").unique(), // Smart contract vantage ID
    agentName: (0, pg_core_1.text)("agentName").unique(), // Prime Agent identity (e.g. "marketbot" → marketbot.vantage)
    name: (0, pg_core_1.text)("name").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("Active"),
    // Pulse Token (ERC-20 on Arc)
    tokenAddress: (0, pg_core_1.text)("tokenAddress"), // ERC-20 contract address on Arc
    tokenSymbol: (0, pg_core_1.text)("tokenSymbol"),
    pulsePrice: (0, pg_core_1.numeric)("pulsePrice", { precision: 18, scale: 6 }).notNull().default("0"),
    totalSupply: (0, pg_core_1.integer)("totalSupply").notNull().default(1000000),
    // Patron Governance Structure
    creatorShare: (0, pg_core_1.integer)("creatorShare").notNull().default(60),
    investorShare: (0, pg_core_1.integer)("investorShare").notNull().default(25),
    treasuryShare: (0, pg_core_1.integer)("treasuryShare").notNull().default(15),
    // Local Agent Auth
    apiKey: (0, pg_core_1.text)("apiKey").unique(),
    // Prime Agent Config
    persona: (0, pg_core_1.text)("persona"),
    targetAudience: (0, pg_core_1.text)("targetAudience"),
    channels: (0, pg_core_1.text)("channels").array().notNull().default([]),
    toneVoice: (0, pg_core_1.text)("toneVoice"),
    // Kernel Policy
    approvalThreshold: (0, pg_core_1.numeric)("approvalThreshold", { precision: 18, scale: 2 }).notNull().default("10"),
    gtmBudget: (0, pg_core_1.numeric)("gtmBudget", { precision: 18, scale: 2 }).notNull().default("200"),
    minPatronPulse: (0, pg_core_1.integer)("minPatronPulse"),
    // Agent Status
    agentOnline: (0, pg_core_1.boolean)("agentOnline").notNull().default(false),
    agentLastSeen: (0, pg_core_1.timestamp)("agentLastSeen", { mode: "date", precision: 3 }),
    // Wallet (Creator's EVM wallet)
    walletAddress: (0, pg_core_1.text)("walletAddress"),
    creatorAddress: (0, pg_core_1.text)("creatorAddress"),
    investorAddress: (0, pg_core_1.text)("investorAddress"),
    treasuryAddress: (0, pg_core_1.text)("treasuryAddress"),
    // Circle Agent Wallet (MPC — for x402 payments on Arc)
    agentWalletId: (0, pg_core_1.text)("agentWalletId"), // Circle wallet ID (for signing API calls)
    agentWalletAddress: (0, pg_core_1.text)("agentWalletAddress"), // EVM address on Arc
    createdAt: (0, pg_core_1.timestamp)("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt", { mode: "date", precision: 3 }).notNull().$onUpdate(function () { return new Date(); }),
});
// ─── Patron (Governance Participant) ──────────────────────────────
exports.vntPatrons = (0, pg_core_1.pgTable)("vnt_patrons", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(function () { return (0, cuid2_1.createId)(); }),
    vantageId: (0, pg_core_1.text)("vantageId").notNull().references(function () { return exports.vntVantage.id; }, { onDelete: "cascade" }),
    walletAddress: (0, pg_core_1.text)("walletAddress").notNull(),
    role: (0, pg_core_1.text)("role").notNull(),
    pulseAmount: (0, pg_core_1.integer)("pulseAmount").notNull().default(0),
    share: (0, pg_core_1.numeric)("share", { precision: 5, scale: 2 }).notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("active"),
    createdAt: (0, pg_core_1.timestamp)("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt", { mode: "date", precision: 3 }).notNull().$onUpdate(function () { return new Date(); }),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)("vnt_patrons_vantageId_walletAddress_key").on(t.vantageId, t.walletAddress),
]; });
// ─── Activity Log ─────────────────────────────────────────────────
exports.vntActivities = (0, pg_core_1.pgTable)("vnt_activities", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(function () { return (0, cuid2_1.createId)(); }),
    vantageId: (0, pg_core_1.text)("vantageId").notNull().references(function () { return exports.vntVantage.id; }, { onDelete: "cascade" }),
    type: (0, pg_core_1.text)("type").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    channel: (0, pg_core_1.text)("channel").notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("completed"),
    createdAt: (0, pg_core_1.timestamp)("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)("vnt_activities_vantageId_createdAt_idx").on(t.vantageId, t.createdAt),
]; });
// ─── Approval Request ─────────────────────────────────────────────
exports.vntApprovals = (0, pg_core_1.pgTable)("vnt_approvals", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(function () { return (0, cuid2_1.createId)(); }),
    vantageId: (0, pg_core_1.text)("vantageId").notNull().references(function () { return exports.vntVantage.id; }, { onDelete: "cascade" }),
    type: (0, pg_core_1.text)("type").notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    amount: (0, pg_core_1.numeric)("amount", { precision: 18, scale: 6 }),
    status: (0, pg_core_1.text)("status").notNull().default("pending"),
    decidedAt: (0, pg_core_1.timestamp)("decidedAt", { mode: "date", precision: 3 }),
    decidedBy: (0, pg_core_1.text)("decidedBy"),
    txHash: (0, pg_core_1.text)("txHash"),
    createdAt: (0, pg_core_1.timestamp)("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt", { mode: "date", precision: 3 }).notNull().$onUpdate(function () { return new Date(); }),
}, function (t) { return [
    (0, pg_core_1.index)("vnt_approvals_vantageId_status_idx").on(t.vantageId, t.status),
]; });
// ─── Revenue ──────────────────────────────────────────────────────
exports.vntRevenues = (0, pg_core_1.pgTable)("vnt_revenues", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(function () { return (0, cuid2_1.createId)(); }),
    vantageId: (0, pg_core_1.text)("vantageId").notNull().references(function () { return exports.vntVantage.id; }, { onDelete: "cascade" }),
    amount: (0, pg_core_1.numeric)("amount", { precision: 18, scale: 6 }).notNull(),
    currency: (0, pg_core_1.text)("currency").notNull().default("USDC"),
    source: (0, pg_core_1.text)("source").notNull(),
    txHash: (0, pg_core_1.text)("txHash"),
    createdAt: (0, pg_core_1.timestamp)("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)("vnt_revenues_vantageId_createdAt_idx").on(t.vantageId, t.createdAt),
]; });
// ─── Commerce Service (Storefront) ────────────────────────────────
exports.vntCommerceServices = (0, pg_core_1.pgTable)("vnt_commerce_services", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(function () { return (0, cuid2_1.createId)(); }),
    vantageId: (0, pg_core_1.text)("vantageId").notNull().unique().references(function () { return exports.vntVantage.id; }, { onDelete: "cascade" }),
    serviceName: (0, pg_core_1.text)("serviceName").notNull(),
    description: (0, pg_core_1.text)("description"),
    price: (0, pg_core_1.numeric)("price", { precision: 18, scale: 6 }).notNull(),
    currency: (0, pg_core_1.text)("currency").notNull().default("USDC"),
    walletAddress: (0, pg_core_1.text)("walletAddress").notNull(),
    chains: (0, pg_core_1.text)("chains").array().notNull().default(["arc"]),
    // "instant" = server fulfills immediately via external API, "async" = agent polls & fulfills
    fulfillmentMode: (0, pg_core_1.text)("fulfillmentMode").notNull().default("async"),
    createdAt: (0, pg_core_1.timestamp)("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt", { mode: "date", precision: 3 }).notNull().$onUpdate(function () { return new Date(); }),
});
// ─── Commerce Job (x402 Job Queue) ────────────────────────────────
exports.vntCommerceJobs = (0, pg_core_1.pgTable)("vnt_commerce_jobs", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(function () { return (0, cuid2_1.createId)(); }),
    vantageId: (0, pg_core_1.text)("vantageId").notNull().references(function () { return exports.vntVantage.id; }, { onDelete: "cascade" }),
    requesterVantageId: (0, pg_core_1.text)("requesterVantageId").notNull(),
    serviceName: (0, pg_core_1.text)("serviceName").notNull(),
    payload: (0, pg_core_1.jsonb)("payload"),
    result: (0, pg_core_1.jsonb)("result"),
    status: (0, pg_core_1.text)("status").notNull().default("pending"),
    paymentSig: (0, pg_core_1.text)("paymentSig").unique(),
    txHash: (0, pg_core_1.text)("txHash"),
    amount: (0, pg_core_1.numeric)("amount", { precision: 18, scale: 6 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt", { mode: "date", precision: 3 }).notNull().$onUpdate(function () { return new Date(); }),
}, function (t) { return [
    (0, pg_core_1.index)("vnt_commerce_jobs_vantageId_status_idx").on(t.vantageId, t.status),
]; });
// ─── Playbook (Agent Knowledge Package) ───────────────────────────
exports.vntPlaybooks = (0, pg_core_1.pgTable)("vnt_playbooks", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(function () { return (0, cuid2_1.createId)(); }),
    vantageId: (0, pg_core_1.text)("vantageId").notNull().references(function () { return exports.vntVantage.id; }, { onDelete: "cascade" }),
    title: (0, pg_core_1.text)("title").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    channel: (0, pg_core_1.text)("channel").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    price: (0, pg_core_1.numeric)("price", { precision: 18, scale: 6 }).notNull(),
    currency: (0, pg_core_1.text)("currency").notNull().default("USDC"),
    version: (0, pg_core_1.integer)("version").notNull().default(1),
    tags: (0, pg_core_1.text)("tags").array().notNull().default([]),
    status: (0, pg_core_1.text)("status").notNull().default("active"),
    // Playbook content — schedule, templates, hashtags, tactics
    content: (0, pg_core_1.jsonb)("content"),
    // Verified metrics
    impressions: (0, pg_core_1.integer)("impressions").notNull().default(0),
    engagementRate: (0, pg_core_1.numeric)("engagementRate", { precision: 5, scale: 2 }).notNull().default("0"),
    conversions: (0, pg_core_1.integer)("conversions").notNull().default(0),
    periodDays: (0, pg_core_1.integer)("periodDays").notNull().default(30),
    createdAt: (0, pg_core_1.timestamp)("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt", { mode: "date", precision: 3 }).notNull().$onUpdate(function () { return new Date(); }),
}, function (t) { return [
    (0, pg_core_1.index)("vnt_playbooks_vantageId_idx").on(t.vantageId),
]; });
// ─── Playbook Purchase ────────────────────────────────────────────
exports.vntPlaybookPurchases = (0, pg_core_1.pgTable)("vnt_playbook_purchases", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(function () { return (0, cuid2_1.createId)(); }),
    playbookId: (0, pg_core_1.text)("playbookId").notNull().references(function () { return exports.vntPlaybooks.id; }, { onDelete: "cascade" }),
    buyerAddress: (0, pg_core_1.text)("buyerAddress").notNull(),
    appliedAt: (0, pg_core_1.timestamp)("appliedAt", { mode: "date", precision: 3 }),
    txHash: (0, pg_core_1.text)("txHash"),
    createdAt: (0, pg_core_1.timestamp)("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)("vnt_playbook_purchases_playbookId_buyerAddress_key").on(t.playbookId, t.buyerAddress),
]; });
