# Architecture

## 1) Design Choice
**Mature Engine Core + Web Portal Gateway**

- 游戏规则、判定、局内状态机：由成熟引擎负责
- 账号、大厅、房间、邀请链接、分享体验：由 Web 门户负责

## 2) Components

### apps/web
- 登录/游客进入
- 大厅与房间列表
- 邀请链接（`/invite/:code`）
- 对局 UI 外壳（观战、重连入口）

### apps/gateway
- Auth（可选账号，支持游客）
- Lobby & Room Service
- Invite Service（短码生成/校验）
- Engine Adapter（桥接成熟引擎）
- Replay Service（事件日志索引与下载）

### engine-core (external)
- 作为外部服务或子系统接入
- Gateway 仅通过协议层交互，不耦合实现细节

## 3) Non-Functional Priorities
1. Correctness > Fancy UI
2. Replayability > Debug Guessing
3. Shareability > Heavy onboarding

## 4) Minimal End-to-End Flow
1. 用户打开 web 门户（可游客）
2. 创建房间 -> 生成邀请链接
3. 朋友通过链接加入
4. Gateway 建立对局会话并调用引擎开局
5. 对局事件写入 event log
6. 结束后保存战绩与 replay 索引
