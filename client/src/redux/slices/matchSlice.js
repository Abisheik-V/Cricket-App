import { createSlice } from '@reduxjs/toolkit';

const OVER_BALL_COUNT = 6;

const defaultBatter = (name) => ({
  name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: '',
});
const defaultBowler = (name) => ({
  name, overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0,
});

const initialState = {
  matchId: null,
  status: 'idle', // idle | setup | live | completed
  teamA: '', teamB: '',
  totalOvers: 10,
  tossWonBy: '',
  tossChoice: '',
  innings: 1,
  battingTeam: 'A', // A or B
  score: 0,
  wickets: 0,
  currentOver: 0,
  currentBall: 0,
  extras: { wide: 0, noball: 0, bye: 0, legbye: 0 },
  striker: null,
  nonStriker: null,
  bowler: null,
  playersA: [],
  playersB: [],
  battingLineup: [],  // full lineup of batting team
  bowlingLineup: [],  // full lineup of bowling team
  allBalls: [],       // full ball-by-ball history
  currentOverBalls: [], // just the current over
  fallOfWickets: [],
  innings1: null,     // saved innings 1 result
  target: null,
  result: null,
  winner: null,
  partnership: { runs: 0, balls: 0 }, // current pair's stats
  shortcutMap: {
    dot: 'd', single: '1', double: '2', triple: '3',
    four: '4', six: '6', wicket: 'w', wide: 'x', noBall: 'n',
  },
};

const isExtraNoBall = (extra) => extra === 'wide' || extra === 'noball';

export const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    setupMatch: (state, action) => {
      const { teamA, teamB, totalOvers, tossWonBy, tossChoice, battingFirst,
              playersA, playersB, strikerName, nonStrikerName, bowlerName } = action.payload;
      const firstBat = battingFirst || 'A';
      Object.assign(state, {
        ...initialState,
        status: 'live',
        teamA, teamB, totalOvers, tossWonBy, tossChoice,
        innings: 1, battingTeam: firstBat,
        score: 0, wickets: 0, currentOver: 0, currentBall: 0,
        playersA, playersB,
        extras: { wide: 0, noball: 0, bye: 0, legbye: 0 },
        allBalls: [], currentOverBalls: [], fallOfWickets: [],
        innings1: null, target: null, result: null, winner: null,
      });
      state.battingLineup = (firstBat === 'B' ? playersB : playersA).map((name) => defaultBatter(name));
      state.bowlingLineup = (firstBat === 'B' ? playersA : playersB).map((name) => defaultBowler(name));
      state.striker = defaultBatter(strikerName);
      state.nonStriker = defaultBatter(nonStrikerName);
      state.bowler = defaultBowler(bowlerName);
    },

    recordRun: (state, action) => {
      const { runs } = action.payload;
      state.score += runs;
      state.striker.runs += runs;
      state.striker.balls += 1;
      if (runs === 4) state.striker.fours += 1;
      if (runs === 6) state.striker.sixes += 1;
      state.bowler.runs += runs;
      state.partnership.runs += runs;
      state.partnership.balls += 1;

      const ball = { over: state.currentOver, ball: state.currentBall, batsman: state.striker.name, bowler: state.bowler.name, runs, extra: null, wicket: false };
      state.allBalls.push(ball);
      state.currentOverBalls.push(ball);

      // Odd runs = swap strike
      if (runs % 2 !== 0) {
        [state.striker, state.nonStriker] = [state.nonStriker, state.striker];
      }

      matchSlice.caseReducers._advanceBall(state);
    },

    recordExtra: (state, action) => {
      const { type, additionalRuns = 0 } = action.payload;
      const isNoBallOrWide = isExtraNoBall(type); // wide | noball
      const totalRuns = isNoBallOrWide ? 1 + additionalRuns : additionalRuns;

      state.score += totalRuns;
      state.extras[type] += totalRuns;
      state.bowler.runs += totalRuns;
      state.partnership.runs += totalRuns;

      const ball = {
        over: state.currentOver, ball: state.currentBall,
        batsman: state.striker.name, bowler: state.bowler.name,
        runs: additionalRuns, extra: type, wicket: false,
      };
      state.allBalls.push(ball);
      state.currentOverBalls.push(ball);

      // Wide and no-ball don't count as a legal delivery
      if (!isNoBallOrWide) {
        state.striker.balls += 1;
        state.partnership.balls += 1;
        matchSlice.caseReducers._advanceBall(state);
      }
    },

    recordWicket: (state, action) => {
      const { mode, fielder, runOutOf } = action.payload;
      const isRunOut = mode === 'Run Out';
      const outPos = (isRunOut && runOutOf === 'nonStriker') ? 'nonStriker' : 'striker';
      const outBatsman = state[outPos];

      state.wickets += 1;
      state.striker.balls += 1;
      outBatsman.out = true;

      let dismissal;
      switch (mode) {
        case 'Bowled':     dismissal = `b ${state.bowler.name}`; break;
        case 'Caught':     dismissal = `c ${fielder} b ${state.bowler.name}`; break;
        case 'LBW':        dismissal = `lbw b ${state.bowler.name}`; break;
        case 'Stumped':    dismissal = `st ${fielder} b ${state.bowler.name}`; break;
        case 'Run Out':    dismissal = `run out (${fielder})`; break;
        case 'Hit Wicket': dismissal = `hit wkt b ${state.bowler.name}`; break;
        default:           dismissal = mode;
      }
      outBatsman.dismissal = dismissal;
      if (!isRunOut) state.bowler.wickets += 1;

      // Sync out player's full stats into battingLineup so:
      // 1) availableBatsmen filter (!b.out) correctly hides them
      // 2) scorecard can access their stats after they leave striker/nonStriker
      const lineupIdx = state.battingLineup.findIndex((b) => b.name === outBatsman.name);
      if (lineupIdx !== -1) {
        state.battingLineup[lineupIdx] = { ...state.battingLineup[lineupIdx], ...outBatsman };
      }

      state.fallOfWickets.push({
        wicket: state.wickets, score: state.score,
        batsman: outBatsman.name, over: `${state.currentOver}.${state.currentBall}`,
      });
      const ball = {
        over: state.currentOver, ball: state.currentBall,
        batsman: state.striker.name, bowler: state.bowler.name,
        runs: 0, extra: null, wicket: true, wicketType: mode, fielder: fielder || null,
      };
      state.allBalls.push(ball);
      state.currentOverBalls.push(ball);
      state.partnership = { runs: 0, balls: 0 }; // reset on wicket
      matchSlice.caseReducers._advanceBall(state);
    },

    setNewBatsman: (state, action) => {
      const { name, position } = action.payload;
      if (position === 'nonStriker') state.nonStriker = defaultBatter(name);
      else state.striker = defaultBatter(name);
    },

    setNewBowler: (state, action) => {
      const { name } = action.payload;
      // Save current bowler stats to lineup
      const idx = state.bowlingLineup.findIndex((b) => b.name === state.bowler.name);
      if (idx !== -1) state.bowlingLineup[idx] = { ...state.bowler };
      state.bowler = state.bowlingLineup.find((b) => b.name === name) || defaultBowler(name);
    },

    undoLastBall: (state) => {
      if (!state.allBalls.length) return;
      const last = state.allBalls.pop();
      state.currentOverBalls = state.currentOverBalls.filter(
        (b) => !(b.over === last.over && b.ball === last.ball)
      );

      if (last.runs) { state.score -= last.runs; }
      if (last.extra) { state.score -= 1; state.extras[last.extra] = Math.max(0, state.extras[last.extra] - 1); }
      if (last.wicket) {
        state.wickets -= 1;
        state.bowler.wickets -= 1;
        state.fallOfWickets.pop();
      }
      if (last.runs) {
        state.striker.runs -= last.runs;
        if (last.runs === 4) state.striker.fours -= 1;
        if (last.runs === 6) state.striker.sixes -= 1;
      }
      state.bowler.runs -= (last.runs || 0) + (last.extra ? 1 : 0);

      if (!isExtraNoBall(last.extra)) {
        state.striker.balls -= 1;
        state.currentBall -= 1;
        if (state.currentBall < 0) {
          state.currentBall = 5;
          state.currentOver = Math.max(0, state.currentOver - 1);
          state.bowler.balls = 5;
        } else {
          state.bowler.balls -= 1;
        }
      }

      if (last.runs % 2 !== 0) {
        [state.striker, state.nonStriker] = [state.nonStriker, state.striker];
      }
    },

    switchInnings: (state) => {
      const nextBatting = state.battingTeam === 'A' ? 'B' : 'A';
      const nextBatPlayers = nextBatting === 'A' ? state.playersA : state.playersB;
      const nextBowlPlayers = nextBatting === 'A' ? state.playersB : state.playersA;
      state.innings1 = {
        score: state.score,
        wickets: state.wickets,
        overs: `${state.currentOver}.${state.currentBall}`,
        battingTeam: state.battingTeam === 'A' ? state.teamA : state.teamB,
        extras: { ...state.extras },
        // Include striker & nonStriker who are tracked separately from battingLineup
        batting: [
          state.striker,
          state.nonStriker,
          ...state.battingLineup.filter(
            (b) => b && b.name !== state.striker?.name && b.name !== state.nonStriker?.name
          ),
        ].filter(Boolean),
        // Merge current bowler's live partial-over stats into bowlingLineup
        bowling: state.bowlingLineup.map((b) =>
          b.name === state.bowler?.name ? { ...state.bowler } : b
        ),
        fallOfWickets: [...state.fallOfWickets],
      };
      state.target = state.score + 1;
      state.innings = 2;
      state.battingTeam = nextBatting;
      state.score = 0;
      state.wickets = 0;
      state.currentOver = 0;
      state.currentBall = 0;
      state.extras = { wide: 0, noball: 0, bye: 0, legbye: 0 };
      state.allBalls = [];
      state.currentOverBalls = [];
      state.fallOfWickets = [];
      state.partnership = { runs: 0, balls: 0 };
      state.battingLineup = nextBatPlayers.map((name) => defaultBatter(name));
      state.bowlingLineup = nextBowlPlayers.map((name) => defaultBowler(name));
      state.striker = defaultBatter(nextBatPlayers[0]);
      state.nonStriker = defaultBatter(nextBatPlayers[1]);
      state.bowler = defaultBowler(nextBowlPlayers[0]);
    },

    endMatch: (state, action) => {
      const { result, winner } = action.payload;
      state.status = 'completed';
      state.result = result;
      state.winner = winner;
    },

    updateShortcuts: (state, action) => {
      state.shortcutMap = { ...state.shortcutMap, ...action.payload };
    },

    resetMatch: () => initialState,

    // Internal helper
    _advanceBall: (state) => {
      state.currentBall += 1;
      state.bowler.balls += 1;

      if (state.currentBall >= OVER_BALL_COUNT) {
        state.currentBall = 0;
        state.currentOver += 1;
        state.bowler.overs += 1;
        state.bowler.balls = 0;
        // Swap strike at end of over
        [state.striker, state.nonStriker] = [state.nonStriker, state.striker];
        // Save bowler stats
        const idx = state.bowlingLineup.findIndex((b) => b.name === state.bowler.name);
        if (idx !== -1) state.bowlingLineup[idx] = { ...state.bowler };
        state.currentOverBalls = [];
      }
    },
    setInningsOpeners: (state, action) => {
      const { strikerName, nonStrikerName, bowlerName } = action.payload;
      state.striker  = state.battingLineup.find((b) => b.name === strikerName)  || defaultBatter(strikerName);
      state.nonStriker = state.battingLineup.find((b) => b.name === nonStrikerName) || defaultBatter(nonStrikerName);
      state.bowler   = state.bowlingLineup.find((b) => b.name === bowlerName)   || defaultBowler(bowlerName);
    },
  },
});

export const {
  setupMatch, recordRun, recordExtra, recordWicket,
  setNewBatsman, setNewBowler, setInningsOpeners, undoLastBall,
  switchInnings, endMatch, updateShortcuts, resetMatch,
} = matchSlice.actions;

// Selectors
export const selectMatch = (s) => s.match;
export const selectCRR = (s) => {
  const { score, currentOver, currentBall } = s.match;
  const balls = currentOver * 6 + currentBall;
  return balls > 0 ? (score / balls * 6).toFixed(2) : '0.00';
};
export const selectRRR = (s) => {
  const { target, score, totalOvers, currentOver, currentBall } = s.match;
  if (!target) return null;
  const ballsLeft = (totalOvers - currentOver) * 6 - currentBall;
  if (ballsLeft <= 0) return null;
  return ((target - score) / ballsLeft * 6).toFixed(2);
};
export const selectOverString = (s) =>
  `${s.match.currentOver}.${s.match.currentBall}`;

export default matchSlice.reducer;
