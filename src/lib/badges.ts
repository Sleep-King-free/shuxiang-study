/* ============================================================
   数字文化护照 · 徽章库（纯前端模拟数据）
   20 枚徽章，每 30 分钟阅读随机抽取一枚未获得的。
   icon 暂用 Emoji 代替位图，后续可替换为 public/assets 下的图片。
   ============================================================ */

export type Badge = {
  id: string;
  name: string;
  icon: string;
  /** 一句话释义，用于抽中弹窗与徽章墙提示 */
  desc: string;
};

export const BADGES: Badge[] = [
  { id: 'XS-B01', name: '初识香山', icon: '📚', desc: '第一次走进书房，先和书架打个招呼。' },
  { id: 'XS-B02', name: '开卷有益', icon: '📖', desc: '把书翻到第二页，故事就开始了。' },
  { id: 'XS-B03', name: '三十分钟', icon: '⏳', desc: '把半小时完整地交给一本书。' },
  { id: 'XS-B04', name: '阅读达人', icon: '🌟', desc: '书页开始记住你的名字。' },
  { id: 'XS-B05', name: '深夜书虫', icon: '🦉', desc: '灯还亮着，你还醒着。' },
  { id: 'XS-B06', name: '一盏茶时', icon: '🍵', desc: '茶凉之前，读完了一章。' },
  { id: 'XS-B07', name: '半日闲读', icon: '🌿', desc: '把整个下午交给一本书。' },
  { id: 'XS-B08', name: '书页留痕', icon: '🔖', desc: '折角也是一种笔记。' },
  { id: 'XS-B09', name: '侨乡寻踪', icon: '🏮', desc: '在旧照片里认出故乡。' },
  { id: 'XS-B10', name: '香山拾光', icon: '✨', desc: '捡到一句想抄下来的话。' },
  { id: 'XS-B11', name: '木棉初绽', icon: '🌺', desc: '春天从书脊里长出来。' },
  { id: 'XS-B12', name: '纸上山河', icon: '🗺️', desc: '跟着文字，走远一点。' },
  { id: 'XS-B13', name: '灯下长谈', icon: '🕯️', desc: '和作者聊到很晚。' },
  { id: 'XS-B14', name: '百页之约', icon: '📄', desc: '说好读一百页，做到了。' },
  { id: 'XS-B15', name: '墨香满怀', icon: '🖋️', desc: '闻见纸和油墨的味道。' },
  { id: 'XS-B16', name: '静读成章', icon: '🪶', desc: '安静也是有声音的。' },
  { id: 'XS-B17', name: '书房常客', icon: '🪑', desc: '那张椅子已经认得你了。' },
  { id: 'XS-B18', name: '字里行间', icon: '🔍', desc: '在缝隙里读出行距。' },
  { id: 'XS-B19', name: '晨光共读', icon: '🌅', desc: '天亮的时候，有人陪你读。' },
  { id: 'XS-B20', name: '藏书印记', icon: '🏛️', desc: '把这段日子存进档案。' },
];

export const BADGE_TOTAL = BADGES.length;

/** 每次「模拟阅读」增加的分钟数，也是抽奖触发单位 */
export const READ_STEP_MINUTES = 30;

const BADGE_MAP = new Map(BADGES.map((badge) => [badge.id, badge]));

export function findBadge(id: string): Badge | undefined {
  return BADGE_MAP.get(id);
}

/** 洗牌式随机：从尚未获得的徽章里抽一枚；全部集齐返回 null */
export function drawBadge(earned: readonly string[]): Badge | null {
  const owned = new Set(earned);
  const pool = BADGES.filter((badge) => !owned.has(badge.id));
  if (pool.length === 0) return null;

  let index: number;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    index = crypto.getRandomValues(new Uint32Array(1))[0] % pool.length;
  } else {
    index = Math.floor(Math.random() * pool.length);
  }
  return pool[index];
}
