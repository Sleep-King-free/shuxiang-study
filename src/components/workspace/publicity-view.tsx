'use client';

import { useEffect, useRef, useState } from 'react';
import type { ActivityRecord, PublicityChannel } from './model';
import { currentOutput, downloadBlob, downloadContent, isApproved, makePublicity } from './model';
import { drawPoster } from './canvas-art';

type Props = {
  record: ActivityRecord;
  hidden: boolean;
  channel: PublicityChannel;
  onChannel: (channel: PublicityChannel) => void;
  update: (updater: (record: ActivityRecord) => ActivityRecord) => void;
};

const CHANNELS: { id: PublicityChannel; label: string }[] = [
  { id: 'wechat', label: '公众号' },
  { id: 'video', label: '视频号' },
  { id: 'xiaohongshu', label: '小红书' },
  { id: 'moments', label: '朋友圈' },
];

export default function PublicityView({ record, hidden, channel, onChannel, update }: Props) {
  const posterRef = useRef<HTMLCanvasElement>(null);
  const [note, setNote] = useState('');
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);

  const approved = isApproved(record);
  const output = record.publicity;
  const usable = currentOutput(record, output);
  const schedule = record.publicityDraft?.schedule ?? output?.schedule ?? '';
  const highlights = record.publicityDraft?.highlights ?? output?.highlights ?? '';

  const status =
    note ||
    (output
      ? usable
        ? '模板草稿已保存，发布信息仍需核对。'
        : '策划版本或审核状态已变化，旧宣传包需更新。'
      : '尚未制作宣传包。');

  useEffect(() => {
    const canvas = posterRef.current;
    if (!canvas) return;
    void drawPoster(canvas, {
      theme: record.planInputs?.theme || record.inputs.theme,
      library: record.library,
      schedule: output?.schedule || record.publicityDraft?.schedule || '',
      highlights: output?.highlights || record.publicityDraft?.highlights || '',
      image: uploadedImage,
    });
  }, [
    record.id,
    record.library,
    record.inputs.theme,
    record.planInputs,
    record.publicityDraft,
    output,
    uploadedImage,
  ]);

  const changeDraft = (key: 'schedule' | 'highlights', value: string) => {
    const nextDraft = { schedule, highlights, [key]: value };
    setNote('宣传需求已保存，重新制作宣传包后更新内容。');
    update((current) => ({
      ...current,
      publicityDraft: nextDraft,
      publicity: current.publicity ? { ...current.publicity, needsUpdate: true } : undefined,
    }));
  };

  const build = () => {
    if (!approved) return;
    try {
      const publicity = makePublicity(record, schedule, highlights);
      update((current) => ({ ...current, publicity, publicityDraft: undefined }));
      setNote('');
    } catch (error) {
      setNote(error instanceof Error ? error.message : '宣传包制作未完成，请重试。');
    }
  };

  const editChannel = (value: string) => {
    if (!usable || !output) return;
    update((current) =>
      current.publicity
        ? { ...current, publicity: { ...current.publicity, channels: { ...current.publicity.channels, [channel]: value } } }
        : current,
    );
  };

  const downloadPackage = () => {
    if (!usable || !output) return;
    const text = Object.entries(output.channels)
      .map(([name, content]) => `## ${name}\n${content}`)
      .join('\n\n');
    downloadContent(text, `${record.id}-宣传模板.md`, 'text/markdown;charset=utf-8');
  };

  const downloadPoster = () => {
    if (!usable) return;
    posterRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${record.id}-海报草稿.png`);
    });
  };

  const pickImage = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      setNote('请选择8MB以内图片。');
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      setUploadedImage(image);
      setNote('本次海报使用所选图片，原图不保存在活动档案中。');
    } catch {
      setNote('图片无法读取，请选择JPG、PNG或WebP图片。');
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return (
    <section className="workspace-view" id="publicity" data-workspace="publicity" hidden={hidden}>
      <div className="workspace-head">
        <div>
          <div className="kicker">CONTENT STUDIO</div>
          <h2>把活动方案，变成传播内容</h2>
        </div>
        <span className="stage-label">模板制作 · 待发布</span>
      </div>

      <p className="workspace-notice">
        {approved ? '当前策划已人工确认，可制作宣传模板并继续编辑。' : '采用并审核当前策划后，才能制作有效宣传包。'}
      </p>

      <div className="studio-grid">
        <form
          className="workspace-form"
          onSubmit={(event) => {
            event.preventDefault();
            build();
          }}
        >
          <label htmlFor="event-date">拟定时间与地点</label>
          <input
            id="event-date"
            name="schedule"
            maxLength={120}
            placeholder="未确定的信息保持待确认"
            value={schedule}
            onChange={(event) => changeDraft('schedule', event.target.value)}
          />
          <label htmlFor="event-highlights">采用方案的亮点</label>
          <textarea
            id="event-highlights"
            name="highlights"
            maxLength={600}
            rows={4}
            placeholder="填写实际采用的内容，不写尚未发生的现场成果"
            value={highlights}
            onChange={(event) => changeDraft('highlights', event.target.value)}
          />
          <button className="btn clay" type="submit" disabled={!approved}>
            制作宣传包
          </button>
          <p>文案继承当前活动，仍需人工核对后发布。</p>

          <label htmlFor="poster-image">海报图片</label>
          <input
            id="poster-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void pickImage(file);
            }}
          />
          <p>可使用已获授权的活动或书房图片。</p>
        </form>

        <div className="studio-output">
          <div className="channel-tabs" role="group" aria-label="宣传渠道">
            {CHANNELS.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={item.id === channel}
                onClick={() => onChannel(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label htmlFor="publicity-content">宣传正文</label>
          <textarea
            id="publicity-content"
            rows={12}
            placeholder="宣传包尚未制作"
            value={output?.channels[channel] ?? ''}
            onChange={(event) => editChannel(event.target.value)}
          />

          <div className="planner-actions">
            <button className="btn primary" type="button" disabled={!usable} onClick={downloadPackage}>
              下载宣传包
            </button>
            <button className="btn" type="button" disabled={!usable} onClick={downloadPoster}>
              下载海报
            </button>
          </div>

          <canvas id="activity-poster" width={900} height={1200} aria-label="活动宣传海报预览" ref={posterRef} />

          <p className="workspace-note" role="status">
            {status}
          </p>
        </div>
      </div>
    </section>
  );
}
