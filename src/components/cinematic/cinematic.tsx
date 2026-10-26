'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const FRAME_COUNT = 145;
const TOUCH = { threshold: 44, axisRatio: 1.15 };
const PRELOAD = { background: 3, foreground: 8, idleTimeout: 300 };

type SeqKey = 'space' | 'problem';

const SEQS: Record<SeqKey, { dir: string; frames: HTMLImageElement[] }> = {
  space: { dir: '/seq_space', frames: [] },
  problem: { dir: '/seq_problem', frames: [] },
};

const DATA_ROWS = [
  { at: 0.18, n: '58%', t: '首要目的为拍照、游览' },
  { at: 0.38, n: '34%', t: '以阅读、学习为主要目的' },
  { at: 0.62, n: '52%', t: '停留时间不足30分钟' },
];

const HINTS = {
  start: { desktop: '滚动 / 回车，开始第一章', mobile: '左滑继续 · 右滑返回' },
  afterCheckIn: { desktop: '继续滚动，看见打卡之后', mobile: '继续左滑，看见打卡之后' },
  chooseDirection: { desktop: '继续滚动，选择探索方向', mobile: '继续左滑，选择探索方向' },
  explore: { desktop: '选择一个方向，继续探索', mobile: '选择一个方向，继续探索' },
  returning: { desktop: '正在返回开场', mobile: '正在返回开场' },
  lighting: { desktop: '空间正在被重新点亮', mobile: '空间正在被重新点亮' },
};

const frameSrc = (dir: string, index: number) => `${dir}/frame_${String(index + 1).padStart(4, '0')}.webp`;

/** Mirrors the source's blended easing. */
function ease(x: number) {
  const out = 1 - Math.pow(1 - x, 3);
  const inOut = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  return out * 0.55 + inOut * 0.3 + x * 0.15;
}

const MOBILE_QUERY = '(max-width:640px) and (orientation:portrait)';

const isMobilePortrait = () => window.matchMedia(MOBILE_QUERY).matches;

const subscribeMobile = (onChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const mobileSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;

type Hint = { desktop: string; mobile: string };

export default function Cinematic() {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);

  const ctrl = useRef({
    active: false,
    playing: false,
    station: 0,
    loaded: 0,
    failed: 0,
    ready: false,
    loading: false,
    nextFrame: 0,
    inFlight: 0,
    lastSeq: 'space' as SeqKey,
    lastFrame: 0,
    wheelLocked: false,
    touchX: null as number | null,
    touchY: null as number | null,
    raf: 0,
  });

  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [partlyFailed, setPartlyFailed] = useState(false);
  const [active, setActive] = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);
  const [station, setStation] = useState(0);
  const [captionOn, setCaptionOn] = useState(true);
  const [dataOn, setDataOn] = useState(false);
  const [rowsShown, setRowsShown] = useState(0);
  const [questionOn, setQuestionOn] = useState(false);
  const [outroOn, setOutroOn] = useState(false);
  const [hint, setHint] = useState<Hint>(HINTS.start);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const mobileLayout = useSyncExternalStore(subscribeMobile, mobileSnapshot, () => false);

  const viewport = () => ({
    w: document.documentElement.clientWidth,
    h: window.visualViewport ? window.visualViewport.height : window.innerHeight,
  });

  const draw = useCallback((name: SeqKey, index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)));
    const img = SEQS[name].frames[clamped];
    if (!img || !img.complete || !img.naturalWidth) return;
    const c = ctrl.current;
    c.lastSeq = name;
    c.lastFrame = clamped;
    const v = viewport();
    ctx.fillStyle = '#080b0a';
    ctx.fillRect(0, 0, v.w, v.h);
    if (isMobilePortrait()) {
      const bg = Math.max(v.w / img.naturalWidth, v.h / img.naturalHeight);
      const bw = img.naturalWidth * bg;
      const bh = img.naturalHeight * bg;
      ctx.save();
      ctx.filter = 'blur(18px) brightness(.42)';
      ctx.drawImage(img, (v.w - bw) / 2 - 10, (v.h - bh) / 2 - 10, bw + 20, bh + 20);
      ctx.restore();
      const fg = Math.min(v.w / img.naturalWidth, (v.h * 0.44) / img.naturalHeight);
      const fw = img.naturalWidth * fg;
      const fh = img.naturalHeight * fg;
      ctx.drawImage(img, (v.w - fw) / 2, Math.max(74, v.h * 0.14), fw, fh);
    } else {
      const s = Math.max(v.w / img.naturalWidth, v.h / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, (v.w - dw) / 2, (v.h - dh) / 2, dw, dh);
    }
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const v = viewport();
    const dpr = Math.min(window.devicePixelRatio || 1, isMobilePortrait() ? 1.5 : 2);
    canvas.width = Math.round(v.w * dpr);
    canvas.height = Math.round(v.h * dpr);
    canvas.style.width = `${v.w}px`;
    canvas.style.height = `${v.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctrl.current.lastSeq, ctrl.current.lastFrame);
  }, [draw]);

  // Named function expression so the queue can continue from its own callbacks.
  const pump = useCallback(
    function pumpFrames() {
      const c = ctrl.current;
      const limit = c.active ? PRELOAD.foreground : PRELOAD.background;
      const total = FRAME_COUNT * 2;
      const batch: Array<[SeqKey, number]> = [];
      while (c.inFlight < limit && c.nextFrame < total) {
        const i = c.nextFrame++;
        batch.push(i < FRAME_COUNT ? ['space', i] : ['problem', i - FRAME_COUNT]);
      }
      batch.forEach(([key, index]) => {
        const img = new Image();
        SEQS[key].frames[index] = img;
        c.inFlight++;
        img.fetchPriority = c.active ? 'high' : 'low';
        const finish = (ok: boolean) => {
          img.onload = img.onerror = null;
          c.inFlight--;
          if (ok) c.loaded++;
          else c.failed++;
          setPct(Math.round(((c.loaded + c.failed) / total) * 100));
          if (c.loaded + c.failed === total) {
            c.ready = true;
            setReady(true);
            setPartlyFailed(c.failed > 0);
            if (c.active) draw('space', 0);
          }
          pumpFrames();
        };
        img.onload = () => finish(true);
        img.onerror = () => finish(false);
        img.src = frameSrc(SEQS[key].dir, index);
      });
    },
    [draw],
  );

  const load = useCallback(() => {
    const c = ctrl.current;
    if (c.loading) return;
    c.loading = true;
    pump();
  }, [pump]);

  const updateData = useCallback((p: number) => {
    setRowsShown(DATA_ROWS.filter((row) => p >= row.at).length);
    setQuestionOn(p >= 0.84);
  }, []);

  const animate = useCallback(
    (
      name: SeqKey,
      from: number,
      to: number,
      duration: number,
      onTick?: (p: number) => void,
      done?: () => void,
    ) => {
      const c = ctrl.current;
      if (c.playing) return;
      c.playing = true;
      const start = performance.now();
      const tick = (now: number) => {
        const raw = Math.min(1, (now - start) / duration);
        const p = ease(raw);
        draw(name, from + (to - from) * p);
        onTick?.((from + (to - from) * p) / (FRAME_COUNT - 1));
        if (raw < 1) {
          c.raf = requestAnimationFrame(tick);
        } else {
          c.playing = false;
          draw(name, to);
          done?.();
        }
      };
      c.raf = requestAnimationFrame(tick);
    },
    [draw],
  );

  const playSpace = useCallback(
    (reverse: boolean) => {
      const c = ctrl.current;
      setDataOn(false);
      setOutroOn(false);
      setCaptionOn(true);
      setHint(reverse ? HINTS.returning : HINTS.lighting);
      animate('space', reverse ? 144 : 0, reverse ? 0 : 144, 6000, undefined, () => {
        c.station = reverse ? 0 : 1;
        setStation(c.station);
        setHint(c.station === 0 ? HINTS.start : HINTS.afterCheckIn);
      });
    },
    [animate],
  );

  const enterProblem = useCallback(() => {
    const c = ctrl.current;
    if (c.playing) return;
    c.playing = true;
    if (blackoutRef.current) blackoutRef.current.style.opacity = '1';
    window.setTimeout(() => {
      draw('problem', 0);
      setCaptionOn(false);
      setDataOn(true);
      setRowsShown(0);
      setQuestionOn(false);
      if (blackoutRef.current) blackoutRef.current.style.opacity = '0';
      window.setTimeout(() => {
        c.playing = false;
        animate('problem', 0, 144, 6000, updateData, () => {
          c.station = 2;
          updateData(1);
          setStation(2);
          setHint(HINTS.chooseDirection);
        });
      }, 380);
    }, 360);
  }, [animate, draw, updateData]);

  const reverseProblem = useCallback(() => {
    const c = ctrl.current;
    setRowsShown(0);
    setQuestionOn(false);
    animate('problem', 144, 0, 5200, (p) => updateData(p), () => {
      c.playing = true;
      if (blackoutRef.current) blackoutRef.current.style.opacity = '1';
      window.setTimeout(() => {
        draw('space', 144);
        setDataOn(false);
        setCaptionOn(true);
        if (blackoutRef.current) blackoutRef.current.style.opacity = '0';
        c.station = 1;
        setStation(1);
        setHint(HINTS.afterCheckIn);
        window.setTimeout(() => {
          c.playing = false;
        }, 380);
      }, 360);
    });
  }, [animate, draw, updateData]);

  const open = useCallback(() => {
    const c = ctrl.current;
    c.active = true;
    c.station = 0;
    c.playing = false;
    setActive(true);
    setStation(0);
    setLoaderDone(c.ready);
    setCaptionOn(true);
    setDataOn(false);
    setOutroOn(false);
    setRowsShown(0);
    setQuestionOn(false);
    setHint(HINTS.start);
    resize();
    load();
    if (c.ready) draw('space', 0);
  }, [draw, load, resize]);

  const close = useCallback(() => {
    const c = ctrl.current;
    c.active = false;
    setActive(false);
    // 不再给 body 加内联 overflow:hidden —— 覆盖层本身是 fixed inset:0，
    // 关闭后由外层重新掌控滚动，避免任何情况下整页被锁死。
    document.body.style.removeProperty('overflow');
    try {
      sessionStorage.setItem('shuxiangIntroSeen', '1');
    } catch {}
  }, []);

  const start = () => {
    ctrl.current.active = true;
    setActive(true);
    setLoaderDone(true);
    draw('space', 0);
  };

  const advance = useCallback(() => {
    const c = ctrl.current;
    if (!c.active || c.playing || !c.ready) return;
    if (c.station === 0) playSpace(false);
    else if (c.station === 1) enterProblem();
    else if (c.station === 2) {
      c.station = 3;
      setStation(3);
      setOutroOn(true);
      setDataOn(false);
      setHint(HINTS.explore);
    }
  }, [enterProblem, playSpace]);

  const retreat = useCallback(() => {
    const c = ctrl.current;
    if (!c.active || c.playing || !c.ready) return;
    if (c.station === 3) {
      setOutroOn(false);
      setDataOn(true);
      c.station = 2;
      setStation(2);
      setHint(HINTS.chooseDirection);
    } else if (c.station === 2) reverseProblem();
    else if (c.station === 1) playSpace(true);
  }, [playSpace, reverseProblem]);

  useEffect(() => {
    const backgroundLoad = () => {
      if (ctrl.current.loading) return;
      if ('requestIdleCallback' in window) {
        (
          window as unknown as {
            requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
          }
        ).requestIdleCallback(() => load(), { timeout: PRELOAD.idleTimeout });
      } else {
        setTimeout(() => load(), 50);
      }
    };
    if (document.readyState === 'complete') backgroundLoad();
    else window.addEventListener('load', backgroundLoad, { once: true });
    return () => window.removeEventListener('load', backgroundLoad);
  }, [load]);

  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem('shuxiangIntroSeen'));
    } catch {}
    if (location.hash === '#cinematic') open();
    else if (!seen) setChoiceOpen(true);
  }, [open]);

  useEffect(() => {
    const handler = () => {
      setChoiceOpen(false);
      try {
        sessionStorage.setItem('shuxiangIntroSeen', '1');
      } catch {}
      open();
    };
    window.addEventListener('cine:open', handler);
    return () => window.removeEventListener('cine:open', handler);
  }, [open]);

  useEffect(() => {
    const c = ctrl.current;
    const onWheel = (event: WheelEvent) => {
      if (!c.active) return;
      event.preventDefault();
      if (c.wheelLocked) return;
      c.wheelLocked = true;
      if (event.deltaY > 0) advance();
      else retreat();
      window.setTimeout(() => {
        c.wheelLocked = false;
      }, 420);
    };
    const onKey = (event: KeyboardEvent) => {
      if (!c.active) return;
      if (['Enter', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        advance();
      }
      if (['ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        retreat();
      }
      if (event.key === 'Escape') close();
    };
    const onTouchStart = (event: TouchEvent) => {
      if (c.active) {
        c.touchX = event.touches[0].clientX;
        c.touchY = event.touches[0].clientY;
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      if (c.active) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!c.active || c.touchX === null) return;
      const dx = event.changedTouches[0].clientX - c.touchX;
      const dy = event.changedTouches[0].clientY - (c.touchY ?? 0);
      if (Math.abs(dx) > TOUCH.threshold && Math.abs(dx) > Math.abs(dy) * TOUCH.axisRatio) {
        (dx < 0 ? advance : retreat)();
      }
      c.touchX = null;
      c.touchY = null;
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      cancelAnimationFrame(c.raf);
      // 兜底：卸载、路由切换或热更新后，清掉任何残留的内联滚动锁
      document.body.style.removeProperty('overflow');
    };
  }, [advance, close, resize, retreat]);

  return (
    <>
      {choiceOpen && (
        <div className="opening-choice" id="openingChoice">
          <button
            className="opening-choice-close"
            type="button"
            aria-label="关闭序章提示"
            onClick={() => {
              try {
                sessionStorage.setItem('shuxiangIntroSeen', '1');
              } catch {}
              setChoiceOpen(false);
            }}
          >
            ×
          </button>
          <div className="kicker">OPENING CHOICE</div>
          <h3>先看一段电影序章？</h3>
          <p>约两章，呈现“格子空间重生”与“问题数据浮现”。也可以直接进入正文，之后随时返回观看。</p>
          <div className="button-row">
            <button
              className="btn clay"
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('shuxiangIntroSeen', '1');
                } catch {}
                setChoiceOpen(false);
                open();
              }}
            >
              观看序章
            </button>
            <button
              className="btn light"
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('shuxiangIntroSeen', '1');
                } catch {}
                setChoiceOpen(false);
              }}
            >
              直接进入
            </button>
          </div>
        </div>
      )}

      <div
        className={`cine-shell${active ? ' active' : ''}`}
        id="cineShell"
        ref={shellRef}
        aria-label="香山书房电影序章"
        aria-modal="true"
        role="dialog"
      >
        <canvas id="cineCanvas" ref={canvasRef} />
        <div className="cine-vignette" />
        <div className="cine-blackout" id="cineBlackout" ref={blackoutRef} />
        <div className="cine-brand">
          <i>数</i>
          <span>香山书房 · 电影序章</span>
        </div>
        <button className="cine-skip" type="button" onClick={close}>
          跳过序章
        </button>
        <div className="cine-caption" id="cineCaption" style={{ display: captionOn ? 'block' : 'none' }}>
          <div className="kicker">CHAPTER 01 · SPACE REBORN</div>
          <h2>
            旧空间
            <br />
            <span>新生长</span>
          </h2>
          <p>从工业旧楼到城市文化会客厅，保留时间留下的结构，让阅读重新进入日常。</p>
        </div>
        <div className={`cine-data${dataOn ? ' on' : ''}`} id="cineData">
          <div className="data-kicker">CHAPTER 02 · AFTER THE CHECK-IN</div>
          {DATA_ROWS.map((row, index) => (
            <div key={row.n} className={`cine-data-row${rowsShown > index ? ' show' : ''}`} data-at={row.at}>
              <div className="n">{row.n}</div>
              <div className="t">{row.t}</div>
            </div>
          ))}
          <div className={`cine-question${questionOn ? ' show' : ''}`} id="cineQuestion">
            问题不是“有没有人来”
            <br />
            而是“来了以后，是否愿意留下”
          </div>
        </div>
        <div className={`cine-outro${outroOn ? ' on' : ''}`} id="cineOutro">
          <div className="cine-outro-inner">
            <div className="kicker">CONTINUE THE STORY</div>
            <h2>从光影，进入书房</h2>
            <p>沿着城市阅读长卷，继续看见书房网络、数字护照与运营证据。</p>
            <div className="button-row">
              <button className="btn clay" type="button" onClick={close}>
                进入首页
              </button>
            </div>
          </div>
        </div>
        <div className="cine-hud">
          <div className="cine-dots">
            {[0, 1, 2, 3].map((index) => (
              <i key={index} className={station === index ? 'on' : undefined} />
            ))}
          </div>
          <span id="cineHint">{mobileLayout ? hint.mobile : hint.desktop}</span>
        </div>
        <div className={`cine-loader${loaderDone ? ' done' : ''}`} id="cineLoader" ref={loaderRef}>
          <div className="cine-loader-inner">
            <h2>正在准备电影序章</h2>
            <p>光影即将展开，请稍候。</p>
            <div className="load-track">
              <div className="load-bar" id="cineLoadBar" style={{ width: `${pct}%` }} />
            </div>
            <div className="load-meta">
              <span>电影序章</span>
              <span id="cineLoadPct">{pct}%</span>
            </div>
            <button
              className={`btn clay cine-enter${ready ? ' ready' : ''}`}
              id="cineEnter"
              type="button"
              onClick={start}
            >
              {partlyFailed ? '进入序章（部分帧未载入）' : '进入电影序章'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
