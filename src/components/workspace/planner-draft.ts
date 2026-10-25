import { bookLists, operatingSource, plannerLibraries, directions } from '@/lib/content';
import type { PlanInputs } from './model';

type PlannerLibrary = (typeof plannerLibraries)[number];
type Direction = (typeof directions)[number];

export type DraftResult = { content: string; sources: string[] };

/** Shown in `.planner-service`, the meta line and the status line. */
export const LOCAL_PROVIDER = '本地演示生成（未经模型调用）';

const AUDIENCE_NOTES: Record<string, string> = {
  亲子家庭: '以亲子共同参与为前提，导读任务需要成人陪伴，并保留一段共同朗读的时间。',
  青少年: '任务控制在可完成的范围，讨论以提问代替讲授，避免长时间单向输出。',
  青年读者: '议题围绕城市经验与个人阅读史展开，保留自由发言与延伸提问的时间。',
  社区长者: '字号、座位、音量与洗手间位置需提前确认，并安排工作人员在现场协助。',
  社区居民: '从熟悉的日常空间经验进入讨论，降低参与门槛，允许中途加入与提前离场。',
};

const FLOWS: Record<string, string[]> = {
  discussion: ['签到与导入', '空间资料导读', '安静阅读', '小组讨论', '记录感悟与收尾'],
  culture: ['签到与导入', '文化线索讲解', '资料共读', '体验与交流', '记录感悟与收尾'],
  explore: ['签到与说明', '空间踏勘', '定点阅读', '分享与提问', '记录感悟与收尾'],
};

const WEIGHTS = [10, 20, 20, 35, 15];

const FLOW_DETAILS: Record<string, string[]> = {
  discussion: [
    '核对到场名单，说明本次讨论的问题与记录方式。',
    '由主持按可确认的项目资料介绍书房空间与城市记忆线索。',
    '同一份导读材料安静阅读，不安排讲解与走动。',
    '按人数分为小组，每位参与者分享一个观察与一个阅读问题。',
    '填写一句感悟，回收借阅资料，说明后续联系方式。',
  ],
  culture: [
    '核对到场名单，说明本次文化体验的边界与安全提示。',
    '由讲解人按项目资料介绍地方文化线索，区分已知事实与推测。',
    '围绕同一份材料共读，标出希望进一步查证的问题。',
    '安排一项可完成的体验动作，随后交流观察差异。',
    '填写一句感悟，回收材料，说明后续查证渠道。',
  ],
  explore: [
    '核对到场名单，说明踏勘路线、范围与天气备选方案。',
    '按既定范围观察空间结构、材料与使用痕迹，控制移动距离。',
    '在指定点位就坐，阅读与眼前空间相关的资料段落。',
    '分享各自的观察差异，主持记录仍有争议的问题。',
    '填写一句感悟，返回集合点，回收资料与设备。',
  ],
};

function clampNumber(value: string, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function clock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function bookPicks(direction: Direction) {
  const local = bookLists.find((list) => list.id === 'local')?.books ?? [];
  const extraId = direction.id === 'discussion' ? 'fiction' : direction.id === 'explore' ? 'growth' : 'psychology';
  const extra = bookLists.find((list) => list.id === extraId)?.books ?? [];
  return [local[0], local[1], extra[0]].filter((title): title is string => Boolean(title));
}

/**
 * Deterministic local composer. The original page POSTed the request to its own
 * `/api/plan` endpoint backed by a model key; this build assembles the same
 * document shape from the selected library's facts plus the submitted inputs.
 */
export function composeDraft(inputs: PlanInputs, library: PlannerLibrary, direction: Direction): DraftResult {
  const people = clampNumber(inputs.participants, 20, 1, 200);
  const duration = clampNumber(inputs.duration, 90, 15, 240);
  const budget = clampNumber(inputs.budget, 500, 0, 20000);
  const theme = inputs.theme.trim() || '香山书房 · 下一场活动';
  const audience = inputs.audience || '社区居民';
  const stages = FLOWS[direction.id] ?? FLOWS.discussion;
  const details = FLOW_DETAILS[direction.id] ?? FLOW_DETAILS.discussion;
  const audienceNote = AUDIENCE_NOTES[audience] ?? AUDIENCE_NOTES['社区居民'];
  const notes = inputs.notes.trim();

  let cursor = 0;
  const rows = stages.map((stage, index) => {
    const minutes = Math.max(1, Math.round((duration * WEIGHTS[index]) / 100));
    const start = cursor;
    cursor += minutes;
    return `| ${clock(start * 60)}–${clock(cursor * 60)} | ${stage}（${minutes}分钟） | ${details[index]} |`;
  });

  const printCost = people * 2;
  const cardCost = people * 3;
  const total = printCost + cardCost;
  const budgetLine =
    total > budget
      ? `合计约${total}元，已超出预算上限${budget}元，需缩减物料份数或调整人数。`
      : `合计约${total}元，预算上限${budget}元，剩余${budget - total}元用于临时物料。`;

  const picks = bookPicks(direction);
  const bookLines = picks.map(
    (title) => `- ${title}：用于${direction.name}的延伸阅读，阅读后记录一句具体发现。`,
  );

  const content = `${theme}

## 一、活动定位
在${library.name}，围绕“${theme}”开展${direction.name}。${library.facts}
${direction.goal}；${direction.effort}。本稿由本地模板按书房资料与活动需求组装，用于演示策划结构，不替代运营人员的现场判断。
${notes ? `\n补充要求：${notes}` : ''}

## 二、目标人群
面向${audience}，预计${people}人参与，单场时长${duration}分钟。${audienceNote}
人数上限、报名去重口径与陪同人员统计方式需在发布前确认。

## 三、流程时间表（共${duration}分钟）
| 时间 | 环节 | 内容 |
| --- | --- | --- |
${rows.join('\n')}

分段时间按总时长等比分配，签到与散场含在首尾环节内；现场可按到场情况压缩讨论时间。

## 四、物料与预算
- 导读资料：${people}份 × 2元 = ${printCost}元（按实际人数增减）
- 体验书签：${people}份 × 3元 = ${cardCost}元
- 场地与设备：使用书房现有空间与设备，费用需现场确认

${budgetLine}
价格为演示估算，不代表真实采购报价；印刷、场地与设备费用须以实际报价核实。

## 五、延伸书单
${bookLines.join('\n')}

书目为方向建议，需由馆方核实馆藏、可借状态与版本；不以未经确认的书目对外发布。

## 六、风险与待确认项
- 场地：${direction.conditions}
- 安全：核实用电、通道、消防疏散与人员上限，儿童参与需成人陪同。
- 版权与素材：导读材料注明来源；活动照片与影像须取得参与者授权。
- 对外信息：时间、地点、报名方式在确认前统一标注“待确认”，不写尚未发生的现场成果。
- 记录口径：阅读任务完成率以到场人数为分母，需说明去重方式。

## 七、生成说明
本稿为本地演示生成 · 未经模型调用：由页面按${library.name}的项目资料、${direction.name}方向与提交的活动需求组装，未请求任何模型服务。文化事实、场地条件、预算与安全要求仍须运营人员逐项核对。`;

  return {
    content,
    sources: [library.source, operatingSource.title],
  };
}
