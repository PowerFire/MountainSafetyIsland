// 場景資料集中於 DATA；模型名稱是後續零件庫的識別碼，目前尚未實作模型。
// axial 為 pointy-top 六角座標。相鄰座標將在場景階段自動建立橋樑。
export const DATA = {
    title: { zh: '登山安全島', en: 'Mountain Safety Island' },
    seed: 20261025,
    contentStatus: 'theme-plan',
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
    ],
    // 後續內容階段填入，空陣列不代表已完成協作或時段功能。
    flows: [],
    dayCycle: []
}
