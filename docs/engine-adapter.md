# Engine Adapter Contract (Draft)

## Purpose
隔离 Web 门户和具体引擎实现，先稳定 API，再替换底层（主选 FreeKill）。

## Required Methods
- `createMatch({ roomId, players })`
- `startMatch({ matchId })`
- `endMatch({ matchId, reason })`

## Phase Plan
1. Stub adapter（当前）
2. FreeKill bridge（子进程/服务桥接）
3. Replay hooks（match event output）
