"use client";

import type { ReactNode } from "react";
import { useAccessControl } from "@/components/platform/auth/useAccessControl";

export default function ToolAccessGuard({
  allowGuest,
  reason,
  children,
}: {
  allowGuest: boolean;
  reason: string;
  children: ReactNode;
}) {
  const access = useAccessControl({ allowGuest, reason });

  if (access.loading) {
    return <div className="min-h-dvh" />;
  }

  if (!access.allowed) {
    return <div className="min-h-dvh" />;
  }

  return <>{children}</>;
}
