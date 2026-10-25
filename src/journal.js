import { isMobileLayout } from './layout.js'
import { tr } from './i18n.js'

export function formatMinute(minute) {
    const value = Math.floor(((minute % 1440) + 1440) % 1440)
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}
export function phaseAt(cycle, minute) {
    const value = ((minute % 1440) + 1440) % 1440
    const phase = cycle.find(p => value >= p.start && value < p.end)
    if (!phase) throw new Error('一天情境的時段不完整')
    return phase
}
export function createJournal({ data, explorer, onChange, onPhase }) {
    const $ = selector => document.querySelector(selector)
    const panel = $('#journal-panel'), filter = $('#journal-filter'), list = $('#journal-events')
    let entries = [], lastSourceId = 0, currentPhase = null, playing = true
    const itemMap = new Map(data.islands.flatMap(island => island.items.map(item => [item.id, { island, item }])))
    function node(tag, className, text) { const e = document.createElement(tag); if (className) e.className = className; if (text !== undefined) e.textContent = tr(text); return e }
    function show(open) {
        panel.hidden = !open
        $('#toggle-journal').setAttribute('aria-expanded', String(open))
        if (open) { explorer.closeIndex(); if (isMobileLayout()) { document.querySelector('.time-panel').open = false; explorer.closeCard() } render(); $('#close-journal').focus() }
        onChange()
    }
    data.flows.forEach(flow => {
        const option = node('option', '', `${data.islands.find(i => i.id === flow.from).name.zh} → ${data.islands.find(i => i.id === flow.to).name.zh}｜${flow.cargo.zh}`)
        option.value = flow.id; filter.append(option)
    })
    function render() {
        if (panel.hidden) return
        // Keep a focused event link stable while the user reads or activates it.
        if (list.contains(document.activeElement)) return
        const oldTop = list.scrollTop, oldHeight = list.scrollHeight
        const matching = entries.filter(e => filter.value === 'all' || e.flowId === filter.value)
        list.replaceChildren()
        matching.slice(-data.journal.visibleEvents).reverse().forEach(event => {
            const li = node('li', 'journal-entry')
            const clock = node('time', '', `第 ${event.day} 天 ${formatMinute(event.minute)}`)
            clock.dateTime = formatMinute(event.minute)
            li.append(clock)
            if (event.type === 'clock') li.append(node('p', '', `手動調時：${formatMinute(event.fromMinute)} → ${formatMinute(event.minute)}；小人位置保留。`))
            else {
                const flow = data.flows.find(f => f.id === event.flowId), island = data.islands.find(i => i.id === event.islandId)
                const verb = { depart: '出發', arrive: '抵達', handoff: '完成交接' }[event.type]
                const button = node('button', 'event-link', `${verb} · ${island.name.zh} · ${flow.cargo.zh}`)
                button.type = 'button'; button.addEventListener('click', () => { if (isMobileLayout()) show(false); explorer.selectFlow(flow.id, event.walkerId) })
                li.append(button)
            }
            list.append(li)
        })
        $('#journal-empty').hidden = matching.length > 0
        $('#journal-empty').textContent = tr(filter.value === 'all' ? '小人到站後會留下抵達、交接與再次出發的紀錄。' : '這條協作關係目前沒有紀錄。')
        $('#journal-count').textContent = tr(`${matching.length} 筆符合 ／ 保留 ${entries.length} 筆（最多 ${data.journal.maxEvents} 筆）`)
        if (oldTop > 5) list.scrollTop = oldTop + Math.max(0, list.scrollHeight - oldHeight)
    }
    function append(event) { entries.push(event); if (entries.length > data.journal.maxEvents) entries.splice(0, entries.length - data.journal.maxEvents) }
    function setPhase(minute) {
        const phase = phaseAt(data.dayCycle, minute)
        if (phase.id === currentPhase?.id) return
        currentPhase = phase
        $('#cycle-title').textContent = phase.title.zh
        $('#cycle-description').textContent = phase.description.zh
        $('#cycle-range').textContent = tr(`${formatMinute(phase.start)} — ${phase.end === 1440 ? '24:00' : formatMinute(phase.end)} ／ 示範時段`)
        $('#cycle-item-summary').textContent = tr(`${phase.items.length} 個細項正以黃色亮起`)
        $('#time-cycle').textContent = tr(`情境：${phase.title.zh} · ${phase.items.length} 個細項亮起`)
        document.querySelector('.island-brand .stage').textContent = tr(`${phase.title.zh} · 教學模擬的一天`)
        const container = $('#cycle-items'); container.replaceChildren()
        phase.items.forEach(id => {
            const { island, item } = itemMap.get(id)
            const button = node('button', 'item-link day-active', item.name.zh); button.type = 'button'
            button.addEventListener('click', () => { if (isMobileLayout()) show(false); explorer.selectItem(island.id, id) })
            container.append(button)
        })
        onPhase(phase.items)
        onChange()
    }
    function sync(events, minute, day) {
        let changed = false
        for (const event of events) {
            if (event.id <= lastSourceId) continue
            lastSourceId = event.id
            append({ ...event, minute, day }); changed = true
        }
        if (changed) render()
    }
    $('#toggle-journal').addEventListener('click', () => show(panel.hidden))
    $('#close-journal').addEventListener('click', () => { show(false); $('#toggle-journal').focus() })
    filter.addEventListener('change', render)
    list.addEventListener('focusout', () => queueMicrotask(render))
    $('#clear-journal').addEventListener('click', () => { entries = []; render() })
    // The right-hand list and journal share the same space on desktop and mobile.
    $('#toggle-index').addEventListener('click', () => { if (!$('#explore-index').hidden) show(false) })
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { show(false); $('#toggle-journal').focus() } })
    return {
        setPhase, sync,
        manualJump(fromMinute, minute, day) { append({ type: 'clock', fromMinute, minute, day }); render() },
        setPlayback(isPlaying, reduced) {
            playing = isPlaying
            $('#journal-live').textContent = tr(reduced ? '● 減少動態' : playing ? '● LIVE' : '● 已暫停')
            $('#journal-live').classList.toggle('stopped', !playing)
        },
        getObstacle: () => panel.hidden ? null : panel.getBoundingClientRect(),
        getEntries: () => entries.slice(),
        close: () => show(false)
    }
}
