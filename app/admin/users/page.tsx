'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ToolAccessGuard from '@/components/platform/auth/ToolAccessGuard'
import { useAuth } from '@/components/platform/auth/AuthProvider'

type PlatformUser = {
  id: string
  displayName: string
  name: string
  role: 'student' | 'teacher' | 'admin' | 'superadmin' | 'guest'
  accountType: 'formal' | 'guest'
  grade: string
  className: string
  mustChangePassword: boolean
  banned: boolean
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({})

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const isSuperadmin = user?.role === 'superadmin'

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/system/users', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || '加载用户失败')
      setUsers(data.users || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '加载用户失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const actOnUser = async (userId: string, action: 'ban' | 'unban' | 'reset-password') => {
    setError('')
    setMessage('')
    try {
      const body: Record<string, string> = { action }
      if (action === 'reset-password') {
        const newPassword = resetPasswords[userId]
        if (!newPassword || newPassword.length < 6) {
          throw new Error('重置密码至少需要 6 位')
        }
        body.newPassword = newPassword
      }
      const response = await fetch(`/api/admin/system/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || '操作失败')
      setMessage('操作已完成')
      setResetPasswords((current) => ({ ...current, [userId]: '' }))
      await loadUsers()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '操作失败')
    }
  }

  const updateRole = async (userId: string, role: 'student' | 'teacher' | 'admin') => {
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/admin/system/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || '角色更新失败')
      setMessage('角色已更新')
      await loadUsers()
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : '角色更新失败')
    }
  }

  return (
    <ToolAccessGuard allowGuest={false} reason="用户管理仅管理员和超级管理员可访问。">
      <main className="min-h-dvh bg-[#f6f7fb] px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Platform Admin</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">用户管理</h1>
              <p className="mt-2 text-sm text-gray-500">封禁、解封、重置密码和角色调整都从这里统一操作。</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/system" className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                系统设置
              </Link>
              <Link href="/" className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                返回首页
              </Link>
            </div>
          </header>

          {!isAdmin ? (
            <div className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow-sm">只有管理员和超级管理员可以进入用户管理。</div>
          ) : (
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              {loading ? (
                <div className="text-sm text-gray-400">正在加载用户列表...</div>
              ) : (
                <div className="space-y-4">
                  {users.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-gray-100 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">{item.displayName}</div>
                          <div className="mt-1 text-sm text-gray-400">
                            {item.role} · {item.grade || '未填写年级'} · {item.className || '未填写班级'}
                          </div>
                          {item.mustChangePassword && (
                            <div className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              首次登录后必须改密码
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 lg:min-w-[360px]">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => actOnUser(item.id, item.banned ? 'unban' : 'ban')}
                              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700"
                            >
                              {item.banned ? '解封' : '封禁'}
                            </button>
                            {isSuperadmin && item.role !== 'superadmin' && (
                              <>
                                <button type="button" onClick={() => updateRole(item.id, 'student')} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700">
                                  设为学生
                                </button>
                                <button type="button" onClick={() => updateRole(item.id, 'teacher')} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700">
                                  设为教师
                                </button>
                                <button type="button" onClick={() => updateRole(item.id, 'admin')} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700">
                                  设为管理员
                                </button>
                              </>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              value={resetPasswords[item.id] || ''}
                              onChange={(event) => setResetPasswords((current) => ({ ...current, [item.id]: event.target.value }))}
                              className="flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm"
                              placeholder="输入新密码后重置"
                            />
                            <button
                              type="button"
                              onClick={() => actOnUser(item.id, 'reset-password')}
                              className="rounded-2xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
                            >
                              重置密码
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {(message || error) && (
            <div className={`rounded-3xl p-4 text-sm shadow-sm ${error ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {error || message}
            </div>
          )}
        </div>
      </main>
    </ToolAccessGuard>
  )
}
