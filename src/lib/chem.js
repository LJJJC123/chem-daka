/**
 * 化学式 / 化学方程式解析与判分内核。
 * 约定：
 *  - 下标直接写数字：H2O、Ca(OH)2
 *  - 电荷用 ^ 标记：Cu^2+、SO4^2-、OH^-
 *  - 状态/条件用括号注记，不参与组成：Na(s)、HCl(aq)、HNO3(稀)
 *  - 分隔符：+ ；等号：= 或 ＝
 *  - 沉淀/气体符号 ↑ ↓ 可写可不写
 */

const SUB = '₀₁₂₃₄₅₆₇₈₉'
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'

const STATE_WORDS = new Set(['s', 'l', 'g', 'aq', '固', '液', '气'])

function toSub(n) {
  return String(n)
    .split('')
    .map((d) => SUB[+d] ?? d)
    .join('')
}

function toSup(n) {
  return String(n)
    .split('')
    .map((d) => (d === '+' ? '⁺' : d === '-' ? '⁻' : (SUP[+d] ?? d)))
    .join('')
}

/** 去掉状态符号与注记（(s)(l)(g)(aq)(稀)(浓)(固)…），保留括号结构 */
function stripAnnotations(s) {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') {
      const close = s.indexOf(')', i)
      if (close < 0) return { text: out, error: '括号不匹配' }
      const inner = s.slice(i + 1, close)
      const isStructural = /[A-Z]/.test(inner)
      const isState = !isStructural && STATE_WORDS.has(inner)
      const isNote = !isStructural && !isState
      if (isStructural) {
        out += s.slice(i, close + 1)
        i = close
        continue
      }
      // 状态符号与注记都丢弃
      i = close
      continue
    }
    out += ch
  }
  return { text: out }
}

/**
 * 解析一个化学式（不含系数）。
 * @returns {{atoms: Record<string, number>, charge: number}}
 */
export function parseFormula(input) {
  let s = String(input)
    .replace(/[↑↓\s]/g, '')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')

  // 电子
  if (/^e\^?-?$/.test(s)) return { atoms: {}, charge: -1 }

  const dot = s.indexOf('·')
  if (dot >= 0) {
    const head = parseFormula(s.slice(0, dot))
    const tail = parseSpecies(s.slice(dot + 1))
    const atoms = { ...head.atoms }
    for (const [k, v] of Object.entries(tail.atoms)) atoms[k] = (atoms[k] || 0) + v * tail.coef
    return { atoms, charge: head.charge + tail.charge * tail.coef }
  }

  const clean = stripAnnotations(s)
  if (clean.error) throw new Error(clean.error)
  s = clean.text

  const atoms = {}
  let charge = 0
  const stack = [atoms]
  let i = 0

  while (i < s.length) {
    const ch = s[i]

    if (ch === '^') {
      const m = /^\^(\d*)([+-])/.exec(s.slice(i))
      if (!m) throw new Error(`电荷写法不对：${s.slice(i)}`)
      charge += (m[1] ? Number(m[1]) : 1) * (m[2] === '-' ? -1 : 1)
      i += m[0].length
      continue
    }

    if (ch === '(') {
      stack.push({})
      i++
      continue
    }

    if (ch === ')') {
      if (stack.length === 1) throw new Error('括号不匹配')
      const child = stack.pop()
      let j = i + 1
      let num = ''
      while (j < s.length && /\d/.test(s[j])) num += s[j++]
      const mult = num ? Number(num) : 1
      const parent = stack[stack.length - 1]
      for (const [k, v] of Object.entries(child)) parent[k] = (parent[k] || 0) + v * mult
      i = j
      continue
    }

    const m = /^([A-Z][a-z]?)/.exec(s.slice(i))
    if (!m) {
      if (ch === '·') {
        i++
        continue
      }
      throw new Error(`无法解析：“${s.slice(i)}”`)
    }
    const el = m[1]
    let j = i + el.length
    let num = ''
    while (j < s.length && /\d/.test(s[j])) num += s[j++]
    const cur = stack[stack.length - 1]
    cur[el] = (cur[el] || 0) + (num ? Number(num) : 1)
    i = j
  }

  if (stack.length !== 1) throw new Error('括号不匹配')
  return { atoms, charge }
}

/** 解析带系数的物质：3Cu(NO3)2 -> {coef:3, formula:'Cu(NO3)2'} */
export function parseSpecies(input) {
  const raw = String(input).trim()
  const m = /^(\d+)\s*(.*)$/.exec(raw)
  const coef = m ? Number(m[1]) : 1
  const formula = (m ? m[2] : raw).replace(/[↑↓\s]/g, '')
  if (!formula) throw new Error('空的物质')
  const { atoms, charge } = parseFormula(formula)
  return { coef, formula, atoms, charge }
}

// 把电荷里的 + / - 临时换成占位符，避免被当成物质分隔符
const MASK_POS = '\u0002'
const MASK_NEG = '\u0003'
function maskCharge(s) {
  return s.replace(/\^(\d*)([+-])/g, (_, n, sign) => `\u0001${n}${sign === '+' ? MASK_POS : MASK_NEG}\u0001`)
}
function unmaskCharge(s) {
  return s.replace(/\u0001(\d*)([\u0002\u0003])\u0001/g, (_, n, sign) => `^${n}${sign === MASK_POS ? '+' : '-'}`)
}

export function splitSide(side) {
  const masked = maskCharge(side)
  return masked
    .split(/[+＋]/)
    .map((x) => unmaskCharge(x).trim())
    .filter(Boolean)
}

export function parseSide(side) {
  return splitSide(side).map(parseSpecies)
}

export function parseEquation(eq) {
  const norm = String(eq).replace(/[＝⇌⇄]/g, '=').replace(/→/g, '=')
  const parts = norm.split('=')
  if (parts.length !== 2) throw new Error('方程式必须有且只有一个等号')
  return { left: parseSide(parts[0]), right: parseSide(parts[1]) }
}

function sumAtoms(species) {
  const total = {}
  let charge = 0
  for (const sp of species) {
    for (const [k, v] of Object.entries(sp.atoms)) total[k] = (total[k] || 0) + v * sp.coef
    charge += sp.charge * sp.coef
  }
  return { atoms: total, charge }
}

/** 配平检查：原子守恒 + 电荷守恒 */
export function checkBalance(left, right) {
  const L = sumAtoms(left)
  const R = sumAtoms(right)
  const keys = new Set([...Object.keys(L.atoms), ...Object.keys(R.atoms)])
  const diffs = []
  for (const k of keys) {
    const a = L.atoms[k] || 0
    const b = R.atoms[k] || 0
    if (a !== b) diffs.push({ el: k, left: a, right: b })
  }
  return {
    ok: diffs.length === 0 && L.charge === R.charge,
    atomOk: diffs.length === 0,
    chargeOk: L.charge === R.charge,
    diffs,
    leftCharge: L.charge,
    rightCharge: R.charge,
  }
}

export function sideSignature(species) {
  return species
    .map((s) => s.formula)
    .sort()
    .join('|')
}

/** 系数按最大公约数化简后比较（允许整体放缩，但要求最简比） */
export function coefRatio(species) {
  const nums = species.map((s) => s.coef)
  const g = nums.reduce((a, b) => gcd(a, b), nums[0] || 1)
  return nums.map((n) => n / g).join(':')
}

function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a || 1
}

/** 展示用：把数字变成下标、电荷变成上标 */
export function pretty(formula) {
  return String(formula)
    .replace(/\^(\d*)([+-])/g, (_, n, sign) => toSup((n || '1') + sign))
    .split(/(\([^)]*\))/)
    .map((chunk) => chunk.replace(/\d/g, (d) => toSub(d)))
    .join('')
}

/** 展示一整条方程式 */
export function prettyEquation(eqString) {
  const norm = String(eqString).replace(/[＝⇌⇄→]/g, '=')
  const parts = norm.split('=')
  if (parts.length !== 2) return String(eqString)
  return `${prettySide(parts[0])} ⇌ ${prettySide(parts[1])}`
}

/** 只展示一侧（反应物） */
export function prettySide(side) {
  return splitSide(side)
    .map((p) => {
      const m = /^(\d+)(.*)$/.exec(p)
      const coef = m ? m[1] : ''
      const rest = m ? m[2] : p
      return coef + pretty(rest)
    })
    .join(' + ')
}

/** 统一用户输入的写法，方便比较 */
export function normalizeInput(s) {
  return String(s)
    .replace(/[＝⇌⇄→]/g, '=')
    .replace(/[＋]/g, '+')
    .replace(/\s+/g, '')
    .replace(/[↑↓]/g, '')
    .toLowerCase()
}

export function formulasOf(species) {
  return species.map((s) => s.formula)
}
