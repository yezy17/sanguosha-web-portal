# 2-Week Roadmap

## Week 1

### Day 0 - Planning & Repo Bootstrap
- [x] 新仓初始化
- [x] 架构与路线图文档
- [ ] issue 看板与里程碑拆分

### Day 1-2 - Portal Skeleton
- [ ] web: 登录/游客入口页
- [ ] gateway: health/auth/lobby 基础 API
- [ ] shared: 基础 DTO 与校验

### Day 3-4 - Room & Invite
- [ ] 创建房间 API
- [ ] 邀请码生成与加入流程
- [ ] 前端房间页 + 链接分享入口

### Day 5-6 - Engine PoC
- [ ] Gateway 与引擎建立最小适配接口
- [ ] 打通“创建房间 -> 开局 -> 结束”
- [ ] 记录第一版协议文档

## Week 2

### Day 7-8 - Replay & Reproducibility
- [ ] event log（按局）
- [ ] replay 导出与回放入口（CLI/接口）
- [ ] 至少 2 个历史 bug 可稳定复现

### Day 9-10 - UI Usability Pass
- [ ] 大厅/房间基础视觉升级
- [ ] 明确在线状态、准备状态、重连提示

### Day 11-12 - Automated Regression
- [ ] smoke e2e：建房、加入、开局、结束
- [ ] headless 对局回归（最小集）

### Day 13-14 - Hardening & Beta
- [ ] 部署脚本与发布说明
- [ ] beta 邀请测试（朋友联机）
- [ ] 收集反馈并定 v0.1 修复列表
