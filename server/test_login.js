const http = require('http');

const data = JSON.stringify({ username: 'jingyu', password: '123456' });

const req = http.request(
  {
    hostname: 'localhost',
    port: 4000,
    path: '/api/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('status', res.statusCode);
      console.log(body);
    });
  }
);

req.on('error', (e) => console.error('request error', e));
req.write(data);
req.end();

