'use client';

import { useState } from 'react';
import type { ActivityRecord, FeedbackInput, PlanInputs } from './model';
import { currentOutput, feedbackMetrics, nowIso } from './model';

type Props = {
  record: ActivityRecord;
  hidden: boolean;
  update: (updater: (record: ActivityRecord) => ActivityRecord) => void;
  onNext: (inputs: PlanInputs, from: string) => void;
};

const EMPTY_INPUT: FeedbackInput = {
  period: '',
  source: 'manual',
  registered: '',
  attended: '',
  completed: '',
  notes: '',
};

export default function FeedbackView({ record, hidden, update, onNext }: Props) {
  const [note, setNote] = useState('');
  const input = record.feedbackDraft?.input ?? record.feedback?.input ?? EMPTY_INPUT;
  const suggestion = record.feedbackDraft?.suggestion ?? record.feedback?.suggestion ?? '';
  const feedback = record.feedback;

  const changeInput = (key: keyof FeedbackInput, value: string) => {
    const next: FeedbackInput = { ...input, [key]: value };
    if (key === 'source') next.source = value === 'demo' ? 'demo' : 'manual';
    update((current) => ({
      ...current,
      feedbackDraft: { input: next, suggestion },
    }));
  };

  const changeSuggestion = (value: string) => {
    update((current) => {
      if (current.feedbackDraft) {
        return { ...current, feedbackDraft: { ...current.feedbackDraft, suggestion: value } };
      }
      if (current.feedback) {
        return { ...current, feedback: { ...current.feedback, suggestion: value } };
      }
      return { ...current, feedbackDraft: { input, suggestion: value } };
    });
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!record.content || !input.notes.trim()) {
      setNote('请先建立策划稿并填写匿名反馈。');
      return;
    }
    try {
      const metrics = feedbackMetrics(input);
      const suggestionText =
        suggestion.trim() || '根据本次反馈，复核阅读环节长度、主持安排和场地条件。';
      update((current) => ({
        ...current,
        feedback: {
          revision: current.revision,
          input,
          metrics,
          suggestion: suggestionText,
          createdAt: nowIso(),
        },
        feedbackDraft: undefined,
      }));
      setNote('复盘记录已保存，不将反馈文本视为因果证明。');
    } catch (error) {
      setNote(error instanceof Error ? error.message : '复盘保存未完成，请检查填写内容。');
    }
  };

  const next = () => {
    if (record.feedbackDraft) {
      setNote('请先保存当前复盘，再用于下一次策划。');
      return;
    }
    if (!record.feedback || !suggestion.trim()) {
      setNote('请先保存复盘并填写下一次建议。');
      return;
    }
    onNext({ ...record.inputs, notes: `上次活动：${record.id}\n${suggestion}`.slice(0, 1000) }, record.id);
  };

  return (
    <section className="workspace-view" id="feedback" data-workspace="feedback" hidden={hidden}>
      <div className="workspace-head">
        <div>
          <div className="kicker">REVIEW &amp; NEXT</div>
          <h2>把一次复盘，带进下一场活动</h2>
        </div>
        <span className="stage-label">人工记录 · 规则汇总</span>
      </div>

      <div className="review-grid">
        <form className="workspace-form" onSubmit={submit}>
          <label htmlFor="feedback-period">记录日期／观察范围</label>
          <input
            id="feedback-period"
            name="period"
            required
            maxLength={100}
            placeholder="例如：本次活动结束后匿名反馈"
            value={input.period}
            onChange={(event) => changeInput('period', event.target.value)}
          />

          <label htmlFor="feedback-source">数据来源</label>
          <select
            id="feedback-source"
            name="source"
            value={input.source}
            onChange={(event) => changeInput('source', event.target.value)}
          >
            <option value="manual">人工录入</option>
            <option value="demo">演示数据</option>
          </select>

          <div className="planner-input-row">
            <div>
              <label htmlFor="feedback-registered">报名人数</label>
              <input
                id="feedback-registered"
                name="registered"
                type="number"
                min={0}
                max={10000}
                value={input.registered}
                onChange={(event) => changeInput('registered', event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="feedback-attended">到场人数</label>
              <input
                id="feedback-attended"
                name="attended"
                type="number"
                min={0}
                max={10000}
                value={input.attended}
                onChange={(event) => changeInput('attended', event.target.value)}
              />
            </div>
          </div>

          <label htmlFor="feedback-completed">完成阅读任务人数</label>
          <input
            id="feedback-completed"
            name="completed"
            type="number"
            min={0}
            max={10000}
            value={input.completed}
            onChange={(event) => changeInput('completed', event.target.value)}
          />

          <label htmlFor="feedback-notes">匿名反馈与执行观察</label>
          <textarea
            id="feedback-notes"
            name="notes"
            maxLength={1000}
            rows={4}
            required
            value={input.notes}
            onChange={(event) => changeInput('notes', event.target.value)}
          />

          <button className="btn clay" type="submit">
            保存复盘
          </button>
        </form>

        <div>
          <div className="feedback-report">
            {feedback ? (
              <>
                <h3>{feedback.input.source === 'demo' ? '演示复盘记录' : '人工录入复盘'}</h3>
                <p>{`范围：${feedback.input.period}`}</p>
                <p>{`报名：${feedback.metrics.registered ?? '未记录'}；到场：${feedback.metrics.attended ?? '未记录'}；任务完成：${feedback.metrics.completed ?? '未记录'}`}</p>
                <p>
                  {feedback.metrics.rate
                    ? `阅读任务完成率：${feedback.metrics.rate}（${feedback.metrics.completed} / ${feedback.metrics.attended}，到场人数为分母，须确认去重口径）`
                    : '数据不足，不计算任务完成率。'}
                </p>
                <blockquote>{feedback.input.notes}</blockquote>
                <p>{`对应策划V${feedback.revision}；${currentOutput(record, feedback) ? '版本一致' : '当前策划已变化，复盘保留原版本依据'}`}</p>
              </>
            ) : (
              <>
                <h3>尚无复盘记录</h3>
                <p>没有数据时可只记录匿名反馈。</p>
              </>
            )}
          </div>

          <label htmlFor="next-suggestion">下一次改进建议</label>
          <textarea
            id="next-suggestion"
            maxLength={1000}
            rows={4}
            value={suggestion}
            onChange={(event) => changeSuggestion(event.target.value)}
          />
          <button className="btn primary" type="button" onClick={next}>
            用于下一次策划
          </button>
          <p role="status">{note}</p>
        </div>
      </div>
    </section>
  );
}
