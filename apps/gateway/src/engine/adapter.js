/**
 * Engine Adapter abstraction
 * Phase-1: stub implementation for API contract stabilization
 * Phase-2: plug FreeKill bridge implementation
 */

export class EngineAdapter {
  async createMatch({ roomId, players }) {
    return {
      ok: true,
      matchId: `match_${roomId}_${Date.now()}`,
      roomId,
      players,
      state: 'created'
    };
  }

  async startMatch({ matchId }) {
    return {
      ok: true,
      matchId,
      state: 'started',
      startedAt: Date.now()
    };
  }

  async endMatch({ matchId, reason = 'normal' }) {
    return {
      ok: true,
      matchId,
      state: 'ended',
      reason,
      endedAt: Date.now()
    };
  }
}

export const engineAdapter = new EngineAdapter();
