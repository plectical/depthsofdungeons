const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4444;
const DIR = __dirname;

const mime = {
  '.js':   'application/javascript',
  '.html': 'text/html',
  '.json': 'application/json',
};

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const file = path.join(DIR, req.url.split('?')[0]);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found: ' + req.url); return; }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('Serving ' + DIR);
  console.log('Open: http://localhost:' + PORT + '/profiler.js');
});
