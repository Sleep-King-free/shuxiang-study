/**
 * Cloudflare Pages Functions · POST /api/chat
 *
 * 请求体：{ "prompt": "帮我策划一场周末亲子共读活动" }
 * 响应体：{ ok: true, content: "…", model: "deepseek-chat", usage: { … } }
 * 错误体：{ ok: false, error: "…" }
 *
 * 部署要点：
 *   1. 本文件对应路由 /api/chat（functions/api/chat.js → /api/chat）
 *   2. 密钥在 Cloudflare Pages 项目 Settings → Variables and Secrets 里配置
 *      DEEPSEEK_API_KEY（建议选 Secret / 加密），本地开发写在 .dev.vars 中
 *   3. 同域部署，前端直接 fetch('/api/chat') 即可，无需 CORS
 */

const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';
const SYSTEM_PROMPT = '你是香山书房的活动策划专家';

/** 单次最多接收 2000 字，避免一次请求把 token 打满 */
const MAX_PROMPT_LENGTH = 2000;
/** 上游超时（毫秒）。Pages Functions 等待 I/O 不计 CPU 时间 */
const TIMEOUT_MS = 55000;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

export async function onRequestPost({ request, env }) {
  // 1. 密钥
  const apiKey = typeof env.DEEPSEEK_API_KEY === 'string' ? env.DEEPSEEK_API_KEY.trim() : '';
  if (!apiKey) {
    return json({ ok: false, error: '服务端未配置 DEEPSEEK_API_KEY' }, 500);
  }

  // 2. 入参
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: '请求体必须是合法 JSON' }, 400);
  }

  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return json({ ok: false, error: 'prompt 不能为空' }, 400);
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return json({ ok: false, error: `prompt 过长，最多 ${MAX_PROMPT_LENGTH} 字` }, 413);
  }

  // 3. 请求 DeepSeek
  let upstream;
  try {
    upstream = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1200,
        stream: false,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timeout = error?.name === 'TimeoutError';
    return json(
      { ok: false, error: timeout ? '模型响应超时，请稍后重试' : '无法连接模型服务' },
      timeout ? 504 : 502,
    );
  }

  // 4. 上游错误（401 密钥失效 / 402 余额不足 / 429 限流 …）：限流原样返回，其余统一 502
  if (!upstream.ok) {
    const raw = await upstream.text().catch(() => '');
    let detail = raw.slice(0, 300);
    try {
      const parsed = JSON.parse(raw);
      detail = parsed?.error?.message || detail;
    } catch {
      /* 上游返回的不是 JSON，保留截断后的原文 */
    }
    return json(
      {
        ok: false,
        error: '模型服务返回错误',
        status: upstream.status,
        detail: detail || null,
      },
      upstream.status === 429 ? 429 : 502,
    );
  }

  // 5. 取正文
  let data;
  try {
    data = await upstream.json();
  } catch {
    return json({ ok: false, error: '模型返回内容无法解析' }, 502);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    return json({ ok: false, error: '模型未返回内容' }, 502);
  }

  return json({
    ok: true,
    content: content.trim(),
    model: data.model ?? MODEL,
    usage: data.usage ?? null,
  });
}

/** 非 POST 走这里，避免把 404 当成路由不存在 */
export async function onRequest({ request }) {
  return json(
    { ok: false, error: `不支持的请求方法 ${request.method}，请使用 POST` },
    405,
    { allow: 'POST' },
  );
}
