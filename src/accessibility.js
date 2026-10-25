import { MOBILE_QUERY } from './layout.js'
import { lang, tr } from './i18n.js'

export function createMotionPreference() {
    const system = window.matchMedia('(prefers-reduced-motion: reduce)')
    const checkbox = document.querySelector('#reduce-motion')
    const listeners = new Set()
    let manual = false
    const preference = { get matches() { return system.matches || manual }, addEventListener(type, listener) { if (type === 'change') listeners.add(listener) } }
    function update() { checkbox.checked = preference.matches; checkbox.disabled = system.matches; listeners.forEach(listener => listener({ matches: preference.matches })) }
    checkbox.addEventListener('change', () => { manual = checkbox.checked; update() })
    system.addEventListener('change', update)
    update()
    return preference
}

export function createAccessibility({ onChange, onGuide }) {
    const mobile = window.matchMedia(MOBILE_QUERY)
    const dialog = document.querySelector('#help-dialog')
    const helpButton = document.querySelector('#open-help')
    let guideStep = 0, opener = null, ready = false
    const key = 'mountain-safety-guide-v1'
    const steps = [
        ['從一座島開始','Start with an island','點選模型或島名，或用清單搜尋全部 50 個細項。拖曳旋轉、雙指縮放；鍵盤方向鍵也能旋轉鏡頭。','Select a model or island label, or search all 50 topics in the index. Drag to orbit, pinch to zoom, or use the arrow keys.'],
        ['讓準備連起來','Connect your preparations','卡片提供重點與來源。珊瑚色代表選取，黃色代表目前情境。點一下就能中止相機飛行，Esc 可關閉面板。','Cards provide reminders and sources. Coral marks selection; yellow marks the current scenario. A pointer press stops a camera flight. Escape closes panels.'],
        ['探索模擬的一天','Explore an educational day','時間面板可切換日夜或暫停；日誌記錄模擬搬運事件。手機面板把手可拖曳放大，也可用方向鍵、Home 與 End 調整。','Use Time to change lighting or pause. The journal records simulated transport events. Drag a mobile panel handle to resize it, or use arrow keys, Home and End.']
    ]
    function renderStep() {
        const step = steps[guideStep]
        document.querySelector('#help-step-count').textContent = `${guideStep + 1} / ${steps.length}`
        document.querySelector('#help-step-title').textContent = tr(step[0], step[1])
        document.querySelector('#help-step-body').textContent = tr(step[2], step[3])
        document.querySelector('#help-back').disabled = guideStep === 0
        document.querySelector('#help-next').textContent = guideStep === steps.length - 1 ? tr('開始探索') : tr('下一步 →')
    }
    function openHelp() { if (dialog.open) return; opener = document.activeElement; guideStep = 0; renderStep(); dialog.showModal(); onGuide(true); document.querySelector('#help-next').focus() }
    function closeHelp() { if (dialog.open) dialog.close() }
    dialog.addEventListener('close', () => { try { localStorage.setItem(key, 'seen') } catch (_) { /* Storage may be blocked; the guide still works. */ } onGuide(false); if (opener && opener !== document.body && opener.isConnected) opener.focus(); else document.querySelector('canvas').focus({ preventScroll:true }) })
    dialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation() })
    document.querySelector('#help-close').addEventListener('click', closeHelp)
    document.querySelector('#help-skip').addEventListener('click', closeHelp)
    document.querySelector('#help-next').addEventListener('click', () => { if (guideStep === steps.length - 1) closeHelp(); else { guideStep++; renderStep(); document.querySelector('#help-step-title').focus() } })
    document.querySelector('#help-back').addEventListener('click', () => { if (guideStep > 0) { guideStep--; renderStep(); document.querySelector('#help-step-title').focus() } })
    helpButton.addEventListener('click', openHelp)
    document.addEventListener('keydown', event => { if (event.key === '?' && !event.target.closest('input,textarea,select,[contenteditable="true"]')) { event.preventDefault(); openHelp() } })
    const languageButton = document.querySelector('#switch-language')
    languageButton.textContent = lang === 'en' ? '中文' : 'EN'
    languageButton.setAttribute('aria-label', lang === 'en' ? '切換為繁體中文' : 'Switch to English')
    languageButton.addEventListener('click', () => { const url = new URL(window.location.href); if (lang === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang','en'); window.location.assign(url.href) })
    const sheets = []
    for (const [selector, fraction] of [['#explore-index',.52],['#detail-card',.34],['#journal-panel',.66]]) {
        const panel = document.querySelector(selector)
        const handle = document.createElement('div')
        handle.className='sheet-handle';handle.tabIndex=0;handle.setAttribute('role','slider');handle.setAttribute('aria-orientation','vertical')
        handle.setAttribute('aria-label',tr('調整面板高度'));handle.setAttribute('aria-description',tr('向上或向下拖曳；也可使用方向鍵、Home 與 End。'))
        const line=document.createElement('span');line.setAttribute('aria-hidden','true');handle.append(line);panel.prepend(handle)
        let drag=null,height=null,userSized=false
        const bounds=()=>{const viewport=window.visualViewport?.height||window.innerHeight;const bottom=parseFloat(getComputedStyle(panel).bottom)||66;const max=Math.max(120,viewport-bottom-12);return{min:Math.min(selector==='#detail-card'?220:250,max),max,normal:viewport<=500?max:Math.min(max,Math.max(220,viewport*fraction))}}
        function setHeight(value,announce=false){if(!mobile.matches)return;const b=bounds();height=Math.round(Math.max(b.min,Math.min(b.max,value)));panel.style.height=`${height}px`;panel.style.minHeight='0px';handle.setAttribute('aria-valuemin',String(Math.round(b.min)));handle.setAttribute('aria-valuemax',String(Math.round(b.max)));handle.setAttribute('aria-valuenow',String(height));handle.setAttribute('aria-valuetext',lang==='en'?`${height} pixels high`:`面板高度 ${height} 像素`);const expanded=height>=b.max-8;panel.classList.toggle('is-expanded',expanded);if(selector==='#detail-card'){const expand=document.querySelector('#expand-detail');expand.setAttribute('aria-pressed',String(expanded));expand.textContent=tr(expanded?'↕ 收合':'↕ 展開')}if(announce)document.querySelector('#app-status').textContent=handle.getAttribute('aria-valuetext');onChange()}
        function fit(){if(!mobile.matches){panel.style.removeProperty('height');panel.style.removeProperty('min-height');height=null;userSized=false;return}setHeight(userSized?height:bounds().normal)}
        handle.addEventListener('pointerdown',event=>{if(!mobile.matches)return;event.preventDefault();handle.focus();userSized=true;drag={y:event.clientY,height:panel.getBoundingClientRect().height};handle.setPointerCapture(event.pointerId)})
        handle.addEventListener('pointermove',event=>{if(drag){event.preventDefault();setHeight(drag.height+drag.y-event.clientY)}})
        handle.addEventListener('pointerup',event=>{if(!drag)return;drag=null;const b=bounds();const snap=[b.min,b.normal,b.max].sort((a,c)=>Math.abs(a-height)-Math.abs(c-height))[0];setHeight(snap,true);if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId)})
        handle.addEventListener('pointercancel',()=>{drag=null})
        handle.addEventListener('keydown',event=>{if(!mobile.matches||!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();event.stopPropagation();userSized=true;const b=bounds();setHeight(event.key==='Home'?b.min:event.key==='End'?b.max:(height??b.normal)+(event.key==='ArrowUp'?40:-40),true)})
        if(selector==='#detail-card')document.querySelector('#expand-detail').addEventListener('click',()=>{if(!mobile.matches)return;userSized=true;const b=bounds();setHeight((height??b.normal)>=b.max-8?b.normal:b.max)})
        mobile.addEventListener('change',fit);window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);sheets.push({fit});fit()
    }
    return { ready(){if(ready)return;ready=true;let seen=false;try{seen=localStorage.getItem(key)==='seen'}catch(_){}if(!seen)openHelp()},openHelp }
}
