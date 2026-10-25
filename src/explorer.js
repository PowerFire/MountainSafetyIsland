import { MOBILE_QUERY } from './layout.js'
import * as THREE from 'three'
import { createModelKit } from './model-kit.js'
import { tr } from './i18n.js'

export function createExplorer({ data, random, onChange, onSelect = () => {}, onClose = () => {} }) {
    const $ = selector => document.querySelector(selector)
    const index = $('#explore-index'), card = $('#detail-card'), list = $('#theme-list'), input = $('#island-search')
    const mobile = window.matchMedia(MOBILE_QUERY)
    let currentIsland = null, currentItem = null, currentFlow = null, returnFocus = null
    let dayItems = new Set()
    const thumbnails = new Map()
    let previewRenderer
    function element(tag, className, text) {
        const node = document.createElement(tag)
        if (className) node.className = className
        if (text !== undefined) node.textContent = tr(text)
        return node
    }
    function button(text, action, className) {
        const node = element('button', className, text); node.type = 'button'; node.addEventListener('click', action); return node
    }
    function showIndex(open) {
        index.hidden = !open
        $('#toggle-index').setAttribute('aria-expanded', String(open))
        if (open && mobile.matches && !card.hidden) { card.hidden = true; onClose() }
        if (open && mobile.matches) $('.time-panel').open = false
        onChange()
    }
    function hideCard() { if (card.hidden) return; card.hidden = true; onClose(); if (returnFocus?.isConnected && returnFocus.getClientRects().length) returnFocus.focus(); else $('#toggle-index').focus(); onChange() }
    function showCard() {
        returnFocus = document.activeElement
        card.hidden = false
        if (mobile.matches) $('.time-panel').open = false
        if (mobile.matches) showIndex(false)
        card.scrollTop = 0
        const title = $('#detail-content h2')
        title.tabIndex = -1; title.focus({ preventScroll: true })
        onChange()
    }
    function thumbnail(model) {
        if (thumbnails.has(model)) return thumbnails.get(model)
        try {
            if (!previewRenderer) {
                previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
                previewRenderer.setSize(160, 160); previewRenderer.setPixelRatio(1)
                previewRenderer.outputEncoding = THREE.sRGBEncoding
                previewRenderer.toneMapping = THREE.ACESFilmicToneMapping
                previewRenderer.physicallyCorrectLights = true
            }
            const scene = new THREE.Scene()
            const kit = createModelKit(random)
            kit.place(model, new THREE.Vector3(), 1, { islandId: 'preview', itemId: null })
            kit.build(scene)
            scene.add(new THREE.HemisphereLight(0xeef6fa, 0x8f8270, 1.3))
            const light = new THREE.DirectionalLight(0xfff1de, 2.8); light.position.set(2, 4, 3); scene.add(light)
            const camera = new THREE.PerspectiveCamera(32, 1, .1, 20)
            camera.position.set(2, 1.9, 2.7); camera.lookAt(0, .55, 0)
            previewRenderer.render(scene, camera)
            const result = previewRenderer.domElement.toDataURL('image/png')
            const geometries = new Set(), materials = new Set()
            scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material) })
            geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
            thumbnails.set(model, result)
            return result
        } catch (error) { console.warn('模型縮圖暫時無法顯示', error); return null }
    }
    function heading(island, title, summary) {
        const content = $('#detail-content'); content.replaceChildren()
        content.append(element('p', 'eyebrow', `${island.number} / ${island.name.en.toUpperCase()}`), element('h2', '', title), element('p', 'detail-summary', summary))
        return content
    }
    function sources(content, item) {
        content.append(element('h3', '', '參考來源'))
        for (const id of item.sourceIds) {
            const source = data.sources[id]
            const link = element('a', 'source-link', source.title)
            link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; content.append(link)
        }
        content.append(element('p', 'muted', `查閱日期：${item.reviewedAt}`), element('p', 'content-note', data.contentNote.zh))
    }
    function itemButton(island, item, number) {
        const node = button(`${String(number + 1).padStart(2, '0')}  ${item.name.zh}`, () => selectItem(island.id, item.id), 'item-link')
        node.dataset.itemId = item.id; node.classList.toggle('day-active', dayItems.has(item.id))
        return node
    }
    function selectIsland(id) {
        const island = data.islands.find(i => i.id === id)
        if (!island) return
        currentIsland = island; currentItem = null; currentFlow = null
        const content = heading(island, island.name.zh, island.summary.zh)
        const chips = element('div', 'topic-chips')
        island.topics.forEach(topic => chips.append(element('span', 'chip', topic)))
        content.append(chips, element('h3', '', `${island.items.length} 個安全細項`))
        island.items.forEach((item, n) => content.append(itemButton(island, item, n)))
        content.append(element('h3', '', '協作關係'))
        const related = data.flows.filter(flow => flow.from === id || flow.to === id)
        related.forEach(flow => content.append(button(`${flow.cargo.zh} →`, () => selectFlow(flow.id), 'item-link')))
        if (!related.length) content.append(element('p', 'muted', '目前沒有相關協作情境。'))
        showCard()
        onSelect({ islandId: island.id, itemId: null })
    }
    function selectItem(islandId, itemId) {
        const island = data.islands.find(i => i.id === islandId), item = island?.items.find(i => i.id === itemId)
        if (!item) return
        currentIsland = island; currentItem = item; currentFlow = null
        const content = heading(island, item.name.zh, item.description.zh)
        const imageUrl = thumbnail(item.model)
        if (imageUrl) { const image = element('img', 'model-thumbnail'); image.src = imageUrl; image.width = image.height = 160; image.alt = tr(`${item.name.zh}的主題示意模型`); content.append(image) }
        content.append(element('h3', '', '重點提醒'))
        const facts = element('ul', 'fact-list')
        item.facts.forEach(fact => facts.append(element('li', '', fact.zh))); content.append(facts)
        const numbers = item.facts.flatMap(fact => [...fact.zh.matchAll(/\d+(?:\.\d+)?/g)].map(match => ({ value: match[0], text: fact.zh }))).slice(0, 3)
        if (numbers.length) {
            const tiles = element('div', 'number-tiles')
            numbers.forEach(number => { const tile = element('div', 'number-tile'); tile.append(element('strong', '', number.value), element('span', '', number.text)); tiles.append(tile) }); content.append(tiles)
        }
        content.append(element('h3', '', '適用階段'))
        const stages = element('ol', 'stage-timeline')
        Object.entries(data.stages).forEach(([id, label]) => { const node = element('li', id === item.stage ? 'current' : '', label.zh); if (id === item.stage) node.setAttribute('aria-current', 'step'); stages.append(node) }); content.append(stages)
        sources(content, item)
        showCard()
        onSelect({ islandId: island.id, itemId: item.id })
    }
    function selectFlow(id, walkerId = null) {
        const flow = data.flows.find(f => f.id === id)
        if (!flow) return
        const from = data.islands.find(i => i.id === flow.from), to = data.islands.find(i => i.id === flow.to)
        currentIsland = from; currentItem = null; currentFlow = flow
        const content = heading(from, walkerId ? `正在搬 ${flow.cargo.zh}` : `${from.name.zh} → ${to.name.zh}`, flow.description)
        const chips = element('div', 'topic-chips')
        chips.append(element('span', 'chip', data.collaboration.evidenceLabels[flow.evidence]), element('span', 'chip', `搬運物：${flow.cargo.zh}`))
        content.append(chips, element('h3', '', '協作兩端'), element('p', 'detail-summary', `${from.name.zh} → ${to.name.zh}`), element('p', 'content-note', data.collaboration.note))
        content.append(button(`探索 ${from.name.zh}`, () => selectIsland(from.id), 'item-link'), button(`探索 ${to.name.zh}`, () => selectIsland(to.id), 'item-link'))
        if (walkerId) content.append(element('p', 'muted', `搬運角色 ${walkerId} · 沿步道與橋樑往返`))
        showCard(); onSelect({ islandId: from.id, itemId: null, flowId: id, walkerId })
    }
    $('#flows-tab').textContent = tr(`協作關係 ${data.flows.length}`)
    data.flows.forEach(flow => {
        const from = data.islands.find(i => i.id === flow.from), to = data.islands.find(i => i.id === flow.to)
        $('#flow-list').append(button(`${from.name.zh} → ${to.name.zh}｜${flow.cargo.zh}`, () => selectFlow(flow.id), 'item-link'))
    })
    function renderList() {
        const query = input.value.trim().normalize('NFKC').toLocaleLowerCase()
        list.replaceChildren()
        let matches = 0
        for (const island of data.islands) {
            const islandMatch = `${island.name.zh} ${island.name.en} ${island.summary.zh} ${island.topics.join(' ')}`.normalize('NFKC').toLocaleLowerCase().includes(query)
            const items = island.items.filter(item => islandMatch || `${item.name.zh} ${item.name.en} ${item.description.zh} ${item.description.en} ${item.facts.map(f => f.zh + ' ' + f.en).join(' ')} ${item.keywords.zh.join(' ')} ${item.keywords.en.join(' ')}`.normalize('NFKC').toLocaleLowerCase().includes(query))
            if (!items.length) continue
            matches += items.length
            const details = element('details', 'theme-group'); details.open = Boolean(query)
            const summary = element('summary', '', `${island.number} ${island.name.zh} · ${items.length}`)
            summary.style.setProperty('--theme-color', island.color)
            details.append(summary, button('探索這座島 →', () => selectIsland(island.id), 'island-link'))
            items.forEach(item => details.append(itemButton(island, item, island.items.indexOf(item))))
            list.append(details)
        }
        $('#search-count').textContent = tr(query ? `找到 ${matches} 個細項` : `${data.islands.length} 座主題島 ／ ${matches} 個安全細項`)
        if (!matches) list.append(element('p', 'empty-message', '沒有符合的項目，試試「地圖」、「保暖」或「求援」。'))
        onChange()
    }
    const tabs = [$('#themes-tab'), $('#flows-tab')]
    function selectTab(n) {
        tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === n)); tab.tabIndex = i === n ? 0 : -1 })
        $('#themes-panel').hidden = n !== 0; $('#flows-panel').hidden = n !== 1
        $('#search-count').hidden = n !== 0
        onChange()
    }
    tabs.forEach((tab, n) => { tab.addEventListener('click', () => selectTab(n)); tab.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - n; selectTab(next); tabs[next].focus() } }) })
    $('#toggle-index').addEventListener('click', () => { showIndex(index.hidden); if (!index.hidden) input.focus() })
    $('#close-index').addEventListener('click', () => { showIndex(false); $('#toggle-index').focus() })
    $('#close-detail').addEventListener('click', hideCard)
    $('#expand-detail').addEventListener('click', () => {
        const expanded = card.classList.toggle('is-expanded')
        $('#expand-detail').setAttribute('aria-pressed', String(expanded))
        $('#expand-detail').textContent = tr(expanded ? '↕ 收合' : '↕ 展開')
        onChange()
    })
    $('#detail-back').addEventListener('click', () => { if (currentItem) selectIsland(currentIsland.id); else { const wasFlow = currentFlow; hideCard(); showIndex(true); if (wasFlow) selectTab(1); else input.focus() } })
    input.addEventListener('input', () => { selectTab(0); renderList() })
    $('#clear-search').addEventListener('click', () => { input.value = ''; selectTab(0); renderList(); input.focus() })
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { if (!card.hidden) hideCard(); else if (!index.hidden) { showIndex(false); $('#toggle-index').focus() } } })
    mobile.addEventListener('change', () => { showIndex(!mobile.matches && card.hidden); onChange() })
    renderList(); showIndex(!mobile.matches)
    return { selectIsland, selectItem, selectFlow, setDayItems(ids) { dayItems = new Set(ids); document.querySelectorAll('[data-item-id]').forEach(node => node.classList.toggle('day-active', dayItems.has(node.dataset.itemId))) }, closeCard: hideCard, closeIndex: () => showIndex(false), getObstacles: () => [index, card, $('.island-brand'), $('.scene-tools'), $('.time-panel'), $('.collaboration-controls'), $('#flow-legend')].filter(node => !node.hidden && node.getClientRects().length).map(node => node.getBoundingClientRect()) }
}
