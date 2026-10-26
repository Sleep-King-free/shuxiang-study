'use client';

import { useState } from 'react';
import { plannerLibraries, points } from '@/lib/content';
import { MAP_IMG } from '@/lib/img-props';

type Props = {
  hidden: boolean;
  onUseLibrary: (id: string) => void;
};

const SCENE_OPTIONS = [
  { value: 'all', label: '全部场景' },
  { value: 'urban', label: '城市更新' },
  { value: 'park', label: '公园生态' },
  { value: 'culture', label: '文化传承' },
  { value: 'community', label: '社区服务' },
];

export default function KnowledgeView({ hidden, onUseLibrary }: Props) {
  const [scene, setScene] = useState('all');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<typeof points | null>(null);

  const filtered = plannerLibraries.filter((library) => `${library.name}${library.facts}`.includes(query.trim()));

  return (
    <section className="workspace-view" id="knowledge" data-workspace="knowledge" hidden={hidden}>
      <div className="workspace-head">
        <div>
          <div className="kicker">LIBRARY RESOURCES</div>
          <h2>从城市地图，找到书房故事</h2>
        </div>
        <span className="stage-label">项目资料摘要</span>
      </div>

      <div className="heritage-map" id="resources">
        <figure>
          <a href="/assets/distribution/shiqi-map.jpg" target="_blank" rel="noopener">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img {...MAP_IMG} alt="六间代表性书房及周边场景地图" loading="lazy" decoding="async" />
          </a>
          <figcaption>六间代表书房地图 · 可查看完整原图，不等同于全市106个节点。</figcaption>
        </figure>

        <div>
          <form
            className="workspace-form"
            onSubmit={(event) => {
              event.preventDefault();
              setMatches(points.filter((point) => scene === 'all' || point.type === scene).slice(0, 5));
            }}
          >
            <label htmlFor="mapType">按空间场景查询</label>
            <select id="mapType" name="type" value={scene} onChange={(event) => setScene(event.target.value)}>
              {SCENE_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="btn primary">查询代表点位</button>
          </form>

          <div className="support-output" aria-live="polite">
            {matches ? (
              <>
                <h3>推荐点位</h3>
                <ul>
                  {matches.map((point) => (
                    <li key={point.name}>
                      <b>{point.name}</b>：{point.detail}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>从1.0代表点位资料中按场景查询。查询结果为点位建议，不是自动导航路线。</p>
            )}
          </div>

          <a className="workspace-text" href="/libraries#distribution">
            认识全市书房网络 →
          </a>
        </div>
      </div>

      <div className="knowledge-heading">
        <h3>五间重点书房档案</h3>
        <a href="/libraries#policy">政策与建设背景 →</a>
      </div>

      <label htmlFor="library-search">查找书房与文化主题</label>
      <input
        id="library-search"
        type="search"
        placeholder="书房名称或关键词"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="knowledge-list">
        {filtered.map((library) => (
          <article className="knowledge-entry" key={library.id}>
            {library.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={library.image} alt={`${library.name}空间照片`} loading="lazy" />
            ) : null}
            <div>
              <h3>{library.name}</h3>
              <p>{library.facts}</p>
              <small>{`来源：${library.source} · 容量、设备与当前开放安排待核实`}</small>
              <div className="planner-actions">
                <button className="btn primary" type="button" onClick={() => onUseLibrary(library.id)}>
                  用于本次策划
                </button>
                <a href={library.href}>查看完整档案</a>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? <p>没有匹配的书房资料。</p> : null}
      </div>
    </section>
  );
}
