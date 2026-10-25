'use client';

import { useEffect, useRef, useState } from 'react';
import { plannerLibraries } from '@/lib/content';
import type { ActivityRecord } from './model';
import { currentOutput, downloadBlob, isApproved, nowIso } from './model';
import { JOURNEY_TASKS, type JourneyRecord } from './journey-data';
import { useJourney } from './use-journey';
import { drawJourneyCard, drawReadingCard } from './canvas-art';

type Props = {
  record: ActivityRecord;
  records: ActivityRecord[];
  hidden: boolean;
  update: (updater: (record: ActivityRecord) => ActivityRecord) => void;
};

const DEFAULT_READING_TASK =
  '阅读本次活动的资料或经馆方确认的导读，记录一个具体观察和一个想继续了解的问题。';

const STEPS = ['选择主题', '打开导读', '留下一句感悟', '点亮体验章'];

export default function ReaderView({ record, records, hidden, update }: Props) {
  const { state, commit } = useJourney();
  const [interest, setInterest] = useState<string>(
    () => JOURNEY_TASKS.find((item) => item.library === state.selected)?.interest ?? 'local',
  );
  const [time, setTime] = useState<string>(state.time === '30' ? '30' : '5');
  const [cardRecord, setCardRecord] = useState<JourneyRecord | null>(() =>
    state.selected ? state.records[state.selected] ?? null : null,
  );
  const [journeyStatus, setJourneyStatus] = useState('');
  const [badgeStory, setBadgeStory] = useState('选择一枚体验章，查看它的故事与获得条件。');
  const [started, setStarted] = useState<{ at: number; id: string; revision: number } | null>(null);
  const [startedTask, setStartedTask] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [readingNote, setReadingNote] = useState('');

  const journeyCanvas = useRef<HTMLCanvasElement>(null);
  const readingCanvas = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef<HTMLElement | null>(null);
  const materialRef = useRef<HTMLDivElement>(null);
  const reflectionRef = useRef<HTMLTextAreaElement>(null);

  const task = JOURNEY_TASKS.find((item) => item.library === state.selected) ?? null;
  const taskLibrary = task ? plannerLibraries.find((item) => item.id === task.library) : undefined;
  const step = cardRecord ? 3 : state.opened ? 2 : state.selected ? 1 : 0;
  const earned = JOURNEY_TASKS.filter((item) => Boolean(state.records[item.library])).length;

  const approved = isApproved(record);
  const taskValue = record.readingDraft?.task ?? record.reading?.task ?? DEFAULT_READING_TASK;
  const reflectionValue = record.readingDraft?.reflection ?? record.reading?.reflection ?? '';
  const readingUsable = currentOutput(record, record.reading);

  useEffect(() => {
    const canvas = journeyCanvas.current;
    if (!canvas) return;
    const badgeTask = JOURNEY_TASKS.find((item) => item.library === (cardRecord?.libraryId ?? state.selected));
    const library = badgeTask ? plannerLibraries.find((item) => item.id === badgeTask.library) : undefined;
    const label = library ? `${library.name.replace('香山书房', '')}体验章` : '';
    void drawJourneyCard(
      canvas,
      cardRecord,
      badgeTask ? { col: badgeTask.col, row: badgeTask.row, label } : null,
    );
  }, [cardRecord, state.selected]);

  useEffect(() => {
    const canvas = readingCanvas.current;
    if (canvas) drawReadingCard(canvas, record);
  }, [record]);

  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started.at) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started]);

  const choose = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selected = JOURNEY_TASKS.find((item) => item.interest === interest);
    if (!selected) return;
    commit({ ...state, selected: selected.library, time, opened: false, reflection: '' });
    setCardRecord(null);
    setJourneyStatus('');
    requestAnimationFrame(() => {
      taskRef.current?.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
  };

  const openMaterial = () => {
    commit({ ...state, opened: true });
    requestAnimationFrame(() => materialRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' }));
  };

  const finishJourney = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reflection = state.reflection.trim();
    if (!task || !state.opened || reflection.length < 8) {
      setJourneyStatus('请先阅读导读，并用至少8个字写下具体感悟。');
      return;
    }
    const library = plannerLibraries.find((item) => item.id === task.library);
    const card: JourneyRecord = {
      library: library?.name ?? task.library,
      libraryId: task.library,
      theme: task.theme,
      reflection,
      date: new Date().toLocaleDateString('zh-CN'),
      source: library?.source ?? '',
    };
    const saved = commit({ ...state, records: { ...state.records, [task.library]: card }, reflection });
    setCardRecord(card);
    setJourneyStatus(
      saved ? '任务完成，对应体验章已点亮，阅读卡已生成。' : '任务完成，请下载阅读卡；本地保存不可用。',
    );
  };

  const downloadJourneyCard = () => {
    if (!cardRecord) return;
    journeyCanvas.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, `香山阅读卡-${cardRecord.libraryId}.png`);
    });
  };

  const again = () => {
    commit({ ...state, selected: null, opened: false, reflection: '' });
    setCardRecord(null);
    setJourneyStatus('');
  };

  const changeReadingDraft = (key: 'task' | 'reflection', value: string) => {
    const draft =
      key === 'task'
        ? { task: value, reflection: reflectionValue }
        : { task: taskValue, reflection: value };
    update((current) => ({
      ...current,
      readingDraft: draft,
      reading: current.reading ? { ...current.reading, needsUpdate: true } : undefined,
    }));
  };

  const startReading = () => {
    if (!approved) return;
    setStarted({ at: Date.now(), id: record.id, revision: record.revision });
    setStartedTask(taskValue.trim());
    setElapsed(0);
    setReadingNote('任务进行中，阅读后提交一句感悟。');
    reflectionRef.current?.focus();
  };

  const submitReading = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reflection = reflectionValue.trim();
    if (
      !started ||
      started.id !== record.id ||
      started.revision !== record.revision ||
      !isApproved(record) ||
      startedTask !== taskValue.trim()
    ) {
      setReadingNote('请先开始与当前策划一致的阅读任务。');
      return;
    }
    if (!reflection || !startedTask) {
      setReadingNote('请填写阅读任务与感悟。');
      return;
    }
    update((current) => ({
      ...current,
      reading: {
        revision: current.revision,
        task: startedTask,
        reflection,
        completedAt: nowIso(),
        elapsedSeconds: Math.floor((Date.now() - started.at) / 1000),
      },
      readingDraft: undefined,
    }));
    setStarted(null);
    setReadingNote('本次任务已完成，感悟已保存。');
  };

  const downloadReadingCard = () => {
    if (!readingUsable || !record.reading?.completedAt) return;
    readingCanvas.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${record.id}-阅读卡.png`);
    });
  };

  const readingStatus =
    readingNote ||
    (record.reading?.completedAt
      ? readingUsable
        ? '本次任务已完成，感悟已保存。'
        : '已有任务对应旧策划，请更新后重新体验。'
      : '请先审核策划，再开始关联任务。');

  const journeyStatusText =
    journeyStatus ||
    (task
      ? state.records[task.library]
        ? '已完成过此主题，可以再次阅读并更新感悟。'
        : '打开导读后，写下自己的发现。'
      : '');

  return (
    <section className="workspace-view" id="reader" data-workspace="reader" hidden={hidden}>
      <div className="workspace-head">
        <div>
          <div className="kicker">READING JOURNEY</div>
          <h2>让一次参与，留下一句感悟</h2>
        </div>
        <span className="stage-label">阅读任务原型</span>
      </div>

      <ol className="journey-steps" aria-label="阅读旅程">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={index === step ? 'current' : index < step ? 'complete' : undefined}
            aria-current={index === step ? 'step' : undefined}
          >
            {label}
          </li>
        ))}
      </ol>

      <div className="journey-grid">
        <div id="recommend-lab">
          <form className="workspace-form journey-choice" onSubmit={choose}>
            <div className="planner-input-row">
              <div>
                <label htmlFor="journey-interest">阅读兴趣</label>
                <select
                  id="journey-interest"
                  name="interest"
                  value={interest}
                  onChange={(event) => setInterest(event.target.value)}
                >
                  <option value="local">城市记忆</option>
                  <option value="growth">社区与成长</option>
                  <option value="fiction">人物与故事</option>
                  <option value="family">亲子与自然</option>
                </select>
              </div>
              <div>
                <label htmlFor="journey-time">可用时间</label>
                <select
                  id="journey-time"
                  name="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                >
                  <option value="5">约5分钟</option>
                  <option value="30">约30分钟 · 含线下延伸</option>
                </select>
              </div>
            </div>
            <button className="btn clay">开启阅读旅程</button>
          </form>

          <article className="journey-task" ref={taskRef} hidden={!task}>
            <span className="stage-label">项目资料导读 · 示例体验</span>
            <h3>{task?.title}</h3>
            <p>{task?.question}</p>
            <p className="workspace-note">{`来源：${taskLibrary?.source ?? ''} · 基于项目资料编写的短导读，非图书全文。`}</p>
            <button className="btn primary" type="button" onClick={openMaterial}>
              {state.opened ? '阅读材料已展开' : '打开阅读材料'}
            </button>

            <div className="journey-material" ref={materialRef} hidden={!state.opened}>
              {(task?.text ?? '').split('\n\n').map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {time === '30' ? (
                <p className="journey-extension">
                  线下延伸建议：在书房选取经馆方确认的同主题读物，围绕上述问题继续阅读与讨论。30分钟是建议投入时间，本页面不验证真实阅读时长。
                </p>
              ) : null}
              {taskLibrary ? (
                <a href={taskLibrary.href} target="_blank" rel="noopener">
                  查看书房资料来源 →
                </a>
              ) : null}
            </div>

            <form className="workspace-form" hidden={!state.opened} onSubmit={finishJourney}>
              <label htmlFor="journey-reflection">留下一句自己的发现</label>
              <textarea
                id="journey-reflection"
                rows={4}
                maxLength={240}
                required
                placeholder="哪个空间细节让你想到一次阅读经历？"
                value={state.reflection}
                onChange={(event) => commit({ ...state, reflection: event.target.value })}
              />
              <label className="journey-check">
                <input type="checkbox" required /> 我已阅读本次导读
              </label>
              <button className="btn clay">完成任务，点亮体验章</button>
            </form>

            <p role="status" aria-live="polite">
              {journeyStatusText}
            </p>
          </article>

          <details className="journey-about">
            <summary>体验说明</summary>
            <p>
              导读根据项目书房资料编写，不是图书全文或实时馆藏。体验章记录本设备内的导读任务与感悟，不证明真实到访、实际阅读时长，也不产生兑换权益。记录保存在当前浏览器，可下载阅读卡留存。
            </p>
          </details>
        </div>

        <aside id="passport-lab" className="journey-passport">
          <h3>我的文化护照</h3>
          <p>{`${earned} / 4 枚体验章`}</p>
          <div className="journey-badges">
            {JOURNEY_TASKS.map((item) => {
              const library = plannerLibraries.find((entry) => entry.id === item.library);
              const done = Boolean(state.records[item.library]);
              const active = state.selected === item.library;
              const name = (library?.name ?? item.library).replace('香山书房', '');
              return (
                <button
                  type="button"
                  key={item.library}
                  className={`journey-badge${done ? ' earned' : active ? ' in-progress' : ''}`}
                  title="查看故事与获得条件"
                  onClick={() =>
                    setBadgeStory(`${name}：${item.title} 完成对应导读并提交至少8字的个人感悟，即可点亮此体验章。`)
                  }
                >
                  <span
                    className="badge-art"
                    aria-hidden="true"
                    style={{ backgroundPosition: `${item.col * 25}% ${(item.row * 100) / 3}%` }}
                  />
                  <span>{name}</span>
                  <small>{done ? '已点亮' : active ? '进行中' : '未开启'}</small>
                </button>
              );
            })}
          </div>
          <div className="journey-badge-story" aria-live="polite">
            {badgeStory}
          </div>

          <details>
            <summary>查看全部20枚徽章设计</summary>
            <a href="/assets/passport/badge-collection.jpg" target="_blank" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/passport/badge-collection.jpg" alt="20枚徽章设计合集" loading="lazy" />
            </a>
            <p className="workspace-note">四枚体验章使用合集中的对应书房图形；其余为设计展示。</p>
          </details>

          <canvas id="journey-card" width={900} height={1100} aria-label="阅读卡预览" ref={journeyCanvas} />

          <p className="workspace-note">
            {cardRecord ? '已完成阅读卡 · 可下载留存' : '示例阅读卡 · 完成后写入你的感悟与日期'}
          </p>
          <div className="planner-actions">
            <button className="btn primary" type="button" disabled={!cardRecord} onClick={downloadJourneyCard}>
              下载我的阅读卡
            </button>
            <button className="btn" type="button" onClick={again}>
              重新选题
            </button>
          </div>
        </aside>
      </div>

      <details className="linked-reading" open={approved}>
        <summary>
          活动关联任务与阅读卡 <span>连接当前策划</span>
        </summary>
        <p className="workspace-notice">
          以下任务关联当前活动，需审核策划后开启；页面操作不证明真实到访或实际阅读时长。
        </p>

        <div className="reader-layout">
          <div>
            <h3>{record.inputs.theme || '选择活动后开始阅读体验'}</h3>
            <p>{`${record.library || '书房未确认'} · ${record.id} · 阅读任务原型`}</p>

            <label htmlFor="reading-task">本次阅读任务</label>
            <textarea
              id="reading-task"
              rows={4}
              maxLength={600}
              value={taskValue}
              onChange={(event) => changeReadingDraft('task', event.target.value)}
            />
            <button className="btn primary" type="button" disabled={!approved} onClick={startReading}>
              开始本次任务
            </button>
            <span className="reading-clock">
              {started ? `页面任务已开始 ${elapsed} 秒` : '尚未开始'}
            </span>

            <form className="workspace-form" onSubmit={submitReading}>
              <label htmlFor="reading-reflection">一句阅读感悟</label>
              <textarea
                id="reading-reflection"
                rows={3}
                maxLength={500}
                required
                placeholder="写下一个具体发现或想继续了解的问题"
                ref={reflectionRef}
                value={reflectionValue}
                onChange={(event) => changeReadingDraft('reflection', event.target.value)}
              />
              <button className="btn clay" type="submit">
                完成并生成阅读卡
              </button>
            </form>

            <p role="status">{readingStatus}</p>
          </div>

          <div>
            <canvas id="reading-card" width={900} height={1100} aria-label="个人电子阅读卡" ref={readingCanvas} />
            <button
              className="btn"
              type="button"
              disabled={!readingUsable || !record.reading?.completedAt}
              onClick={downloadReadingCard}
            >
              下载阅读卡
            </button>

            <div className="passport-strip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/passport/badge-collection.jpg" alt="20枚文化护照徽章设计" loading="lazy" />
              <p>{`本设备已完成 ${records.filter((item) => item.reading?.completedAt).length} 个活动阅读任务。`}</p>
              <p className="workspace-note">20枚为现有设计素材，尚未逐枚建立书房核销与权益规则。</p>
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
