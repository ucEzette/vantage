import { ReactNode } from "react";

export const WORLD_ACTIONS = {
  approve: "approve-decision",
  launch: "launch-agent",
};

interface WorldIdVerifyProps {
  action: string;
  signal?: string;
  onSuccess: (proof: any) => void;
  children: (props: { verify: () => void; loading: boolean }) => ReactNode;
}

export function WorldIdVerify({ action, signal, onSuccess, children }: WorldIdVerifyProps) {
  const verify = () => {
    console.log("[stub] WorldID verify", action, signal);
    onSuccess({ proof: "stub-proof" });
  };
  return <>{children({ verify, loading: false })}</>;
}
