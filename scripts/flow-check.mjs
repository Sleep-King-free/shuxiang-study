// End-to-end pass over the workspace interactions, with console error capture.
import { chromium } from 'playwright';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const OUT = join(process.cwd(), 'docs', 'compare', 'flow');
await mkdir(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ channel: 'msedge' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.addInitScript(() => sessionStorage.setItem('shuxiangIntroSeen', '1'));
await page.goto('http://localhost:3100/experience#ai-lab', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// 1. planner example + generate
await page.getByRole('button', { name: '载入示例需求' }).click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: /生成策划草稿/ }).click();
await page.waitForTimeout(800);
const draft = await page.locator('#planner-content').inputValue();
console.log('draft chars:', draft.length, '| state:', await page.locator('.planner-result-header span').textContent());
await page.screenshot({ path: join(OUT, '1-plan-draft.png') });

// 2. review + publicity
await page.locator('.planner-review input').check();
await page.waitForTimeout(200);
await page.locator('.workspace-sidebar nav a', { hasText: '02 · 宣传制作' }).click();
await page.waitForTimeout(400);
await page.fill('#event-date', '11月15日 14:00 · 格子空间香山书房');
await page.fill('#event-highlights', '共读岐江记忆，留下一句自己的发现。');
await page.getByRole('button', { name: '制作宣传包' }).click();
await page.waitForTimeout(700);
console.log('publicity len:', (await page.locator('#publicity-content').inputValue()).length);
const poster = await page.evaluate(() => {
  const c = document.querySelector('#activity-poster');
  const ctx = c.getContext('2d');
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  let nonBlank = 0;
  for (let i = 0; i < data.length; i += 4000) if (data[i] !== data[0] || data[i + 1] !== data[1]) nonBlank++;
  return { w: c.width, h: c.height, nonBlank };
});
console.log('poster:', JSON.stringify(poster));
await page.screenshot({ path: join(OUT, '2-publicity.png') });

// 3. reader journey
await page.locator('.workspace-sidebar nav a', { hasText: '03 · 读者体验' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: '开启阅读旅程' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: /打开阅读材料|阅读材料已展开/ }).click();
await page.waitForTimeout(300);
await page.locator('#journey-reflection').fill('六米书墙让我想起小时候在旧厂房里读书的下午。');
await page.locator('input[type=checkbox]').last().check();
await page.getByRole('button', { name: '完成任务，点亮体验章' }).click();
await page.waitForTimeout(700);
console.log('journey progress:', await page.locator('.journey-passport > p').first().textContent());
await page.screenshot({ path: join(OUT, '3-reader.png') });

// 4. leave reader mode, then feedback
await page.locator('.reader-mode-switch summary').click();
await page.waitForTimeout(200);
await page.locator('.reader-mode-switch nav a', { hasText: '运营工作台' }).click();
await page.waitForTimeout(400);
await page.locator('.workspace-sidebar nav a', { hasText: '04 · 运营复盘' }).click();
await page.waitForTimeout(300);
await page.fill('#feedback-period', '本次活动结束后匿名反馈');
await page.fill('#feedback-notes', '读者反馈共读时段偏短，希望增加自由交流。');
await page.getByRole('button', { name: '保存复盘' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: join(OUT, '4-feedback.png') });

// 5. archives
await page.locator('.workspace-sidebar nav a', { hasText: '活动档案' }).click();
await page.waitForTimeout(400);
console.log('archive count badge:', await page.locator('.workspace-sidebar nav a[href="#archives"] span').first().textContent());
await page.screenshot({ path: join(OUT, '5-archives.png') });

console.log('console errors:', errors.length ? errors.slice(0, 5) : 'none');
await browser.close();
