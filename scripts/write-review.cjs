// Rebuild the inventory and asset-size appendix after a reviewed content change.
const fs=require('fs'),zlib=require('zlib'),babel=require('@babel/core')
const moduleData={exports:{}}
new Function('module','exports',babel.transformSync(fs.readFileSync('src/data.js','utf8'),{presets:[['@babel/preset-env',{targets:{node:'current'}}]],babelrc:false,configFile:false}).code)(moduleData,moduleData.exports)
const {DATA}=moduleData.exports
const partial=new Set(['weather','navigation','lost'])
let text='# 登山安全內容查核\n\n查閱日期：2026-10-25。範圍為 12 島、50 個中英文細項、8 條協作關係及 7 個一天情境。\n\n本次完成官方公開來源對照與文字修正，資料標記為 source-reviewed-demo；這不是外部醫師或山域救援專業人員的認證。內容是教育摘要，實際行程須另查當地公告與即時狀況。\n\n## 本次修正\n\n- 雷雨：補入最後雷聲後至少 30 分鐘，再依天候重新評估；未把時間到視為一定安全。\n- 高山適應：體能不能預防高山病；補充休息仍喘、意識或步態異常等警訊及立即求援、協助下撤或撤離、減少患者用力。沒有提供藥物劑量或個人診斷。\n- 迷途與待援：安全時停止移動；立即危險例外須先避開，移動後告知位置。\n- 通訊：使用臺灣 119 報案來源，未移植美國來源的 911；App 仍受網路與基地臺條件限制。\n- 協作線均為 thematic／pending 教學示範，未冒稱官方救援流程；一天時段不是建議出發或折返時刻。\n- 不為符合展示需求而編造飲水量、海拔、時間門檻等數字。\n\n## 來源與可讀性\n\n直接閱讀正文並對照主張；少數臺灣網站擷取只顯示導覽或逾時，改以官方搜尋索引摘要核對，另補可直接閱讀的 NPS 通用原則。索引核對不能替代完整逐句核對，相關頁面保留人工複查項目。沒有將擷取失敗判定為來源失效。\n\n|識別碼|官方來源|本次存取方式|\n|---|---|---|\n'
for(const [id,s]of Object.entries(DATA.sources))text+=`|${id}|[${s.title}](${s.url})|${partial.has(id)?'官方索引核對；正文人工複查待辦':'正文閱讀'}|\n`
text+='\n## 50 項對照清單\n\n下表表示已進行來源對照；索引來源的限制如上。中英文表述同步修改，來源識別碼由 DATA 產生。\n\n|細項 id|名稱|來源|\n|---|---|---|\n'
for(const island of DATA.islands)for(const item of island.items)text+=`|${item.id}|${item.name.zh}|${item.sourceIds.join('、')}|\n`
text+='\n## 後續維護\n\n來源改版、急救建議變更或發布前重新查閱；涉及醫療或救援決策的擴充須另請專業人員審閱。來源日期代表此次查閱日期，不保證未來不變。\n'
fs.writeFileSync('SAFETY_REVIEW.md',text)
const assets=fs.readdirSync('dist').filter(n=>/\.(js|css|html)$/.test(n)).map(name=>{const b=fs.readFileSync('dist/'+name);return{name,rawBytes:b.length,gzipBytes:zlib.gzipSync(b).length}})
fs.writeFileSync('performance-build-assets.json',JSON.stringify(assets,null,2))
console.log(JSON.stringify(assets))
