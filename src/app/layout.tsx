import type { Metadata, Viewport } from 'next';
import './globals.css';
import SiteHeader from '@/components/site-header';
import RevealObserver from '@/components/reveal-observer';
import ScrollManager from '@/components/scroll-manager';

// 移动端视口：锁定 CSS 像素宽度，禁止双指缩放造成的布局抖动；
// viewportFit=cover 让刘海屏/圆角屏按安全区排版，避免内容被裁切。
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: '「数」香满屋｜香山书房数字文化运营实践',
  description: '认识中山香山书房网络，了解数字文化护照、AI智慧运营、活动策划与调研成果。',
  openGraph: {
    title: '「数」香满屋｜香山书房数字文化运营实践',
    description: '从空间、阅读、活动到数字运营，让每间书房有故事，每次阅读有反馈。',
    images: ['/seq_space/frame_0145.webp'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <a className="skip-link" href="#main">
          跳到正文
        </a>
        <SiteHeader />
        <RevealObserver />
        <ScrollManager />
        {children}
      </body>
    </html>
  );
}
