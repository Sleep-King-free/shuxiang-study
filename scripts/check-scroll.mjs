import { chromium } from 'playwright';

const BASE = 'http://localhost:3200';
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));

const probe = async (label) => {
  const d = await page.evaluate(async () => {
    const html = document.documentElement;
    const body = document.body;
    const before = window.scrollY;
    window.scrollTo({ top: 900, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 140));
    const moved = window.scrollY;
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 60));
    return {
      path: location.pathname + location.hash,
      bodyInlineOverflow: body.style.overflow || '(无)',
      htmlOverflowY: getComputedStyle(html).overflowY,
      bodyOverflowY: getComputedStyle(body).overflowY,
      scrollHeight: document.scrollingElement.scrollHeight,
      viewport: window.innerHeight,
      canScroll: moved > before,
      movedTo: moved,
      shellActive: !!document.querySelector('.cine-shell.active'),
    };
  });
  console.log(label, JSON.stringify(d));
};

// 1. 普通页面
for (const p of ['/', '/solution', '/experience', '/experience/passport', '/libraries']) {
  await page.goto(BASE + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await probe('普通页');
}

// 2. 序章打开态
await page.goto(BASE + '/#cinematic', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await probe('序章打开');

// 3. 关闭序章后
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
await probe('关闭序章');

// 4. 打开手机菜单后关闭
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.click('.menu-toggle');
await page.waitForTimeout(400);
const menuOpen = await page.evaluate(() => ({
  cls: document.body.className,
  overflowY: getComputedStyle(document.body).overflowY,
}));
await page.click('.menu-toggle');
await page.waitForTimeout(400);
const menuClosed = await page.evaluate(() => ({
  cls: document.body.className || '(空)',
  overflowY: getComputedStyle(document.body).overflowY,
  bodyInline: document.body.style.overflow || '(无)',
}));
console.log('菜单打开', JSON.stringify(menuOpen));
console.log('菜单关闭', JSON.stringify(menuClosed));
await probe('手机首页');

console.log('运行时错误:', errs.join(' | ') || '(无)');
await browser.close();
