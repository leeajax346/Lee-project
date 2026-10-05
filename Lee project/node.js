# Using npm
npm install socket.io

# Or using Yarn
yarn add socket.io
<script src="https://cdn.socket.io/4.5.0/socket.io.min.js"></script>
# Install the client library
npm install socket.io-client

# Or using Yarn
yarn add socket.io-client
import { io } from 'socket.io-client';
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Simple route
app.get('/', (req, res) => {
;  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle new messages
  socket.on('chat message', (msg) => {
    console.log('Message received:', msg);
    // Broadcast the message to all connected clients
      io.emit('chat message', msg);
    });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});