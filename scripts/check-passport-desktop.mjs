/**
 * 护照页桌面端布局验证
 * - 确认 1440 / 1024 下已拆掉手机外壳（无 bezel 圆角、无 780px 定高）
 * - 确认内容铺开到容器宽度、卡片成多列、注脚落到最底部
 * - 确认 390 手机端仍走原来的样式（外壳移除逻辑不越界）
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:3200';
const OUT = 'docs/compare/passport-desktop';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge' });
let fail = 0;
const check = (ok, label, extra = '') => {
  if (!ok) fail += 1;
  console.log(`${ok ? '✅' : '❌'} ${label}${extra ? '  ' + extra : ''}`);
};

const inspect = async (page) =>
  page.evaluate(() => {
    const g = (sel) => document.querySelector(sel);
    const rect = (sel) => {
      const el = g(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left) };
    };
    const cs = (sel, prop) => {
      const el = g(sel);
      return el ? getComputedStyle(el)[prop] : null;
    };
    const cols = (sel) =>
      g(sel) ? getComputedStyle(g(sel)).gridTemplateColumns.split(' ').length : 0;

    return {
      vw: document.documentElement.clientWidth,
      scrollW: document.documentElement.scrollWidth,
      stage: rect('.pp-stage'),
      phone: rect('.pp-phone'),
      screen: rect('.pp-screen'),
      screenHeightCss: cs('.pp-screen', 'height'),
      frameRadius: cs('.pp-frame', 'borderTopLeftRadius'),
      frameBg: cs('.pp-frame', 'backgroundImage'),
      framePad: cs('.pp-frame', 'padding'),
      statusDisplay: cs('.pp-status', 'display'),
      homeBarDisplay: cs('.pp-home-bar', 'display'),
      captionDisplay: cs('.pp-caption', 'display'),
      statCols: cols('.pp-block--data .pp-grid'),
      badgeCols: cols('.pp-block--badges .pp-badges'),
      badge: rect('.pp-badge'),
      aside: rect('.pp-aside'),
      asideFont: cs('.pp-tips li', 'fontSize'),
      asideDisplay: cs('.pp-aside', 'display'),
      hasAside: Boolean(g('.pp-aside')),
      uidText: g('.pp-uid')?.textContent?.trim() ?? null,
    };
  });

const login = async (page) => {
  await page.click('.pp-field input');
  await page.fill('.pp-field input', '13800138000');
  await page.click('.pp-submit');
  await page.waitForTimeout(900);
};

/* ---------- 桌面 1440 ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/experience/passport', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  await page.screenshot({ path: `${OUT}/1440-auth.png`, fullPage: true });
  const auth = await inspect(page);
  console.log('\n[1440 · 未登录]');
  check(auth.scrollW === auth.vw, '无横向溢出', `sw=${auth.scrollW} vw=${auth.vw}`);
  check(auth.frameRadius === '0px', '手机外壳圆角已去除', `radius=${auth.frameRadius}`);
  check(auth.frameBg === 'none', '机身渐变已去除', `bg=${auth.frameBg}`);
  check(auth.statusDisplay === 'none', '手机状态栏已隐藏');
  check(auth.phone.w > 900, '护照容器已铺开', `width=${auth.phone.w}px`);

  await login(page);
  await page.screenshot({ path: `${OUT}/1440-home.png`, fullPage: true });
  const home = await inspect(page);
  console.log('\n[1440 · 已登录]');
  check(home.scrollW === home.vw, '无横向溢出', `sw=${home.scrollW} vw=${home.vw}`);
  check(home.statCols === 3, '阅读数据 3 列', `cols=${home.statCols}`);
  check(home.badgeCols === 10, '徽章墙 10 列', `cols=${home.badgeCols}`);
  check(home.badge && home.badge.w > 88, '徽章格子已放大', `w=${home.badge?.w}px`);
  check(home.asideDisplay === 'block' || home.asideDisplay === 'grid', '注脚保留在页面内');
  check(home.aside && home.aside.left < 200, '注脚已移到底部整行', `left=${home.aside?.left}px w=${home.aside?.w}px`);
  check(parseFloat(home.asideFont) <= 11, '注脚字号已收小', `font=${home.asideFont}`);
  check(/^XS-\d{4}-\d{4}$/.test(home.uidText ?? ''), '护照编号正常显示', `uid=${home.uidText}`);

  // 徽章详情弹窗 / 抽奖弹窗都应在视口内
  await page.click('.pp-read-btn');
  await page.waitForTimeout(1400);
  const rewardBox = await page.locator('.pp-reward-card').boundingBox();
  check(
    rewardBox && rewardBox.y >= 0 && rewardBox.y + rewardBox.height <= 900,
    '抽奖弹窗完整落在视口内',
    rewardBox ? `y=${Math.round(rewardBox.y)} h=${Math.round(rewardBox.height)}` : 'missing',
  );
  await page.screenshot({ path: `${OUT}/1440-reward.png` });
  await page.click('.pp-reward-btn');
  await page.waitForTimeout(400);

  await ctx.close();
}

/* ---------- 中等桌面 1024 ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/experience/passport', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await login(page);
  const m = await inspect(page);
  console.log('\n[1024 · 已登录]');
  check(m.scrollW === m.vw, '无横向溢出', `sw=${m.scrollW} vw=${m.vw}`);
  check(m.statCols === 3, '阅读数据 3 列', `cols=${m.statCols}`);
  check(m.badgeCols === 10, '徽章墙 10 列', `cols=${m.badgeCols}`);
  await page.screenshot({ path: `${OUT}/1024-home.png`, fullPage: true });
  await ctx.close();
}

/* ---------- 768 与手机 390：不应被桌面样式影响 ---------- */
for (const [w, h] of [
  [768, 1024],
  [390, 844],
]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    isMobile: w < 700,
    hasTouch: w < 700,
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/experience/passport', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${w}-auth.png`, fullPage: true });
  await login(page);
  const m = await inspect(page);
  console.log(`\n[${w} · 已登录]`);
  check(m.scrollW === m.vw, '无横向溢出', `sw=${m.scrollW} vw=${m.vw}`);
  check(m.phone.w <= 400, '仍按手机版窄幅渲染', `width=${m.phone.w}px`);
  check(m.captionDisplay !== 'none', '手机端保留原说明行');
  if (w === 390) {
    check(m.statCols === 2, '手机端阅读数据仍 2 列', `cols=${m.statCols}`);
    check(m.badgeCols === 5, '手机端徽章墙仍 5 列', `cols=${m.badgeCols}`);
  }
  await page.screenshot({ path: `${OUT}/${w}-home.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
console.log(`\n${fail === 0 ? '✅ 全部通过' : `❌ 失败 ${fail} 项`}`);
process.exit(fail === 0 ? 0 : 1);
