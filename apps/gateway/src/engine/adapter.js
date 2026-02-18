/**
 * FreeKill/Sanguosha engine bridge adapter
 *
 * 通过 WebSocket 连接本机 /Users/apollomac/Project/sanguosha 后端，
 * 将 gateway 的 create/start/end 打通为真实引擎状态。
 */

const ENGINE_HTTP_BASE = process.env.ENGINE_HTTP_BASE || 'http://127.0.0.1:8000';
const ENGINE_WS_BASE = process.env.ENGINE_WS_BASE || 'ws://127.0.0.1:8000/ws';
const AUTO_PLAYER_COUNT = Number(process.env.ENGINE_AUTO_PLAYERS || 2);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

class EngineClient {
  constructor({ uid, name, onEvent }) {
    this.uid = uid;
    this.name = name;
    this.onEvent = onEvent;
    this.ws = null;
    this.connected = false;
    this.lastError = null;
  }

  async connect() {
    const url = `${ENGINE_WS_BASE}?uid=${encodeURIComponent(this.uid)}&name=${encodeURIComponent(this.name)}`;
    await withTimeout(
      new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        this.ws = ws;

        ws.addEventListener('open', () => {
          this.connected = true;
          resolve();
        });

        ws.addEventListener('message', (ev) => {
          const msg = safeJsonParse(ev.data);
          if (!msg?.type) return;

          if (msg.type === 'ping') {
            this.send('pong', {});
            return;
          }

          this.onEvent?.(msg, this);
        });

        ws.addEventListener('error', (err) => {
          this.lastError = err;
          reject(new Error(`ws error for ${this.uid}`));
        });

        ws.addEventListener('close', () => {
          this.connected = false;
        });
      }),
      8000,
      `connect ${this.uid}`
    );
  }

  send(type, data = {}, requestId = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, data, request_id: requestId }));
  }

  close() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}

export class EngineAdapter {
  constructor() {
    this.matches = new Map(); // matchId -> match state
  }

  _getMatch(matchId) {
    const m = this.matches.get(matchId);
    if (!m) throw new Error(`match not found: ${matchId}`);
    return m;
  }

  _snapshot(match) {
    return {
      matchId: match.matchId,
      roomId: match.roomId,
      mode: match.mode,
      players: match.players,
      state: match.state,
      engineRoomId: match.engineRoomId,
      createdAt: match.createdAt,
      startedAt: match.startedAt || null,
      endedAt: match.endedAt || null,
      endedReason: match.endedReason || null,
      lastEventAt: match.lastEventAt || null,
      lastRoomState: match.lastRoomState || null,
      lastGameState: match.lastGameState || null,
      gameEnded: !!match.gameEnded,
      winner: match.winner || null,
      eventsTail: match.events.slice(-20)
    };
  }

  async healthcheck() {
    const r = await fetch(`${ENGINE_HTTP_BASE}/api/health`);
    if (!r.ok) {
      throw new Error(`engine healthcheck failed: HTTP ${r.status}`);
    }
    return r.json();
  }

  async createMatch({ roomId, players, mode = 'identity' }) {
    await this.healthcheck();

    const matchId = `match_${roomId}_${Date.now()}`;
    const match = {
      matchId,
      roomId,
      mode,
      players,
      state: 'creating',
      createdAt: Date.now(),
      startedAt: null,
      endedAt: null,
      endedReason: null,
      engineRoomId: null,
      hostUid: `gw_host_${matchId.slice(-6)}`,
      clients: [],
      events: [],
      lastRoomState: null,
      lastGameState: null,
      gameEnded: false,
      winner: null,
      pendingCreate: null
    };

    const onEvent = (msg, client) => {
      match.lastEventAt = Date.now();
      match.events.push({ ts: match.lastEventAt, uid: client.uid, type: msg.type, data: msg.data, request_id: msg.request_id || null });

      if (msg.type === 'room_state') {
        match.lastRoomState = msg.data;
        if (!match.engineRoomId && msg.data?.room_id) {
          match.engineRoomId = msg.data.room_id;
        }
      }

      if (msg.type === 'game_state') {
        match.lastGameState = msg.data;
        if (match.state !== 'ended') match.state = 'running';
      }

      if (msg.type === 'game_end') {
        match.gameEnded = true;
        match.winner = msg.data?.winner_name || null;
        if (match.state !== 'ended') {
          match.state = 'finished';
        }
      }

      if (msg.type === 'hero_select_request') {
        const pick = msg.data?.heroes?.[0]?.hero_id || 'caocao';
        client.send('hero_select_response', { hero_id: pick }, msg.request_id || null);
      }

      if (msg.type === 'action_request') {
        const opts = msg.data?.options || [];
        const canCancel = msg.data?.can_cancel !== false;
        const selectedValue = opts[0]?.value ?? 0;
        client.send(
          'action_response',
          {
            cancelled: canCancel && opts.length === 0,
            selected: [selectedValue],
            selected_cards: [],
            selected_targets: []
          },
          msg.request_id || null
        );
      }
    };

    const host = new EngineClient({ uid: match.hostUid, name: `GWHost-${roomId.slice(-4)}`, onEvent });
    await host.connect();
    match.clients.push(host);

    const pendingCreate = withTimeout(
      new Promise((resolve, reject) => {
        const started = Date.now();
        const timer = setInterval(() => {
          if (match.engineRoomId) {
            clearInterval(timer);
            resolve(match.engineRoomId);
          } else if (Date.now() - started > 8000) {
            clearInterval(timer);
            reject(new Error('engine room create timeout'));
          }
        }, 100);
      }),
      9000,
      'wait room_state'
    );
    match.pendingCreate = pendingCreate;

    host.send('create_room', { name: `Portal-${roomId}`, max_players: Math.max(AUTO_PLAYER_COUNT, players.length), game_mode: mode });

    // 自动补足玩家（最少2）
    const needPlayers = Math.max(AUTO_PLAYER_COUNT, players.length);
    for (let i = 2; i <= needPlayers; i += 1) {
      const bot = new EngineClient({ uid: `gw_bot_${i}_${matchId.slice(-6)}`, name: `GWBot${i}`, onEvent });
      await bot.connect();
      match.clients.push(bot);
    }

    await pendingCreate;

    for (const client of match.clients.slice(1)) {
      client.send('join_room', { room_id: match.engineRoomId });
      await sleep(80);
    }

    for (const client of match.clients) {
      client.send('player_ready', { ready: true });
      await sleep(50);
    }

    match.state = 'created';
    this.matches.set(matchId, match);

    return {
      ok: true,
      matchId,
      roomId,
      players,
      state: match.state,
      engineRoomId: match.engineRoomId,
      engine: this._snapshot(match)
    };
  }

  async startMatch({ matchId }) {
    const match = this._getMatch(matchId);
    if (!match.engineRoomId) {
      throw new Error('engine room id missing');
    }

    const host = match.clients[0];
    host.send('set_game_mode', { mode: match.mode || 'identity' });
    await sleep(100);
    host.send('game_start', {});

    match.state = 'starting';
    match.startedAt = Date.now();

    // 等待至少一个 game_state 或 game_end
    await withTimeout(
      new Promise((resolve) => {
        const timer = setInterval(() => {
          if (match.lastGameState || match.gameEnded) {
            clearInterval(timer);
            resolve(true);
          }
        }, 120);
      }),
      10000,
      'wait game_state'
    ).catch(() => null);

    if (match.lastGameState) match.state = 'running';
    if (match.gameEnded) match.state = 'finished';

    return {
      ok: true,
      matchId,
      state: match.state,
      startedAt: match.startedAt,
      engine: this._snapshot(match)
    };
  }

  async endMatch({ matchId, reason = 'normal' }) {
    const match = this._getMatch(matchId);

    for (const c of match.clients) c.close();

    match.state = 'ended';
    match.endedReason = reason;
    match.endedAt = Date.now();

    return {
      ok: true,
      matchId,
      state: 'ended',
      reason,
      endedAt: match.endedAt,
      engine: this._snapshot(match)
    };
  }

  async getMatchStatus({ matchId }) {
    const match = this._getMatch(matchId);
    return { ok: true, engine: this._snapshot(match) };
  }
}

export const engineAdapter = new EngineAdapter();
