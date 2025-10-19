const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { Buffer } = require('buffer');

const app = express();
const PORT = 8082;
const TARGET_HOST = process.env.MY_ENVIRONMENT === "deploy" ? "nginx:8100/map" : 'genshinlohs.ru:8080'
const TARGET_URL = process.env.MY_ENVIRONMENT === "deploy" ? `http://${TARGET_HOST}` : `https://${TARGET_HOST}`; // Используем HTTPS!
const PROXY_URL = process.env.MY_ENVIRONMENT === "deploy" ? `http://hackathon-frontend:${PORT}` : `http://localhost:${PORT}`

// Включаем CORS для всех origin в разработке
app.use(cors({ origin: '*' }));

// Логирование запросов
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
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
  secure: false, // Игнорируем проверку SSL сертификата
  logLevel: 'warn', // Изменили на warn чтобы уменьшить логирование
  selfHandleResponse: true,
  timeout: 30000, // 30 секунд таймаут
  proxyTimeout: 30000,
  onProxyRes: (proxyRes, req, res) => {
    const isJson = proxyRes.headers['content-type']?.includes('application/json');

    // Добавляем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (isJson) {
      let body = [];
      proxyRes.on('data', (chunk) => body.push(chunk));
      proxyRes.on('end', () => {
        try {
          const bodyString = Buffer.concat(body).toString();
          // Заменяем все возможные варианты URL
          let modifiedBody = bodyString
            .replace(new RegExp(TARGET_URL, 'g'), PROXY_URL)
            .replace(new RegExp(`https://${TARGET_HOST}`, 'g'), PROXY_URL)
            .replace(new RegExp(`http://${TARGET_HOST}`, 'g'), PROXY_URL)
            .replace(new RegExp(TARGET_HOST, 'g'), `localhost:${PORT}`);

          // Логируем замену URL для style.json
          if (req.originalUrl.includes('style.json')) {
            const originalUrls = (bodyString.match(/genshinlohs\.ru:8080/g) || []).length;
            const replacedUrls = (modifiedBody.match(/localhost:8082/g) || []).length;
            console.log(`[Proxy] Modified style.json: replaced ${replacedUrls} URLs (found ${originalUrls} original URLs)`);
          }

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Length', Buffer.byteLength(modifiedBody));
          res.status(proxyRes.statusCode).end(modifiedBody);

        } catch (error) {
            console.error('Error modifying JSON response:', error);
            res.status(500).send('Error processing proxied response.');
        }
      });

      proxyRes.on('error', (err) => {
        console.error('Error reading response:', err);
        if (!res.headersSent) {
          res.status(500).send('Error reading proxied response.');
        }
      });
    } else {
      // Логируем тип контента для не-JSON ответов (например, тайлы)
      const contentType = proxyRes.headers['content-type'] || 'unknown';
      console.log(`[Proxy] Piping ${contentType} for: ${req.originalUrl}`);
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res).on('error', (err) => {
        console.error('Error piping response:', err);
        if (!res.headersSent) {
          res.status(500).end('Error piping response.');
        }
      });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    // Добавляем заголовки к исходящему запросу
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  },
  onError: (err, req, res) => {
    console.error('[Proxy] Error:', err.message, 'for:', req.url);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Proxy error',
        details: err.message,
        url: req.url
      });
    }
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