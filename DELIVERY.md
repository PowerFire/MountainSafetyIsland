# 第 14 步交付紀錄

日期：2026-10-25。交付為可建置的 Webpack 原始專案、dist 靜態網站、Windows ZIP 打包工具與操作／部署文件。

## 交付內容

- dist/index.html 與 JS／CSS 為網站，採相對路徑，可放在專案子路徑。
- `npm run release` 通過測試、建置及子路徑檢查後，產生 releases/MountainSafetyIsland-時間.zip。
- ZIP 內 site 為網站、documentation 為文件與驗收紀錄、THIRD-PARTY 為 Three.js 授權、SHA256SUMS.json 為完整性清單；若 bundle 有隨附授權文字也保留在 site。
- ZIP 不含 node_modules、Git 歷史、原始碼或 source map；維護請保留原始專案。dist 可能含除錯 map，打包時略過。
- GitHub Pages workflow 已備妥；本次未做遠端推送或公開部署，步驟見 DEPLOYMENT.md。

## 接手順序

1. 閱讀 readme.md、OPERATIONS.md，執行 npm ci／npm run dev。
2. 修改 DATA 後跑 npm test，依 SAFETY_REVIEW.md 重新查閱來源。
3. Windows 跑 npm run release，解壓 ZIP，以 site 為 HTTP 根目錄驗收。
4. 依 DEPLOYMENT.md 啟用 Pages、提交推送，補線上與實體手機驗收。

## 保留項

本次完成現有 Webpack 版本交付，不代表初始規格全數達成：仍為 r126／多檔，未實作 r160／單一 HTML。近距離高負載約49 FPS、原靜態20–30 draw call、bundle警告、實體手機／螢幕閱讀器／長時間穩定度、部分來源正文人工複查及外部專業審閱保留，見驗收報告。

既有 UNLICENSED 狀態保留；第三方授權不代表已取得整個專案或上游內容的再授權。
