// Walk the workspace views on both sites.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'docs', 'compare', 'workspace');
await mkdir(OUT, { recursive: true });

const VIEWS = [
  ['plan', '01 · AI活动策划'],
  ['publicity', '02 · 宣传制作'],
  ['reader', '03 · 读者体验'],
  ['feedback', '04 · 运营复盘'],
  ['knowledge', '书房资料库'],
  ['archives', '活动档案'],
];

const browser = await chromium.launch({ channel: 'msedge' });
for (const [tag, origin] of [
  ['src', 'https://shuxiang-cinematic.pages.dev'],
  ['local', 'http://localhost:3100'],
]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript(() => sessionStorage.setItem('shuxiangIntroSeen', '1'));
  await page.goto(`${origin}/experience`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(800);
  for (const [name, label] of VIEWS) {
    const link = page.locator('.workspace-sidebar nav a', { hasText: label }).first();
    await link.click({ force: true }).catch(() => {});
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(OUT, `${name}-${tag}.png`) });
  }
  await context.close();
}
await browser.close();
console.log('done');
