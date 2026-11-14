import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { addDays, dateStr } from './plan.js'

const KEY = 'chem85:v1'
const CORE_KINDS = ['eq', 'q', 'card']

export function defaultState() {
  return {
    v: 1,
    profile: {
      examDate: '2027-01-18',
      // 默认从明天开始，第一次打开就能直接用；可在设置里改成今天/后天
      startDate: addDays(dateStr(), 1),
      dailyMinutes: 30,
      targetAssigned: 85,
    },
    settings: {
      ai: {
        mode: 'proxy', // proxy | direct | off
        baseUrl: '',
        model: 'deepseek-chat',
        apiKey: '',
        dailyLimit: 20,
      },
    },
    stats: {},
    mistakes: {},
    days: {},
    reports: [],
    aiQuestions: [],
    labsDone: {},
    meta: { createdAt: dateStr(), version: '1.0.0' },
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    return { ...defaultState(), ...parsed, profile: { ...defaultState().profile, ...parsed.profile }, settings: { ...defaultState().settings, ...parsed.settings, ai: { ...defaultState().settings.ai, ...parsed.settings?.ai } } }
  } catch {
    return defaultState()
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'attempt': {
      const { id, kind, topic, ok, reason, ms } = action.payload
      const day = dateStr()
      const today = state.days[day] || { items: [], coreDone: 0, totalMs: 0 }
      const items = [...today.items, { id, kind, ok, ms, reason, at: Date.now() }]
      const kinds = new Set(items.map((x) => x.kind))
      const coreDone = CORE_KINDS.filter((k) => kinds.has(k)).length
      const prev = state.stats[id] || { seen: 0, correct: 0, streak: 0, last: '' }
      const stats = {
        ...state.stats,
        [id]: {
          seen: prev.seen + 1,
          correct: prev.correct + (ok ? 1 : 0),
          streak: ok ? prev.streak + 1 : 0,
          last: day,
          lastOk: ok,
        },
      }
      let mistakes = state.mistakes
      if (!ok) {
        const m = mistakes[id] || { count: 0, last: '', reason: '' }
        mistakes = { ...mistakes, [id]: { count: m.count + 1, last: day, reason: reason || m.reason } }
      }
      return {
        ...state,
        stats,
        mistakes,
        days: {
          ...state.days,
          [day]: {
            ...today,
            items,
            coreDone,
            totalMs: today.totalMs + (Number(ms) || 0),
            doneAt: coreDone >= 3 ? today.doneAt || Date.now() : today.doneAt,
          },
        },
      }
    }
    case 'profile':
      return { ...state, profile: { ...state.profile, ...action.payload } }
    case 'ai':
      return { ...state, settings: { ...state.settings, ai: { ...state.settings.ai, ...action.payload } } }
    case 'report':
      return { ...state, reports: [action.payload, ...state.reports].slice(0, 24) }
    case 'labDone':
      return { ...state, labsDone: { ...(state.labsDone || {}), [action.payload]: Date.now() } }
    case 'aiQuestion':
      return { ...state, aiQuestions: [action.payload, ...state.aiQuestions].slice(0, 200) }
    case 'reset':
      return defaultState()
    case 'import':
      return action.payload
    default:
      return state
  }
}

const Ctx = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state))
      } catch (e) {
        console.warn('保存失败', e)
      }
    }, 120)
    return () => clearTimeout(t)
  }, [state])

  const recordAttempt = useCallback((payload) => dispatch({ type: 'attempt', payload }), [])
  const setProfile = useCallback((payload) => dispatch({ type: 'profile', payload }), [])
  const setAi = useCallback((payload) => dispatch({ type: 'ai', payload }), [])
  const saveReport = useCallback((payload) => dispatch({ type: 'report', payload }), [])
  const addAiQuestion = useCallback((payload) => dispatch({ type: 'aiQuestion', payload }), [])
  const markLabDone = useCallback((id) => dispatch({ type: 'labDone', payload: id }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])
  const importState = useCallback((payload) => dispatch({ type: 'import', payload }), [])

  const api = useMemo(
    () => ({ state, recordAttempt, setProfile, setAi, saveReport, addAiQuestion, markLabDone, reset, importState }),
    [state, recordAttempt, setProfile, setAi, saveReport, addAiQuestion, markLabDone, reset, importState],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp 必须在 AppProvider 内使用')
  return v
}
