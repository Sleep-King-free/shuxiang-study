import { chromium } from 'playwright';

const BASE = 'http://localhost:3200';
const b = await chromium.launch({ channel: 'msedge' });

const run = async (label, viewport) => {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2, isMobile: viewport.width < 700, hasTouch: viewport.width < 700 });
  const p = await ctx.newPage();
  const results = [];

  const pos = async () => Math.round(await p.evaluate(() => window.scrollY));

  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  results.push(['首次打开 /', await pos()]);

  const routes = [
    ['/libraries', '认识香山书房'],
    ['/solution', '数字运营方案'],
    ['/experience', '在线体验'],
    ['/experience/passport', '数字文化护照'],
    ['/evidence', '证据与成果'],
    ['/', '首页'],
  ];
  for (const [href, name] of routes) {
    await p.evaluate((h) => document.querySelector(`a[href="${h}"]`)?.click(), href);
    await p.waitForTimeout(900);
    const path = await p.evaluate(() => location.pathname);
    results.push([`点击「${name}」→ ${path}`, await pos()]);
  }

  // 后退两次
  await p.goBack();
  await p.waitForTimeout(900);
  results.push(['浏览器后退', await pos()]);
  await p.goBack();
  await p.waitForTimeout(900);
  results.push(['再后退一次', await pos()]);

  // 前进
  await p.goForward();
  await p.waitForTimeout(900);
  results.push(['浏览器前进', await pos()]);

  // 页内锚点（子导航）
  await p.goto(BASE + '/libraries', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('a[href="#profiles"]')?.click());
  await p.waitForTimeout(1400);
  const anchorY = await pos();
  const anchorTop = await p.evaluate(() => {
    const el = document.getElementById('profiles');
    return el ? Math.round(el.getBoundingClientRect().top) : null;
  });
  results.push([`点锚点 #profiles（元素距顶应为 118 左右）`, `${anchorY} / top=${anchorTop}`]);

  // 滚动后刷新（浏览器可能恢复位置，属预期，仅记录）
  await p.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }));
  await p.waitForTimeout(200);
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  results.push(['滚到 2000 后刷新（浏览器恢复行为，仅记录）', await pos()]);

  await ctx.close();
  console.log(`\n=== ${label} ===`);
  for (const [name, y] of results) console.log(`  ${String(name).padEnd(46)} ${y}`);
  return results;
};

const mobile = await run('手机 390×844', { width: 390, height: 844 });
const desktop = await run('桌面 1440×900', { width: 1440, height: 900 });

await b.close();

// 除「刷新恢复」外，所有导航都应落在顶部（锚点项单独判断）
const failures = [...mobile, ...desktop].filter(([name, y]) => {
  if (String(name).includes('刷新')) return false;
  if (String(name).includes('锚点')) return !(typeof y === 'string' && Math.abs(Number(y.split('/')[1].split('=')[1]) - 118) < 24);
  return Number(y) !== 0;
});
console.log(`\n${failures.length === 0 ? '✅' : '❌'} 导航后回到顶部：${failures.length === 0 ? '全部通过' : JSON.stringify(failures)}`);
process.exit(failures.length === 0 ? 0 : 1);
