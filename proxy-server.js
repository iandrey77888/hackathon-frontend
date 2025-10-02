const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { Buffer } = require('buffer');

const app = express();
const PORT = 8082;
const TARGET_HOST = 'genshinlohs.ru:8080';
const TARGET_URL = `http://${TARGET_HOST}`;
const PROXY_URL = `http://localhost:${PORT}`;

// Включаем CORS для всех origin в разработке
app.use(cors({ origin: '*' }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    proxy: PROXY_URL,
    target: TARGET_URL
  });
});

// Эндпоинт для проверки доступности основного сервера
app.get('/proxy-status', async (req, res) => {
  try {
    const testResponse = await fetch(`${TARGET_URL}/styles/basic-preview/style.json`);
    res.json({
      proxy: 'running',
      target: testResponse.ok ? 'available' : 'unavailable',
      statusCode: testResponse.status
    });
  } catch (error) {
    res.json({
      proxy: 'running',
      target: 'unavailable',
      error: error.message
    });
  }
});

const proxyOptions = {
  target: TARGET_URL,
  changeOrigin: true,
  logLevel: 'debug',
  selfHandleResponse: true,
  onProxyRes: (proxyRes, req, res) => {
    const isJson = proxyRes.headers['content-type']?.includes('application/json');

    if (isJson) {
      let body = [];
      proxyRes.on('data', (chunk) => body.push(chunk));
      proxyRes.on('end', () => {
        try {
          const bodyString = Buffer.concat(body).toString();
          const modifiedBody = bodyString.replace(new RegExp(TARGET_URL, 'g'), PROXY_URL);
          
          console.log(`[Proxy] Modified JSON response for: ${req.originalUrl}`);
          
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Length', Buffer.byteLength(modifiedBody));
          res.status(proxyRes.statusCode).end(modifiedBody);

        } catch (error) {
            console.error('Error modifying JSON response:', error);
            res.status(500).send('Error processing proxied response.');
        }
      });
    } else {
      console.log(`[Proxy] Piping non-JSON response for: ${req.originalUrl}`);
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
};

// Проксируем все запросы
app.use('/', createProxyMiddleware(proxyOptions));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== Smart Map Tiles Proxy Server ===`);
  console.log(`Server running on: ${PROXY_URL}`);
  console.log(`Proxying from: ${TARGET_URL}`);
  console.log(`Health check: ${PROXY_URL}/health`);
  console.log(`====================================`);
});