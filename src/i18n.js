export const lang = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'zh'
const messages = {
    '登山安全島':'Mountain Safety Island','登山安全島｜Mountain Safety Island':'Mountain Safety Island | Explore safely','12 座主題島 · 50 個安全細項':'12 islands · 50 safety topics','目前亮起的細項':'Currently highlighted topics','每一份準備，連起平安回家的路。':'Every preparation helps bring you safely home.',
    '⌂ 全景':'⌂ Overview','☰ 清單':'☰ Index','▦ 鳥瞰':'▦ Bird view','▤ 日誌':'▤ Journal','? 說明':'? Help',
    '把準備，連起來。':'Connect your preparations.','搜尋主題與安全知識':'Search themes and safety topics','搜尋主題、裝備、求援…':'Search topics, gear, rescue…','清除':'Clear','清除搜尋':'Clear search','安全主題':'Safety themes','清單類型':'Index categories',
    '關閉清單':'Close index','關閉詳情':'Close details','關閉日誌':'Close journal','探索工具':'Explore tools','安全主題清單':'Safety index','安全知識詳情':'Safety details',
    '登山日誌':'Mountain journal','登山日誌與一天情境':'Mountain journal and daily scenarios','目前一天情境':'Current daily scenario','依協作關係篩選':'Filter by collaboration','全部協作關係':'All collaborations','清空日誌':'Clear journal','模擬事件，最新在前':'Simulated events, newest first',
    '手動調時只切換日夜與情境，小人位置不重播。':'Changing the clock updates lighting and scenarios; walkers do not rewind.',
    '教學模擬的一天，不是建議行程時刻，也不是即時山況。':'An educational day, not a recommended timetable or live mountain conditions.',
    '小人到站後會留下抵達、交接與再次出發的紀錄。':'Arrivals, handoffs and departures will appear as walkers reach their stops.',
    '這條協作關係目前沒有紀錄。':'No events for this collaboration yet.','協作顯示工具':'Collaboration display controls','小人':'Walkers','搬運':'Cargo','名牌':'Names','協作線':'Flows',
    '━━ 官方依據':'━━ Official source','┄ 主題串聯':'┄ Thematic link','··· 待確認示範':'··· Pending example','教育情境，非即時作業':'Educational scenarios, not live operations',
    '← 返回':'← Back','↕ 展開':'↕ Expand','↕ 收合':'↕ Collapse','日夜時間控制':'Day and night controls','◷ 時間':'◷ Time','島嶼時間':'Island time','自動播放':'Playing','已暫停':'Paused','減少動態':'Reduced motion','▶ 播放':'▶ Play','Ⅱ 暫停':'Ⅱ Pause','時間軸':'Time slider',
    '已依減少動態效果設定停止自動播放；仍可手動選擇時間。':'Autoplay is off for reduced motion. You can still choose a time manually.',
    '正在組合登山安全島…':'Assembling Mountain Safety Island…','準備天空、水面與十二座主題島。':'Preparing the sky, water and twelve islands.',
    '請啟用 JavaScript，以瀏覽登山安全島互動場景。':'Enable JavaScript to explore Mountain Safety Island.',
    '登山安全島互動場景':'Interactive Mountain Safety Island','點選模型探索、拖曳或方向鍵旋轉、滾輪或雙指縮放 3D 島群':'Select models to explore; drag or use arrow keys to orbit; scroll or pinch to zoom.',
    '點選模型探索 · 拖曳或方向鍵旋轉 · 滾輪縮放':'Select models · Drag or use arrow keys to orbit · Scroll to zoom',
    '參考來源':'Sources','重點提醒':'Key reminders','適用階段':'When it applies','協作關係':'Collaborations','協作兩端':'Connected islands','目前沒有相關協作情境。':'No related collaboration scenarios yet.','探索這座島 →':'Explore this island →',
    '沒有符合的項目，試試「地圖」、「保暖」或「求援」。':'No matches. Try map, warmth or rescue.',
    '場景暫時無法載入':'The scene could not load','請確認瀏覽器支援 WebGL，或重新整理頁面。':'Check WebGL support or reload the page. ',
    'WebGL 繪圖連線中斷，請重新整理。':'The WebGL context was lost. Reload the page.',
    '調整面板高度':'Resize panel height','向上或向下拖曳；也可使用方向鍵、Home 與 End。':'Drag up or down, or use arrow keys, Home and End.',
    '跳到主題清單按鈕':'Skip to the index button','方向鍵旋轉鏡頭，Esc 關閉面板。也可用主題清單探索所有內容。':'Use arrow keys to orbit and Escape to close panels. The index provides access to all topics.',
    '操作說明':'How to explore','略過':'Skip','上一步':'Back','下一步 →':'Next →','開始探索':'Start exploring','關閉說明':'Close guide',
    '依系統偏好減少動態效果':'Reduce motion based on system preferences','模擬事件':'Simulated events'
}
function english(text) {
    if (messages[text] !== undefined) return messages[text]
    return text
        .replace(/第 (\d+) 天 /g,'Day $1 ')
        .replace(/(\d+) 筆符合 ／ 保留 (\d+) 筆（最多 (\d+) 筆）/g,'$1 matching / $2 saved (max $3)')
        .replace(/(\d+) 座主題島 ／ (\d+) 個安全細項/g,'$1 islands / $2 safety topics')
        .replace(/(\d+) 座主題島 · (\d+) 組模型 · (\d+) 座橋/g,'$1 islands · $2 models · $3 bridges')
        .replace(/找到 (\d+) 個細項/g,'$1 matching topics')
        .replace(/(\d+) 個安全細項/g,'$1 safety topics')
        .replace(/(\d+) 個細項正以黃色亮起/g,'$1 topics highlighted in yellow')
        .replace(/(\d+) 個細項亮起/g,'$1 highlighted topics')
        .replace(/協作關係 (\d+)/g,'Collaborations $1')
        .replace(/目前 (\d+) 筆事件/g,'$1 events')
        .replace(/查閱日期：/g,'Checked: ')
        .replace(/正在搬 /g,'Carrying ')
        .replace(/搬運物：/g,'Cargo: ')
        .replace(/探索 /g,'Explore ')
        .replace(/的主題示意模型/g,' — illustrative theme model')
        .replace(/搬運角色 /g,'Walker ')
        .replace(/ · 沿步道與橋樑往返/g,' · travels on paths and bridges')
        .replace(/手動調時：/g,'Clock changed: ')
        .replace(/；小人位置保留。/g,'; walker positions preserved.')
        .replace(/情境：/g,'Scenario: ')
        .replace(/ · 教學模擬的一天/g,' · Educational day')
        .replace(/ ／ 示範時段/g,' / Example period')
        .replace(/完成交接/g,'Handoff').replace(/抵達/g,'Arrived').replace(/出發/g,'Departed')
        .replace(/● 已暫停/g,'● Paused').replace(/● 減少動態/g,'● Reduced motion')
}
export function tr(text, en) { return lang === 'en' ? (en ?? english(String(text))) : String(text) }
export function localizeData(source) {
    if (lang !== 'en') return source
    const data = JSON.parse(JSON.stringify(source))
    function visit(value) { if (!value || typeof value !== 'object') return; if (typeof value.zh === 'string' && typeof value.en === 'string') value.zh = value.en; Object.values(value).forEach(visit) }
    visit(data)
    const topics = [
        ['Itinerary','Team capability','Exit options','Return plan'],['Forecasts','Rainfall','Thunderstorms','Observations'],['Gear checklist','Clothing layers','Lighting','Backup supplies'],['Training','Pacing','Rest','Team condition'],['Map reading','Offline maps','Location checks','Route awareness'],['Food planning','Water','Water sources','Resupply'],['Steep slopes','Streams','Rockfall areas','Trail conditions'],['Acclimatization','Body awareness','Team reports','Plan changes'],['Warmth','First-aid kit','Illness and injury','Emergency shelter'],['Trip plan','Contact plan','Communication tools','Progress reports'],['Location','Situation report','Emergency call','Waiting for help'],['Waste','Wildlife','Campsites','Respect nature']
    ]
    data.islands.forEach((island,index) => { island.topics = topics[index]; island.items.forEach((item,n) => { const original = source.islands[index].items[n]; item.keywords.zh.push(original.description.zh, ...original.facts.map(f=>f.zh)) }) })
    const descriptions = ['Include destination weather in the trip plan.','Connect spare clothing with warmth and first-aid preparation.','Include team condition in altitude-awareness decisions.','Share clear location information when requesting help.','Consider fitness and supplies together.','Connect terrain information with map reading.','Connect trip-contact records with location and situation reports.','An example educational link between supplies and packing out waste.']
    data.flows.forEach((flow,i) => flow.description = descriptions[i])
    data.collaboration.evidenceLabels = { official:'Official source', thematic:'Thematic link', pending:'Pending example' }
    data.collaboration.note = 'Roles and collaboration links are educational illustrations, not real agency operations or incident reports.'
    data.journal.note = 'Simulated events from this visit, not live mountain conditions or real rescue records.'
    data.time.presets.forEach((preset,i) => preset.label = ['Dawn 06','Day 12','Dusk 18','Night 21'][i])
    const sources = { weather:'Central Weather Administration · Weather platform', navigation:'Taiwan National Park Service · Location awareness', lost:'Taichung Fire Bureau · Mountain safety', reporting:'National Fire Agency · Emergency reporting', app:'Nantou Fire Bureau · 119 app communication requirements' }
    Object.entries(sources).forEach(([id,title]) => data.sources[id].title = title)
    return data
}
export function localizeStatic() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant'
    if (lang === 'en') document.title = 'Mountain Safety Island | Explore safely'
    if (lang === 'en') document.querySelector('meta[name="description"]').content = 'Explore mountain preparation, safety knowledge and educational collaborations across twelve interactive islands.'
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const texts=[];while(walker.nextNode())texts.push(walker.currentNode)
    for(const text of texts){const raw=text.nodeValue,trimmed=raw.trim();if(!trimmed)continue;const explicit=text.parentElement?.dataset.en;const translated=explicit??english(trimmed);if(translated!==trimmed&&text.parentElement.children.length===0)text.parentElement.dataset.en=translated;if(lang==='en'&&translated!==trimmed)text.nodeValue=raw.replace(trimmed,translated)}
    if(lang==='en')document.querySelectorAll('[aria-label],[aria-description],[placeholder],[title]').forEach(node=>{for(const attr of ['aria-label','aria-description','placeholder','title'])if(node.hasAttribute(attr))node.setAttribute(attr,english(node.getAttribute(attr)))})
}
