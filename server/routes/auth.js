// ============================================================
// routes/auth.js
// ============================================================
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, getMe, updateShortcuts } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',
  [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })],
  register
);
router.post('/login',
  [body('email').isEmail(), body('password').notEmpty()],
  login
);
router.get('/me', protect, getMe);
router.patch('/shortcuts', protect, updateShortcuts);

module.exports = router;
