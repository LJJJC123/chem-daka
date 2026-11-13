import { TOPICS } from '../data/topics.js'

export const PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { id: 'custom', name: '自定义', baseUrl: '', model: '' },
]

export function providerOf(id) {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0]
}

const PROXY = '/api'

export async function health() {
  try {
    const r = await fetch(`${PROXY}/health`, { signal: AbortSignal.timeout(2500) })
    if (!r.ok) return { ok: false }
    return await r.json()
  } catch {
    return { ok: false }
  }
}

function pickBase(ai) {
  if (ai.baseUrl) return ai.baseUrl.replace(/\/$/, '')
  return providerOf(ai.provider).baseUrl
}

function pickModel(ai) {
  return ai.model || providerOf(ai.provider).model
}

async function directChat(ai, body) {
  const key = ai.apiKey
  if (!key) throw new Error('还没填 API Key')
  const url = `${pickBase(ai)}/chat/completions`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`请求失败 ${r.status} ${t.slice(0, 120)}`)
  }
  return r.json()
}

/**
 * 统一调用入口：优先本地代理（Key 不进浏览器），失败再试直连。
 */
export async function chat({ ai, messages, json = false, temperature = 0.4, maxTokens = 1200 }) {
  if (ai.mode === 'off') throw new Error('AI 已关闭')
  const body = {
    model: pickModel(ai),
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  }

  if (ai.mode === 'proxy') {
    try {
      const r = await fetch(`${PROXY}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000),
      })
      if (r.ok) {
        const data = await r.json()
        return data.choices?.[0]?.message?.content ?? ''
      }
      const err = await r.text().catch(() => '')
      throw new Error(err.slice(0, 200) || `代理返回 ${r.status}`)
    } catch (e) {
      if (!ai.apiKey) throw new Error(`本地代理没开：先在终端跑 pnpm api（${e.message}）`)
    }
  }

  const data = await directChat(ai, body)
  return data.choices?.[0]?.message?.content ?? ''
}

export function parseJson(text) {
  if (!text) return null
  const s = text.indexOf('{')
  const e = text.lastIndexOf('}')
  if (s < 0 || e < 0) return null
  try {
    return JSON.parse(text.slice(s, e + 1))
  } catch {
    return null
  }
}

/* ---------------- 周报 ---------------- */

const REPORT_SYSTEM = `你是浙江高中化学教研员，负责给一名高二选考学生写每周学习报告。
学生目标：期末温州统考 A 卷，赋分 85+。
只能基于给你的统计数据，不许编造题目或分数。
输出 JSON：{
  "summary": "两句话总结这一周",
  "weak": [{"topic":"考点名","acc":0.6,"why":"一句话原因"}],
  "recommended": [{"topic":"考点名","count":12,"why":"为什么先练这个"}],
  "plan7d": ["周一 …","周二 …"],
  "encourage": "一句话"
}
weak 最多 3 个，recommended 最多 3 个，plan7d 必须 7 条且每天不超过 25 分钟。`

export async function generateWeeklyReport({ ai, stats, week }) {
  const payload = {
    week,
    考点: stats.topics.map((t) => ({
      名称: TOPICS[t.topic]?.name || t.topic,
      正确率: Number((t.acc || 0).toFixed(2)),
      做过: t.seen,
      分值权重: t.weight,
    })),
    错因: stats.reasons,
    每日: stats.daily,
    总答题: stats.total,
    综合正确率: stats.acc,
  }
  const text = await chat({
    ai,
    json: true,
    temperature: 0.3,
    messages: [
      { role: 'system', content: REPORT_SYSTEM },
      { role: 'user', content: JSON.stringify(payload) },
    ],
  })
  const data = parseJson(text)
  if (!data || !data.summary) throw new Error('周报解析失败')
  return normalizeReport(data)
}

export function ruleReport({ stats, week }) {
  const weak = [...stats.topics].sort((a, b) => (a.acc || 0) * a.weight - (b.acc || 0) * b.weight).slice(0, 3)
  const recommended = weak.map((t) => ({
    topic: TOPICS[t.topic]?.name || t.topic,
    count: Math.max(8, Math.round(20 * (1 - (t.acc || 0)))),
    why: `正确率 ${Math.round((t.acc || 0) * 100)}%，但 A 卷这个考点权重高`,
  }))
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return normalizeReport({
    summary: `第 ${week} 周：共答 ${stats.total} 题，正确率 ${Math.round((stats.acc || 0) * 100)}%。薄弱点集中在 ${
      weak.map((t) => TOPICS[t.topic]?.name || t.topic).join('、') || '暂无'
    }。`,
    weak: weak.map((t) => ({
      topic: TOPICS[t.topic]?.name || t.topic,
      acc: Number((t.acc || 0).toFixed(2)),
      why: `做了 ${t.seen} 题，错了 ${t.seen - t.correct} 题`,
    })),
    recommended,
    plan7d: days.map((d, i) => {
      const t = recommended[i % Math.max(1, recommended.length)]?.topic || '错题回顾'
      return `${d}：${i === 6 ? '错题清零 + 16 题限时' : `${t} 6 题 + 复习错题`}（约 22 分钟）`
    }),
    encourage: '每天 30 分钟，比周末突击 3 小时有用得多。',
  })
}

function normalizeReport(d) {
  return {
    summary: String(d.summary || '').slice(0, 400),
    weak: (d.weak || []).slice(0, 3).map((w) => ({
      topic: String(w.topic || '').slice(0, 40),
      acc: Number(w.acc) || 0,
      why: String(w.why || '').slice(0, 80),
    })),
    recommended: (d.recommended || []).slice(0, 3).map((r) => ({
      topic: String(r.topic || '').slice(0, 40),
      count: Number(r.count) || 10,
      why: String(r.why || '').slice(0, 80),
    })),
    plan7d: (d.plan7d || []).slice(0, 7).map((x) => String(x).slice(0, 60)),
    encourage: String(d.encourage || '').slice(0, 80),
    source: d.source || 'ai',
  }
}

/* ---------------- AI 出题 ---------------- */

const GEN_SYSTEM = `你是浙江省高考化学命题人。出一道单项选择题，考点限定为用户指定的考点。
要求：
1. 四个选项只有一个正确；干扰项要像真的，不能太离谱；
2. 化学式、方程式、数据必须科学正确；能配平的方程式必须配平；
3. 不使用 2024 年以前的旧教材表述；
4. 输出 JSON：{"q":"题干","options":["A项","B项","C项","D项"],"answer":0,"explain":"解析","trap":"陷阱"}
answer 是 0-3 的整数。解析不超过 120 字。`

export async function generateAiQuestion({ ai, topic, difficulty = 2, avoid = [] }) {
  const name = TOPICS[topic]?.name || topic
  const text = await chat({
    ai,
    json: true,
    temperature: 0.7,
    messages: [
      { role: 'system', content: GEN_SYSTEM },
      {
        role: 'user',
        content: `考点：${name}（${topic}）
难度：${difficulty}/3
避免与这些题干重复：${avoid.slice(0, 6).join(' / ') || '无'}`,
      },
    ],
  })
  const data = parseJson(text)
  const q = validateQuestion(data)
  if (!q) throw new Error('生成结果不合格')
  return { ...q, topic, difficulty, source: 'ai' }
}

export function validateQuestion(d) {
  if (!d || typeof d.q !== 'string' || d.q.length < 8) return null
  if (!Array.isArray(d.options) || d.options.length !== 4) return null
  if (d.options.some((o) => typeof o !== 'string' || !o.trim())) return null
  if (!Number.isInteger(d.answer) || d.answer < 0 || d.answer > 3) return null
  if (new Set(d.options.map((o) => o.trim())).size !== 4) return null
  return {
    q: d.q.trim().slice(0, 400),
    options: d.options.map((o) => o.trim().slice(0, 120)),
    answer: d.answer,
    explain: String(d.explain || '').slice(0, 300),
    trap: String(d.trap || '').slice(0, 120),
  }
}

const VERIFY_SYSTEM = `你是化学审题人。检查这道选择题：答案是否唯一正确、干扰项是否真的错误、解析是否自洽、有无科学性错误。
只输出 JSON：{"ok":true/false,"reason":"问题在哪","answerCorrect":0-3 或 -1}`
export async function verifyAiQuestion({ ai, q }) {
  const text = await chat({
    ai,
    json: true,
    temperature: 0.2,
    messages: [
      { role: 'system', content: VERIFY_SYSTEM },
      { role: 'user', content: JSON.stringify(q) },
    ],
  })
  const d = parseJson(text)
  if (!d) return { ok: false, reason: '审题结果无法解析' }
  return { ok: Boolean(d.ok), reason: String(d.reason || '').slice(0, 160) }
}
