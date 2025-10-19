const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;
const API_BASE_URL = 'http://genshinlohs.ru:8002';

app.use(cors());
app.use(express.json());

// Прокси для получения токена
app.post('/users/token', async (req, res) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy token error:', error);
    res.status(500).json({ error: 'Proxy server error' });
  }
});

// Прокси для получения информации о пользователе
app.get('/users/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy user info error:', error);
    res.status(500).json({ error: 'Proxy server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Proxying to: ${API_BASE_URL}`);
});