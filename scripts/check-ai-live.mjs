// AI 运营系统 · 实时生成面板回归：加载态 / 成功 / 采用 / 接口异常
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'docs', 'compare', 'ai-live');
await mkdir(OUT, { recursive: true });

const ORIGIN = 'http://localhost:3200';
const REPORT = `# 城市阅读小讨论

## 一、活动定位
面向青年读者，在格子空间香山书房做一次 15 分钟的共读讨论。

## 二、流程（15 分钟）
导入 2 分钟；共读 6 分钟；小组讨论 5 分钟；收束 2 分钟。

## 三、物料
导读单 8 份、书签 8 枚、签到表 1 张，均为零预算范围内的自有物料。

## 四、风险与确认
场地容量、开放时间与安全通道需由书房现场确认。`;

const errors = [];
const browser = await chromium.launch({ channel: 'msedge' });
const report = {};

async function open() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto(`${ORIGIN}/experience`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ai-live');
  return { context, page };
}

// ---------- 成功链路 ----------
{
  const { context, page } = await open();
  let sent = null;
  await page.route(`${ORIGIN}/api/chat`, async (route) => {
    sent = { method: route.request().method(), body: route.request().postDataJSON() };
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, content: REPORT, model: 'deepseek-chat', usage: { total_tokens: 320 } }),
    });
  });

  await page.screenshot({ path: join(OUT, '01-idle.png') });

  await page.fill('#ai-prompt', '格子空间香山书房，青年读者 8 人，15 分钟，零预算，城市阅读小讨论。');
  await page.click('.ai-live .btn.clay');
  await page.waitForTimeout(500);
  report.loadingVisible = (await page.locator('.ai-live-loading').count()) === 1;
  await page.screenshot({ path: join(OUT, '02-loading.png') });

  await page.waitForSelector('.ai-live-text', { timeout: 8000 });
  report.metaText = (await page.textContent('.ai-live-meta'))?.replace(/\s+/g, ' ').trim();
  report.replyHasTitle = (await page.textContent('.ai-live-text'))?.includes('城市阅读小讨论');
  report.request = sent;
  await page.screenshot({ path: join(OUT, '03-ready.png') });

  // 采用为策划稿 → 右侧编辑器
  await page.click('.ai-live .btn.primary');
  await page.waitForTimeout(500);
  report.adoptedIntoEditor = (await page.inputValue('#planner-content')) === REPORT;
  report.providerLine = (await page.textContent('.planner-meta'))?.slice(0, 60);
  await page.screenshot({ path: join(OUT, '04-adopted.png') });

  // 用表单需求填入
  await page.click('.ai-live-fill');
  report.filledPrompt = (await page.inputValue('#ai-prompt')).slice(0, 40);
  await context.close();
}

// ---------- 接口报错 ----------
{
  const { context, page } = await open();
  await page.route(`${ORIGIN}/api/chat`, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: '服务端未配置 DEEPSEEK_API_KEY' }),
    }),
  );
  await page.fill('#ai-prompt', '试试缺密钥时的提示');
  await page.click('.ai-live .btn.clay');
  await page.waitForSelector('.ai-live-error', { timeout: 5000 });
  report.errorText = (await page.textContent('.ai-live-error p'))?.trim();
  await page.screenshot({ path: join(OUT, '05-error.png') });

  // 改用本地模板
  await page.click('.ai-live-error .btn:nth-child(2)');
  await page.waitForSelector('.ai-live-text', { timeout: 5000 });
  report.localSource = (await page.textContent('.ai-live-meta span'))?.trim();
  await page.screenshot({ path: join(OUT, '06-local-fallback.png') });
  await context.close();
}

// ---------- 未部署接口（next dev 的 404 HTML） ----------
{
  const { context, page } = await open();
  await page.fill('#ai-prompt', '不拦请求，看看真实 404 的提示');
  await page.click('.ai-live .btn.clay');
  await page.waitForSelector('.ai-live-error', { timeout: 8000 });
  report.notDeployed = (await page.textContent('.ai-live-error p'))?.trim();
  await context.close();
}

// ---------- 手机 ----------
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.route(`${ORIGIN}/api/chat`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, content: REPORT }) }),
  );
  await page.goto(`${ORIGIN}/experience`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.ai-live');
  await page.fill('#ai-prompt', '格子空间，青年读者 8 人，15 分钟。');
  await page.click('.ai-live .btn.clay');
  await page.waitForSelector('.ai-live-text', { timeout: 8000 });
  report.mobileOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  await page.evaluate(() => {
    const panel = document.querySelector('.ai-live');
    if (!panel) return;
    window.scrollTo({ top: panel.getBoundingClientRect().top + window.scrollY - 96 });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, '07-mobile.png') });
  await context.close();
}

await browser.close();
report.consoleErrors = errors;
console.log(JSON.stringify(report, null, 2));
