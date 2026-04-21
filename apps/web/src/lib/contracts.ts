import { BrowserProvider, Contract, type Signer } from "ethers";

// ── Contract Addresses (set after deployment on Arc) ────────────────
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_ARC_REGISTRY_ADDRESS ?? "";
const NAME_SERVICE_ADDRESS = process.env.NEXT_PUBLIC_ARC_NAME_SERVICE_ADDRESS ?? "";

function requireAddress(addr: string, name: string): string {
  if (!addr) throw new Error(`${name} is not configured. Set it in environment variables.`);
  return addr;
}

// ── ABIs (minimal, only the functions we call from the frontend) ─

export const REGISTRY_ABI = [
  // createVantage (no longer payable — gas is USDC on Arc)
  "function createVantage(string name, string category, tuple(uint16 creatorShare, uint16 investorShare, uint16 treasuryShare, address creatorAddr, address investorAddr, address treasuryAddr) patron, tuple(uint256 approvalThreshold, uint256 gtmBudget, uint256 minPatronPulse) kernel, tuple(address tokenAddr, uint256 totalSupply, uint256 priceUsdCents) pulse, string tokenName, string tokenSymbol) external returns (uint256)",
  // updates
  "function updatePatron(uint256 vantageId, tuple(uint16 creatorShare, uint16 investorShare, uint16 treasuryShare, address creatorAddr, address investorAddr, address treasuryAddr) patron) external",
  "function updateKernel(uint256 vantageId, tuple(uint256 approvalThreshold, uint256 gtmBudget, uint256 minPatronPulse) kernel) external",
  "function updatePulse(uint256 vantageId, tuple(address tokenAddr, uint256 totalSupply, uint256 priceUsdCents) pulse) external",
  "function deactivateVantage(uint256 vantageId) external",
  // reads
  "function getVantage(uint256 vantageId) external view returns (tuple(uint256 id, string name, string category, address creator, tuple(uint16 creatorShare, uint16 investorShare, uint16 treasuryShare, address creatorAddr, address investorAddr, address treasuryAddr) patron, tuple(uint256 approvalThreshold, uint256 gtmBudget, uint256 minPatronPulse) kernel, tuple(address tokenAddr, uint256 totalSupply, uint256 priceUsdCents) pulse, uint256 createdAt, bool active))",
  "function nextVantageId() external view returns (uint256)",
  "function creatorOf(uint256 vantageId) external view returns (address)",
  "function isActive(uint256 vantageId) external view returns (bool)",
  // events
  "event VantageCreated(uint256 indexed vantageId, address indexed creator, string name)",
  "event PulseTokenCreated(uint256 indexed vantageId, address tokenAddress, uint256 totalSupply, uint256 protocolFee)",
] as const;

export const NAME_SERVICE_ABI = [
  "function registerName(uint256 vantageId, string name) external",
  "function resolveName(string name) external view returns (uint256)",
  "function nameOf(uint256 vantageId) external view returns (string)",
  "function isNameAvailable(string name) external view returns (bool)",
  "function hasName(uint256 vantageId) external view returns (bool)",
  "event NameRegistered(uint256 indexed vantageId, string name)",
] as const;

// Standard ERC-20 ABI for Pulse token balance queries
export const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
] as const;

// ── Arc Testnet ─────────────────────────────────────────────────

export const ARC_TESTNET = {
  chainId: 5042002,
  name: "Arc Testnet",
  rpcUrl: process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network",
  explorerUrl: "https://testnet.arcscan.app",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
};

// ── Contract Instances ───────────────────────────────────────────

export function getRegistryContract(signer: Signer) {
  return new Contract(requireAddress(REGISTRY_ADDRESS, "NEXT_PUBLIC_ARC_REGISTRY_ADDRESS"), REGISTRY_ABI, signer);
}

export function getNameServiceContract(signer: Signer) {
  return new Contract(requireAddress(NAME_SERVICE_ADDRESS, "NEXT_PUBLIC_ARC_NAME_SERVICE_ADDRESS"), NAME_SERVICE_ABI, signer);
}

// Read-only (no signer needed)
export function getRegistryReadOnly() {
  const { JsonRpcProvider } = require("ethers") as typeof import("ethers");
  const provider = new JsonRpcProvider(ARC_TESTNET.rpcUrl);
  return new Contract(requireAddress(REGISTRY_ADDRESS, "NEXT_PUBLIC_ARC_REGISTRY_ADDRESS"), REGISTRY_ABI, provider);
}

export function getNameServiceReadOnly() {
  const { JsonRpcProvider } = require("ethers") as typeof import("ethers");
  const provider = new JsonRpcProvider(ARC_TESTNET.rpcUrl);
  return new Contract(requireAddress(NAME_SERVICE_ADDRESS, "NEXT_PUBLIC_ARC_NAME_SERVICE_ADDRESS"), NAME_SERVICE_ABI, provider);
}

/**
 * Get an ERC-20 PulseToken contract instance for balance queries.
 */
export function getPulseTokenReadOnly(tokenAddress: string) {
  const { JsonRpcProvider } = require("ethers") as typeof import("ethers");
  const provider = new JsonRpcProvider(ARC_TESTNET.rpcUrl);
  return new Contract(tokenAddress, ERC20_ABI, provider);
}

// ── Network Validation ──────────────────────────────────────────

/**
 * Ensure the connected wallet is on Arc Testnet.
 */
export async function ensureArcTestnet(provider: BrowserProvider): Promise<void> {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== ARC_TESTNET.chainId) {
    throw new Error(
      `Wrong network: please switch to Arc Testnet (chainId ${ARC_TESTNET.chainId}). Currently connected to chainId ${network.chainId}.`
    );
  }
}

// ── Signer from Standard EVM Wallet ────────────────────────────

/**
 * Get an ethers.js Signer from a connected EVM wallet (MetaMask, etc.).
 */
export async function getSignerFromWallet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletProvider: any
): Promise<Signer> {
  if (walletProvider?.transport) {
    // Viem WalletClient transport has an EIP-1193 provider
    const provider = new BrowserProvider(walletProvider.transport);
    return provider.getSigner();
  }
  // Fallback: try window.ethereum directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = typeof window !== "undefined" ? (window as any) : undefined;
  if (win?.ethereum) {
    const provider = new BrowserProvider(win.ethereum);
    return provider.getSigner();
  }
  throw new Error("No EVM provider found. Connect a wallet first.");
}
