# 免费真实生图：Cloudflare Workers AI
1. 手机登录 Cloudflare → Workers & Pages → nebula-ai-api → Settings → Bindings → Add → Workers AI，绑定变量名填写 AI，保存。
2. 确认 Variables and Secrets 已有 STUDIO_ACCESS_CODE（Secret）。不需要为免费模式配置 OpenAI API Key。
3. 确认最新 GitHub worker/worker.js 已部署到同一个 Cloudflare Worker。GitHub 代码更新不代表 Cloudflare Worker 自动更新。
4. 打开 image.html，选择 Cloudflare FLUX 免费额度，输入私人访问码和描述，点击开始真实生成。
5. 若出现 404，Worker 代码尚未部署；AI binding missing 则未绑定；401 则访问码不正确。
安全：当前只有共享访问码，没有可靠的跨实例每日限额，不得公开访问码或对外开放。先核实账户免费套餐、用量和模型许可，不要升级付费套餐。
参考：https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/