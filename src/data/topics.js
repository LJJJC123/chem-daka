export const TOPICS = {
  r1: { name: '热化学与盖斯定律', book: '选必1', weight: 8 },
  r2: { name: '化学反应速率', book: '选必1', weight: 6 },
  r3: { name: '化学平衡与平衡常数', book: '选必1', weight: 10 },
  r4: { name: '弱电解质电离平衡', book: '选必1', weight: 6 },
  r5: { name: '水的电离与 pH', book: '选必1', weight: 6 },
  r6: { name: '盐类水解', book: '选必1', weight: 8 },
  r7: { name: '沉淀溶解平衡', book: '选必1', weight: 6 },
  r8: { name: '原电池', book: '选必1', weight: 7 },
  r9: { name: '电解池与金属腐蚀', book: '选必1', weight: 7 },
  s1: { name: '原子结构与电子排布', book: '选必2', weight: 5 },
  s2: { name: '元素周期律', book: '选必2', weight: 6 },
  s3: { name: '共价键与分子结构', book: '选必2', weight: 7 },
  s4: { name: '分子间作用力与氢键', book: '选必2', weight: 5 },
  s5: { name: '晶体与晶胞计算', book: '选必2', weight: 6 },
  s6: { name: '配合物与超分子', book: '选必2', weight: 3 },
  e1: { name: '实验基础与探究', book: '实验', weight: 5 },
  e2: { name: '工业流程与情境题', book: '综合', weight: 6 },
}

export const TOPIC_ORDER = Object.keys(TOPICS)

export function topicName(id) {
  return TOPICS[id]?.name || id
}
