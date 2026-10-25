'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { operatingSource, plannerLibraries } from '@/lib/content';
import {
  createActivity,
  DEFAULT_INPUTS,
  nowIso,
  STORAGE_KEY,
  type ActivityRecord,
  type PlanInputs,
} from './model';
import { DEMO_CONTENT, DEMO_INPUTS } from './presets';

type WorkspaceState = { records: ActivityRecord[]; activeId: string };

function isRecord(value: unknown): value is ActivityRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as { id?: unknown; inputs?: unknown; content?: unknown };
  return typeof record.id === 'string' && typeof record.content === 'string' && typeof record.inputs === 'object' && record.inputs !== null;
}

function readStored(): { state: WorkspaceState | null; blocked: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: null, blocked: false };
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return { state: null, blocked: true };
    const stored = data as { schema?: unknown; activeId?: unknown; records?: unknown };
    if (
      stored.schema !== 2 ||
      !Array.isArray(stored.records) ||
      stored.records.length > 100 ||
      !stored.records.every(isRecord)
    ) {
      return { state: null, blocked: true };
    }
    return {
      state: {
        records: stored.records,
        activeId: typeof stored.activeId === 'string' ? stored.activeId : '',
      },
      blocked: false,
    };
  } catch {
    return { state: null, blocked: true };
  }
}

/**
 * Activity archive state: localStorage schema 2, one active record and the
 * save-status line under the sidebar nav (mirrors platform.js).
 */
export function useWorkspace() {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [saveStatus, setSaveStatus] = useState('准备活动档案');
  const startedRef = useRef(false);
  const loadedRef = useRef(false);
  const blockedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const stored = readStored();
    blockedRef.current = stored.blocked;
    const records = stored.state ? [...stored.state.records] : [];
    let activeId = stored.state?.activeId ?? '';

    // The archive lives in localStorage, which is only readable after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored.blocked) setSaveStatus('既有档案无法读取，未覆盖原记录');

    const url = new URL(window.location.href);
    const entryLibrary = url.searchParams.get('library');
    if (plannerLibraries.some((library) => library.id === entryLibrary) && records.length < 100) {
      const record = createActivity({ ...DEFAULT_INPUTS, library: entryLibrary ?? 'grid' }, records);
      records.unshift(record);
      activeId = record.id;
      url.searchParams.delete('library');
      window.history.replaceState(null, '', url);
    }

    if (!records.some((record) => record.id === activeId)) {
      const record = createActivity(DEFAULT_INPUTS, records);
      records.push(record);
      activeId = record.id;
    }

    loadedRef.current = true;
    setState({ records, activeId });
  }, []);

  useEffect(() => {
    if (!state || !loadedRef.current || blockedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: 2, activeId: state.activeId, records: state.records }));
      // Reporting the write result is the effect's only state update.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaveStatus('已保存到此设备');
    } catch {
      setSaveStatus('本地保存失败，请导出档案');
    }
  }, [state]);

  const updateRecord = useCallback((id: string, updater: (record: ActivityRecord) => ActivityRecord) => {
    setState((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        records: previous.records.map((record) =>
          record.id === id ? { ...updater(record), updatedAt: nowIso() } : record,
        ),
      };
    });
  }, []);

  const updateActive = useCallback(
    (updater: (record: ActivityRecord) => ActivityRecord) => {
      setState((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          records: previous.records.map((record) =>
            record.id === previous.activeId ? { ...updater(record), updatedAt: nowIso() } : record,
          ),
        };
      });
    },
    [],
  );

  const setActive = useCallback((id: string) => {
    setState((previous) => (previous ? { ...previous, activeId: id } : previous));
  }, []);

  const newActivity = useCallback(
    (inputs: PlanInputs = DEFAULT_INPUTS, from?: string) => {
      if (!state) return undefined;
      if (state.records.length >= 100) {
        setSaveStatus('档案已达100条，请先导出并清理不需要的活动。');
        return undefined;
      }
      const record = createActivity({ ...inputs }, state.records, from);
      setState({ records: [record, ...state.records], activeId: record.id });
      return record;
    },
    [state],
  );

  const removeRecord = useCallback(
    (id: string) => {
      if (!state) return;
      const remaining = state.records.filter((record) => record.id !== id);
      if (!remaining.length) remaining.push(createActivity(DEFAULT_INPUTS, []));
      const activeId = state.activeId === id ? remaining[0].id : state.activeId;
      setState({ records: remaining, activeId });
    },
    [state],
  );

  const loadDemo = useCallback(() => {
    const record = newActivity(DEMO_INPUTS);
    if (!record) return undefined;
    updateRecord(record.id, (current) => ({
      ...current,
      revision: 1,
      example: true,
      library: plannerLibraries[0].name,
      provider: '预置演示案例（非本次AI生成）',
      sources: [plannerLibraries[0].source, operatingSource.title],
      generatedAt: nowIso(),
      planInputs: { ...current.inputs },
      content: DEMO_CONTENT,
      reviewed: false,
      stale: false,
    }));
    return record.id;
  }, [newActivity, updateRecord]);

  const activeRecord = state?.records.find((record) => record.id === state.activeId) ?? null;

  return {
    records: state?.records ?? [],
    activeId: state?.activeId ?? '',
    activeRecord,
    ready: state !== null,
    saveStatus,
    setActive,
    updateActive,
    updateRecord,
    newActivity,
    removeRecord,
    loadDemo,
  };
}
