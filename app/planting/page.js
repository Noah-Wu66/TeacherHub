import Script from 'next/script';
import ToolAccessGuard from '@/components/platform/auth/ToolAccessGuard';

export default function Page() {
  return (
    <ToolAccessGuard allowGuest reason="请先登录正式账号或游客账号后再使用植树问题平台。">
      <>
        <header id="app-header"></header>
        <main id="app-main" role="main" tabIndex={-1}></main>
        <footer id="app-footer">
          <small>© 2025 植树问题学习平台</small>
        </footer>
        <Script src="/planting/assets/js/app.js" type="module" strategy="afterInteractive" />
      </>
    </ToolAccessGuard>
  );
}

