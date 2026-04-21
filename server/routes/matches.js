const express = require('express');
const router = express.Router();
const {
  startMatch, recordScore, undoLastBall, editMatch,
  getHistory, getMatch, deleteMatch, completeMatch,
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.get('/history', getHistory);
router.get('/:id', getMatch);
router.post('/start', protect, startMatch);
router.post('/score', protect, recordScore);
router.post('/undo', protect, undoLastBall);
router.patch('/edit/:id', protect, editMatch);
router.patch('/:id/complete', protect, completeMatch);
router.delete('/:id', protect, deleteMatch);

module.exports = router;
