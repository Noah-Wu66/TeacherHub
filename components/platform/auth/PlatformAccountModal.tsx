"use client";

import { useMemo, useState } from "react";

type PublicUser = {
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

function getRoleLabel(role: PublicUser["role"]) {
  if (role === "superadmin") return "超级管理员";
  if (role === "admin") return "管理员";
  if (role === "teacher") return "教师";
  if (role === "guest") return "游客";
  return "学生";
}

export default function PlatformAccountModal({
  open,
  user,
  onClose,
  onLogout,
  onRefresh,
}: {
  open: boolean;
  user: PublicUser | null;
  onClose: () => void;
  onLogout: () => Promise<void>;
  onRefresh: () => Promise<PublicUser | null>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const guestDeadline = useMemo(() => {
    if (!user?.guestPurgeAt) return "";
    const date = new Date(user.guestPurgeAt);
    return date.toLocaleString("zh-CN");
  }, [user?.guestPurgeAt]);

  if (!open || !user) return null;

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!currentPassword || !newPassword) {
      setError("请输入当前密码和新密码");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "修改密码失败");
      }
      setCurrentPassword("");
      setNewPassword("");
      setMessage("密码修改成功");
      await onRefresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "修改密码失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">账户信息</h2>
            <p className="mt-1 text-sm text-gray-500">全站工具共用这一套账户状态。</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100">
            ×
          </button>
        </div>

        <div className="space-y-3 rounded-3xl bg-gray-50 p-4">
          <div>
            <div className="text-xs text-gray-400">显示名称</div>
            <div className="text-base font-semibold text-gray-900">{user.displayName}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-400">角色</div>
              <div className="font-medium text-gray-700">{getRoleLabel(user.role)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">账户类型</div>
              <div className="font-medium text-gray-700">{user.accountType === "guest" ? "游客" : "正式账号"}</div>
            </div>
            {user.grade && (
              <div>
                <div className="text-xs text-gray-400">年级</div>
                <div className="font-medium text-gray-700">{user.grade}</div>
              </div>
            )}
            {user.className && (
              <div>
                <div className="text-xs text-gray-400">班级</div>
                <div className="font-medium text-gray-700">{user.className}</div>
              </div>
            )}
          </div>
          {user.accountType === "guest" && guestDeadline && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              游客账号会在 {guestDeadline} 后自动清空。
            </div>
          )}
        </div>

        {user.accountType === "formal" && (
          <form onSubmit={changePassword} className="mt-5 space-y-3">
            <div className="text-sm font-semibold text-gray-800">修改密码</div>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-400"
              placeholder="当前密码"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-400"
              placeholder="新密码（至少 6 位）"
            />
            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
            {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{message}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "处理中..." : "修改密码"}
            </button>
          </form>
        )}

        {user.role === "teacher" && (
          <div className="mt-5 grid gap-2">
            <a
              href="/ai-education/admin/users"
              className="rounded-2xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              进入学生管理
            </a>
          </div>
        )}

        {(user.role === "admin" || user.role === "superadmin") && (
          <div className="mt-5 grid gap-2">
            <a
              href="/admin/system"
              className="rounded-2xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              进入系统设置
            </a>
            <a
              href="/admin/users"
              className="rounded-2xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              进入用户管理
            </a>
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="mt-5 w-full rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
