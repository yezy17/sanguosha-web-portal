import http from 'node:http';
import crypto from 'node:crypto';
import { engineAdapter } from './engine/adapter.js';
import { createRoom, joinByInvite, getRoom, setRoomStatus } from './room/service.js';

const port = Number(process.env.PORT || 8787);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CHANGE_ME';

const sessions = new Map(); // token -> { userId, username }

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function send(res, code, payload) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function authUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  return sessions.get(token) || null;
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    return send(res, 200, {
      ok: true,
      service: 'gateway',
      ts: Date.now(),
      modes: ['identity', '1v1'],
      package: 'standard',
      authRequired: true,
      guestEnabled: false
    });
  }

  if (req.url === '/api/auth/login' && req.method === 'POST') {
    const { username, password } = await readJson(req);
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return send(res, 401, { ok: false, error: 'INVALID_CREDENTIALS' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    const user = { userId: 'user_admin', username: ADMIN_USERNAME };
    sessions.set(token, user);
    return send(res, 200, { ok: true, token, user });
  }

  if (req.url === '/api/auth/guest' && req.method === 'POST') {
    return send(res, 403, { ok: false, error: 'GUEST_DISABLED' });
  }

  if (req.url === '/api/modes' && req.method === 'GET') {
    return send(res, 200, { ok: true, modes: ['identity', '1v1'], package: 'standard' });
  }

  const user = authUser(req);
  if (!user) return send(res, 401, { ok: false, error: 'UNAUTHORIZED' });

  if (req.url === '/api/rooms' && req.method === 'POST') {
    const room = createRoom({ hostId: user.userId });
    return send(res, 200, { ok: true, room });
  }

  if (req.url === '/api/rooms/join' && req.method === 'POST') {
    const { inviteCode } = await readJson(req);
    const result = joinByInvite({ inviteCode, playerId: user.userId });
    return send(res, result.ok ? 200 : 404, result);
  }

  if (req.url === '/api/match/start' && req.method === 'POST') {
    const { roomId, mode = 'identity' } = await readJson(req);
    if (!['identity', '1v1'].includes(mode)) {
      return send(res, 400, { ok: false, error: 'MODE_NOT_ALLOWED' });
    }

    const room = getRoom(roomId);
    if (!room) return send(res, 404, { ok: false, error: 'ROOM_NOT_FOUND' });

    const created = await engineAdapter.createMatch({
      roomId: room.roomId,
      players: room.players,
      mode,
      cardPackage: 'standard'
    });
    const started = await engineAdapter.startMatch({ matchId: created.matchId });
    setRoomStatus(room.roomId, 'in_game');

    return send(res, 200, { ok: true, created, started, room: getRoom(room.roomId) });
  }

  return send(res, 404, { ok: false, error: 'Not Found' });
});

server.listen(port, () => {
  console.log(`[gateway] listening on :${port}`);
});
