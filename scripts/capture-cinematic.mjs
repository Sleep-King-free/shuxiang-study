// Walk the cinematic opening on both sites and capture the same stations.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'docs', 'compare', 'cinematic');
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge' });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

for (const [tag, origin] of [
  ['src', 'https://shuxiang-cinematic.pages.dev'],
  ['local', 'http://localhost:3100'],
]) {
  const page = await context.newPage();
  await page.goto(origin, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: '观看电影序章' }).first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(OUT, `${tag}-1-loader.png`) });

  const enter = page.locator('#cineEnter');
  if (await enter.isVisible().catch(() => false)) {
    await enter.click();
  } else {
    await page.waitForTimeout(6000);
    await page.locator('#cineEnter').click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(OUT, `${tag}-2-frame0.png`) });

  // chapter 1 → 2
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(7200);
  await page.screenshot({ path: join(OUT, `${tag}-3-space-end.png`) });

  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(7600);
  await page.screenshot({ path: join(OUT, `${tag}-4-data.png`) });

  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, `${tag}-5-outro.png`) });

  await page.close();
}

await browser.close();
console.log('done');
