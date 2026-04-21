const express = require('express');
const router = express.Router();
const { Team } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const teams = await Team.find().populate('players').lean();
    res.json({ teams });
  } catch (err) { next(err); }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const team = await Team.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ team });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate('players');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({ team });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
