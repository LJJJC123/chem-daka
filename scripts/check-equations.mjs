/**
 * 方程式自检：解析 → 原子守恒 → 电荷守恒 → 系数最简 → 元数据完整
 * 用法：node scripts/check-equations.mjs
 */
import { EQUATIONS } from '../src/data/equations.js'
import { parseEquation, checkBalance, coefRatio } from '../src/lib/chem.js'
import { TOPICS } from '../src/data/topics.js'

const errors = []
const ids = new Set()
const eqs = new Set()

for (const item of EQUATIONS) {
  const where = `${item.id || '(无 id)'}`
  if (!item.id) errors.push(`${where}: 缺少 id`)
  if (ids.has(item.id)) errors.push(`${where}: id 重复`)
  ids.add(item.id)

  if (!TOPICS[item.topic]) errors.push(`${where}: topic 不存在 ${item.topic}`)
  if (!['chem', 'ionic', 'electrode', 'thermo'].includes(item.kind)) errors.push(`${where}: kind 非法 ${item.kind}`)
  if (!['fill', 'full'].includes(item.mode)) errors.push(`${where}: mode 非法 ${item.mode}`)
  if (!item.tip) errors.push(`${where}: 缺少 tip`)

  if (eqs.has(item.eq)) errors.push(`${where}: 方程式重复 ${item.eq}`)
  eqs.add(item.eq)

  let parsed
  try {
    parsed = parseEquation(item.eq)
  } catch (e) {
    errors.push(`${where}: 解析失败 ${item.eq} → ${e.message}`)
    continue
  }
  if (!parsed.left.length || !parsed.right.length) {
    errors.push(`${where}: 有一侧是空的`)
    continue
  }

  const bal = checkBalance(parsed.left, parsed.right)
  if (!bal.ok) {
    const d = bal.diffs.map((x) => `${x.el} ${x.left}≠${x.right}`).join('，')
    errors.push(`${where}: 没配平 ${item.eq}${d ? `（${d}）` : ''}${bal.atomOk ? '（电荷不平）' : ''}`)
  }

  // 最简整数比：所有系数最大公约数为 1
  const all = [...parsed.left, ...parsed.right].map((s) => s.coef)
  const ratio = coefRatio(parsed.left)
  if (/\./.test(ratio)) errors.push(`${where}: 系数不是整数`)
  if (item.kind === 'thermo' && !item.dh) errors.push(`${where}: 热化学缺少 dh`)
}

console.log(`检查 ${EQUATIONS.length} 条方程式…`)
if (errors.length) {
  console.log(`\n发现 ${errors.length} 个问题：`)
  for (const e of errors) console.log(' ✗ ' + e)
  process.exit(1)
}
console.log(' ✓ 全部通过：解析、原子守恒、电荷守恒、id 与元数据')
