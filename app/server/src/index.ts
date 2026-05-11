import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Backend server running on port 5002\n');
});

server.listen(5002, () => {
  console.log('Server started and listening on http://localhost:5002/');
});
