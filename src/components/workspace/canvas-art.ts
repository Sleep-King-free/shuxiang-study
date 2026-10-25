import type { ActivityRecord } from './model';
import type { JourneyRecord } from './journey-data';

const FONT = "'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif";

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** Character-by-character wrap, ported from platform.js. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  maxLines = 20,
) {
  let line = '';
  let lines = 0;
  for (const char of Array.from(text || '')) {
    if (char === '\n' || ctx.measureText(line + char).width > width) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = char === '\n' ? '' : char;
      lines += 1;
      if (lines >= maxLines) {
        ctx.fillText('…', x, y);
        return y;
      }
    } else {
      line += char;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}

export type PosterInput = {
  theme: string;
  library: string;
  schedule: string;
  highlights: string;
  image?: HTMLImageElement | null;
};

/** `#activity-poster` — 900 × 1200 print-style draft. */
export async function drawPoster(canvas: HTMLCanvasElement, input: PosterInput) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const image = input.image ?? (await loadImage('/assets/distribution/shiqi-map.jpg'));

  ctx.fillStyle = '#f7f9f7';
  ctx.fillRect(0, 0, 900, 1200);

  if (image && image.naturalWidth > 0) {
    const scale = Math.min(900 / image.naturalWidth, 550 / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(image, (900 - width) / 2, (550 - height) / 2, width, height);
  } else {
    ctx.strokeStyle = '#d9e2dc';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 820, 470);
    ctx.fillStyle = '#52645d';
    ctx.font = `24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('海报图片待选择', 450, 285);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = '#103f35';
  ctx.font = `bold 56px ${FONT}`;
  let y = wrapText(ctx, input.theme || '香山书房 · 下一场活动', 60, 630, 780, 78, 3);

  ctx.font = `28px ${FONT}`;
  y = wrapText(ctx, input.library || '香山书房', 60, y + 18, 780, 42, 2);

  ctx.fillStyle = '#c95736';
  ctx.font = `26px ${FONT}`;
  y = wrapText(ctx, input.schedule || '时间与活动安排待确认', 60, y + 30, 780, 40, 2);

  ctx.fillStyle = '#52645d';
  ctx.font = `22px ${FONT}`;
  wrapText(ctx, input.highlights || '活动亮点以采用方案为准', 60, Math.min(y + 22, 1080), 780, 32, 2);

  ctx.font = `22px ${FONT}`;
  ctx.fillText('「数」香满屋 · 宣传模板草稿，发布前须审核', 60, 1160);
}

/** `#reading-card` — the per-activity reading card from the source. */
export function drawReadingCard(canvas: HTMLCanvasElement, record: ActivityRecord) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#103f35';
  ctx.fillRect(0, 0, 900, 1100);

  ctx.fillStyle = '#e9c778';
  ctx.font = `28px ${FONT}`;
  ctx.fillText('「数」香满屋 · 我的阅读卡', 60, 100);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 48px ${FONT}`;
  const y = wrapText(ctx, record.inputs.theme || '下一段阅读旅程', 60, 220, 780, 70, 3);

  ctx.font = `30px ${FONT}`;
  wrapText(ctx, record.reading?.reflection || '一句感悟，留住一次发现。', 60, y + 70, 780, 52, 8);

  ctx.fillStyle = '#e9c778';
  ctx.font = `24px ${FONT}`;
  wrapText(ctx, record.library || '香山书房', 60, 890, 780, 38, 2);
  ctx.font = `20px ${FONT}`;
  ctx.fillText('原型阅读记录 · 不证明实际到访或阅读时长', 60, 1010);
}

export type JourneyBadge = { col: number; row: number; label: string };

/** `#journey-card` — reflection, date and the earned experience badge. */
export async function drawJourneyCard(
  canvas: HTMLCanvasElement,
  record: JourneyRecord | null,
  badge: JourneyBadge | null,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#103f35';
  ctx.fillRect(0, 0, 900, 1100);

  ctx.fillStyle = '#e9c778';
  ctx.font = `28px ${FONT}`;
  ctx.fillText(`「数」香满屋 · ${record ? '我的阅读卡' : '示例阅读卡'}`, 60, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 44px ${FONT}`;
  wrapText(ctx, record?.theme || '城市记忆', 60, 230, 560, 58, 2);

  ctx.font = `28px ${FONT}`;
  wrapText(
    ctx,
    record?.reflection || '完成一次导读，把自己的发现留在这里。',
    60,
    350,
    540,
    48,
    8,
  );

  if (badge) {
    const sprite = await loadImage('/assets/passport/badge-collection.jpg');
    const boxX = 660;
    const boxY = 610;
    const boxW = 170;
    const boxH = 212;
    if (sprite && sprite.naturalWidth > 0) {
      const tileW = sprite.naturalWidth / 5;
      const tileH = sprite.naturalHeight / 4;
      const scale = Math.min(boxW / tileW, boxH / tileH);
      const width = tileW * scale;
      const height = tileH * scale;
      ctx.drawImage(
        sprite,
        badge.col * tileW,
        badge.row * tileH,
        tileW,
        tileH,
        boxX + (boxW - width) / 2,
        boxY + (boxH - height) / 2,
        width,
        height,
      );
    } else {
      ctx.strokeStyle = '#e9c778';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = '#e9c778';
      ctx.font = `64px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('章', boxX + boxW / 2, boxY + boxH / 2 + 22);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = '#e9c778';
    ctx.font = `20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(badge.label, boxX + boxW / 2, boxY + boxH + 30);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = '#e9c778';
  ctx.font = `24px ${FONT}`;
  ctx.fillText(record?.library || '格子空间香山书房', 60, 850);
  ctx.fillText(record?.date || '日期 · 完成后生成', 60, 920);

  ctx.fillStyle = '#ffffff';
  ctx.font = `20px ${FONT}`;
  ctx.fillText('示例导读任务记录 · 不证明实际到访或阅读时长', 60, 1020);
}
