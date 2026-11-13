import { useMemo, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { EQUATIONS } from '../data/equations.js'
import { QUESTIONS } from '../data/questions.js'
import { TOPICS } from '../data/topics.js'
import { prettyEquation } from '../lib/chem.js'
import { IconRight } from '../components/Icons.jsx'

const INDEX = new Map()
for (const e of EQUATIONS) INDEX.set(e.id, { ...e, kind: 'eq' })
for (const q of QUESTIONS) INDEX.set(q.id, { ...q, kind: 'q' })

export default function Mistakes({ onStart }) {
  const app = useApp()
  const state = app.state
  const [onlyTopic, setOnlyTopic] = useState('all')

  const rows = useMemo(() => {
    const aiIndex = new Map((state.aiQuestions || []).map((q) => [q.id, q]))
    return Object.entries(state.mistakes || {})
      .map(([id, m]) => {
        const item = INDEX.get(id) || aiIndex.get(id)
        return item ? { item, m } : null
      })
      .filter(Boolean)
      .sort((a, b) => (b.m.count || 1) - (a.m.count || 1))
  }, [state.mistakes, state.aiQuestions])

  const groups = useMemo(() => {
    const g = {}
    for (const r of rows) {
      if (onlyTopic !== 'all' && r.item.topic !== onlyTopic) continue
      g[r.item.topic] = g[r.item.topic] || []
      g[r.item.topic].push(r)
    }
    return g
  }, [rows, onlyTopic])

  const total = rows.length

  const redo = (list) => {
    const steps = list.slice(0, 12).map((r) => ({ kind: r.item.kind, item: r.item, blind: false }))
    if (!steps.length) return
    onStart({ title: '错题重做', steps })
  }

  if (!total) {
    return (
      <div className="empty">
        <p>还没有错题。</p>
        <p className="mt8">做错的题会自动进来，第二天再考你一遍。</p>
      </div>
    )
  }

  return (
    <div className="fade">
      <div className="card">
        <div className="between">
          <div>
            <p className="small muted">错题本</p>
            <p style={{ fontSize: 24, fontWeight: 750 }} className="num">
              {total} <span className="small muted">道</span>
            </p>
          </div>
          <button className="btn sm" onClick={() => redo(rows)}>
            全部重做
          </button>
        </div>
      </div>

      <div className="row mt12" style={{ flexWrap: 'wrap', gap: 6 }}>
        <button className={`pill ${onlyTopic === 'all' ? 'b' : ''}`} onClick={() => setOnlyTopic('all')}>
          全部
        </button>
        {Object.keys(groups).map((t) => (
          <button key={t} className={`pill ${onlyTopic === t ? 'b' : ''}`} onClick={() => setOnlyTopic(t)}>
            {TOPICS[t]?.name || t} {groups[t].length}
          </button>
        ))}
      </div>

      <div className="mt12">
        {Object.entries(groups).map(([t, list]) => (
          <div key={t} className="card mt12">
            <div className="between">
              <b>{TOPICS[t]?.name || t}</b>
              <button className="btn sm ghost" onClick={() => redo(list)}>
                重做 {Math.min(list.length, 12)}
              </button>
            </div>
            <div className="divider" />
            {list.slice(0, 6).map(({ item, m }) => (
              <div key={item.id} className="kv" style={{ alignItems: 'center' }}>
                <span style={{ flex: 1, fontSize: 13 }}>
                  {item.kind === 'eq' ? prettyEquation(item.eq) : item.q}
                </span>
                <span className="pill r">×{m.count}</span>
              </div>
            ))}
            {list.length > 6 && <p className="tiny muted mt8">还有 {list.length - 6} 道…</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
