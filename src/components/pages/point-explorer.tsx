'use client';

import { useEffect, useState } from 'react';
import { points, pointTypes, type PointType } from '@/lib/content';

type FilterId = 'all' | PointType;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'urban', label: '城市更新' },
  { id: 'park', label: '公园生态' },
  { id: 'culture', label: '文化传承' },
  { id: 'community', label: '社区服务' },
];

export default function PointExplorer() {
  const [pointFilter, setPointFilter] = useState<FilterId>('all');
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width:640px)');
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    return () => {
      query.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  const selected = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => pointFilter === 'all' || point.type === pointFilter);

  return (
    <>
      <div className="filter-row">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === pointFilter ? 'filter active' : 'filter'}
            data-point-filter={item.id}
            onClick={() => {
              setPointFilter(item.id);
              setExpanded(false);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="point-grid" data-point-list>
        {selected.map(({ point, index }, position) => (
          <article
            key={point.name}
            className={`point-card${isMobile && !expanded && position >= 6 ? ' mobile-collapsed' : ''}`}
          >
            <div className="point-meta">
              <span>NO. {String(index + 1).padStart(2, '0')}</span>
              <span>{point.area}</span>
            </div>
            <h3>{point.name}</h3>
            <p>{point.detail}</p>
            <span className="tag">{pointTypes[point.type]}</span>
          </article>
        ))}
      </div>
      <button
        type="button"
        className="btn light load-more"
        data-point-more
        hidden={!isMobile || selected.length <= 6}
        onClick={() => setExpanded((open) => !open)}
      >
        {expanded ? '收起点位' : `查看更多点位（${selected.length}）`}
      </button>
    </>
  );
}
