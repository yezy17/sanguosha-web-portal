# findings.md

## 关键发现
1. `apps/gateway/src/engine/adapter.js` 原实现为纯内存 stub，不连接任何真实引擎。
2. 可复用后端位于 `/Users/apollomac/Project/sanguosha/backend/server.py`：
   - HTTP 健康检查：`/api/health`
   - WebSocket：`/ws?uid=xxx&name=xxx`（默认 `AUTH_DISABLED=true`）
   - 房间/游戏消息类型与协议明确（`create_room/join_room/game_start/hero_select_request/action_request` 等）。
3. 本机直接 `python3 server.py` 缺少依赖（fastapi/uvicorn），需使用已有虚拟环境：
   - `./.venv/bin/python server.py --host 127.0.0.1 --port 8000`
4. 实测通过 gateway 启动对局后，`started.engine.lastGameState` 返回真实牌局状态，包含：
   - 当前行动玩家、阶段、血量、手牌数、装备
   - game_log（例如“使用【杀】”“受到伤害”等）
   - `game_end` 赢家信息
5. 由于当前 gateway 房间层只有一个登录用户，为满足最小可玩性，adapter 在引擎层自动补 1 个 bot 玩家，保证能开局并推进基础回合。

## 实测证据摘要（2026-02-18）
- 验收脚本：`./scripts/mvp-acceptance.sh`
- 结果：
  - login 成功
  - create room 成功（示例 `room_641ziyz3`）
  - start match 成功（示例 `match_room_641ziyz3_1771425596600`）
  - status 首次轮询即 `finished`，并带完整 `lastGameState` 与 `game_end` 结果
  - end match 成功（state=`ended`）
- 对局日志中可见多条有效回合行为：
  - “对 XX 使用【杀】”
  - “受到 1 点伤害”
  - “装备【青釭剑】”
  - “使用【铁索连环】”

## 已知问题/限制
1. adapter 的自动决策为 MVP 级“默认选第一个选项”，策略较弱但可驱动对局流程。
2. `mode` 在 gateway 仍限制为 `identity/1v1`，而引擎侧实际以 identity 自动跑通；`1v1` 兼容性需后续专项验证。
3. docker-compose 依赖上级目录 `../sanguosha` 作为引擎构建上下文；跨机器迁移时需同步该目录或改为远程镜像。
