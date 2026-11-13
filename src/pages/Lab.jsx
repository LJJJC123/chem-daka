import { useEffect, useMemo, useRef, useState } from 'react'
import { LABS } from '../data/labs.js'
import { TOPICS } from '../data/topics.js'
import { prettyEquation } from '../lib/chem.js'
import { useApp } from '../lib/store.jsx'
import { IconClose, IconFlask } from '../components/Icons.jsx'

export default function LabPage({ labId, onClose }) {
  const app = useApp()
  const lab = LABS.find((l) => l.id === labId)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const [threeReady, setThreeReady] = useState(false)

  const [stage, setStage] = useState('apparatus')
  const [picked, setPicked] = useState([])
  const [err, setErr] = useState('')
  const [seq, setSeq] = useState([])
  const [wrongSteps, setWrongSteps] = useState([])
  const [choiceIdx, setChoiceIdx] = useState(0)
  const [pickedOpt, setPickedOpt] = useState(null)

  const need = useMemo(() => lab?.apparatus.filter((a) => a.need).map((a) => a.id) || [], [lab])
  const shuffled = useMemo(() => {
    if (!lab) return []
    const a = [...lab.order]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }, [lab?.id])

  useEffect(() => {
    if (!lab || lab.level !== 2) return
    let alive = true
    import('../lab3d/scene.js')
      .then((m) => {
        if (!alive || !canvasRef.current) return
        sceneRef.current = m.createLabScene(canvasRef.current, lab.scene || {})
        setThreeReady(true)
      })
      .catch((e) => {
        console.warn('3D 初始化失败，已降级', e)
        setThreeReady(false)
      })
    return () => {
      alive = false
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [lab?.id])

  if (!lab) return null

  const effect = (name) => sceneRef.current?.setEffect(name)

  const toggle = (id) => {
    setErr('')
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const confirmApparatus = () => {
    const missing = need.filter((id) => !picked.includes(id))
    const extra = picked.filter((id) => !need.includes(id))
    if (missing.length) {
      const names = missing.map((id) => lab.apparatus.find((a) => a.id === id)?.name).join('、')
      setErr(`还缺：${names}`)
      effect('warn')
      return
    }
    if (extra.length) {
      const names = extra.map((id) => lab.apparatus.find((a) => a.id === id)?.name).join('、')
      setErr(`${names} 这台实验用不上，拿走吧`)
      effect('warn')
      return
    }
    setStage('order')
    effect('reset')
  }

  const tapStep = (step) => {
    if (seq.includes(step.id)) return
    const expect = lab.order[seq.length]
    if (step.id !== expect.id) {
      setWrongSteps((w) => (w.includes(step.id) ? w : [...w, step.id]))
      setErr(`顺序不对：现在应该先「${expect.text}」`)
      effect('warn')
      return
    }
    setErr('')
    setSeq((s) => [...s, step.id])
    if (seq.length + 1 === lab.order.length) {
      setStage(lab.choices?.length ? 'run' : 'done')
      effect('reset')
    }
  }

  const currentChoice = lab.choices?.[choiceIdx]

  const pickOption = (opt, idx) => {
    if (pickedOpt !== null) return
    setPickedOpt(idx)
    effect(opt.ok ? opt.effect || 'reset' : 'warn')
    app.recordAttempt({
      id: `${lab.id}-c${choiceIdx}`,
      kind: 'q',
      topic: lab.topic,
      ok: Boolean(opt.ok),
      reason: opt.ok ? '' : 'method',
      ms: 0,
    })
  }

  const nextChoice = () => {
    setPickedOpt(null)
    if (choiceIdx + 1 >= (lab.choices?.length || 0)) {
      setStage('done')
      effect('reset')
    } else {
      setChoiceIdx(choiceIdx + 1)
      effect('reset')
    }
  }

  const restart = () => {
    setStage('apparatus')
    setPicked([])
    setSeq([])
    setWrongSteps([])
    setChoiceIdx(0)
    setPickedOpt(null)
    setErr('')
    effect('reset')
  }

  return (
    <div className="lab">
      <div className="lhead">
        <button className="close" onClick={onClose} aria-label="返回">
          <IconClose width="17" height="17" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>{lab.title}</h2>
          <div className="sub">
            {TOPICS[lab.topic]?.name} · {lab.level === 2 ? '3D 交互' : '步骤卡'} · {lab.minutes} 分钟
          </div>
        </div>
      </div>

      <div className="stage">
        {lab.level === 2 ? (
          <>
            <canvas ref={canvasRef} />
            <div className="hud">{threeReady ? '拖动可旋转视角' : '正在加载实验台…'}</div>
          </>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background:
                'radial-gradient(80% 60% at 50% 20%, rgba(79,191,162,.18), transparent 70%), radial-gradient(60% 50% at 70% 80%, rgba(201,138,75,.14), transparent 70%)',
            }}
          >
            <div style={{ textAlign: 'center', color: '#8fb3a2' }}>
              <IconFlask width="56" height="56" style={{ opacity: 0.55 }} />
              <div className="small mt8">{lab.goal}</div>
            </div>
          </div>
        )}
      </div>

      <div className="sheet">
        {stage === 'apparatus' && (
          <>
            <h3>第 1 步 · 选仪器</h3>
            <p className="desc">把这台实验要用的都拿上来，不需要的别拿。</p>
            <div className="tray">
              {lab.apparatus.map((a) => (
                <button
                  key={a.id}
                  className={`item ${picked.includes(a.id) ? (need.includes(a.id) ? 'on' : 'no') : ''}`}
                  onClick={() => toggle(a.id)}
                >
                  {a.name}
                </button>
              ))}
            </div>
            {err && <p className="labnote" style={{ color: '#f0b7ab' }}>{err}</p>}
            <button className="labbtn" onClick={confirmApparatus} disabled={!picked.length}>
              确认仪器（{picked.length}/{need.length}）
            </button>
          </>
        )}

        {stage === 'order' && (
          <>
            <h3>第 2 步 · 排步骤</h3>
            <p className="desc">按正确顺序点，点错会提示你该先做哪一步。</p>
            <div className="order">
              {shuffled.map((s) => {
                const done = seq.includes(s.id)
                return (
                  <button
                    key={s.id}
                    className={`o ${done ? 'on' : wrongSteps.includes(s.id) ? 'bad' : ''}`}
                    onClick={() => tapStep(s)}
                  >
                    <span className="i">{done ? '✓' : '·'}</span>
                    <span>{s.text}</span>
                  </button>
                )
              })}
            </div>
            {err && <p className="labnote" style={{ color: '#f0b7ab' }}>{err}</p>}
            <p className="labnote">
              已完成 {seq.length}/{lab.order.length}
            </p>
          </>
        )}

        {stage === 'run' && currentChoice && (
          <>
            <h3>
              第 3 步 · 关键判断 {choiceIdx + 1}/{lab.choices.length}
            </h3>
            <p className="desc">{currentChoice.prompt}</p>
            {currentChoice.options.map((o, idx) => {
              let cls = 'labopt'
              if (pickedOpt !== null) {
                if (o.ok) cls += ' ok'
                else if (idx === pickedOpt) cls += ' no'
              }
              return (
                <button key={idx} className={cls} onClick={() => pickOption(o, idx)} disabled={pickedOpt !== null}>
                  {o.text}
                </button>
              )
            })}
            {pickedOpt !== null && (
              <>
                <p className="labnote">
                  <b>{currentChoice.options[pickedOpt].ok ? '正确' : '错了'}</b>：{currentChoice.options[pickedOpt].result}
                </p>
                <p className="labnote" style={{ opacity: 0.85 }}>
                  为什么：{currentChoice.why}
                </p>
                <button className="labbtn" onClick={nextChoice}>
                  {choiceIdx + 1 >= lab.choices.length ? '看总结' : '下一处'}
                </button>
              </>
            )}
          </>
        )}

        {stage === 'done' && (
          <>
            <h3>实验总结</h3>
            <div className="summary">
              {lab.equations?.length > 0 && (
                <>
                  <h4>化学方程式</h4>
                  {lab.equations.map((e) => (
                    <div key={e} className="eqline">
                      {prettyEquation(e)}
                    </div>
                  ))}
                </>
              )}
              {lab.ionic?.length > 0 && (
                <>
                  <h4>离子 / 电极反应</h4>
                  {lab.ionic.map((e) => (
                    <div key={e} className="eqline">
                      {prettyEquation(e)}
                    </div>
                  ))}
                </>
              )}
              {lab.pitfalls?.length > 0 && (
                <>
                  <h4>必须记住</h4>
                  <ul>
                    {lab.pitfalls.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </>
              )}
              <h4>一句话</h4>
              <p>{lab.summary}</p>
            </div>
            <button className="labbtn" onClick={onClose}>
              完成
            </button>
            <button className="labbtn ghost" onClick={restart}>
              再做一遍
            </button>
          </>
        )}
      </div>
    </div>
  )
}
