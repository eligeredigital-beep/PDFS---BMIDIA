/* Servidor local para testar o app com a IA, sem a Vercel.
   Uso: node dev-server.js   →   http://localhost:5180
   Lê NVIDIA_API_KEY (e opcionais NVIDIA_MODEL, ACCESS_CODE) do arquivo .env.local desta pasta. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5180;

// Relido a cada pedido: dá para colar a chave no .env.local sem reiniciar o servidor.
const envFile = path.join(ROOT, '.env.local');
function loadEnv() {
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();


const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.woff': 'font/woff', '.json': 'application/json' };
const APP = path.join(ROOT, 'app');

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/resumo') {
    loadEnv();
    // Recarrega o código a cada pedido: alterar o leitor ou o prompt vale na hora, sem reiniciar.
    for (const f of ['./api/resumo.js', './app/engine.js']) delete require.cache[require.resolve(f)];
    return require('./api/resumo.js')(req, res);
  }
  const rel = decodeURIComponent(url.pathname).replace(/^\/(app\/)?/, '') || 'index.html';
  const file = path.join(APP, rel);
  if (!file.startsWith(APP + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.statusCode = 404;
    return res.end('Não encontrado');
  }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`Resumos de reunião em http://localhost:${PORT}`);
  console.log(process.env.NVIDIA_API_KEY ? 'Chave da NVIDIA carregada de .env.local.' : 'Sem NVIDIA_API_KEY: crie o arquivo .env.local (veja .env.example).');
});
