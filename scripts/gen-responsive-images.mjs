/**
 * 生成响应式图片变体（WebP）。
 *
 * 背景：原图是 1250~1328px 宽、单张 350KB~1.1MB 的 JPG，
 * 而手机上的展示宽度只有 150~360 CSS px，等于多下载了 4~8 倍的像素。
 *
 * 用法：node scripts/gen-responsive-images.mjs
 * 产物写入 public/ 下的同名目录，源 JPG 保留作为 <img src> 兜底。
 */
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { join } from 'node:path';

// [目录, 文件名(不含扩展名), 需要生成的宽度]
const JOBS = [
  ['public/assets/distribution', 'shiqi-map', [640, 1280]],
  ['public/assets/passport', 'badge-collection', [640, 1280]],
];

const IP_DIR = 'public/assets/ip';

// 420：手机 2 倍屏单格；600：手机 3 倍屏单格；840：桌面高 DPR / 放大查看
const IP_WIDTHS = [420, 600, 840];

const run = async (dir, name, widths, quality = 72, ext = 'jpg') => {
  const input = join(dir, `${name}.${ext}`);
  for (const w of widths) {
    const out = join(dir, `${name}-${w}.webp`);
    await sharp(input)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toFile(out);
    const meta = await sharp(out).metadata();
    const kb = (statSync(out).size / 1024).toFixed(0);
    console.log(`✔ ${out}  ${meta.width}x${meta.height}  ${kb}KB`);
  }
};

for (const [dir, name, widths] of JOBS) await run(dir, name, widths, 70);

const ipFiles = (await readdir(IP_DIR)).filter((f) => /^ip\d+\.jpg$/.test(f));
for (const file of ipFiles) await run(IP_DIR, file.replace(/\.jpg$/, ''), IP_WIDTHS, 70);

console.log('done');
