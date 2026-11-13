import { useEffect, useState } from 'react'
import { AppProvider, useApp } from './lib/store.jsx'
import { daysToExam } from './lib/plan.js'
import Today from './pages/Today.jsx'
import Practice from './pages/Practice.jsx'
import Mistakes from './pages/Mistakes.jsx'
import Progress from './pages/Progress.jsx'
import Settings from './pages/Settings.jsx'
import Lab from './pages/Lab.jsx'
import Session from './components/Session.jsx'
import {
  IconMistake,
  IconPractice,
  IconProgress,
  IconSettings,
  IconToday,
} from './components/Icons.jsx'

const TABS = [
  { id: 'today', name: '今日', Icon: IconToday },
  { id: 'practice', name: '练', Icon: IconPractice },
  { id: 'mistakes', name: '错题', Icon: IconMistake },
  { id: 'progress', name: '进度', Icon: IconProgress },
  { id: 'settings', name: '设置', Icon: IconSettings },
]

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

function Shell() {
  const app = useApp()
  const [tab, setTabState] = useState(() => {
    const h = window.location.hash.slice(1)
    return ['today', 'practice', 'mistakes', 'progress', 'settings'].includes(h) ? h : 'today'
  })
  const [session, setSession] = useState(null)
  const [labId, setLabId] = useState(() => {
    const m = /^lab=(.+)$/.exec(window.location.hash.slice(1))
    return m ? m[1] : null
  })

  const setTab = (id) => {
    setTabState(id)
    if (window.location.hash !== `#${id}`) window.history.replaceState(null, '', `#${id}`)
  }

  const openLab = (id) => {
    setLabId(id)
    window.history.replaceState(null, '', `#lab=${id}`)
  }

  const closeLab = () => {
    setLabId(null)
    window.history.replaceState(null, '', `#${tab}`)
  }

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1)
      const m = /^lab=(.+)$/.exec(h)
      if (m) setLabId(m[1])
      else if (['today', 'practice', 'mistakes', 'progress', 'settings'].includes(h)) {
        setTabState(h)
        setLabId(null)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const left = daysToExam(app.state.profile.examDate)
  const start = (opts) => setSession(opts)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark">化</span>
          化学打卡
        </div>
        <span className={`chip ${left <= 45 ? 'hot' : 'cool'}`}>距期末 {Math.max(0, left)} 天</span>
      </header>

      <main className="page">
        {tab === 'today' && <Today onStart={start} onOpenLab={openLab} />}
        {tab === 'practice' && <Practice onStart={start} onOpenLab={openLab} />}
        {tab === 'mistakes' && <Mistakes onStart={start} />}
        {tab === 'progress' && <Progress />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="tabbar">
        {TABS.map(({ id, name, Icon }) => (
          <button
            key={id}
            className={`tab ${tab === id ? 'on' : ''}`}
            onClick={() => {
              setTab(id)
              window.scrollTo({ top: 0 })
            }}
          >
            <Icon />
            {name}
          </button>
        ))}
      </nav>

      {session && (
        <Session
          title={session.title}
          steps={session.steps}
          onClose={() => setSession(null)}
        />
      )}

      {labId && <Lab labId={labId} onClose={closeLab} />}
    </div>
  )
}
