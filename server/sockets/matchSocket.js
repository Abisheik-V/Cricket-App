const { Match } = require('../models');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a match room for live updates
    socket.on('match:join', async ({ matchId }) => {
      socket.join(`match:${matchId}`);
      console.log(`Socket ${socket.id} joined match:${matchId}`);

      // Send current match state on join
      try {
        const match = await Match.findById(matchId).lean();
        if (match) socket.emit('match:state', { match });
      } catch (err) {
        socket.emit('error', { message: 'Match not found' });
      }
    });

    socket.on('match:leave', ({ matchId }) => {
      socket.leave(`match:${matchId}`);
    });

    // Admin broadcasts score update (for multi-device scoring)
    socket.on('match:adminUpdate', ({ matchId, liveScore }) => {
      socket.to(`match:${matchId}`).emit('match:scoreUpdate', { matchId, liveScore });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
