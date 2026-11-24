# 星云阿里云 FC 增量部署包（尚未部署）
本目录提供可复用的 Node.js 20 FC 入口。**现有线上代码没有自动导出到 GitHub**，因此本目录不能单独部署。

## 部署包组成
- `index.js`：组合入口，先处理 `/api/admin/*`，其余请求转发到原有 `handler`。
- `legacy-index.js`：必须从现有阿里云 FC 的 `index.js` **完整导出并另存**；此文件包含用户原有代码，不提交到公开仓库。
- `fc-admin-adapter.cjs`：从仓库 `backend/fc-admin-adapter.cjs` 复制到部署包根目录的上级 `backend` 路径，或调整 `require` 相对路径。推荐最终目录结构如下：
```
bundle/
  index.js                 # 将 backend/fc-deploy/index.js 的 require 改为 './fc-admin-adapter.cjs'
  legacy-index.js          # 原线上 index.js 的完整副本
  fc-admin-adapter.cjs     # backend/fc-admin-adapter.cjs
  package.json             # 原函数 package.json
```
注意：为避免修改源代码中的相对路径，打包时需将组合入口中 `require('../fc-admin-adapter.cjs')` 修改为 `require('./fc-admin-adapter.cjs')`。建议由自动打包脚本完成，而非在手机编辑器里手工替换。

## 上线前核验
1. 备份现有函数代码和环境变量**名称**，保存可回滚版本；不要公开密钥值。
2. 确认原函数入口仍是 `index.handler`，Node.js 20，`legacy-index.js` 完整。
3. 在阿里云函数环境变量设置独立 `ADMIN_ACCESS_CODE`，不要复用前端口令；配置 `ALLOWED_ORIGIN` 为正式站点来源。
4. 先部署到**独立测试函数或测试别名**，验证原 `/health`、对话和生图接口无回归，再检查 `/api/admin/models` 的 401/200 行为。
5. 确认测试无误后，再安排原函数的可回滚发布。**不要直接覆盖生产 LATEST。**

## 当前限制
- 虚拟模型和调用事件使用实例内存；FC 扩缩容或冷启动会丢失，不能当真实账单。
- API 仅使用静态管理员访问码；正式商用前需要登录、角色权限、密钥加密、持久化数据库和审计。
- 管理端不能展示、收集或回传真实 API Key。
- 不能仅凭截图重建原函数完整代码；须取得完整备份后才能安全部署。
