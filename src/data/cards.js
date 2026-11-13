/**
 * 每日易错常考知识点卡片（按日期轮换）
 * judge：一句话自查，判断对错
 */
export const CARDS = [
  // r1 热化学
  { id: 'c-r1-1', topic: 'r1', title: '燃烧热的三个条件', body: '1 mol 纯物质、完全燃烧、生成稳定氧化物（水为液态）。缺一个都不是燃烧热。', trap: '水写成气态，或物质不是 1 mol，是最常见的错。', judge: { q: '1 mol 甲烷燃烧生成气态水放出的热量是甲烷的燃烧热。', ok: false, why: '稳定氧化物要求水为液态。' } },
  { id: 'c-r1-2', topic: 'r1', title: '中和热恒为 57.3', body: '稀强酸与稀强碱反应生成 1 mol 液态水，ΔH ≈ -57.3 kJ·mol⁻¹。', trap: '浓硫酸稀释会额外放热，数值偏大。', judge: { q: '中和热的数值与酸碱种类无关（稀强酸强碱）。', ok: true, why: '本质都是 H+ + OH- = H2O。' } },
  { id: 'c-r1-3', topic: 'r1', title: '盖斯定律：方程式能加减', body: '反应热只与始态终态有关。把已知方程式按需要正向、逆向、乘系数相加即可。', trap: '方程式乘几，ΔH 就乘几；倒过来写 ΔH 变号。', judge: { q: '把热化学方程式反写，ΔH 的数值不变、符号不变。', ok: false, why: '反写要变号。' } },
  { id: 'c-r1-4', topic: 'r1', title: 'ΔH 的符号', body: '放热 ΔH<0，吸热 ΔH>0；正负号是答案的一部分。', trap: '漏写负号直接丢分。', judge: { q: '放热反应的 ΔH 为负值。', ok: true, why: '体系能量降低。' } },
  { id: 'c-r1-5', topic: 'r1', title: '热化学方程式要标状态', body: '(s)(l)(g)(aq) 必须写，且要与 ΔH 对应；不写状态通常判错。', trap: '气态水与液态水放热不同。', judge: { q: '热化学方程式中可以不标物质的状态。', ok: false, why: '状态影响 ΔH，必须标。' } },

  // r2 速率
  { id: 'c-r2-1', topic: 'r2', title: '速率之比等于系数之比', body: '同一段时间内，各物质的反应速率之比等于化学计量数之比。', trap: '必须先统一单位、统一物质。', judge: { q: '反应 2A+B=3C 中，v(A):v(B):v(C)=2:1:3。', ok: true, why: '系数比即速率比。' } },
  { id: 'c-r2-2', topic: 'r2', title: '恒容充惰性气体', body: '恒温恒容充 Ar：各组分浓度不变，速率不变、平衡不移动。', trap: '恒压充 Ar 才会使浓度降低。', judge: { q: '恒容容器中充入氩气，反应速率增大。', ok: false, why: '浓度没变。' } },
  { id: 'c-r2-3', topic: 'r2', title: '催化剂不改变 ΔH', body: '催化剂降低活化能、加快反应，但始态终态不变，ΔH 不变。', trap: '也不改变平衡转化率。', judge: { q: '使用催化剂可以增大反应的 ΔH。', ok: false, why: 'ΔH 只由始态终态决定。' } },
  { id: 'c-r2-4', topic: 'r2', title: '升温：正逆都加快', body: '升温使正逆反应速率都增大，吸热方向增大更多。', trap: '不是"正反应加快、逆反应减慢"。', judge: { q: '升高温度，放热反应的正反应速率增大、逆反应速率减小。', ok: false, why: '两个都增大。' } },
  { id: 'c-r2-5', topic: 'r2', title: '控制变量', body: '探究浓度对速率影响时，只改变浓度，温度、体积、催化剂必须相同。', trap: '两组实验只差一个变量。', judge: { q: '探究浓度影响速率时，可以同时改变温度。', ok: false, why: '多变量无法归因。' } },

  // r3 平衡
  { id: 'c-r3-1', topic: 'r3', title: 'K 只与温度有关', body: '平衡常数与浓度、压强、催化剂无关；温度变，K 才变。', trap: 'K 大不代表速率快。', judge: { q: '增大压强，化学平衡常数增大。', ok: false, why: 'K 只随温度变化。' } },
  { id: 'c-r3-2', topic: 'r3', title: '固体液体不进 K', body: '纯固体、纯液体的浓度视为常数，不写入平衡常数表达式。', trap: 'C(s)+H2O(g)=CO(g)+H2(g) 的 K 里没有碳。', judge: { q: 'C(s)+H2O(g)=CO(g)+H2(g) 的 K=c(CO)·c(H2)/c(H2O)。', ok: true, why: '固体不写。' } },
  { id: 'c-r3-3', topic: 'r3', title: 'Q 与 K 比大小', body: 'Q<K 正向进行，Q=K 平衡，Q>K 逆向进行。', trap: 'Q 用当前浓度，K 用平衡浓度。', judge: { q: 'Q>K 时反应向逆方向进行。', ok: true, why: '生成物过多。' } },
  { id: 'c-r3-4', topic: 'r3', title: '等效平衡要"一边倒"', body: '恒温恒容时，把投料按系数折算到同一边，完全相同才等效。', trap: '恒温恒压只要比例相同即可。', judge: { q: '恒温恒容下投入 1 mol N2 与 3 mol H2，和投入 2 mol NH3 等效。', ok: true, why: '折算后相同。' } },
  { id: 'c-r3-5', topic: 'r3', title: '转化率只看平衡', body: '催化剂只缩短达到平衡的时间，不改变转化率。', trap: '"加快反应"不等于"提高转化率"。', judge: { q: '加入催化剂可以提高反应物的平衡转化率。', ok: false, why: '平衡不移动。' } },

  // r4 电离
  { id: 'c-r4-1', topic: 'r4', title: '难溶 ≠ 弱电解质', body: 'BaSO4、CaCO3 难溶，但溶解部分完全电离，属于强电解质。', trap: '强弱看是否完全电离，不看溶解度。', judge: { q: 'BaSO4 难溶于水，所以是弱电解质。', ok: false, why: '溶解部分完全电离，是强电解质。' } },
  { id: 'c-r4-2', topic: 'r4', title: 'Ka 越大酸性越强', body: '同温下 Ka 越大，电离程度越大，酸性越强。', trap: 'Ka 与溶液浓度无关。', judge: { q: 'Ka 越大，该弱酸的酸性越强。', ok: true, why: '同温比较。' } },
  { id: 'c-r4-3', topic: 'r4', title: '弱酸稀释 pH 变化小于 1', body: '弱酸稀释 10 倍，电离程度增大补充 H+，pH 增大小于 1。', trap: '强酸稀释 10 倍 pH 恰好 +1。', judge: { q: 'pH=3 的醋酸稀释 10 倍后 pH=4。', ok: false, why: '弱酸稀释促进电离，pH 在 3~4 之间。' } },
  { id: 'c-r4-4', topic: 'r4', title: '电离吸热', body: '弱电解质电离吸热，升温 Ka 增大、电离度增大。', trap: '升温 pH 反而减小。', judge: { q: '升高温度，醋酸的电离程度增大。', ok: true, why: '电离吸热。' } },
  { id: 'c-r4-5', topic: 'r4', title: '等浓度强弱酸比 pH', body: '同浓度盐酸 pH 小、醋酸 pH 大；同 pH 时醋酸浓度更大。', trap: '同 pH 的弱酸物质的量浓度更大，中和能力更强。', judge: { q: 'pH 相同的盐酸和醋酸，醋酸的浓度更大。', ok: true, why: '醋酸部分电离。' } },

  // r5 水与 pH
  { id: 'c-r5-1', topic: 'r5', title: '中性不等于 pH=7', body: '中性指 c(H+)=c(OH-)。100 ℃ 时 Kw=1e-12，中性 pH=6。', trap: '温度改变，中性 pH 跟着变。', judge: { q: '任何温度下 pH=7 的溶液都显中性。', ok: false, why: '只有 25 ℃ 才成立。' } },
  { id: 'c-r5-2', topic: 'r5', title: '酸中水电离的 H+', body: '酸溶液中，水电离出的 c(H+) 等于溶液中的 c(OH-)。', trap: '别直接拿 c(H+) 当水电离的。', judge: { q: 'pH=2 的盐酸中水电离出的 c(H+)=1×10⁻¹² mol·L⁻¹。', ok: true, why: '等于 c(OH-)。' } },
  { id: 'c-r5-3', topic: 'r5', title: '强酸强碱混合先算过量', body: '先判断谁过量，再算剩余浓度；恰好完全反应才 pH=7。', trap: 'pH 相差 2 以上时，弱的一方可以忽略。', judge: { q: 'pH=2 盐酸与 pH=12 NaOH 等体积混合后 pH=7。', ok: true, why: '恰好中和。' } },
  { id: 'c-r5-4', topic: 'r5', title: '稀释有极限', body: '酸无限稀释 pH 趋近 7 但不会超过 7。', trap: '稀释不会把酸变碱。', judge: { q: 'pH=5 的盐酸稀释 1000 倍后 pH=8。', ok: false, why: '接近 7 但不越过。' } },
  { id: 'c-r5-5', topic: 'r5', title: '强酸弱碱盐显酸性', body: 'NH4Cl、FeCl3 等水解显酸性；强碱弱酸盐显碱性。', trap: '谁弱谁水解。', judge: { q: 'NaHCO3 溶液显碱性。', ok: true, why: 'HCO3- 水解大于电离。' } },

  // r6 水解
  { id: 'c-r6-1', topic: 'r6', title: '水解程度小，不写气体', body: '水解一般很微弱，方程式用可逆号，不写 ↑↓。', trap: '双水解才写沉淀和气体。', judge: { q: 'NH4+ 水解方程式应写成 NH4+ + H2O = NH3↑ + H3O+。', ok: false, why: '水解微弱，不写气体。' } },
  { id: 'c-r6-2', topic: 'r6', title: '越稀越水解、越热越水解', body: '稀释和升温都促进水解。', trap: '水解吸热。', judge: { q: '加热促进 FeCl3 的水解。', ok: true, why: '水解吸热。' } },
  { id: 'c-r6-3', topic: 'r6', title: '蒸干要看产物', body: 'AlCl3、FeCl3 溶液蒸干灼烧得氧化物；Na2CO3 溶液蒸干得 Na2CO3。', trap: '易水解的盐酸盐灼烧后变氧化物。', judge: { q: '将 AlCl3 溶液蒸干灼烧，最终得到 Al2O3。', ok: true, why: '水解→Al(OH)3→灼烧分解。' } },
  { id: 'c-r6-4', topic: 'r6', title: 'Kh=Kw/Ka', body: '弱酸根的水解常数等于 Kw 除以对应弱酸的 Ka。', trap: '酸越弱，其酸根水解越强。', judge: { q: '酸越弱，其对应的酸根离子水解程度越大。', ok: true, why: 'Kh 与 Ka 成反比。' } },
  { id: 'c-r6-5', topic: 'r6', title: '三大守恒', body: '电荷守恒、物料守恒、质子守恒，比较离子浓度时先用电荷守恒。', trap: '电荷守恒按离子所带电荷数配系数。', judge: { q: 'Na2CO3 溶液中 c(Na+)+c(H+)=c(OH-)+c(HCO3-)+2c(CO3^2-)。', ok: true, why: '电荷守恒。' } },

  // r7 沉淀
  { id: 'c-r7-1', topic: 'r7', title: 'Ksp 只随温度变', body: 'Ksp 与离子浓度无关；加沉淀剂不改变 Ksp，只改变平衡。', trap: '温度不变，Ksp 就不变。', judge: { q: '向溶液中加入沉淀剂，Ksp 减小。', ok: false, why: 'Ksp 只随温度变化。' } },
  { id: 'c-r7-2', topic: 'r7', title: '同类型才能比 Ksp', body: 'AgCl 与 AgBr 同为 1:1 型，可以直接比；Ag2S 是 2:1 型，要换算。', trap: '不同组成不能直接看 Ksp 大小。', judge: { q: 'Ksp 越小，物质的溶解度一定越小。', ok: false, why: '仅对同类型成立。' } },
  { id: 'c-r7-3', topic: 'r7', title: '沉淀转化方向', body: '由 Ksp 大的转化为 Ksp 小的更容易。', trap: 'AgCl→AgI→Ag2S 是经典链条。', judge: { q: 'AgCl 沉淀可以转化为 AgI 沉淀。', ok: true, why: 'Ksp(AgI) 更小。' } },
  { id: 'c-r7-4', topic: 'r7', title: '洗涤沉淀用蒸馏水', body: '洗涤是为了除去表面可溶性杂质，不能引入新杂质。', trap: '用稀硫酸洗 BaSO4 会引入 SO4^2-。', judge: { q: '洗涤 BaSO4 沉淀最好用稀硫酸。', ok: false, why: '应使用蒸馏水。' } },
  { id: 'c-r7-5', topic: 'r7', title: '沉淀完全的标准', body: '一般指离子浓度降到 1×10⁻⁵ mol·L⁻¹ 以下。', trap: '不是"一点都没有"。', judge: { q: '沉淀完全是指溶液中该离子浓度为 0。', ok: false, why: '降到 1e-5 以下即可。' } },

  // r8 原电池
  { id: 'c-r8-1', topic: 'r8', title: '负极氧化、正极还原', body: '原电池负极失电子被氧化，正极得电子被还原。', trap: '电子只走导线，不进入溶液。', judge: { q: '原电池中电子由正极经导线流向负极。', ok: false, why: '由负极流向正极。' } },
  { id: 'c-r8-2', topic: 'r8', title: '盐桥双职责', body: '形成闭合回路 + 维持两池电中性。', trap: '盐桥不传导电子。', judge: { q: '盐桥的作用是传导电子。', ok: false, why: '传导离子。' } },
  { id: 'c-r8-3', topic: 'r8', title: '燃料电池：通燃料是负极', body: '通入燃料的一极失电子，是负极（原电池）。', trap: '电解质环境决定配平用 H+ 还是 OH-。', judge: { q: '氢氧燃料电池中通入氧气的一极是负极。', ok: false, why: '通燃料的是负极。' } },
  { id: 'c-r8-4', topic: 'r8', title: '原电池加快反应', body: '构成原电池可以加快氧化还原反应速率。', trap: '锌与稀硫酸加几滴 CuSO4 会更快。', judge: { q: '形成原电池可以加快反应速率。', ok: true, why: '降低反应阻力，电子直接传递。' } },
  { id: 'c-r8-5', topic: 'r8', title: '吸氧还是析氢', body: '中性或弱酸性：吸氧腐蚀；酸性较强：析氢腐蚀。', trap: '钢铁在中性环境中主要吸氧腐蚀。', judge: { q: '钢铁在潮湿的中性空气中主要发生析氢腐蚀。', ok: false, why: '主要吸氧腐蚀。' } },

  // r9 电解
  { id: 'c-r9-1', topic: 'r9', title: '阳极接正极', body: '电解池阳极与电源正极相连，发生氧化反应。', trap: '原电池才分正负极。', judge: { q: '电解池的阳极与电源正极相连。', ok: true, why: '阳极氧化。' } },
  { id: 'c-r9-2', topic: 'r9', title: '放电顺序', body: '阳极：活泼电极 > Cl- > OH-；阴极：Ag+ > Cu2+ > H+。', trap: '阴极是阳离子得电子，顺序反着记。', judge: { q: '电解 CuCl2 溶液时，阳极先析出氧气。', ok: false, why: 'Cl- 优先放电生成 Cl2。' } },
  { id: 'c-r9-3', topic: 'r9', title: '电镀：镀件作阴极', body: '镀层金属作阳极，镀件作阴极，电镀液含镀层金属离子。', trap: '电镀液浓度基本不变。', judge: { q: '电镀时镀件应作阳极。', ok: false, why: '镀件作阴极。' } },
  { id: 'c-r9-4', topic: 'r9', title: '精炼铜：粗铜作阳极', body: '粗铜阳极溶解，纯铜阴极析出，比铜活泼的杂质进入溶液。', trap: '阳极泥里是 Ag、Au。', judge: { q: '电解精炼铜时，粗铜作阳极。', ok: true, why: '阳极溶解。' } },
  { id: 'c-r9-5', topic: 'r9', title: '电子守恒算产物', body: '串联电路中各电极转移电子数相等，按 n(e-) 列等式。', trap: '注意 Al3+ 需要 3 个电子。', judge: { q: '电解时转移 3 mol 电子，阴极最多析出 1 mol Al。', ok: true, why: 'Al3+ + 3e- = Al。' } },

  // s1 原子结构
  { id: 'c-s1-1', topic: 's1', title: 'Cr、Cu 的特例', body: 'Cr 3d⁵4s¹，Cu 3d¹⁰4s¹，半满/全满更稳定。', trap: '写电子排布式时最容易错这两个。', judge: { q: '基态 Cu 原子的价层电子排布为 3d¹⁰4s¹。', ok: true, why: '全满稳定。' } },
  { id: 'c-s1-2', topic: 's1', title: '4s 先于 3d 填充', body: '构造原理：4s 能量低于 3d，先填 4s。', trap: '但失电子时先失 4s。', judge: { q: '基态 Fe 原子失去电子时，先失去 3d 电子。', ok: false, why: '先失 4s。' } },
  { id: 'c-s1-3', topic: 's1', title: '电子云不是轨迹', body: '电子云表示电子出现的概率密度，小黑点不是电子。', trap: '轨道是空间的运动状态描述。', judge: { q: '电子云图中的小黑点表示电子。', ok: false, why: '表示概率密度。' } },
  { id: 'c-s1-4', topic: 's1', title: '洪特规则', body: '同一能级的轨道，电子优先单独占据且自旋相同。', trap: '所以 2p³ 有 3 个未成对电子。', judge: { q: '基态 N 原子有 3 个未成对电子。', ok: true, why: '2p³ 各占一个。' } },
  { id: 'c-s1-5', topic: 's1', title: '轨道数', body: 's 有 1 个轨道，p 有 3 个，d 有 5 个，f 有 7 个。', trap: '每个轨道最多 2 个电子。', judge: { q: '3d 能级有 5 个原子轨道。', ok: true, why: 'd 轨道数为 5。' } },

  // s2 周期律
  { id: 'c-s2-1', topic: 's2', title: '半径：同周期左大右小', body: '同周期从左到右原子半径减小；同主族从上到下增大。', trap: '比较离子半径要先看电子层。', judge: { q: '同周期元素从左到右原子半径逐渐增大。', ok: false, why: '逐渐减小。' } },
  { id: 'c-s2-2', topic: 's2', title: '电离能反常', body: '同周期第一电离能总体增大，但 ⅡA>ⅢA、ⅤA>ⅥA。', trap: 'N>O、Mg>Al 是常考点。', judge: { q: '第一电离能 N>O。', ok: true, why: '2p 半充满。' } },
  { id: 'c-s2-3', topic: 's2', title: '电负性看 F', body: 'F 最大，O 次之；金属性越强电负性越小。', trap: '电负性大不等于第一电离能大。', judge: { q: '电负性最大的元素是氟。', ok: true, why: 'F 电负性 4.0。' } },
  { id: 'c-s2-4', topic: 's2', title: '氢化物稳定性看键能', body: '同主族从上到下氢化物稳定性减弱；同周期从左到右增强。', trap: '沸点看分子间作用力，别混。', judge: { q: '热稳定性 HF>HCl>HBr。', ok: true, why: '键长增大键能减小。' } },
  { id: 'c-s2-5', topic: 's2', title: '最高正价', body: '一般等于族序数，但 O 无正价、F 无正价。', trap: '副族元素不一定。', judge: { q: '氟元素的最高正价为 +7。', ok: false, why: 'F 无正价。' } },

  // s3 分子结构
  { id: 'c-s3-1', topic: 's3', title: 'VSEPR 先数电子对', body: '价层电子对数 = σ 键数 + 孤电子对数，决定 VSEPR 构型。', trap: '分子构型要去掉孤电子对的位置。', judge: { q: 'NH3 的空间结构是平面三角形。', ok: false, why: '三角锥形。' } },
  { id: 'c-s3-2', topic: 's3', title: '杂化看电子对数', body: '2→sp，3→sp²，4→sp³。', trap: 'CO2 是 sp，不是 sp²。', judge: { q: 'BF3 中 B 原子为 sp² 杂化。', ok: true, why: '3 个 σ 键、无孤对。' } },
  { id: 'c-s3-3', topic: 's3', title: '极性看对称性', body: '含极性键但结构对称的分子是非极性分子，如 CO2、CH4。', trap: '别只看键的极性。', judge: { q: 'CO2 是极性分子。', ok: false, why: '直线对称，非极性。' } },
  { id: 'c-s3-4', topic: 's3', title: '键角排序', body: 'CH4 109.5° > NH3 107° > H2O 104.5°。', trap: '孤电子对越多，排斥越大，键角越小。', judge: { q: '键角：H2O>NH3>CH4。', ok: false, why: '顺序反了。' } },
  { id: 'c-s3-5', topic: 's3', title: 'σ 与 π', body: '单键是 σ；双键 1σ+1π；三键 1σ+2π。', trap: 'π 键更易断裂，所以不饱和烃易加成。', judge: { q: '乙烯分子中含有 5 个 σ 键和 1 个 π 键。', ok: true, why: 'C2H4：4 个 C-H + 1 个 C-C σ，加 1 个 π。' } },

  // s4 分子间力
  { id: 'c-s4-1', topic: 's4', title: '氢键的三个元素', body: '与 N、O、F 相连的 H 才能形成氢键。', trap: '氢键不是化学键，但比范德华力强。', judge: { q: 'CH4 分子间能形成氢键。', ok: false, why: 'C-H 不能形成氢键。' } },
  { id: 'c-s4-2', topic: 's4', title: '沸点反常三兄弟', body: 'H2O、HF、NH3 因氢键沸点反常偏高。', trap: '同主族其他氢化物按相对分子质量递增。', judge: { q: 'H2O 的沸点比 H2S 高，是因为水分子间有氢键。', ok: true, why: '氢键增强分子间作用力。' } },
  { id: 'c-s4-3', topic: 's4', title: '相似相溶', body: '极性溶质易溶于极性溶剂，非极性溶质易溶于非极性溶剂。', trap: 'I2 溶于 CCl4 是典型例子。', judge: { q: '碘在四氯化碳中的溶解度比在水中大。', ok: true, why: '都是非极性。' } },
  { id: 'c-s4-4', topic: 's4', title: '冰为什么浮', body: '冰中氢键有方向性，形成空隙较大的网状结构，密度小于水。', trap: '4 ℃ 的水密度最大。', judge: { q: '冰的密度比水小，与水分子间氢键有关。', ok: true, why: '氢键使结构疏松。' } },
  { id: 'c-s4-5', topic: 's4', title: '手性碳', body: '一个碳连四个不同基团即为手性碳，分子可能有对映异构。', trap: 'CH2Cl2 不是手性分子。', judge: { q: 'CH2Cl2 分子存在手性。', ok: false, why: '有两个相同 H。' } },

  // s5 晶体
  { id: 'c-s5-1', topic: 's5', title: '四类晶体', body: '离子晶体（NaCl）、共价晶体（金刚石）、分子晶体（干冰）、金属晶体（Cu）。', trap: '看构成微粒和微粒间作用力。', judge: { q: '金刚石属于分子晶体。', ok: false, why: '共价晶体。' } },
  { id: 'c-s5-2', topic: 's5', title: '晶胞均摊法', body: '顶点 1/8、棱 1/4、面 1/2、体内 1。', trap: '先数位置再乘份数。', judge: { q: '立方晶胞中，棱上的原子被 4 个晶胞共用。', ok: true, why: '棱 1/4。' } },
  { id: 'c-s5-3', topic: 's5', title: '配位数', body: '面心立方 12，体心立方 8，简单立方 6。', trap: 'NaCl 中 Na+ 的配位数是 6。', judge: { q: '面心立方最密堆积的配位数是 12。', ok: true, why: '同层 6、上下各 3。' } },
  { id: 'c-s5-4', topic: 's5', title: '晶格能决定熔点', body: '离子电荷越高、半径越小，晶格能越大，熔点越高。', trap: 'MgO 熔点高于 NaCl。', judge: { q: 'MgO 的熔点比 NaCl 高。', ok: true, why: 'Mg2+、O2- 电荷高半径小。' } },
  { id: 'c-s5-5', topic: 's5', title: '分子晶体熔沸点', body: '分子晶体熔化只破坏分子间作用力，不破坏共价键。', trap: '干冰升华是物理变化。', judge: { q: '干冰升华时破坏了 C=O 共价键。', ok: false, why: '只破坏分子间作用力。' } },

  // s6 配合物
  { id: 'c-s6-1', topic: 's6', title: '配位数看配体数', body: '[Cu(NH3)4]2+ 配位数 4；[Fe(CN)6]3- 配位数 6。', trap: '外界离子不算配体。', judge: { q: '[Cu(NH3)4]SO4 中 Cu2+ 的配位数是 4。', ok: true, why: '4 个 NH3。' } },
  { id: 'c-s6-2', topic: 's6', title: '内界难电离', body: '配合物内界稳定，外界离子可电离。', trap: '配位键是特殊的共价键。', judge: { q: '配合物中配位键属于离子键。', ok: false, why: '属于共价键。' } },
  { id: 'c-s6-3', topic: 's6', title: '生物中的配合物', body: '血红素中心 Fe2+，叶绿素中心 Mg2+，维生素 B12 含 Co。', trap: '别记混。', judge: { q: '叶绿素中的中心离子是 Fe2+。', ok: false, why: '是 Mg2+。' } },
  { id: 'c-s6-4', topic: 's6', title: '超分子靠自组装', body: '超分子通过非共价作用（氢键、配位、静电）自组装，具有分子识别功能。', trap: '不是靠共价键连接。', judge: { q: '超分子是通过共价键连接形成的。', ok: false, why: '非共价作用。' } },

  // e1 实验
  { id: 'c-e1-1', topic: 'e1', title: '过滤三靠', body: '一贴二低三靠：滤纸贴壁、液面低于滤纸边缘、玻璃棒靠滤纸三层处。', trap: '漏斗下端靠烧杯内壁。', judge: { q: '过滤时液面可以高于滤纸边缘。', ok: false, why: '必须低于。' } },
  { id: 'c-e1-2', topic: 'e1', title: '分液下层从下口放', body: '下层液体从下口放出，上层液体从上口倒出。', trap: '先放下层再倒上层。', judge: { q: '分液时上层液体也从下口放出。', ok: false, why: '上层从上口倒。' } },
  { id: 'c-e1-3', topic: 'e1', title: '温度计位置', body: '蒸馏时温度计水银球在支管口；测反应液温度时插入液面下。', trap: '位置错等于白做。', judge: { q: '蒸馏时温度计水银球应插入液面以下。', ok: false, why: '应在支管口。' } },
  { id: 'c-e1-4', topic: 'e1', title: '容量瓶不能直接溶解', body: '先在烧杯中溶解、冷却，再转移到容量瓶，洗涤烧杯和玻璃棒 2~3 次。', trap: '热溶液直接转移会改变体积。', judge: { q: '配制溶液时可以在容量瓶中直接溶解固体。', ok: false, why: '不能。' } },
  { id: 'c-e1-5', topic: 'e1', title: '滴定终点判断', body: '滴入最后半滴，溶液颜色突变且半分钟不褪色即为终点。', trap: '俯视读数偏小、仰视偏大。', judge: { q: '滴定读数时俯视会使读数偏大。', ok: false, why: '俯视偏小。' } },
  { id: 'c-e1-6', topic: 'e1', title: '浓硫酸稀释', body: '酸入水、沿器壁、不断搅拌。', trap: '不能在量筒中稀释。', judge: { q: '稀释浓硫酸时应把水倒入浓硫酸中。', ok: false, why: '酸入水。' } },

  // e2 流程
  { id: 'c-e2-1', topic: 'e2', title: '提高浸出率三招', body: '粉碎、升温、增大浓度、搅拌。', trap: '浸出率与速率不是一回事。', judge: { q: '把矿石粉碎可以提高浸出速率和浸出率。', ok: true, why: '增大接触面积。' } },
  { id: 'c-e2-2', topic: 'e2', title: '调 pH 的目的', body: '使杂质离子水解沉淀，同时不让目标离子损失。', trap: 'pH 不是越高越好。', judge: { q: '流程中调节 pH 的目的是加快反应速率。', ok: false, why: '为了除杂。' } },
  { id: 'c-e2-3', topic: 'e2', title: '绿色氧化剂', body: 'H2O2 还原产物是水，不引入杂质，是流程题首选。', trap: '后续要加热分解除去多余 H2O2。', judge: { q: '流程中常选 H2O2 作氧化剂，因为它不引入杂质。', ok: true, why: '还原产物为水。' } },
  { id: 'c-e2-4', topic: 'e2', title: '循环利用', body: '母液、滤液返回前面工序，提高原料利用率。', trap: '注意杂质累积。', judge: { q: '把滤液返回浸取工序可以提高原料利用率。', ok: true, why: '循环利用。' } },
  { id: 'c-e2-5', topic: 'e2', title: '产率与转化率', body: '产率 = 实际产量/理论产量；理论产量按限量试剂算。', trap: '别拿起始量当理论产量。', judge: { q: '产率计算时，理论产量应按过量试剂计算。', ok: false, why: '按限量试剂。' } },
  { id: 'c-e2-6', topic: 'e2', title: '检验洗净', body: '取最后一次洗涤液，检验其中是否还有目标杂质离子。', trap: '检验的是洗涤液，不是沉淀。', judge: { q: '检验沉淀是否洗净，应取最后一次洗涤液进行检验。', ok: true, why: '看洗出液。' } },
]
