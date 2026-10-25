import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import BookTabs from '@/components/pages/book-tabs';
import SiteFooter from '@/components/site-footer';

export const metadata: Metadata = {
  title: '数字运营方案｜「数」香满屋',
  description: '数字文化护照、AI智慧运营、活动策划、热门书单与香山书房IP建设。',
};

const PILLARS = [
  {
    no: '01',
    title: '数字文化地图',
    copy: '点位、建筑故事、本土文化、活动、书单与周边路线统一进入书房档案。',
  },
  {
    no: '02',
    title: '数字文化护照',
    copy: '按兴趣和时间荐读，完成任务后生成阅读卡、徽章与积分。',
  },
  {
    no: '03',
    title: 'AI智慧运营',
    copy: '辅助生成活动方案、执行清单、传播内容与复盘建议，由人工审核把关。',
  },
];

const LOOP = ['书房资源', '读者到访', '阅读与活动', '数据反馈'];

const STEPS = ['扫码进入', '按兴趣与时间荐读', '完成轻阅读任务', '生成阅读卡', '点亮徽章与积分'];

const QUARTERS = [
  { tag: 'Q1 · 1—3月', title: '灯映香山', copy: '小榄元宵花灯、历史故事、花灯手作与作品展。' },
  { tag: 'Q2 · 4—6月', title: '青染岐江', copy: '岭南扎染、水乡生活史与可传播的手作成果。' },
  { tag: 'Q3 · 7—9月', title: '龙纹耀香山', copy: '醉龙文化、地方文献与青少年纹样手绘。' },
  { tag: 'Q4 · 10—12月', title: '侨韵留痕', copy: '侨乡记忆、复古印章明信片与年度作品联展。' },
];

const ACTIVITY_STAGES = [
  { no: '活动前', title: '五周筹备', copy: '主题、嘉宾、场地、物料、招募和应急预案进入标准清单。' },
  { no: '活动中', title: '阅读＋体验＋讨论', copy: '避免只做手作打卡，用馆藏和本地故事建立内容锚点。' },
  { no: '活动后', title: '传播＋复盘＋沉淀', copy: '回顾内容、主持稿、话题库和读者反馈进入运营知识库。' },
];

const AI_STAGES = [
  {
    no: '01 · 策划',
    title: '主题变方案',
    copy: '输入受众、人数、时长和预算，生成定位、流程、物料与延伸书单。',
  },
  {
    no: '02 · 执行',
    title: '方案变清单',
    copy: '结合场地容量、设备和活动模板拆解准备事项。',
  },
  {
    no: '03 · 传播',
    title: '素材变内容',
    copy: '分别适配公众号、视频号、小红书和朋友圈，不做简单复制。',
  },
  {
    no: '04 · 沉淀',
    title: '经验变资产',
    copy: '采用稿、现场素材与复盘进入知识库，供后续策划参考。',
  },
];

const IP_IMAGES = [
  { src: '/assets/ip/ip1.jpg', alt: '阅小筑IP系列' },
  { src: '/assets/ip/ip8.jpg', alt: '小窗榕榕IP玩偶' },
  { src: '/assets/ip/ip7.jpg', alt: '小窗榕榕IP应用' },
  { src: '/assets/ip/ip2.jpg', alt: '阅小筑笔记本' },
  { src: '/assets/ip/ip10.jpg', alt: '小窗榕榕钥匙扣' },
  { src: '/assets/ip/ip12.jpg', alt: '小窗榕榕文具系列' },
];

export default function SolutionPage() {
  return (
    <>
      <nav className="subnav">
        <div className="wrap">
          <a href="#overview">总体方案</a>
          <a href="#passport">文化护照</a>
          <a href="#activities">活动体系</a>
          <a href="#ai">AI运营</a>
          <a href="#books">热门书单</a>
          <a href="#ip">IP建设</a>
        </div>
      </nav>

      <main id="main">
        <div className="page-hero">
          <div className="wrap">
            <div className="crumb">首页 / 数字运营方案</div>
            <h1>让空间有故事、阅读有反馈、运营有帮手</h1>
            <p>六类内容不再分散陈述，而是连接成可分阶段启用的数字运营闭环。</p>
          </div>
        </div>

        <section id="overview">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">壹 · 总体方案</div>
              <div>
                <h2>不是另造平台，而是把现有资源接成一张网</h2>
                <p>前台服务读者，后台帮助运营者，线下书房提供真实空间，数据回流用于下一轮策划。</p>
              </div>
            </div>
            <div className="grid three">
              {PILLARS.map((pillar) => (
                <article className="card" key={pillar.no}>
                  <span className="num">{pillar.no}</span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.copy}</p>
                </article>
              ))}
            </div>
            <div className="loop" style={{ marginTop: 24 }}>
              {LOOP.map((item, index) => (
                <Fragment key={item}>
                  {index > 0 ? <span className="arrow">→</span> : null}
                  <span>{item}</span>
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        <section className="alt" id="passport">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">贰 · 数字文化护照</div>
              <div>
                <h2>把一次到访，变成可积累的阅读旅程</h2>
                <p>利用书房特色徽章连接到访、荐读、轻任务、感悟记录、分享和再次参与。</p>
              </div>
            </div>
            <div className="feature-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/passport/badge-collection.jpg" alt="20枚香山书房数字文化护照徽章设计" />
              <div>
                <div className="step-flow">
                  {STEPS.map((step, index) => (
                    <div className="step" key={step}>
                      <b>{String(index + 1).padStart(2, '0')}</b>
                      {step}
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 22 }}>
                  护照采用自愿参与与轻量反馈，不宣称普通网页能够锁定手机系统；运营数据只服务于内容优化与活动复盘。
                </p>
                <Link className="btn primary" href="/experience#passport-lab">
                  体验文化护照
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="activities">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">叁 · 活动体系</div>
              <div>
                <h2>非遗课堂＋阅谈会，形成年度内容主线</h2>
                <p>活动不是孤立场次，而是与馆藏、空间、节气、IP和传播内容共同形成可复用产品。</p>
              </div>
            </div>
            <div className="quarter-grid">
              {QUARTERS.map((quarter) => (
                <article className="quarter" key={quarter.tag}>
                  <strong>{quarter.tag}</strong>
                  <h3>{quarter.title}</h3>
                  <p>{quarter.copy}</p>
                </article>
              ))}
            </div>
            <div className="grid three" style={{ marginTop: 20 }}>
              {ACTIVITY_STAGES.map((stage) => (
                <article className="card" key={stage.no}>
                  <span className="num">{stage.no}</span>
                  <h3>{stage.title}</h3>
                  <p>{stage.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="alt" id="ai">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">肆 · AI智能运营</div>
              <div>
                <h2>让一个好想法，更快变成能落地的活动</h2>
                <p>系统围绕策划、执行、传播和沉淀四个阶段工作，最终判断权保留给运营人员。</p>
              </div>
            </div>
            <div className="grid four">
              {AI_STAGES.map((stage) => (
                <article className="card" key={stage.no}>
                  <span className="num">{stage.no}</span>
                  <h3>{stage.title}</h3>
                  <p>{stage.copy}</p>
                </article>
              ))}
            </div>
            <div className="button-row">
              <Link className="btn primary" href="/experience#ai-lab">
                试用AI活动策划
              </Link>
            </div>
          </div>
        </section>

        <section id="books">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">伍 · 热门书单</div>
              <div>
                <h2>从借阅热度出发，也为中山本土阅读留一席之地</h2>
                <p>书单服务于荐读、主题书角和活动延伸，不单独作为静态榜单存在。</p>
              </div>
            </div>
            <BookTabs />
          </div>
        </section>

        <section className="alt" id="ip">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">陆 · IP建设</div>
              <div>
                <h2>把“一房一特色”变成能被记住和带走的文化角色</h2>
                <p>
                  “阅小筑”回应社区阅读，“小窗榕榕”连接尚园花窗、榕荫和古城记忆，并延伸至文具、日用品与收藏品。
                </p>
              </div>
            </div>
            <div className="ip-grid">
              {IP_IMAGES.map((image) => (
                <a key={image.src} href={image.src} target="_blank">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={image.alt} />
                </a>
              ))}
            </div>
          </div>
        </section>

        <div className="wrap page-turn">
          <Link href="/libraries">
            <small>上一章</small>
            <b>认识香山书房</b>
          </Link>
          <Link href="/experience">
            <small>下一章</small>
            <b>进入在线体验</b>
          </Link>
        </div>
      </main>

      <SiteFooter subtitle="数字运营方案" right="护照、活动、AI、书单与IP统一闭环" />
    </>
  );
}
