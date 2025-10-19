const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const API_PORT = 8083;
const API_TARGET_URL = process.env.MY_ENVIRONMENT === "deploy" ? "http://nginx:8100/api" : 'https://genshinlohs.ru:8002'
const PROXY_URL = process.env.MY_ENVIRONMENT === "deploy" ? `http://hackathon-frontend:${API_PORT}` : `http://localhost:${API_PORT}`

// Включаем CORS для всех origin в разработке
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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
    target: API_TARGET_URL
  });
});

// API Proxy configuration
const apiProxyOptions = {
  target: API_TARGET_URL,
  changeOrigin: true,
  secure: false, // Игнорируем SSL сертификаты для HTTPS
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[API Proxy] ${req.method} ${req.url} -> ${API_TARGET_URL}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Добавляем CORS заголовки к ответу от API
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    console.log(`[API Proxy] Response status: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[API Proxy] Error:', err.message);
    res.status(500).json({
      error: 'Proxy error',
      details: err.message,
      url: req.url
    });
  }
};

// Проксируем все API запросы
app.use('/api', createProxyMiddleware(apiProxyOptions));

app.listen(API_PORT, '0.0.0.0', () => {
  console.log(`=== API Proxy Server ===`);
  console.log(`Server running on: ${PROXY_URL}`);
  console.log(`Proxying API requests to: ${API_TARGET_URL}`);
  console.log(`Health check: http://localhost:${API_PORT}/health`);
  console.log(`Usage: ${PROXY_URL}/api/* -> ${API_TARGET_URL}/*`);
  console.log(`========================`);
});
