const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Add embed security middleware
const embedSecurityMiddleware = require('./middleware/embedSecurity.middleware');
app.use(embedSecurityMiddleware);

// Import routes
const authRoutes = require('./routes/auth.routes');
const pollRoutes = require('./routes/poll.routes');
const userRoutes = require('./routes/user.routes');
const notificationRoutes = require('./routes/notification.routes');
const searchRoutes = require('./routes/search.routes');
const embedRoutes = require('./routes/embed.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/embed', embedRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('DShare API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Handle joining poll rooms
  socket.on('join-poll', (pollId) => {
    socket.join(`poll:${pollId}`);
    console.log(`User ${socket.id} joined poll room: ${pollId}`);
  });
  
  // Handle joining user's private notification room
  socket.on('join-user', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User ${socket.id} joined user room: ${userId}`);
    }
  });
  
  // Handle leaving rooms
  socket.on('leave-poll', (pollId) => {
    socket.leave(`poll:${pollId}`);
    console.log(`User ${socket.id} left poll room: ${pollId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to our routes
app.set('io', io);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dshare';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
