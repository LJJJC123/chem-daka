import { useMemo, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { EQUATIONS } from '../data/equations.js'
import { QUESTIONS } from '../data/questions.js'
import { LABS } from '../data/labs.js'
import { TOPICS, TOPIC_ORDER } from '../data/topics.js'
import { generateAiQuestion, verifyAiQuestion } from '../lib/ai.js'
import { IconFlask, IconSpark, IconTarget } from '../components/Icons.jsx'

const TABS = [
  { id: 'eq', name: '方程式' },
  { id: 'q', name: '选择题' },
  { id: 'lab', name: '实验' },
  { id: 'paper', name: '套卷' },
]

export default function Practice({ onStart, onOpenLab }) {
  const [tab, setTab] = useState('eq')

  return (
    <div className="fade">
      <div className="row" style={{ gap: 6, marginBottom: 14 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`btn sm ${tab === t.id ? '' : 'ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setTab(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>

      {tab === 'eq' && <EqPane onStart={onStart} />}
      {tab === 'q' && <QPane onStart={onStart} />}
      {tab === 'lab' && <LabPane onOpenLab={onOpenLab} />}
      {tab === 'paper' && <PaperPane onStart={onStart} />}
    </div>
  )
}

function TopicPicker({ value, onChange, allLabel = '全部考点' }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">{allLabel}</option>
      {TOPIC_ORDER.map((t) => (
        <option key={t} value={t}>
          {TOPICS[t].name}
        </option>
      ))}
    </select>
  )
}

function EqPane({ onStart }) {
  const [topic, setTopic] = useState('all')
  const [count, setCount] = useState(6)
  const [blind, setBlind] = useState(false)

  const pool = useMemo(() => (topic === 'all' ? EQUATIONS : EQUATIONS.filter((e) => e.topic === topic)), [topic])

  const go = () => {
    const items = shuffle(pool).slice(0, Math.min(count, pool.length))
    onStart({
      title: blind ? '方程式盲写' : '方程式默写',
      steps: items.map((item) => ({ kind: 'eq', item, blind })),
    })
  }

  return (
    <>
      <div className="card">
        <label className="label">考点</label>
        <TopicPicker value={topic} onChange={setTopic} />
        <label className="label">数量</label>
        <div className="row">
          {[6, 10, 15].map((n) => (
            <button key={n} className={`btn sm ${count === n ? '' : 'ghost'}`} onClick={() => setCount(n)} style={{ flex: 1 }}>
              {n} 条
            </button>
          ))}
        </div>
        <label className="label">模式</label>
        <div className="row">
          <button className={`btn sm ${!blind ? '' : 'ghost'}`} onClick={() => setBlind(false)} style={{ flex: 1 }}>
            给反应物填产物
          </button>
          <button className={`btn sm ${blind ? '' : 'ghost'}`} onClick={() => setBlind(true)} style={{ flex: 1 }}>
            看情境写全式
          </button>
        </div>
        <p className="tiny muted mt12">
          题库共 {pool.length} 条，已按考点筛好。写错会自动进错题本，第二天再考你。
        </p>
      </div>
      <button className="btn block mt12" onClick={go}>
        开始 · {Math.min(count, pool.length)} 条
      </button>
    </>
  )
}

function QPane({ onStart }) {
  const [topic, setTopic] = useState('all')
  const [diff, setDiff] = useState(0)
  const [count, setCount] = useState(4)

  const pool = useMemo(
    () =>
      QUESTIONS.filter(
        (q) => (topic === 'all' || q.topic === topic) && (diff === 0 || q.diff === diff),
      ),
    [topic, diff],
  )

  const go = () => {
    const items = shuffle(pool).slice(0, Math.min(count, pool.length))
    if (!items.length) return
    onStart({ title: '选择题练习', steps: items.map((item) => ({ kind: 'q', item })) })
  }

  return (
    <>
      <div className="card">
        <label className="label">考点</label>
        <TopicPicker value={topic} onChange={setTopic} />
        <label className="label">难度</label>
        <div className="row">
          {[
            [0, '全部'],
            [1, '基础'],
            [2, '中档'],
            [3, '压轴'],
          ].map(([v, n]) => (
            <button key={v} className={`btn sm ${diff === v ? '' : 'ghost'}`} onClick={() => setDiff(v)} style={{ flex: 1 }}>
              {n}
            </button>
          ))}
        </div>
        <label className="label">数量</label>
        <div className="row">
          {[4, 8, 16].map((n) => (
            <button key={n} className={`btn sm ${count === n ? '' : 'ghost'}`} onClick={() => setCount(n)} style={{ flex: 1 }}>
              {n} 题
            </button>
          ))}
        </div>
        <p className="tiny muted mt12">可选 {pool.length} 题。</p>
      </div>
      <button className="btn block mt12" onClick={go} disabled={!pool.length}>
        开始 · {Math.min(count, pool.length)} 题
      </button>

      <div className="sec">
        <h2>AI 出题</h2>
        <span className="hint">在题库之外，按你的薄弱点现出</span>
      </div>
      <AiBox />
    </>
  )
}

function AiBox() {
  const app = useApp()
  const [topic, setTopic] = useState('r3')
  const [difficulty, setDifficulty] = useState(2)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [gen, setGen] = useState(null)
  const [picked, setPicked] = useState(null)

  const ai = app.state.settings.ai
  const can = ai.mode !== 'off' && (ai.apiKey || ai.mode === 'proxy')

  const go = async () => {
    setBusy(true)
    setErr('')
    setGen(null)
    setPicked(null)
    try {
      const q = await generateAiQuestion({
        ai,
        topic,
        difficulty,
        avoid: QUESTIONS.slice(0, 8).map((x) => x.q.slice(0, 18)),
      })
      const v = await verifyAiQuestion({ ai, q })
      const item = {
        ...q,
        id: 'ai-' + Date.now().toString(36),
        topic,
        diff: difficulty,
        verified: v.ok,
        verifyNote: v.reason,
      }
      setGen(item)
      app.addAiQuestion(item)
    } catch (e) {
      setErr(e.message || '生成失败')
    } finally {
      setBusy(false)
    }
  }

  const answer = (idx) => {
    if (picked !== null || !gen) return
    setPicked(idx)
    app.recordAttempt({
      id: gen.id,
      kind: 'q',
      topic: gen.topic,
      ok: idx === gen.answer,
      reason: 'method',
      ms: 0,
    })
  }

  return (
    <div className="card">
      {!can && (
        <div className="fb info" style={{ marginTop: 0 }}>
          还没有配置 AI。去「设置」填 Key，或在本机跑 <code>pnpm api</code> 用本地代理。不配也能用全部题库。
        </div>
      )}

      <label className="label">考什么</label>
      <TopicPicker value={topic} onChange={setTopic} />
      <label className="label">难度</label>
      <div className="row">
        {[1, 2, 3].map((d) => (
          <button
            key={d}
            className={`btn sm ${difficulty === d ? '' : 'ghost'}`}
            onClick={() => setDifficulty(d)}
            style={{ flex: 1 }}
          >
            {'基础 中档 压轴'.split(' ')[d - 1]}
          </button>
        ))}
      </div>

      <button className="btn soft block mt12" onClick={go} disabled={busy || !can}>
        {busy ? (
          <>
            <span className="spin" /> 出题中（含互检）
          </>
        ) : (
          <>
            <IconSpark width="16" height="16" /> 生成一道
          </>
        )}
      </button>

      {err && <div className="fb bad mt12">{err}</div>}

      {gen && (
        <div className="mt16 fade">
          <div className="row" style={{ gap: 6, marginBottom: 8 }}>
            <span className={`pill ${gen.verified ? 'g' : 'r'}`}>{gen.verified ? '已互检' : '待复核'}</span>
            <span className="pill">AI 生成</span>
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 1.65 }}>{gen.q}</p>
          <div className="opts mt12">
            {gen.options.map((o, idx) => {
              let cls = 'opt'
              if (picked !== null) {
                if (idx === gen.answer) cls += ' ok'
                else if (idx === picked) cls += ' no'
              }
              return (
                <button key={idx} className={cls} onClick={() => answer(idx)} disabled={picked !== null}>
                  <span className="k">{'ABCD'[idx]}</span>
                  <span>{o}</span>
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <div className={`fb ${picked === gen.answer ? 'good' : 'bad'} mt12`}>
              <b>{picked === gen.answer ? '答对' : `正确答案 ${'ABCD'[gen.answer]}`}</b>
              <div className="mt8">{gen.explain}</div>
              {gen.trap && <div className="tiny mt8">陷阱：{gen.trap}</div>}
              {!gen.verified && gen.verifyNote && (
                <div className="tiny mt8">互检没通过：{gen.verifyNote}（这题可能有问题，以教材为准）</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LabPane({ onOpenLab }) {
  const app = useApp()
  const done = app.state.labsDone || {}
  const n3d = LABS.filter((l) => l.level === 2).length
  return (
    <>
      <p className="small muted" style={{ margin: '2px 2px 10px' }}>
        共 {LABS.length} 个实验 · {n3d} 个 3D 交互 · {LABS.length - n3d} 个装置图解
      </p>
      <div className="grid2">
        {LABS.map((lab) => (
          <button key={lab.id} className="tile" onClick={() => onOpenLab(lab.id)}>
            <span
              className="ic"
              style={{
                background: lab.level === 2 ? '#10231e' : 'var(--brand-soft)',
                color: lab.level === 2 ? '#5fd0b0' : 'var(--brand)',
              }}
            >
              <IconFlask width="18" height="18" />
            </span>
            <b>{lab.title}</b>
            <span>
              {lab.level === 2 ? '3D 交互' : '装置图解'} · {lab.minutes} 分钟
              {done[lab.id] ? ' · 已练过' : ''}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function PaperPane({ onStart }) {
  const [n, setN] = useState(16)

  const go = () => {
    const items = shuffle(QUESTIONS).slice(0, n)
    onStart({ title: `${n} 题限时`, steps: items.map((item) => ({ kind: 'q', item })) })
  }

  return (
    <div className="card">
      <div className="row">
        <IconTarget width="20" height="20" />
        <b>按 A 卷结构练手</b>
      </div>
      <p className="small muted mt8">
        16 道单选、48 分，建议 20 分钟内完成。做完会算出正确率并给出相对应的原始分估计。
      </p>
      <div className="row mt12">
        {[8, 16, 25].map((x) => (
          <button key={x} className={`btn sm ${n === x ? '' : 'ghost'}`} onClick={() => setN(x)} style={{ flex: 1 }}>
            {x} 题
          </button>
        ))}
      </div>
      <button className="btn block mt12" onClick={go}>
        开始
      </button>
    </div>
  )
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
