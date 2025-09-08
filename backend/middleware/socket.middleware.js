// Middleware to attach socket.io instance to the request
const socketMiddleware = (req, res, next) => {
  req.io = req.app.get('io');
  next();
};

module.exports = socketMiddleware;
