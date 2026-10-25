import type { Metadata } from 'next';
import Link from 'next/link';
import Cinematic from '@/components/cinematic/cinematic';
import CineOpenButton from '@/components/cine-open-button';
import SiteFooter from '@/components/site-footer';

export const metadata: Metadata = {
  title: '「数」香满屋｜香山书房数字文化运营实践',
  description: '认识中山香山书房网络，了解数字文化护照、AI智慧运营、活动策划与调研成果。',
};

const ROUTES = [
  {
    href: '/libraries',
    no: '01',
    title: '认识香山书房',
    copy: '政策背景、106个阅读节点、石岐六间代表性书房地图与五间重点书房档案。',
    cta: '进入书房网络',
  },
  {
    href: '/solution',
    no: '02',
    title: '数字运营方案',
    copy: '数字文化护照、活动体系、AI智慧运营、热门书单和IP建设构成运营闭环。',
    cta: '查看运营闭环',
  },
  {
    href: '/experience',
    no: '03',
    title: 'AI运营工作台',
    copy: '以活动策划为起点，连接宣传制作、阅读任务与复盘档案，让内容与经验持续积累。',
    cta: '进入运营工作台',
  },
  {
    href: '/evidence',
    no: '04',
    title: '证据与成果',
    copy: '问卷、访谈、走访、活动分析与阶段成果共同说明问题来源和方案边界。',
    cta: '核对证据链',
  },
];

const PROOF = [
  { value: '948', label: '份有效读者问卷' },
  { value: '58%', label: '首要目的为拍照、游览' },
  { value: '52%', label: '停留时间不足30分钟' },
  { value: '34%', label: '以阅读、学习为主要目的' },
];

export default function Home() {
  return (
    <>
      <main id="main">
        <section className="hero home-hero">
          <div className="wrap hero-grid">
            <div className="hero-copy reveal">
              <div className="eyebrow">ZHONGSHAN · 106 READING SPACES</div>
              <h1>
                「数」香
                <br />
                <span className="accent">满屋</span>
              </h1>
              <p className="hero-sub">
                从一间书房进入一座阅读城市：106个公共阅读节点、20枚数字文化护照徽章与AI运营方法，共同把“打卡流量”转化为“阅读留量”。
              </p>
              <div className="hero-actions">
                <Link className="btn primary" href="/libraries">
                  展开城市阅读长卷
                </Link>
                <Link className="btn light" href="/experience">
                  体验AI活动策划
                </Link>
                <CineOpenButton className="btn light">观看电影序章</CineOpenButton>
              </div>
              <div className="hero-proof" aria-label="项目关键事实">
                <span>
                  <b>948</b>有效问卷
                </span>
                <span>
                  <b>4</b>组深度访谈
                </span>
                <span>
                  <b>30+</b>点位走访
                </span>
              </div>
            </div>
            <div className="hero-visual city-scroll reveal" aria-label="石岐书房地图与数字护照视觉">
              <div className="scroll-map">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/distribution/shiqi-map.jpg" alt="中山石岐街道六间香山书房地图" />
                <span className="route-line" aria-hidden="true" />
              </div>
              <div className="passport-peek">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/passport/badge-collection.jpg" alt="20枚香山书房数字文化护照徽章" />
                <div>
                  <strong>20枚徽章</strong>
                  <span>把到访、阅读、活动和反馈连成可持续旅程</span>
                </div>
              </div>
              <div className="hero-note">
                <strong>106</strong>
                <span>所香山书房覆盖中山23个镇街，形成家门口的公共文化网络。</span>
              </div>
            </div>
          </div>
        </section>

        <section className="alt home-route" id="story">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">城市阅读长卷</div>
              <div>
                <h2>沿岐江展开的，不只是一张地图，而是一套公共阅读网络</h2>
                <p>从书房分布到阅读参与，从活动运营到证据回流，香山书房的数字文化运营被串联成一条可持续生长的城市阅读路径。</p>
              </div>
            </div>
            <div className="route-board reveal" aria-label="项目路径">
              {ROUTES.map((route) => (
                <Link className="route-stop" href={route.href} key={route.href}>
                  <span>{route.no}</span>
                  <h3>{route.title}</h3>
                  <p>{route.copy}</p>
                  <b>{route.cta}</b>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="proof-section">
          <div className="wrap proof-grid">
            <div className="proof-copy reveal">
              <div className="section-no">证据底座</div>
              <h2>从“有人来”，走向“愿意留下”</h2>
              <p>
                打卡不是问题，真正的问题是到访之后能否形成阅读、参与、记录与再次到访。问卷、访谈和点位走访共同指向这一转化命题。
              </p>
              <Link className="btn light" href="/evidence">
                查看数据口径
              </Link>
            </div>
            <div className="stat-grid proof-stats reveal">
              {PROOF.map((item) => (
                <div className="stat" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="alt system-section">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">运营闭环</div>
              <div>
                <h2>地图、护照、活动和AI不是四个功能，而是一套公共阅读运营系统</h2>
                <p>线下书房提供真实空间，数字护照承接轻阅读参与，AI运营辅助策划与复盘，最终让每间书房的故事被持续激活。</p>
              </div>
            </div>
            <div className="system-stage reveal">
              <div className="system-main">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/passport/badge-collection.jpg" alt="数字文化护照20枚徽章" />
                <div className="system-caption">
                  <b>文化护照</b>
                  <span>以徽章、任务和积分记录阅读旅程</span>
                </div>
              </div>
              <div className="system-flow" aria-label="运营闭环步骤">
                <div>
                  <span>空间</span>
                  <h3>数字文化地图</h3>
                  <p>把建筑、非遗、侨乡记忆、书单和周边路线组织成“一房一特色”。</p>
                </div>
                <div>
                  <span>参与</span>
                  <h3>数字文化护照</h3>
                  <p>到访、荐读、任务、感悟、徽章和积分形成可持续的轻阅读旅程。</p>
                </div>
                <div>
                  <span>运营</span>
                  <h3>AI智慧运营</h3>
                  <p>辅助策划、执行、传播与复盘，采用稿和真实案例继续进入知识库。</p>
                </div>
              </div>
            </div>
            <div className="button-row">
              <Link className="btn primary" href="/solution">
                查看完整方案
              </Link>
              <Link className="btn light" href="/experience">
                体验AI活动策划
              </Link>
            </div>
          </div>
        </section>

        <section className="cinematic-bridge">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">电影序章</div>
              <div>
                <h2>用一段影像建立情绪，再回到真实书房与真实数据</h2>
                <p>
                  序章仍为可选择观看：桌面滚动或回车推进；手机左滑前进、右滑返回。电影负责第一眼的完成度，正文负责讲清事实、方案和边界。
                </p>
                <CineOpenButton className="btn clay">开始观看</CineOpenButton>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        subtitle="香山书房数字文化运营实践"
        right={
          <>
            项目材料更新至2026年8月
            <br />
            数据来源：项目问卷与访谈、政府公开资料及书房背景材料
          </>
        }
      />

      <Cinematic />
    </>
  );
}
