'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type NavChild = { href: string; label: string; desc: string };

type NavItem = {
  href: string;
  label: string;
  children?: NavChild[];
};

const NAV: NavItem[] = [
  { href: '/', label: '首页' },
  { href: '/libraries', label: '认识香山书房' },
  { href: '/solution', label: '数字运营方案' },
  {
    href: '/experience',
    label: '在线体验',
    children: [
      { href: '/experience', label: 'AI 运营系统', desc: '策划 · 宣传 · 读者 · 复盘' },
      { href: '/experience/passport', label: '数字文化护照', desc: '集章 · 阅读卡 · 本机记录' },
    ],
  },
  { href: '/evidence', label: '证据与成果' },
];

const isUnder = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

// 只有支持悬停的指针才用 hover 展开，触屏上交给点击，避免 mouseenter 与 click 互相抵消。
const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // 滚动回调用 rAF 节流：触屏下 scroll 事件一秒能来上百次，
    // 每次都读 scrollY + 判断状态会造成额外的主线程抖动。
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 12);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setOpenGroup(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 点击导航以外区域时收起下拉；移动端抽屉不在此范围。
  useEffect(() => {
    if (!openGroup) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openGroup]);

  useEffect(() => {
    document.body.classList.toggle('scrolled', scrolled);
  }, [scrolled]);

  const closeAll = () => {
    setMenuOpen(false);
    setOpenGroup(null);
  };

  return (
    <header className="site-header" ref={headerRef}>
      <div className="wrap nav-shell">
        <Link className="brand" href="/" onClick={closeAll}>
          <span className="brand-mark">数</span>
          <span>
            「数」香满屋
            <small>香山书房数字文化运营</small>
          </span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label="打开菜单"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? '×' : '☰'}
        </button>
        <nav className="global-nav" aria-label="主导航">
          {NAV.map((item) =>
            item.children ? (
              <div
                className={`nav-group${isUnder(pathname, item.href) ? ' is-current' : ''}`}
                key={item.href}
                data-open={openGroup === item.href}
                onMouseLeave={() => {
                  if (canHover()) setOpenGroup(null);
                }}
              >
                <button
                  className="nav-trigger"
                  type="button"
                  aria-expanded={openGroup === item.href}
                  aria-controls="nav-online-experience"
                  onMouseEnter={() => {
                    if (canHover()) setOpenGroup(item.href);
                  }}
                  onClick={() => setOpenGroup((current) => (current === item.href ? null : item.href))}
                >
                  {item.label}
                  <i className="nav-chev" aria-hidden="true" />
                </button>
                <div className="nav-menu" id="nav-online-experience">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      aria-current={pathname === child.href ? 'page' : undefined}
                      onClick={closeAll}
                    >
                      <b>{child.label}</b>
                      <small>{child.desc}</small>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isUnder(pathname, item.href) ? 'page' : undefined}
                onClick={closeAll}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        {pathname === '/' ? (
          <button
            className="nav-cine"
            type="button"
            onClick={() => window.dispatchEvent(new Event('cine:open'))}
          >
            观看电影序章
          </button>
        ) : (
          <Link className="nav-cine" href="/#cinematic">
            观看电影序章
          </Link>
        )}
      </div>
    </header>
  );
}
