# task_plan.md

## 目标
在 `sanguosha-web-portal` 完成“服务器端接入开源三国杀引擎并可玩”的 MVP：
- Gateway 不再返回纯 stub，引擎状态来自真实后端（优先复用 `/Users/apollomac/Project/sanguosha`）。
- 至少打通 `create/start/end`。
- 提供一键启动方案（docker-compose 或脚本）。
- 提供最小验收脚本，验证 登录→建房→开局→基础回合可跑。

## 约束
- 兼容当前 gateway 简易 HTTP API。
- 本地优先：默认连接 `127.0.0.1:8000` 的现有引擎服务。
- 若完整前端回合依赖 WebSocket，至少提供可复现步骤与日志证据。

## 实施步骤
1. **现状盘点**
   - 阅读 `apps/gateway/src/engine/adapter.js` 和 `apps/gateway/src/server.js`。
   - 确认当前仅 stub，缺失状态查询与结束 API。
2. **引擎桥接实现**
   - 在 adapter 中实现：
     - 引擎健康检查（HTTP `/api/health`）
     - WebSocket 客户端连接（host + bot）
     - `createMatch/startMatch/endMatch/getMatchStatus`
   - 自动处理引擎交互消息（hero_select/action_request）。
3. **Gateway API 补齐**
   - 新增 `POST /api/match/end`
   - 新增 `GET /api/match/status/:matchId`
4. **一键启动能力**
   - 增加 `docker-compose.yml`
   - 增加 `scripts/start-mvp.sh`
5. **验收与证据沉淀**
   - 增加 `scripts/mvp-acceptance.sh`
   - 执行并记录关键输出到 `findings.md`
6. **里程碑记录**
   - 每完成一个阶段，更新 `progress.md`。

## 验收标准
- `POST /api/match/start` 返回的 `created/started.engine` 含真实引擎房间与状态。
- `GET /api/match/status/:id` 可见 `game_state/game_end` 等实时结果摘要。
- 验收脚本能跑通登录→建房→开局→至少一次有效回合推进（日志或 game_state 变化证明）。
