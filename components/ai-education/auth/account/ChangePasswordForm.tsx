"use client";
import { useState } from "react";
import { apiFetch } from '@/lib/ai-education/api';

interface ChangePasswordFormProps {
    mustChangePassword?: boolean;
    onSuccess: () => void;
    onCancel: () => void;
    setError: (error: string) => void;
    setMessage: (message: string) => void;
}

export default function ChangePasswordForm({
    mustChangePassword,
    onSuccess,
    onCancel,
    setError,
    setMessage
}: ChangePasswordFormProps) {
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!currentPassword || !newPassword) {
            setError('请输入当前密码和新密码');
            return;
        }

        if (newPassword.length < 6) {
            setError('新密码至少需要6位');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('两次输入的新密码不一致');
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch('/ai-education/api/auth/change-password', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || '修改失败');
            }

            setMessage('密码修改成功');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onSuccess();
        } catch (err: any) {
            setError(err?.message || '修改失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3">
            <div>
                <label className="block text-xs text-muted-foreground mb-1">当前密码</label>
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground text-sm"
                    placeholder="请输入当前密码"
                    disabled={loading}
                    required
                />
            </div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">新密码</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground text-sm"
                    placeholder="至少6位"
                    disabled={loading}
                    required
                    minLength={6}
                />
            </div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">确认新密码</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground text-sm"
                    placeholder="再次输入新密码"
                    disabled={loading}
                    required
                />
            </div>
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                >
                    {loading ? '处理中...' : '确认修改'}
                </button>
                {!mustChangePassword && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-2 px-4 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
                    >
                        取消
                    </button>
                )}
            </div>
        </form>
    );
}
