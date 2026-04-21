/**
 * World ID verification stub.
 */

export interface WorldIdProof {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
}

export async function verifyWorldIdProof(
  proof: WorldIdProof,
  action: string,
  signal: string
) {
  console.log("[stub] verifyWorldIdProof", proof, action, signal);
  return { success: true, nullifier_hash: "stub-nullifier" };
}
