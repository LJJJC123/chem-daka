import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseFormula,
  parseEquation,
  checkBalance,
  prettyEquation,
  prettySide,
  normalizeInput,
} from '../src/lib/chem.js'
import { gradeProductFill, gradeFullEquation, gradeChoice } from '../src/lib/grade.js'
import { rawToAssigned, assignedToRaw, gapToTarget } from '../src/lib/score.js'
import { EQUATIONS } from '../src/data/equations.js'
import { QUESTIONS } from '../src/data/questions.js'
import { pickTasks, weekOf, addDays, daysBetween, dateStr } from '../src/lib/plan.js'
import { weekProgress } from '../src/lib/selectors.js'

test('解析化学式：元素、括号、电荷、配合物、结晶水', () => {
  assert.deepEqual(parseFormula('H2O').atoms, { H: 2, O: 1 })
  assert.deepEqual(parseFormula('Ca(OH)2').atoms, { Ca: 1, O: 2, H: 2 })
  assert.deepEqual(parseFormula('Cu(NO3)2').atoms, { Cu: 1, N: 2, O: 6 })
  assert.equal(parseFormula('SO4^2-').charge, -2)
  assert.equal(parseFormula('[Cu(NH3)4]^2+').charge, 2)
  assert.deepEqual(parseFormula('[Cu(NH3)4]^2+').atoms, { Cu: 1, N: 4, H: 12 })
  assert.deepEqual(parseFormula('CuSO4·5H2O').atoms, { Cu: 1, S: 1, O: 9, H: 10 })
  assert.equal(parseFormula('e^-').charge, -1)
})

test('注记与状态符号不参与组成', () => {
  assert.deepEqual(parseFormula('HNO3(稀)').atoms, { H: 1, N: 1, O: 3 })
  assert.deepEqual(parseFormula('Na2CO3(aq)').atoms, { Na: 2, C: 1, O: 3 })
})

test('配平检查：原子与电荷', () => {
  const ok = parseEquation('3Cu + 8HNO3(稀) = 3Cu(NO3)2 + 2NO + 4H2O')
  assert.equal(checkBalance(ok.left, ok.right).ok, true)

  const bad = parseEquation('Cu + 8HNO3 = 3Cu(NO3)2 + 2NO + 4H2O')
  assert.equal(checkBalance(bad.left, bad.right).ok, false)

  const ionic = parseEquation('Fe^3+ + 3OH^- = Fe(OH)3')
  assert.equal(checkBalance(ionic.left, ionic.right).ok, true)

  const badCharge = parseEquation('Ag^+ = Ag')
  const r = checkBalance(badCharge.left, badCharge.right)
  assert.equal(r.ok, false)
  assert.equal(r.atomOk, true)
  assert.equal(r.chargeOk, false)
})

test('给反应物填生成物：判分与错误诊断', () => {
  const eq = 'CH4 + 2O2 = CO2 + 2H2O'
  assert.equal(gradeProductFill(eq, 'CO2 + 2H2O').ok, true)
  assert.equal(gradeProductFill(eq, '2H2O + CO2').ok, true)
  assert.equal(gradeProductFill(eq, 'CO2 + H2O').code, 'balance')
  assert.equal(gradeProductFill(eq, 'CO + 2H2O').code, 'products')
  assert.equal(gradeProductFill(eq, '').code, 'empty')
  assert.equal(gradeProductFill(eq, '???').code, 'parse')
})

test('写全式：物质、配平、最简整数比', () => {
  const eq = '2H2 + O2 = 2H2O'
  assert.equal(gradeFullEquation(eq, '2H2 + O2 = 2H2O').ok, true)
  assert.equal(gradeFullEquation(eq, 'H2 + O2 = H2O').code, 'balance')
  assert.equal(gradeFullEquation(eq, '4H2 + 2O2 = 4H2O').code, 'ratio')
  assert.equal(gradeFullEquation(eq, '2H2 + O2 = H2O2').code, 'species')
})

test('题库里每条方程式都能自洽判分', () => {
  for (const item of EQUATIONS) {
    const left = item.eq.split('=')[0].trim()
    const right = item.eq.split('=')[1].trim()
    const g = gradeProductFill(item.eq, right)
    assert.equal(g.ok, true, `${item.id} 填产物失败：${g.msg}`)
    const f = gradeFullEquation(item.eq, item.eq)
    assert.equal(f.ok, true, `${item.id} 全式失败：${f.msg}`)
    assert.ok(left && right)
  }
})

test('选择题判分', () => {
  const q = QUESTIONS[0]
  assert.equal(gradeChoice(q, q.a).ok, true)
  assert.equal(gradeChoice(q, (q.a + 1) % 4).ok, false)
})

test('赋分换算单调且 85 对得上', () => {
  let prev = -1
  for (let i = 0; i <= 100; i++) {
    const a = rawToAssigned(i)
    assert.ok(a >= prev, `赋分不单调：raw=${i}`)
    prev = a
  }
  assert.ok(Math.abs(rawToAssigned(85) - 85) < 1.2)
  const back = assignedToRaw(85)
  assert.ok(back >= 84 && back <= 86, `赋分 85 对应原始分 ${back}`)
  assert.equal(gapToTarget(85, 85).gap, 0)
  assert.ok(gapToTarget(70, 85).gap > 10)
  assert.equal(rawToAssigned(100), 100)
  assert.equal(rawToAssigned(0), 40)
})

test('周次与日期计算', () => {
  const start = '2026-11-16'
  assert.equal(weekOf(start, '2026-11-16'), 1)
  assert.equal(weekOf(start, '2026-11-22'), 1)
  assert.equal(weekOf(start, '2026-11-23'), 2)
  assert.equal(weekOf(start, '2027-01-11'), 8)
  assert.equal(weekOf(start, '2027-03-01'), 8)
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  assert.equal(daysBetween('2026-11-16', '2027-01-18'), 63)
  assert.match(dateStr(new Date()), /^\d{4}-\d{2}-\d{2}$/)
})

test('今日任务：数量正确、同一天结果稳定', () => {
  const state = { profile: { startDate: '2026-11-16' }, stats: {}, mistakes: {}, days: {} }
  const a = pickTasks(state, '2026-11-16')
  const b = pickTasks(state, '2026-11-16')
  assert.equal(a.week, 1)
  assert.equal(a.eqItems.length, 6)
  assert.equal(a.qItems.length, 4)
  assert.deepEqual(
    a.eqItems.map((x) => x.id),
    b.eqItems.map((x) => x.id),
  )
  assert.ok(a.card && a.card.id)
  // 第 5 周进入选必 2
  const c = pickTasks(state, '2026-12-14')
  assert.equal(c.week, 5)
  assert.ok(c.eqItems.every((x) => ['s1', 's2'].includes(x.topic)))
})

test('错题会被优先抽到', () => {
  const state = { profile: { startDate: '2026-11-16' }, stats: {}, mistakes: {}, days: {} }
  const first = pickTasks(state, '2026-11-16')
  const target = first.eqItems[0]
  state.mistakes[target.id] = { count: 3, last: '2026-11-16' }
  const next = pickTasks(state, '2026-11-17')
  assert.ok(next.eqItems.some((x) => x.id === target.id))
})

test('展示：方程式转成下标上标', () => {
  const s = prettyEquation('3Cu + 8HNO3 = 3Cu(NO3)2 + 2NO + 4H2O')
  assert.ok(s.includes('Cu(NO₃)₂'))
  assert.ok(s.includes('H₂O'))
  const c = prettyEquation('Fe^3+ + 3SCN^- = Fe(SCN)3')
  assert.ok(c.includes('Fe³⁺'))
  assert.ok(prettySide('2H2 + O2').includes('H₂'))
  assert.equal(normalizeInput('2H2＋O2＝2H2O'), '2h2+o2=2h2o')
})

test('开始日期在未来时：周次不越界，能算出还有几天开始', () => {
  const today = dateStr()
  const state = { profile: { startDate: addDays(today, 2) }, days: {} }
  const w = weekProgress(state)
  assert.equal(w.week, 1)
  assert.equal(w.elapsed, 0)
  assert.equal(w.daysToStart, 2)

  const started = { profile: { startDate: addDays(today, -14) }, days: {} }
  assert.equal(weekProgress(started).week, 3)
  assert.equal(weekProgress(started).daysToStart, 0)
})
