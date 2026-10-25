import { MOBILE_QUERY, isMobileLayout } from './layout.js'
import './style.css'
import * as THREE from 'three'
import { clayColor } from './colors.js'
import { createCharacters } from './characters.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { DATA as SOURCE_DATA } from './data.js'
import { tr, localizeData, localizeStatic } from './i18n.js'
import { createAccessibility, createMotionPreference } from './accessibility.js'
import { createModelKit, itemLayout } from './model-kit.js'
import { createEnvironment } from './environment.js'
import { createExplorer } from './explorer.js'
import { createSelection } from './selection.js'
import { createCollaboration } from './collaboration.js'
import { createJournal } from './journal.js'
import { createDiagnostics } from './diagnostics.js'
import { batchStaticWorld } from './static-world.js'

function mulberry32(seed) {
    return () => {
        let t = seed += 0x6D2B79F5
        t = Math.imul(t ^ t >>> 15, t | 1)
        t ^= t + Math.imul(t ^ t >>> 7, t | 61)
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
}

const DATA = localizeData(SOURCE_DATA)
localizeStatic()
const loading = document.querySelector('#loading')
function showError(error) {
    loading.hidden = false
    loading.setAttribute('role', 'alert')
    loading.querySelector('h2').textContent = tr('場景暫時無法載入')
    loading.querySelector('p').textContent = tr('請確認瀏覽器支援 WebGL，或重新整理頁面。') + (error.message || error)
    console.error(error)
}

try {
    const random = mulberry32(DATA.seed)
    const { radius: R, spacing, top: TOP, waterY } = DATA.world
    const reducedMotion = createMotionPreference()
    let guideOpen = false
    const scene = new THREE.Scene()
    const horizon = new THREE.Color('#f4eee3')
    scene.fog = new THREE.Fog(horizon, 72, 165)
    const canvas = document.querySelector('canvas.webgl')
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.outputEncoding = THREE.sRGBEncoding // Three.js r126 API
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = .93
    renderer.physicallyCorrectLights = true
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // Casters are static. Rebuild the map only when the quantized sun position changes.
    renderer.shadowMap.autoUpdate = false
    renderer.shadowMap.needsUpdate = true
    const diagnostics = createDiagnostics(renderer)
    const labels = new CSS2DRenderer()
    labels.domElement.className = 'labels'
    document.querySelector('#world').appendChild(labels.domElement)
    const camera = new THREE.PerspectiveCamera(32, 1, 0.3, 320)
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = !reducedMotion.matches
    controls.dampingFactor = 0.07
    controls.enablePan = false
    controls.minPolarAngle = THREE.MathUtils.degToRad(25)
    controls.maxPolarAngle = THREE.MathUtils.degToRad(70)
    controls.minDistance = 3
    controls.maxDistance = 70
    const islands = DATA.islands.map(data => ({
        data,
        center: new THREE.Vector3(Math.sqrt(3) * spacing * (data.axial.q + data.axial.r / 2), 0, 1.5 * spacing * data.axial.r)
    }))
    const bounds = new THREE.Box3().setFromPoints(islands.map(i => i.center))
    const center = bounds.getCenter(new THREE.Vector3())
    center.y = TOP
    let interaction = null
    function overview() {
        interaction?.reset()
        if (interaction) explorer.closeCard()
        if (interaction) { journal?.close(); if (isMobileLayout()) explorer.closeIndex() }
        const aspect = window.innerWidth / window.innerHeight
        const direction = new THREE.Vector3(.24,.53,.87).normalize()
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), direction).normalize()
        const up = new THREE.Vector3().crossVectors(direction,right).normalize()
        const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov/2))
        let fit = 0
        for (const island of islands) for (let n=0;n<6;n++) for (const y of [TOP,TOP+1.8]) {
            const point = new THREE.Vector3(island.center.x+Math.cos(Math.PI/6+n*Math.PI/3)*R,y,island.center.z+Math.sin(Math.PI/6+n*Math.PI/3)*R).sub(center)
            fit = Math.max(fit,point.dot(direction)+Math.abs(point.dot(right))*1.1/(tan*aspect),point.dot(direction)+Math.abs(point.dot(up))*1.15/tan)
        }
        const distance = Math.max(aspect > 1.5 ? 38 : aspect > .9 ? 44 : 62,fit+1)
        controls.maxDistance = Math.max(70,distance+2)
        controls.target.copy(center)
        camera.position.copy(center).add(new THREE.Vector3(0.24, 0.53, 0.87).normalize().multiplyScalar(distance))
        controls.update()
        dirty = true
    }
    const hemi = new THREE.HemisphereLight(0xeef6fa, 0x8f8270, 1.3)
    scene.add(hemi)
    const sun = new THREE.DirectionalLight(0xfff1de, 2.8)
    sun.position.copy(center).add(new THREE.Vector3(-12, 24, 20))
    sun.target.position.copy(center)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 90 })
    sun.shadow.bias = -0.0006
    sun.shadow.normalBias = 0.045
    sun.shadow.radius = 3
    scene.add(sun, sun.target)
    const fill = new THREE.DirectionalLight(0xbfd6ff, 0.35)
    fill.position.set(-15, 10, -15)
    scene.add(fill)

    const sky = new THREE.Mesh(new THREE.SphereGeometry(170, 32, 16), new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: { uTop: { value: new THREE.Color('#9fd0ec') }, uHorizon: { value: horizon }, uSunDir: { value: new THREE.Vector3() }, uSun: { value: new THREE.Color('#fff1de') }, uNight: { value: 0 } },
        vertexShader: 'varying vec3 vDir; void main(){vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: `uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSun; uniform float uNight; varying vec3 vDir;
            float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
            void main(){vec3 dir=normalize(vDir);float h=smoothstep(-.02,.55,dir.y);vec3 color=mix(uHorizon,uTop,h);color+=uSun*pow(max(dot(dir,uSunDir),0.),18.)*.35*(1.-uNight);float star=step(.9965,hash(floor(dir*180.)))*smoothstep(.05,.3,dir.y);color+=vec3(star*uNight*.7);gl_FragColor=vec4(color,1.);}`
    }))
    scene.add(sky)
    const waterMaterial = new THREE.ShaderMaterial({
        fog: true,
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
            uTime: { value: 0 }, uShallow: { value: new THREE.Color('#a4d4da') },
            uDeep: { value: new THREE.Color('#6fa9b8') }, uCenter: { value: new THREE.Vector2(center.x, center.z) }
        }]),
        vertexShader: `varying vec3 vWorld;
            #include <fog_pars_vertex>
            void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
            #include <fog_vertex>
            }`,
        fragmentShader: `uniform float uTime; uniform vec3 uShallow; uniform vec3 uDeep; uniform vec2 uCenter; varying vec3 vWorld;
            #include <fog_pars_fragment>
            void main(){float wave=sin(vWorld.x*1.3+vWorld.z*.8+uTime*.35)*sin(vWorld.z*1.6-uTime*.24);float deep=smoothstep(10.,85.,distance(vWorld.xz,uCenter));vec3 color=mix(uShallow,uDeep,deep*.8+wave*.035);float sparkle=pow(max(0.,sin(vWorld.x*8.+uTime)*sin(vWorld.z*9.-uTime*.3)),18.)*.035;gl_FragColor=vec4(color+sparkle,1.);
            #include <fog_fragment>
            }`
    })
    const water = new THREE.Mesh(new THREE.CircleGeometry(160, 64).rotateX(-Math.PI / 2), waterMaterial)
    water.position.y = waterY
    scene.add(water)
    function solid(color) { return new THREE.MeshStandardMaterial({ color: clayColor(color), roughness: 0.92, metalness: 0 }) }
    const curbMaterial = solid('#e4d6c3')
    const pathMaterial = solid('#dcc4ac')
    const deckMaterial = solid('#bd936d')
    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = textureCanvas.height = 256
    const ctx = textureCanvas.getContext('2d')
    ctx.fillStyle = '#f4ead8'; ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 1200; i++) {
        ctx.fillStyle = i % 2 ? '#e8dcc7' : '#faf1e1'
        ctx.fillRect(random() * 256, random() * 256, 1 + random() * 3, 1 + random() * 3)
    }
    const texture = new THREE.CanvasTexture(textureCanvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.encoding = THREE.sRGBEncoding
    const groundMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
    function hexRing(inner, outer, material, x, y, z) {
        const geometry = new THREE.RingGeometry(inner, outer, 6).rotateZ(Math.PI / 6).rotateX(-Math.PI / 2)
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(x, y, z)
        mesh.receiveShadow = true
        scene.add(mesh)
        return mesh
    }
    const foamMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false })
    const shallowsMaterial = new THREE.MeshBasicMaterial({ color: '#cae6df', transparent: true, opacity: 0.28, depthWrite: false })
    const labelEntries = []
    const grounds = []
    const lampMaterial = new THREE.MeshStandardMaterial({ color: '#ffe4aa', emissive: '#ffc777', emissiveIntensity: 0, roughness: .78 })
    const lampPostMaterial = solid('#71806a')
    const poolMaterial = new THREE.MeshBasicMaterial({ color: '#ffc777', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const lampCount = islands.length * 6
    const lampPosts = new THREE.InstancedMesh(new THREE.CylinderGeometry(.025, .035, .42, 8), lampPostMaterial, lampCount)
    const lampBulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(.075, 8, 6), lampMaterial, lampCount)
    const lampPools = new THREE.InstancedMesh(new THREE.CircleGeometry(.24, 20).rotateX(-Math.PI / 2), poolMaterial, lampCount)
    const lampDummy = new THREE.Object3D()
    let lampIndex = 0
    for (const { data, center: p } of islands) {
        const side = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.96, TOP - waterY, 6), waterMaterial)
        side.position.set(p.x, (TOP + waterY) / 2, p.z)
        // CylinderGeometry starts at +z; its vertices align with the pointy-top ground.
        scene.add(side)
        const band = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.16, 6), solid(data.color))
        band.position.set(p.x, TOP - 0.09, p.z)
        band.castShadow = true
        scene.add(band)
        const groundGeometry = new THREE.CircleGeometry(R - 0.05, 6).rotateZ(Math.PI / 6).rotateX(-Math.PI / 2)
        const positions = groundGeometry.attributes.position
        const uv = groundGeometry.attributes.uv
        for (let i = 0; i < positions.count; i++) uv.setXY(i, (positions.getX(i) + p.x) / 2.2, (positions.getZ(i) + p.z) / 2.2)
        const ground = new THREE.Mesh(groundGeometry, groundMaterial)
        ground.position.set(p.x, TOP, p.z)
        ground.receiveShadow = true
        ground.userData.owner = { islandId: data.id, itemId: null }
        grounds.push(ground)
        scene.add(ground)
        hexRing(1.50, 1.78, pathMaterial, p.x, TOP + 0.009, p.z)
        hexRing(R - 0.13, R - 0.05, curbMaterial, p.x, TOP + 0.013, p.z)
        hexRing(R, R + 0.7, shallowsMaterial, p.x, waterY + 0.006, p.z)
        hexRing(R + 0.12, R + 0.16, foamMaterial, p.x, waterY + 0.012, p.z)
        for (let n = 0; n < 6; n++) {
            const angle = Math.PI / 6 + n * Math.PI / 3
            const x = p.x + Math.cos(angle) * 1.86, z = p.z - Math.sin(angle) * 1.86
            lampDummy.position.set(x, TOP + .21, z); lampDummy.updateMatrix(); lampPosts.setMatrixAt(lampIndex, lampDummy.matrix)
            lampDummy.position.y = TOP + .46; lampDummy.updateMatrix(); lampBulbs.setMatrixAt(lampIndex, lampDummy.matrix)
            lampDummy.position.y = TOP + .025; lampDummy.updateMatrix(); lampPools.setMatrixAt(lampIndex, lampDummy.matrix)
            lampIndex++
        }
        const tag = document.createElement('button')
        tag.type = 'button'
        tag.className = 'island-label'
        const number = document.createElement('span')
        number.textContent = data.number
        const name = document.createElement('span')
        name.textContent = data.name.zh.replace(/島$/, '')
        tag.append(number, name)
        tag.setAttribute('aria-label', data.name.zh)
        const label = new CSS2DObject(tag)
        label.position.set(p.x, TOP + 0.24, p.z + R * 0.82)
        scene.add(label)
        labelEntries.push({ tag, name, islandId: data.id })
    }
    scene.add(lampPosts, lampBulbs, lampPools)
    const kit = createModelKit(random)
    for (const { data, center: p } of islands) {
        const mainPosition = new THREE.Vector3(p.x + DATA.world.mainModelPosition.x, TOP + .025, p.z + DATA.world.mainModelPosition.z)
        kit.place(data.model, mainPosition, DATA.world.mainModelSize, { islandId: data.id, itemId: null })
        const slots = itemLayout(data.items.length)
        data.items.forEach((item, index) => {
            const slot = slots[index]
            kit.place(item.model, new THREE.Vector3(p.x + slot.x, TOP + .025, p.z + slot.z), slot.size, { islandId: data.id, itemId: item.id })
        })
    }
    const buildings = kit.build(scene)
    const environment = createEnvironment({ scene, islands, center, world: DATA.world, config: DATA.environment, random, mobile: isMobileLayout() })
    const adjacency = [[1, 0], [0, 1], [1, -1]]
    let bridgeCount = 0
    for (const a of islands) {
        for (const [dq, dr] of adjacency) {
            const b = islands.find(i => i.data.axial.q === a.data.axial.q + dq && i.data.axial.r === a.data.axial.r + dr)
            if (!b) continue
            const direction = b.center.clone().sub(a.center).normalize()
            const start = a.center.clone().addScaledVector(direction, 1.64 * Math.cos(Math.PI / 6))
            const end = b.center.clone().addScaledVector(direction, -1.64 * Math.cos(Math.PI / 6))
            const length = start.distanceTo(end)
            for (let n = 0; n < 9; n++) {
                const t = (n + 0.5) / 9
                const plank = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, length / 9 + 0.012), deckMaterial)
                plank.position.lerpVectors(start, end, t)
                plank.position.y = TOP + 0.055 + Math.sin(t * Math.PI) * 0.085
                plank.rotation.y = Math.atan2(direction.x, direction.z)
                plank.castShadow = plank.receiveShadow = true
                scene.add(plank)
            }
            bridgeCount++
        }
    }
    batchStaticWorld(scene)
    document.querySelector('#scene-stats').textContent = tr(`${islands.length} 座主題島 · ${buildings.records.length} 組模型 · ${bridgeCount} 座橋`)
    let dirty = true, labelsDirty = true, lastLabelsAt = -Infinity
    let journal = null
    const collaboration = createCollaboration({ scene, islands, data: DATA, random, onChange: () => { dirty = true; labelsDirty = true } })
    const characters = createCharacters({ scene, islands, data: DATA, onSelect: id => explorer.selectCharacter(id) })
    const explorer = createExplorer({ data: DATA, characters, random, onChange: () => { dirty = true; labelsDirty = true }, onSelect: selection => { journal?.close(); interaction?.select(selection) }, onClose: () => interaction?.clear() })
    interaction = createSelection({ scene, camera, controls, canvas, islands, grounds, buildings, labelEntries, explorer, collaboration, characters, reducedMotion, onChange: () => { dirty = true; labelsDirty = true } })
    collaboration.setNameHandler(id => { const walker = collaboration.getWalker(id); explorer.selectFlow(walker.flowId, id) })
    for (const [id, method] of [['show-walkers','setWalkers'], ['show-cargo','setCargo'], ['show-names','setNames'], ['show-flows','setLines']]) {
        const button = document.querySelector(`#${id}`)
        button.addEventListener('click', () => { const active = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', String(active)); collaboration[method](active) })
    }
    let minute = DATA.time.startMinute
    let day = 1
    let paused = false
    let displayedMinute = -1
    journal = createJournal({ data: DATA, explorer, onChange: () => { dirty = true; labelsDirty = true }, onPhase: ids => { interaction.setDayItems(ids); explorer.setDayItems(ids) } })
    function jumpTime(nextMinute) { journal.manualJump(minute, nextMinute, day); minute = nextMinute; applyTime(); dirty = true }
    const timePanel = document.querySelector('.time-panel')
    const mobileLayout = window.matchMedia(MOBILE_QUERY)
    const fitTimePanel = () => { timePanel.open = !mobileLayout.matches }
    fitTimePanel()
    mobileLayout.addEventListener('change', fitTimePanel)
    timePanel.addEventListener('toggle', () => { if (timePanel.open && mobileLayout.matches) { journal.close(); explorer.closeIndex(); explorer.closeCard() } dirty = true })
    const timeDisplay = document.querySelector('#island-time')
    const slider = document.querySelector('#time-slider')
    const pauseButton = document.querySelector('#pause-time')
    const timeState = document.querySelector('#time-state')
    const keyframes = DATA.time.keyframes.map(row => ({
        minute: row[0], top: new THREE.Color(`#${row[1]}`), horizon: new THREE.Color(`#${row[2]}`),
        sun: new THREE.Color(`#${row[3]}`), sunI: row[4], hemiSky: new THREE.Color(`#${row[5]}`),
        hemiGround: new THREE.Color(`#${row[6]}`), hemiI: row[7], night: row[8], water: new THREE.Color(`#${row[9]}`)
    }))
    const presetButtons = DATA.time.presets.map(preset => {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = `${preset.icon} ${preset.label}`
        button.addEventListener('click', () => jumpTime(preset.minute))
        document.querySelector('#time-presets').appendChild(button)
        return { button, minute: preset.minute }
    })
    const sunDirection = new THREE.Vector3()
    const daytimeWater = new THREE.Color('#55a7b2')
    let shadowMinute = -1
    function applyTime() {
        minute = ((minute % 1440) + 1440) % 1440
        journal.setPhase(minute)
        const index = keyframes.findIndex(frame => frame.minute > minute)
        const a = keyframes[index - 1], b = keyframes[index]
        const t = (minute - a.minute) / (b.minute - a.minute)
        const lerp = (x, y) => THREE.MathUtils.lerp(x, y, t)
        sky.material.uniforms.uTop.value.copy(a.top).lerp(b.top, t)
        horizon.copy(a.horizon).lerp(b.horizon, t)
        scene.fog.color.copy(horizon)
        sun.color.copy(a.sun).lerp(b.sun, t)
        sun.intensity = lerp(a.sunI, b.sunI) * .88
        hemi.color.copy(a.hemiSky).lerp(b.hemiSky, t)
        hemi.groundColor.copy(a.hemiGround).lerp(b.hemiGround, t)
        // Keep readable nights, with more directional contrast in daylight.
        hemi.intensity = lerp(a.hemiI, b.hemiI) * (.68 + .32 * lerp(a.night, b.night))
        const night = lerp(a.night, b.night)
        sky.material.uniforms.uNight.value = night
        sky.material.uniforms.uSun.value.copy(sun.color)
        waterMaterial.uniforms.uShallow.value.copy(a.water).lerp(b.water, t).lerp(daytimeWater, .8 * (1 - night))
        waterMaterial.uniforms.uDeep.value.copy(waterMaterial.uniforms.uShallow.value).multiplyScalar(.72)
        lampMaterial.emissiveIntensity = night * 3.2
        buildings.setNight(night)
        environment.setNight(night, horizon)
        poolMaterial.opacity = night * .24
        const quantized = Math.floor(minute / 10) * 10
        if (quantized !== shadowMinute) { renderer.shadowMap.needsUpdate = true; shadowMinute = quantized }
        const day = THREE.MathUtils.clamp((quantized - 360) / 720, 0, 1)
        const azimuth = Math.PI * (.15 + .7 * day)
        const elevation = .35 + Math.sin(day * Math.PI) * .75
        sunDirection.set(Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), .55 * Math.cos(elevation) + .35).normalize()
        sun.position.copy(center).addScaledVector(sunDirection, 40)
        sky.material.uniforms.uSunDir.value.copy(sunDirection)
        const whole = Math.floor(minute)
        if (whole !== displayedMinute) {
            const formatted = `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
            timeDisplay.textContent = formatted
            document.querySelector('#compact-time').textContent = formatted
            timeDisplay.dateTime = formatted
            slider.value = whole
            slider.setAttribute('aria-valuetext', formatted)
            presetButtons.forEach(p => p.button.setAttribute('aria-pressed', String(p.minute === whole)))
            displayedMinute = whole
        }
    }
    function updatePlayback() {
        const stopped = paused || reducedMotion.matches || guideOpen
        controls.enableDamping = !reducedMotion.matches
        pauseButton.disabled = reducedMotion.matches
        pauseButton.setAttribute('aria-pressed', String(stopped))
        pauseButton.textContent = tr(stopped ? '▶ 播放' : 'Ⅱ 暫停')
        timeState.textContent = tr(reducedMotion.matches ? '減少動態' : paused || guideOpen ? '已暫停' : '自動播放')
        document.querySelector('#motion-note').hidden = !reducedMotion.matches
        journal.setPlayback(!stopped, reducedMotion.matches)
        dirty = true
    }
    let scrubStart = null
    slider.addEventListener('input', () => { if (scrubStart === null) scrubStart = minute; minute = Number(slider.value); applyTime(); dirty = true })
    slider.addEventListener('change', () => { if (scrubStart !== null) { journal.manualJump(scrubStart, minute, day); scrubStart = null } })
    pauseButton.addEventListener('click', () => { paused = !paused; updatePlayback() })
    applyTime()
    updatePlayback()
    controls.addEventListener('change', () => { dirty = true; labelsDirty = true })
    document.querySelector('#overview').addEventListener('click', overview)
    const resize = () => {
        const w = window.innerWidth, h = window.innerHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileLayout() ? 1.4 : 1.75))
        labels.setSize(w, h)
        labelsDirty = true
        dirty = true
    }
    new ResizeObserver(resize).observe(document.querySelector('#world'))
    resize()
    overview()
    reducedMotion.addEventListener('change', updatePlayback)
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); showError(new Error('WebGL 繪圖連線中斷，請重新整理。')) })
    document.addEventListener('visibilitychange', () => { dirty = true })
    let previous = performance.now(), elapsed = 0
    const accessibility = createAccessibility({ onChange: () => { dirty = true; labelsDirty = true }, onGuide: open => { guideOpen = open; if (open) interaction.stop(); updatePlayback() } })
    function tick(now) {
        try {
            const dt = Math.min((now - previous) / 1000, 0.08)
            previous = now
            controls.update()
            if (interaction.update(now)) dirty = true
            if (!document.hidden && !reducedMotion.matches && !paused && !guideOpen) {
                elapsed += dt
                waterMaterial.uniforms.uTime.value = elapsed
                minute += dt * DATA.time.minutesPerSecond
                if (minute >= 1440) day += Math.floor(minute / 1440)
                applyTime()
                dirty = true
            }
            if (dirty && !document.hidden) {
                diagnostics.begin()
                environment.update(elapsed, camera.position.distanceTo(controls.target))
                collaboration.update(elapsed, camera.position.distanceTo(controls.target), reducedMotion.matches)
                characters.update(elapsed, camera.position.distanceTo(controls.target), document.querySelector('#show-walkers').getAttribute('aria-pressed') === 'true')
                explorer.updateCharacterLocation()
                journal.sync(collaboration.events, minute, day)
                renderer.render(scene, camera)
                const movingNames = characters.records.some(p => p.button && !p.button.hidden) || (document.querySelector('#show-names').getAttribute('aria-pressed') === 'true' && camera.position.distanceTo(controls.target) < 14)
                if (labelsDirty || (movingNames && now - lastLabelsAt >= 100)) {
                labels.render(scene, camera)
                // Compact overlapping labels on small screens; full names remain accessible.
                const rectangles = []
                const obstacles = [...explorer.getObstacles(), journal.getObstacle()].filter(Boolean)
                interaction.layoutPins(obstacles)
                characters.layoutNames(obstacles)
                collaboration.layoutNames(obstacles)
                for (const entry of labelEntries) {
                    const { tag, name } = entry
                    tag.style.visibility = 'visible'
                    name.hidden = false
                    let rect = tag.getBoundingClientRect()
                    const margin = entry.compact || entry.obscured ? 12 : 4
                    const overlaps = other => rect.left < other.right + margin && rect.right > other.left - margin && rect.top < other.bottom + margin && rect.bottom > other.top - margin
                    const outside = () => rect.left < 8 || rect.right > window.innerWidth-8 || rect.top < 8 || rect.bottom > window.innerHeight-8
                    if (outside() || obstacles.some(overlaps) || rectangles.some(overlaps)) { name.hidden = true; rect = tag.getBoundingClientRect() }
                    entry.compact = name.hidden
                    entry.obscured = outside() || obstacles.some(overlaps) || rectangles.some(overlaps)
                    if (entry.obscured) tag.style.visibility = 'hidden'
                    else rectangles.push(rect)
                }
                labelsDirty = false
                lastLabelsAt = now
                }
                dirty = false
                loading.hidden = true
                accessibility.ready()
                diagnostics.end()
            }
            diagnostics.frame(now)
            requestAnimationFrame(tick)
        } catch (error) { showError(error) }
    }
    requestAnimationFrame(tick)
} catch (error) {
    showError(error)
}
