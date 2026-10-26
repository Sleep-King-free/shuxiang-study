'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';

import { BADGES, BADGE_TOTAL, READ_STEP_MINUTES, drawBadge, type Badge } from '@/lib/badges';

/* ============================================================
   数字文化护照 · 纯前端交互
   - 手机号 → 8 位编号（同一号码恒定）
   - 状态、性别、头像、编号全部落在 localStorage
   - 每「阅读 30 分钟」从 20 枚徽章里抽 1 枚未获得的
   - 不请求任何服务端接口
   ============================================================ */

type Gender = 'male' | 'female' | 'secret';

type Passport = {
  phone: string;
  uid: string;
  gender: Gender;
  avatar: number;
  createdAt: string;
  /** 累计阅读分钟数 */
  readingTime: number;
  /** 已获得徽章的 id 数组 */
  earnedBadges: string[];
  /** 最近一次打卡时间，仅用于展示 */
  lastReadAt?: string;
};

type Store = {
  active: Passport | null;
  records: Record<string, Passport>;
};

/** 快照多一个 ready：SSR 阶段为 false，只在浏览器读完本地记录后置真 */
type Snapshot = Store & { ready: boolean };

const STORAGE_KEY = 'shuxiang-passport-v2';

const GENDERS: { id: Gender; label: string }[] = [
  { id: 'male', label: '男' },
  { id: 'female', label: '女' },
  { id: 'secret', label: '保密' },
];

const AVATARS = [
  { tone: 'wood', label: '原木' },
  { tone: 'sage', label: '松绿' },
  { tone: 'sand', label: '米沙' },
  { tone: 'clay', label: '陶土' },
  { tone: 'mist', label: '雾青' },
  { tone: 'gold', label: '鎏金' },
];

/** 阅读分钟 → 小时展示：30 → 0.5，60 → 1，90 → 1.5 */
function readingHours(minutes: number) {
  if (minutes <= 0) return '0';
  const hours = minutes / 60;
  return hours % 1 === 0 ? String(hours) : hours.toFixed(1);
}

function buildStats(active: Passport) {
  return [
    { icon: 'home' as const, value: '0', unit: '篇', label: '个人阅读主页' },
    { icon: 'clock' as const, value: readingHours(active.readingTime), unit: '小时', label: '阅读累计时间' },
    { icon: 'book' as const, value: '0', unit: '本', label: '阅读书籍记录' },
    { icon: 'medal' as const, value: String(active.earnedBadges.length), unit: '枚', label: '获得徽章数量' },
    { icon: 'star' as const, value: '0', unit: '分', label: '阅读积分' },
    { icon: 'trophy' as const, value: '—', unit: '暂无', label: '阅读排行榜排名' },
  ];
}

const ICON = {
  home: (
    <path d="M3.5 9.5 10 4l6.5 5.5V16a.5.5 0 0 1-.5.5h-3.6v-4.2H7.6V16.5H4a.5.5 0 0 1-.5-.5z" />
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="6.6" />
      <path d="M10 6.4V10l2.5 1.6" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.6h4.2a1.8 1.8 0 0 1 1.8 1.8v9.2a1.4 1.4 0 0 0-1.4-1.4H4z" />
      <path d="M16 4.6h-4.2A1.8 1.8 0 0 0 10 6.4v9.2a1.4 1.4 0 0 1 1.4-1.4H16z" />
    </>
  ),
  medal: (
    <>
      <circle cx="10" cy="12.4" r="4.1" />
      <path d="m7.2 8.6-1.7-4h3l1.2 2.6M12.8 8.6l1.7-4h-3L10.3 7.2" />
    </>
  ),
  star: <path d="m10 3.6 1.95 4.03 4.45.62-3.2 3.1.76 4.4L10 13.66l-3.96 2.09.76-4.4-3.2-3.1 4.45-.62z" />,
  trophy: (
    <>
      <path d="M6 4h8v3.4a4 4 0 0 1-8 0z" />
      <path d="M6 5.2H4.2v1.1A2.4 2.4 0 0 0 6.6 8.7M14 5.2h1.8v1.1a2.4 2.4 0 0 1-2.4 2.4" />
      <path d="M10 11.4V14M7.4 16.4h5.2" />
    </>
  ),
};

function Icon({ name }: { name: keyof typeof ICON }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON[name]}
    </svg>
  );
}

function Face() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="currentColor" opacity="0.18" />
      <circle cx="9.2" cy="10.6" r="1.05" fill="currentColor" />
      <circle cx="14.8" cy="10.6" r="1.05" fill="currentColor" />
      <path
        d="M9.4 14.2c.7.8 1.6 1.2 2.6 1.2s1.9-.4 2.6-1.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function Avatar({ tone, size }: { tone: string; size?: 'lg' }) {
  return (
    <span className={`pp-avatar tone-${tone}${size === 'lg' ? ' is-lg' : ''}`} aria-hidden="true">
      <Face />
    </span>
  );
}

function StatusBar() {
  return (
    <div className="pp-status" aria-hidden="true">
      <span>9:41</span>
      <span className="pp-status-right">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

/* ---------- 编号与存储 ---------- */

function hashPhone(phone: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < phone.length; i += 1) {
    h ^= phone.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}

/** 由手机号唯一推导 8 位编号，形如 XS-1234-5678 */
function makeUid(phone: string): string {
  const body = String((hashPhone(phone) % 90000000) + 10000000);
  return `XS-${body.slice(0, 4)}-${body.slice(4)}`;
}

function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)} **** ${phone.slice(-4)}`;
}

function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 归一化单条护照记录。
 * 旧版本（v2 早期）只存了 phone/uid/gender/avatar，读出来要补阅读字段，
 * 否则老用户升级后 readingTime 会是 undefined，一加 30 就变 NaN。
 */
function normalizePassport(input: unknown): Passport | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<Passport>;
  if (typeof raw.phone !== 'string' || typeof raw.uid !== 'string') return null;

  const readingTime =
    typeof raw.readingTime === 'number' && Number.isFinite(raw.readingTime) && raw.readingTime > 0
      ? Math.floor(raw.readingTime)
      : 0;

  // 只认徽章库里真实存在的 id，防止老数据里混进已下线的徽章
  const validIds = new Set(BADGES.map((badge) => badge.id));
  const earned = Array.isArray(raw.earnedBadges)
    ? Array.from(new Set(raw.earnedBadges.filter((id): id is string => typeof id === 'string' && validIds.has(id))))
    : [];

  return {
    phone: raw.phone,
    uid: raw.uid,
    gender: raw.gender === 'male' || raw.gender === 'female' ? raw.gender : 'secret',
    avatar: typeof raw.avatar === 'number' && raw.avatar >= 0 && raw.avatar < AVATARS.length ? raw.avatar : 0,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    readingTime,
    earnedBadges: earned,
    lastReadAt: typeof raw.lastReadAt === 'string' ? raw.lastReadAt : undefined,
  };
}

function loadStore(): Store {
  if (typeof window === 'undefined') return { active: null, records: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { active: null, records: {} };

    const parsed = JSON.parse(raw) as Partial<Store>;
    const records: Record<string, Passport> = {};
    for (const [key, value] of Object.entries(parsed.records ?? {})) {
      const passport = normalizePassport(value);
      if (passport) records[key] = passport;
    }

    const active = normalizePassport(parsed.active);
    return {
      active: active && records[active.phone] ? records[active.phone] : active,
      records,
    };
  } catch {
    return { active: null, records: {} };
  }
}

function saveStore(store: Store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* 隐私模式下写入可能失败，界面仍可继续使用 */
  }
}

/* ---- 极简外部 store：读本地记录 + 订阅更新 ---- */

const SERVER_SNAPSHOT: Snapshot = { active: null, records: {}, ready: false };
const listeners = new Set<() => void>();
let cached: Snapshot | null = null;

function readSnapshot(): Snapshot {
  if (!cached) {
    cached = { ...loadStore(), ready: true };
  }
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: Store) {
  cached = { ...next, ready: true };
  saveStore(next);
  listeners.forEach((listener) => listener());
}

export default function PassportApp() {
  const store = useSyncExternalStore(subscribe, readSnapshot, () => SERVER_SNAPSHOT);
  const { active, ready } = store;

  const [leaving, setLeaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState('');
  /** 抽奖进行中：按钮锁 820ms，播一段「翻页」动画 */
  const [drawing, setDrawing] = useState(false);
  /** 抽中后待展示的徽章；null 表示没有弹窗 */
  const [reward, setReward] = useState<{ badge: Badge; total: number } | null>(null);

  const swapTimer = useRef<number | null>(null);
  const shakeTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);
  const drawTimer = useRef<number | null>(null);
  const doneRef = useRef<HTMLButtonElement | null>(null);
  const rewardRef = useRef<HTMLButtonElement | null>(null);

  const view: 'auth' | 'home' = active ? 'home' : 'auth';

  useEffect(
    () => () => {
      if (swapTimer.current) window.clearTimeout(swapTimer.current);
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      if (drawTimer.current) window.clearTimeout(drawTimer.current);
    },
    [],
  );

  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2400);
  }, []);

  /** 先播退场动画，动画结束再落库；落库后视图自然切到另一屏 */
  const swap = useCallback((next: Store) => {
    setLeaving(true);
    if (swapTimer.current) window.clearTimeout(swapTimer.current);
    swapTimer.current = window.setTimeout(() => {
      commit(next);
      setLeaving(false);
    }, 230);
  }, []);

  const openSheet = useCallback(() => {
    setToast('');
    setSheet(true);
  }, []);

  const fail = useCallback((message: string) => {
    setError(message);
    setShake(true);
    if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShake(false), 460);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (leaving) return;

    const value = phone.trim();

    if (!/^1[3-9]\d{9}$/.test(value)) {
      if (!value) fail('请先输入手机号');
      else if (!/^\d+$/.test(value)) fail('手机号只能是数字');
      else if (value.length < 11) fail(`还差 ${11 - value.length} 位数字`);
      else if (value.length > 11) fail('手机号应为 11 位');
      else fail('号段不正确，请填写 13–19 开头的手机号');
      return;
    }

    setError('');
    const existing = store.records[value];
    const passport: Passport = existing ?? {
      phone: value,
      uid: makeUid(value),
      gender: 'secret',
      avatar: 0,
      createdAt: new Date().toISOString(),
      readingTime: 0,
      earnedBadges: [],
    };

    setPhone(value);
    showToast(existing ? `欢迎回来 · ${passport.uid}` : `护照已生成 · ${passport.uid}`);
    swap({
      active: passport,
      records: { ...store.records, [value]: passport },
    });
  }

  const updatePassport = useCallback(
    (patch: Partial<Passport>) => {
      if (!active) return;
      const merged: Passport = { ...active, ...patch };
      commit({
        active: merged,
        records: { ...store.records, [merged.phone]: merged },
      });
    },
    [active, store.records],
  );

  /**
   * 模拟阅读 30 分钟：
   * 1) readingTime += 30
   * 2) 从尚未获得的徽章里随机抽 1 枚
   * 3) 写回 localStorage（records 按手机号分开存，换号不串数据）
   * 4) 弹窗展示；若 20 枚已集齐，只累计时长不再抽奖
   */
  const readThirty = useCallback(() => {
    if (!active || drawing || leaving) return;

    if (active.earnedBadges.length >= BADGE_TOTAL) {
      showToast(`20 枚徽章已集齐，累计阅读 ${active.readingTime} 分钟`);
      return;
    }

    setToast('');
    setDrawing(true);

    drawTimer.current = window.setTimeout(() => {
      // 这 820ms 里用户可能改了性别/头像，必须基于最新快照计算，否则会被旧闭包覆盖
      const latest = readSnapshot();
      const base = latest.active && latest.active.phone === active.phone ? latest.active : active;

      const badge = drawBadge(base.earnedBadges);
      const earnedBadges = badge ? [...base.earnedBadges, badge.id] : base.earnedBadges;
      const merged: Passport = {
        ...base,
        readingTime: base.readingTime + READ_STEP_MINUTES,
        earnedBadges,
        lastReadAt: new Date().toISOString(),
      };

      commit({
        active: merged,
        records: { ...latest.records, [merged.phone]: merged },
      });

      setDrawing(false);
      if (badge) {
        setReward({ badge, total: earnedBadges.length });
        try {
          navigator.vibrate?.(24);
        } catch {
          /* 不支持震动的设备忽略 */
        }
      }
    }, 820);
  }, [active, drawing, leaving, showToast]);

  const closeReward = useCallback(() => setReward(null), []);

  const logout = useCallback(() => {
    const lastPhone = active?.phone ?? '';
    // 抽奖动画进行中退出时要掐掉定时器，否则 setTimeout 回来会用旧 active 把用户重新写活
    if (drawTimer.current) window.clearTimeout(drawTimer.current);
    setDrawing(false);
    setReward(null);
    setPhone(lastPhone);
    setSheet(false);
    setError('');
    showToast('已退出登录，护照记录仍保留在本机');
    swap({ active: null, records: store.records });
  }, [active, showToast, store.records, swap]);

  const copyUid = useCallback(async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.uid);
      showToast('护照编号已复制');
    } catch {
      showToast(`护照编号：${active.uid}`);
    }
  }, [active, showToast]);

  useEffect(() => {
    if (!sheet && !reward) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (sheet) setSheet(false);
      if (reward) setReward(null);
    };
    window.addEventListener('keydown', onKey);
    if (sheet) doneRef.current?.focus();
    else rewardRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, reward]);

  const currentAvatar = AVATARS[active?.avatar ?? 0] ?? AVATARS[0];

  return (
    <div className="pp-stage">
      <article className="pp-phone" aria-label="数字文化护照">
        <div className="pp-frame">
          <div className="pp-screen">
            <StatusBar />

            {!ready && (
              <div className="pp-skeleton" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}

            {ready && view === 'auth' && (
              <div className={`pp-view${leaving ? ' is-out' : ''}`}>
                <header className="pp-brand">
                  <span className="pp-brand-mark">数</span>
                  <span>
                    数字文化护照
                    <small>香山书房 · 阅读印记</small>
                  </span>
                </header>

                <div className="pp-auth-block">
                  <div className="pp-ghost" aria-hidden="true">
                    <span className="pp-ghost-seal">未</span>
                    <b>尚未领取护照</b>
                    <small>绑定后自动生成 8 位编号</small>
                  </div>

                  <form className="pp-auth" onSubmit={onSubmit} noValidate>
                    <span className="pp-step">第一步 · 绑定手机号</span>
                    <h2>领取你的护照编号</h2>
                    <p className="pp-auth-copy">一个手机号对应一本护照。换设备登录，阅读记录可以接着累积。</p>

                    <label className={`pp-field${shake ? ' is-shake' : ''}${error ? ' is-error' : ''}`}>
                      <span className="pp-prefix">+86</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={11}
                        placeholder="请输入 11 位手机号"
                        aria-label="手机号"
                        aria-invalid={error ? true : undefined}
                        value={phone}
                        onChange={(event) => {
                          setPhone(event.target.value.replace(/\D/g, '').slice(0, 11));
                          if (error) setError('');
                        }}
                      />
                    </label>

                    <p className={`pp-error${error ? ' is-on' : ''}`} role="alert">
                      {error || '仅支持中国大陆 11 位手机号'}
                    </p>

                    <button className="pp-submit" type="submit">
                      生成护照
                    </button>
                    <p className="pp-hint">演示界面：不会真实发送短信，号码也不会离开本机。</p>
                  </form>
                </div>

                <ul className="pp-values">
                  <li>
                    <b>21</b>
                    <span>处书房可盖章</span>
                  </li>
                  <li>
                    <b>20</b>
                    <span>枚特色徽章</span>
                  </li>
                  <li>
                    <b>0</b>
                    <span>起点积分</span>
                  </li>
                </ul>
              </div>
            )}

            {ready && view === 'home' && active && (
              <div className={`pp-view pp-view--home${leaving ? ' is-out' : ''}`}>
                <header className="pp-nav">
                  <span className="pp-nav-title">我的护照</span>
                  <button className="pp-nav-exit" type="button" onClick={logout}>
                    退出
                  </button>
                </header>

                <div className="pp-id">
                  <div className="pp-id-top">
                    <span className="pp-id-kicker">SHUXIANG · PASSPORT</span>
                    <span className="pp-id-state">
                      <i />
                      已激活
                    </span>
                  </div>

                  <div className="pp-id-body">
                    <button
                      className="pp-id-avatar"
                      type="button"
                      onClick={openSheet}
                      aria-label="更换头像"
                    >
                      <Avatar tone={currentAvatar.tone} size="lg" />
                    </button>
                    <div className="pp-id-name">
                      <strong>读者</strong>
                      <small>绑定 {maskPhone(active.phone)}</small>
                    </div>
                  </div>

                  <div className="pp-id-uid">
                    <span>
                      <span className="pp-uid-label">PASSPORT NO.</span>
                      <button className="pp-uid" type="button" onClick={copyUid} title="点击复制编号">
                        {active.uid}
                      </button>
                    </span>
                    <button className="pp-uid-copy" type="button" onClick={copyUid}>
                      复制
                    </button>
                  </div>

                  <div className="pp-id-foot">
                    <span>领取于 {stamp(active.createdAt)}</span>
                    <span>编号已锁定</span>
                  </div>
                </div>

                <section className="pp-block">
                  <div className="pp-block-head">
                    <h3>阅读打卡</h3>
                    <span>每 {READ_STEP_MINUTES} 分钟抽 1 枚</span>
                  </div>

                  <div className="pp-read">
                    <div className="pp-read-meta">
                      <span>
                        <b>{active.readingTime}</b> 分钟累计
                      </span>
                      <span>
                        <b>{active.earnedBadges.length}</b> / {BADGE_TOTAL} 枚徽章
                      </span>
                    </div>
                    <div className="pp-read-bar" aria-hidden="true">
                      <i
                        style={{
                          transform: `scaleX(${active.earnedBadges.length / BADGE_TOTAL})`,
                        }}
                      />
                    </div>
                    <button
                      className="pp-read-btn"
                      type="button"
                      onClick={readThirty}
                      disabled={drawing || active.earnedBadges.length >= BADGE_TOTAL}
                    >
                      {drawing ? (
                        <>
                          <span className="pp-read-spinner" aria-hidden="true" />
                          正在翻阅书页…
                        </>
                      ) : active.earnedBadges.length >= BADGE_TOTAL ? (
                        '20 枚已集齐'
                      ) : (
                        `模拟阅读 ${READ_STEP_MINUTES} 分钟`
                      )}
                    </button>
                    <p className="pp-read-hint">演示用：不记录真实阅读行为，只按点击累计时长。</p>
                  </div>
                </section>

                <section className="pp-block">
                  <div className="pp-block-head">
                    <h3>阅读数据</h3>
                    <span>本机实时记录</span>
                  </div>

                  <div className="pp-grid">
                    {buildStats(active).map((stat) => (
                      <div className="pp-stat" key={stat.label}>
                        <span className="pp-stat-icon">
                          <Icon name={stat.icon} />
                        </span>
                        <span className="pp-stat-body">
                          <span className="pp-stat-value">
                            {stat.value}
                            <small>{stat.unit}</small>
                          </span>
                          <span className="pp-stat-label">{stat.label}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="pp-block">
                  <div className="pp-block-head">
                    <h3>我的徽章墙</h3>
                    <span>
                      已点亮 <b className="pp-block-count">{active.earnedBadges.length}</b> / {BADGE_TOTAL}
                    </span>
                  </div>

                  {/* 陈列柜：木框 + 内凹格子，未获得的徽章保持灰色剪影 */}
                  <div className="pp-case">
                    <div className="pp-badges">
                      {BADGES.map((badge) => {
                        const owned = active.earnedBadges.includes(badge.id);
                        return (
                          <button
                            key={badge.id}
                            type="button"
                            className={`pp-badge${owned ? ' is-on' : ''}`}
                            data-name={badge.name}
                            aria-label={owned ? `已获得：${badge.name}` : `未获得：${badge.name}`}
                            onClick={() =>
                              showToast(
                                owned ? `「${badge.name}」${badge.desc}` : `「${badge.name}」还没点亮 · 再读 30 分钟随机抽取`,
                              )
                            }
                          >
                            <span className="pp-badge-icon" aria-hidden="true">
                              {badge.icon}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="pp-case-foot">
                    <span className="pp-case-dot" aria-hidden="true" />
                    灰色为未获得，每读 30 分钟随机点亮一枚
                  </p>
                </section>

                <section className="pp-block">
                  <div className="pp-block-head">
                    <h3>个人身份</h3>
                    <span>可随时修改</span>
                  </div>

                  <div className="pp-row">
                    <span className="pp-row-label">性别</span>
                    <div className="pp-seg" role="group" aria-label="性别">
                      {GENDERS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`pp-seg-item${active.gender === item.id ? ' is-on' : ''}`}
                          aria-pressed={active.gender === item.id}
                          onClick={() => updatePassport({ gender: item.id })}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pp-row">
                    <span className="pp-row-label">头像</span>
                    <button className="pp-row-avatar" type="button" onClick={openSheet}>
                      <Avatar tone={currentAvatar.tone} />
                      <span>
                        {currentAvatar.label}
                        <small>更换</small>
                      </span>
                      <i aria-hidden="true">›</i>
                    </button>
                  </div>
                </section>

                <p className="pp-note">
                  阅读时长与徽章按手机号分开存在本机，刷新或重新登录后会自动恢复。
                </p>

                <div className="pp-actions">
                  <Link className="pp-ghost-btn" href="/experience">
                    返回 AI 系统
                  </Link>
                  <button className="pp-ghost-btn pp-ghost-btn--danger" type="button" onClick={logout}>
                    退出登录
                  </button>
                </div>
              </div>
            )}

            <span className="pp-home-bar" aria-hidden="true" />

            {sheet && active && (
              <div className="pp-sheet" role="dialog" aria-modal="true" aria-label="更换头像">
                <button
                  className="pp-sheet-backdrop"
                  type="button"
                  aria-label="关闭"
                  onClick={() => setSheet(false)}
                />
                <div className="pp-sheet-panel">
                  <header className="pp-sheet-head">
                    <b>更换头像</b>
                    <button ref={doneRef} className="pp-sheet-done" type="button" onClick={() => setSheet(false)}>
                      完成
                    </button>
                  </header>
                  <p className="pp-sheet-copy">选择一种底色，头像会立刻更新到护照卡。</p>
                  <div className="pp-sheet-grid">
                    {AVATARS.map((item, index) => (
                      <button
                        key={item.tone}
                        type="button"
                        className={`pp-sheet-item${active.avatar === index ? ' is-on' : ''}`}
                        aria-pressed={active.avatar === index}
                        onClick={() => {
                          updatePassport({ avatar: index });
                          setSheet(false);
                          showToast(`头像已更换为「${item.label}」`);
                        }}
                      >
                        <Avatar tone={item.tone} />
                        <small>{item.label}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {reward && (
              <div className="pp-reward" role="dialog" aria-modal="true" aria-label="获得新徽章">
                <button className="pp-reward-backdrop" type="button" aria-label="关闭" onClick={closeReward} />
                <div className="pp-reward-card">
                  <span className="pp-reward-kicker">NEW BADGE UNLOCKED</span>

                  <div className="pp-reward-medal">
                    <span className="pp-reward-emoji">{reward.badge.icon}</span>
                  </div>

                  <p className="pp-reward-title">恭喜获得新徽章</p>
                  <h4 className="pp-reward-name">{reward.badge.name}</h4>
                  <p className="pp-reward-desc">{reward.badge.desc}</p>

                  <div className="pp-reward-progress">
                    <div className="pp-reward-bar" aria-hidden="true">
                      <i style={{ width: `${(reward.total / BADGE_TOTAL) * 100}%` }} />
                    </div>
                    <span className="pp-reward-count">
                      已收集 <b>{reward.total}</b> / {BADGE_TOTAL} 枚
                      {reward.total === BADGE_TOTAL ? ' · 全部集齐' : ''}
                    </span>
                  </div>

                  <button ref={rewardRef} className="pp-reward-btn" type="button" onClick={closeReward}>
                    收下徽章
                  </button>
                </div>
              </div>
            )}

            <div className={`pp-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
              {toast}
            </div>
          </div>
        </div>

        <p className="pp-caption">
          {ready && view === 'home' && active ? `已领取 · ${active.uid}` : '未领取 · 输入手机号即可体验'}
        </p>
      </article>

      <aside className="pp-aside">
        <span className="pp-aside-kicker">DEMO NOTES</span>
        <ul className="pp-tips">
          <li>
            <b>01</b>
            输入任意合法的 11 位手机号即可领取，演示不会真实发送短信。
          </li>
          <li>
            <b>02</b>
            8 位编号由手机号唯一推导，同一号码每次进来都是同一本护照。
          </li>
          <li>
            <b>03</b>
            每次「模拟阅读 30 分钟」累计时长 ＋30，并从 20 枚徽章里随机点亮一枚尚未获得的。
          </li>
          <li>
            <b>04</b>
            性别、头像、阅读时长与徽章都按手机号存在本机，刷新后自动恢复。
          </li>
        </ul>
      </aside>
    </div>
  );
}
