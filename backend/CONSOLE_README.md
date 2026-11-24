# Nebula Console — 开发预览

本次改动仅在 `feature/nebula-trend-ai-platform` 分支，未部署到生产环境，也未修改 `main`。

## 文件
- `console.html`：响应式管理控制台（概览、模型广场、虚拟模型、日志、设置）
- `backend/admin.mjs`：独立管理员 API、模型目录、虚拟模型配置和调用事件
- `backend/server.mjs`：连接管理员 API 与原有图片任务 API

## 本地启动（Node.js 20+）
```bash
export ADMIN_ACCESS_CODE='replace-with-long-random-secret'
export STUDIO_ACCESS_CODE='different-development-secret'
export ALLOWED_ORIGIN='http://localhost:8080'
export ZHIPU_API_KEY='your-secret-key'
node backend/server.mjs
```
另开终端：`python3 -m http.server 8080`，浏览器打开 `http://localhost:8080/console.html`，API 地址填 `http://localhost:9000`。开发时请勿在公网暴露端口。

## API
- `GET /health`：健康检查
- `GET /api/admin/overview`：当前进程事件概览
- `GET /api/admin/models`：模型目录和是否配置环境变量
- `GET /api/admin/events`：最近调用事件（不包含原始提示词和密钥）
- `GET /api/admin/virtual-models`：虚拟模型配置列表
- `POST /api/admin/virtual-models`：创建虚拟模型配置（默认 disabled）

所有 `/api/admin/*` 请求必须带 `X-Admin-Code`。此机制仅用于开发预览，不是生产级管理员会话。

## 已知限制（上线阻断项）
1. 数据仅在进程内存中，重启丢失；尚无数据库和备份。
2. 未接入 OpenAI、豆包、可灵、DeepSeek 等真实供应商；目录展示不代表可调用。
3. 虚拟模型仅可保存配置，尚未实现路由、故障切换、参数绑定。
4. 调用事件不是精确请求账单；成本字段为空，不可据此核算利润。
5. 管理员访问码是开发态共享密钥，正式环境需换成安全会话、RBAC、审计、限流和密钥托管。
6. 用户侧限流和任务记录仍为内存原型，不可直接用于商业收费或积分结算。
7. 未执行线上端到端测试；部署前必须完成接口测试与安全审查。

## 安全
绝不将供应商 API Key 写入公开仓库或网页。浏览器管理页面不会持久化管理员访问码。管理员接口应仅部署于受保护的 HTTPS 环境；不建议直接对公网开放此开发原型。
