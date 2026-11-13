import { useMemo, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { EQUATIONS } from '../data/equations.js'
import { QUESTIONS } from '../data/questions.js'
import { TOPICS, TOPIC_ORDER } from '../data/topics.js'
import {
  estimateRaw,
  last7DaysAccuracy,
  topicStats,
  weakTopics,
  weekProgress,
} from '../lib/selectors.js'
import { LADDER, gapToTarget, rawToAssigned } from '../lib/score.js'
import { dateStr } from '../lib/plan.js'
import { generateWeeklyReport, ruleReport } from '../lib/ai.js'
import { IconSpark } from '../components/Icons.jsx'

const TOPIC_OF = new Map()
for (const e of EQUATIONS) TOPIC_OF.set(e.id, e.topic)
for (const q of QUESTIONS) TOPIC_OF.set(q.id, q.topic)

export default function Progress() {
  const app = useApp()
  const state = app.state
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const raw = estimateRaw(state, 10)
  const gap = raw === null ? null : gapToTarget(raw, state.profile.targetAssigned)
  const week = weekProgress(state)
  const ts = topicStats(state)
  const weak = weakTopics(state, 3)
  const days = last7DaysAccuracy(state)
  const reports = state.reports || []

  const stats = useMemo(() => buildStats(state), [state])

  const makeReport = async () => {
    setBusy(true)
    setErr('')
    try {
      const ai = state.settings.ai
      const configured = ai.mode !== 'off' && (ai.apiKey || ai.mode === 'proxy')
      let report
      if (configured) {
        try {
          report = await generateWeeklyReport({ ai, stats, week: week.week })
          report.source = 'ai'
        } catch (e) {
          report = ruleReport({ stats, week: week.week })
          report.source = 'rule'
          report.note = 'AI 暂时不可用，先用规则版：' + e.message
        }
      } else {
        report = ruleReport({ stats, week: week.week })
        report.source = 'rule'
      }
      app.saveReport({
        week: week.week,
        createdAt: dateStr(),
        report,
      })
    } catch (e) {
      setErr(e.message || '生成失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fade">
      <section className="hero">
        <div className="kicker">最近 10 天估算</div>
        <div className="big num">{raw === null ? '待估' : `${raw} 分`}</div>
        <div className="sub">
          {raw === null
            ? '再做几天题就能估了'
            : `赋分约 ${gap.assigned} · ${gap.text}`}
        </div>
        <div className="row">
          <div className="stat">
            <b className="num">{Math.round((stats.acc || 0) * 100)}%</b>综合正确率
          </div>
          <div className="stat">
            <b className="num">{stats.total}</b>已答
          </div>
          <div className="stat">
            <b className="num">{week.activeDays}</b>打卡天数
          </div>
        </div>
      </section>

      <div className="sec">
        <h2>四道坎</h2>
        <span className="hint">第 {week.week} 周 · {week.conf.theme}</span>
      </div>
      <div className="card">
        {LADDER.map((m, i) => {
          const passed = raw !== null && raw >= m.raw
          const current = week.week >= m.week && (i === 0 || week.week >= LADDER[i - 1].week)
          return (
            <div key={m.week} className="kv" style={{ alignItems: 'center' }}>
              <span className="row" style={{ gap: 8 }}>
                <span className={`pill ${passed ? 'g' : current ? 'b' : ''}`}>
                  W{m.week}
                </span>
                <span>{m.label}</span>
              </span>
              <b className={passed ? '' : 'muted'}>
                {m.raw} 分 · 赋分 {rawToAssigned(m.raw)}
                {passed ? ' ✓' : ''}
              </b>
            </div>
          )
        })}
        <p className="tiny muted mt8">
          按浙江一分一赋估算：85 赋分需要原始分约 85 以上（全市前 15% 左右）。先稳住 80，再冲 85。
        </p>
      </div>

      <div className="sec">
        <h2>最近 7 天</h2>
        <span className="hint">每天正确率</span>
      </div>
      <div className="card">
        {stats.total === 0 && (
          <p className="tiny muted center" style={{ padding: '10px 0' }}>
            还没有作答记录。完成今天的打卡，这里就会出现曲线。
          </p>
        )}
        <div className="spark">
          {days.map((d) => (
            <div key={d.date} className={`col ${d.n ? '' : 'zero'}`}>
              <div
                className="v"
                style={{ height: `${d.n ? Math.max(4, Math.round(d.acc * 100)) : 4}%` }}
                title={`${d.date} ${d.n ? Math.round(d.acc * 100) + '%' : '未打卡'}`}
              />
              <span className="lbl">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <h2>考点掌握</h2>
        <span className="hint">按正确率</span>
      </div>
      <div className="card">
        {TOPIC_ORDER.map((t) => {
          const v = ts[t]
          const acc = v?.acc || 0
          return (
            <div key={t} style={{ marginBottom: 10 }}>
              <div className="between" style={{ marginBottom: 4 }}>
                <span className="small">{TOPICS[t].name}</span>
                <span className="tiny muted num">
                  {v ? `${Math.round(acc * 100)}% · ${v.seen}题` : '未练'}
                </span>
              </div>
              <div className="bar thin">
                <i style={{ width: `${Math.round(acc * 100)}%`, opacity: v ? 1 : 0.25 }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="sec">
        <h2>本周报告</h2>
        <span className="hint">AI 读你的作答记录写的</span>
      </div>

      {weak.length > 0 && (
        <div className="card">
          <p className="small muted">最该补的三块</p>
          <div className="row mt8" style={{ flexWrap: 'wrap' }}>
            {weak.map((w) => (
              <span key={w.topic} className="pill r">
                {TOPICS[w.topic].name}
              </span>
            ))}
          </div>
        </div>
      )}

      <button className="btn soft block mt12" onClick={makeReport} disabled={busy}>
        {busy ? (
          <>
            <span className="spin" /> 正在写…
          </>
        ) : (
          <>
            <IconSpark width="16" height="16" /> 生成周报
          </>
        )}
      </button>
      {err && <div className="fb bad mt12">{err}</div>}

      {reports.length === 0 && <p className="tiny muted center mt12">还没有周报，点上面的按钮生成第一份。</p>}

      {reports.slice(0, 3).map((r, i) => (
        <div key={r.createdAt + i} className="card mt12">
          <div className="between">
            <span className="pill b">第 {r.week} 周</span>
            <span className="tiny muted">
              {r.report.source === 'ai' ? 'AI 生成' : '规则版'} · {r.createdAt}
            </span>
          </div>
          <p className="small mt8" style={{ lineHeight: 1.7 }}>
            {r.report.summary}
          </p>

          {r.report.recommended?.length > 0 && (
            <>
              <p className="label">接下来主攻</p>
              {r.report.recommended.map((x) => (
                <div key={x.topic} className="kv">
                  <span>
                    {x.topic} <span className="tiny muted">× {x.count}</span>
                  </span>
                  <span className="tiny muted" style={{ maxWidth: '55%', textAlign: 'right' }}>
                    {x.why}
                  </span>
                </div>
              ))}
            </>
          )}

          {r.report.plan7d?.length > 0 && (
            <>
              <p className="label">七天安排</p>
              {r.report.plan7d.map((line, idx) => (
                <div key={idx} className="kv">
                  <span className="tiny">{line}</span>
                </div>
              ))}
            </>
          )}

          {r.report.encourage && <p className="tiny muted mt8">{r.report.encourage}</p>}
          {r.report.note && <p className="tiny muted mt8">{r.report.note}</p>}
        </div>
      ))}
    </div>
  )
}

function buildStats(state) {
  const cutoff = 7
  const days = Object.entries(state.days || {})
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, cutoff)

  const acc = {}
  const reasons = {}
  let total = 0
  let correct = 0
  const daily = []

  for (const [d, day] of days) {
    let ok = 0
    for (const it of day.items || []) {
      const t = TOPIC_OF.get(it.id)
      if (!t) continue
      total++
      if (it.ok) {
        correct++
        ok++
      } else if (it.reason) reasons[it.reason] = (reasons[it.reason] || 0) + 1
      acc[t] = acc[t] || { seen: 0, correct: 0 }
      acc[t].seen++
      if (it.ok) acc[t].correct++
    }
    daily.push({ date: d, n: day.items?.length || 0, acc: day.items?.length ? ok / day.items.length : 0 })
  }

  const topics = Object.entries(acc).map(([topic, v]) => ({
    topic,
    ...v,
    acc: v.seen ? v.correct / v.seen : 0,
    weight: TOPICS[topic]?.weight || 3,
  }))

  return {
    topics,
    reasons,
    daily: daily.reverse(),
    total,
    acc: total ? correct / total : 0,
  }
}
