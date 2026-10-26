/**
 * 滚动性能回归：
 * 1) 检查 window 上是否还挂着会拖慢滚动的非 passive 监听（touchmove / wheel）；
 * 2) 统计滚一屏产生的长任务数量。
 *
 * 非 passive 的 touchmove 会让浏览器放弃「滚动走合成线程」，是手机端发粘的典型原因，
 * 所以正常浏览时 window 上必须一个都没有。
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3200';

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

const listenersOf = async (target) => {
  const client = await target.context().newCDPSession(target);
  const { result } = await client.send('Runtime.evaluate', { expression: 'window' });
  const { listeners: list } = await client.send('DOMDebugger.getEventListeners', {
    objectId: result.objectId,
  });
  await client.detach();
  return list
    .filter((l) => ['touchmove', 'wheel', 'touchstart', 'touchend'].includes(l.type))
    .map((l) => `${l.type}(passive=${Boolean(l.passive)})`);
};

await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const idle = await listenersOf(page);

// 用新页面直接带 hash 进入，组件挂载时才会走到 open()（同页只改 hash 不会重新挂载）
const cinePage = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
});
await cinePage.goto(BASE + '/#cinematic', { waitUntil: 'networkidle' });
await cinePage.waitForTimeout(1500);
const opened = await listenersOf(cinePage);

// 关闭序章后再看一次，确认监听被摘干净
await cinePage.keyboard.press('Escape');
await cinePage.waitForTimeout(500);
const afterClose = await listenersOf(cinePage);
await cinePage.close();

await page.goto(BASE + '/solution', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const longTasks = await page.evaluate(async () => {
  const marks = [];
  const obs = new PerformanceObserver((list) => {
    for (const e of list.getEntries()) marks.push(Math.round(e.duration));
  });
  obs.observe({ entryTypes: ['longtask'] });
  await new Promise((resolve) => {
    let y = 0;
    const timer = setInterval(() => {
      y += 300;
      window.scrollTo({ top: y, behavior: 'instant' });
      if (y > 3000) {
        clearInterval(timer);
        resolve();
      }
    }, 60);
  });
  obs.disconnect();
  return marks;
});

await browser.close();

const bad = idle.filter((l) => l.includes('passive=false'));
console.log('正常浏览时 window 监听:', idle.length ? idle.join(' ') : '(仅 passive 或无)');
console.log('序章打开时 window 监听:', opened.join(' ') || '(无)');
console.log('关闭序章后 window 监听:', afterClose.join(' ') || '(无)');
console.log('滚动 3000px 的长任务(>50ms):', longTasks.length ? `${longTasks.length} 个 ${longTasks.join(',')}ms` : '0 个');

const ok = bad.length === 0 && longTasks.filter((d) => d > 80).length === 0;
console.log(`\n${ok ? '✅' : '❌'} 无阻塞滚动的非 passive 监听，且滚动期间无 >80ms 长任务`);
process.exit(ok ? 0 : 1);
