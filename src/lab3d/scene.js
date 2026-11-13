import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * 3D 实验台。程序化车削器皿 + 透射玻璃 + 液面/气泡/倒液，
 * 不依赖任何 glTF 或贴图，首屏体积小。
 */
export function createLabScene(canvas, config = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b1210')
  scene.fog = new THREE.Fog('#0b1210', 3.6, 7)

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40)
  camera.position.set(1.5, 1.15, 2.95)

  const controls = new OrbitControls(camera, canvas)
  controls.target.set(0, 0.78, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.minDistance = 2.2
  controls.maxDistance = 4.6
  controls.minPolarAngle = 0.55
  controls.maxPolarAngle = 1.48
  controls.autoRotate = false

  // 环境反射（玻璃的关键）
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = envRT.texture

  /* ---------- 灯光 ---------- */
  const hemi = new THREE.HemisphereLight(0xcfe6dd, 0x0a1410, 0.72)
  scene.add(hemi)

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

  /* ---------- 台面 ---------- */
  const bench = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshStandardMaterial({ color: 0x121d19, roughness: 0.92, metalness: 0.05 }),
  )
  bench.rotation.x = -Math.PI / 2
  bench.position.y = -0.006
  bench.receiveShadow = true
  scene.add(bench)

  // 台面中间的柔光池
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

  // 背景板：给玻璃一点可折射的东西
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

  /* ---------- 器皿 ---------- */
  const PROFILE = {
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
  }

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

  const group = new THREE.Group()
  group.scale.setScalar(0.86)
  scene.add(group)

  const vesselKind = config.vessel || 'beaker'
  const points = PROFILE[vesselKind] || PROFILE.beaker

  const vesselMesh = new THREE.Mesh(
    new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), 96),
    glassMat,
  )
  vesselMesh.castShadow = false
  group.add(vesselMesh)

  // 瓶口加厚的一圈，视觉上更像真玻璃
  const mouth = points[points.length - 1]
  const rim = new THREE.Mesh(new THREE.TorusGeometry(mouth[0] * 1.03, 0.009, 10, 56), glassMat)
  rim.position.y = mouth[1]
  rim.rotation.x = Math.PI / 2
  group.add(rim)

  // 液体：按器皿轮廓收窄，截到某个高度
  const fill = 0.46
  const liquidGeo = makeLiquidGeometry(points, fill)
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(config.vesselColor || '#dcefff'),
    metalness: 0,
    roughness: 0.42,
    transmission: 0,
    transparent: false,
    opacity: 1,
    clearcoat: 0,
    envMapIntensity: 0.32,
  })
  const liquid = new THREE.Mesh(liquidGeo, liquidMat)
  group.add(liquid)

  // 液体的底：单独一块圆面，避免车削中心出现放射状接缝
  const firstR = radiusAt(points, 0.03) * 0.945
  const liquidBase = new THREE.Mesh(new THREE.CircleGeometry(Math.max(0.02, firstR), 64), liquidMat)
  liquidBase.rotation.x = -Math.PI / 2
  liquidBase.position.y = 0.026
  group.add(liquidBase)

  // 液面
  const surfaceR = radiusAt(points, fill) * 0.985
  const surface = new THREE.Mesh(
    new THREE.CircleGeometry(surfaceR, 64),
    new THREE.MeshPhysicalMaterial({
      color: liquidMat.color,
      roughness: 0.3,
      metalness: 0,
      transmission: 0,
      transparent: false,
      clearcoat: 0.2,
      side: THREE.DoubleSide,
    }),
  )
  surface.rotation.x = -Math.PI / 2
  surface.position.y = fill
  group.add(surface)

  // 弯月面：液面边缘一圈
  const meniscus = new THREE.Mesh(
    new THREE.TorusGeometry(surfaceR * 0.997, 0.006, 8, 64),
    new THREE.MeshPhysicalMaterial({
      color: liquidMat.color,
      roughness: 0.05,
      transmission: 0.55,
      thickness: 0.1,
      transparent: true,
      opacity: 0.85,
    }),
  )
  meniscus.rotation.x = Math.PI / 2
  meniscus.position.y = fill
  group.add(meniscus)

  /* ---------- 滴定管 / 电极 ---------- */
  let buretteLiquid = null
  let burette = null
  if (config.stand === 'burette') {
    burette = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.92, 48, 1, true), glassMat)
    burette.position.set(0, 1.58, 0)
    group.add(burette)

    const bRim = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 8, 40), glassMat)
    bRim.position.set(0, 2.04, 0)
    bRim.rotation.x = Math.PI / 2
    group.add(bRim)

    buretteLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.66, 32),
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(config.standColor || '#e8f4ff'),
        roughness: 0.5,
        transmission: 0,
        transparent: false,
        clearcoat: 0,
      }),
    )
    buretteLiquid.position.set(0, 1.52, 0)
    group.add(buretteLiquid)

    // 刻度线
    const markMat = new THREE.MeshBasicMaterial({ color: 0x9dc4e6, transparent: true, opacity: 0.55 })
    for (let i = 0; i < 5; i++) {
      const mark = new THREE.Mesh(new THREE.TorusGeometry(0.0505, 0.0032, 6, 32), markMat)
      mark.rotation.x = Math.PI / 2
      mark.position.set(0, 1.2 + i * 0.15, 0)
      group.add(mark)
    }

    // 尖端
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.046, 0.16, 32, 1, true), glassMat)
    tip.position.set(0, 1.12, 0)
    tip.rotation.x = Math.PI
    group.add(tip)

    // 铁架台
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

  const electrodeMat = new THREE.MeshStandardMaterial({ color: 0x2b3330, roughness: 0.35, metalness: 0.6 })
  if (config.electrodes) {
    for (const x of [-0.16, 0.16]) {
      const el = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.5, 0.12), electrodeMat)
      el.position.set(x, 0.42, 0)
      el.castShadow = true
      group.add(el)
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.34, 12),
        new THREE.MeshStandardMaterial({ color: 0xd8c9a8, roughness: 0.4, metalness: 0.8 }),
      )
      cap.position.set(x, 0.82, 0)
      group.add(cap)
    }
  }

  /* ---------- 倒液流 ---------- */
  const streamMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(config.standColor || '#e8f4ff'),
    transmission: 0.7,
    roughness: 0.1,
    transparent: true,
    opacity: 0.0,
  })
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.58, 12), streamMat)
  stream.position.set(0, 0.76, 0)
  group.add(stream)

  /* ---------- 气泡 ---------- */
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
      x: (Math.random() - 0.5) * surfaceR * 1.2,
      z: (Math.random() - 0.5) * surfaceR * 1.2,
      y: Math.random() * fill,
      v: 0.08 + Math.random() * 0.16,
      s: 0.5 + Math.random(),
    })
  }
  bubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  bubbles.visible = false
  group.add(bubbles)

  /* ---------- 状态 ---------- */
  const state = {
    bubbleRate: 0,
    pour: 0,
    heat: 0,
    warn: 0,
    targetColor: new THREE.Color(config.vesselColor || '#dcefff'),
    shake: 0,
  }

  const clock = new THREE.Clock()
  let raf = 0
  let running = true

  const dummy = new THREE.Object3D()
  const tmpColor = new THREE.Color()

  function frame() {
    if (!running) return
    raf = requestAnimationFrame(frame)
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime

    // 颜色过渡
    liquidMat.color.lerp(state.targetColor, Math.min(1, dt * 1.6))
    surface.material.color.copy(liquidMat.color)
    meniscus.material.color.copy(liquidMat.color)

    // 液面微微呼吸
    surface.position.y = fill + Math.sin(t * 1.1) * 0.0016
    liquid.scale.y = 1 + Math.sin(t * 0.8) * 0.002

    // 气泡
    if (state.bubbleRate > 0) {
      bubbles.visible = true
      for (let i = 0; i < BUBBLES; i++) {
        const b = bubbleData[i]
        b.y += b.v * dt * (0.6 + state.bubbleRate)
        if (b.y > fill - 0.01) {
          b.y = 0.01
          b.x = (Math.random() - 0.5) * surfaceR * 1.2
          b.z = (Math.random() - 0.5) * surfaceR * 1.2
        }
        const wobble = Math.sin(t * 3 + i) * 0.006
        dummy.position.set(b.x + wobble, b.y, b.z)
        dummy.scale.setScalar(b.s * (0.8 + state.bubbleRate * 0.3))
        dummy.updateMatrix()
        bubbles.setMatrixAt(i, dummy.matrix)
      }
      bubbles.instanceMatrix.needsUpdate = true
    } else {
      bubbles.visible = false
    }

    // 倒液
    streamMat.opacity += ((state.pour > 0 ? 0.75 : 0) - streamMat.opacity) * Math.min(1, dt * 6)
    stream.visible = streamMat.opacity > 0.02
    if (stream.visible) {
      stream.scale.y = 1 + Math.sin(t * 18) * 0.02
      if (buretteLiquid) buretteLiquid.scale.y = Math.max(0.2, 1 - state.pour * 0.05)
    }

    // 加热：微微升温色
    if (state.heat > 0) {
      liquidMat.emissive = new THREE.Color(0x3a1a08)
      liquidMat.emissiveIntensity = 0.25 + Math.sin(t * 4) * 0.08
    } else {
      liquidMat.emissiveIntensity = 0
    }

    // 警示：红光脉冲 + 轻抖
    if (state.warn > 0) {
      state.warn = Math.max(0, state.warn - dt * 1.2)
      rimLight.color.setHex(0xff6a55)
      rimLight.intensity = 1.1 + state.warn * 2.2
      camera.position.x += Math.sin(t * 60) * 0.0016 * state.warn
    } else {
      rimLight.color.setHex(0x76e2c0)
      rimLight.intensity = 1.5
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
      if (name === 'bubble') state.bubbleRate = 1
      if (name === 'color') {
        state.targetColor = new THREE.Color(config.endColor || '#e79ab5')
        if (buretteLiquid) state.pour = 1
      }
      if (name === 'pour') state.pour = 1
      if (name === 'heat') state.heat = 1
      if (name === 'warn') state.warn = 1
      if (name === 'reset') {
        state.bubbleRate = 0
        state.pour = 0
        state.heat = 0
        state.targetColor = new THREE.Color(config.vesselColor || '#dcefff')
        state.warn = 0
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
          mats.forEach((m) => m.dispose())
        }
      })
      envRT.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }

  function makeLiquidGeometry(prof, h) {
    const inset = 0.915
    const pts = []
    for (const [x, y] of prof) {
      if (y < 0.02 || x <= 0.01) continue
      if (y >= h) break
      pts.push(new THREE.Vector2(x * inset, y + 0.006))
    }
    pts.push(new THREE.Vector2(Math.max(0.002, radiusAt(prof, h) * inset), h))
    return new THREE.LatheGeometry(pts, 96)
  }
}

function radiusAt(profile, y) {
  let r = 0.05
  for (let i = 0; i < profile.length - 1; i++) {
    const [x1, y1] = profile[i]
    const [x2, y2] = profile[i + 1]
    if (y >= y1 && y <= y2) {
      const t = y2 === y1 ? 0 : (y - y1) / (y2 - y1)
      r = x1 + t * (x2 - x1)
      return r
    }
  }
  const last = profile[profile.length - 1]
  return last ? last[0] : r
}
