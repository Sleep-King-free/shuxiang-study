// Compare geometry + key computed styles between the source page and the clone.
import { chromium } from 'playwright';

const SOURCE = 'https://shuxiang-cinematic.pages.dev';
const LOCAL = 'http://localhost:3100';

const TARGETS = {
  '/': ['.nav-shell', '.hero-copy h1', '.hero-sub', '.hero-actions', '.hero-proof', '.scroll-map', '.hero-note', '.route-board', '.route-stop h3', '.proof-section', '.proof-copy h2', '.system-stage', '.cinematic-bridge'],
  '/libraries': ['.page-hero h1', '.stat-grid', '.policy-timeline', '.map-frame', '.map-copy', '.point-grid', '.point-card h3', '.profile'],
  '/solution': ['.page-hero h1', '.loop', '.feature-media img', '.step-flow', '.quarter-grid', '.book-panel.active'],
  '/evidence': ['.big-data', '.grid.four', '.problem-grid', '.ip-grid'],
};

const browser = await chromium.launch({ channel: 'msedge' });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

const read = async (url, selectors) => {
  const page = await context.newPage();
  await page.addInitScript(() => sessionStorage.setItem('shuxiangIntroSeen', '1'));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(600);
  const data = await page.evaluate((sels) => {
    const out = { height: document.body.scrollHeight, nodes: {} };
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el) {
        out.nodes[sel] = null;
        continue;
      }
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out.nodes[sel] = {
        x: Math.round(r.x),
        y: Math.round(r.y + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
        font: cs.fontSize,
        lh: cs.lineHeight,
        mt: cs.marginTop,
        mb: cs.marginBottom,
        pt: cs.paddingTop,
        pb: cs.paddingBottom,
        ls: cs.letterSpacing,
      };
    }
    return out;
  }, selectors);
  await page.close();
  return data;
};

for (const [path, selectors] of Object.entries(TARGETS)) {
  const [src, local] = await Promise.all([read(`${SOURCE}${path}`, selectors), read(`${LOCAL}${path}`, selectors)]);
  console.log(`\n=== ${path}  height src=${src.height} local=${local.height} (Δ${local.height - src.height})`);
  for (const sel of selectors) {
    const a = src.nodes[sel];
    const b = local.nodes[sel];
    if (!a || !b) {
      console.log(`  ${sel}: src=${a ? 'ok' : 'MISSING'} local=${b ? 'ok' : 'MISSING'}`);
      continue;
    }
    const keys = ['x', 'y', 'w', 'h', 'font', 'lh', 'mt', 'mb', 'pt', 'pb', 'ls'];
    const diff = keys.filter((k) => String(a[k]) !== String(b[k])).map((k) => `${k} ${a[k]}→${b[k]}`);
    if (diff.length) console.log(`  ${sel}: ${diff.join(' | ')}`);
  }
}

await browser.close();
