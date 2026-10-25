import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/site-footer';

export const metadata: Metadata = {
  title: '证据与成果｜「数」香满屋',
  description: '香山书房问卷、访谈、活动数据、问题分析、试点成果与创新价值。',
};

const METHODS = [
  {
    value: '948',
    title: '有效问卷',
    copy: '形成到访目的、停留时间、阅读行为与需求偏好的总体画像。',
  },
  {
    value: '4',
    title: '组深度访谈',
    copy: '覆盖亲子、自习、游客和运营相关人群，补足数据背后的原因。',
  },
  {
    value: '30+',
    title: '点位走访',
    copy: '观察书房与社区、公园、商圈、古城及产业场景的真实连接。',
  },
  {
    value: '300+',
    title: '人次试点参与',
    copy: '用于检验活动、数字护照和内容产品的可理解性与参与路径。',
  },
];

const PROBLEMS = [
  {
    no: '空间同质化',
    title: '特色停留在装饰层',
    copy: '本土元素缺少完整故事、数字展示和可带走的文化记忆，点位之间辨识度不足。',
  },
  {
    no: '阅读浅层化',
    title: '58%以拍照游览为首要目的',
    copy: '52%停留不足30分钟。需要提供适合碎片时间的阅读入口，而不是要求游客读完大部头。',
  },
  {
    no: '运营传统化',
    title: '活动与传播难以沉淀',
    copy: '主题零散、宣传依赖人工、复盘缺少数据回流，基层人员容易每次从零开始。',
  },
];

const CONFLICTS = [
  {
    no: '用户冲突',
    title: '同一空间，两类期待',
    copy: '周末亲子活动与自习读者对安静程度的要求不同，旺季还面临座位紧缺与儿童读物不足。',
  },
  {
    no: '对应方向',
    title: '分时、分区、分众运营',
    copy: '通过活动预约、场景提示、荐读和数据反馈，把空间管理从统一规则转向更精细的服务。',
  },
];

const ACTIVITY_INSIGHTS = [
  { no: '主题', title: '从单场到季度IP', copy: '用四季非遗课堂和阅谈会形成持续、可识别的内容节奏。' },
  { no: '阅读', title: '每场活动连接馆藏', copy: '活动前设置主题书角，活动后提供延伸书单与轻任务。' },
  { no: '传播', title: '一次素材，多端表达', copy: '针对不同平台分别生成内容，而不是复制同一篇回顾。' },
  { no: '复盘', title: '从人次走向质量', copy: '同时记录到场、完成、反馈、分享、借阅与再次参与。' },
];

const OUTCOMES = [
  { no: '阶段一', title: '调研与问题定义', copy: '形成问卷、访谈、点位背调、活动分析与四大核心问题。' },
  {
    no: '阶段二',
    title: '方案与内容产品',
    copy: '完成数字文化护照、AI运营方案、活动策划、热门书单与IP形象探索。',
  },
  {
    no: '阶段三',
    title: '互动体验与传播样片',
    copy: '形成在线体验与电影感序章，验证从品牌吸引到信息理解的路径。',
  },
];

const VALUES = [
  { title: '空间辨识', copy: '以地图、档案和IP放大“一房一特色”。' },
  { title: '阅读转化', copy: '用时间友好的轻任务承接打卡流量。' },
  { title: '活动品牌', copy: '把零散场次组织成季度内容主线。' },
  { title: '运营提效', copy: 'AI辅助策划、传播和知识沉淀。' },
  { title: '数据复盘', copy: '从单一人流指标转向参与质量。' },
  { title: '文化记忆', copy: '让地方故事可看、可读、可参与、可带走。' },
];

export default function EvidencePage() {
  return (
    <>
      <nav className="subnav">
        <div className="wrap">
          <a href="#method">调研方法</a>
          <a href="#problems">问题证据</a>
          <a href="#activity">活动分析</a>
          <a href="#outcomes">实践成果</a>
          <a href="#sources">数据边界</a>
        </div>
      </nav>

      <main id="main">
        <div className="page-hero">
          <div className="wrap">
            <div className="crumb">首页 / 证据与成果</div>
            <h1>问题有依据，方案有对应，成果有边界</h1>
            <p>
              问卷、访谈、活动材料、对标案例和阶段成果共同构成“数据—发现—方案—验证”的证据链。
            </p>
          </div>
        </div>

        <section id="method">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">壹 · 调研方法</div>
              <div>
                <h2>从数据到现场，再回到具体使用者</h2>
                <p>定量问卷用于观察总体倾向，深度访谈用于理解冲突与动机，点位走访用于确认空间与运营条件。</p>
              </div>
            </div>
            <div className="grid four">
              {METHODS.map((item) => (
                <article className="card evidence-card" key={item.title}>
                  <div className="big-data">{item.value}</div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="alt" id="problems">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">贰 · 问题证据</div>
              <div>
                <h2>从“打卡流量”到“阅读留量”的三道关口</h2>
                <p>打卡带来可见度，但空间特色、阅读转化和运营效率决定这种关注能否留下。</p>
              </div>
            </div>
            <div className="grid three problem-grid">
              {PROBLEMS.map((item) => (
                <article className="card" key={item.title}>
                  <span className="num">{item.no}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
            <div className="grid two" style={{ marginTop: 18 }}>
              {CONFLICTS.map((item) => (
                <article className="card" key={item.title}>
                  <span className="num">{item.no}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="activity">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">叁 · 活动分析</div>
              <div>
                <h2>活动很多，但仍需要稳定内容主线</h2>
                <p>
                  2026年上半年活动分析显示，节庆、亲子、非遗与阅读活动构成主要供给；下一步重点是形成季度品牌、延伸书单和复盘指标。
                </p>
              </div>
            </div>
            <div className="grid four">
              {ACTIVITY_INSIGHTS.map((item) => (
                <article className="card" key={item.title}>
                  <span className="num">{item.no}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="alt" id="outcomes">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">肆 · 实践成果</div>
              <div>
                <h2>完成“调研—设计—验证”的第一轮闭环</h2>
                <p>现阶段成果聚焦方向验证、流程跑通和内容复用，为后续接入真实运营系统留下清晰边界。</p>
              </div>
            </div>
            <div className="grid three">
              {OUTCOMES.map((item) => (
                <article className="card" key={item.title}>
                  <span className="num">{item.no}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
            <div className="section-head" style={{ marginTop: 58 }}>
              <div className="section-no">五类价值</div>
              <div>
                <h2>让书房成为愿意绕几步路去的地方</h2>
              </div>
            </div>
            <div className="grid three">
              {VALUES.map((item) => (
                <article className="card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="sources">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">伍 · 数据边界</div>
              <div>
                <h2>来源清楚，口径可核对</h2>
                <p>
                  本页内容来自项目问卷与访谈、粤书吧与香山书房背景材料、2026年上半年活动分析、建设建议书、活动策划书及政府公开资料。时间敏感数据以材料标注日期为准。
                </p>
              </div>
            </div>
            <div className="card source-list">
              <p>
                <b>定量证据：</b>香山书房读者调查问卷与活动统计。
              </p>
              <p>
                <b>定性证据：</b>“打卡还是阅读”访谈、用户建议书和五间书房背景材料。
              </p>
              <p>
                <b>方案材料：</b>数字文化护照平台、AI智慧运营、非遗课堂、读书讨论与成果创新点。
              </p>
              <p>
                <b>公开资料：</b>国家与广东公共文化政策、中山相关建设与运营信息。
              </p>
            </div>
          </div>
        </section>

        <div className="wrap page-turn">
          <Link href="/experience">
            <small>上一章</small>
            <b>在线体验</b>
          </Link>
          <Link href="/">
            <small>回到起点</small>
            <b>返回首页</b>
          </Link>
        </div>
      </main>

      <SiteFooter subtitle="证据与成果" right="以事实为依据，以阶段成果为边界" />
    </>
  );
}
