/**
 * 移动端性能回归：统计真实下载的图片字节数，并检查降级是否生效。
 * 用法：node scripts/check-perf.mjs  （需先起 scripts/serve-out.mjs）
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3200';

const browser = await chromium.launch({ channel: 'msedge' });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

const shot = async (route) => {
  const page = await context.newPage();
  const assets = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (!/\.(webp|jpg|jpeg|png)$/i.test(url)) return;
    let len = Number(res.headers()['content-length'] ?? 0);
    if (!len) {
      // 本地静态服务不一定回 content-length，退回用 Playwright 的资源大小
      try {
        len = (await res.request().sizes()).responseBodySize ?? 0;
      } catch {
        len = 0;
      }
    }
    assets.push({ file: url.split('/').pop(), len });
  });
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // 走一遍整页，触发懒加载图片，统计用户真实会下载的量
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(800);

  const style = await page.evaluate(() => {
    const header = document.querySelector('.site-header');
    const hs = header ? getComputedStyle(header) : null;
    return {
      backdrop: hs ? hs.backdropFilter || hs.webkitBackdropFilter : 'n/a',
      headerBg: hs ? hs.backgroundColor : 'n/a',
      imgCount: document.querySelectorAll('img[srcset]').length,
      docWidth: document.documentElement.scrollWidth,
    };
  });

  const bytes = assets.reduce((s, a) => s + a.len, 0);
  const top = assets
    .filter((a) => a.len > 0)
    .sort((a, b) => b.len - a.len)
    .slice(0, 5)
    .map((a) => `${a.file}=${(a.len / 1024).toFixed(0)}KB`)
    .join(' ');

  console.log(
    `\n${route}\n  图片 ${assets.length} 个 / 合计 ${(bytes / 1024).toFixed(0)}KB` +
      `\n  最大: ${top || '(无)'}` +
      `\n  带 srcset 的 img: ${style.imgCount}  backdrop-filter: ${style.backdrop}  header底色: ${style.headerBg}`,
  );
  await page.close();
  return bytes;
};

const solution = await shot('/solution');
const home = await shot('/');

await browser.close();

const LIMIT = 900 * 1024;
const ok = solution < LIMIT && home < LIMIT;
console.log(
  `\n${ok ? '✅' : '❌'} 移动端单页图片预算 ${(LIMIT / 1024).toFixed(0)}KB —— ` +
    `/solution ${(solution / 1024).toFixed(0)}KB, / ${(home / 1024).toFixed(0)}KB`,
);
process.exit(ok ? 0 : 1);
