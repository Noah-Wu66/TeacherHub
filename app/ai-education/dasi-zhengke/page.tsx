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

export default async function DasiZhengkeEntryPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const id = getStringParam(resolvedSearchParams?.id);
  const topic = getStringParam(resolvedSearchParams?.topic);
  const isNew = getStringParam(resolvedSearchParams?.new);

  const user = await requireUser();
  if (!user) redirect('/ai-education');

  const role = String((user as any)?.[USER_FIELDS.role] || (user as any)?.role || 'user');
  const isTeacherOrAdmin = ['teacher', 'admin', 'superadmin'].includes(role);
  const basePath = isTeacherOrAdmin ? '/ai-education/dasi-zhengke/teacher' : '/ai-education/dasi-zhengke/student';

  const params = new URLSearchParams();
  if (id) params.set('id', id);
  if (topic) params.set('topic', topic);
  if (isNew) params.set('new', isNew);
  const qs = params.toString();

  redirect(qs ? `${basePath}?${qs}` : basePath);
}
