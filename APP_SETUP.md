# 星云 AI 双端内测

## PWA
合并本分支后，访问 GitHub Pages 网站并使用浏览器的“添加到主屏幕”。SVG 图标仅供开发，正式安装前应提供 192/512 PNG 图标。

## Capacitor
在 Node.js 20+ 环境执行 `npm install && npm run build:web`。Android: `npx cap add android && npx cap sync android`，随后用 Android Studio 构建测试 APK。iOS: `npx cap add ios && npx cap sync ios`，随后使用 macOS + Xcode 签名并安装测试。不要将 Apple/Android 签名密钥提交到仓库。

## 重要
目前的 AI 后端限制 Origin 为 GitHub Pages 域名。Capacitor 原生 WebView 的 Origin 不同，原生版本调用 AI 接口前必须设计新的安全鉴权方案并调整 Worker CORS，不能仅放开为 `*`。首次 PWA 安装可测试页面，真实 AI 出图仍依赖 Worker Secrets、API 额度和端到端验证。发布前应配置正式域名、账号鉴权、限流及预算控制。