export type JourneyTask = {
  interest: 'local' | 'growth' | 'fiction' | 'family';
  library: string;
  col: number;
  row: number;
  title: string;
  theme: string;
  text: string;
  question: string;
};

export type JourneyRecord = {
  library: string;
  libraryId: string;
  theme: string;
  reflection: string;
  date: string;
  source: string;
};

export type JourneyState = {
  selected: string | null;
  opened: boolean;
  reflection: string;
  time: string;
  records: Record<string, JourneyRecord>;
};

export const JOURNEY_KEY = 'shuxiang-reading-journey-v3';

export const JOURNEY_TASKS: JourneyTask[] = [
  {
    interest: 'local',
    library: 'grid',
    col: 0,
    row: 0,
    title: '旧空间如何留住城市记忆？',
    theme: '城市记忆',
    text: '格子空间香山书房由工业旧楼活化而来。项目资料记录，工业结构格构被保留下来，阅读与自然课堂、艺术展览进入不同空间，书房也与岐江河景形成联系。\n\n阅读不一定只发生在书页上。建筑留下的结构也可以成为理解城市变化的线索：旧的用途改变了，一些记忆却仍能被看见。\n\n试着从“保留”与“改变”两个角度观察这间书房。哪些细节提醒人们这里曾经是什么？新用途又为今天的使用者提供了什么？',
    question: '写下一个你想保留的城市细节，以及它为什么值得被记住。',
  },
  {
    interest: 'growth',
    library: 'xiyuan',
    col: 0,
    row: 2,
    title: '家门口的书房，怎样连接日常？',
    theme: '社区与成长',
    text: '西苑社区香山书房由社区书屋升级而来。项目资料介绍了多媒体、阅读、咖啡茶歇、休闲与有声图书区域，也记录了社区与青年创业力量协作的探索。\n\n对社区而言，公共阅读空间可以成为日常生活的一个停靠点。不同的人带着不同目的进入，阅读服务与交流空间需要共同回应这些需求。\n\n请设想一次你愿意反复进行的书房日常：你会在什么时间到访？带着什么阅读问题？怎样的服务会让你愿意再次回来？',
    question: '写下一种让你愿意再次走进社区书房的阅读安排。',
  },
  {
    interest: 'fiction',
    library: 'overseas',
    col: 4,
    row: 0,
    title: '一座建筑，怎样延续公益故事？',
    theme: '人物与故事',
    text: '华侨公园香山书房从侨捐颐老院延续公益记忆。项目资料提及华侨文化主题馆藏，以及阅读区、沙龙、书吧和户外阶梯广场等公共空间。\n\n建筑用途会改变，而与它相关的公益记忆可以继续被讲述。读者不仅看到今天的空间，也能够借助可靠资料认识过去的人与事。\n\n在阅读地方故事时，区分已知事实与个人想象十分重要。可以从资料确认的线索开始，再提出希望进一步查证的问题，而不为故事补造人物或事件。',
    question: '写下一个你想进一步了解的公益或侨乡故事问题。',
  },
  {
    interest: 'family',
    library: 'zimaling',
    col: 2,
    row: 0,
    title: '树影与庭院，怎样陪伴阅读？',
    theme: '亲子与自然',
    text: '紫马岭公园香山书房位于公园环境。项目资料描述了庭院、坡道、弧墙与树影如何连接自然，以及阅读、沙龙与户外客厅等空间。\n\n亲子阅读可以从共同观察开始。孩子说出看到的形状、光线或植物，成人倾听并提出一个能够继续探索的问题，再寻找适合的阅读材料。\n\n观察与阅读并不需要争夺注意力。试着把一个眼前的自然细节变成阅读问题，让书房里的内容回应真实的好奇。',
    question: '写下一项亲子观察，以及由它引出的阅读问题。',
  },
];

export const EMPTY_JOURNEY: JourneyState = {
  selected: null,
  opened: false,
  reflection: '',
  time: '5',
  records: {},
};
