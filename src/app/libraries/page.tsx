import type { Metadata } from 'next';
import Link from 'next/link';
import PointExplorer from '@/components/pages/point-explorer';
import SiteFooter from '@/components/site-footer';
import { profiles } from '@/lib/content';
import { MAP_IMG } from '@/lib/img-props';

export const metadata: Metadata = {
  title: '认识香山书房｜「数」香满屋',
  description: '香山书房政策背景、全市分布、石岐地图、21个代表性点位与五间重点书房档案。',
};

const STATS = [
  { value: '380+', label: '全省粤书吧（截至2023年）' },
  { value: '106', label: '中山香山书房（截至2025年底）' },
  { value: '23', label: '镇街实现覆盖' },
  { value: '2.3万㎡', label: '书房总建筑面积约' },
];

const POLICY = [
  {
    time: '国家战略',
    title: '健全现代公共文化服务体系',
    copy: '党的十八大以来持续推进公共文化服务体系建设；党的二十大报告进一步提出健全现代公共文化服务体系和基层公共文化设施网络。',
  },
  {
    time: '“十四五”时期',
    title: '完善基层公共文化设施网络',
    copy: '相关规划强调公共文化服务提质增效，鼓励打造具有地域特色、融入日常生活的新型公共文化空间。',
  },
  {
    time: '2020年',
    title: '广东启动“粤书吧”试点',
    copy: '《广东省“粤书吧”建设指引（试行）》推动阅读空间进入景区、社区、商业街区、交通站场等多元场景。',
  },
  {
    time: '2022年',
    title: '中山首批香山书房试运行',
    copy: '首批15家香山书房建成试运行，逐步形成“百家书房、百般精彩”的城市公共阅读品牌。',
  },
  {
    time: '2025年',
    title: '进入规范化、可持续运营阶段',
    copy: '中山市相关建设申报和运营发展指引进一步明确建设、申报与运营主体及布点要求。',
  },
];

const ROUTE_NOTES = [
  '工业旧楼与城市更新',
  '醉龙非遗与社区文化',
  '公园生态与建筑共生',
  '非遗展示与体验课堂',
  '侨文化记忆与公益延续',
  '社区服务与青年人才',
];

export default function LibrariesPage() {
  return (
    <>
      <nav className="subnav" aria-label="本页目录">
        <div className="wrap">
          <a href="#overview">总体网络</a>
          <a href="#policy">政策支持</a>
          <a href="#distribution">书房分布</a>
          <a href="#profiles">重点书房</a>
        </div>
      </nav>

      <main id="main">
        <div className="page-hero">
          <div className="wrap">
            <div className="crumb">首页 / 认识香山书房</div>
            <h1>从全省公共文化网络，走进中山106个阅读节点</h1>
            <p>政策、城市、社区、公园、旧建筑与在地文化，共同构成香山书房的空间网络。</p>
          </div>
        </div>

        <section id="overview">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">壹 · 总体网络</div>
              <div>
                <h2>百家书房，百般精彩</h2>
                <p>
                  香山书房覆盖中山23个镇街，以政府主导、社会参与和“一房一特色”的方式，把阅读嵌入社区、公园、商圈、古建与产业空间。
                </p>
              </div>
            </div>
            <div className="stat-grid">
              {STATS.map((stat) => (
                <div className="stat" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="alt" id="policy">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">贰 · 政策支持</div>
              <div>
                <h2>从文化强国要求，到家门口的阅读空间</h2>
                <p>国家公共文化服务要求经广东制度承接，再落到中山基层空间建设与运营规范。</p>
              </div>
            </div>
            <div className="policy-timeline reveal">
              {POLICY.map((item) => (
                <article className="policy-item" key={item.time}>
                  <time>{item.time}</time>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="distribution">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">叁 · 书房分布</div>
              <div>
                <h2>六间书房，一条可步入的石岐阅读路线</h2>
                <p>
                  地图呈现格子空间、西区荔景苑、紫马岭、非遗主题、华侨公园和西苑社区六个代表点位及其周边生活场景。
                </p>
              </div>
            </div>
            <div className="map-layout">
              <figure className="map-frame reveal">
                <a href="/assets/distribution/shiqi-map.jpg" target="_blank">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img {...MAP_IMG} alt="中山石岐街道香山书房地图" loading="lazy" decoding="async" />
                </a>
                <figcaption>
                  点击查看原图。该图展示石岐代表点位，不等同于全市106所书房完整分布。
                </figcaption>
              </figure>
              <aside className="map-copy reveal">
                <div className="kicker">SHIQI READING ROUTE</div>
                <h3>六种场景，六种阅读关系</h3>
                <ol>
                  {ROUTE_NOTES.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ol>
              </aside>
            </div>
            <div className="section-head" style={{ marginTop: 60 }}>
              <div className="section-no">21个代表点位</div>
              <div>
                <h2>按空间类型快速浏览</h2>
                <p>手机端默认显示前6个点位，可按需展开，避免一次性穿过过长列表。</p>
              </div>
            </div>
            <PointExplorer />
          </div>
        </section>

        <section className="alt" id="profiles">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="section-no">肆 · 重点书房</div>
              <div>
                <h2>五间书房，五种公共文化空间答案</h2>
                <p>采用折叠档案代替整页铺开，先定位书房，再阅读空间、运营与文化特色。</p>
              </div>
            </div>
            <div className="profile-index">
              <a href="#xiyuan">西苑社区</a>
              <a href="#zimaling">紫马岭</a>
              <a href="#grid">格子空间</a>
              <a href="#overseas">华侨公园</a>
              <a href="#shangyuan">尚园</a>
            </div>
            {profiles.map((profile) => (
              <details className="profile" id={profile.id} key={profile.id}>
                <summary>
                  <span className="profile-no">{profile.no}</span>
                  <h3>{profile.name}</h3>
                </summary>
                <div className="profile-body">
                  <div className="facts">
                    {profile.facts.map((fact) => (
                      <span key={fact}>{fact}</span>
                    ))}
                  </div>
                  <p>{profile.body}</p>
                  <div className="button-row">
                    <Link className="btn primary" href={`/experience?library=${profile.id}#ai-lab`}>
                      以这间书房策划活动
                    </Link>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <div className="wrap page-turn">
          <Link href="/">
            <small>上一章</small>
            <b>返回首页</b>
          </Link>
          <Link href="/solution">
            <small>下一章</small>
            <b>数字运营方案</b>
          </Link>
        </div>
      </main>

      <SiteFooter subtitle="认识香山书房" right="地图、政策与重点书房资料整合页" />
    </>
  );
}
