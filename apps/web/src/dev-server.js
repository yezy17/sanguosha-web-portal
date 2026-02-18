import http from 'node:http';

const port = Number(process.env.PORT || 5173);
const gateway = process.env.GATEWAY_URL || 'http://localhost:8787';

const html = `<!doctype html>
<html>
  <head><meta charset="utf-8"/><title>Sanguosha Portal</title></head>
  <body style="font-family: sans-serif; max-width: 720px; margin: 40px auto;">
    <h1>Sanguosha Web Portal (Skeleton)</h1>
    <p>目标：游客进入 + 大厅入口 + 健康联通</p>
    <button id="health">Check Gateway Health</button>
    <button id="guest">Guest Login</button>
    <pre id="out"></pre>
    <script>
      const out = document.getElementById('out');
      document.getElementById('health').onclick = async () => {
        const r = await fetch('${gateway}/health');
        out.textContent = JSON.stringify(await r.json(), null, 2);
      };
      document.getElementById('guest').onclick = async () => {
        const r = await fetch('${gateway}/api/auth/guest', { method: 'POST' });
        out.textContent = JSON.stringify(await r.json(), null, 2);
      };
    </script>
  </body>
</html>`;

http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(port, () => {
  console.log(`[web] dev page on :${port}`);
});
