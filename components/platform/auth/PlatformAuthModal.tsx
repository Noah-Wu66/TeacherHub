"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TeacherClassSelector from "@/components/ai-education/auth/components/TeacherClassSelector";
import SubjectSelector from "@/components/ai-education/auth/components/SubjectSelector";

const SUBJECT_OPTIONS = [
  "语文",
  "数学",
  "外语",
  "科学",
  "信息科技",
  "体育与健康",
  "道德与法治",
  "艺术",
  "劳动",
  "综合实践活动",
];

type RoleType = "student" | "teacher";
type ToolDirectoryGroup = {
  title: string;
  items: Array<{
    name: string;
    path: string;
    description: string;
    url: string;
  }>;
};

export default function PlatformAuthModal({
  open,
  allowGuest,
  force,
  reason,
  onClose,
  onSuccess,
}: {
  open: boolean;
  allowGuest: boolean;
  force: boolean;
  reason: string;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<RoleType>("student");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [managedClasses, setManagedClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toolQueryOpen, setToolQueryOpen] = useState(false);
  const [toolPassword, setToolPassword] = useState("");
  const [toolQueryLoading, setToolQueryLoading] = useState(false);
  const [toolQueryError, setToolQueryError] = useState("");
  const [toolGroups, setToolGroups] = useState<ToolDirectoryGroup[]>([]);
  const [toolTotal, setToolTotal] = useState(0);
  const pathname = usePathname();
  const showToolQueryButton = pathname === "/" && activeTab === "login";

  const resetToolQueryState = useCallback(() => {
    setToolQueryOpen(false);
    setToolPassword("");
    setToolQueryLoading(false);
    setToolQueryError("");
    setToolGroups([]);
    setToolTotal(0);
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveTab("login");
      setSelectedRole("student");
      setName("");
      setPassword("");
      setConfirmPassword("");
      setGender("");
      setGrade("");
      setClassName("");
      setInviteCode("");
      setManagedClasses([]);
      setSubjects([]);
      setAgreed(false);
      setError("");
      setLoading(false);
      resetToolQueryState();
    }
  }, [open, resetToolQueryState]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (activeTab === "login") {
      if (!name.trim() || !password) {
        setError("请输入姓名和密码");
        return;
      }
      setLoading(true);
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "登录失败");
        }
        await onSuccess();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "登录失败");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!name.trim()) {
      setError("请输入姓名");
      return;
    }
    if (!password || password.length < 6) {
      setError("密码至少需要6位");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (!gender) {
      setError("请选择性别");
      return;
    }
    if (!grade) {
      setError("请选择年级");
      return;
    }
    if (!inviteCode.trim()) {
      setError("请输入邀请码");
      return;
    }
    if (selectedRole === "student" && !className.trim()) {
      setError("请选择班级");
      return;
    }
    if (selectedRole === "teacher" && managedClasses.length === 0) {
      setError("请至少选择一个管理班级");
      return;
    }
    if (selectedRole === "teacher" && subjects.length === 0) {
      setError("请至少选择一个任教学科");
      return;
    }
    if (!agreed) {
      setError("请先勾选同意相关协议");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password,
          gender,
          grade,
          className,
          role: selectedRole,
          inviteCode: inviteCode.trim().toUpperCase(),
          managedClasses,
          subjects,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "注册失败");
      }
      await onSuccess();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  const guestLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/guest-login", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "游客登录失败");
      }
      await onSuccess();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "游客登录失败");
    } finally {
      setLoading(false);
    }
  };

  const queryToolDirectory = async () => {
    if (!/^\d{4}$/.test(toolPassword)) {
      setToolQueryError("请输入 4 位数字密码");
      return;
    }

    setToolQueryLoading(true);
    setToolQueryError("");
    try {
      const response = await fetch("/api/tool-directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: toolPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "查询失败");
      }
      setToolGroups(Array.isArray(data?.groups) ? data.groups : []);
      setToolTotal(Number(data?.total || 0));
    } catch (queryError) {
      setToolGroups([]);
      setToolTotal(0);
      setToolQueryError(queryError instanceof Error ? queryError.message : "查询失败");
    } finally {
      setToolQueryLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{activeTab === "login" ? "登录平台" : "注册正式账号"}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {reason || (allowGuest ? "登录后可同步账户，游客也可以先直接使用工具。" : "此页面只对正式用户开放。")}
            </p>
          </div>
          {!force && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setError("");
              resetToolQueryState();
            }}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setError("");
              resetToolQueryState();
            }}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">姓名</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-400"
              placeholder="请输入姓名"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-400"
              placeholder={activeTab === "register" ? "至少 6 位" : "请输入密码"}
            />
          </div>

          {activeTab === "register" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-400"
                  placeholder="请再次输入密码"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">身份</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("student")}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      selectedRole === "student" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    学生
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("teacher")}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      selectedRole === "teacher" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    教师
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">性别</label>
                  <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-400"
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">年级</label>
                  <select
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-400"
                  >
                    <option value="">请选择</option>
                    <option value="一年级">一年级</option>
                    <option value="二年级">二年级</option>
                    <option value="三年级">三年级</option>
                    <option value="四年级">四年级</option>
                    <option value="五年级">五年级</option>
                    <option value="六年级">六年级</option>
                  </select>
                </div>
              </div>

              {selectedRole === "student" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">班级</label>
                  <select
                    value={className}
                    onChange={(event) => setClassName(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-400"
                  >
                    <option value="">请选择班级</option>
                    {Array.from({ length: 20 }, (_, index) => `${index + 1}班`).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">管理班级</label>
                    <TeacherClassSelector selectedClasses={managedClasses} onClassesChange={setManagedClasses} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">任教学科</label>
                    <SubjectSelector
                      options={SUBJECT_OPTIONS}
                      selectedSubjects={subjects}
                      onSubjectsChange={setSubjects}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">邀请码</label>
                <input
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 font-mono uppercase outline-none transition focus:border-blue-400"
                  placeholder="请输入邀请码"
                />
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-500">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  我已阅读并同意
                  <a href="/ai-education/legal/user-agreement" target="_blank" rel="noreferrer" className="mx-1 text-blue-600">
                    《用户协议》
                  </a>
                  <a href="/ai-education/legal/privacy-policy" target="_blank" rel="noreferrer" className="mx-1 text-blue-600">
                    《隐私保护协议》
                  </a>
                </span>
              </label>
            </>
          )}

          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "处理中..." : activeTab === "login" ? "登录" : "注册正式账号"}
          </button>

          {allowGuest && activeTab === "login" && (
            <button
              type="button"
              onClick={guestLogin}
              disabled={loading}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              游客登录
            </button>
          )}

          {showToolQueryButton && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-800">工具查询</div>
                  <div className="mt-1 text-xs leading-5 text-gray-500">
                    输入 4 位数字密码后，可以查看全部工具地址。
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToolQueryOpen((current) => !current);
                    setToolQueryError("");
                  }}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  {toolQueryOpen ? "收起" : "工具查询"}
                </button>
              </div>

              {toolQueryOpen && (
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={toolPassword}
                      onChange={(event) => {
                        const nextValue = event.target.value.replace(/\D/g, "").slice(0, 4);
                        setToolPassword(nextValue);
                        setToolQueryError("");
                      }}
                      className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-blue-400"
                      placeholder="请输入 4 位数字密码"
                    />
                    <button
                      type="button"
                      onClick={queryToolDirectory}
                      disabled={toolQueryLoading}
                      className="rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                    >
                      {toolQueryLoading ? "查询中..." : "查看地址"}
                    </button>
                  </div>

                  {toolQueryError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                      {toolQueryError}
                    </div>
                  )}

                  {toolGroups.length > 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white">
                      <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                        共找到 {toolTotal} 个地址
                      </div>
                      <div className="max-h-72 space-y-4 overflow-y-auto px-4 py-4">
                        {toolGroups.map((group) => (
                          <div key={group.title}>
                            <div className="mb-2 text-sm font-semibold text-gray-900">{group.title}</div>
                            <div className="space-y-2">
                              {group.items.map((item) => (
                                <div key={item.url} className="rounded-2xl border border-gray-100 px-3 py-3">
                                  <div className="text-sm font-medium text-gray-800">{item.name}</div>
                                  <div className="mt-1 text-xs text-gray-500">{item.description}</div>
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 block break-all text-xs text-blue-600 hover:text-blue-700"
                                  >
                                    {item.url}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
