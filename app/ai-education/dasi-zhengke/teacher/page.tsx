import { Suspense } from 'react';
import DasiZhengkeClient from '@/components/ai-education/dasi-zhengke/DasiZhengkeClient';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/ai-education/session';
import { USER_FIELDS } from '@/lib/ai-education/models';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(v: string | string[] | undefined) {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default async function DasiZhengkeTeacherPage({ searchParams }: PageProps) {
  const user = await requireUser();
  if (!user) redirect('/ai-education');

  const role = String((user as any)?.[USER_FIELDS.role] || (user as any)?.role || 'user');
  const isTeacherOrAdmin = ['teacher', 'admin', 'superadmin'].includes(role);
  if (!isTeacherOrAdmin) {
    const resolved = searchParams ? await searchParams : undefined;
    const id = getStringParam(resolved?.id);
    const topic = getStringParam(resolved?.topic);
    const params = new URLSearchParams();
    if (id) params.set('id', id);
    if (topic) params.set('topic', topic);
    const qs = params.toString();
    redirect(qs ? `/ai-education/dasi-zhengke/student?${qs}` : '/ai-education/dasi-zhengke/student');
  }

  return (
    <Suspense>
      <DasiZhengkeClient basePath="/ai-education/dasi-zhengke/teacher" pageAudience="teacher" />
    </Suspense>
  );
}

