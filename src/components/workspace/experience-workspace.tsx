'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { ActivityRecord, PlanInputs, PublicityChannel } from './model';
import { activityState } from './model';
import { useWorkspace } from './use-workspace';
import PlannerView from './planner-view';
import PublicityView from './publicity-view';
import ReaderView from './reader-view';
import FeedbackView from './feedback-view';
import KnowledgeView from './knowledge-view';
import ArchivesView from './archives-view';

const VIEW_ROUTES = {
  plan: 'ai-lab',
  publicity: 'publicity',
  reader: 'reader',
  feedback: 'feedback',
  knowledge: 'knowledge',
  archives: 'archives',
} as const;

type ViewId = keyof typeof VIEW_ROUTES;

const VIEW_ORDER = Object.keys(VIEW_ROUTES) as ViewId[];

/** Old in-page anchors still resolve to their workspace view (platform.js). */
const ALIASES: Record<string, ViewId> = {
  'planner-request': 'plan',
  'planner-output': 'plan',
  'passport-lab': 'reader',
  'recommend-lab': 'reader',
  'reader-experience': 'reader',
  resources: 'knowledge',
  'dashboard-lab': 'feedback',
};

const NAV: { view: ViewId; label: string }[] = [
  { view: 'plan', label: '01 · AI活动策划' },
  { view: 'publicity', label: '02 · 宣传制作' },
  { view: 'reader', label: '03 · 读者体验' },
  { view: 'feedback', label: '04 · 运营复盘' },
  { view: 'knowledge', label: '书房资料库' },
  { view: 'archives', label: '活动档案' },
];

export default function ExperienceWorkspace() {
  const {
    records,
    activeId,
    activeRecord,
    ready,
    saveStatus,
    setActive,
    updateActive,
    newActivity,
    removeRecord,
    loadDemo,
  } = useWorkspace();
  const [view, setView] = useState<ViewId>('plan');
  const [channel, setChannel] = useState<PublicityChannel>('wechat');

  const go = useCallback((next: ViewId) => {
    if (window.location.hash === `#${VIEW_ROUTES[next]}`) setView(next);
    else window.location.hash = VIEW_ROUTES[next];
  }, []);

  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.slice(1);
      const resolved =
        ALIASES[hash] ?? VIEW_ORDER.find((item) => VIEW_ROUTES[item] === hash) ?? 'plan';
      setView(resolved);
      if (hash && !['planner-request', 'planner-output'].includes(hash)) {
        requestAnimationFrame(() => {
          const target =
            resolved === 'reader'
              ? document.getElementById('reader')
              : document.querySelector('.activity-context');
          target?.scrollIntoView({ behavior: 'auto', block: 'start' });
        });
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('reader-mode', view === 'reader');
    return () => document.body.classList.remove('reader-mode');
  }, [view]);

  const createActivity = () => {
    if (newActivity()) go('plan');
  };

  const openDemo = () => {
    if (loadDemo()) go('plan');
  };

  const continueWith = (inputs: PlanInputs, from: string) => {
    if (newActivity(inputs, from)) go('plan');
  };

  const copyRecord = (record: ActivityRecord) => {
    if (newActivity(record.inputs, record.id)) go('plan');
  };

  const useLibrary = (id: string) => {
    updateActive((current) =>
      current.content
        ? { ...current, inputs: { ...current.inputs, library: id }, stale: true, reviewed: false }
        : { ...current, inputs: { ...current.inputs, library: id } },
    );
    go('plan');
  };

  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <div className="crumb">
            <Link href="/">首页</Link> / 在线体验 · AI 运营系统
          </div>
          <div className="experience-title">
            <h1>{view === 'reader' ? '香山书房 · 读者体验' : '香山书房 · 运营工作台'}</h1>
            <p>
              {view === 'reader'
                ? '读一段城市故事，留下一句自己的发现。'
                : 'AI策划、内容制作、阅读参与与活动复盘，在同一份档案里延续。'}
            </p>
          </div>
        </div>
      </div>

      <section className="experience-workspace">
        <div className="wrap platform-shell">
          <aside className="workspace-sidebar">
            <nav aria-label="工作台模块">
              {NAV.map((item) => (
                <a
                  key={item.view}
                  href={`#${VIEW_ROUTES[item.view]}`}
                  aria-current={view === item.view ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    go(item.view);
                  }}
                >
                  {item.label}
                  {item.view === 'archives' ? <span>{records.length}</span> : null}
                </a>
              ))}
            </nav>
            <div className="workspace-local">
              <p>活动记录保存在此设备</p>
              <p role="status">{saveStatus}</p>
              <button className="btn" type="button" onClick={createActivity}>
                新建活动
              </button>
              <button className="workspace-text" type="button" onClick={openDemo}>
                载入演示案例
              </button>
            </div>
          </aside>

          <div className="workspace-content">
            <details className="reader-mode-switch">
              <summary>切换视图</summary>
              <nav aria-label="读者视图切换">
                <a
                  href="#ai-lab"
                  onClick={(event) => {
                    event.preventDefault();
                    go('plan');
                  }}
                >
                  运营工作台
                </a>
                <a
                  href="#knowledge"
                  onClick={(event) => {
                    event.preventDefault();
                    go('knowledge');
                  }}
                >
                  书房资料库
                </a>
                <Link href="/">返回项目首页</Link>
              </nav>
            </details>
            <header className="activity-context">
              <div>
                <span>{`${activeRecord?.id ?? '新活动'} · V${activeRecord?.revision ?? 1}`}</span>
                <strong>
                  {activeRecord ? activeRecord.inputs.theme || '新活动 · 尚未命名' : '尚未命名'}
                </strong>
              </div>
              <span>{activeRecord ? activityState(activeRecord) : '草稿'}</span>
            </header>

            {ready && activeRecord ? (
              <>
                <PlannerView
                  key={`plan-${activeRecord.id}`}
                  record={activeRecord}
                  hidden={view !== 'plan'}
                  update={updateActive}
                  onReset={createActivity}
                />
                <PublicityView
                  key={`publicity-${activeRecord.id}`}
                  record={activeRecord}
                  hidden={view !== 'publicity'}
                  channel={channel}
                  onChannel={setChannel}
                  update={updateActive}
                />
                <ReaderView
                  key={`reader-${activeRecord.id}`}
                  record={activeRecord}
                  records={records}
                  hidden={view !== 'reader'}
                  update={updateActive}
                />
                <FeedbackView
                  key={`feedback-${activeRecord.id}`}
                  record={activeRecord}
                  hidden={view !== 'feedback'}
                  update={updateActive}
                  onNext={continueWith}
                />
                <KnowledgeView hidden={view !== 'knowledge'} onUseLibrary={useLibrary} />
                <ArchivesView
                  records={records}
                  activeId={activeId}
                  hidden={view !== 'archives'}
                  onEdit={(id) => {
                    setActive(id);
                    go('plan');
                  }}
                  onCopy={copyRecord}
                  onDelete={removeRecord}
                />
              </>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
