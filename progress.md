# progress.md

## 2026-02-18 MVP 交付进度

### Milestone 1 - 规划与基线盘点（完成）
- 建立 `task_plan.md`，明确目标、步骤、验收标准。
- 确认 gateway 现状为 stub，未接入真实引擎。

### Milestone 2 - 引擎桥接实现（完成）
- 将 `apps/gateway/src/engine/adapter.js` 升级为真实桥接：
  - HTTP 健康检查
  - WebSocket 连接引擎（host + bot）
  - 打通 `createMatch/startMatch/endMatch`
  - 新增 `getMatchStatus`
  - 自动响应 `hero_select_request/action_request`

### Milestone 3 - Gateway API 扩展（完成）
- 更新 `apps/gateway/src/server.js`：
  - 增加 `POST /api/match/end`
  - 增加 `GET /api/match/status/:matchId`
  - 加入基础错误捕获，避免引擎异常导致进程崩溃。

### Milestone 4 - 一键启动（完成）
- 新增 `docker-compose.yml`（engine + gateway）。
- 新增 `apps/gateway/Dockerfile`。
- 新增 `scripts/start-mvp.sh`。

### Milestone 5 - 最小验收脚本与实测（完成）
- 新增 `scripts/mvp-acceptance.sh`：
  - 登录→建房→开局→轮询状态→结束对局。
- 本地实测通过，获得真实引擎 `game_state/game_end` 数据。
- 关键证据与限制已记录到 `findings.md`。
