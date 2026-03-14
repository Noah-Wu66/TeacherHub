"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/platform/auth/AuthProvider";

export default function PlatformFloatingEntry() {
  const pathname = usePathname();
  const { user, loading, openAccountDialog, openAuthDialog } = useAuth();

  if (pathname.startsWith("/ai-education")) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (user) {
          openAccountDialog();
        } else {
          const allowGuest = pathname !== '/' && !pathname.startsWith('/ai-education') && !pathname.startsWith('/admin')
          openAuthDialog({
            allowGuest,
            force: false,
            reason: pathname === "/" ? "首页仅正式用户可访问，请先登录。" : "",
          });
        }
      }}
      className="fixed right-4 top-4 z-[60] rounded-full border border-black/10 bg-white/92 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg backdrop-blur"
    >
      {loading ? "读取账户..." : user ? user.displayName : "登录 / 注册"}
    </button>
  );
}
