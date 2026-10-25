import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { sampleRoute } from './collaboration.js'

export function createSelection({ scene, camera, controls, canvas, islands, grounds, buildings, labelEntries, explorer, collaboration, reducedMotion, onChange }) {
    let selected = null, flight = null, pointer = null, bird = false
    const coral = new THREE.Color('#db6a41')
    const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2()
    const pinGroup = new THREE.Group(); scene.add(pinGroup)
    const outlineMaterial = new THREE.LineBasicMaterial({ color: '#db6a41', depthTest: false, transparent: true, opacity: .9 })
    const outline = new THREE.LineLoop(new THREE.BufferGeometry(), outlineMaterial)
    outline.renderOrder = 10; outline.visible = false; scene.add(outline)
    function cancelFlight() { if (flight) { flight = null; controls.enabled = true; onChange() } }
    function resetBird() { bird = false; controls.minPolarAngle = THREE.MathUtils.degToRad(25); controls.maxPolarAngle = THREE.MathUtils.degToRad(70); document.querySelector('#bird-view').setAttribute('aria-pressed', 'false') }
    function fly(position, target) {
        cancelFlight()
        // Drain residual OrbitControls damping before interpolating the camera.
        const damping = controls.enableDamping; controls.enableDamping = false; controls.update(); controls.enableDamping = damping
        if (reducedMotion.matches) { camera.position.copy(position); controls.target.copy(target); controls.update(); onChange(); return }
        flight = { started: performance.now(), from: camera.position.clone(), fromTarget: controls.target.clone(), position, target }
        controls.enabled = false; onChange()
    }
    function clearPins() {
        pinGroup.children.slice().forEach(child => { if (child.element) child.element.remove(); if (child.geometry) child.geometry.dispose(); if (child.material) child.material.dispose(); pinGroup.remove(child) })
    }
    function updateColors() {
        const flow = selected?.flowId ? collaboration.getFlow(selected.flowId) : null
        const activeIslands = flow ? [flow.from, flow.to] : [selected?.islandId]
        for (const mesh of buildings.meshes) {
            mesh.userData.owners.forEach((owner, index) => {
                const active = selected && activeIslands.includes(owner.islandId) && (!selected.itemId || owner.itemId === selected.itemId)
                const color = new THREE.Color(mesh.userData.baseColors[index])
                if (active) color.lerp(coral, .22)
                mesh.setColorAt(index, color)
            })
            mesh.instanceColor.needsUpdate = true
        }
        labelEntries.forEach(({ tag, islandId }) => { tag.classList.toggle('selected', Boolean(selected && activeIslands.includes(islandId))); tag.classList.toggle('muted-label', Boolean(selected && !activeIslands.includes(islandId))); tag.setAttribute('aria-pressed', String(Boolean(selected && activeIslands.includes(islandId)))) })
    }
    function makePins(island) {
        clearPins()
        const vertices = []
        island.data.items.forEach((item, number) => {
            const record = buildings.records.find(r => r.itemId === item.id)
            const top = record.position.clone().add(new THREE.Vector3(0, record.size * 1.5, 0))
            const pinPosition = top.clone().add(new THREE.Vector3(0, .32, 0))
            const button = document.createElement('button')
            button.className = 'item-pin'; button.type = 'button'; button.textContent = String(number + 1)
            button.setAttribute('aria-label', item.name.zh); button.setAttribute('aria-pressed', String(selected.itemId === item.id))
            button.addEventListener('click', () => explorer.selectItem(island.data.id, item.id))
            const label = new CSS2DObject(button); label.position.copy(pinPosition); pinGroup.add(label)
            vertices.push(...top.toArray(), ...pinPosition.toArray())
        })
        const line = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)), new THREE.LineBasicMaterial({ color: '#db6a41', depthTest: false }))
        line.renderOrder = 11; pinGroup.add(line)
    }
    function select(selection) {
        const island = islands.find(i => i.data.id === selection.islandId)
        if (!island) return
        const record = selection.itemId ? buildings.records.find(r => r.itemId === selection.itemId && r.islandId === selection.islandId) : null
        if (selection.itemId && !record) return
        selected = { ...selection }; resetBird(); updateColors(); collaboration.setSelection(selected)
        if (selection.flowId) clearPins(); else makePins(island)
        const outlinePoints = Array.from({ length: 6 }, (_, n) => new THREE.Vector3(island.center.x + Math.cos(Math.PI / 6 + n * Math.PI / 3) * 1.97, .69, island.center.z - Math.sin(Math.PI / 6 + n * Math.PI / 3) * 1.97))
        outline.geometry.dispose(); outline.geometry = new THREE.BufferGeometry().setFromPoints(outlinePoints); outline.visible = !selection.flowId
        const walker = selection.walkerId ? collaboration.getWalker(selection.walkerId) : null
        const route = selection.flowId ? collaboration.routes.get(selection.flowId) : null
        const focus = walker ? walker.position.clone().add(new THREE.Vector3(0,.2,0)) : route ? sampleRoute(route,route.length/2).position : record ? record.position.clone().add(new THREE.Vector3(0, record.size * .5, 0)) : island.center.clone().setY(.85)
        const offset = record || walker ? new THREE.Vector3(1.6, 2.5, 3.2) : new THREE.Vector3(2.75, 5.3, 6.2).multiplyScalar(route?Math.max(1,Math.min(2,route.length/10)):1)
        const target = focus.clone()
        if (window.innerWidth > 800) {
            // Aim left of the model so it appears to the right of the left-hand card.
            const right = new THREE.Vector3(offset.z, 0, -offset.x).normalize()
            target.addScaledVector(right, record ? -.8 : -1.5)
            if (!document.querySelector('#explore-index').hidden) explorer.closeIndex()
        } else target.y -= record ? .4 : .9
        fly(target.clone().add(offset), target)
    }
    function clear() { selected = null; cancelFlight(); updateColors(); collaboration.setSelection(null); clearPins(); outline.visible = false; onChange() }
    canvas.addEventListener('pointerdown', event => { cancelFlight(); canvas.focus({ preventScroll: true }); pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, multi: pointer !== null } })
    canvas.addEventListener('pointermove', event => { if (pointer && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 6) pointer.moved = true })
    canvas.addEventListener('pointercancel', () => { pointer = null })
    canvas.addEventListener('pointerup', event => {
        const down = pointer; pointer = null
        if (!down || down.multi || down.moved || down.id !== event.pointerId || event.button !== 0 || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) return
        const rect = canvas.getBoundingClientRect()
        mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
        scene.updateMatrixWorld(true); raycaster.setFromCamera(mouse, camera)
        const hit = raycaster.intersectObjects([...buildings.meshes, ...grounds, ...collaboration.pickables()], false)[0]
        if (!hit) return
        const collaborator = collaboration.resolveHit(hit)
        if (collaborator) {
            const walker = collaborator.walkerId ? collaboration.getWalker(collaborator.walkerId) : null
            explorer.selectFlow(walker ? walker.flowId : collaborator.flowId, walker?.id || null)
            return
        }
        const owner = hit.object.isInstancedMesh ? hit.object.userData.owners[hit.instanceId] : hit.object.userData.owner
        if (owner.itemId) explorer.selectItem(owner.islandId, owner.itemId)
        else explorer.selectIsland(owner.islandId)
    })
    // Any new pointer or wheel interaction stops an in-flight camera, including UI controls.
    document.addEventListener('pointerdown', cancelFlight, true)
    canvas.addEventListener('wheel', cancelFlight, { passive: true })
    controls.addEventListener('start', cancelFlight)
    labelEntries.forEach(({ tag, islandId }) => tag.addEventListener('click', () => explorer.selectIsland(islandId)))
    document.querySelector('#bird-view').addEventListener('click', () => {
        if (bird) { resetBird(); const offset = new THREE.Vector3(.24, .53, .87).normalize().multiplyScalar(38); fly(controls.target.clone().add(offset), controls.target.clone()); return }
        bird = true; controls.maxPolarAngle = THREE.MathUtils.degToRad(70)
        controls.minPolarAngle = 0
        document.querySelector('#bird-view').setAttribute('aria-pressed', 'true')
        fly(controls.target.clone().add(new THREE.Vector3(.01, 42, 6)), controls.target.clone())
    })
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') { cancelFlight(); return }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || event.target.closest('input,textarea,select,button,[role="tab"],summary,[contenteditable="true"]')) return
        event.preventDefault(); cancelFlight(); resetBird()
        const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target))
        if (event.key === 'ArrowLeft') spherical.theta -= .10
        if (event.key === 'ArrowRight') spherical.theta += .10
        if (event.key === 'ArrowUp') spherical.phi -= .06
        if (event.key === 'ArrowDown') spherical.phi += .06
        spherical.phi = THREE.MathUtils.clamp(spherical.phi, THREE.MathUtils.degToRad(25), THREE.MathUtils.degToRad(70))
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); controls.update(); onChange()
    })
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches && flight) { const { position, target } = flight; cancelFlight(); camera.position.copy(position); controls.target.copy(target); controls.update(); onChange() } })
    return {
        select, clear, reset() { clear(); resetBird(); controls.minPolarAngle = THREE.MathUtils.degToRad(25) },
        update(now) {
            if (!flight) return false
            const t = Math.min((now - flight.started) / 800, 1)
            const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
            camera.position.lerpVectors(flight.from, flight.position, eased)
            controls.target.lerpVectors(flight.fromTarget, flight.target, eased)
            camera.lookAt(controls.target)
            if (t === 1) { flight = null; controls.enabled = true; controls.update() }
            return true
        },
        layoutPins(obstacles) {
            pinGroup.children.forEach(child => {
                if (!child.element) return
                const element = child.element
                element.style.visibility = 'visible'
                const r = element.getBoundingClientRect()
                if (obstacles.some(o => r.left < o.right + 4 && r.right > o.left - 4 && r.top < o.bottom + 4 && r.bottom > o.top - 4)) element.style.visibility = 'hidden'
            })
        }
    }
}
