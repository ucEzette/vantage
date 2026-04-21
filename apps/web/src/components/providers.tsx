"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

let _listeners: Array<() => void> = [];
let _state: WalletContextValue = {
  address: null,
  isConnected: false,
  chainId: null,
  connect: async () => {},
  disconnect: () => {},
};

function notify() {
  _listeners.forEach((fn) => fn());
}

/**
 * Providers wrapper — uses raw window.ethereum for standard EVM wallet (MetaMask, etc.)
 * No third-party wallet SDK (Dynamic Labs removed).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, []);

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          const accts = accounts as string[];
          if (accts.length > 0) {
            _state = { ..._state, address: accts[0], isConnected: true };
            notify();
          }
        })
        .catch(() => {});

      window.ethereum
        .request({ method: "eth_chainId" })
        .then((chainId) => {
          _state = { ..._state, chainId: parseInt(chainId as string, 16) };
          notify();
        })
        .catch(() => {});

      const handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        if (accounts.length === 0) {
          _state = { ..._state, address: null, isConnected: false };
        } else {
          _state = { ..._state, address: accounts[0], isConnected: true };
        }
        notify();
      };

      const handleChainChanged = (...args: unknown[]) => {
        const chainId = args[0] as string;
        _state = { ..._state, chainId: parseInt(chainId, 16) };
        notify();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  _state.connect = async () => {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (accounts.length > 0) {
        _state = { ..._state, address: accounts[0], isConnected: true };

        // Try to switch to Arc Testnet
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x4CE992" }], // 5042002
          });
        } catch (switchErr: unknown) {
          const err = switchErr as { code?: number };
          // Chain not added — add it
          if (err.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x4CE992",
                  chainName: "Arc Testnet",
                  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
                  rpcUrls: ["https://rpc.testnet.arc.network"],
                  blockExplorerUrls: ["https://testnet.arcscan.app"],
                },
              ],
            });
          }
        }

        const chainId = (await window.ethereum.request({
          method: "eth_chainId",
        })) as string;
        _state = { ..._state, chainId: parseInt(chainId, 16) };
        notify();
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  _state.disconnect = () => {
    _state = { ..._state, address: null, isConnected: false, chainId: null };
    notify();
  };

  return <>{children}</>;
}

/**
 * Hook to access wallet state. Works with any EVM wallet (MetaMask, etc.)
 */
export function useWallet(): WalletContextValue {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, []);

  return _state;
}
