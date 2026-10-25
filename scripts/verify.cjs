const fs = require('fs')
const path = require('path')
const assert = require('assert/strict')
const babel = require('@babel/core')
const THREE = require('three')
const root = path.resolve(__dirname, '..')
const cache = new Map()
// Load the project's ES modules for data/geometry checks without creating a WebGL context.
function load(file) {
    file = path.resolve(root, file)
    if (cache.has(file)) return cache.get(file)
    const module = { exports: {} }
    const code = babel.transformSync(fs.readFileSync(file, 'utf8'), { presets: [['@babel/preset-env', { targets: { node: 'current' } }]], babelrc: false, configFile: false }).code
    const requireSource = name => name === 'three' || name.endsWith('/build/three.module.js') ? THREE : name.startsWith('three/examples/') ? load(require.resolve(name)) : name.startsWith('.') ? load(path.resolve(path.dirname(file), name)) : require(name)
    new Function('require', 'module', 'exports', code)(requireSource, module, module.exports)
    cache.set(file, module.exports)
    return module.exports
}
class ElementStub {
    constructor() { this.style = {}; this.handlers = {}; this.hidden = true; this.parentNode = null; this.classList = { toggle() {} } }
    addEventListener(type, listener) { this.handlers[type] = listener }
    setAttribute() {}
    remove() {}
    getContext() { return new Proxy({}, { get: (object, key) => object[key] || (() => {}), set: (object, key, value) => (object[key] = value, true) }) }
}
global.window = { location: { search: '' } }
global.Element = ElementStub
global.document = { createElement: () => new ElementStub(), querySelector: () => new ElementStub() }
const { DATA } = load('src/data.js')
const items = DATA.islands.flatMap(island => island.items)
assert.equal(DATA.islands.length, 12)
assert.equal(items.length, 50)
assert.equal(new Set(items.map(item => item.id)).size, 50)
for (const item of items) {
    assert.ok(item.name.zh && item.name.en && item.description.zh && item.description.en)
    assert.ok(item.facts.length >= 2 && item.facts.every(fact => fact.zh && fact.en))
    assert.ok(item.sourceIds.length && item.sourceIds.every(id => DATA.sources[id]?.url.startsWith('https://')))
    assert.ok(DATA.stages[item.stage])
}
let end = 0
const covered = new Set()
for (const phase of DATA.dayCycle) {
    assert.equal(phase.start, end)
    assert.ok(phase.end > phase.start)
    phase.items.forEach(id => { assert.ok(items.some(item => item.id === id)); covered.add(id) })
    end = phase.end
}
assert.equal(end, 1440)
assert.equal(covered.size, 50)
assert.ok(DATA.flows.every(flow => DATA.islands.some(i => i.id === flow.from) && DATA.islands.some(i => i.id === flow.to)))
assert.ok(DATA.flows.every(flow => flow.evidence !== 'official'), 'Demo links must not imply real official cooperation')
const { createWalkingNetwork, sampleRoute, walkerPhase, createCollaboration } = load('src/collaboration.js')
const islands = DATA.islands.map(data => ({ data, center: new THREE.Vector3(Math.sqrt(3) * DATA.world.spacing * (data.axial.q + data.axial.r / 2), 0, 1.5 * DATA.world.spacing * data.axial.r) }))
const network = createWalkingNetwork(islands, DATA.world.top)
assert.equal(network.nodes.size, 144)
assert.equal(network.bridges, 23)
for (const flow of DATA.flows) {
    const route = network.route(flow.from, flow.to)
    assert.ok(route.length > 0)
    assert.ok(sampleRoute(route, 0).position.distanceTo(route.points[0]) < 1e-9)
    assert.ok(sampleRoute(route, route.length).position.distanceTo(route.points.at(-1)) < 1e-9)
    const walker = { route, speed: .35, phase: 0 }, travel = route.length / walker.speed
    assert.equal(walkerPhase(travel + .1, walker, 1.4).state, 'handoff-to')
    assert.equal(walkerPhase(travel + 1.5, walker, 1.4).state, 'inbound')
}
const { batchStaticWorld } = load('src/static-world.js')
const scene = new THREE.Scene()
for (let n = 0; n < 3; n++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: n ? '#db6a41' : '#71806a', roughness: .92 }))
    mesh.position.x = n * 2
    if (!n) mesh.userData.owner = { islandId: 'pick' }
    scene.add(mesh)
}
const picking = scene.children[0]
assert.equal(batchStaticWorld(scene).savedDrawCalls, 2)
assert.equal(picking.visible, false)
const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1))
scene.updateMatrixWorld(true)
assert.ok(ray.intersectObject(picking).length)
assert.ok(scene.getObjectByName('static-world-batch').geometry.attributes.color)
let seed = DATA.seed
const random = () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 }
const walkingScene = new THREE.Scene()
const collaboration = createCollaboration({ scene: walkingScene, islands, data: DATA, random, onChange() {} })
collaboration.walkers.forEach(walker => walker.phase = 0)
collaboration.update(0, 40, false)
const body = walkingScene.children.find(object => object.isInstancedMesh)
const colorVersion = body.instanceColor.version
collaboration.update(.1, 40, false)
assert.equal(body.instanceColor.version, colorVersion, 'Static instance colors must not upload every frame')
const walker = collaboration.walkers[0], arrival = walker.route.length / walker.speed
collaboration.update(arrival + .01, 12, false)
assert.deepEqual(collaboration.events.filter(event => event.walkerId === walker.id).map(event => event.type), ['arrive'])
collaboration.update(arrival + 1.42, 12, false)
assert.deepEqual(collaboration.events.filter(event => event.walkerId === walker.id).map(event => event.type), ['arrive', 'handoff', 'depart'])
const positions = collaboration.walkers.map(w => w.position.toArray())
collaboration.update(arrival + 1.42, 12, true)
assert.deepEqual(collaboration.walkers.map(w => w.position.toArray()), positions)
walkingScene.traverse(object => { if (object.isInstancedMesh) assert.ok(Array.from(object.instanceMatrix.array).every(Number.isFinite)) })
const { createCharacters } = load('src/characters.js')
const guestScene = new THREE.Scene()
let chosenGuest = null
const guests = createCharacters({ scene: guestScene, islands, data: DATA, onSelect: id => { chosenGuest = id } })
assert.deepEqual(guests.records.filter(p => p.showInList !== false).map(p => p.name.zh), ['任老','石頭','瓦特','火哥','Terry'])
assert.equal(new Set(guests.records.map(p => p.id)).size, 6)
guests.records.forEach(p => assert.ok(p.name.en && p.description.en && DATA.islands.some(i => i.id === p.islandId)))
assert.equal(guests.get('terry').glasses, true)
assert.ok(guests.records.every(p => p.pose === 'walking'))
guests.update(2, 10, true)
assert.ok(guests.records.every(p => p.scale === .48), 'Guests must match ordinary walker height')
assert.equal(guests.get('doraemon').button, undefined)
assert.equal(guests.get('doraemon').label, undefined)
assert.equal(guests.get('doraemon').showInList, false)
const guestMeshes = guests.pickables()
assert.equal(guestMeshes.length, 4)
const guestMatrices = guestMeshes.map(mesh => Array.from(mesh.instanceMatrix.array))
guests.update(2, 10, true)
assert.deepEqual(guestMeshes.map(mesh => Array.from(mesh.instanceMatrix.array)), guestMatrices, 'Paused guests must not move')
assert.ok(guestMatrices.flat().every(Number.isFinite))
const initialGuestPositions = guests.records.map(p => p.position.clone())
guests.update(3, 10, true)
assert.ok(guests.records.every((p, i) => p.position.distanceTo(initialGuestPositions[i]) > .1), 'All five guests must walk')
const repeatGuests = createCharacters({ scene: new THREE.Scene(), islands, data: DATA, onSelect() {} })
repeatGuests.update(3, 10, true)
assert.deepEqual(repeatGuests.records.map(p => p.position.toArray()), guests.records.map(p => p.position.toArray()), 'Seeded wandering must replay deterministically')
const ren = guests.get('ren'), destination = ren.route.points[ren.route.points.length - 1].clone(), departureTime = ren.departureTime
guests.update(ren.arrivalTime + .01, 10, true)
assert.equal(ren.waiting, true)
assert.ok(ren.position.distanceTo(destination) < 1e-8)
guests.update(departureTime + .001, 10, true)
assert.ok(ren.trips >= 2)
assert.ok(ren.position.distanceTo(destination) < .001, 'Next trip must start at the previous exact endpoint')
assert.equal(ren.waiting, false)
const afterDeparture = guests.records.map(p => p.position.toArray())
guests.update(departureTime + .001, 10, true)
assert.deepEqual(guests.records.map(p => p.position.toArray()), afterDeparture)
guests.setSelection('terry')
const mesh = guestMeshes[0], guestIndex = mesh.userData.characters.indexOf('terry')
assert.equal(guests.resolveHit({ object: mesh, instanceId: guestIndex }), 'terry')
guests.get('terry').button.handlers.click()
assert.equal(chosenGuest, 'terry')
guests.update(2, 10, false)
assert.equal(guests.pickables().length, 0)
assert.ok(guests.records.every(p => !p.button || p.button.hidden))
console.log('PASS: safety data; routes; batching; ordinary walkers; 5 regular-sized roaming guests plus unlabelled robot cat; seeded replay; continuous trips; finite matrices; pause and visibility.')
