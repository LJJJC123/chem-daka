import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { gradeChoice, gradeFullEquation, gradeProductFill } from '../lib/grade.js'
import { prettyEquation, prettySide } from '../lib/chem.js'
import { TOPICS } from '../data/topics.js'
import { IconClose } from './Icons.jsx'

const KIND_LABEL = { eq: '方程式', q: '选择题', card: '知识点卡片' }

export default function Session({ title, steps, onClose }) {
  const app = useApp()
  const [i, setI] = useState(0)
  const [results, setResults] = useState([])
  const [done, setDone] = useState(false)
  const startRef = useRef(Date.now())
  const stepStart = useRef(Date.now())

  const total = steps.length

  useEffect(() => {
    stepStart.current = Date.now()
  }, [i])

  const finishStep = (ok, extra = {}) => {
    const st = steps[i]
    const ms = Date.now() - stepStart.current
    app.recordAttempt({
      id: st.item.id,
      kind: st.kind,
      topic: st.item.topic,
      ok,
      reason: extra.reason || (ok ? '' : 'method'),
      ms,
    })
    const next = [...results, { ok, id: st.item.id, topic: st.item.topic }]
    setResults(next)
    if (i + 1 >= total) {
      setDone(true)
    } else {
      setI(i + 1)
    }
  }

  const correct = results.filter((r) => r.ok).length
  const usedMin = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))

  return (
    <div className="session">
      <div className="shead">
        <button className="close" onClick={onClose} aria-label="关闭">
          <IconClose width="18" height="18" />
        </button>
        <div className="dots" aria-hidden>
          {steps.map((s, idx) => (
            <i
              key={s.item.id + idx}
              className={idx < results.length ? (results[idx].ok ? 'ok' : 'no') : idx === i ? 'on' : ''}
            />
          ))}
        </div>
        <span className="tiny muted num">
          {done ? total : i + 1}/{total}
        </span>
      </div>

      <div className="sbody">
        {done ? (
          <Summary title={title} correct={correct} total={total} usedMin={usedMin} results={results} onClose={onClose} />
        ) : (
          <StepView key={steps[i].item.id + i} step={steps[i]} onDone={finishStep} />
        )}
      </div>

      {done ? null : <div className="sfoot">{KIND_LABEL[steps[i].kind] || ''} · {TOPICS[steps[i].item.topic]?.name || ''}</div>}
    </div>
  )
}

function StepView({ step, onDone }) {
  if (step.kind === 'eq') return <EqStep item={step.item} blind={step.blind} onDone={onDone} />
  if (step.kind === 'q') return <QStep item={step.item} onDone={onDone} />
  return <CardStep item={step.item} onDone={onDone} />
}

/* ------------------------- 方程式 ------------------------- */

function EqStep({ item, blind, onDone }) {
  const [text, setText] = useState('')
  const [res, setRes] = useState(null)
  const left = item.eq.split('=')[0]

  const check = () => {
    const r = blind ? gradeFullEquation(item.eq, text) : gradeProductFill(item.eq, text, item.accept || [])
    setRes(r)
  }

  const reveal = () => {
    setText(blind ? item.eq : item.eq.split('=')[1])
    setRes({ ok: false, msg: '已显示答案，记一笔' })
  }

  return (
    <div className="fade">
      <div className="eqhead">
        <span className="pill b">{TOPICS[item.topic]?.name}</span>
        <span className="pill">难度 {item.diff}</span>
        <span className="pill">{KIND_TAG[item.kind] || '化学方程式'}</span>
      </div>

      <div className="card mt8">
        {blind ? (
          <>
            <p className="small muted">根据条件写出完整方程式（含配平）</p>
            <div className="eqmain mt8">
              {item.tip}
              <span className="cond">（{item.cond}）</span>
            </div>
          </>
        ) : (
          <>
            <p className="small muted">给出反应物，补全生成物并配平</p>
            <div className="eqmain mt8">
              {prettySide(left)}
              <span className="cond">（{item.cond}）</span>
            </div>
          </>
        )}
      </div>

      <div className="label">你的答案</div>
      <textarea
        className="input eq"
        rows={2}
        placeholder={blind ? '例：2H2 + O2 = 2H2O' : '例：CO2 + 2H2O'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={Boolean(res)}
        style={{ resize: 'none' }}
      />
      <div className="between mt8">
        <p className="tiny muted" style={{ flex: 1 }}>
          用 + 分隔物质，= 连接两侧；电荷写 ^2- 这种形式。
        </p>
        {!res && (
          <button className="linkbtn" onClick={reveal}>
            想不出来？看答案
          </button>
        )}
      </div>

      {res && (
        <div className={`fb ${res.ok ? 'good' : 'bad'} mt12`}>
          <b>{res.ok ? '对了' : '不对'}</b>：{res.msg}
          {!res.ok && (
            <div className="mt8">
              规范写法：<b>{prettyEquation(item.eq)}</b>
            </div>
          )}
          {item.tip && <div className="mt8 tiny">提示：{item.tip}</div>}
          {item.dh && <div className="tiny mt8">{item.dh}</div>}
        </div>
      )}

      <div className="mt16">
        {!res ? (
          <button className="btn block" onClick={check} disabled={!text.trim()}>
            检查
          </button>
        ) : (
          <button className="btn block" onClick={() => onDone(Boolean(res.ok))}>
            继续
          </button>
        )}
      </div>
    </div>
  )
}

const KIND_TAG = { thermo: '热化学', electrode: '电极反应', ionic: '离子方程式', chem: '化学方程式' }

/* ------------------------- 选择题 ------------------------- */

function QStep({ item, onDone }) {
  const [picked, setPicked] = useState(null)
  const res = picked === null ? null : gradeChoice(item, picked)

  return (
    <div className="fade">
      <div className="eqhead">
        <span className="pill b">{TOPICS[item.topic]?.name}</span>
        <span className="pill">难度 {item.diff}</span>
      </div>
      <div className="card mt8">
        <p style={{ fontSize: 16, lineHeight: 1.65, fontWeight: 550 }}>{item.q}</p>
        <div className="opts mt12">
          {item.o.map((o, idx) => {
            let cls = 'opt'
            if (picked !== null) {
              if (idx === item.a) cls += ' ok'
              else if (idx === picked) cls += ' no'
            }
            return (
              <button key={idx} className={cls} onClick={() => picked === null && setPicked(idx)} disabled={picked !== null}>
                <span className="k">{'ABCD'[idx]}</span>
                <span>{o}</span>
              </button>
            )
          })}
        </div>
        {res && (
          <div className={`fb ${res.ok ? 'good' : 'bad'} mt12`}>
            <b>{res.ok ? '答对' : `正确答案 ${'ABCD'[item.a]}`}</b>
            <div className="mt8">{item.e}</div>
            {item.trap && <div className="tiny mt8">陷阱：{item.trap}</div>}
          </div>
        )}
      </div>
      {res && (
        <button className="btn block mt12" onClick={() => onDone(res.ok)}>
          继续
        </button>
      )}
    </div>
  )
}

/* ------------------------- 卡片 ------------------------- */

function CardStep({ item, onDone }) {
  const [ans, setAns] = useState(null)
  const ok = ans === null ? null : ans === item.judge.ok

  return (
    <div className="fade">
      <div className="daily">
        <div className="tag">今日易错 · {TOPICS[item.topic]?.name}</div>
        <h3>{item.title}</h3>
        <p>{item.body}</p>
        {item.trap && <div className="trap">易错：{item.trap}</div>}
        <div className="judge">
          <div className="q">{item.judge.q}</div>
          <div className="row">
            <button
              className={`btn sm ${ans === true ? 'dark' : 'ghost'}`}
              onClick={() => ans === null && setAns(true)}
              disabled={ans !== null}
            >
              对
            </button>
            <button
              className={`btn sm ${ans === false ? 'dark' : 'ghost'}`}
              onClick={() => ans === null && setAns(false)}
              disabled={ans !== null}
            >
              错
            </button>
          </div>
          {ok !== null && (
            <div className={`fb ${ok ? 'good' : 'bad'} mt12`}>
              <b>{ok ? '判断正确' : '判断错误'}</b>：{item.judge.why}
            </div>
          )}
        </div>
      </div>
      {ok !== null && (
        <button className="btn block mt12" onClick={() => onDone(ok)}>
          继续
        </button>
      )}
    </div>
  )
}

/* ------------------------- 结算 ------------------------- */

function Summary({ title, correct, total, usedMin, results, onClose }) {
  const weak = useMemo(() => {
    const m = {}
    for (const r of results) if (!r.ok) m[r.topic] = (m[r.topic] || 0) + 1
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [results])

  const pct = total ? Math.round((correct / total) * 100) : 0

  return (
    <div className="fade" style={{ paddingTop: 24 }}>
      <div className="center">
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em' }} className="num">
          {pct}
          <span style={{ fontSize: 18 }}>%</span>
        </div>
        <p className="muted small mt8">
          {title} · 用时约 {usedMin} 分钟
        </p>
      </div>

      <div className="card mt16">
        <div className="kv">
          <span>答对</span>
          <b className="num">
            {correct}/{total}
          </b>
        </div>
        <div className="kv">
          <span>今日打卡</span>
          <b>{pct >= 60 ? '已完成' : '还差一点，建议再看一遍错题'}</b>
        </div>
        {weak.length > 0 && (
          <div className="kv">
            <span>今天最该补</span>
            <b>{TOPICS[weak[0][0]]?.name || weak[0][0]}</b>
          </div>
        )}
      </div>

      {weak.length > 0 && (
        <div className="card mt12">
          <p className="small muted">错得多的考点</p>
          <div className="row mt8" style={{ flexWrap: 'wrap' }}>
            {weak.map(([t, n]) => (
              <span key={t} className="pill r">
                {TOPICS[t]?.name} × {n}
              </span>
            ))}
          </div>
          <p className="tiny muted mt12">这些已经进错题本，明天会自动再出现。</p>
        </div>
      )}

      <button className="btn block mt24" onClick={onClose}>
        收工
      </button>
    </div>
  )
}
