import { useRef, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { EQUATIONS } from '../data/equations.js'
import { QUESTIONS } from '../data/questions.js'
import { CARDS } from '../data/cards.js'
import { LABS } from '../data/labs.js'
import { PROVIDERS, health, providerOf } from '../lib/ai.js'

export default function Settings() {
  const app = useApp()
  const state = app.state
  const ai = state.settings.ai
  const [msg, setMsg] = useState('')
  const [testing, setTesting] = useState(false)
  const fileRef = useRef(null)

  const setProfile = (patch) => app.setProfile(patch)
  const setAi = (patch) => app.setAi(patch)

  const test = async () => {
    setTesting(true)
    setMsg('')
    try {
      if (ai.mode === 'proxy') {
        const h = await health()
        setMsg(h.ok ? `本地代理可用：${h.model}` : '本地代理没响应，先在终端跑 pnpm api')
      } else if (ai.mode === 'direct') {
        if (!ai.apiKey) throw new Error('还没填 Key')
        const r = await fetch(`${(ai.baseUrl || providerOf(ai.provider).baseUrl).replace(/\/$/, '')}/models`, {
          headers: { Authorization: `Bearer ${ai.apiKey}` },
        })
        setMsg(r.ok ? 'Key 可用' : `连上了但返回 ${r.status}，检查 Key 或地址`)
      } else {
        setMsg('AI 已关闭')
      }
    } catch (e) {
      setMsg('测试失败：' + e.message)
    } finally {
      setTesting(false)
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chem-daka-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('已导出备份')
  }

  const importJson = async (file) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.profile || !data.days) throw new Error('这不是本应用的备份')
      app.importState(data)
      setMsg('已导入')
    } catch (e) {
      setMsg('导入失败：' + e.message)
    }
  }

  const reset = () => {
    if (!window.confirm('清空所有打卡、错题和设置？建议先导出备份。')) return
    app.reset()
    setMsg('已重置')
  }

  return (
    <div className="fade">
      <div className="sec" style={{ marginTop: 8 }}>
        <h2>备考设置</h2>
      </div>
      <div className="card">
        <label className="label">期末日期</label>
        <input
          className="input"
          type="date"
          value={state.profile.examDate}
          onChange={(e) => setProfile({ examDate: e.target.value })}
        />
        <label className="label">每天可投入（分钟）</label>
        <input
          className="input"
          type="number"
          min="10"
          max="120"
          value={state.profile.dailyMinutes}
          onChange={(e) => setProfile({ dailyMinutes: Number(e.target.value) || 30 })}
        />
        <label className="label">目标赋分</label>
        <div className="row">
          {[80, 85, 88].map((v) => (
            <button
              key={v}
              className={`btn sm ${state.profile.targetAssigned === v ? '' : 'ghost'}`}
              onClick={() => setProfile({ targetAssigned: v })}
              style={{ flex: 1 }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="sec">
        <h2>AI 设置</h2>
        <span className="hint">可选，不配也能用</span>
      </div>
      <div className="card">
        <label className="label">调用方式</label>
        <div className="row">
          {[
            ['proxy', '本地代理'],
            ['direct', '直连'],
            ['off', '关闭'],
          ].map(([v, n]) => (
            <button
              key={v}
              className={`btn sm ${ai.mode === v ? '' : 'ghost'}`}
              onClick={() => setAi({ mode: v })}
              style={{ flex: 1 }}
            >
              {n}
            </button>
          ))}
        </div>

        {ai.mode === 'proxy' && (
          <div className="fb info mt12" style={{ marginTop: 12 }}>
            在 <code>chem-daka</code> 目录建 <code>.env.local</code>：
            <div className="tiny mt8" style={{ fontFamily: 'ui-monospace, monospace', lineHeight: 1.8 }}>
              CHEMQ_API_KEY=sk-xxx
              <br />
              CHEMQ_BASE_URL=https://api.deepseek.com/v1
              <br />
              CHEMQ_MODEL=deepseek-chat
            </div>
            然后另开一个终端跑 <code>pnpm api</code>。Key 不会进浏览器。
          </div>
        )}

        {ai.mode === 'direct' && (
          <>
            <label className="label">API Key</label>
            <input
              className="input"
              type="password"
              placeholder="sk-..."
              value={ai.apiKey}
              onChange={(e) => setAi({ apiKey: e.target.value })}
            />
            <p className="tiny muted mt8">Key 存在这台设备的 localStorage 里，别在公用电脑上填。</p>
          </>
        )}

        {ai.mode !== 'off' && (
          <>
            <label className="label">服务商</label>
            <select
              className="input"
              value={ai.provider || 'deepseek'}
              onChange={(e) => {
                const p = providerOf(e.target.value)
                setAi({ provider: e.target.value, baseUrl: p.baseUrl, model: p.model })
              }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <label className="label">Base URL</label>
            <input
              className="input"
              placeholder="https://api.deepseek.com/v1"
              value={ai.baseUrl || providerOf(ai.provider).baseUrl}
              onChange={(e) => setAi({ baseUrl: e.target.value })}
            />
            <label className="label">模型</label>
            <input className="input" value={ai.model} onChange={(e) => setAi({ model: e.target.value })} />
            <button className="btn ghost block mt12" onClick={test} disabled={testing}>
              {testing ? '测试中…' : '测试连接'}
            </button>
          </>
        )}
        {msg && <div className="fb info mt12">{msg}</div>}
      </div>

      <div className="sec">
        <h2>数据</h2>
      </div>
      <div className="card">
        <div className="kv">
          <span>方程式</span>
          <b>{EQUATIONS.length} 条</b>
        </div>
        <div className="kv">
          <span>选择题</span>
          <b>{QUESTIONS.length} 道</b>
        </div>
        <div className="kv">
          <span>知识点卡片</span>
          <b>{CARDS.length} 张</b>
        </div>
        <div className="kv">
          <span>实验</span>
          <b>{LABS.length} 个</b>
        </div>
        <div className="kv">
          <span>已生成周报</span>
          <b>{state.reports.length} 份</b>
        </div>
        <div className="row mt12">
          <button className="btn ghost sm" onClick={exportJson} style={{ flex: 1 }}>
            导出备份
          </button>
          <button className="btn ghost sm" onClick={() => fileRef.current?.click()} style={{ flex: 1 }}>
            导入备份
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
        />
        <button className="btn sm mt12" onClick={reset} style={{ width: '100%', background: '#f6e9e6', color: 'var(--bad)' }}>
          清空所有数据
        </button>
      </div>

      <p className="tiny muted center mt16">
        数据全部保存在本机浏览器里，换设备请先导出再导入。
      </p>
    </div>
  )
}
