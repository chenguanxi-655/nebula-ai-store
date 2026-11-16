# 星云 AI Studio — 图片生成后端（私测）

此目录提供 Cloudflare Worker 的服务端代码。前端托管在 GitHub Pages，API 密钥只保存在 Worker Secrets 中。

## 部署（Cloudflare 控制台）
1. 登录 Cloudflare，进入 Workers & Pages → Create → Worker。
2. 将 `worker.js` 内容粘贴到 Worker 编辑器并 Deploy。
3. 在 Worker 的 Settings → Variables and Secrets 新增两个 **Secret**：
   - `OPENAI_API_KEY`：从 OpenAI Platform 获得的密钥。
   - `STUDIO_ACCESS_CODE`：自己生成的高强度私测访问码，不能与 API Key 相同。
4. 复制 Worker 的 `https://...workers.dev` 地址，在星云网站的图片生成测试页填写该地址及访问码。
5. 在 OpenAI Platform 设置项目预算与用量告警；在 Cloudflare 设置调用限制后，再考虑公开开放。

## 安全边界
- 仅限个人私测，绝不公开访问码；不要把密钥或访问码提交 GitHub。
- Origin 校验不是身份验证；访问码是临时门槛，不是正式用户认证。
- 当前没有服务端持久化限流、用户账户、账单配额或滥用检测；上线收费前必须增加这些功能。
- 不要把生成图像当作永久存储：图片只返回浏览器，需自行下载。
- 模型使用 `gpt-image-1`，可用性、价格、项目权限以 OpenAI Platform 为准。
