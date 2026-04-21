const { Match, BallByBall, Scorecard } = require('../models');

// POST /api/matches/start
exports.startMatch = async (req, res, next) => {
  try {
    const { teamA, teamB, totalOvers, tossWonBy, tossDecision, playersA, playersB, striker, nonStriker, bowler } = req.body;

    const match = await Match.create({
      teamA, teamB, totalOvers,
      tossWonBy, tossDecision,
      format: [5, 10, 20].includes(totalOvers) ? String(totalOvers) : 'custom',
      liveScore: {
        innings: 1, score: 0, wickets: 0,
        currentOver: 0, currentBall: 0,
        striker, nonStriker, bowler,
      },
      createdBy: req.user?._id,
    });

    await Scorecard.create({
      match: match._id,
      innings1: {
        battingTeam: teamA, bowlingTeam: teamB,
        totalRuns: 0, totalWickets: 0, overs: '0.0',
        extras: { wide: 0, noball: 0, bye: 0, legbye: 0 },
        batting: (playersA || []).map(p => ({ name: p, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: '' })),
        bowling: (playersB || []).map(p => ({ name: p, overs: 0, maidens: 0, runs: 0, wickets: 0 })),
        fallOfWickets: [],
      },
    });

    req.app.get('io').emit('match:started', { matchId: match._id, teamA, teamB });

    res.status(201).json({ match });
  } catch (err) {
    next(err);
  }
};

// POST /api/matches/score
exports.recordScore = async (req, res, next) => {
  try {
    const { matchId, innings, over, ball, batsman, bowler, runs, extra, extraRuns, wicket, wicketType } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status === 'completed') return res.status(400).json({ error: 'Match already completed' });

    // Save ball
    const ballDoc = await BallByBall.create({
      match: matchId, innings, over, ball,
      batsman, bowler, runs: runs || 0,
      extra: extra || null, extraRuns: extraRuns || 0,
      wicket: !!wicket, wicketType: wicketType || null,
    });

    // Update live score
    const ls = match.liveScore;
    ls.score += (runs || 0) + (extraRuns || 0);
    if (wicket) ls.wickets += 1;
    if (extra !== 'wide' && extra !== 'noball') {
      ls.currentBall += 1;
      if (ls.currentBall >= 6) {
        ls.currentBall = 0;
        ls.currentOver += 1;
      }
    }
    ls.striker = req.body.newStriker || ls.striker;
    ls.nonStriker = req.body.newNonStriker || ls.nonStriker;
    ls.bowler = req.body.newBowler || ls.bowler;

    const totalBalls = ls.currentOver * 6 + ls.currentBall;
    if (extra) ls.extras[extra] = (ls.extras[extra] || 0) + 1;

    await match.save();

    // Broadcast to all spectators
    req.app.get('io').to(`match:${matchId}`).emit('match:scoreUpdate', {
      matchId, liveScore: match.liveScore, ball: ballDoc,
    });

    res.json({ match, ball: ballDoc });
  } catch (err) {
    next(err);
  }
};

// POST /api/matches/undo
exports.undoLastBall = async (req, res, next) => {
  try {
    const { matchId } = req.body;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const lastBall = await BallByBall.findOne({ match: matchId }).sort({ createdAt: -1 });
    if (!lastBall) return res.status(400).json({ error: 'No balls to undo' });

    // Reverse score
    const ls = match.liveScore;
    ls.score = Math.max(0, ls.score - (lastBall.runs || 0) - (lastBall.extraRuns || 0));
    if (lastBall.wicket) ls.wickets = Math.max(0, ls.wickets - 1);
    if (lastBall.extra !== 'wide' && lastBall.extra !== 'noball') {
      ls.currentBall -= 1;
      if (ls.currentBall < 0) { ls.currentBall = 5; ls.currentOver = Math.max(0, ls.currentOver - 1); }
    }
    if (lastBall.extra) ls.extras[lastBall.extra] = Math.max(0, (ls.extras[lastBall.extra] || 1) - 1);

    await lastBall.deleteOne();
    await match.save();

    req.app.get('io').to(`match:${matchId}`).emit('match:undo', { matchId, liveScore: match.liveScore });

    res.json({ match });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/matches/edit/:id
exports.editMatch = async (req, res, next) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json({ match });
  } catch (err) {
    next(err);
  }
};

// GET /api/matches/history
exports.getHistory = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$text = { $search: search };

    const matches = await Match.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Match.countDocuments(query);

    res.json({ matches, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/matches/:id
exports.getMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).lean();
    if (!match) return res.status(404).json({ error: 'Match not found' });
    const scorecard = await Scorecard.findOne({ match: req.params.id }).lean();
    const balls = await BallByBall.find({ match: req.params.id }).sort({ innings: 1, over: 1, ball: 1 }).lean();
    res.json({ match, scorecard, balls });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/matches/:id
exports.deleteMatch = async (req, res, next) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    await BallByBall.deleteMany({ match: req.params.id });
    await Scorecard.deleteOne({ match: req.params.id });
    res.json({ message: 'Match deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/matches/:id/complete
exports.completeMatch = async (req, res, next) => {
  try {
    const { result, winner, scorecard } = req.body;
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', result, winner },
      { new: true }
    );
    if (!match) return res.status(404).json({ error: 'Match not found' });

    if (scorecard) {
      await Scorecard.findOneAndUpdate({ match: req.params.id }, scorecard, { upsert: true, new: true });
    }

    req.app.get('io').to(`match:${req.params.id}`).emit('match:completed', { matchId: req.params.id, result, winner });

    res.json({ match });
  } catch (err) {
    next(err);
  }
};
