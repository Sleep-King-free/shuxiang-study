'use client';

import { useEffect, useRef, useState } from 'react';
import { directions, operatingSource, plannerLibraries } from '@/lib/content';
import type { ActivityRecord, PlanInputs } from './model';
import { downloadContent, formatWhen, nowIso } from './model';
import { composeDraft, LOCAL_PROVIDER } from './planner-draft';
import { EXAMPLE_REQUEST } from './presets';
import { MAP_IMG } from '@/lib/img-props';

type Props = {
  record: ActivityRecord;
  hidden: boolean;
  update: (updater: (record: ActivityRecord) => ActivityRecord) => void;
  onReset: () => void;
};

const AUDIENCE_OPTIONS = ['亲子家庭', '青少年', '青年读者', '社区长者', '社区居民'];

export default function PlannerView({ record, hidden, update, onReset }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [edited, setEdited] = useState(false);
  const [status, setStatus] = useState(
    record.content
      ? record.example
        ? '已载入预置演示案例，不来自本次模型生成。'
        : '活动记录已载入，可继续修改。'
      : '本地演示生成 · 未经模型调用；生成结果须经人工审核后用于活动执行。',
  );
  const [feedback, setFeedback] = useState('');

  /* ---- 实时生成（POST /api/chat，服务端接 DeepSeek） ---- */
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [reply, setReply] = useState('');
  const [replySource, setReplySource] = useState<'ai' | 'local'>('ai');
  const [replySources, setReplySources] = useState<string[]>([]);
  const [aiError, setAiError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const library = plannerLibraries.find((item) => item.id === record.inputs.library) ?? plannerLibraries[0];
  const direction = directions.find((item) => item.id === record.inputs.direction) ?? directions[0];
  const hasDraft = Boolean(record.content);
  const stateText = !hasDraft
    ? '尚未生成'
    : record.stale
      ? '需求已变更'
      : edited
        ? '已编辑 · 待审核'
        : record.reviewed
          ? '已人工确认'
          : '草稿 · 待审核';
  const statusText =
    record.stale && record.content ? '当前稿件对应上一次需求，请重新生成后审核。' : status;

  const changeInput = (key: keyof PlanInputs, value: string) => {
    const next: PlanInputs = { ...record.inputs, [key]: value };
    setEdited(false);
    if (!record.content) {
      update((current) => ({ ...current, inputs: next }));
      return;
    }
    update((current) => ({ ...current, inputs: next, stale: true, reviewed: false }));
    setStatus('当前稿件对应上一次需求，请重新生成后审核。');
  };

  const loadExample = () => {
    const next: PlanInputs = { ...record.inputs, ...EXAMPLE_REQUEST };
    setEdited(false);
    if (!record.content) {
      update((current) => ({ ...current, inputs: next }));
      setStatus('已载入示例需求，人数、时长与预算均为拟定参数。');
      return;
    }
    update((current) => ({ ...current, inputs: next, stale: true, reviewed: false }));
    setStatus('当前稿件对应上一次需求，请重新生成后审核。');
  };

  const generate = () => {
    if (!formRef.current?.reportValidity()) return;
    if (record.content && !window.confirm('重新生成将替换当前正文。请先下载需要保留的修改稿。')) return;
    const draft = composeDraft(record.inputs, library, direction);
    update((current) => ({
      ...current,
      revision: current.revision + 1,
      content: draft.content,
      planInputs: { ...current.inputs },
      library: library.name,
      provider: LOCAL_PROVIDER,
      sources: draft.sources,
      generatedAt: nowIso(),
      reviewed: false,
      stale: false,
      example: false,
    }));
    setEdited(false);
    setStatus('策划草稿由本地模板生成（本地演示生成 · 未经模型调用），活动信息与执行条件待人工审核。');
    setFeedback('');
  };

  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /** 把左侧结构化表单的取值拼成一句需求，方便直接试接口 */
  const fillFromForm = () => {
    const head = [
      library.name,
      `主题「${record.inputs.theme.trim() || '待定'}」`,
      `面向${record.inputs.audience}`,
      `预计${record.inputs.participants}人`,
      `时长${record.inputs.duration}分钟`,
      `预算上限${record.inputs.budget}元`,
    ].join('，');
    const notes = record.inputs.notes.trim();
    setPrompt(
      `${head}。${notes ? `${notes} ` : ''}请给出可直接执行的活动流程、物料清单、预算估算与宣传方向。`,
    );
    setAiError('');
    if (phase === 'error') setPhase('idle');
  };

  const requestPlan = async () => {
    const content = prompt.trim();
    if (!content) {
      setAiError('请先写下活动需求；也可以点「用表单需求填入」自动生成一段描述。');
      setPhase('error');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSeconds(0);
    setReply('');
    setReplySources([]);
    setAiError('');
    setReplySource('ai');
    setPhase('loading');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: content }),
        signal: controller.signal,
      });

      // 静态站点会把 /api/chat 落到 index.html，先看 content-type 再决定怎么解析
      const type = response.headers.get('content-type') ?? '';
      if (!type.includes('application/json')) {
        throw new Error(
          response.status === 404
            ? '没有找到 /api/chat：npm run dev 不含 Pages Functions，请改用 npx wrangler pages dev，或部署到 Cloudflare Pages 后再试。'
            : `接口返回的不是 JSON（HTTP ${response.status}），请确认 functions/api/chat.js 已随站点部署。`,
        );
      }

      const data = (await response.json()) as {
        ok?: boolean;
        content?: unknown;
        error?: string;
        detail?: string | null;
      };

      if (!response.ok || data.ok === false) {
        throw new Error(
          [data.error || `接口返回 HTTP ${response.status}`, data.detail].filter(Boolean).join('：'),
        );
      }
      if (typeof data.content !== 'string' || !data.content.trim()) {
        throw new Error('接口没有返回正文。');
      }

      setReply(data.content.trim());
      setReplySources([`DeepSeek 实时生成 · ${formatWhen(nowIso())}`, `${library.name} · 书房档案`]);
      setPhase('ready');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setAiError(error instanceof Error ? error.message : '请求失败，请稍后重试。');
      setPhase('error');
    }
  };

  const cancelRequest = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase('idle');
    setAiError('');
  };

  /** 接口不可用时，退回本地模板，保证演示页面本身仍可出稿 */
  const useLocalFallback = () => {
    const draft = composeDraft(record.inputs, library, direction);
    setReply(draft.content);
    setReplySources(draft.sources);
    setReplySource('local');
    setAiError('');
    setPhase('ready');
  };

  const adoptReply = () => {
    if (!reply.trim()) return;
    if (record.content && !window.confirm('采用后会替换右侧当前策划稿，建议先下载需要保留的版本。继续？')) {
      return;
    }
    update((current) => ({
      ...current,
      revision: current.revision + 1,
      content: reply,
      planInputs: { ...current.inputs },
      library: library.name,
      provider: replySource === 'ai' ? 'DeepSeek · deepseek-chat' : LOCAL_PROVIDER,
      sources: replySources,
      generatedAt: nowIso(),
      reviewed: false,
      stale: false,
      example: false,
    }));
    setEdited(false);
    setStatus(
      replySource === 'ai'
        ? '已采用实时接口返回的正文；文化事实、场地容量、预算与安全条件仍需人工核对。'
        : '已采用本地模板正文（本地演示生成 · 未经模型调用）；活动信息仍需人工核对。',
    );
    setFeedback('');
  };

  const copyReply = async () => {
    if (!reply) return;
    try {
      await navigator.clipboard.writeText(reply);
      setFeedback(replySource === 'ai' ? '已复制实时生成的正文。' : '已复制本地模板正文。');
    } catch {
      setFeedback('自动复制不可用，请在结果区手动选择正文。');
    }
  };

  const toggleReviewed = (checked: boolean) => {
    setEdited(false);
    update((current) => ({ ...current, reviewed: checked }));
  };

  const editContent = (content: string) => {
    setEdited(true);
    update((current) => ({ ...current, content, reviewed: false }));
    setFeedback('');
  };

  const download = () => {
    if (!record.content) return;
    const label = record.stale
      ? '原需求对应稿；当前需求已变更'
      : record.reviewed
        ? '已人工确认'
        : '草稿，待人工审核';
    const original = record.planInputs ?? record.inputs;
    const text = `# ${original.theme}\n\n状态：${label}\n生成时间：${record.generatedAt ?? ''}\n书房：${record.library}\n原始需求：${JSON.stringify(original)}\n参考资料：${record.sources.join('；')}\n\n${record.content}\n`;
    downloadContent(text, '香山书房-活动策划.md', 'text/markdown;charset=utf-8');
    setFeedback('已导出当前策划稿及来源。');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(record.content);
      setFeedback('正文已复制。');
    } catch {
      editorRef.current?.focus();
      editorRef.current?.select();
      setFeedback('自动复制不可用，正文已选中。');
    }
  };

  const reset = () => {
    if (record.content && !window.confirm('清空当前策划稿并重新开始？请先下载需要保留的内容。')) return;
    onReset();
  };

  return (
    <article
      className="lab planner active workspace-view"
      id="ai-lab"
      data-workspace="plan"
      data-lab="ai"
      hidden={hidden}
    >
      <header className="planner-heading">
        <div>
          <div className="kicker">AI PLANNER</div>
          <h2>活动策划工作台</h2>
        </div>
        <span className="planner-service" role="status">
          本地模板出稿 · 可选 DeepSeek 实时生成
        </span>
      </header>

      {/* 实时生成：一句话需求 → POST /api/chat → 结果区 */}
      <section className="ai-live" aria-labelledby="ai-live-title">
        <header className="ai-live-head">
          <div>
            <div className="kicker">LIVE GENERATION</div>
            <h3 id="ai-live-title">一句话生成策划案</h3>
          </div>
          <span className="ai-live-badge">POST /api/chat</span>
        </header>

        <div className="ai-live-body">
          <div className="ai-live-input">
            <label htmlFor="ai-prompt">活动需求</label>
            <textarea
              id="ai-prompt"
              rows={4}
              maxLength={2000}
              value={prompt}
              disabled={phase === 'loading'}
              placeholder="例如：格子空间香山书房，青年读者 8 人，15 分钟，零预算，做一次「城市阅读小讨论」。"
              onChange={(event) => {
                setPrompt(event.target.value);
                if (phase === 'error') {
                  setPhase('idle');
                  setAiError('');
                }
              }}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void requestPlan();
                }
              }}
            />

            <div className="ai-live-tools">
              <span className="ai-live-count">{`${prompt.length} / 2000`}</span>
              <button className="ai-live-fill" type="button" onClick={fillFromForm}>
                用表单需求填入
              </button>
            </div>

            <div className="ai-live-actions">
              <button
                className="btn clay"
                type="button"
                onClick={() => void requestPlan()}
                disabled={phase === 'loading'}
              >
                {phase === 'loading' ? '生成中…' : '生成策划案'}
              </button>
              {phase === 'loading' && (
                <button className="btn" type="button" onClick={cancelRequest}>
                  取消
                </button>
              )}
            </div>

            <p className="ai-live-hint">
              服务端系统提示词固定为「你是香山书房的活动策划专家」。需部署 functions/api/chat.js 并配置
              DEEPSEEK_API_KEY；快捷键 Ctrl / ⌘ + Enter。
            </p>
          </div>

          <div className="ai-live-out" data-state={phase} aria-live="polite" aria-busy={phase === 'loading'}>
            {phase === 'loading' && (
              <div className="ai-live-loading">
                <span className="ai-live-spinner" aria-hidden="true" />
                <b>{seconds > 0 ? `生成中… 已等待 ${seconds} 秒` : '生成中…'}</b>
                <small>正在请求 DeepSeek，通常需要 10–30 秒，请勿关闭页面。</small>
              </div>
            )}

            {phase === 'error' && (
              <div className="ai-live-error">
                <b>没有生成成功</b>
                <p>{aiError}</p>
                <p className="ai-live-error-hint">
                  检查 Cloudflare Pages 的 Variables and Secrets 是否已配置 DEEPSEEK_API_KEY，或先用本地模板继续。
                </p>
                <div className="ai-live-actions">
                  <button className="btn" type="button" onClick={() => void requestPlan()}>
                    重试
                  </button>
                  <button className="btn" type="button" onClick={useLocalFallback}>
                    改用本地模板
                  </button>
                </div>
              </div>
            )}

            {phase === 'ready' && (
              <>
                <div className="ai-live-meta">
                  <span>{replySource === 'ai' ? 'DeepSeek · deepseek-chat' : LOCAL_PROVIDER}</span>
                  <span>{`${reply.length} 字`}</span>
                  {replySource === 'ai' && seconds > 0 ? <span>{`用时 ${seconds} 秒`}</span> : null}
                </div>
                <div className="ai-live-text">{reply}</div>
                <div className="ai-live-actions">
                  <button className="btn primary" type="button" onClick={adoptReply}>
                    采用为策划稿
                  </button>
                  <button className="btn" type="button" onClick={() => void copyReply()}>
                    复制正文
                  </button>
                </div>
              </>
            )}

            {phase === 'idle' && (
              <div className="ai-live-idle">
                <p>生成结果会显示在这里，可一键采用为右侧策划稿。</p>
                <p>正文只作草稿：文化事实、场地容量、预算与安全条件仍需人工核对。</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <details className="planner-sources" id="api-test-demo">
        <summary>真实调用示范 · DeepSeek 策划测试记录</summary>
        <p>
          2026年10月9日，使用 DeepSeek 的 deepseek-flash 模型与2.0.1内置活动策划提示词完成真实调用。查看此记录不会发起新的模型请求。
        </p>
        <p>
          <strong>测试需求：</strong>格子空间香山书房；阅读讨论；主题“城市阅读小讨论”；青年读者8人；15分钟；零预算。
        </p>
        <p>
          <strong>返回记录：</strong>项目接口与模型接口均为HTTP
          200；正文4635个字符，包含第八节，未触发截断错误。这里只确认生成完成，策划内容仍需人工审核。
        </p>
        <p>
          <strong>费用记录：</strong>用户在服务商账单延迟显示后确认，本次联调约消耗0.03元。该金额是多次诊断与生成的合计观察，未按单次请求拆分，不代表每次策划的固定价格。
        </p>
        <p className="workspace-note">
          本示范保存的是调用摘要。原始生成全文、精确时间、请求ID及token用量未留存，无法在此展示或重放原稿；现有“载入演示案例”仍为独立的预置模板。
        </p>
        <a className="workspace-text" href="/assets/examples/deepseek-test-20261009.json" download>
          下载本次测试记录（JSON）
        </a>
      </details>

      <div className="planner-grid">
        <form
          className="planner-form"
          id="planner-request"
          ref={formRef}
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
        >
          <fieldset>
            <legend>活动需求</legend>

            <label htmlFor="planner-library">活动书房</label>
            <select
              id="planner-library"
              name="library"
              required
              value={record.inputs.library}
              onChange={(event) => changeInput('library', event.target.value)}
            >
              {plannerLibraries.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <label htmlFor="theme">活动主题</label>
            <input
              id="theme"
              name="theme"
              required
              maxLength={100}
              placeholder="例如：岐江边的城市记忆读书会"
              value={record.inputs.theme}
              onChange={(event) => changeInput('theme', event.target.value)}
            />

            <fieldset className="direction-options">
              <legend>策划方向</legend>
              <div>
                {directions.map((item) => (
                  <label key={item.id}>
                    <input
                      type="radio"
                      name="direction"
                      value={item.id}
                      checked={record.inputs.direction === item.id}
                      onChange={() => changeInput('direction', item.id)}
                    />
                    <span>{item.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="direction-summary">{`${direction.goal}。${direction.effort}；${direction.conditions}。`}</p>

            <div className="planner-input-row">
              <div>
                <label htmlFor="audience">参与对象</label>
                <select
                  id="audience"
                  name="audience"
                  value={record.inputs.audience}
                  onChange={(event) => changeInput('audience', event.target.value)}
                >
                  {AUDIENCE_OPTIONS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="planner-budget">预算上限（元）</label>
                <input
                  id="planner-budget"
                  name="budget"
                  type="number"
                  min={0}
                  max={20000}
                  required
                  value={record.inputs.budget}
                  onChange={(event) => changeInput('budget', event.target.value)}
                />
              </div>
            </div>

            <div className="planner-input-row">
              <div>
                <label htmlFor="planner-people">预计人数</label>
                <input
                  id="planner-people"
                  name="participants"
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={record.inputs.participants}
                  onChange={(event) => changeInput('participants', event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="duration">时长（分钟）</label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min={15}
                  max={240}
                  required
                  value={record.inputs.duration}
                  onChange={(event) => changeInput('duration', event.target.value)}
                />
              </div>
            </div>

            <label htmlFor="planner-notes">补充要求</label>
            <textarea
              id="planner-notes"
              name="notes"
              rows={3}
              maxLength={1000}
              placeholder="例如：保留安静阅读时段，加入一句阅读感悟"
              value={record.inputs.notes}
              onChange={(event) => changeInput('notes', event.target.value)}
            />

            <div hidden>
              <label htmlFor="planner-code">体验码</label>
              <input id="planner-code" type="password" maxLength={200} autoComplete="off" />
            </div>
          </fieldset>

          <div className="planner-actions">
            <button className="btn clay" type="submit">
              {hasDraft ? '重新生成草稿' : '生成策划草稿'}
            </button>
            <button className="btn" type="button" hidden>
              取消生成
            </button>
            <button className="btn" type="button" onClick={loadExample}>
              载入示例需求
            </button>
          </div>

          <p className="planner-status" role="status" aria-live="polite">
            {statusText}
          </p>
          <button className="planner-text-action" type="button" hidden>
            重新连接服务
          </button>

          <details className="planner-sources">
            <summary>本次参考资料</summary>
            <div>
              <a href={library.href} target="_blank" rel="noopener">
                {`${library.name} · 查看档案`}
              </a>
              <p>{library.facts}</p>
              <p>{`来源：${library.source}；${operatingSource.title}`}</p>
            </div>
            <p>资料摘要来自项目书房档案与运营方案，场地容量、设备和当前开放安排仍需确认。</p>
          </details>
        </form>

        <div className="planner-result" id="planner-output" aria-busy="false" tabIndex={-1}>
          <div className="planner-result-header">
            <h3>活动策划稿</h3>
            <span>{stateText}</span>
          </div>

          <div className="planner-empty" hidden={hasDraft}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img {...MAP_IMG} alt="香山书房文化地图" loading="lazy" decoding="async" />
            <p>从一间书房出发，连接阅读、活动与地方文化。</p>
          </div>

          <div hidden={!hasDraft}>
            <p className="planner-meta">
              {`${record.provider ?? LOCAL_PROVIDER} · ${record.library} · ${record.generatedAt ? formatWhen(record.generatedAt) : ''} · 参考：${record.sources.join('；')}`}
            </p>
            <label className="planner-editor-label" htmlFor="planner-content">
              策划正文
            </label>
            <textarea
              id="planner-content"
              className="planner-editor"
              spellCheck={false}
              ref={editorRef}
              value={record.content}
              onChange={(event) => editContent(event.target.value)}
            />
            <label className="planner-review">
              <input
                type="checkbox"
                checked={record.reviewed}
                disabled={record.stale}
                onChange={(event) => toggleReviewed(event.target.checked)}
              />{' '}
              已人工核对文化事实、场地、预算与安全条件
            </label>
            <div className="planner-actions">
              <button className="btn primary" type="button" onClick={download}>
                下载策划稿
              </button>
              <button className="btn" type="button" onClick={copy}>
                复制正文
              </button>
              <button className="btn" type="button" onClick={reset}>
                重新策划
              </button>
            </div>
            <p className="planner-status" role="status" aria-live="polite">
              {feedback}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
