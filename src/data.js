// 場景資料集中於 DATA；model 對應 model-kit.js 的程序模型。
// axial 為 pointy-top 六角座標。相鄰座標將在場景階段自動建立橋樑。
const bilingual = (zh, en) => ({ zh, en })

// 每列：id、中文名稱、英文名稱、中文說明、英文說明、階段、來源、兩條中英重點。
// 重點為教育摘要；不以虛構數字填充安全門檻。具體路線規定應另查當地公告。
const ITEM_PLANS = {
    planning: [
        ['route', '選擇合適路線', 'Choose a Suitable Route', '先了解路線，再決定是否出發。', 'Understand the route before committing.', 'before', 'planning', '比較難度與自身經驗。', 'Match difficulty to experience.', '查詢當地路線資訊。', 'Check local route information.'],
        ['team', '確認隊伍能力', 'Assess the Team', '把每位隊員的經驗與限制納入計畫。', 'Include every member’s experience and limits.', 'before', 'planning', '討論體能與技能。', 'Discuss fitness and skills.', '有健康疑慮先諮詢醫師。', 'Consult a clinician about health concerns.'],
        ['backup', '準備替代行程', 'Prepare an Alternative', '讓天候或身體變化時有其他選擇。', 'Keep options for changing conditions.', 'before', 'planning', '預想行程取消的情境。', 'Consider reasons to cancel.', '準備較合適的替代活動。', 'Prepare a suitable alternative activity.'],
        ['turnaround', '設定折返計畫', 'Plan the Return', '把回程也算進行程。', 'Include the return in the itinerary.', 'before', 'planning', '評估全程所需時間。', 'Estimate the entire trip duration.', '依隊況與天候調整目標。', 'Adjust goals to conditions and the team.'],
        ['access', '查詢許可與封閉', 'Check Access Rules', '出發前確認目的地是否開放。', 'Check access before departure.', 'before', 'planning', '查閱管理單位公告。', 'Read land-manager notices.', '確認許可與預約需求。', 'Check permit and booking requirements.']
    ],
    weather: [
        ['forecast', '查看目的地預報', 'Check the Local Forecast', '使用登山地點的預報安排活動。', 'Plan using the destination forecast.', 'before', 'weather', '查對預報地點。', 'Confirm the forecast location.', '留意山區預報的不確定性。', 'Allow for mountain forecast uncertainty.'],
        ['updates', '留意天氣變化', 'Monitor Changing Weather', '預報不是抵達後的保證。', 'A forecast is not a guarantee.', 'during', 'weather', '出發前重新查看資料。', 'Recheck information before departure.', '把現場變化納入判斷。', 'Account for observed changes.'],
        ['thunder', '辨識雷雨風險', 'Recognize Thunderstorms', '聽到雷聲就應尋求安全庇護。', 'Seek safe shelter when thunder is heard.', 'incident', 'lightning', '戶外沒有完全安全的雷雨位置。', 'No outdoor location is fully safe in a thunderstorm.', '尋找安全建築或封閉硬頂車輛。', 'Seek a safe building or enclosed hard-topped vehicle.'],
        ['shelter', '認識避雷限制', 'Know Shelter Limits', '帳篷不能作為避雷保護。', 'A tent does not provide lightning protection.', 'incident', 'lightning', '開放式涼亭也不是安全避雷處。', 'Open-sided shelters are not safe lightning shelters.', '最後一聲雷後至少等 30 分鐘，再依天候評估是否恢復活動。', 'Wait at least 30 minutes after the last thunder, then reassess the weather before resuming.'],
        ['cancel', '接受天候取消', 'Change Plans for Weather', '讓預報風險改變行程決定。', 'Let weather risk change the plan.', 'before', 'lightning', '高雷雨風險時取消戶外暴露。', 'Avoid outdoor exposure with high thunderstorm risk.', '事先討論安全撤離選項。', 'Discuss safe exit options in advance.']
    ],
    equipment: [
        ['checklist', '核對裝備清單', 'Review the Gear List', '按行程逐項確認裝備。', 'Check equipment against the itinerary.', 'before', 'essentials', '依活動補充基本裝備。', 'Adapt essential gear to the activity.', '熟悉器材操作。', 'Know how to use your equipment.'],
        ['layers', '準備備用衣物', 'Pack Extra Layers', '為可能遇到的天候準備衣物。', 'Pack clothing for possible conditions.', 'before', 'essentials', '帶上保暖與防雨衣物。', 'Include warm and rain layers.', '依環境調整配置。', 'Adapt the kit to the environment.'],
        ['headlamp', '檢查頭燈電力', 'Check the Headlamp', '讓照明成為隨身裝備。', 'Keep lighting in your personal kit.', 'before', 'essentials', '確認頭燈能正常開啟。', 'Check that the headlamp works.', '準備備用電力。', 'Carry spare power.'],
        ['repair', '準備維修工具', 'Carry Repair Tools', '為常見裝備問題準備工具。', 'Prepare for basic equipment problems.', 'before', 'essentials', '工具依活動選擇。', 'Choose tools for the activity.', '了解工具使用方式。', 'Understand how to use them.']
    ],
    fitness: [
        ['limits', '認識體能限制', 'Know Physical Limits', '選擇自己能負荷的活動。', 'Choose an activity within your capacity.', 'before', 'planning', '評估耐力與活動時間。', 'Assess endurance and duration.', '避免以他人的能力代替自評。', 'Assess your own ability independently.'],
        ['skills', '練習所需技能', 'Practice Required Skills', '出發前學會路線需要的技術。', 'Learn the skills the route requires.', 'before', 'planning', '確認特殊技術需求。', 'Identify specialist skills needed.', '不足時先受訓或換路線。', 'Train first or choose another route.'],
        ['pace', '配合隊伍節奏', 'Match the Team’s Pace', '讓行進安排符合隊員狀態。', 'Adapt progress to the team.', 'during', 'planning', '持續確認隊伍能力。', 'Reassess team capacity.', '需要時調整行程。', 'Change the itinerary when needed.'],
        ['rest', '重新評估狀態', 'Reassess Your Condition', '感到無法負荷時重新檢視目標。', 'Reconsider goals when the effort is too much.', 'during', 'planning', '注意身體與環境變化。', 'Notice physical and environmental changes.', '選擇能力範圍內的活動。', 'Stay within your capabilities.']
    ],
    navigation: [
        ['offline', '下載離線地圖', 'Download Offline Maps', '出發前準備可離線使用的地圖。', 'Prepare maps that work offline.', 'before', 'navigation', '事先下載並練習操作。', 'Download and practice before departure.', '了解自身位置的顯示方式。', 'Learn how to display your location.'],
        ['coordinates', '練習讀取座標', 'Read Your Coordinates', '學會取得可傳達的位置資訊。', 'Learn to obtain shareable location information.', 'before', 'navigation', '確認手機定位功能。', 'Check location services.', '練習讀取與傳送座標。', 'Practice reading and sharing coordinates.'],
        ['map', '準備紙本備援', 'Carry a Paper Backup', '為電子裝置準備另一種導航方式。', 'Keep a navigation backup for electronics.', 'before', 'essentials', '攜帶紙本地圖。', 'Carry a paper map.', '預先學習地圖與指北針。', 'Learn map and compass use beforehand.'],
        ['lost', '迷途停止亂走', 'Stop Wandering When Lost', '先冷靜定位，避免擴大搜索範圍。', 'Stay calm and locate yourself instead of wandering.', 'incident', 'lost', '不要慌亂下切。', 'Do not descend blindly.', '若有立即危險先避開；位置安全後定位、求援並保暖。', 'Move away from immediate danger if necessary, then locate yourself, request help and stay warm in a safe place.']
    ],
    supplies: [
        ['food', '帶備用糧食', 'Carry Extra Food', '為行程延誤保留補給。', 'Keep food for unexpected delays.', 'before', 'essentials', '準備額外食物。', 'Pack extra food.', '選擇易食用的補給。', 'Choose easy-to-eat supplies.'],
        ['water', '規劃飲水', 'Plan Drinking Water', '先確認飲水攜帶與補充安排。', 'Plan water supplies before departure.', 'before', 'essentials', '出發前備妥飲水。', 'Prepare water before setting out.', '別等到缺水才處理。', 'Do not wait until supplies run out.'],
        ['treatment', '準備水處理', 'Prepare Water Treatment', '天然水源須納入處理計畫。', 'Include treatment in natural-water plans.', 'before', 'essentials', '確認可能水源。', 'Identify potential sources.', '攜帶適用處理用品。', 'Carry appropriate treatment supplies.'],
        ['availability', '查核補給設施', 'Check Supply Facilities', '確認沿途是否真的有補給。', 'Check what supplies are actually available.', 'before', 'planning', '查詢飲水設施。', 'Check drinking-water facilities.', '查詢商店與服務資訊。', 'Check shops and service information.']
    ],
    terrain: [
        ['trail', '確認步道狀況', 'Check Trail Conditions', '在出發前了解路面與地形。', 'Understand trail surfaces and terrain.', 'before', 'planning', '查閱路線地形資料。', 'Review terrain information.', '留意封閉與危險公告。', 'Check closures and hazard notices.'],
        ['steep', '評估陡坡能力', 'Assess Steep Terrain', '技術與裝備要符合地形需求。', 'Match skills and equipment to terrain.', 'before', 'planning', '辨識技術路段。', 'Identify technical sections.', '超出能力就調整路線。', 'Change routes when demands exceed skills.'],
        ['river', '避開危險溪流', 'Avoid Hazardous Rivers', '不要為了完成行程勉強涉水。', 'Do not force a crossing to finish a trip.', 'during', 'mountain', '遠離危險或湍急河流。', 'Avoid dangerous or fast-flowing rivers.', '選擇其他行程選項。', 'Choose another itinerary option.'],
        ['cliffs', '遠離危險邊緣', 'Avoid Exposed Edges', '讓活動範圍遠離危險落差。', 'Keep activities away from dangerous drops.', 'during', 'mountain', '留在標示步道。', 'Stay on marked trails.', '避免接近懸崖與陡降邊緣。', 'Avoid cliffs and steep drop-offs.']
    ],
    altitude: [
        ['gradual', '安排逐步適應', 'Ascend Gradually', '讓身體有時間適應高度。', 'Allow time to adjust to altitude.', 'before', 'altitude', '避免快速直上高海拔。', 'Avoid rapid ascent to high altitude.', '體能好也可能高山不適，行程仍須保留適應時間。', 'Fitness does not prevent altitude illness; allow time to acclimatize.'],
        ['symptoms', '辨識高山不適', 'Recognize Altitude Symptoms', '頭痛與噁心等變化需要重視。', 'Take headache and nausea seriously at altitude.', 'during', 'altitude', '留意頭痛、疲倦或食慾下降。', 'Watch for headache, fatigue or appetite loss.', '症狀未消失前不要再升高。', 'Do not ascend while symptoms persist.'],
        ['descent', '惡化立即處理', 'Act on Worsening Symptoms', '休息仍惡化時需要下降與求援。', 'Descend and seek help if symptoms worsen at rest.', 'incident', 'altitude', '靜止時喘、意識或步態異常都是嚴重警訊。', 'Breathlessness at rest, confusion or poor coordination are serious warning signs.', '嚴重症狀應立即求援，安排有人協助、減少耗力的下降或撤離。', 'Seek urgent help and arrange assisted descent or evacuation with minimal exertion for severe symptoms.'],
        ['consult', '行前醫療諮詢', 'Seek Pre-trip Medical Advice', '有疾病或用藥需求時先諮詢醫師。', 'Discuss health conditions and medication with a clinician.', 'before', 'altitude', '說明預定高度與行程。', 'Explain the planned altitude and itinerary.', '預防藥物由醫師評估。', 'Have preventive medication assessed by a clinician.']
    ],
    'first-aid': [
        ['kit', '備妥急救包', 'Prepare a First-aid Kit', '讓急救用品符合自己的需求。', 'Adapt first-aid supplies to personal needs.', 'before', 'essentials', '檢查用品效期。', 'Check supply expiry dates.', '帶上個人必要藥品。', 'Carry necessary personal medication.'],
        ['warmth', '保暖防雨待援', 'Stay Warm While Waiting', '受困時減少風雨造成的暴露。', 'Reduce exposure while awaiting help.', 'incident', 'lost', '注意保暖與防雨。', 'Stay warm and protected from rain.', '保存體力並保持聯絡。', 'Conserve energy and maintain contact.'],
        ['shelter', '準備緊急庇護', 'Pack Emergency Shelter', '為意外停留準備遮蔽物。', 'Prepare shelter for an unexpected stop.', 'before', 'essentials', '攜帶適用緊急庇護裝備。', 'Carry suitable emergency shelter.', '依行程環境選擇。', 'Choose it for the trip environment.'],
        ['report', '描述傷病狀況', 'Describe the Medical Situation', '向受理人員說明現場需要。', 'Explain needs to the emergency operator.', 'incident', 'reporting', '先提供位置資訊。', 'Give location information first.', '依受理人員提問回答。', 'Answer the operator’s questions.']
    ],
    communication: [
        ['contact', '留下行程資料', 'Leave a Trip Plan', '讓山下的人知道你去哪裡。', 'Let someone know where you are going.', 'before', 'essentials', '告知目的地。', 'Share your destination.', '告知預計返回時間。', 'Share the expected return time.'],
        ['coverage', '預想通訊限制', 'Plan for Limited Coverage', '山區不能保證隨時有訊號。', 'Do not assume continuous mountain coverage.', 'before', 'mountain', '偏遠地區通訊可能不良。', 'Remote areas may have poor connectivity.', '準備緊急聯絡方式。', 'Plan a way to call for help.'],
        ['power', '準備手機電力', 'Prepare Phone Power', '把定位與聯絡所需電力列入檢查。', 'Include navigation and communication power in checks.', 'before', 'navigation', '檢查手機與行動電源。', 'Check the phone and power bank.', '熟悉離線定位操作。', 'Practice offline location use.'],
        ['app', '熟悉報案工具', 'Learn Emergency Tools', '在需要前先認識報案工具功能。', 'Learn emergency-tool functions before they are needed.', 'before', 'app', '了解座標傳送方式。', 'Learn how to send coordinates.', '通訊功能仍受現場連線條件限制。', 'Communication still depends on available connectivity.']
    ],
    rescue: [
        ['location', '先說所在位置', 'Give Your Location First', '讓求援對話從位置開始。', 'Start an emergency call with location.', 'incident', 'reporting', '提供地點、相對位置或座標。', 'Give a place, relative location or coordinates.', '考量通話可能中斷。', 'Allow for a possible dropped call.'],
        ['call', '撥打 119 求援', 'Call 119 in Taiwan', '在臺灣遇緊急事故可撥 119。', 'Call 119 for an emergency in Taiwan.', 'incident', 'reporting', '說明需要報案。', 'State that you need emergency assistance.', '依受理人員引導回覆。', 'Follow the operator’s questions.'],
        ['wait', '安全位置待援', 'Wait in a Safe Location', '求援後避免慌亂移動。', 'Avoid panicked movement after requesting help.', 'incident', 'lost', '位置安全時原地待援；有立即危險時先避開並回報新位置。', 'Stay put when safe; if immediate danger requires moving, report the new location.', '保暖防雨並保存體力。', 'Stay warm, dry and conserve energy.'],
        ['signal', '使用哨音示警', 'Signal with a Whistle', '以可辨識的訊號協助搜救。', 'Use a recognizable signal to assist rescuers.', 'incident', 'lost', '必要時使用哨音示警。', 'Use a whistle when needed.', '保持聯絡並回報現況。', 'Maintain contact and report the situation.']
    ],
    ecology: [
        ['waste', '垃圾完整帶走', 'Pack Out Waste', '把食物殘渣與垃圾一起帶下山。', 'Carry out food scraps and other waste.', 'during', 'ecology', '離開前檢查休息處。', 'Inspect rest areas before leaving.', '帶走垃圾與剩食。', 'Carry out litter and leftovers.'],
        ['wildlife', '尊重野生動物', 'Respect Wildlife', '觀察動物時保留牠們的空間。', 'Give wildlife space while observing.', 'during', 'ecology', '不接近或追逐。', 'Do not approach or follow.', '不餵食野生動物。', 'Do not feed wildlife.'],
        ['camp', '使用既有營地', 'Use Established Campsites', '減少對地表與植被的改變。', 'Reduce disturbance to ground and vegetation.', 'during', 'ecology', '優先使用指定營地。', 'Prefer designated campsites.', '不挖溝或改造場地。', 'Do not dig trenches or alter sites.'],
        ['nature', '保留自然原貌', 'Leave Nature in Place', '把自然物留在原來的位置。', 'Leave natural objects where they belong.', 'during', 'ecology', '不採集植物或石頭。', 'Leave plants and rocks in place.', '尊重其他訪客與自然聲音。', 'Respect other visitors and natural sounds.']
    ]
}

export const DATA = {
    title: { zh: '登山安全島', en: 'Mountain Safety Island' },
    seed: 20261025,
    contentStatus: 'source-reviewed-demo',
    reviewedAt: '2026-10-25',
    contentNote: bilingual('教育摘要；實際行程以當地公告、即時狀況及專業判斷為準。', 'Educational summaries; use local notices, current conditions and professional judgment for actual trips.'),
    stages: {
        before: bilingual('行前', 'Before the trip'),
        during: bilingual('登山途中', 'On the trail'),
        incident: bilingual('異常發生時', 'During an incident')
    },
    characters: [
        { id: 'ren', name: bilingual('任老', 'Ren Lao'), islandId: 'planning', hair: 'balding', glasses: false, pose: 'walking', build: 1.15, skin: '#d9a376', description: bilingual('稀疏灰髮、紅色長袖上衣，站起來沿島嶼步道散步。', 'Sparse grey hair and a red long-sleeved shirt, walking along the island paths.') },
        { id: 'stone', name: bilingual('石頭', 'Stone'), islandId: 'navigation', hair: 'cropped-grey', glasses: true, pose: 'walking', satchel: true, build: 1.08, skin: '#d79b70', description: bilingual('灰黑短髮、圓框眼鏡、紅色上衣，搭配斜背包與手錶。', 'Short grey-black hair, round glasses, a red shirt, a crossbody bag and a watch.') },
        { id: 'watt', name: bilingual('瓦特', 'Watt'), islandId: 'terrain', hair: 'close-cropped', glasses: false, pose: 'walking', build: .95, skin: '#e0ad80', description: bilingual('貼頭短髮、紅色有領上衣，沿步道探索不同主題島。', 'Close-cropped hair and a red polo, exploring the islands on foot.') },
        { id: 'fire', name: bilingual('火哥', 'Fire'), islandId: 'rescue', hair: 'short', glasses: false, pose: 'walking', build: 1.05, skin: '#d9a274', description: bilingual('蓬鬆黑短髮、紅色有領上衣，以笑容迎接來訪者。', 'Full short black hair and a red polo, welcoming visitors with a smile.') },
        { id: 'terry', name: bilingual('Terry', 'Terry'), islandId: 'equipment', hair: 'fringe', glasses: true, pose: 'walking', build: .95, skin: '#dfb184', description: bilingual('平齊黑色瀏海、細框眼鏡、紅色長袖上衣，雙手自然擺動行走。', 'A straight black fringe, thin-rimmed glasses and a red long-sleeved shirt, walking with a natural arm swing.') },
        { id: 'doraemon', name: bilingual('小叮噹', 'Doraemon'), islandId: 'ecology', model: 'robot-cat', showLabel: false, showInList: false, pose: 'walking', description: bilingual('在島嶼步道上散步的藍色機器貓。', 'A blue robot cat wandering along the island paths.') }
    ],
    sources: {
        emergency: { title: 'NPS · Outdoor Emergency Plan', url: 'https://www.nps.gov/articles/gtgemergencyplan.htm' },
        altitudeSevere: { title: 'CDC Yellow Book 2026 · Altitude Illness', url: 'https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html' },
        planning: { title: 'NPS · Trip Planning Guide', url: 'https://www.nps.gov/subjects/healthandsafety/trip-planning-guide.htm' },
        essentials: { title: 'NPS · Ten Essentials', url: 'https://www.nps.gov/articles/10essentials.htm' },
        weather: { title: '中央氣象署 · 氣象隨選平台', url: 'https://wede.cwa.gov.tw/' },
        lightning: { title: 'NWS · Lightning Outdoors', url: 'https://www.weather.gov/safety/lightning-outdoors' },
        navigation: { title: '國家公園署 · 登山迷途勿驚慌，自主定位利搜救', url: 'https://www.taiwan.nps.gov.tw/home/zh-tw/news/28418.html' },
        altitude: { title: 'CDC · Travel to High Altitudes', url: 'https://wwwnc.cdc.gov/travel/page/travel-to-high-altitudes' },
        mountain: { title: 'U.S. Department of State · Mountain Safety', url: 'https://travel.state.gov/en/international-travel/planning/safety-tips/mountain-safety.html' },
        lost: { title: '臺中市消防局 · 登山安全三原則', url: 'https://eoc.taichung.gov.tw/2614868/2614887/3194978' },
        reporting: { title: '內政部消防署 · 報案要領', url: 'https://www.nfa.gov.tw/cht/index.php?act=article&article_id=802&code=print&ids=68' },
        app: { title: '南投縣消防局 · 消防防災e點通與119報案通訊限制', url: 'https://www.ntfd.gov.tw/index.php?act=article&code=detail&ids=5567' },
        ecology: { title: 'NPS · Leave No Trace Seven Principles', url: 'https://www.nps.gov/articles/leave-no-trace-seven-principles.htm' }
    },
    time: {
        startMinute: 600,
        minutesPerSecond: 10,
        presets: [
            { minute: 360, label: '清晨 06', icon: '☀' },
            { minute: 720, label: '白天 12', icon: '☼' },
            { minute: 1080, label: '黃昏 18', icon: '◒' },
            { minute: 1260, label: '夜晚 21', icon: '☾' }
        ],
        // minute, skyTop, horizon, sunColor, sunI, hemiSky, hemiGround, hemiI, night, water
        keyframes: [
            [0, '1e2c58', '3f4f80', 'b4c2ff', 1.15, '94a2d8', '64566a', 1.85, 1, '5a88b2'],
            [300, '26365f', '4c5688', 'b8c4ff', 1, '96a4da', '66586c', 1.85, 1, '5c8ab4'],
            [360, '7f8fc4', 'f6c3a6', 'ffb48a', 1.3, 'f3c6b5', '6b5a5a', 1.1, .55, '8fb7c4'],
            [450, 'a9d1ea', 'fbe6d3', 'ffe2c4', 2.4, 'eaf2f6', '8a7a68', 1.25, 0, '9fcfd6'],
            [720, '9fd0ec', 'f4eee3', 'fff1de', 2.9, 'eef6fa', '8f8270', 1.35, 0, 'a9d8db'],
            [960, 'a6cfe6', 'f8e7d2', 'ffe3c0', 2.5, 'f1efe8', '8a7a66', 1.25, 0, '9fcbd2'],
            [1065, '8b8fc4', 'f7b98f', 'ff9f6a', 1.8, 'f6d2bc', '7d6660', 1.2, .3, '93a9bd'],
            [1140, '5a5e9e', 'd99aa6', 'ff9a7a', 1.3, 'c0b2e0', '655868', 1.35, .75, '6a7cab'],
            [1260, '22325f', '445488', 'c0ccff', 1.2, '98a8dc', '685a6e', 1.9, 1, '5a88b2'],
            [1440, '1e2c58', '3f4f80', 'b4c2ff', 1.15, '94a2d8', '64566a', 1.85, 1, '5a88b2']
        ]
    },
    environment: {
        terrainSize: 170, terrainSegments: 160,
        forestCount: 2600, mobileForestCount: 1100,
        forestInnerRadius: 17, forestOuterRadius: 52,
        cloudCount: 12, cloudSpeed: .12, detailDistance: 26,
        islandTrees: ['pine', 'broadleaf', 'fruit', 'pine', 'broadleaf', 'fruit', 'pine', 'pine', 'cherry', 'palm', 'broadleaf', 'willow']
    },
    world: {
        radius: 2.02,
        spacing: 2.28,
        top: 0.65,
        waterY: -0.18,
        mainModelPosition: { x: 0, z: -0.58 },
        mainModelSize: 1.15
    },
    islands: [
        {
            id: 'planning', number: '01',
            name: { zh: '行前規劃島', en: 'Trip Planning' },
            summary: { zh: '把行程、隊伍與撤退選項放在同一張計畫裡。', en: 'Plan the route, team and retreat options together.' },
            axial: { q: -1, r: -1 }, color: '#db6a41', model: 'map-table',
            topics: ['行程安排', '隊伍能力', '撤退點', '折返規劃'], items: []
        },
        {
            id: 'weather', number: '02',
            name: { zh: '天氣判讀島', en: 'Mountain Weather' },
            summary: { zh: '認識天氣資訊與山區環境的變化。', en: 'Explore weather information and changing mountain conditions.' },
            axial: { q: 0, r: -1 }, color: '#6f7fb5', model: 'weather-station',
            topics: ['預報資訊', '降雨變化', '雷雨風險', '天氣觀察'], items: []
        },
        {
            id: 'equipment', number: '03',
            name: { zh: '裝備整備島', en: 'Gear Preparation' },
            summary: { zh: '依行程與環境整理自己的裝備。', en: 'Prepare equipment for the trip and environment.' },
            axial: { q: -2, r: 0 }, color: '#b48560', model: 'gear-house',
            topics: ['背包檢查', '衣物系統', '照明裝備', '備用物資'], items: []
        },
        {
            id: 'fitness', number: '04',
            name: { zh: '體能配速島', en: 'Fitness and Pacing' },
            summary: { zh: '了解隊伍的體能、步行節奏與休息安排。', en: 'Explore team fitness, walking pace and rest planning.' },
            axial: { q: -1, r: 0 }, color: '#9cc27a', model: 'trail-stairs',
            topics: ['行前訓練', '步行節奏', '休息安排', '隊伍狀態'], items: []
        },
        {
            id: 'navigation', number: '05',
            name: { zh: '導航定位島', en: 'Navigation' },
            summary: { zh: '把地圖、路線與所在位置連起來。', en: 'Connect maps, routes and location awareness.' },
            axial: { q: 0, r: 0 }, color: '#3e7c8c', model: 'compass-station',
            topics: ['地圖閱讀', '離線資料', '位置確認', '路線辨識'], items: []
        },
        {
            id: 'supplies', number: '06',
            name: { zh: '糧食飲水島', en: 'Food and Water' },
            summary: { zh: '把食物、飲水與補給需求納入行程。', en: 'Include food, water and supply needs in the itinerary.' },
            axial: { q: 1, r: 0 }, color: '#fcea8b', model: 'supply-depot',
            topics: ['糧食規劃', '飲水準備', '水源評估', '補給安排'], items: []
        },
        {
            id: 'terrain', number: '07',
            name: { zh: '地形通行島', en: 'Terrain Awareness' },
            summary: { zh: '觀察步道與地形，辨識需要重新評估的路段。', en: 'Observe trails and terrain to identify sections requiring reassessment.' },
            axial: { q: -2, r: 1 }, color: '#c5b5a7', model: 'ridge-bridge',
            topics: ['陡坡地形', '溪流環境', '落石區域', '步道狀況'], items: []
        },
        {
            id: 'altitude', number: '08',
            name: { zh: '高山適應島', en: 'Altitude Awareness' },
            summary: { zh: '認識高度變化與身體狀態的關係。', en: 'Explore the relationship between altitude and physical condition.' },
            axial: { q: -1, r: 1 }, color: '#8db86f', model: 'mountain-hut',
            topics: ['高度適應', '身體觀察', '隊友回報', '行程調整'], items: []
        },
        {
            id: 'first-aid', number: '09',
            name: { zh: '保暖急救島', en: 'Warmth and First Aid' },
            summary: { zh: '認識保暖、急救準備與異常狀況的應對主題。', en: 'Explore warmth, first-aid preparation and incident response.' },
            axial: { q: 0, r: 1 }, color: '#f2b5c6', model: 'first-aid-shelter',
            topics: ['保暖準備', '急救用品', '傷病觀察', '緊急庇護'], items: []
        },
        {
            id: 'communication', number: '10',
            name: { zh: '通訊留守島', en: 'Communication' },
            summary: { zh: '連結山上的隊伍與山下的留守聯絡人。', en: 'Connect the hiking team with its off-mountain contact.' },
            axial: { q: 1, r: 1 }, color: '#58a6a6', model: 'radio-tower',
            topics: ['行程留存', '聯絡安排', '通訊工具', '進度回報'], items: []
        },
        {
            id: 'rescue', number: '11',
            name: { zh: '求援協作島', en: 'Rescue Coordination' },
            summary: { zh: '整理位置與現況，了解求援協作的資訊需求。', en: 'Organize location and situation information for rescue coordination.' },
            axial: { q: -1, r: 2 }, color: '#db6a41', model: 'rescue-base',
            topics: ['位置資訊', '現況整理', '求援通報', '等待協作'], items: []
        },
        {
            id: 'ecology', number: '12',
            name: { zh: '生態無痕島', en: 'Leave No Trace' },
            summary: { zh: '把對步道、營地與野生動物的尊重帶進山裡。', en: 'Bring respect for trails, campsites and wildlife into the mountains.' },
            axial: { q: 0, r: 2 }, color: '#71806a', model: 'forest-campsite',
            topics: ['垃圾管理', '野生動物', '營地選擇', '環境尊重'], items: []
        }
    ].map(island => ({
        ...island,
        items: ITEM_PLANS[island.id].map(row => ({
            id: `${island.id}-${row[0]}`,
            name: bilingual(row[1], row[2]),
            description: bilingual(row[3], row[4]),
            stage: row[5],
            sourceIds: [...new Set([row[6], ...(row[6] === 'navigation' ? ['essentials'] : []), ...(row[6] === 'weather' ? ['planning'] : []), ...(row[6] === 'lost' ? ['emergency'] : []), ...(island.id === 'altitude' && row[0] === 'descent' ? ['altitudeSevere'] : [])])],
            reviewStatus: 'source-reviewed',
            facts: [bilingual(row[7], row[8]), bilingual(row[9], row[10])],
            model: island.model,
            keywords: { zh: [row[1], island.name.zh, ...island.topics], en: [row[2], island.name.en] },
            relatedIslandIds: [],
            reviewedAt: '2026-10-25'
        }))
    })),
    collaboration: {
        handoffSeconds: 1.4, walkersPerFlow: 6,
        walkingSpeed: [.32, .40], cyclingSpeed: [.62, .70],
        evidenceLabels: { official: '官方依據', thematic: '主題串聯', pending: '待確認示範' },
        note: '搬運角色與協作關係為教育情境示意，不代表真實機構的作業或已發生事件。'
    },
    flows: [
        { id: 'plan-weather', from: 'planning', to: 'weather', cargo: { zh: '預報資料', en: 'Forecast notes' }, icon: 'document', role: 'leader', evidence: 'thematic', description: '把目的地天氣資訊納入行前計畫。' },
        { id: 'gear-aid', from: 'equipment', to: 'first-aid', cargo: { zh: '保暖包', en: 'Warmth kit' }, icon: 'kit', role: 'responder', evidence: 'thematic', description: '連結備用衣物與保暖急救準備。' },
        { id: 'fitness-altitude', from: 'fitness', to: 'altitude', cargo: { zh: '隊況紀錄', en: 'Team notes' }, icon: 'document', role: 'hiker', evidence: 'thematic', description: '把隊伍的身體狀況帶進高度適應評估。' },
        { id: 'navigation-rescue', from: 'navigation', to: 'rescue', cargo: { zh: '位置座標', en: 'Coordinates' }, icon: 'compass', role: 'ranger', evidence: 'thematic', description: '用清楚的位置資訊協助求援溝通。' },
        { id: 'food-fitness', from: 'supplies', to: 'fitness', cargo: { zh: '補給餐盒', en: 'Food supplies' }, icon: 'box', role: 'cyclist', evidence: 'thematic', description: '在活動規劃中同時考慮體能與補給。' },
        { id: 'terrain-navigation', from: 'terrain', to: 'navigation', cargo: { zh: '路線地圖', en: 'Route map' }, icon: 'map', role: 'ranger', evidence: 'thematic', description: '把路線地形資訊與地圖閱讀連起來。' },
        { id: 'contact-rescue', from: 'communication', to: 'rescue', cargo: { zh: '行程紀錄', en: 'Trip record' }, icon: 'document', role: 'contact', evidence: 'thematic', description: '連結留守資料與求援時的位置、現況資訊。' },
        { id: 'ecology-supplies', from: 'ecology', to: 'supplies', cargo: { zh: '回收袋', en: 'Waste bag' }, icon: 'bag', role: 'volunteer', evidence: 'pending', description: '示範補給規劃與垃圾帶走之間可延伸的教育連結。' }
    ],
    journal: { maxEvents: 200, visibleEvents: 60, note: '本次瀏覽的模擬事件，非即時山況或真實救援紀錄。' },
    dayCycle: [
        { id: 'overnight', start: 0, end: 300, title: { zh: '夜間整備', en: 'Overnight readiness' }, description: { zh: '示範檢查照明、保暖與緊急庇護的準備。', en: 'Review lighting, warmth and emergency shelter preparation.' }, items: ['equipment-headlamp', 'equipment-layers', 'first-aid-warmth', 'first-aid-shelter', 'communication-power', 'ecology-camp'] },
        { id: 'prepare', start: 300, end: 420, title: { zh: '行前檢查', en: 'Pre-trip checks' }, description: { zh: '把行程、天氣、裝備與留守資訊一起檢查。', en: 'Review the route, weather, gear and trip contact together.' }, items: ['planning-route', 'planning-team', 'planning-access', 'weather-forecast', 'weather-cancel', 'equipment-checklist', 'navigation-offline', 'communication-contact'] },
        { id: 'depart', start: 420, end: 600, title: { zh: '出發與定位', en: 'Departure and navigation' }, description: { zh: '示範將配速、位置確認與現場觀察連起來。', en: 'Connect pacing, location awareness and observations.' }, items: ['fitness-limits', 'fitness-skills', 'fitness-pace', 'navigation-coordinates', 'navigation-map', 'terrain-trail', 'weather-updates'] },
        { id: 'resupply', start: 600, end: 780, title: { zh: '途中補給與觀察', en: 'Supplies and observation' }, description: { zh: '探索飲水、糧食、隊況與天候變化的關係。', en: 'Explore supplies, team condition and changing weather.' }, items: ['supplies-food', 'supplies-water', 'supplies-treatment', 'supplies-availability', 'fitness-rest', 'weather-thunder', 'weather-shelter', 'altitude-symptoms'] },
        { id: 'reassess', start: 780, end: 960, title: { zh: '路線與身體再評估', en: 'Reassess route and health' }, description: { zh: '用示範情境檢視地形、適應狀態與替代選項。', en: 'Review terrain, acclimatization and alternative options.' }, items: ['planning-backup', 'planning-turnaround', 'terrain-steep', 'terrain-river', 'terrain-cliffs', 'altitude-gradual', 'altitude-descent', 'altitude-consult'] },
        { id: 'return', start: 960, end: 1140, title: { zh: '折返與回報', en: 'Return and report' }, description: { zh: '示範回程規劃、聯絡與環境整理；不是建議的固定折返時間。', en: 'Explore return planning, contact and cleanup; this is not a prescribed turnaround time.' }, items: ['planning-turnaround', 'communication-coverage', 'communication-app', 'ecology-waste', 'ecology-wildlife', 'ecology-nature', 'equipment-repair'] },
        { id: 'safety-review', start: 1140, end: 1440, title: { zh: '夜間安全複習', en: 'Evening safety review' }, description: { zh: '以教學情境複習迷途、急救與求援資訊，不表示正在發生事故。', en: 'Review lost-person, first-aid and rescue information; no real incident is implied.' }, items: ['navigation-lost', 'first-aid-kit', 'first-aid-report', 'rescue-location', 'rescue-call', 'rescue-wait', 'rescue-signal', 'equipment-headlamp'] }
    ]
}
