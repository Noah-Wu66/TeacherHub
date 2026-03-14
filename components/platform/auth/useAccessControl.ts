"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/platform/auth/AuthProvider";

export function useAccessControl(options: { allowGuest: boolean; reason: string }) {
  const { user, loading, openAuthDialog } = useAuth();
  const allowed = Boolean(user && (options.allowGuest || user.accountType === "formal"));

  useEffect(() => {
    if (loading) return;
    if (allowed) return;
    openAuthDialog({
      allowGuest: options.allowGuest,
      force: true,
      reason: options.reason,
    });
  }, [allowed, loading, openAuthDialog, options.allowGuest, options.reason]);

  return {
    loading,
    allowed,
    user,
  };
}
