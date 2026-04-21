/**
 * Cricket utility functions
 */

export const overString = (over, ball) => `${over}.${ball}`;

export const calcCRR = (runs, over, ball) => {
  const balls = over * 6 + ball;
  return balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';
};

export const calcRRR = (target, runs, totalOvers, currentOver, currentBall) => {
  if (!target) return null;
  const ballsLeft = (totalOvers - currentOver) * 6 - currentBall;
  if (ballsLeft <= 0) return '∞';
  return (((target - runs) / ballsLeft) * 6).toFixed(2);
};

export const calcStrikeRate = (runs, balls) =>
  balls > 0 ? ((runs / balls) * 100).toFixed(1) : '-';

export const calcEconomy = (runs, overs, balls) => {
  const totalBalls = overs * 6 + balls;
  return totalBalls > 0 ? ((runs / totalBalls) * 6).toFixed(2) : '-';
};

export const formatOvers = (overs, balls) =>
  balls > 0 ? `${overs}.${balls}` : `${overs}.0`;

export const ballClass = (ball) => {
  if (ball.wicket) return 'bg-red-900/60 text-red-400 border-red-700';
  if (ball.extra === 'wide') return 'bg-amber-900/40 text-amber-400 border-amber-700';
  if (ball.extra === 'noball') return 'bg-orange-900/40 text-orange-400 border-orange-700';
  if (ball.extra === 'bye' || ball.extra === 'legbye') return 'bg-pitch-900/60 text-pitch-400 border-pitch-700';
  if (ball.runs === 4) return 'bg-pitch-900 text-pitch-300 border-pitch-500';
  if (ball.runs === 6) return 'bg-lime-900/60 text-lime-300 border-lime-600';
  if (ball.runs > 0) return 'bg-pitch-950 text-pitch-400 border-pitch-800';
  return 'bg-surface-3 text-gray-500 border-surface-4';
};

export const ballLabel = (ball) => {
  if (ball.wicket) return 'W';
  if (ball.extra === 'wide') return 'Wd';
  if (ball.extra === 'noball') return 'NB';
  if (ball.extra === 'bye') return 'B';
  if (ball.extra === 'legbye') return 'LB';
  return String(ball.runs);
};

export const generateCommentary = (ball) => {
  const { batsman, bowler, runs, extra, wicket, wicketType } = ball;
  if (wicket) {
    const lines = {
      Bowled: `Bowled him! ${bowler} cleans up ${batsman}. What a delivery!`,
      Caught: `Caught! ${batsman} goes for a mistimed shot and the fielder takes a sharp catch off ${bowler}.`,
      'Run Out': `Run out! Terrible mix-up between the batsmen. ${batsman} has to go.`,
      LBW: `LBW! ${bowler} traps ${batsman} plumb in front. Not much room to escape that.`,
      Stumped: `Stumped! ${batsman} steps out and misses, the keeper whips the bails off in a flash.`,
    };
    return lines[wicketType] || `${batsman} is out! ${bowler} takes the wicket.`;
  }
  if (extra === 'wide') return `Wide ball from ${bowler}. Extra run added.`;
  if (extra === 'noball') return `No ball! Free hit coming up.`;
  if (runs === 6) return `SIX! ${batsman} sends that into the stands off ${bowler}. Magnificent!`;
  if (runs === 4) return `FOUR! ${batsman} finds the gap, the ball races to the boundary off ${bowler}.`;
  if (runs === 0) return `Dot ball. ${bowler} keeps it tight, no run off ${batsman}.`;
  return `${runs} run${runs > 1 ? 's' : ''} taken by ${batsman} off ${bowler}.`;
};

export const winProbability = (score, target, totalOvers, currentOver, currentBall, wickets) => {
  if (!target) return null;
  const runsNeeded = target - score;
  const ballsLeft = (totalOvers - currentOver) * 6 - currentBall;
  if (ballsLeft <= 0) return runsNeeded <= 0 ? 100 : 0;
  const wicketsLeft = 10 - wickets;
  // Simplified model: based on RRR vs available resources
  const rrr = (runsNeeded / ballsLeft) * 6;
  const resourceFactor = (wicketsLeft / 10) * (ballsLeft / (totalOvers * 6));
  // Higher RRR = lower probability
  const raw = Math.max(0, Math.min(100, 50 + (resourceFactor * 100) - (rrr * 5)));
  return Math.round(raw);
};
