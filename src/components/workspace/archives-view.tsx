'use client';

import { useState } from 'react';
import type { ActivityRecord } from './model';
import { downloadContent } from './model';

type Props = {
  records: ActivityRecord[];
  activeId: string;
  hidden: boolean;
  onEdit: (id: string) => void;
  onCopy: (record: ActivityRecord) => void;
  onDelete: (id: string) => void;
};

export default function ArchivesView({ records, activeId, hidden, onEdit, onCopy, onDelete }: Props) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const filtered = records.filter((record) =>
    `${record.id}${record.inputs.theme}${record.library || ''}`.includes(query.trim()),
  );

  const exportAll = () => {
    downloadContent(
      JSON.stringify({ schema: 2, activeId, records }, null, 2),
      '数香满屋-活动档案-2.0.json',
      'application/json',
    );
    setStatus('已导出当前活动档案，运行密钥未包含在其中。');
  };

  return (
    <section className="workspace-view" id="archives" data-workspace="archives" hidden={hidden}>
      <div className="workspace-head">
        <div>
          <div className="kicker">ACTIVITY ARCHIVE</div>
          <h2>把采用过的方案，留给下一次</h2>
        </div>
        <button className="btn" type="button" onClick={exportAll}>
          导出全部档案
        </button>
      </div>

      <p className="workspace-note">仅保存在当前浏览器，清理浏览器数据会影响记录。导出可保留备份。</p>

      <label htmlFor="archive-search">查找活动</label>
      <input
        id="archive-search"
        type="search"
        placeholder="主题、书房或活动编号"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="archive-list">
        {filtered.map((record) => (
          <article className="archive-entry" key={record.id}>
            <small>{`${record.id} · V${record.revision} · ${record.example ? '预置案例' : record.provider || '未生成'}`}</small>
            <h3>{record.inputs.theme || '未命名活动'}</h3>
            <p>{`${record.library || '书房未选定'} · ${record.stale ? '需求已变更' : record.reviewed ? '已人工审核' : '待审核'} · ${new Date(record.updatedAt).toLocaleString('zh-CN')}`}</p>
            <div className="planner-actions">
              <button className="btn" type="button" onClick={() => onEdit(record.id)}>
                继续编辑
              </button>
              <button className="btn" type="button" onClick={() => onCopy(record)}>
                复制需求
              </button>
              <button
                className="btn"
                type="button"
                onClick={() =>
                  downloadContent(
                    JSON.stringify({ schema: 2, activity: record }, null, 2),
                    `${record.id}.json`,
                    'application/json',
                  )
                }
              >
                导出档案
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  if (!window.confirm('删除此设备上的活动档案？已导出的文件不受影响。')) return;
                  onDelete(record.id);
                }}
              >
                删除
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? <p>没有匹配的活动。</p> : null}
      </div>

      <p role="status">{status}</p>
    </section>
  );
}
