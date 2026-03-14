"use client";
import { useEffect, useState } from "react";
import { apiFetch } from '@/lib/ai-education/api';
import TeacherClassSelector from "./components/TeacherClassSelector";
import SubjectSelector from "./components/SubjectSelector";

interface LoginModalProps {
  visible: boolean;
  onClose?: () => void;
  onSuccess?: (user: any) => void;
}

type RoleType = 'user' | 'teacher';

const ROLE_OPTIONS: { value: RoleType; label: string; needSecret: boolean }[] = [
  { value: 'user', label: '学生', needSecret: false },
  { value: 'teacher', label: '教师', needSecret: true },
];

// 学科选项
const SUBJECT_OPTIONS = [
  '语文', '数学', '外语', '科学', '信息科技',
  '体育与健康', '道德与法治', '艺术', '劳动', '综合实践活动'
];

export default function LoginModal({ visible, onClose, onSuccess }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [grade, setGrade] = useState('');
  const [className, setClassName] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>('user');
  const [secretKey, setSecretKey] = useState('');
  const [agreed, setAgreed] = useState(false);

  const resetSensitiveFields = () => {
    setPassword('');
    setConfirmPassword('');
    setSecretKey('');
  };

  useEffect(() => {
    if (!visible) {
      resetSensitiveFields();
    }
  }, [visible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const trimmedName = name.trim();
    if (!trimmedName || !password) {
      setError('请输入姓名和密码');
      return;
    }

    // 注册时验证性别和年级
    if (activeTab === 'register') {
      if (!gender) {
        setError('请选择性别');
        return;
      }
      if (!grade.trim()) {
        setError('请选择年级');
        return;
      }
      // 学生注册时需要选择班级
      if (selectedRole === 'user' && !className.trim()) {
        setError('请选择班级');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    // 如果注册时选择了需要密钥的身份，校验密钥
    const currentRoleOption = ROLE_OPTIONS.find(r => r.value === selectedRole);
    if (activeTab === 'register' && currentRoleOption?.needSecret && !secretKey.trim()) {
      setError('请输入密钥');
      return;
    }

    if (activeTab === 'register' && !agreed) {
      setError('请阅读并同意相关协议');
      return;
    }

    setLoading(true);
    try {
      const requestBody = activeTab === 'login'
        ? { name: trimmedName, password }
        : {
          name: trimmedName,
          password,
          gender: gender,
          grade: grade.trim(),
          className: className.trim(),
          role: selectedRole,
          secretKey: secretKey.trim(),
          managedClasses: selectedRole === 'teacher' ? selectedClasses : undefined,
          subjects: selectedRole === 'teacher' ? selectedSubjects : undefined
        };

      const res = await apiFetch(activeTab === 'login' ? "/ai-education/api/auth/login" : "/ai-education/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "请求失败");
      }

      if (activeTab === 'register') {
        // 注册成功后自动登录
        const loginRes = await apiFetch("/ai-education/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: trimmedName, password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          // 登录失败，回退到手动登录
          setActiveTab('login');
          setMessage("注册成功，请登录");
          resetSensitiveFields();
          setGender("");
          setGrade("");
          setSelectedRole('user');
          return;
        }
        // 自动登录成功
        if (onSuccess) {
          onSuccess(loginData?.user || { name: trimmedName });
        }
        resetSensitiveFields();
        if (onClose) {
          onClose();
        }
        return;
      }

      if (onSuccess) {
        onSuccess(data?.user || { name: trimmedName });
      }
      resetSensitiveFields();
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl max-w-md w-full p-4 sm:p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {activeTab === 'login' ? '登录' : '注册'}
          </h2>
          {onClose && (
            <button
              onClick={() => {
                resetSensitiveFields();
                onClose();
              }}
              className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 标签切换 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setActiveTab('login');
              setError('');
              setMessage('');
              resetSensitiveFields();
              setConfirmPassword('');
              setName('');
              setGrade('');
              setClassName('');
              setSelectedClasses([]);
              setSelectedRole('user');
              setSecretKey('');
              setAgreed(false);
            }}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${activeTab === 'login'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            登录
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setError('');
              setMessage('');
              resetSensitiveFields();
              setConfirmPassword('');
              setName('');
              setGrade('');
              setClassName('');
              setSelectedClasses([]);
              setSelectedRole('user');
              setSecretKey('');
              setAgreed(false);
            }}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${activeTab === 'register'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              姓名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              placeholder="请输入姓名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              placeholder={activeTab === 'register' ? '至少6位' : '请输入密码'}
              required
              minLength={activeTab === 'register' ? 6 : undefined}
            />
          </div>

          {/* 确认密码 - 仅注册时显示 */}
          {activeTab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                placeholder="请再次输入密码"
                required
                minLength={6}
              />
            </div>
          )}

          {/* 性别 - 仅注册时显示 */}
          {activeTab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                性别
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                required
              >
                <option value="">请选择性别</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
          )}

          {/* 年级 - 仅注册时显示 */}
          {activeTab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                年级
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                required
              >
                <option value="">请选择年级</option>
                <option value="一年级">一年级</option>
                <option value="二年级">二年级</option>
                <option value="三年级">三年级</option>
                <option value="四年级">四年级</option>
                <option value="五年级">五年级</option>
                <option value="六年级">六年级</option>
              </select>
            </div>
          )}

          {/* 班级选择 - 学生单选，教师多选（下拉复选框） */}
          {activeTab === 'register' && (selectedRole === 'user' || selectedRole === 'teacher') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                班级
              </label>
              {selectedRole === 'user' ? (
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  required
                >
                  <option value="">请选择班级</option>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={`${num}班`}>{num}班</option>
                  ))}
                </select>
              ) : (
                <TeacherClassSelector
                  selectedClasses={selectedClasses}
                  onClassesChange={setSelectedClasses}
                />
              )}
            </div>
          )}

          {/* 学科选择 - 仅教师注册时显示 */}
          {activeTab === 'register' && selectedRole === 'teacher' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                任教学科
              </label>
              <SubjectSelector
                options={SUBJECT_OPTIONS}
                selectedSubjects={selectedSubjects}
                onSubjectsChange={setSelectedSubjects}
              />
            </div>
          )}

          {/* 身份选择 - 仅注册时显示 */}
          {activeTab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                身份
              </label>
              <div className="flex gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.value);
                      if (!role.needSecret) setSecretKey('');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${selectedRole === role.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 密钥输入 - 教师和管理员注册时显示 */}
          {activeTab === 'register' && ROLE_OPTIONS.find(r => r.value === selectedRole)?.needSecret && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                密钥
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                placeholder={selectedRole === 'teacher' ? '请输入教师密钥' : '请输入管理员密钥'}
                required
              />
            </div>
          )}

          {activeTab === 'register' && (
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="agreement"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="agreement" className="text-sm text-muted-foreground leading-tight">
                我已阅读并同意
                <a href="/ai-education/legal/user-agreement" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mx-1">《用户协议》</a>
                <a href="/ai-education/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mx-1">《隐私保护协议》</a>
                及
                <a href="/ai-education/legal/data-transfer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">《个人数据跨境传输协议》</a>
              </label>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : (activeTab === 'login' ? '登录' : '注册')}
          </button>
        </form>
      </div >
    </div >
  );
}
