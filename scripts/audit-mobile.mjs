import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3200';
const ROUTES = ['/', '/libraries', '/solution', '/experience', '/experience/passport', '/evidence'];
const VIEWPORTS = [
  { w: 320, h: 640, label: '320' },
  { w: 360, h: 800, label: '360' },
  { w: 390, h: 844, label: '390' },
  { w: 412, h: 915, label: '412' },
  { w: 430, h: 932, label: '430' },
  { w: 768, h: 1024, label: '768-竖屏' },
  { w: 844, h: 390, label: '844-横屏' },
];

const browser = await chromium.launch({ channel: 'msedge' });
const rows = [];

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, isMobile: vp.w < 700, hasTouch: true });
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const d = await page.evaluate(() => {
      const vw = window.innerWidth;
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed' || Number(s.opacity) === 0) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.right > vw + 1.5 || r.left < -1.5) {
          let p = el.parentElement, scrollable = false;
          while (p) { const ps = getComputedStyle(p); if (ps.overflowX === 'auto' || ps.overflowX === 'scroll') { scrollable = true; break; } p = p.parentElement; }
          if (!scrollable) out.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 40), l: Math.round(r.left), r: Math.round(r.right) });
        }
      }
      // 文本重叠探测：同一父级下的兄弟元素矩形相交且面积占比大
      const overlaps = [];
      const groups = new Map();
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'absolute' || s.position === 'fixed' || Number(s.opacity) === 0) continue;
        if (!el.textContent || el.children.length > 2) continue;
        const p = el.parentElement;
        if (!p) continue;
        if (!groups.has(p)) groups.set(p, []);
        groups.get(p).push(el);
      }
      for (const [, els] of groups) {
        for (let i = 0; i < els.length; i++) {
          for (let j = i + 1; j < els.length; j++) {
            const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
            const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (ox > 4 && oy > 4) {
              const area = ox * oy;
              if (area > 300) overlaps.push(`${(els[i].className || els[i].tagName).toString().slice(0, 26)} × ${(els[j].className || els[j].tagName).toString().slice(0, 26)} (${Math.round(ox)}x${Math.round(oy)})`);
            }
          }
        }
      }
      return { vw, sw: document.documentElement.scrollWidth, out: out.slice(0, 6), overlaps: [...new Set(overlaps)].slice(0, 5) };
    });
    const bad = d.sw > d.vw + 1 || d.out.length > 0;
    rows.push({ vp: vp.label, route, ...d, bad });
  }
  await page.close();
}
await browser.close();

for (const r of rows) {
  const flag = r.bad ? '❌' : '✅';
  let line = `${flag} ${r.vp.padEnd(9)} ${r.route.padEnd(22)} sw=${r.sw}/${r.vw}`;
  if (r.out.length) line += ` 越界:${r.out.map((o) => `${o.tag}.${o.cls}[${o.l},${o.r}]`).join(' ')}`;
  if (r.overlaps.length) line += ` 重叠:${r.overlaps.join(' | ')}`;
  console.log(line);
}
