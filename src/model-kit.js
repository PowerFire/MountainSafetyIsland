import * as THREE from 'three'
import { clayColor } from './colors.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// Model functions emit parts only. Each geometry kind becomes one InstancedMesh.
const C = { cream: '#f4ebdd', coral: '#e9682f', roof: '#a34828', wood: '#ac784b', glass: '#679f9b', teal: '#237f8c', green: '#77ad4a', ink: '#30271f', stone: '#b8a48e', yellow: '#f4cb51' }
export function createModelKit(random) {
    const geometries = {
        box: new THREE.BoxGeometry(1, 1, 1),
        rbox: new RoundedBoxGeometry(1, 1, 1, 2, .12),
        cylinder: new THREE.CylinderGeometry(.5, .5, 1, 14),
        cone: new THREE.ConeGeometry(.5, 1, 14),
        sphere: new THREE.SphereGeometry(.5, 12, 8),
        ico: new THREE.IcosahedronGeometry(.5, 1),
        dome: new THREE.SphereGeometry(.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        torus: new THREE.TorusGeometry(.4, .1, 8, 20),
        prism: new THREE.CylinderGeometry(.5, .5, 1, 3),
        hip: new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4),
        glowbox: new THREE.BoxGeometry(1, 1, 1),
        glowsphere: new THREE.SphereGeometry(.5, 10, 6)
    }
    const parts = new Map()
    const records = []
    let placement
    const transform = new THREE.Object3D()
    const local = new THREE.Object3D()
    function add(kind, position, scale, color = C.cream, rotation = [0, 0, 0]) {
        const jitter = 1 + (random() * 2 - 1) * .0072
        local.position.set(...position)
        local.rotation.set(...rotation)
        local.scale.set(...scale.map(v => v * jitter))
        local.updateMatrix()
        const matrix = new THREE.Matrix4().multiplyMatrices(transform.matrix, local.matrix)
        if (!parts.has(kind)) parts.set(kind, [])
        parts.get(kind).push({ matrix, color, owner: placement })
    }
    function windowAt(x, y, z, w = .16, h = .18) { add('glowbox', [x, y, z], [w, h, .025], '#b7d2cb') }
    function house(accent = C.coral, tower = false) {
        add('rbox', [0, .28, 0], [.82, .56, .68])
        add('box', [0, .58, 0], [.93, .055, .78], C.roof)
        add('hip', [0, .76, 0], [.98, .34, .83], accent)
        add('rbox', [0, .19, .35], [.16, .36, .035], C.wood)
        windowAt(-.25, .31, .35); windowAt(.25, .31, .35)
        if (tower) {
            add('rbox', [.25, .75, -.12], [.23, .85, .23])
            add('hip', [.25, 1.23, -.12], [.32, .24, .32], accent)
            windowAt(.25, .99, .008, .11, .13)
        }
    }
    function tree(x, z, scale = 1) {
        add('cylinder', [x, .19 * scale, z], [.07 * scale, .38 * scale, .07 * scale], C.wood)
        add('ico', [x, .49 * scale, z], [.42 * scale, .55 * scale, .42 * scale], C.green)
    }
    function cross(x, y, z) {
        add('box', [x, y, z], [.10, .32, .035], C.coral)
        add('box', [x, y, z + .001], [.29, .10, .036], C.coral)
    }
    const models = {
        'map-table': () => {
            for (const x of [-.32, .32]) for (const z of [-.22, .22]) add('cylinder', [x, .2, z], [.07, .4, .07], C.wood)
            add('rbox', [0, .43, 0], [.95, .09, .7], C.wood)
            add('box', [0, .485, 0], [.82, .02, .58], '#c9d6ad')
            for (let n = 0; n < 4; n++) add('box', [-.27 + n * .17, .502, Math.sin(n) * .14], [.22, .012, .035], C.teal, [0, -.5 + n * .3, 0])
            add('cylinder', [.27, .59, -.15], [.025, .2, .025], C.ink)
            add('sphere', [.27, .71, -.15], [.11, .11, .11], C.coral)
            add('rbox', [0, .12, .43], [.65, .18, .14], C.wood)
        },
        'weather-station': () => {
            add('rbox', [0, .21, 0], [.65, .42, .55]); add('hip', [0, .49, 0], [.78, .2, .68], C.teal)
            windowAt(0, .27, .29, .32, .18)
            add('cylinder', [.22, .69, -.12], [.055, .95, .055], C.stone)
            add('box', [.22, 1.15, -.12], [.48, .035, .035], C.ink)
            for (const x of [-.02, .46]) add('sphere', [x, 1.16, -.12], [.10, .08, .1], C.yellow)
            for (let n = 0; n < 3; n++) add('sphere', [-.23 + n * .15, .91 + (n === 1 ? .06 : 0), .05], [.25, .2, .22], '#eaf2f6')
        },
        'gear-house': () => {
            house(C.wood)
            add('rbox', [-.38, .21, .4], [.21, .34, .19], C.teal)
            add('torus', [-.38, .39, .4], [.18, .16, .18], C.wood)
            add('box', [.38, .27, .4], [.035, .5, .035], C.ink)
        },
        'trail-stairs': () => {
            for (let n = 0; n < 5; n++) add('rbox', [0, .06 + n * .065, .36 - n * .18], [.65, .12 + n * .13, .19], C.stone)
            add('cylinder', [.36, .63, -.34], [.04, .65, .04], C.wood)
            add('rbox', [.36, .85, -.34], [.3, .14, .06], C.green)
            tree(-.35, -.3, .65)
        },
        'compass-station': () => {
            add('cylinder', [0, .12, 0], [.85, .24, .85], C.stone)
            add('cylinder', [0, .27, 0], [.72, .08, .72], C.cream)
            add('cone', [0, .35, -.16], [.13, .38, .12], C.coral, [Math.PI / 2, 0, 0])
            add('cone', [0, .35, .16], [.13, .38, .12], C.teal, [-Math.PI / 2, 0, 0])
            add('torus', [0, .33, 0], [.85, .85, .85], C.wood, [Math.PI / 2, 0, 0])
            add('sphere', [0, .39, 0], [.10, .1, .1], C.yellow)
        },
        'supply-depot': () => {
            add('rbox', [0, .19, 0], [.8, .38, .54], C.wood)
            for (const x of [-.36, .36]) add('cylinder', [x, .5, -.19], [.04, 1, .04], C.wood)
            add('hip', [0, .85, 0], [1, .25, .75], C.yellow)
            for (const x of [-.23, 0, .23]) { add('rbox', [x, .46, .04], [.17, .15, .2], C.coral); add('sphere', [x, .58, .04], [.13, .12, .13], C.green) }
            add('cylinder', [.37, .24, .35], [.2, .45, .2], C.teal)
        },
        'ridge-bridge': () => {
            add('rbox', [0, .055, 0], [.95, .1, .72], C.teal)
            for (const x of [-.34, .34]) add('ico', [x, .22, -.1], [.4, .48, .43], C.stone)
            for (let n = 0; n < 7; n++) add('box', [-.35 + n * .117, .23 + Math.sin(n / 6 * Math.PI) * .13, .1], [.12, .05, .34], C.wood)
            for (const z of [-.09, .29]) add('box', [0, .49, z], [.94, .035, .035], C.wood)
        },
        'mountain-hut': () => { house(C.coral); add('box', [-.26, .83, -.12], [.14, .42, .14], C.stone); add('rbox', [0, .06, .43], [.85, .12, .14], C.wood) },
        'first-aid-shelter': () => { house('#58a6a6'); cross(0, .77, .32); add('rbox', [.34, .08, .43], [.32, .13, .17], C.cream) },
        'radio-tower': () => {
            add('rbox', [-.22, .16, .15], [.4, .32, .35], C.teal); windowAt(-.22, .2, .34, .2, .12)
            for (const x of [-.2, .2]) add('box', [x, .63, -.1], [.055, 1.2, .055], C.stone, [0, 0, x * .25])
            for (let n = 0; n < 4; n++) add('box', [0, .25 + n * .24, -.1], [.42, .035, .04], C.wood)
            add('cylinder', [0, 1.28, -.1], [.025, .3, .025], C.ink)
            add('glowsphere', [0, 1.45, -.1], [.1, .1, .1], C.coral)
            add('dome', [.1, 1.06, -.08], [.44, .24, .44], C.cream, [0, 0, -.8])
        },
        'rescue-base': () => {
            house(C.coral, true); cross(-.17, .32, .355)
            add('rbox', [-.32, .13, .43], [.4, .22, .23], C.yellow)
            for (const x of [-.46, -.18]) add('cylinder', [x, .06, .45], [.11, .27, .11], C.ink, [Math.PI / 2, 0, 0])
        },
        'forest-campsite': () => {
            add('prism', [0, .29, .12], [.68, .78, .65], C.yellow, [Math.PI / 2, 0, 0])
            add('prism', [0, .27, .52], [.45, .02, .47], C.teal, [Math.PI / 2, 0, 0])
            tree(-.34, -.23, 1); tree(.33, -.27, .8)
            add('rbox', [.32, .07, .32], [.2, .14, .18], C.wood)
        }
    }
    function place(model, position, size, owner) {
        if (!models[model]) throw new Error(`未定義模型：${model}`)
        placement = owner
        transform.position.copy(position)
        transform.scale.setScalar(size)
        transform.rotation.set(0, 0, 0)
        transform.updateMatrix()
        const record = { ...owner, model, position: position.clone(), size }
        records.push(record)
        models[model]()
    }
    const glowMaterial = new THREE.MeshStandardMaterial({ roughness: .78, emissive: clayColor('#ffc777'), emissiveIntensity: 0 })
    const solidMaterial = new THREE.MeshStandardMaterial({ roughness: .78, metalness: 0 })
    function build(scene) {
        const meshes = []
        for (const [kind, instances] of parts) {
            const glow = kind.startsWith('glow')
            const mesh = new THREE.InstancedMesh(geometries[kind], glow ? glowMaterial : solidMaterial, instances.length)
            mesh.name = `model-kit:${kind}`
            mesh.userData.owners = instances.map(part => part.owner)
            mesh.userData.baseColors = instances.map(part => part.color)
            instances.forEach((part, index) => { mesh.setMatrixAt(index, part.matrix); mesh.setColorAt(index, clayColor(part.color)) })
            mesh.castShadow = !glow
            mesh.receiveShadow = true
            // r126 does not compute instance bounds reliably for all placements.
            mesh.frustumCulled = false
            scene.add(mesh)
            meshes.push(mesh)
        }
        return { meshes, records, modelTypes: Object.keys(models), setNight: night => { glowMaterial.emissiveIntensity = night * 3.2 } }
    }
    return { place, build }
}

export function itemLayout(count) {
    if (count < 1 || count > 7) throw new Error('細項配置支援 1–7 項')
    const rows = count <= 4 ? [Math.min(count, 2), Math.max(0, count - 2)] : [3, count - 3]
    const size = count <= 4 ? .54 : .46
    return rows.flatMap((columns, row) => Array.from({ length: columns }, (_, column) => ({
        x: (column - (columns - 1) / 2) * (columns > 3 ? .46 : .57),
        z: .28 + row * .58,
        size
    })))
}
