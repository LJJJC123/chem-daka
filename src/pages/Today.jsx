import { useMemo } from 'react'
import { useApp } from '../lib/store.jsx'
import { dateStr, daysToExam, pickTasks } from '../lib/plan.js'
import { streakOf } from '../lib/selectors.js'
import { TOPICS } from '../data/topics.js'
import { IconCard, IconFlask, IconRight, IconTarget } from '../components/Icons.jsx'

export default function Today({ onStart, onOpenLab }) {
  const app = useApp()
  const today = dateStr()
  const state = app.state
  const tasks = useMemo(() => pickTasks(state, today), [state, today])
  const day = state.days[today] || { items: [] }
  const streak = streakOf(state)

  const eqDone = day.items.filter((x) => x.kind === 'eq').length
  const qDone = day.items.filter((x) => x.kind === 'q').length
  const cardDone = day.items.filter((x) => x.kind === 'card').length
  const coreDone = [eqDone, qDone, cardDone].filter((n) => n > 0).length

  const left = daysToExam(state.profile.examDate, today)
  const week = tasks.week

  const isEqDone = eqDone >= tasks.eqItems.length
  const isQDone = qDone >= tasks.qItems.length
  const isCardDone = cardDone > 0
  const allDone = isEqDone && isQDone && isCardDone

  const startAll = () => {
    const steps = []
    tasks.eqItems.slice(eqDone).forEach((item) => steps.push({ kind: 'eq', item }))
    tasks.qItems.slice(qDone).forEach((item) => steps.push({ kind: 'q', item }))
    if (!isCardDone && tasks.card) steps.push({ kind: 'card', item: tasks.card })
    if (!steps.length) return
    onStart({ title: '今日打卡', steps })
  }

  const suggestedLab = tasks.conf.lab > 0 ? LAB_BY_TOPIC[tasks.conf.topics[0]] || 'lab-titration' : null

  return (
    <div className="fade">
      <section className="hero">
        <div className="kicker">高二上 · 选必1 + 选必2</div>
        <div className="big num">
          距期末 {left > 0 ? left : 0} 天
        </div>
        <div className="sub">
          第 {week} 周 · {tasks.conf.theme}
        </div>
        <div className="row">
          <div className="stat">
            <b className="num">{streak}</b>连续打卡
          </div>
          <div className="stat">
            <b className="num">{coreDone}/3</b>今日三项
          </div>
          <div className="stat">
            <b className="num">{state.profile.targetAssigned}</b>目标赋分
          </div>
        </div>
      </section>

      <div className="sec">
        <h2>今日一卡</h2>
        <span className="hint">每天 1 分钟，专治易错点</span>
      </div>

      <div className="daily">
        <div className="tag">易错常考 · {TOPICS[tasks.card?.topic]?.name}</div>
        <h3>{tasks.card?.title}</h3>
        <p>{tasks.card?.body}</p>
        {tasks.card?.trap && <div className="trap">易错：{tasks.card.trap}</div>}
      </div>

      <div className="sec">
        <h2>今天做什么</h2>
        <span className="hint">约 {state.profile.dailyMinutes} 分钟</span>
      </div>

      <TaskRow
        icon={<IconTarget width="19" height="19" />}
        title="方程式"
        desc={[...new Set(tasks.eqItems.map((e) => TOPICS[e.topic]?.name))].slice(0, 2).join(' · ')}
        tail={`${Math.min(eqDone, tasks.eqItems.length)}/${tasks.eqItems.length}`}
        done={isEqDone}
      />
      <TaskRow
        icon={<IconCard width="19" height="19" />}
        title="选择题"
        desc="按本周考点抽题，选项都带解析"
        tail={`${Math.min(qDone, tasks.qItems.length)}/${tasks.qItems.length}`}
        done={isQDone}
      />
      <TaskRow
        icon={<IconCard width="19" height="19" />}
        title="知识点卡"
        desc="翻面做一道判断题，错题自动进本"
        tail={isCardDone ? '已完成' : '待做'}
        done={isCardDone}
      />

      {suggestedLab && (
        <>
          <div className="sec">
            <h2>本周实验</h2>
            <span className="hint">3D 交互 · 5 分钟</span>
          </div>
          <button className="task" onClick={() => onOpenLab(suggestedLab)}>
            <span className="ico" style={{ background: '#10231e', color: '#5fd0b0' }}>
              <IconFlask width="19" height="19" />
            </span>
            <span className="tt">
              <b>{LAB_TITLES[suggestedLab] || '虚拟实验室'}</b>
              <span>选仪器 → 排步骤 → 看现象 → 出总结</span>
            </span>
            <span className="tail">
              <IconRight width="16" height="16" />
            </span>
          </button>
        </>
      )}

      <div className="mt16">
        {allDone ? (
          <button className="btn ghost block" onClick={startAll}>
            今天已完成 · 再练一组
          </button>
        ) : (
          <button className="btn block" onClick={startAll}>
            开始打卡（剩 {tasks.eqItems.length - Math.min(eqDone, tasks.eqItems.length) + tasks.qItems.length - Math.min(qDone, tasks.qItems.length) + (isCardDone ? 0 : 1)} 项）
          </button>
        )}
      </div>

      <p className="tiny muted center mt12">
        打卡只认三项：方程式、选择题、知识点卡。做不完可以暂停，明天接着来。
      </p>
    </div>
  )
}

const LAB_BY_TOPIC = {
  r1: 'lab-neutralheat',
  r6: 'lab-hydrolysis',
  r7: 'lab-precipitate',
  r8: 'lab-corrosion',
  r9: 'lab-electrolysis',
  e1: 'lab-titration',
  e2: 'lab-titration',
}

const LAB_TITLES = {
  'lab-titration': '酸碱中和滴定',
  'lab-precipitate': '沉淀的转化',
  'lab-electrolysis': '电解饱和食盐水',
  'lab-prepare': '配制一定浓度溶液',
  'lab-neutralheat': '中和热测定',
  'lab-corrosion': '铁钉吸氧腐蚀',
  'lab-chlorine': '氯气制备与性质',
  'lab-ammonia': '氨气制备与检验',
  'lab-hydrolysis': '盐类水解检验',
  'lab-distill': '蒸馏与分液',
}

function TaskRow({ icon, title, desc, tail, done }) {
  return (
    <div className={`task ${done ? 'done' : ''}`}>
      <span className="ico">{icon}</span>
      <span className="tt">
        <b>{title}</b>
        <span>{desc}</span>
      </span>
      <span className="tail">
        {done ? (
          <span className="pill g">✓ {tail}</span>
        ) : (
          <span className="pill">{tail}</span>
        )}
      </span>
    </div>
  )
}
