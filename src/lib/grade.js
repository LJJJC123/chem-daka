import { parseSide, parseEquation, checkBalance, formulasOf } from './chem.js'

function sameSet(a, b) {
  if (a.length !== b.length) return false
  return [...a].sort().join('|') === [...b].sort().join('|')
}

function diffSet(expected, actual) {
  const left = [...expected]
  const missing = []
  for (const f of actual) {
    const i = left.indexOf(f)
    if (i >= 0) left.splice(i, 1)
  }
  missing.push(...left)
  const rest = [...expected]
  const extra = []
  for (const f of actual) {
    const i = rest.indexOf(f)
    if (i >= 0) rest.splice(i, 1)
    else extra.push(f)
  }
  return { missing, extra }
}

/** 规则①：给出反应物，填写生成物并配平 */
export function gradeProductFill(eqString, input, accept = []) {
  if (!String(input || '').trim()) return { ok: false, code: 'empty', msg: '还没写生成物' }

  let expected
  let left
  try {
    const parsed = parseEquation(eqString)
    expected = parsed.right
    left = parsed.left
  } catch (e) {
    return { ok: false, code: 'data', msg: '题目数据有问题：' + e.message }
  }

  let user
  try {
    user = parseSide(input)
  } catch (e) {
    return { ok: false, code: 'parse', msg: '写法没看懂：' + e.message }
  }

  const names = formulasOf(user)
  const okProducts = sameSet(names, formulasOf(expected)) || accept.some((a) => sameSet(names, a))
  if (!okProducts) {
    const d = diffSet(formulasOf(expected), names)
    const parts = []
    if (d.missing.length) parts.push(`少了 ${d.missing.join('、')}`)
    if (d.extra.length) parts.push(`多了 ${d.extra.join('、')}`)
    return {
      ok: false,
      code: 'products',
      msg: parts.length ? `生成物不对：${parts.join('；')}` : '生成物不对',
      diff: d,
    }
  }

  const bal = checkBalance(left, user)
  if (!bal.ok) {
    if (!bal.atomOk) {
      const first = bal.diffs.slice(0, 2).map((d) => `${d.el}：左${d.left}/右${d.right}`).join('，')
      return { ok: false, code: 'balance', msg: `生成物对了，但没配平（${first}）`, bal }
    }
    return { ok: false, code: 'charge', msg: '原子平了，电荷不平', bal }
  }

  return { ok: true, msg: '生成物和配平都对', bal }
}

function coefMap(species) {
  const m = {}
  for (const s of species) m[s.formula] = s.coef
  return m
}

function sameCoefs(a, b) {
  const ka = Object.keys(a).sort()
  const kb = Object.keys(b).sort()
  if (ka.join('|') !== kb.join('|')) return false
  return ka.every((k) => a[k] === b[k])
}

/** 规则②：给出情境，自己写完整方程式并配平 */
export function gradeFullEquation(eqString, input) {
  if (!String(input || '').trim()) return { ok: false, code: 'empty', msg: '还没写方程式' }

  let expected
  let user
  try {
    expected = parseEquation(eqString)
  } catch (e) {
    return { ok: false, code: 'data', msg: '题目数据有问题：' + e.message }
  }
  try {
    user = parseEquation(input)
  } catch (e) {
    return { ok: false, code: 'parse', msg: '写法没看懂：' + e.message }
  }

  const okL = sameSet(formulasOf(user.left), formulasOf(expected.left))
  const okR = sameSet(formulasOf(user.right), formulasOf(expected.right))
  if (!okL || !okR) {
    return {
      ok: false,
      code: 'species',
      msg: !okL ? '反应物不对（可能漏了水或酸）' : '生成物不对',
    }
  }

  const bal = checkBalance(user.left, user.right)
  if (!bal.ok) return { ok: false, code: 'balance', msg: '物质对了，但没配平', bal }

  const ratioOk =
    sameCoefs(coefMap(user.left), coefMap(expected.left)) &&
    sameCoefs(coefMap(user.right), coefMap(expected.right))
  if (!ratioOk) return { ok: false, code: 'ratio', msg: '配平后不是最简整数比', bal }

  return { ok: true, msg: '完全正确', bal }
}

export function gradeChoice(q, picked) {
  const correct = picked === q.a
  return { ok: correct, answer: q.a, msg: correct ? '正确' : '再想想' }
}

export const REASONS = [
  { id: 'concept', label: '概念没记住' },
  { id: 'careless', label: '看错/抄错' },
  { id: 'method', label: '不会方法' },
  { id: 'balance', label: '配平/计算' },
  { id: 'time', label: '时间不够' },
]
