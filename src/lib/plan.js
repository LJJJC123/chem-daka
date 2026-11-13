import { EQUATIONS } from '../data/equations.js'
import { QUESTIONS } from '../data/questions.js'
import { CARDS } from '../data/cards.js'
import { TOPICS } from '../data/topics.js'

export const WEEKS = [
  { n: 1, theme: '热化学 · 盖斯定律', topics: ['r1', 'r2'], eq: 6, mcq: 4, lab: 0 },
  { n: 2, theme: '速率 · 平衡 · K', topics: ['r2', 'r3'], eq: 6, mcq: 4, lab: 0 },
  { n: 3, theme: '电离 · 水解 · pH', topics: ['r4', 'r5', 'r6'], eq: 6, mcq: 4, lab: 1 },
  { n: 4, theme: '沉淀溶解 · 电化学', topics: ['r7', 'r8', 'r9'], eq: 6, mcq: 4, lab: 1 },
  { n: 5, theme: '原子结构 · 周期律', topics: ['s1', 's2'], eq: 4, mcq: 4, lab: 0 },
  { n: 6, theme: '分子结构 · 晶体', topics: ['s3', 's4', 's5', 's6'], eq: 4, mcq: 4, lab: 0 },
  { n: 7, theme: '实验 · 流程 · 套卷', topics: ['e1', 'e2', 'r3', 'r6'], eq: 5, mcq: 4, lab: 1, mock: true },
  { n: 8, theme: '错题清零 · 全真', topics: ['r1', 'r3', 'r6', 'r9', 's3', 's5'], eq: 5, mcq: 4, lab: 0, mock: true },
]

export function weekConf(n) {
  return WEEKS[Math.max(1, Math.min(8, n)) - 1]
}

/* ---------------- 日期 ---------------- */

export function dateStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function parseDate(s) {
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

export function addDays(s, n) {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return dateStr(d)
}

export function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000)
}

export function weekOf(start, date) {
  return Math.max(1, Math.min(8, Math.floor(daysBetween(start, date) / 7) + 1))
}

export function daysToExam(examDate, today = dateStr()) {
  return daysBetween(today, examDate)
}

/* ---------------- 抽题 ---------------- */

function hash01(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

const INTERVAL = [1, 2, 4, 7, 15]

function dueDay(st) {
  if (!st || !st.last) return ''
  const gap = INTERVAL[Math.min(st.streak || 0, INTERVAL.length - 1)]
  return addDays(st.last, gap)
}

function weightOf(item, state, today, topicSet) {
  let w = 10
  if (topicSet.has(item.topic)) w += 28
  const st = state.stats?.[item.id]
  const mis = state.mistakes?.[item.id]
  if (!st) w += 42
  if (mis) w += 90 + Math.min(mis.count, 5) * 8
  if (st && st.streak > 0) w -= 6 * Math.min(st.streak, 4)
  if (st && dueDay(st) && dueDay(st) <= today) w += 34
  w += hash01(today + item.id) * 22
  return w
}

const cache = new Map()

function rank(items, state, today, topicSet, key) {
  const memo = `${key}:${today}:${Object.keys(state.stats || {}).length}:${Object.keys(state.mistakes || {}).length}`
  if (cache.has(memo)) return cache.get(memo)
  const sorted = items
    .map((it) => ({ it, w: weightOf(it, state, today, topicSet) }))
    .sort((a, b) => b.w - a.w)
    .map((x) => x.it)
  cache.set(memo, sorted)
  if (cache.size > 40) cache.delete(cache.keys().next().value)
  return sorted
}

function takeDiverse(sorted, n, maxPerTopic = 3) {
  const out = []
  const count = {}
  for (const it of sorted) {
    if (out.length >= n) break
    const c = count[it.topic] || 0
    if (c >= maxPerTopic && out.length < n) continue
    count[it.topic] = c + 1
    out.push(it)
  }
  return out
}

/** 今天要做什么：返回 {week, conf, eqIds, qIds, cards} */
export function pickTasks(state, today = dateStr()) {
  const start = state.profile?.startDate || today
  const week = weekOf(start, today)
  const conf = weekConf(week)
  const topicSet = new Set(conf.topics)

  const eqSorted = rank(EQUATIONS, state, today, topicSet, 'eq')
  const eqItems = takeDiverse(eqSorted, conf.eq, 3)

  const qSorted = rank(QUESTIONS, state, today, topicSet, 'q')
  const qItems = takeDiverse(qSorted, conf.mcq, 2)

  const { main, related } = pickCards(state, today, topicSet)
  return { week, conf, eqItems, qItems, card: main, related }
}

export function pickCards(state, today, topicSet) {
  const byDate = CARDS.map((c) => ({ c, w: hash01(today + c.id) })).sort((a, b) => b.w - a.w).map((x) => x.c)
  const inWeek = byDate.filter((c) => topicSet.has(c.topic))
  const main = (inWeek[0] || byDate[0]) ?? CARDS[0]

  // 第二张：跟最近错得最多的考点相关
  const wrongCount = {}
  for (const [id, m] of Object.entries(state.mistakes || {})) {
    const t = (EQUATIONS.find((e) => e.id === id) || QUESTIONS.find((q) => q.id === id))?.topic
    if (t) wrongCount[t] = (wrongCount[t] || 0) + (m.count || 1)
  }
  const worst = Object.entries(wrongCount).sort((a, b) => b[1] - a[1])[0]?.[0]
  const related =
    byDate.find((c) => c.topic === worst && c.id !== main.id) ||
    byDate.find((c) => c.id !== main.id && TOPICS[c.topic]) ||
    null
  return { main, related }
}

/** 某天的打卡是否完成：核心 3 项都做过 */
export function isDayDone(day) {
  return Boolean(day && day.coreDone >= 3)
}

export function topicWeight(topic) {
  return TOPICS[topic]?.weight || 3
}
