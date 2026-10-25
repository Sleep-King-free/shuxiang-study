export type PointType = 'urban' | 'park' | 'culture' | 'community';

export type Point = {
  name: string;
  area: string;
  type: PointType;
  detail: string;
};

export const pointTypes: Record<PointType, string> = {
  urban: '城市更新',
  park: '公园生态',
  culture: '文化传承',
  community: '社区服务',
};

/** 21 representative reading points (source: libraries.html data block). */
export const points: Point[] = [
  { name: '格子空间香山书房', area: '石岐街道', type: 'urban', detail: '工业旧楼改造 · 857㎡ · 藏书约5000册' },
  { name: '西区荔景苑香山书房', area: '西区', type: 'culture', detail: '醉龙非遗 · 醉龙咖啡 · 社区文化' },
  { name: '紫马岭公园香山书房', area: '东区', type: 'park', detail: '611㎡ · 藏书约8000册 · 生态融合' },
  { name: '非遗主题香山书房', area: '东区', type: 'culture', detail: '本土非遗 · 馆房融合 · 文化体验' },
  { name: '华侨公园香山书房', area: '东区', type: 'urban', detail: '颐老院活化 · 侨文化主题' },
  { name: '金钟湖公园香山书房', area: '东区', type: 'park', detail: '依山傍水 · 毗邻香山书院' },
  { name: '南区沙涌学校旧址香山书房', area: '南区', type: 'culture', detail: '华侨旧校舍活化 · 校史记忆' },
  { name: '三乡桥头稻田香山书房', area: '三乡镇', type: 'park', detail: '玻璃书屋 · 稻田景观 · 二十四节气' },
  { name: '三乡雍陌香山书房', area: '三乡镇', type: 'culture', detail: '百年华侨楼 · 郑观应故居' },
  { name: '板芙里溪香山书房', area: '板芙镇', type: 'culture', detail: '红色文化 · 葡萄产业 · 乡村阅读' },
  { name: '西区西苑社区香山书房', area: '西区', type: 'community', detail: '170㎡ · 藏书7513册 · 人才创梦咖啡' },
  { name: '火炬得能湖公园香山书房', area: '火炬开发区', type: 'park', detail: '湖光翠影 · 志愿服务驿站' },
  { name: '小榄五棵榕香山书房', area: '小榄镇', type: 'community', detail: '古榕树下 · 家门口自习室' },
  { name: '小榄宁徽园香山书房', area: '小榄镇', type: 'culture', detail: '百年徽派古建 · 科普博物馆' },
  { name: '阜沙阜圩里香山书房', area: '阜沙镇', type: 'culture', detail: '旧粮仓活化 · 农耕文化' },
  { name: '东凤西罟步村香山书房', area: '东凤镇', type: 'community', detail: '村史馆融合 · 乡村公共文化' },
  { name: '大涌安堂社区香山书房', area: '大涌镇', type: 'community', detail: '竹林古巷 · 社区阅读' },
  { name: '三角公园香山书房', area: '三角镇', type: 'park', detail: '公园阅读 · 高人气点位' },
  { name: '城建集团香山书房', area: '东区商圈', type: 'urban', detail: '商圈嵌入 · 藏书5000册' },
  { name: '康方湾区科技园香山书房', area: '翠亨新区', type: 'urban', detail: '科创园区 · 人才文化空间' },
  { name: '盈悦·邻里文化家香山书房', area: '板芙镇', type: 'community', detail: '民企共建 · 公益讲座 · 少儿合唱' },
];

export type Profile = {
  id: string;
  no: string;
  name: string;
  facts: string[];
  body: string;
};

export const profiles: Profile[] = [
  {
    id: 'xiyuan',
    no: '01 · COMMUNITY',
    name: '西苑社区香山书房',
    facts: ['翠景道南17号', '170㎡', '藏书7513册', '8:30—21:00'],
    body: '由原社区书屋升级而来，设置多媒体、阅读、咖啡茶歇、休闲和有声图书五区，并探索社区与青年创业力量协作的“人才引育”模式。',
  },
  {
    id: 'zimaling',
    no: '02 · PARK',
    name: '紫马岭公园香山书房',
    facts: ['紫马岭公园南面草坪', '611㎡', '藏书约8000册', '2023年开放'],
    body: '建筑部分埋入土地，通过庭院、坡道、弧墙与树影降低体量感，形成香山书房、香山沙龙、户外客厅与书房餐饮四类空间。',
  },
  {
    id: 'grid',
    no: '03 · REBIRTH',
    name: '格子空间香山书房',
    facts: ['石岐街道星晨路西', '857.11㎡', '藏书约5000册', '2022年开放'],
    body: '拆除近80%旧体量，以“轻和透”为核心保留工业结构格构。A栋承担阅读与自然课堂，B栋用于当代艺术展览，六米书墙与岐江河景共同形成“格构园林”。',
  },
  {
    id: 'overseas',
    no: '04 · OVERSEAS',
    name: '华侨公园香山书房',
    facts: ['华侨公园文华坊1号楼', '约628㎡', '藏书约1万册', '2024年试运营'],
    body: '从侨捐颐老院延续公益记忆，以华侨文化主题馆藏、阅读区、沙龙、书吧和户外阶梯广场构成城市文化客厅。',
  },
  {
    id: 'shangyuan',
    no: '05 · OLD TOWN',
    name: '尚园香山书房',
    facts: ['香山古城核心区', '旧市场活化', '2022年开馆', '三大常设展区'],
    body: '保留旧光明市场骨架，以中式花窗、传统瓦面和院中榕树连接街坊、游客与非遗；“香山·人／物／声”微展把地方文化带入日常阅读。',
  },
];

export const bookLists = [
  {
    id: 'local',
    title: '中山本土阅读',
    books: [
      '《岐江风物志》',
      '《香山侨韵》',
      '《中山历史文化读本》',
      '《香山县志》',
      '《中山民俗大观》',
      '《香山人物传略》',
      '《岐江夜话》',
      '《中山侨批档案选编》',
      '《五邑香山华侨史》',
      '《中山老街旧事》',
    ],
  },
  {
    id: 'psychology',
    title: '心理',
    books: ['《蛤蟆先生去看心理医生》', '《被讨厌的勇气》', '《也许你该找个人聊聊》', '《非暴力沟通》', '《我们内心的冲突》', '《少有人走的路》'],
  },
  {
    id: 'growth',
    title: '成长',
    books: ['《纳瓦尔宝典》', '《刻意练习》', '《把时间当作朋友》', '《认知觉醒》', '《原子习惯》', '《终身成长》'],
  },
  {
    id: 'fiction',
    title: '小说',
    books: ['《一句顶一万句》', '《平凡的世界》', '《活着》', '《三体》', '《长安的荔枝》', '《繁花》'],
  },
];

export type PlannerLibrary = {
  id: string;
  name: string;
  source: string;
  href: string;
  facts: string;
  image?: string;
};

/** Library facts surfaced by the AI planner (source: knowledge.js). */
export const plannerLibraries: PlannerLibrary[] = [
  {
    id: 'grid',
    name: '格子空间香山书房',
    source: '格子空间香山书房-背调材料(1).docx',
    href: '/libraries#grid',
    facts: '工业旧楼活化，保留工业结构格构。A栋承担阅读与自然课堂，B栋用于当代艺术展览，空间连接岐江河景。',
    image: '/assets/distribution/01-grid-space.png',
  },
  {
    id: 'xiyuan',
    name: '西苑社区香山书房',
    source: '西苑社区香山书房背景材料.docx',
    href: '/libraries#xiyuan',
    facts: '由社区书屋升级而来，设置多媒体、阅读、咖啡茶歇、休闲和有声图书区域，探索社区与青年创业力量协作。',
    image: '/assets/distribution/11-xiyuan-community.png',
  },
  {
    id: 'zimaling',
    name: '紫马岭公园香山书房',
    source: '紫马岭香山书房背景材料.docx',
    href: '/libraries#zimaling',
    facts: '位于公园环境，建筑通过庭院、坡道、弧墙与树影连接自然，包含阅读、沙龙和户外客厅等空间。',
    image: '/assets/distribution/03-zimaling.png',
  },
  {
    id: 'overseas',
    name: '华侨公园香山书房',
    source: '华侨公园香山书房背景材料.docx',
    href: '/libraries#overseas',
    facts: '从侨捐颐老院延续公益记忆，以华侨文化主题馆藏、阅读区、沙龙、书吧和户外阶梯广场构成公共文化空间。',
  },
  {
    id: 'shangyuan',
    name: '尚园香山书房',
    source: '尚园香山书房背景材料.docx',
    href: '/libraries#shangyuan',
    facts: '位于香山古城核心区，保留旧光明市场骨架，以花窗、瓦面、榕树连接地方生活；设有“香山·人／物／声”微展。',
  },
];

export const operatingSource = {
  title: 'AI 智慧运营系统设计方案.docx',
  summary:
    '策划、执行、宣传、沉淀四阶段；输出流程、主持稿、物料、预算和延伸阅读；文化事实、时间地点、预算与安全由运营人员审核。',
};

export const directions = [
  {
    id: 'discussion',
    name: '阅读讨论',
    goal: '以共同阅读和观点交流为主',
    conditions: '阅读材料、讨论空间与主持人待确认',
    effort: '轻物料，重主持与阅读引导',
  },
  {
    id: 'culture',
    name: '文化体验',
    goal: '以地方文化解读与参与体验为主',
    conditions: '文化内容、导师与操作安全待确认',
    effort: '需核对材料成本与体验条件',
  },
  {
    id: 'explore',
    name: '空间探索',
    goal: '以空间观察、地方故事与阅读结合',
    conditions: '路线、天气、通行与场地授权待确认',
    effort: '需现场踏勘，控制移动范围',
  },
];
