import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { clayColor } from './colors.js'
import { tr } from './i18n.js'
import { createWalkingNetwork, sampleRoute } from './collaboration.js'

function seededRandom(seed) {
    return () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 }
}

// Photo-inspired clay caricatures. No source photos, logos or face textures are shipped.
export function createCharacters({ scene, islands, data, onSelect }) {
    const network = createWalkingNetwork(islands, data.world.top)
    const records = (data.characters || []).map((person, index) => {
        const island = islands.find(i => i.data.id === person.islandId)
        if (!island) throw new Error('Unknown character island')
        const random = seededRandom(data.seed ^ ((index + 1) * 0x45d9f3b))
        const currentNode = `${person.islandId}:${Math.floor(random() * 12)}`
        return { ...person, random, currentNode, position: network.nodes.get(currentNode).clone(), speed: .28 + random() * .08, phase: random() * Math.PI * 2, startTime: 0, yaw: 0, matrix: new THREE.Matrix4(), trips: 0 }
    })
    function nextTrip(person, startTime) {
        const from = person.currentNode.split(':')[0]
        const choices = islands.filter(i => i.data.id !== from)
        const to = choices[Math.floor(person.random() * choices.length)].data.id
        person.goalNode = `${to}:${Math.floor(person.random() * 12)}`
        person.route = network.route(from, to, person.currentNode, person.goalNode)
        person.startTime = startTime
        person.arrivalTime = startTime + person.route.length / person.speed
        person.departureTime = person.arrivalTime + 1.5 + person.random() * 2
        person.trips++
    }
    records.forEach(p => nextTrip(p, 0))
    const geometry = {
        box: new THREE.BoxGeometry(1, 1, 1),
        sphere: new THREE.SphereGeometry(.5, 12, 8),
        cylinder: new THREE.CylinderGeometry(.5, .5, 1, 10),
        ring: new THREE.TorusGeometry(.5, .045, 5, 18)
    }
    const pieces = [], meshes = [], dummy = new THREE.Object3D(), root = new THREE.Object3D(), localPoint = new THREE.Vector3(), combined = new THREE.Matrix4()
    const red = '#cf251b', dark = '#2c2925', hair = '#242320'
    function add(person, kind, position, scale, color, rotation = [0, 0, 0], motion = null) {
        pieces.push({ person, kind, position, scale, color, rotation, motion })
    }
    records.forEach(person => {
        const part = (kind, p, s, c, r, motion) => add(person, kind, p, s, c, r, motion)
        if (person.model === 'robot-cat') {
            const blue = '#079ed3', white = '#fff8ef'
            part('sphere', [0,.29,0], [.31,.32,.24], blue)
            part('sphere', [0,.28,.108], [.23,.25,.045], white)
            part('sphere', [0,.58,0], [.38,.34,.31], blue)
            part('sphere', [0,.565,.115], [.32,.27,.085], white)
            for (const side of [-1,1]) {
                part('sphere', [side*.063,.665,.155], [.11,.13,.042], white)
                part('sphere', [side*.04,.655,.18], [.025,.04,.018], '#242320')
                part('sphere', [side*.085,.055,.025], [.15,.08,.20], white, [0,0,0], { side,pivot:.17,kind:'leg' })
                part('cylinder', [side*.19,.29,0], [.085,.19,.085], blue, [0,0,side*.12], { side,pivot:.39,kind:'arm' })
                part('sphere', [side*.205,.20,.015], [.10,.10,.10], white, [0,0,0], { side,pivot:.39,kind:'arm' })
                for (let n=0;n<3;n++) part('box', [side*.105,.56-n*.026,.162], [.105,.007,.008], '#34302d', [0,0,side*(n-1)*.15])
            }
            part('sphere', [0,.60,.18], [.065,.057,.055], '#d52d24')
            part('box', [0,.563,.17], [.008,.055,.008], '#34302d')
            part('sphere', [0,.51,.151], [.13,.035,.015], '#ad342c')
            part('cylinder', [0,.405,0], [.28,.032,.22], '#d52d24')
            part('sphere', [0,.382,.13], [.07,.07,.055], '#f3c642')
            part('box', [0,.376,.16], [.04,.006,.006], '#725c2b')
            part('sphere', [0,.255,.138], [.16,.12,.025], white)
            part('box', [0,.30,.155], [.15,.009,.009], '#b5b0a5')
            part('sphere', [0,.21,-.15], [.075,.075,.075], '#d52d24')
            return
        }
        part('sphere', [0, .35, 0], [.25 * person.build, .30, .17], red)
        part('box', [0, .23, 0], [.20 * person.build, .10, .14], dark)
        for (const side of [-1, 1]) {
            const leg = { side, pivot: .23, kind: 'leg' }, arm = { side, pivot: .43, kind: 'arm' }
            part('cylinder', [side * .06, .13, 0], [.065, .20, .065], dark, [0, 0, 0], leg)
            part('sphere', [side * .06, .035, .025], [.085, .055, .13], '#342e29', [0, 0, 0], leg)
            part('sphere', [side * .15, .39, 0], [.085, .13, .10], red, [0, 0, 0], arm)
            part('cylinder', [side * .17, .30, .025], [.055, .17, .055], ['ren','terry'].includes(person.id) ? red : person.skin, [0, 0, side * .12], arm)
            part('sphere', [side * .18, .22, .035], [.065, .065, .065], person.skin, [0, 0, 0], arm)
            part('box', [side * .045, .47, .06], [.07, .055, .025], '#a91b17', [0, 0, side * -.35])
            part('sphere', [side * .045, .617, .108], [.019, .018, .012], '#28211d')
            part('sphere', [side * .12, .62, 0], [.045, .065, .035], person.skin)
        }
        part('cylinder', [0, .49, 0], [.075, .08, .075], person.skin)
        part('sphere', [0, .62, 0], [.25, .27, .22], person.skin)
        // Face parts are placed in front of the head, facing the default camera.
        part('sphere', [0, .605, .113], [.04, .045, .035], person.skin)
        part('box', [0, .563, .10], [.075, .014, .014], '#8f4835')
        part('box', [0, .569, .109], [.05, .009, .009], '#fff0d9')
        part('box', [0, .425, .085], [.008, .045, .01], '#8e1714')
        for (const y of [.437, .416]) part('sphere', [0, y, .096], [.012, .012, .012], '#ead8b8')
        const hairColor = person.hair === 'balding' ? '#87867c' : person.hair === 'cropped-grey' ? '#545650' : hair
        if (person.hair === 'balding') {
            for (const side of [-1, 1]) part('sphere', [side * .102, .67, -.025], [.045, .10, .15], hairColor)
        } else {
            const height = person.hair === 'close-cropped' ? .045 : person.hair === 'short' ? .09 : .065
            part('sphere', [0, .735, -.012], [.245, height, .215], hairColor)
            if (person.hair !== 'close-cropped') for (let n = 0; n < 5; n++) part('sphere', [-.085 + n * .043, person.hair === 'fringe' ? .711 : .736, .07], [.05, person.hair === 'fringe' ? .065 : .04, .06], hairColor)
        }
        if (person.glasses) {
            for (const side of [-1, 1]) {
                part('ring', [side * .052, .625, .119], [.09, .078, .06], person.id === 'terry' ? '#a9a18a' : '#5b4940')
                part('box', [side * .102, .63, .07], [.012, .012, .10], '#8b806d')
            }
            part('box', [0, .632, .121], [.02, .01, .01], '#a79b82')
        }
        if (person.satchel) {
            part('box', [.005, .36, .092], [.027, .27, .018], '#39362e', [0, 0, -.6])
            part('box', [.13, .23, -.005], [.11, .13, .08], '#454237')
        }
        if (person.id === 'stone' || person.id === 'terry') part('sphere', [-.18, .245, .05], [.07, .028, .07], '#343b36', [0, 0, 0], { side: -1, pivot: .43, kind: 'arm' })
        const button = document.createElement('button')
        button.type = 'button'; button.className = 'island-label character-name'; button.textContent = person.name.zh
        button.setAttribute('aria-label', tr(`認識 ${person.name.zh}`, `Meet ${person.name.en}`))
        button.addEventListener('click', () => onSelect(person.id))
        const label = new CSS2DObject(button); label.position.copy(person.position); label.position.y += .91
        scene.add(label); person.label = label; person.button = button
    })
    const material = new THREE.MeshStandardMaterial({ roughness: .84 })
    for (const [kind, shape] of Object.entries(geometry)) {
        const entries = pieces.filter(p => p.kind === kind)
        const mesh = new THREE.InstancedMesh(shape, material, entries.length)
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false
        mesh.userData.characters = entries.map(p => p.person.id)
        entries.forEach((p, i) => mesh.setColorAt(i, clayColor(p.color)))
        mesh.receiveShadow = true; scene.add(mesh); meshes.push({ mesh, entries })
    }
    let selected = null, previousTime = NaN, previousSize = NaN
    function update(time, distance, visible) {
        const size = .48 * THREE.MathUtils.clamp(distance / 20, 1, 1.45)
        const changed = time !== previousTime || size !== previousSize
        if (changed) records.forEach(person => {
            // Advance through completed legs without teleporting between ring nodes.
            while (time >= person.departureTime) {
                const start = person.departureTime
                person.currentNode = person.goalNode
                nextTrip(person, start)
            }
            const elapsed = Math.max(0, time - person.startTime)
            const sample = sampleRoute(person.route, Math.min(person.route.length, elapsed * person.speed))
            person.position.copy(sample.position)
            person.waiting = time >= person.arrivalTime
            person.swing = person.waiting ? 0 : Math.sin(time * 8 + person.phase)
            person.yaw = Math.atan2(sample.direction.x, sample.direction.z)
            person.islandId = islands.reduce((best, island) => person.position.distanceToSquared(island.center) < person.position.distanceToSquared(best.center) ? island : best).data.id
            root.position.copy(person.position); root.position.y += person.waiting ? 0 : Math.abs(person.swing) * .012 * size
            root.rotation.set(0, person.yaw, 0); root.scale.setScalar(size); root.updateMatrix(); person.matrix.copy(root.matrix)
            person.scale = size
            if (person.label) { person.label.position.copy(person.position); person.label.position.y += .91 * size }
        })
        for (const { mesh, entries } of meshes) {
            mesh.visible = visible
            if (changed) {
                entries.forEach((p, i) => {
                    localPoint.set(...p.position)
                    dummy.rotation.set(...p.rotation)
                    if (p.motion) {
                        const angle = p.person.swing * p.motion.side * (p.motion.kind === 'leg' ? .45 : -.35)
                        const y = localPoint.y - p.motion.pivot, z = localPoint.z
                        localPoint.y = p.motion.pivot + y * Math.cos(angle) - z * Math.sin(angle)
                        localPoint.z = y * Math.sin(angle) + z * Math.cos(angle)
                        dummy.rotation.x += angle
                    }
                    dummy.position.copy(localPoint)
                    dummy.scale.set(...p.scale); dummy.updateMatrix(); combined.multiplyMatrices(p.person.matrix, dummy.matrix); mesh.setMatrixAt(i, combined)
                })
                mesh.instanceMatrix.needsUpdate = true
            }
        }
        previousTime = time
        previousSize = size
        records.forEach(p => { if (p.button) p.button.hidden = !visible || (distance > 23 && selected !== p.id) })
    }
    function setSelection(id) {
        selected = id
        meshes.forEach(({ mesh, entries }) => {
            entries.forEach((p, i) => { const color = clayColor(p.color); if (p.person.id === id && p.color === red) color.lerp(clayColor('#ef5034'), .22); mesh.setColorAt(i, color) })
            mesh.instanceColor.needsUpdate = true
        })
        records.forEach(p => { if (p.button) { p.button.classList.toggle('selected', p.id === id); p.button.setAttribute('aria-pressed', String(p.id === id)) } })
    }
    update(0, 40, true)
    return {
        records, update, setSelection, get: id => records.find(p => p.id === id),
        pickables: () => meshes.filter(p => p.mesh.visible).map(p => p.mesh),
        resolveHit: hit => hit.object.userData.characters?.[hit.instanceId],
        layoutNames(obstacles) {
            const occupied = [...obstacles]
            records.forEach(p => {
                if (!p.button) return
                p.button.style.visibility = 'visible'; if (p.button.hidden) return
                const r = p.button.getBoundingClientRect()
                if (occupied.some(o => r.left < o.right + 4 && r.right > o.left - 4 && r.top < o.bottom + 4 && r.bottom > o.top - 4)) p.button.style.visibility = 'hidden'
                else occupied.push(r)
            })
        }
    }
}
