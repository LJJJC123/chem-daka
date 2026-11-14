import { EQUATIONS } from '../data/equations.js'
import { QUESTIONS } from '../data/questions.js'
import { dateStr, daysBetween, isDayDone, weekConf } from './plan.js'
import { TOPICS } from '../data/topics.js'

const INDEX = new Map()
for (const e of EQUATIONS) INDEX.set(e.id, { ...e, kindOfItem: 'eq' })
for (const q of QUESTIONS) INDEX.set(q.id, { ...q, kindOfItem: 'q' })

export function findItem(id) {
  return INDEX.get(id)
}

export function streakOf(state) {
  let n = 0
  let d = dateStr()
  for (let i = 0; i < 400; i++) {
    if (isDayDone(state.days[d])) {
      n++
      d = shift(d, -1)
    } else if (i === 0) {
      // 今天还没打卡，不算断，从昨天开始数
      d = shift(d, -1)
    } else break
  }
  return n
}

function shift(s, n) {
  const [y, m, dd] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, dd, 12)
  dt.setDate(dt.getDate() + n)
  const p = (x) => String(x).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`
}

export function todayInfo(state) {
  const day = state.days[dateStr()] || { items: [], coreDone: 0 }
  return {
    day,
    done: isDayDone(day),
    coreDone: day.coreDone || 0,
    streak: streakOf(state),
  }
}

/** 各考点掌握度：{topic: {seen, correct, acc, weight}} */
export function topicStats(state) {
  const acc = {}
  for (const [id, st] of Object.entries(state.stats || {})) {
    const item = INDEX.get(id)
    if (!item) continue
    const t = item.topic
    acc[t] = acc[t] || { seen: 0, correct: 0 }
    acc[t].seen += st.seen
    acc[t].correct += st.correct
  }
  const out = {}
  for (const [t, v] of Object.entries(acc)) {
    out[t] = { ...v, acc: v.seen ? v.correct / v.seen : 0, weight: TOPICS[t]?.weight || 3 }
  }
  return out
}

/** 最该补的三个考点：正确率 × 分值权重 从低到高 */
export function weakTopics(state, n = 3) {
  const ts = topicStats(state)
  return Object.entries(ts)
    .map(([t, v]) => ({ topic: t, ...v, score: (v.acc || 0) * v.weight }))
    .sort((a, b) => a.score - b.score)
    .slice(0, n)
}

export function last7DaysAccuracy(state, end = dateStr()) {
  const out = []
  for (let i = 6; i >= 0; i--) {
    const d = shift(end, -i)
    const day = state.days[d]
    if (!day || !day.items.length) {
      out.push({ date: d, acc: null, n: 0 })
      continue
    }
    const ok = day.items.filter((x) => x.ok).length
    out.push({ date: d, acc: ok / day.items.length, n: day.items.length })
  }
  return out
}

const PAPER = { mcq: 48, subj: 52 }

/** 用最近 N 天正确率估原始分，再换算赋分 */
export function estimateRaw(state, days = 10) {
  const items = []
  for (let i = 0; i < days; i++) {
    const d = shift(dateStr(), -i)
    const day = state.days[d]
    if (day) items.push(...day.items.filter((x) => INDEX.has(x.id)))
  }
  if (items.length < 8) return null
  const acc = items.filter((x) => x.ok).length / items.length
  // 选择题正确率普遍高于大题，大题打个折
  const raw = acc * PAPER.mcq + Math.max(0, acc - 0.12) * PAPER.subj
  return Math.round(Math.min(100, Math.max(0, raw)))
}

export function weekProgress(state) {
  const start = state.profile.startDate
  const rawDays = daysBetween(start, dateStr())
  const elapsed = Math.max(0, rawDays)
  const week = Math.max(1, Math.min(8, Math.floor(elapsed / 7) + 1))
  const conf = weekConf(week)
  const total = Object.keys(state.days).length
  return { week, conf, elapsed, activeDays: total, daysToStart: Math.max(0, -rawDays) }
}
