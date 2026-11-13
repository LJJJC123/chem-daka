/** 题库 / 卡片 / 实验内容自检 */
import { QUESTIONS } from '../src/data/questions.js'
import { CARDS } from '../src/data/cards.js'
import { LABS } from '../src/data/labs.js'
import { TOPICS } from '../src/data/topics.js'
import { EFFECTS } from '../src/lab3d/effects.js'
import { parseEquation, checkBalance } from '../src/lib/chem.js'

const errors = []
const qIds = new Set()
const stems = new Set()

for (const q of QUESTIONS) {
  const at = q.id || '(无 id)'
  if (!q.id) errors.push(`${at}: 缺少 id`)
  if (qIds.has(q.id)) errors.push(`${at}: id 重复`)
  qIds.add(q.id)
  if (!TOPICS[q.topic]) errors.push(`${at}: topic 非法 ${q.topic}`)
  if (!q.q || q.q.length < 6) errors.push(`${at}: 题干太短`)
  if (stems.has(q.q)) errors.push(`${at}: 题干重复`)
  stems.add(q.q)
  if (!Array.isArray(q.o) || q.o.length !== 4) errors.push(`${at}: 选项不是 4 个`)
  else if (new Set(q.o).size !== 4) errors.push(`${at}: 选项有重复`)
  if (!Number.isInteger(q.a) || q.a < 0 || q.a > 3) errors.push(`${at}: 答案下标非法`)
  if (!q.e) errors.push(`${at}: 缺少解析`)
  if (!q.trap) errors.push(`${at}: 缺少 trap`)
  if (![1, 2, 3].includes(q.diff)) errors.push(`${at}: 难度非法`)
}

const cIds = new Set()
for (const c of CARDS) {
  const at = c.id || '(无 id)'
  if (!c.id) errors.push(`${at}: 卡片缺 id`)
  if (cIds.has(c.id)) errors.push(`${at}: 卡片 id 重复`)
  cIds.add(c.id)
  if (!TOPICS[c.topic]) errors.push(`${at}: 卡片 topic 非法`)
  if (!c.title || !c.body) errors.push(`${at}: 卡片内容为空`)
  if (!c.judge || typeof c.judge.ok !== 'boolean') errors.push(`${at}: 缺少判断自查`)
}

function checkEq(eq, at) {
  try {
    const p = parseEquation(eq)
    const bal = checkBalance(p.left, p.right)
    if (!bal.ok) errors.push(`${at}: 没配平 ${eq}`)
  } catch (e) {
    errors.push(`${at}: 解析失败 ${eq}（${e.message}）`)
  }
}

for (const lab of LABS) {
  const at = lab.id || '(无 lab id)'
  if (!lab.id || !lab.title) errors.push(`${at}: 实验缺 id/标题`)
  if (!TOPICS[lab.topic]) errors.push(`${at}: topic 非法 ${lab.topic}`)
  if (![1, 2].includes(lab.level)) errors.push(`${at}: level 非法`)
  if (lab.level === 2 && !lab.scene) errors.push(`${at}: L2 实验缺少 3D scene`)
  if (lab.level === 1 && !lab.diagram) errors.push(`${at}: 图解实验缺少 diagram`)
  if (lab.scene) {
    if (!['conical', 'beaker', 'volumetric', 'tube'].includes(lab.scene.vessel)) {
      errors.push(`${at}: scene.vessel 非法 ${lab.scene.vessel}`)
    }
    const f = lab.scene.fill
    if (f !== undefined && (typeof f !== 'number' || f <= 0 || f >= 1)) errors.push(`${at}: scene.fill 越界`)
  }
  if (!Array.isArray(lab.order) || lab.order.length < 3) errors.push(`${at}: 步骤太少`)
  const needIds = lab.apparatus.filter((a) => a.need).map((a) => a.id)
  if (!needIds.length) errors.push(`${at}: 没有必需仪器`)
  for (const ch of lab.choices || []) {
    if (!(ch.step >= 0 && ch.step < lab.order.length)) errors.push(`${at}: choice.step 越界`)
    if (!Array.isArray(ch.options) || ch.options.length < 2 || ch.options.length > 4) {
      errors.push(`${at}: 选项数量应为 2~4`)
    }
    const oks = (ch.options || []).filter((o) => o.ok).length
    if (oks !== 1) errors.push(`${at}: 每步应恰好一个正确选项（现在 ${oks} 个）`)
    if (!ch.why) errors.push(`${at}: 缺少 why`)
    for (const o of ch.options || []) {
      if (!o.text || !o.result) errors.push(`${at}: 选项缺少文案或后果`)
      if (o.effect && !EFFECTS.includes(o.effect)) errors.push(`${at}: effect 非法 ${o.effect}`)
    }
  }
  for (const p of lab.phenomena || []) {
    if (!(p.at >= 0 && p.at < (lab.choices?.length || 0))) errors.push(`${at}: phenomena.at 越界`)
    if (!p.text) errors.push(`${at}: phenomena 缺少文字`)
  }
  for (const eq of [...(lab.equations || []), ...(lab.ionic || [])]) checkEq(eq, at)
  if (!lab.pitfalls?.length) errors.push(`${at}: 缺少 pitfalls`)
  if (!lab.summary) errors.push(`${at}: 缺少 summary`)
}

console.log(`检查 ${QUESTIONS.length} 道选择题、${CARDS.length} 张卡片、${LABS.length} 个实验…`)
if (errors.length) {
  console.log(`\n发现 ${errors.length} 个问题：`)
  for (const e of errors) console.log(' ✗ ' + e)
  process.exit(1)
}
console.log(' ✓ 全部通过')
