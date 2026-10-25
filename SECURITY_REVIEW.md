# 儲存庫與歷史秘密資料檢查

檢查日期：2026-10-25。結果：**本次掃描與人工檢視未發現密碼、API 金鑰、存取權杖或私鑰。**這是限定範圍的秘密資料檢查，不能保證零遺漏，也不是網站、相依套件或 GitHub 帳號的完整資安稽核。

## 範圍

- 儲存庫：PowerFire/MountainSafetyIsland。
- 先 fetch origin 的分支／標籤，再以 ls-remote 核對：遠端只有 master，沒有標籤。
- 本機 HEAD 與 origin/master 一致：`e8dfe842d78a053b336c45699268cc857caefb6a`。
- 非 shallow clone；所有本機可見 refs 合計 13 筆提交。reflog 的唯一提交亦為這 13 筆。
- 當時工作目錄乾淨：60 個追蹤檔，沒有未追蹤且可提交的檔案。
- 包含 src、scripts、bundler、文件、workflow、package-lock，以及 dist 的 bundle／source map；歷史已刪除或替換的版本也納入。
- 不掃描使用者電腦其他專案、憑證儲存區、被忽略的 node_modules／releases。GitHub Actions secrets、帳號設定、伺服器快取、他人 fork、未公開 PR refs 與已刪除的遠端 refs 不在本次範圍。

## 方法與結果

1. 從 gitleaks/gitleaks 官方發行頁取得 Gitleaks 8.30.1 Windows 版本，對照同一發行頁的 SHA-256 校驗檔後執行；沒有上傳程式碼或候選秘密。
2. Gitleaks git 使用 `--log-opts="--all --full-history" --redact=100 --ignore-gitleaks-allow`；13 筆提交、約 28.43 MB 變更內容，退出碼 0，結果 `no leaks found`。
3. 將當時可提交的工作檔複製到獨立檢查目錄，Gitleaks dir 掃描約 3.22 MB，退出碼 0，結果 `no leaks found`；兩份遮蔽 JSON 結果均為空陣列。
4. 補充直接讀取歷史 Git blob：156 個文字版本，檢查明文憑證賦值、帶帳密 URL、Authorization token、雲端金鑰及私鑰標頭，未發現候選項。這補充了 diff 掃描，仍屬規則式偵測。
5. 歷史檔名檢查未發現 .env、.npmrc、.netrc、私鑰、憑證容器等敏感檔；13 筆提交訊息未見秘密。
6. 10 個二進位版本均為專案 PNG 截圖，逐張目視為島嶼、卡片、日誌或效能預覽，未見密碼／金鑰／私人對話；未做隱寫分析。
7. workflow 使用 GitHub 的短效部署授權，檔案沒有硬編碼個人 token；只上傳 dist。此項是設定檢視，不代表已檢查線上帳號安全。

## 已公開的一般資訊／隱私提醒

- PROGRESS.md 含本機 Windows 使用者目錄與專案路徑。這不是登入密碼，也不會因此開放該路徑，但會透露帳號名稱與資料夾結構。
- Git 歷史含兩組提交者電子郵件，均不是 GitHub noreply 格式，包含上游提交者資料。這是正常 Git metadata，但會被公開讀取；本報告不重列地址。
- source map 可讓人閱讀前端原始碼。此次未發現秘密，但日後不得將伺服器憑證或金鑰放進前端程式，即使用環境變數注入或壓縮也不會保密。

以上未被判定為憑證洩漏；本次沒有改寫歷史、撤銷憑證、刪除檔案、提交或推送。若要減少路徑與郵件曝光，需另訂隱私清理範圍；只修改目前文件不會移除既有公開歷史。

## 後續

新增檔案與提交前再次掃描，並使用 GitHub secret scanning／push protection（依儲存庫與帳號支援情況啟用）。若日後發現真正憑證，先撤銷或輪替，再評估清理歷史；刪檔不代表所有副本已消失，參見 [GitHub 移除敏感資料說明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)。掃描工具與規則資訊見 [Gitleaks 官方專案](https://github.com/gitleaks/gitleaks)。
