// Side-by-side capture: source site vs local clone, same viewport + scroll positions.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE = 'https://shuxiang-cinematic.pages.dev';
const LOCAL = 'http://localhost:3100';
const OUT = join(process.cwd(), 'docs', 'compare');

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/libraries', name: 'libraries' },
  { path: '/solution', name: 'solution' },
  { path: '/experience', name: 'experience' },
  { path: '/evidence', name: 'evidence' },
];

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 390, height: 844 },
];

const shots = process.argv.slice(2);

const browser = await chromium.launch({ channel: 'msedge' });

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.label === 'mobile',
    hasTouch: vp.label === 'mobile',
    reducedMotion: 'reduce',
  });
  for (const page of PAGES) {
    if (shots.length && !shots.includes(page.name)) continue;
    for (const [tag, origin] of [
      ['src', SOURCE],
      ['local', LOCAL],
    ]) {
      const p = await context.newPage();
      await p.addInitScript(() => sessionStorage.setItem('shuxiangIntroSeen', '1'));
      try {
        await p.goto(`${origin}${page.path}`, { waitUntil: 'networkidle', timeout: 45000 });
      } catch {
        await p.waitForTimeout(2000);
      }
      await p.waitForTimeout(900);
      const dir = join(OUT, vp.label);
      await mkdir(dir, { recursive: true });
      await p.screenshot({ path: join(dir, `${page.name}-${tag}-hero.png`) });
      const total = await p.evaluate(() => document.body.scrollHeight);
      let index = 0;
      for (let y = vp.height; y < total && index < 8; y += vp.height, index++) {
        await p.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
        await p.waitForTimeout(450);
        await p.screenshot({ path: join(dir, `${page.name}-${tag}-${index + 1}.png`) });
      }
      await p.close();
    }
  }
  await context.close();
}

await browser.close();
console.log('done');
