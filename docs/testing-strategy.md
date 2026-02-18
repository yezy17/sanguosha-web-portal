# Testing Strategy

## Why current testing failed
- 只测函数，不测真实对局链路
- 缺少事件日志，bug 无法复现
- 协议状态未收敛，前后端各自“猜状态”

## New Testing Pyramid

### 1) Contract Tests (Gateway <-> Engine)
- 校验消息结构、状态迁移、错误码
- 防止协议变更导致隐性崩溃

### 2) Scenario Tests (Headless Match)
- 预设剧本：杀/闪/桃、死亡结算、回合切换
- 随机种子跑局，固定种子可重放

### 3) Smoke E2E (Portal)
- 游客进入 -> 建房 -> 邀请 -> 加入 -> 开局 -> 结束
- 每次 push 自动跑

## Replay First Rule
- 每局生成 event log（带 match_id、seed、版本）
- 任意线上问题都必须能映射到一个 replay 样本

## Exit Criteria (v0.1)
- P0 流程 e2e 通过率 >= 95%
- 关键剧本回归全部通过
- 已知 P1 级 bug 均有复现样本与修复记录
