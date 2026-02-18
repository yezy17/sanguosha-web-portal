import http from 'node:http';
import { engineAdapter } from './engine/adapter.js';
import { createRoom, joinByInvite, getRoom, setRoomStatus } from './room/service.js';

const port = Number(process.env.PORT || 8787);

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

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') return send(res, 200, { ok: true, service: 'gateway', ts: Date.now() });

  if (req.url === '/api/auth/guest' && req.method === 'POST') {
    const guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
    return send(res, 200, { ok: true, guestId });
  }

  if (req.url === '/api/rooms' && req.method === 'POST') {
    const { hostId } = await readJson(req);
    if (!hostId) return send(res, 400, { ok: false, error: 'hostId required' });
    const room = createRoom({ hostId });
    return send(res, 200, { ok: true, room });
  }

  if (req.url === '/api/rooms/join' && req.method === 'POST') {
    const { inviteCode, playerId } = await readJson(req);
    const result = joinByInvite({ inviteCode, playerId });
    return send(res, result.ok ? 200 : 404, result);
  }

  if (req.url === '/api/match/start' && req.method === 'POST') {
    const { roomId } = await readJson(req);
    const room = getRoom(roomId);
    if (!room) return send(res, 404, { ok: false, error: 'ROOM_NOT_FOUND' });

    const created = await engineAdapter.createMatch({ roomId: room.roomId, players: room.players });
    const started = await engineAdapter.startMatch({ matchId: created.matchId });
    setRoomStatus(room.roomId, 'in_game');

    return send(res, 200, { ok: true, created, started, room: getRoom(room.roomId) });
  }

  return send(res, 404, { ok: false, error: 'Not Found' });
});

server.listen(port, () => {
  console.log(`[gateway] listening on :${port}`);
});
