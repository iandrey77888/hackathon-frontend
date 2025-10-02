// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    return async (req, res, next) => {
      if (req.url.startsWith('/map-proxy/')) {
        try {
          // Handle CORS preflight
          if (req.method === 'OPTIONS') {
            res.writeHead(204, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
              'Access-Control-Max-Age': '86400'
            });
            res.end();
            return;
          }

          const targetUrl = req.url.replace('/map-proxy/', 'http://192.168.88.193:8080/');
          console.log(`Proxying: ${req.method} ${targetUrl}`);

          const fetchOptions = {
            method: req.method,
            headers: {
              ...req.headers,
              'host': '192.168.88.193:8080' // Fix host header for target server
            }
          };

          // Remove problematic headers
          delete fetchOptions.headers['connection'];
          delete fetchOptions.headers['content-length'];

          const response = await fetch(targetUrl, fetchOptions);

          // Set CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');

          // Copy response headers (filter problematic ones)
          for (const [key, value] of response.headers) {
            if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
              res.setHeader(key, value);
            }
          }

          // Handle different content types
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            res.end(JSON.stringify(data));
          } else {
            const buffer = await response.buffer();
            res.end(buffer);
          }

        } catch (error) {
          console.error('Proxy error:', error);
          res.writeHead(500, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify({ 
            error: 'Proxy failed', 
            message: error.message 
          }));
        }
        return;
      }
      
      return metroMiddleware(req, res, next);
    };
  },
};
module.exports = config;