// ============================================================
// models/User.js
// ============================================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const shortcutPrefsSchema = new mongoose.Schema({
  dot: { type: String, default: 'D' },
  single: { type: String, default: '1' },
  double: { type: String, default: '2' },
  triple: { type: String, default: '3' },
  four: { type: String, default: '4' },
  six: { type: String, default: '6' },
  wicket: { type: String, default: 'W' },
  wide: { type: String, default: 'X' },
  noBall: { type: String, default: 'N' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  shortcutPrefs: { type: shortcutPrefsSchema, default: () => ({}) },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

// ============================================================
// models/Player.js
// ============================================================
const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['batsman', 'bowler', 'allrounder', 'wicketkeeper'], default: 'batsman' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  stats: {
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
  },
}, { timestamps: true });

const Player = mongoose.model('Player', playerSchema);

// ============================================================
// models/Team.js
// ============================================================
const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, trim: true },
  shortName: { type: String, trim: true, maxlength: 5 },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);

// ============================================================
// models/BallByBall.js
// ============================================================
const ballSchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  innings: { type: Number, required: true, enum: [1, 2] },
  over: { type: Number, required: true },
  ball: { type: Number, required: true },
  batsman: { type: String, required: true },
  bowler: { type: String, required: true },
  runs: { type: Number, default: 0 },
  extra: { type: String, enum: ['wide', 'noball', 'bye', 'legbye', null], default: null },
  extraRuns: { type: Number, default: 0 },
  wicket: { type: Boolean, default: false },
  wicketType: { type: String, enum: ['Bowled', 'Caught', 'Run Out', 'LBW', 'Stumped', 'Hit Wicket', null], default: null },
  commentary: { type: String },
}, { timestamps: true });

// Compound index for fast querying
ballSchema.index({ match: 1, innings: 1, over: 1, ball: 1 });

const BallByBall = mongoose.model('BallByBall', ballSchema);

// ============================================================
// models/Scorecard.js
// ============================================================
const battingStatSchema = new mongoose.Schema({
  name: String, runs: Number, balls: Number,
  fours: Number, sixes: Number,
  out: Boolean, dismissal: String,
}, { _id: false });

const bowlingStatSchema = new mongoose.Schema({
  name: String, overs: Number, maidens: Number,
  runs: Number, wickets: Number,
}, { _id: false });

const fowSchema = new mongoose.Schema({
  wicket: Number, score: Number, batsman: String, over: String,
}, { _id: false });

const inningsSchema = new mongoose.Schema({
  battingTeam: String,
  bowlingTeam: String,
  totalRuns: Number,
  totalWickets: Number,
  overs: String,
  extras: {
    wide: { type: Number, default: 0 },
    noball: { type: Number, default: 0 },
    bye: { type: Number, default: 0 },
    legbye: { type: Number, default: 0 },
  },
  batting: [battingStatSchema],
  bowling: [bowlingStatSchema],
  fallOfWickets: [fowSchema],
}, { _id: false });

const scorecardSchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, unique: true },
  innings1: inningsSchema,
  innings2: inningsSchema,
}, { timestamps: true });

const Scorecard = mongoose.model('Scorecard', scorecardSchema);

// ============================================================
// models/Match.js
// ============================================================
const matchSchema = new mongoose.Schema({
  teamA: { type: String, required: true },
  teamB: { type: String, required: true },
  tossWonBy: String,
  tossDecision: { type: String, enum: ['bat', 'field'] },
  format: { type: String, enum: ['5', '10', '20', 'custom'] },
  totalOvers: { type: Number, required: true },
  status: { type: String, enum: ['live', 'completed', 'abandoned'], default: 'live', index: true },
  currentInnings: { type: Number, default: 1 },
  liveScore: {
    innings: { type: Number, default: 1 },
    score: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    currentOver: { type: Number, default: 0 },
    currentBall: { type: Number, default: 0 },
    striker: String,
    nonStriker: String,
    bowler: String,
    extras: {
      wide: { type: Number, default: 0 },
      noball: { type: Number, default: 0 },
      bye: { type: Number, default: 0 },
      legbye: { type: Number, default: 0 },
    },
  },
  innings1Total: { type: Number, default: null },
  innings1Wickets: { type: Number, default: null },
  result: { type: String, default: null },
  winner: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Index for searching by team name
matchSchema.index({ teamA: 'text', teamB: 'text' });
matchSchema.index({ createdAt: -1 });

const Match = mongoose.model('Match', matchSchema);

module.exports = { User, Player, Team, Match, BallByBall, Scorecard };
