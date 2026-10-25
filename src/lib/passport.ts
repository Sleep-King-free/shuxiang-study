/**
 * 数字文化护照 — 徽章、集章步骤与页面文案。
 * 徽章图沿用 /assets/passport/badge-collection.jpg（5 列 × 4 行，共 20 枚）。
 */

export type PassportSeal = {
  id: string;
  name: string;
  library: string;
  col: number;
  row: number;
  hint: string;
};

export const PASSPORT_SEALS: PassportSeal[] = [
  {
    id: 'memory',
    name: '城市记忆',
    library: '格子空间香山书房',
    col: 0,
    row: 0,
    hint: '工业旧楼活化，结构格构与原用途仍被看见。',
  },
  {
    id: 'heritage',
    name: '非遗手作',
    library: '西区荔景苑香山书房',
    col: 2,
    row: 0,
    hint: '醉龙、扎染与本土技艺，在书页之外留下手工痕迹。',
  },
  {
    id: 'nature',
    name: '生态观察',
    library: '紫马岭公园香山书房',
    col: 4,
    row: 0,
    hint: '庭院、坡道、弧墙与树影，把阅读放回自然。',
  },
  {
    id: 'community',
    name: '社区共读',
    library: '西苑社区香山书房',
    col: 1,
    row: 1,
    hint: '社区书屋升级而来，居民与青年力量共同运营。',
  },
  {
    id: 'overseas',
    name: '侨乡寻访',
    library: '三乡雍陌香山书房',
    col: 3,
    row: 1,
    hint: '百年华侨楼与郑观应故居，侨乡记忆仍在原地。',
  },
  {
    id: 'industry',
    name: '乡土产业',
    library: '板芙里溪香山书房',
    col: 0,
    row: 2,
    hint: '红色文化、葡萄产业与乡村阅读并肩生长。',
  },
];

/** 与「数字运营方案」页第二步完全一致的五个环节。 */
export const PASSPORT_STEPS = [
  '扫码进入',
  '按兴趣与时间荐读',
  '完成轻阅读任务',
  '生成阅读卡',
  '点亮徽章与积分',
];

/** 护照本封面信息（示例编号，实际由运营方发号）。 */
export const PASSPORT_COVER = {
  serial: 'SY-2026-0001',
  holder: '到访读者',
  issued: '2026.10',
  scope: '香山书房网络 · 21 处点位',
};

export const PASSPORT_STORAGE_KEY = 'shuxiang-passport-v1';

/** 5 列 4 行的雪碧图偏移量（与工作台徽章同一算法）。 */
export const sealOffset = (seal: PassportSeal) => `${seal.col * 25}% ${(seal.row * 100) / 3}%`;
