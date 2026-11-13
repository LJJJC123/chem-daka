/**
 * 原始分 → 赋分 的估算表。
 * 浙江一分一赋、三分为一档；这里按温州 A 卷的常见分布做的经验换算，
 * 只用于看趋势，不是官方结果。
 */
const TABLE = [
  [0, 40],
  [40, 45],
  [50, 55],
  [60, 65],
  [70, 73],
  [76, 79],
  [80, 82],
  [84, 84.5],
  [86, 85.5],
  [90, 88.5],
  [95, 92],
  [100, 100],
]

export function rawToAssigned(raw) {
  const x = Math.max(0, Math.min(100, Number(raw) || 0))
  for (let i = 0; i < TABLE.length - 1; i++) {
    const [x1, y1] = TABLE[i]
    const [x2, y2] = TABLE[i + 1]
    if (x >= x1 && x <= x2) {
      const t = x2 === x1 ? 0 : (x - x1) / (x2 - x1)
      return Math.round((y1 + t * (y2 - y1)) * 10) / 10
    }
  }
  return 100
}

export function assignedToRaw(a) {
  const y = Math.max(40, Math.min(100, Number(a) || 0))
  for (let i = 0; i < TABLE.length - 1; i++) {
    const [x1, y1] = TABLE[i]
    const [x2, y2] = TABLE[i + 1]
    if (y >= y1 && y <= y2) {
      const t = y2 === y1 ? 0 : (y - y1) / (y2 - y1)
      return Math.round(x1 + t * (x2 - x1))
    }
  }
  return 100
}

export const LADDER = [
  { week: 2, raw: 70, label: '第二周' },
  { week: 4, raw: 76, label: '第四周' },
  { week: 6, raw: 80, label: '第六周' },
  { week: 8, raw: 85, label: '第八周' },
]

/** 距目标还差多少，附带一句人话 */
export function gapToTarget(raw, targetAssigned = 85) {
  const assigned = rawToAssigned(raw)
  const needRaw = assignedToRaw(targetAssigned)
  const gap = Math.max(0, Math.round(needRaw - raw))
  return {
    assigned,
    needRaw,
    gap,
    text:
      gap === 0
        ? `已经够 ${targetAssigned} 赋分了，稳住`
        : `原始分还差 ${gap} 分（约 ${needRaw} 分）到 ${targetAssigned} 赋分`,
  }
}
