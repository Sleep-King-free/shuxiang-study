import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'docs', 'compare', 'workspace');
await mkdir(OUT, { recursive: true });
const TARGETS = [['knowledge', '#knowledge'], ['archives', '#archives'], ['publicity', '#publicity'], ['feedback', '#feedback']];

const browser = await chromium.launch({ channel: 'msedge' });
for (const [tag, origin] of [['src', 'https://shuxiang-cinematic.pages.dev'], ['local', 'http://localhost:3100']]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  for (const [name, hash] of TARGETS) {
    const page = await context.newPage();
    await page.addInitScript(() => sessionStorage.setItem('shuxiangIntroSeen', '1'));
    await page.goto(`${origin}/experience${hash}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 180));
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(OUT, `${name}-${tag}.png`) });
    await page.close();
  }
  await context.close();
}
await browser.close();
console.log('done');
