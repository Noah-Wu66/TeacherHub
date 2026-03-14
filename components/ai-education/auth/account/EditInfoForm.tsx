"use client";
import { useState } from "react";
import { apiFetch } from '@/lib/ai-education/api';
import { UserInfo } from "./types";

// 学科选项
const SUBJECT_OPTIONS = [
    '语文', '数学', '外语', '科学', '信息科技',
    '体育与健康', '道德与法治', '艺术', '劳动', '综合实践活动'
];

interface EditInfoFormProps {
    user: UserInfo;
    onSuccess: () => void;
    onCancel: () => void;
    setError: (error: string) => void;
    setMessage: (message: string) => void;
}

export default function EditInfoForm({ user, onSuccess, onCancel, setError, setMessage }: EditInfoFormProps) {
    const [loading, setLoading] = useState(false);
    const [editName, setEditName] = useState(user.name || '');
    const [editGender, setEditGender] = useState(user.gender || '');
    const [editGrade, setEditGrade] = useState(user.grade || '');
    const [editClassName, setEditClassName] = useState(user.className || '');
    const [editSubjects, setEditSubjects] = useState<string[]>(user.subjects || []);
    const [subjectsOpen, setSubjectsOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!editName) {
            setError('请输入姓名');
            return;
        }

        if (!editGender) {
            setError('请选择性别');
            return;
        }

        if (!editGrade) {
            setError('请选择年级');
            return;
        }

        if (!editClassName) {
            setError('请选择班级');
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch('/ai-education/api/user/update-info', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ name: editName, gender: editGender, grade: editGrade, className: editClassName, subjects: editSubjects }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || '修改失败');
            }

            setMessage('个人信息修改成功');
            onSuccess();

            // 2秒后刷新页面以更新用户信息
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            setError(err?.message || '修改失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3">
            <div>
                <label className="block text-xs text-muted-foreground mb-1">姓名</label>
                <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
                    placeholder="请输入姓名"
                    disabled={loading}
                    required
                />
            </div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">性别</label>
                <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
                    disabled={loading}
                    required
                >
                    <option value="">请选择性别</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                </select>
            </div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">年级</label>
                <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
                    disabled={loading}
                    required
                >
                    <option value="">请选择年级</option>
                    <option value="一年级">一年级</option>
                    <option value="二年级">二年级</option>
                    <option value="三年级">三年级</option>
                    <option value="四年级">四年级</option>
                    <option value="五年级">五年级</option>
                    <option value="六年级">六年级</option>
                    <option value="七年级">七年级</option>
                    <option value="八年级">八年级</option>
                    <option value="九年级">九年级</option>
                    <option value="高一">高一</option>
                    <option value="高二">高二</option>
                    <option value="高三">高三</option>
                </select>
            </div>
            <div>
                <label className="block text-xs text-muted-foreground mb-1">班级</label>
                <select
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
                    disabled={loading}
                    required
                >
                    <option value="">请选择班级</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={`${num}班`}>{num}班</option>
                    ))}
                </select>
            </div>
            {/* 学科选择 */}
            <div>
                <label className="block text-xs text-muted-foreground mb-1">任教学科</label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setSubjectsOpen(!subjectsOpen)}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground text-sm text-left flex items-center justify-between"
                        disabled={loading}
                    >
                        <span className={editSubjects.length === 0 ? 'text-muted-foreground' : ''}>
                            {editSubjects.length === 0 ? '请选择任教学科' : `已选择 ${editSubjects.length} 门学科`}
                        </span>
                        <svg className={`w-4 h-4 transition-transform ${subjectsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {subjectsOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {SUBJECT_OPTIONS.map((subject) => (
                                <label key={subject} className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editSubjects.includes(subject)}
                                        onChange={() => {
                                            if (editSubjects.includes(subject)) {
                                                setEditSubjects(editSubjects.filter(s => s !== subject));
                                            } else {
                                                setEditSubjects([...editSubjects, subject]);
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                                    />
                                    <span className="text-sm">{subject}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                {editSubjects.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                        已选择：{editSubjects.join('、')}
                    </p>
                )}
            </div>
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                >
                    {loading ? '处理中...' : '确认修改'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-2 px-4 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
                >
                    取消
                </button>
            </div>
        </form>
    );
}
