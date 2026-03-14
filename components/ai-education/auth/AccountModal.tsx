"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Key, AlertTriangle, Database, User, Users } from "lucide-react";
import { apiFetch } from '@/lib/ai-education/api';
import { useTheme } from '@/components/ai-education/ThemeProvider';

// 拆分后的子组件
import { UserInfo } from "./account/types";
import UserInfoDisplay from "./account/UserInfoDisplay";
import ChangePasswordForm from "./account/ChangePasswordForm";
import EditInfoForm from "./account/EditInfoForm";
import DataMigratePanel from "./account/DataMigratePanel";

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserInfo | null;
  onLogout: () => void;
  onPasswordChanged?: () => void;
}

export default function AccountModal({ visible, onClose, user, onLogout, onPasswordChanged }: AccountModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { theme, toggleTheme } = useTheme();

  // 控制各个面板的显示状态
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showMigrate, setShowMigrate] = useState(false);

  // 当 mustChangePassword 为 true 时，强制显示修改密码表单
  useEffect(() => {
    if (user?.mustChangePassword) {
      setShowChangePassword(true);
    }
  }, [user?.mustChangePassword]);

  // 登出处理
  const handleLogout = async () => {
    setLoading(true);
    try {
      await apiFetch('/ai-education/api/auth/logout', { method: 'POST' });
      onLogout();
      onClose();
    } catch {
      onLogout();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // 关闭弹窗（强制修改密码时不允许关闭）
  const handleClose = () => {
    if (user?.mustChangePassword) return;
    setShowMigrate(false);
    onClose();
  };

  // 重置所有面板状态
  const resetPanels = () => {
    setShowChangePassword(false);
    setShowEditInfo(false);
    setError('');
  };

  if (!visible || !user) return null;

  // 判断是否有面板打开
  const hasPanelOpen = showChangePassword || showEditInfo || showMigrate;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      onClick={handleClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">账户信息</h2>
          {!user.mustChangePassword && (
            <button
              onClick={handleClose}
              className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* 强制修改密码提示 */}
        {user.mustChangePassword && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">需要修改密码</p>
              <p className="text-xs text-muted-foreground mt-1">
                您的账户需要修改密码后才能继续使用。请设置一个新的密码。
              </p>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 成功提示 */}
        {message && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
            {message}
          </div>
        )}

        {/* 用户信息 - 强制修改密码时简化显示 */}
        {!user.mustChangePassword && !hasPanelOpen && (
          <UserInfoDisplay user={user} theme={theme} toggleTheme={toggleTheme} />
        )}

        {/* 简化的用户信息 - 强制修改密码时 */}
        {user.mustChangePassword && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">账户</p>
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          </div>
        )}

        {/* 修改密码表单 */}
        {showChangePassword && (
          <ChangePasswordForm
            mustChangePassword={user.mustChangePassword}
            onSuccess={() => {
              setShowChangePassword(false);
              if (onPasswordChanged) onPasswordChanged();
            }}
            onCancel={() => {
              setShowChangePassword(false);
              setError('');
            }}
            setError={setError}
            setMessage={setMessage}
          />
        )}

        {/* 编辑个人信息表单 */}
        {showEditInfo && (
          <EditInfoForm
            user={user}
            onSuccess={() => setShowEditInfo(false)}
            onCancel={() => {
              setShowEditInfo(false);
              setError('');
            }}
            setError={setError}
            setMessage={setMessage}
          />
        )}

        {/* 数据迁移面板 */}
        {showMigrate && (
          <DataMigratePanel
            onClose={() => setShowMigrate(false)}
            setError={setError}
            setMessage={setMessage}
          />
        )}

        {/* 操作按钮区域 - 在没有面板打开时显示 */}
        {!hasPanelOpen && !user.mustChangePassword && (
          <>
            {/* 修改个人信息按钮 - 教师角色 */}
            {user.role === 'teacher' && (
              <button
                onClick={() => {
                  resetPanels();
                  setShowEditInfo(true);
                }}
                className="w-full mb-3 py-2 px-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <User className="h-4 w-4" />
                修改个人信息
              </button>
            )}

            {/* 学生管理按钮 - 教师角色 */}
            {user.role === 'teacher' && (
              <button
                onClick={() => {
                  onClose();
                  router.push('/ai-education/admin/users');
                }}
                className="w-full mb-3 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Users className="h-4 w-4" />
                学生管理
              </button>
            )}

            {/* 修改密码按钮 */}
            <button
              onClick={() => {
                resetPanels();
                setShowChangePassword(true);
              }}
              className="w-full mb-3 py-2 px-4 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Key className="h-4 w-4" />
              修改密码
            </button>

            {/* 数据迁移按钮 - superadmin 专属 */}
            {user.role === 'superadmin' && (
              <button
                onClick={() => {
                  resetPanels();
                  setShowMigrate(true);
                }}
                className="w-full mb-3 py-2 px-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Database className="h-4 w-4" />
                数据迁移
              </button>
            )}

            {/* 登出按钮 */}
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-2 px-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/20 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {loading ? '处理中...' : '退出登录'}
            </button>
          </>
        )}

        {/* 强制修改密码时只显示登出按钮 */}
        {user.mustChangePassword && showChangePassword && (
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full mt-4 py-2 px-4 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {loading ? '处理中...' : '暂不修改，退出登录'}
          </button>
        )}
      </div>
    </div>
  );
}
