const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const setupSocket = require('./config/socket');
const presentationRoutes = require('./routes/presentationRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (converted slide images)
app.use('/converted-slides', express.static(path.join(__dirname, 'converted-slides')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/presentations', presentationRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running 🚀' });
});

// Check in browser: http://localhost:5000/

app.get("/", (req, res) => {
  res.send("Backend is working");
});

// Setup Socket.IO
setupSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
    Server running on port ${PORT}          
    Socket.IO ready                      
    http://localhost:${PORT}
  `);
});
