import http from 'node:http';

const port = Number(process.env.PORT || 8787);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, service: 'gateway', ts: Date.now() }));
    return;
  }

  if (req.url === '/api/auth/guest' && req.method === 'POST') {
    const guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, guestId }));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: false, error: 'Not Found' }));
});

server.listen(port, () => {
  console.log(`[gateway] listening on :${port}`);
});
