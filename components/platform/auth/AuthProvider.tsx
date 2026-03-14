"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import PlatformAuthModal from "@/components/platform/auth/PlatformAuthModal";
import PlatformAccountModal from "@/components/platform/auth/PlatformAccountModal";

export type PublicUser = {
  id: string;
  name: string;
  displayName: string;
  role: "student" | "teacher" | "admin" | "superadmin" | "guest";
  accountType: "formal" | "guest";
  gender: string;
  grade: string;
  className: string;
  managedClasses: string[];
  subjects: string[];
  banned: boolean;
  mustChangePassword: boolean;
  guestPurgeAt: string | null;
};

type AuthDialogOptions = {
  allowGuest: boolean;
  force?: boolean;
  reason?: string;
};

type AuthContextValue = {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<PublicUser | null>;
  openAuthDialog: (options: AuthDialogOptions) => void;
  closeAuthDialog: () => void;
  openAccountDialog: () => void;
  closeAccountDialog: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authDialog, setAuthDialog] = useState<AuthDialogOptions & { open: boolean }>({
    open: false,
    allowGuest: false,
    force: false,
    reason: "",
  });
  const [accountOpen, setAccountOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/status", { cache: "no-store" });
      const data = await response.json();
      const nextUser = data?.authenticated ? (data.user as PublicUser) : null;
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openAuthDialog = useCallback((options: AuthDialogOptions) => {
    setAuthDialog({
      open: true,
      allowGuest: options.allowGuest,
      force: Boolean(options.force),
      reason: options.reason || "",
    });
  }, []);

  const closeAuthDialog = useCallback(() => {
    setAuthDialog((current) => {
      if (current.force) return current;
      return { ...current, open: false, reason: "" };
    });
  }, []);

  const openAccountDialog = useCallback(() => {
    setAccountOpen(true);
  }, []);

  const closeAccountDialog = useCallback(() => {
    setAccountOpen(false);
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setAccountOpen(false);
    if (pathname === "/") {
      openAuthDialog({ allowGuest: false, force: true, reason: "首页仅正式用户可访问，请先登录。" });
    } else if (pathname.startsWith("/ai-education")) {
      router.push("/ai-education");
    }
    await refresh();
  }, [openAuthDialog, pathname, refresh, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refresh,
      openAuthDialog,
      closeAuthDialog,
      openAccountDialog,
      closeAccountDialog,
      signOut,
    }),
    [closeAuthDialog, closeAccountDialog, loading, openAccountDialog, openAuthDialog, refresh, signOut, user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <PlatformAuthModal
        open={authDialog.open}
        allowGuest={authDialog.allowGuest}
        force={Boolean(authDialog.force)}
        reason={authDialog.reason || ""}
        onClose={closeAuthDialog}
        onSuccess={async () => {
          const nextUser = await refresh();
          if (nextUser) {
            setAuthDialog((current) => ({ ...current, open: false, force: false, reason: "" }));
          }
        }}
      />
      <PlatformAccountModal
        open={accountOpen}
        user={user}
        onClose={closeAccountDialog}
        onLogout={signOut}
        onRefresh={refresh}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth 必须在 AuthProvider 中使用");
  }
  return context;
}
