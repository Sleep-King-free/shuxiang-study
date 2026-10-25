// 数字文化护照交互回归：绑定 → 换性别 → 换头像 → 刷新恢复 → 退出
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'docs', 'compare', 'passport-interactive');
await mkdir(OUT, { recursive: true });

const errors = [];
const browser = await chromium.launch({ channel: 'msedge' });

async function newPage(viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return { context, page };
}

const report = {};
const shot = (page, name) => page.locator('.pp-phone').screenshot({ path: join(OUT, `${name}.png`) });

// ---------- 桌面 ----------
{
  const { context, page } = await newPage({ width: 1440, height: 1200 });
  await page.goto('http://localhost:3100/experience/passport', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('shuxiang-passport-v2'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pp-view');
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, '00-page.png') });
  await shot(page, '01-auth');

  // 位数不足
  await page.fill('.pp-field input', '1380013');
  await page.click('.pp-submit');
  await page.waitForTimeout(300);
  report.shortPhoneError = (await page.textContent('.pp-error'))?.trim();
  await shot(page, '02-auth-error');

  // 合法号码
  await page.fill('.pp-field input', '13800138000');
  await page.click('.pp-submit');
  await page.waitForTimeout(1000);
  report.hasHome = (await page.locator('.pp-view--home').count()) === 1;
  report.uid = (await page.textContent('.pp-uid'))?.trim();
  report.phoneMask = (await page.textContent('.pp-id-name small'))?.trim();
  report.innerScroll = await page.evaluate(() => {
    const view = document.querySelector('.pp-view--home');
    return view ? view.scrollHeight - view.clientHeight : -1;
  });
  await shot(page, '03-home');

  // 性别切换
  await page.click('.pp-seg-item:has-text("女")');
  await page.waitForTimeout(300);
  report.genderOn = (await page.textContent('.pp-seg-item.is-on'))?.trim();
  report.genderPressed = await page.getAttribute('.pp-seg-item:has-text("女")', 'aria-pressed');

  // 头像浮层
  await page.click('.pp-id-avatar');
  await page.waitForTimeout(500);
  report.sheetOpen = (await page.locator('.pp-sheet').count()) === 1;
  await shot(page, '04-avatar-sheet');

  await page.click('.pp-sheet-item:has-text("陶土")');
  await page.waitForTimeout(500);
  report.sheetClosed = (await page.locator('.pp-sheet').count()) === 0;
  report.avatarClass = await page.getAttribute('.pp-id-avatar .pp-avatar', 'class');
  await shot(page, '05-home-updated');

  // 刷新恢复
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  report.restoredHome = (await page.locator('.pp-view--home').count()) === 1;
  report.restoredUid = (await page.textContent('.pp-uid'))?.trim();
  report.restoredGender = (await page.textContent('.pp-seg-item.is-on'))?.trim();
  report.restoredAvatar = await page.getAttribute('.pp-id-avatar .pp-avatar', 'class');

  // 编号复制
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.click('.pp-uid-copy');
  await page.waitForTimeout(300);
  report.toastAfterCopy = (await page.textContent('.pp-toast'))?.trim();

  // 返回 AI 系统
  report.backHref = await page.getAttribute('.pp-actions .pp-ghost-btn', 'href');

  // 退出登录
  await page.click('.pp-ghost-btn--danger');
  await page.waitForTimeout(800);
  report.backToAuth = (await page.locator('.pp-view--home').count()) === 0;
  report.phoneKept = await page.inputValue('.pp-field input');
  await shot(page, '06-after-logout');

  // 同一号码再登入 → 编号与身份一致
  await page.click('.pp-submit');
  await page.waitForTimeout(900);
  report.reentryUid = (await page.textContent('.pp-uid'))?.trim();
  report.reentryGender = (await page.textContent('.pp-seg-item.is-on'))?.trim();
  report.reentryAvatar = await page.getAttribute('.pp-id-avatar .pp-avatar', 'class');

  report.overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  await context.close();
}

// ---------- 手机 ----------
{
  const { context, page } = await newPage({ width: 390, height: 844 });
  await page.goto('http://localhost:3100/experience/passport', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('shuxiang-passport-v2'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pp-view');
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('.pp-board').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, '07-mobile-auth.png') });

  await page.fill('.pp-field input', '13900001111');
  await page.click('.pp-submit');
  await page.waitForTimeout(1000);
  report.mobileUid = (await page.textContent('.pp-uid'))?.trim();
  report.mobileOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  await page.evaluate(() => document.querySelector('.pp-board').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, '08-mobile-home.png') });

  await page.click('.pp-id-avatar');
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, '09-mobile-sheet.png') });
  await context.close();
}

await browser.close();
report.consoleErrors = errors;
console.log(JSON.stringify(report, null, 2));
