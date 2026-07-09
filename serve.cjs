// Minimal static file server for local testing (Clerk needs http, not file://).
// Run:  node serve.cjs      then open  http://localhost:8080/tracker/
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = 8080;
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
  '.webp':'image/webp', '.json':'application/json', '.pdf':'application/pdf', '.woff2':'font/woff2' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let fp = path.join(root, p);
  fs.stat(fp, (e, st) => {
    if (!e && st.isDirectory()) fp = path.join(fp, 'index.html');
    fs.readFile(fp, (er, data) => {
      if (er) { res.writeHead(404, { 'content-type':'text/plain' }); res.end('404 Not Found'); return; }
      res.writeHead(200, { 'content-type': types[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
      res.end(data);
    });
  });
}).listen(port, () => console.log('Serving ' + root + '\n=> open http://localhost:' + port + '/tracker/'));
