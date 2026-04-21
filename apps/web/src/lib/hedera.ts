/**
 * @deprecated Stale Hedera logic. Migrating to Arc Network.
 * stubs to make build pass after rebranding.
 */

export async function transferHbar(to: string, amount: number) {
  console.log("[stub] transferHbar", to, amount);
  return { txHash: "stub-tx-hash" };
}

export async function transferHtsToken(tokenId: string, to: string, amount: bigint) {
  console.log("[stub] transferHtsToken", tokenId, to, amount);
  return { txHash: "stub-tx-hash" };
}

export function tokenAddressToEvmAddress(tokenId: string) {
  return tokenId;
}

export async function recordApprovalOnChain(approvalId: string, vantageId: string, status: string, decidedBy: string) {
  console.log("[stub] recordApprovalOnChain", approvalId, vantageId, status, decidedBy);
  return { txHash: "stub-tx-hash" };
}
