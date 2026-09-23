申论八股操练 PWA

目录：
- index.html
- style.css
- app.js
- sw.js
- manifest.json
- icons/icon-192.png
- icons/icon-512.png

运行方式：
1. 不要直接用 file:// 打开；Service Worker 需要 http/https 环境。
2. 将整个文件夹放到任意静态服务器。
3. iPhone Safari 访问后，可用“分享 → 添加到主屏幕”。
4. 首次打开在线加载后，核心文件会缓存，之后可离线使用。

数据：
- 所有语料、练习记录、打卡记录、XP、当前进行中的练习均在 IndexedDB 本地保存。
- 设置页可导出/导入 JSON。
