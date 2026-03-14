import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '植树问题学习平台 - 五年级数学',
  description: '面向小学五年级的植树问题学习平台：AI智能学习助手与系统化练习，帮助同学夯实数学思维。',
};

export default function PlantingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="stylesheet" href="/planting/assets/css/main.css" />
      {children}
    </>
  );
}
