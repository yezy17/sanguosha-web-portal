const rooms = new Map();

function makeInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function createRoom({ hostId }) {
  const roomId = `room_${Math.random().toString(36).slice(2, 10)}`;
  const inviteCode = makeInviteCode();
  const room = {
    roomId,
    inviteCode,
    hostId,
    players: [hostId],
    status: 'lobby',
    createdAt: Date.now()
  };
  rooms.set(roomId, room);
  return room;
}

export function joinByInvite({ inviteCode, playerId }) {
  const room = Array.from(rooms.values()).find((r) => r.inviteCode === inviteCode);
  if (!room) return { ok: false, error: 'INVITE_NOT_FOUND' };
  if (!room.players.includes(playerId)) room.players.push(playerId);
  return { ok: true, room };
}

export function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

export function setRoomStatus(roomId, status) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.status = status;
  return room;
}
