import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * 3D 实验台：程序化车削玻璃器皿 + 透射材质 + 液面裁剪 + 气泡/气体/沉淀/生锈/试纸，
 * 不依赖任何 glTF 或贴图。
 */
const S = 0.86

const PROFILES = {
  conical: [
    [0.001, 0], [0.32, 0], [0.33, 0.015], [0.305, 0.09], [0.115, 0.6], [0.085, 0.66],
    [0.085, 1.0], [0.1, 1.02],
  ],
  beaker: [
    [0.001, 0], [0.34, 0], [0.36, 0.02], [0.36, 0.62], [0.375, 0.63], [0.375, 0.66],
  ],
  volumetric: [
    [0.001, 0], [0.26, 0.01], [0.3, 0.08], [0.27, 0.3], [0.12, 0.4], [0.065, 0.5],
    [0.065, 0.92], [0.08, 0.94],
  ],
  tube: [
    [0.001, 0], [0.03, 0.008], [0.055, 0.03], [0.072, 0.07], [0.082, 0.13],
    [0.082, 1.12], [0.094, 1.13],
  ],
}

function radiusAt(profile, y) {
  let r = 0.05
  for (let i = 0; i < profile.length - 1; i++) {
    const [x1, y1] = profile[i]
    const [x2, y2] = profile[i + 1]
    if (y >= y1 && y <= y2) {
      const t = y2 === y1 ? 0 : (y - y1) / (y2 - y1)
      return x1 + t * (x2 - x1)
    }
  }
  const last = profile[profile.length - 1]
  return last ? last[0] : r
}

export function createLabScene(canvas, config = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.localClippingEnabled = true

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b1210')
  scene.fog = new THREE.Fog('#0b1210', 4, 8)

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40)

  const controls = new OrbitControls(camera, canvas)
  const camCfg = config.cam || {}
  controls.target.set(0, camCfg.y ?? 0.45, 0)
  camera.position.copy(
    controls.target.clone().add(new THREE.Vector3(0.45, 0.16, 0.88).normalize().multiplyScalar(camCfg.dist ?? 2.0)),
  )
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.minDistance = 1.2
  controls.maxDistance = 4.8
  controls.minPolarAngle = 0.5
  controls.maxPolarAngle = 1.5

  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = envRT.texture

  /* ---------------- 灯光 ---------------- */
  scene.add(new THREE.HemisphereLight(0xcfe6dd, 0x0a1410, 0.72))

  const key = new THREE.DirectionalLight(0xfff3e2, 1.65)
  key.position.set(2.4, 3.4, 2.2)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 0.5
  key.shadow.camera.far = 12
  key.shadow.camera.left = -2
  key.shadow.camera.right = 2
  key.shadow.camera.top = 2.6
  key.shadow.camera.bottom = -1
  key.shadow.bias = -0.0008
  scene.add(key)

  const rimLight = new THREE.DirectionalLight(0x76e2c0, 1.15)
  rimLight.position.set(-2.2, 1.6, -1.8)
  scene.add(rimLight)

  const fillLight = new THREE.DirectionalLight(0x9fc6ff, 0.5)
  fillLight.position.set(-1.5, 0.8, 2.2)
  scene.add(fillLight)

  const heatLight = new THREE.PointLight(0xff9a5c, 0, 1.1)
  heatLight.position.set(0, 0.16, 0.72)
  scene.add(heatLight)

  /* ---------------- 台面与背景 ---------------- */
  const bench = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshStandardMaterial({ color: 0x121d19, roughness: 0.92, metalness: 0.05 }),
  )
  bench.rotation.x = -Math.PI / 2
  bench.position.y = -0.006
  bench.receiveShadow = true
  scene.add(bench)

  const poolCanvas = document.createElement('canvas')
  poolCanvas.width = poolCanvas.height = 256
  const pctx = poolCanvas.getContext('2d')
  const pg = pctx.createRadialGradient(128, 128, 6, 128, 128, 126)
  pg.addColorStop(0, 'rgba(96, 168, 142, 0.30)')
  pg.addColorStop(0.55, 'rgba(64, 128, 108, 0.10)')
  pg.addColorStop(1, 'rgba(0, 0, 0, 0)')
  pctx.fillStyle = pg
  pctx.fillRect(0, 0, 256, 256)
  const poolTex = new THREE.CanvasTexture(poolCanvas)
  poolTex.colorSpace = THREE.SRGBColorSpace

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 64),
    new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false }),
  )
  pool.rotation.x = -Math.PI / 2
  pool.position.y = 0.002
  scene.add(pool)

  const bgCanvas = document.createElement('canvas')
  bgCanvas.width = 32
  bgCanvas.height = 256
  const bctx = bgCanvas.getContext('2d')
  const bgGrad = bctx.createLinearGradient(0, 0, 0, 256)
  bgGrad.addColorStop(0, '#24443a')
  bgGrad.addColorStop(0.45, '#132520')
  bgGrad.addColorStop(1, '#0a1210')
  bctx.fillStyle = bgGrad
  bctx.fillRect(0, 0, 32, 256)
  const bgTex = new THREE.CanvasTexture(bgCanvas)
  bgTex.colorSpace = THREE.SRGBColorSpace
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 4.4),
    new THREE.MeshBasicMaterial({ map: bgTex, depthWrite: false }),
  )
  backdrop.position.set(0, 1.4, -2.4)
  scene.add(backdrop)

  /* ---------------- 器皿 ---------------- */
  const group = new THREE.Group()
  group.scale.setScalar(S)
  scene.add(group)

  const kind = PROFILES[config.vessel] ? config.vessel : 'beaker'
  const profile = PROFILES[kind]
  const topY = profile[profile.length - 1][1]

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4fcff,
    metalness: 0,
    roughness: 0.04,
    transmission: 1,
    thickness: 0.18,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.5,
    attenuationColor: new THREE.Color(0xd8f2e6),
    attenuationDistance: 1.4,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  })

  const vessel = new THREE.Mesh(
    new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 96),
    glassMat,
  )
  group.add(vessel)

  const mouth = profile[profile.length - 1]
  const rim = new THREE.Mesh(new THREE.TorusGeometry(mouth[0] * 1.03, 0.008, 10, 56), glassMat)
  rim.position.y = mouth[1]
  rim.rotation.x = Math.PI / 2
  group.add(rim)

  /* ---------------- 液体（按液面裁剪） ---------------- */
  const startFill = Math.max(0.12, Math.min(0.9, config.fill ?? 0.46))
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(config.vesselColor || '#dcefff'),
    metalness: 0,
    roughness: 0.38,
    clearcoat: 0,
    envMapIntensity: 0.32,
    transparent: true,
    opacity: config.opacity ?? 0.84,
    side: THREE.DoubleSide,
  })
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), startFill * S)
  liquidMat.clippingPlanes = [clipPlane]

  const liquidGeo = makeLiquidGeometry(profile, topY * 0.985)
  const liquid = new THREE.Mesh(liquidGeo, liquidMat)
  group.add(liquid)

  const baseR = radiusAt(profile, 0.04) * 0.93
  const liquidBase = new THREE.Mesh(new THREE.CircleGeometry(Math.max(0.02, baseR), 64), liquidMat)
  liquidBase.rotation.x = -Math.PI / 2
  liquidBase.position.y = 0.026
  group.add(liquidBase)

  const surfaceMat = new THREE.MeshPhysicalMaterial({
    color: liquidMat.color,
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.2,
    transparent: true,
    opacity: Math.min(1, (config.opacity ?? 0.84) + 0.06),
    side: THREE.DoubleSide,
  })
  const surface = new THREE.Mesh(new THREE.CircleGeometry(1, 64), surfaceMat)
  surface.rotation.x = -Math.PI / 2
  surface.position.y = startFill
  const r0 = radiusAt(profile, startFill) * 0.93
  surface.scale.setScalar(r0)
  group.add(surface)

  let meniscus = null
  let meniscusR = 0
  function rebuildMeniscus(r) {
    if (Math.abs(r - meniscusR) < 0.015) return
    meniscusR = r
    if (meniscus) {
      meniscus.geometry.dispose()
      group.remove(meniscus)
    }
    meniscus = new THREE.Mesh(new THREE.TorusGeometry(r * 0.998, 0.005, 6, 64), surfaceMat)
    meniscus.rotation.x = Math.PI / 2
    meniscus.position.y = startFill
    group.add(meniscus)
  }
  rebuildMeniscus(r0)

  // 沉淀/浑浊：一层半透明白雾
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xf3f6f8, transparent: true, opacity: (config.initialCloud ?? 0) * 0.42, depthWrite: false })
  const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), cloudMat)
  cloud.scale.set(r0 * 0.95, startFill / 2, r0 * 0.95)
  cloud.position.y = startFill / 2
  group.add(cloud)

  /* ---------------- 滴定管 / 铁架台 ---------------- */
  let buretteLiquid = null
  if (config.stand === 'burette') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.92, 48, 1, true), glassMat)
    tube.position.set(0, 1.58, 0)
    group.add(tube)

    const bRim = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 8, 40), glassMat)
    bRim.position.set(0, 2.04, 0)
    bRim.rotation.x = Math.PI / 2
    group.add(bRim)

    buretteLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.66, 32),
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(config.standColor || '#a8cdf0'),
        roughness: 0.5,
        clearcoat: 0,
      }),
    )
    buretteLiquid.position.set(0, 1.52, 0)
    group.add(buretteLiquid)

    const markMat = new THREE.MeshBasicMaterial({ color: 0x9dc4e6, transparent: true, opacity: 0.55 })
    for (let i = 0; i < 5; i++) {
      const mark = new THREE.Mesh(new THREE.TorusGeometry(0.0505, 0.0032, 6, 32), markMat)
      mark.rotation.x = Math.PI / 2
      mark.position.set(0, 1.2 + i * 0.15, 0)
      group.add(mark)
    }

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.046, 0.16, 32, 1, true), glassMat)
    tip.position.set(0, 1.12, 0)
    tip.rotation.x = Math.PI
    group.add(tip)

    const rodMat = new THREE.MeshStandardMaterial({ color: 0x4a5652, roughness: 0.5, metalness: 0.8 })
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 2.06, 24), rodMat)
    rod.position.set(0.55, 1.03, -0.18)
    rod.castShadow = true
    group.add(rod)

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.36), rodMat)
    base.position.set(0.55, 0.022, -0.18)
    base.castShadow = true
    base.receiveShadow = true
    group.add(base)

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.022, 0.03), rodMat)
    arm.position.set(0.28, 1.58, -0.16)
    arm.castShadow = true
    group.add(arm)

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.011, 10, 32), rodMat)
    ring.position.set(0, 1.58, 0)
    ring.rotation.x = Math.PI / 2
    group.add(ring)
  }

  /* ---------------- 电极 ---------------- */
  let electrodeAnode = null
  let electrodeCathode = null
  if (config.electrodes) {
    const zncu = config.electrodes === 'zncu'
    const mk = (x, color) => {
      const el = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.52, 0.12),
        new THREE.MeshStandardMaterial({ color, roughness: zncu ? 0.32 : 0.35, metalness: zncu ? 0.9 : 0.6 }),
      )
      el.position.set(x, 0.42, 0)
      el.castShadow = true
      group.add(el)
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.34, 12),
        new THREE.MeshStandardMaterial({ color: 0xd8c9a8, roughness: 0.4, metalness: 0.8 }),
      )
      cap.position.set(x, 0.84, 0)
      group.add(cap)
      return el
    }
    electrodeCathode = mk(-0.16, zncu ? 0xb87333 : 0x2b3330)
    electrodeAnode = mk(0.16, zncu ? 0x9aa4a6 : 0x2b3330)
  }

  /* ---------------- 铁钉 ---------------- */
  let nail = null
  let nailMat = null
  if (config.nail) {
    nailMat = new THREE.MeshStandardMaterial({ color: 0x6e7476, roughness: 0.38, metalness: 0.85 })
    nail = new THREE.Group()
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.01, 0.5, 18), nailMat)
    body.position.y = 0.3
    nail.add(body)
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.018, 20), nailMat)
    head.position.y = 0.55
    nail.add(head)
    nail.position.set(0.035, 0.03, 0.06)
    nail.rotation.z = 0.14
    nail.castShadow = true
    group.add(nail)
  }

  /* ---------------- 集气瓶 ---------------- */
  let gasMesh = null
  if (config.gasJar) {
    const jar = new THREE.Group()
    jar.position.set(0.62, 0, 0.05)
    group.add(jar)

    const jarGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.72, 48, 1, true), glassMat)
    jarGlass.position.y = 0.36
    jar.add(jarGlass)

    const jarBottom = new THREE.Mesh(new THREE.CircleGeometry(0.13, 48), glassMat)
    jarBottom.rotation.x = -Math.PI / 2
    jarBottom.position.y = 0.001
    jar.add(jarBottom)

    const jarRim = new THREE.Mesh(new THREE.TorusGeometry(0.132, 0.008, 8, 48), glassMat)
    jarRim.position.y = 0.72
    jarRim.rotation.x = Math.PI / 2
    jar.add(jarRim)

    const gasGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.68, 40)
    gasGeo.translate(0, 0.34, 0)
    gasMesh = new THREE.Mesh(
      gasGeo,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(config.gasColor || '#c8d96a'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    )
    gasMesh.position.y = 0.02
    gasMesh.scale.y = 0.001
    jar.add(gasMesh)
  }

  /* ---------------- 温度计 ---------------- */
  if (config.thermometer) {
    const tGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.86, 16), glassMat)
    tGlass.position.set(-0.13, 0.62, 0.02)
    group.add(tGlass)
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), glassMat)
    bulb.position.set(-0.13, 0.2, 0.02)
    group.add(bulb)
    const merc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.3, 10),
      new THREE.MeshBasicMaterial({ color: 0xd23c2f }),
    )
    merc.position.set(-0.13, 0.36, 0.02)
    group.add(merc)
  }

  /* ---------------- 试纸 ---------------- */
  let paper = null
  if (config.paper) {
    paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.12, 0.002),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(config.paperFrom || '#dd5a5a'), roughness: 0.92 }),
    )
    const px = radiusAt(profile, topY - 0.1) * 0.9 + 0.1
    paper.position.set(px, topY - 0.04, 0.02)
    paper.rotation.z = -0.18
    paper.rotation.y = -0.35
    group.add(paper)
  }

  /* ---------------- 气泡 / 蒸汽 / 倒液 ---------------- */
  const BUBBLES = 46
  const bubbleGeo = new THREE.IcosahedronGeometry(0.011, 0)
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.9,
    roughness: 0.05,
    transparent: true,
    opacity: 0.55,
  })
  const bubbles = new THREE.InstancedMesh(bubbleGeo, bubbleMat, BUBBLES)
  const bubbleData = []
  for (let i = 0; i < BUBBLES; i++) {
    bubbleData.push({
      x: (Math.random() - 0.5) * r0 * 1.2,
      z: (Math.random() - 0.5) * r0 * 1.2,
      y: Math.random() * startFill,
      v: 0.08 + Math.random() * 0.16,
      s: 0.5 + Math.random(),
    })
  }
  bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  bubbles.visible = false
  group.add(bubbles)

  const STEAM = 18
  const steam = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.03, 0),
    new THREE.MeshBasicMaterial({ color: 0xdff3ea, transparent: true, opacity: 0, depthWrite: false }),
    STEAM,
  )
  const steamData = []
  for (let i = 0; i < STEAM; i++) {
    steamData.push({
      x: (Math.random() - 0.5) * 0.24,
      z: (Math.random() - 0.5) * 0.16,
      y: startFill + Math.random() * 0.2,
      v: 0.14 + Math.random() * 0.12,
      s: 0.6 + Math.random() * 0.7,
    })
  }
  steam.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  steam.visible = false
  group.add(steam)

  const streamMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(config.standColor || '#a8cdf0'),
    transmission: 0.7,
    roughness: 0.1,
    transparent: true,
    opacity: 0,
  })
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.58, 12), streamMat)
  stream.position.set(0, 0.76, 0)
  group.add(stream)

  /* ---------------- 状态 ---------------- */
  const initialColor = new THREE.Color(config.vesselColor || '#dcefff')
  const state = {
    level: startFill,
    targetLevel: startFill,
    bubble: 0,
    heat: 0,
    warn: 0,
    gas: 0,
    targetGas: 0,
    rust: 0,
    targetRust: 0,
    cloud: config.initialCloud ?? 0,
    targetCloud: config.initialCloud ?? 0,
    pour: 0,
    color: initialColor.clone(),
    targetColor: initialColor.clone(),
    paper: 0,
    targetPaper: 0,
  }

  const clock = new THREE.Clock()
  let raf = 0
  let running = true
  const dummy = new THREE.Object3D()
  const rustColor = new THREE.Color(0x8a4a24)
  const steelColor = new THREE.Color(0x6e7476)

  function frame() {
    if (!running) return
    raf = requestAnimationFrame(frame)
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime

    // 液面
    state.level += (state.targetLevel - state.level) * Math.min(1, dt * 2.4)
    clipPlane.constant = state.level * S
    const rNow = Math.max(0.02, radiusAt(profile, state.level) * 0.93)
    surface.position.y = state.level
    surface.scale.setScalar(rNow)
    rebuildMeniscus(rNow)
    if (meniscus) meniscus.position.y = state.level
    cloud.scale.set(rNow * 0.95, state.level / 2, rNow * 0.95)
    cloud.position.y = state.level / 2

    // 颜色 / 浑浊
    liquidMat.color.lerp(state.targetColor, Math.min(1, dt * 2.4))
    surfaceMat.color.copy(liquidMat.color)
    state.cloud += (state.targetCloud - state.cloud) * Math.min(1, dt * 1.4)
    cloudMat.opacity = state.cloud * 0.42
    cloud.visible = state.cloud > 0.02

    surface.position.y = state.level + Math.sin(t * 1.1) * 0.0014

    // 气泡
    if (state.bubble > 0.02) {
      bubbles.visible = true
      for (let i = 0; i < BUBBLES; i++) {
        const b = bubbleData[i]
        b.y += b.v * dt * (0.6 + state.bubble)
        if (b.y > state.level - 0.01) {
          b.y = 0.02
          b.x = (Math.random() - 0.5) * rNow * 1.2
          b.z = (Math.random() - 0.5) * rNow * 1.2
        }
        dummy.position.set(b.x + Math.sin(t * 3 + i) * 0.005, b.y, b.z)
        dummy.scale.setScalar(b.s * (0.7 + state.bubble * 0.35))
        dummy.updateMatrix()
        bubbles.setMatrixAt(i, dummy.matrix)
      }
      bubbles.instanceMatrix.needsUpdate = true
    } else {
      bubbles.visible = false
    }

    // 加热
    state.heat = Math.max(state.heat, 0)
    const steamOn = state.heat > 0.05
    steam.visible = steamOn
    heatLight.intensity = steamOn ? 0.38 + Math.sin(t * 9) * 0.12 : 0
    if (steamOn) {
      steam.material.opacity = 0.18 + Math.sin(t * 6) * 0.04
      for (let i = 0; i < STEAM; i++) {
        const s = steamData[i]
        s.y += s.v * dt
        if (s.y > topY + 0.35) {
          s.y = state.level + 0.05
          s.x = (Math.random() - 0.5) * 0.24
          s.z = (Math.random() - 0.5) * 0.16
        }
        const fade = 1 - (s.y - state.level) / (topY + 0.35 - state.level)
        dummy.position.set(s.x, s.y, s.z)
        dummy.scale.setScalar(s.s * Math.max(0.15, fade))
        dummy.updateMatrix()
        steam.setMatrixAt(i, dummy.matrix)
      }
      steam.instanceMatrix.needsUpdate = true
    }

    // 集气
    state.gas += (state.targetGas - state.gas) * Math.min(1, dt * 1.6)
    if (gasMesh) {
      gasMesh.scale.y = Math.max(0.001, state.gas)
      gasMesh.material.opacity = state.gas * (config.gasOpacity ?? 0.62)
      gasMesh.visible = state.gas > 0.01
    }

    // 生锈
    state.rust += (state.targetRust - state.rust) * Math.min(1, dt * 1.2)
    if (nailMat) {
      nailMat.color.copy(steelColor).lerp(rustColor, state.rust)
      nailMat.roughness = 0.38 + state.rust * 0.45
    }

    // 试纸变色
    state.paper += (state.targetPaper - state.paper) * Math.min(1, dt * 2)
    if (paper) {
      paper.material.color.set(config.paperFrom || '#dd5a5a').lerp(new THREE.Color(config.paperTo || '#4a7bd6'), state.paper)
    }

    // 倒液
    streamMat.opacity += ((state.pour > 0 ? 0.72 : 0) - streamMat.opacity) * Math.min(1, dt * 6)
    stream.visible = streamMat.opacity > 0.02
    if (stream.visible) {
      stream.scale.y = 1 + Math.sin(t * 18) * 0.02
      if (buretteLiquid) buretteLiquid.scale.y = Math.max(0.2, 1 - state.pour * 0.05)
    }

    // 警示
    if (state.warn > 0) {
      state.warn = Math.max(0, state.warn - dt * 1.2)
      rimLight.color.setHex(0xff6a55)
      rimLight.intensity = 1.1 + state.warn * 2.2
    } else {
      rimLight.color.setHex(0x76e2c0)
      rimLight.intensity = 1.15
    }

    controls.update()
    renderer.render(scene, camera)
  }

  function resize() {
    const el = canvas.parentElement
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  const ro = new ResizeObserver(resize)
  if (canvas.parentElement) ro.observe(canvas.parentElement)
  resize()
  frame()

  return {
    setEffect(name) {
      switch (name) {
        case 'color':
          state.targetColor = new THREE.Color(config.endColor || config.vesselColor || '#dcefff')
          if (buretteLiquid) state.pour = 1
          break
        case 'bubble':
          state.bubble = 1
          break
        case 'pour':
          state.pour = 1
          break
        case 'heat':
          state.heat = 1
          state.bubble = Math.max(state.bubble, 0.45)
          break
        case 'warn':
          state.warn = 1
          break
        case 'levelRise':
          state.targetLevel = Math.min(0.9, state.level + 0.34)
          break
        case 'levelDrop':
          state.targetLevel = Math.max(0.08, state.level - 0.3)
          break
        case 'gas':
          state.targetGas = 1
          break
        case 'precipitate':
          state.targetCloud = 1
          state.targetColor = new THREE.Color(config.endColor || '#e8eef3')
          break
        case 'rust':
          state.targetRust = 1
          break
        case 'paper':
          state.targetPaper = 1
          break
        case 'clear':
          state.targetCloud = 0
          state.targetColor = new THREE.Color(config.endColor || config.vesselColor || '#dcefff')
          state.bubble = 0.35
          break
        case 'calm':
          state.bubble = 0
          state.pour = 0
          state.heat = 0
          state.warn = 0
          break
        case 'reset':
          state.targetLevel = startFill
          state.targetColor = initialColor.clone()
          state.bubble = 0
          state.heat = 0
          state.pour = 0
          state.targetGas = 0
          state.targetRust = 0
          state.targetCloud = 0
          state.targetPaper = 0
          state.warn = 0
          break
        default:
          break
      }
    },
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          mats.forEach((m) => {
            if (m.map) m.map.dispose()
            m.dispose()
          })
        }
      })
      envRT.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }

  function makeLiquidGeometry(prof, top) {
    const inset = 0.93
    const pts = []
    for (const [x, y] of prof) {
      if (y < 0.02 || x <= 0.005) continue
      if (y >= top) break
      pts.push(new THREE.Vector2(x * inset, y + 0.006))
    }
    pts.push(new THREE.Vector2(Math.max(0.004, radiusAt(prof, top) * inset), top))
    return new THREE.LatheGeometry(pts, 96)
  }
}
