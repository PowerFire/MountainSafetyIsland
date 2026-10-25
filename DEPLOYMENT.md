# GitHub Pages 部署說明

更新：2026-10-25。本地已備妥 `.github/workflows/pages.yml`，尚未推送或公開部署。

## 首次發布

1. 確認目的儲存庫與權限。本地 origin 是 `https://github.com/PowerFire/threejs-webpack-starter.git`，分支是 `master`；工作流程監聽 master，若改分支須同步修改 branches。
2. 進入 GitHub 儲存庫 **Settings → Pages → Build and deployment → Source**，選 **GitHub Actions**。不要部署 src，也不要選 `/docs`。GitHub Free 支援公開儲存庫，私人儲存庫依方案。
3. 用 GitHub Desktop 檢查變更、提交並 Push，或執行以下指令。先確認 origin 是目的儲存庫；node_modules／releases 不要提交。

```sh
git remote -v
git status
git add src bundler scripts static .github package.json package-lock.json .gitignore readme.md OPERATIONS.md DEPLOYMENT.md DELIVERY.md PROGRESS.md SAFETY_REVIEW.md PERFORMANCE_REPORT.md performance-*.json performance-preview.png
git commit -m "Deliver Mountain Safety Island and configure GitHub Pages"
git push origin master
```

4. 在 **Actions → Deploy GitHub Pages** 等待 build、deploy 成功。工作流程進入預設分支後，也能使用 Run workflow 手動執行。如 environment 要求核准，須在 GitHub 完成核准。
5. 到 **Settings → Pages → Visit site** 開啟網站。沿用目前 origin 且無自訂網域時，預期為 `https://powerfire.github.io/threejs-webpack-starter/`；這不是已上線保證，實際以 Actions 的 page_url 為準。
6. 驗收中文、`?lang=en`、搜尋、點島、日夜、暫停、Network 無 JS／CSS 404，並補測實體手機。遠端工作流程未在本次執行，本機測試不能替代線上驗收。

工作流程用 Node 22、npm ci、npm test、npm run build、npm run test:delivery，成功後只上傳 dist。部署 job 使用 pages:write、id-token:write 和 github-pages environment，不需個人 access token。即使 dist 已被 Git 追蹤，Actions 也會從原始碼重建。

## 本機測試專案子路徑

```sh
npm run build
npm run test:delivery
npm run preview -- --base-path=/MountainSafetyIsland/
```

開啟 http://localhost:8082/MountainSafetyIsland/ 。若 8082 已佔用，先 Ctrl+C 關閉舊預覽。測試腳本另開隨機埠，驗證 HTML、相對 JS／CSS、gzip、英文 query、重新導向及資源不存在回應。

Webpack publicPath 為 `./`，可用於根網域與 `/repository/`；保留網址最後 `/`。沒有 history router，不需 SPA fallback。語言切換保留子路徑與其他 query。

## 更新與回復

修改後提交並推送 master 即重建。要回復請對問題提交建立 revert 提交再推送，或從已確認版本建立修正提交。只覆蓋 dist 會在下次 Actions 被原始碼重建取代。

## 排錯

|問題|檢查|
|---|---|
|沒有工作流程|yml 是否已推送、分支是否 master、Actions 是否啟用|
|configure-pages 失敗|Pages Source 是否 GitHub Actions、方案和存取權限|
|部署被拒|Actions token 政策、github-pages environment 允許分支與待核准部署|
|首頁404|build／deploy 是否成功、儲存庫網址拼寫、結尾 `/`|
|有HTML沒有場景|Network 檢查 JS／CSS，相對路徑、完整 dist、快取重載|
|OpenSSL錯誤|使用 npm scripts，勿直接跑裸 webpack|
|npm ci失敗|package.json／lock 是否同步，runner Node 是否22；保留錯誤日誌排查|
|bundle大小警告|本版已知限制，見 PERFORMANCE_REPORT.md；不等於建置失敗|

## 官方參考

[GitHub Pages 自訂工作流程](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 說明 build、artifact、deploy、權限及 environment；[發布來源設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) 說明 Pages Source。Action 版本日後更新須再驗證。
