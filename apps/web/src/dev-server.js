import http from 'node:http';

const port = Number(process.env.PORT || 5173);
const gateway = process.env.GATEWAY_URL || 'http://localhost:8787';

const html = `<!doctype html>
<html>
  <head><meta charset="utf-8"/><title>Sanguosha Portal</title></head>
  <body style="font-family: sans-serif; max-width: 760px; margin: 40px auto;">
    <h1>Sanguosha Web Portal</h1>
    <p>标准包 | 身份场 + 1v1 | 必须登录</p>

    <div style="border:1px solid #ddd;padding:12px;margin:12px 0;">
      <h3>登录</h3>
      <input id="u" placeholder="username" value="admin" />
      <input id="p" placeholder="password" type="password" />
      <button id="login">Login</button>
    </div>

    <div style="border:1px solid #ddd;padding:12px;margin:12px 0;">
      <h3>调试操作</h3>
      <button id="health">Health</button>
      <button id="modes">Modes</button>
      <button id="create">Create Room</button>
    </div>

    <pre id="out"></pre>

    <script>
      const out = document.getElementById('out');
      let token = '';

      async function j(url, init={}) {
        const headers = Object.assign({ 'content-type': 'application/json' }, init.headers || {});
        if (token) headers.authorization = 'Bearer ' + token;
        const r = await fetch(url, Object.assign({}, init, { headers }));
        const data = await r.json();
        out.textContent = JSON.stringify({ status: r.status, data }, null, 2);
        return data;
      }

      login.onclick = async () => {
        const data = await j('${gateway}/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: u.value, password: p.value })
        });
        if (data.ok) token = data.token;
      };
      health.onclick = () => j('${gateway}/health');
      modes.onclick = () => j('${gateway}/api/modes');
      create.onclick = () => j('${gateway}/api/rooms', { method: 'POST', body: '{}' });
    </script>
  </body>
</html>`;

http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(port, () => {
  console.log(`[web] dev page on :${port}`);
});
