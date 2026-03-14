'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ToolAccessGuard from '@/components/platform/auth/ToolAccessGuard'
import { useAuth } from '@/components/platform/auth/AuthProvider'

type Invitation = {
  id: string
  code: string
  targetRole: 'student' | 'teacher'
  status: 'active' | 'used' | 'revoked'
  createdAt: string
  usedAt?: string | null
}

export default function AdminSystemPage() {
  const { user } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [inviteRole, setInviteRole] = useState<'student' | 'teacher'>('student')
  const [createRole, setCreateRole] = useState<'student' | 'teacher' | 'admin'>('student')
  const [form, setForm] = useState({
    name: '',
    password: '',
    gender: '',
    grade: '',
    className: '',
    managedClasses: [] as string[],
    subjects: [] as string[],
  })

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const isSuperadmin = user?.role === 'superadmin'

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/system/invitations', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || '加载邀请码失败')
      setInvitations(data.invitations || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '加载邀请码失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadInvitations()
    }
  }, [isAdmin])

  const createInvitation = async () => {
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/system/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: inviteRole }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || '创建邀请码失败')
      setMessage(`已创建邀请码：${data.invitation.code}`)
      await loadInvitations()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '创建邀请码失败')
    }
  }

  const revokeInvitation = async (invitationId: string) => {
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/system/invitations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action: 'revoke' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || '作废邀请码失败')
      setMessage('邀请码已作废')
      await loadInvitations()
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : '作废邀请码失败')
    }
  }

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/system/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: createRole,
          ...form,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || '创建用户失败')
      setMessage(`已创建用户 ${data.user.displayName}，初始密码：${data.initialPassword}`)
      setForm({
        name: '',
        password: '',
        gender: '',
        grade: '',
        className: '',
        managedClasses: [],
        subjects: [],
      })
      setCreateRole('student')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '创建用户失败')
    }
  }

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <ToolAccessGuard allowGuest={false} reason="系统设置仅管理员和超级管理员可访问。">
      <main className="min-h-dvh bg-[#f6f7fb] px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Platform Admin</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">系统设置</h1>
              <p className="mt-2 text-sm text-gray-500">邀请码、后台建号和平台账号都在这里统一管理。</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/users" className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                用户管理
              </Link>
              <Link href="/" className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                返回首页
              </Link>
            </div>
          </header>

          {!isAdmin ? (
            <div className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow-sm">只有管理员和超级管理员可以进入系统设置。</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">邀请码管理</h2>
                <p className="mt-1 text-sm text-gray-500">正式用户自助注册必须填写邀请码。</p>
                <div className="mt-4 flex gap-3">
                  <select
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value as 'student' | 'teacher')}
                    className="rounded-2xl border border-gray-200 px-4 py-3"
                  >
                    <option value="student">学生邀请码</option>
                    <option value="teacher">教师邀请码</option>
                  </select>
                  <button
                    type="button"
                    onClick={createInvitation}
                    className="rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    生成邀请码
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {loading ? (
                    <div className="text-sm text-gray-400">正在加载邀请码...</div>
                  ) : invitations.length === 0 ? (
                    <div className="text-sm text-gray-400">还没有邀请码记录。</div>
                  ) : (
                    invitations.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3">
                        <div>
                          <div className="font-mono text-base font-semibold text-gray-900">{item.code}</div>
                          <div className="mt-1 text-xs text-gray-400">
                            {item.targetRole === 'teacher' ? '教师' : '学生'} · {item.status}
                          </div>
                        </div>
                        {item.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => revokeInvitation(item.id)}
                            className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600"
                          >
                            作废
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">后台创建用户</h2>
                <p className="mt-1 text-sm text-gray-500">管理员可直接建学生和教师，超级管理员还可以建管理员。</p>

                <form onSubmit={createUser} className="mt-4 space-y-4">
                  <select
                    value={createRole}
                    onChange={(event) => setCreateRole(event.target.value as 'student' | 'teacher' | 'admin')}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3"
                  >
                    <option value="student">学生</option>
                    <option value="teacher">教师</option>
                    {isSuperadmin && <option value="admin">管理员</option>}
                  </select>

                  <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="w-full rounded-2xl border border-gray-200 px-4 py-3" placeholder="姓名" />
                  <input value={form.password} onChange={(event) => updateField('password', event.target.value)} className="w-full rounded-2xl border border-gray-200 px-4 py-3" placeholder="初始密码（至少6位）" />

                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.gender} onChange={(event) => updateField('gender', event.target.value)} className="rounded-2xl border border-gray-200 px-4 py-3">
                      <option value="">选择性别</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                    <select value={form.grade} onChange={(event) => updateField('grade', event.target.value)} className="rounded-2xl border border-gray-200 px-4 py-3">
                      <option value="">选择年级</option>
                      <option value="一年级">一年级</option>
                      <option value="二年级">二年级</option>
                      <option value="三年级">三年级</option>
                      <option value="四年级">四年级</option>
                      <option value="五年级">五年级</option>
                      <option value="六年级">六年级</option>
                    </select>
                  </div>

                  {createRole === 'student' && (
                    <select value={form.className} onChange={(event) => updateField('className', event.target.value)} className="w-full rounded-2xl border border-gray-200 px-4 py-3">
                      <option value="">选择班级</option>
                      {Array.from({ length: 20 }, (_, index) => `${index + 1}班`).map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  )}

                  {(createRole === 'teacher' || createRole === 'admin') && (
                    <input
                      value={form.managedClasses.join('、')}
                      onChange={(event) => setForm((current) => ({ ...current, managedClasses: event.target.value.split(/[、,\s]+/).filter(Boolean) }))}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3"
                      placeholder={createRole === 'teacher' ? '管理班级，多个用顿号或逗号隔开' : '管理员可留空'}
                    />
                  )}

                  {createRole === 'teacher' && (
                    <input
                      value={form.subjects.join('、')}
                      onChange={(event) => setForm((current) => ({ ...current, subjects: event.target.value.split(/[、,\s]+/).filter(Boolean) }))}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3"
                      placeholder="任教学科，多个用顿号或逗号隔开"
                    />
                  )}

                  <button type="submit" className="w-full rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white">
                    立即创建
                  </button>
                </form>
              </section>
            </div>
          )}

          {(message || error) && (
            <div className={`rounded-3xl p-4 text-sm shadow-sm ${error ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {error || message}
            </div>
          )}

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">游客清理说明</h2>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              游客账号使用数据库落库，系统会通过 Vercel Cron 在北京时间 0:00 统一清理游客账号、游客会话和游客产生的服务端数据。
            </p>
          </section>
        </div>
      </main>
    </ToolAccessGuard>
  )
}
