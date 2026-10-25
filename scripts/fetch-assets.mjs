// Fetch source site static assets into public/.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ORIGIN = 'https://shuxiang-cinematic.pages.dev';
const OUT = join(process.cwd(), 'public');

const targets = [];
for (const seq of ['seq_space', 'seq_problem']) {
  for (let i = 1; i <= 145; i++) {
    const name = `frame_${String(i).padStart(4, '0')}.webp`;
    targets.push(`${seq}/${name}`);
  }
}
targets.push(
  'assets/distribution/shiqi-map.jpg',
  'assets/passport/badge-collection.jpg',
  ...[1, 2, 7, 8, 10, 12].map((n) => `assets/ip/ip${n}.jpg`),
);

let done = 0;
const failed = [];

async function grab(rel) {
  const url = `${ORIGIN}/${rel}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = join(OUT, rel);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  done++;
}

const queue = [...targets];
await Promise.all(
  Array.from({ length: 10 }, async () => {
    while (queue.length) {
      const rel = queue.shift();
      try {
        await grab(rel);
      } catch (error) {
        failed.push(String(error));
      }
    }
  }),
);

console.log(`downloaded ${done}/${targets.length}, failed ${failed.length}`);
if (failed.length) console.log(failed.slice(0, 10).join('\n'));
