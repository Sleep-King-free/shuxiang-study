/* 数字文化护照 · 阅读打卡抽徽章回归
   覆盖：初始态 / 抽奖 loading / 弹窗 / 数据落库 / 刷新恢复 / 集齐 / 换号隔离 / 手机端 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'docs', 'compare', 'passport-badges');
mkdirSync(OUT, { recursive: true });

const KEY = 'shuxiang-passport-v2';
const PHONE = '13800138000';
const OTHER = '13900139000';

const results = [];
const check = (name, pass, extra) => {
  results.push({ name, pass: !!pass, extra });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : '  →  ' + JSON.stringify(extra)}`);
};

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1180 }, deviceScaleFactor: 2 });
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

const readStore = () =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), KEY);
const statValue = (label) =>
  page.evaluate((text) => {
    const card = [...document.querySelectorAll('.pp-stat')].find(
      (el) => el.querySelector('.pp-stat-label')?.textContent?.trim() === text,
    );
    return card ? card.querySelector('.pp-stat-value')?.textContent?.replace(/\s+/g, '') : null;
  }, label);

await page.goto('http://localhost:3100/experience/passport', { waitUntil: 'networkidle' });
await page.evaluate((key) => localStorage.removeItem(key), KEY);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.pp-field input');
await page.fill('.pp-field input', PHONE);
await page.click('.pp-submit');
await page.waitForSelector('.pp-view--home');
await page.waitForTimeout(600);

/* ---------- 1. 初始态 ---------- */
let store = await readStore();
check('领取后 readingTime = 0', store.active.readingTime === 0, store.active.readingTime);
check('领取后 earnedBadges = []', Array.isArray(store.active.earnedBadges) && store.active.earnedBadges.length === 0, store.active.earnedBadges);
check('看板阅读时长为 0 小时', (await statValue('阅读累计时间')) === '0小时', await statValue('阅读累计时间'));
check('看板徽章数为 0 枚', (await statValue('获得徽章数量')) === '0枚', await statValue('获得徽章数量'));
const wallCount = await page.locator('.pp-badge').count();
check('徽章墙渲染 20 格', wallCount === 20, wallCount);
const litCount = await page.locator('.pp-badge.is-on').count();
check('初始 0 格点亮', litCount === 0, litCount);
const grayFilter = await page.evaluate(() => {
  const el = document.querySelector('.pp-badge:not(.is-on) .pp-badge-icon');
  return el ? getComputedStyle(el).filter : null;
});
check('未获得显示灰色剪影', !!grayFilter && grayFilter.includes('grayscale(1)'), grayFilter);
const names = await page.locator('.pp-badge').evaluateAll((els) => els.map((el) => el.dataset.name));
check('20 个格子都带徽章名', names.length === 20 && names.every((n) => !!n), names.slice(0, 3));
check('名称与徽章库一致', names[0] === '初识香山' && names[19] === '藏书印记', [names[0], names[19]]);
// 等「护照已生成」轻提示消散，再拍首屏
await page.waitForTimeout(2600);
const firstScreen = await page.evaluate(() => {
  const btn = document.querySelector('.pp-read-btn')?.getBoundingClientRect();
  const screen = document.querySelector('.pp-screen')?.getBoundingClientRect();
  return btn && screen ? { btnTop: Math.round(btn.top), screenBottom: Math.round(screen.bottom) } : null;
});
check('打卡按钮落在首屏内', firstScreen && firstScreen.btnTop < firstScreen.screenBottom, firstScreen);
await page.locator('.pp-phone').screenshot({ path: join(OUT, '01-fresh.png') });

/* ---------- 2. 抽奖 loading 态 ---------- */
await page.click('.pp-read-btn');
await page.waitForTimeout(180);
const loadingText = (await page.locator('.pp-read-btn').textContent())?.trim();
const spinner = await page.locator('.pp-read-spinner').count();
check('点击后出现生成中态', loadingText?.includes('正在翻阅') && spinner === 1, { loadingText, spinner });
const disabledWhileDrawing = await page.locator('.pp-read-btn').isDisabled();
check('抽奖中按钮禁用', disabledWhileDrawing === true, disabledWhileDrawing);
await page.locator('.pp-phone').screenshot({ path: join(OUT, '02-drawing.png') });

/* ---------- 3. 弹窗 ---------- */
await page.waitForSelector('.pp-reward', { timeout: 4000 });
const reward = await page.evaluate(() => {
  const q = (s) => document.querySelector(s)?.textContent?.trim() ?? null;
  return {
    kicker: q('.pp-reward-kicker'),
    emoji: q('.pp-reward-emoji'),
    name: q('.pp-reward-name'),
    desc: q('.pp-reward-desc'),
    count: q('.pp-reward-count'),
    btn: q('.pp-reward-btn'),
  };
});
check('弹窗标题为「恭喜获得新徽章」', reward.kicker === 'NEW BADGE UNLOCKED', reward.kicker);
check('弹窗显示徽章 emoji', !!reward.emoji && reward.emoji.length > 0, reward.emoji);
check('弹窗显示徽章名称', !!reward.name && reward.name !== '待点亮', reward.name);
check('弹窗显示已收集进度 1/20', /1\s*\/\s*20/.test(reward.count ?? ''), reward.count);
check('弹窗有收下按钮', reward.btn === '收下徽章', reward.btn);
await page.waitForTimeout(700);
const cardOpacity = await page.evaluate(() => getComputedStyle(document.querySelector('.pp-reward-card')).opacity);
check('弹窗卡片完全显现', cardOpacity === '1', cardOpacity);
await page.locator('.pp-phone').screenshot({ path: join(OUT, '03-reward.png') });

/* ---------- 4. 关闭并校验落库 ---------- */
await page.click('.pp-reward-btn');
await page.waitForTimeout(400);
check('点收下后弹窗关闭', (await page.locator('.pp-reward').count()) === 0);
store = await readStore();
check('readingTime = 30', store.active.readingTime === 30, store.active.readingTime);
check('earnedBadges 有 1 枚', store.active.earnedBadges.length === 1, store.active.earnedBadges);
check('看板时长 0.5 小时', (await statValue('阅读累计时间')) === '0.5小时', await statValue('阅读累计时间'));
check('看板徽章 1 枚', (await statValue('获得徽章数量')) === '1枚', await statValue('获得徽章数量'));
check('徽章墙点亮 1 格', (await page.locator('.pp-badge.is-on').count()) === 1);
const litFilter = await page.evaluate(() => {
  const el = document.querySelector('.pp-badge.is-on .pp-badge-icon');
  return el ? getComputedStyle(el).filter : null;
});
check('已获得恢复彩色', litFilter === 'none', litFilter);

// 悬停显示名称
await page.locator('.pp-badge.is-on').first().hover();
await page.waitForTimeout(260);
const tip = await page.evaluate(() => {
  const el = document.querySelector('.pp-badge.is-on');
  const cs = getComputedStyle(el, '::after');
  return { opacity: cs.opacity, content: cs.content.replace(/"/g, ''), name: el.dataset.name };
});
check('悬停浮出徽章名称', tip.opacity === '1' && tip.content === tip.name, tip);
await page.locator('.pp-case').screenshot({ path: join(OUT, '06-wall-hover.png') });
await page.mouse.move(0, 0);
await page.waitForTimeout(200);
await page.locator('.pp-phone').screenshot({ path: join(OUT, '04-after-one.png') });

/* ---------- 5. 连抽两次不重复 ---------- */
for (let i = 0; i < 2; i += 1) {
  await page.click('.pp-read-btn');
  await page.waitForSelector('.pp-reward', { timeout: 4000 });
  if (i === 1) await page.locator('.pp-phone').screenshot({ path: join(OUT, '05-reward-second.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
}
store = await readStore();
check('抽 3 次后 readingTime = 90', store.active.readingTime === 90, store.active.readingTime);
const uniqueIds = new Set(store.active.earnedBadges);
check('3 枚徽章互不重复', uniqueIds.size === 3, store.active.earnedBadges);
check('Esc 可关闭弹窗', (await page.locator('.pp-reward').count()) === 0);

/* ---------- 6. 刷新恢复 ---------- */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.pp-view--home');
await page.waitForTimeout(400);
check('刷新后仍在主页', (await page.locator('.pp-read-btn').count()) === 1);
check('刷新后时长仍为 90 分钟', (await statValue('阅读累计时间')) === '1.5小时', await statValue('阅读累计时间'));
check('刷新后徽章仍 3 枚', (await page.locator('.pp-badge.is-on').count()) === 3);
const persistedBadges = (await readStore()).active.earnedBadges;
check('刷新后 localStorage 徽章一致', persistedBadges.length === 3, persistedBadges);

/* ---------- 7. 徽章墙元素特写 ---------- */
await page.locator('.pp-case').screenshot({ path: join(OUT, '06-wall.png') });

/* ---------- 8. 换号登录不串数据 ---------- */
await page.evaluate(() => document.querySelectorAll('.pp-ghost-btn')[1].click());
await page.waitForSelector('.pp-field input');
await page.fill('.pp-field input', OTHER);
await page.click('.pp-submit');
await page.waitForSelector('.pp-view--home');
await page.waitForTimeout(500);
check('新号码阅读时长为 0', (await statValue('阅读累计时间')) === '0小时', await statValue('阅读累计时间'));
check('新号码徽章为 0', (await page.locator('.pp-badge.is-on').count()) === 0);
const both = await readStore();
check('两个号码各自独立存记录', Object.keys(both.records).length === 2, Object.keys(both.records));
check('老号码记录仍是 90 分钟', both.records[PHONE].readingTime === 90, both.records[PHONE].readingTime);

/* ---------- 9. 集齐判定 ---------- */
await page.evaluate(
  ({ key, phone }) => {
    const store = JSON.parse(localStorage.getItem(key));
    const all = Array.from({ length: 20 }, (_, i) => `XS-B${String(i + 1).padStart(2, '0')}`);
    const p = store.records[phone];
    p.earnedBadges = all.slice(0, 19);
    p.readingTime = 570;
    store.records[phone] = p;
    store.active = p;
    localStorage.setItem(key, JSON.stringify(store));
  },
  { key: KEY, phone: OTHER },
);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.pp-read-btn');
check('注入 19 枚后点亮 19 格', (await page.locator('.pp-badge.is-on').count()) === 19);
check('19 枚时按钮仍可点', (await page.locator('.pp-read-btn').isDisabled()) === false);
await page.click('.pp-read-btn');
await page.waitForSelector('.pp-reward', { timeout: 4000 });
const lastCount = (await page.locator('.pp-reward-count').textContent())?.replace(/\s+/g, '');
check('最后一枚提示「全部集齐」', lastCount?.includes('全部集齐'), lastCount);
await page.waitForTimeout(700);
await page.locator('.pp-phone').screenshot({ path: join(OUT, '07-all-done.png') });
await page.click('.pp-reward-btn');
await page.waitForTimeout(300);
check('集齐后按钮显示 20 枚已集齐', ((await page.locator('.pp-read-btn').textContent()) ?? '').includes('已集齐'));
check('集齐后按钮禁用', (await page.locator('.pp-read-btn').isDisabled()) === true);
check('集齐后点亮 20 格', (await page.locator('.pp-badge.is-on').count()) === 20);
await page.locator('.pp-case').screenshot({ path: join(OUT, '07-wall-full.png') });

/* ---------- 10. 抽奖途中改性别不被旧快照覆盖 ---------- */
const race = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await race.goto('http://localhost:3100/experience/passport', { waitUntil: 'networkidle' });
await race.evaluate((key) => localStorage.removeItem(key), KEY);
await race.reload({ waitUntil: 'networkidle' });
await race.fill('.pp-field input', '13600136000');
await race.click('.pp-submit');
await race.waitForSelector('.pp-read-btn');
await race.click('.pp-read-btn');
await race.waitForTimeout(140);
await race.locator('.pp-seg-item').first().click();
await race.waitForSelector('.pp-reward', { timeout: 4000 });
await race.click('.pp-reward-btn');
await race.waitForTimeout(300);
const raceState = await race.evaluate((key) => JSON.parse(localStorage.getItem(key)).active, KEY);
check('抽奖途中改性别不被旧快照覆盖', raceState.gender === 'male', raceState.gender);
check('竞态后阅读时长仍正确 +30', raceState.readingTime === 30, raceState.readingTime);
check('竞态后徽章仍记录 1 枚', raceState.earnedBadges.length === 1, raceState.earnedBadges);
await race.close();

/* ---------- 11. 手机端 ---------- */
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await mobile.goto('http://localhost:3100/experience/passport', { waitUntil: 'networkidle' });
await mobile.evaluate((key) => localStorage.removeItem(key), KEY);
await mobile.reload({ waitUntil: 'networkidle' });
await mobile.waitForSelector('.pp-field input');
await mobile.fill('.pp-field input', '13700137000');
await mobile.click('.pp-submit');
await mobile.waitForSelector('.pp-read-btn', { timeout: 5000 });
await mobile.waitForTimeout(500);
const overflow = await mobile.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));
check('390px 无横向溢出', overflow.scroll <= overflow.client + 1, overflow);
await mobile.click('.pp-read-btn');
await mobile.waitForSelector('.pp-reward', { timeout: 4000 });
const sheetBox = await mobile.evaluate(() => {
  const card = document.querySelector('.pp-reward-card');
  const r = card.getBoundingClientRect();
  return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight };
});
check(
  '手机端弹窗落在视口内',
  sheetBox.top > 0 && sheetBox.bottom < sheetBox.vh,
  sheetBox,
);
await mobile.waitForTimeout(700);
await mobile.screenshot({ path: join(OUT, '08-mobile-reward.png') });
await mobile.close();

check('控制台零报错', consoleErrors.length === 0, consoleErrors.slice(0, 3));

await page.close();
await browser.close();

const passed = results.filter((r) => r.pass).length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
