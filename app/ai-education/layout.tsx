import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '智趣学 - AI学习平台',
  description: '智趣学是一个现代化AI学习平台，让学习更智能、更有趣',
  keywords: ['AI', '学习', '教育', '人工智能', '智趣学'],
  authors: [{ name: '北京市朝阳区白家庄小学 李雪' }],
  manifest: '/ai-education/manifest.webmanifest',
  icons: {
    icon: [{ url: '/ai-education/study.png', type: 'image/png', sizes: '200x200' }],
    apple: [{ url: '/ai-education/study.png', type: 'image/png', sizes: '200x200' }],
  },
}

export const viewport: Viewport = {
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function AIEducationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} ai-education-app`}>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
        integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+"
        crossOrigin="anonymous"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              try {
                var savedTheme = null;
                try { savedTheme = localStorage.getItem('theme'); } catch(e) {}
                
                var isDark = false;
                if (savedTheme === 'dark') {
                  isDark = true;
                } else if (savedTheme === 'light') {
                  isDark = false;
                } else {
                  isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                }
                
                if (isDark) { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); }
              } catch(e) {}

              var ALLOWED_KEYS = ['session_token', 'theme'];

              function guardStorage(obj, name){
                if (!obj) return;
                var methods = ['setItem'];
                methods.forEach(function(m){
                  if (typeof obj[m] === 'function') {
                    var orig = obj[m].bind(obj);
                    obj[m] = function(key, value){
                      if (ALLOWED_KEYS.indexOf(key) !== -1) {
                        return orig(key, value);
                      }
                      return;
                    };
                  }
                });
              }

              try { guardStorage(window.localStorage, 'localStorage'); } catch(e){}
              try { guardStorage(window.sessionStorage, 'sessionStorage'); } catch(e){}

              try {
                var origDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') || Object.getOwnPropertyDescriptor(document.__proto__, 'cookie');
                if (origDesc && origDesc.set) {
                  Object.defineProperty(document, 'cookie', {
                    get: origDesc.get,
                    set: function(v){
                      var key = v.split('=')[0].trim();
                      if (ALLOWED_KEYS.indexOf(key) !== -1) {
                        origDesc.set.call(document, v);
                        return;
                      }
                    },
                    configurable: true
                  });
                }
              } catch(e){}
            })();
          `,
        }}
      />
      <div className="min-h-[100dvh] h-[100dvh] sm:h-[100vh] overflow-hidden touch-manipulation">
        {children}
      </div>
    </div>
  )
}
