import http from 'http';

const PORT = process.env.PORT || 5002;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Backend server running on port ${PORT}\n`);
});

server.listen(PORT, () => {
  console.log(`Server started and listening on port ${PORT}`);
});