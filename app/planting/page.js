import Script from 'next/script';

export default function Page() {
  return (
    <>
      <header id="app-header"></header>
      <main id="app-main" role="main" tabIndex={-1}></main>
      <footer id="app-footer">
        <small>© 2025 植树问题学习平台</small>
      </footer>
      <Script src="/planting/assets/js/app.js" type="module" strategy="afterInteractive" />
    </>
  );
}


