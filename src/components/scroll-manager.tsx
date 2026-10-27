'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 路由切换时的滚动管理。
 *
 * 背景：Next 16 的 ScrollHandler 在路由提交后，会先把 documentElement.scrollTop 置 0，
 * 再判断「页面根节点的子元素」是否落在 [scroll-padding-top, 视口高] 区间内，
 * 不在就调 scrollIntoView()。我们的页面根节点是 <nav/> + <main/> + <footer/> 的
 * Fragment，于是三个子元素会被依次 scrollIntoView，而且顺序是逆序——<footer> 最先。
 * 一旦 html 上还有 scroll-behavior: smooth，这几次调用就变成动画，
 * 最终停在页尾（手机上表现为「一切换板块就掉到底部」）。
 *
 * 两道处理：
 * 1. globals.css 里把 html 的 scroll-behavior 改回 auto，让这几次调用瞬时完成，
 *    不再出现飞到页尾的动画；
 * 2. 这里在提交后强制回到顶部，兜住任何版本差异或结构变化。
 *
 * 同时接管页内锚点（子导航 #overview 等），改用平滑滚动，
 * 因为第 1 步把全局平滑关掉了，锚点需要单独保留手感。
 */
export default function ScrollManager() {
  const pathname = usePathname();
  const mounted = useRef(false);

  useLayoutEffect(() => {
    // 首次挂载不动：此时页面本来就在顶部，而刷新时浏览器可能正在恢复上次的阅读位置
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // 带锚点的跳转交给浏览器/下面的锚点处理，不要抢回顶部
    if (window.location.hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (!anchor) return;
      // 「跳到正文」这类无障碍跳转保持浏览器原生行为（含焦点移动）
      if (anchor.classList.contains('skip-link')) return;

      const id = decodeURIComponent((anchor.getAttribute('href') ?? '').slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target) return;

      event.preventDefault();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // scroll-padding-top 已经给固定导航留出了位置，这里不用再手算偏移
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
