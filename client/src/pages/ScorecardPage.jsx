import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { selectMatch, selectOverString } from '../redux/slices/matchSlice';
import { calcStrikeRate, calcEconomy } from '../utils/cricket';
import { exportScorecardPDF } from '../utils/exportPDF';

export default function ScorecardPage() {
  const match = useSelector(selectMatch);
  const overStr = useSelector(selectOverString);
  const navigate = useNavigate();

  const {
    status, teamA, teamB, innings, battingTeam,
    score, wickets, extras, striker, nonStriker, bowler,
    battingLineup, bowlingLineup, fallOfWickets,
    target, innings1, result, winner, tossWonBy, tossChoice,
    playersA, playersB, totalOvers,
  } = match;

  const battingTeamName = battingTeam === 'A' ? teamA : teamB;
  const bowlingTeamName = battingTeam === 'A' ? teamB : teamA;

  // 2nd innings batting: include striker & nonStriker (tracked separately)
  const inn2Batting = [
    striker,
    nonStriker,
    ...battingLineup.filter(
      (b) => b && b.name !== striker?.name && b.name !== nonStriker?.name
    ),
  ].filter(Boolean);

  // 2nd innings bowling: merge current bowler's live stats
  const inn2Bowling = bowlingLineup.map((b) =>
    b.name === bowler?.name ? { ...bowler } : b
  ).filter((b) => b.overs > 0 || b.balls > 0);

  const inn2Extras = Object.values(extras || {}).reduce((a, v) => a + (v || 0), 0);

  const handleExportPDF = () => {
    try { exportScorecardPDF(match); toast.success('Scorecard exported!'); }
    catch { toast.error('PDF export failed'); }
  };

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
        <span className="text-4xl">📋</span>
        <p className="font-display tracking-wider">No match data</p>
        <button onClick={() => navigate('/')} className="text-accent text-sm underline">Set up a match</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 flex flex-col gap-4 pb-10">

      {/* Match header */}
      <div className="cricket-card">
        <div className="p-4">
          <div className="font-display text-lg text-white">{teamA} <span className="text-gray-500 text-sm">vs</span> {teamB}</div>
          <div className="text-xs text-gray-500 mt-0.5">{match.totalOvers} overs · {innings === 1 ? '1st Innings' : '2nd Innings'}</div>
          {tossWonBy && (
            <div className="text-[11px] text-amber-400 mt-1">🪙 {tossWonBy} won toss &amp; elected to {tossChoice}</div>
          )}
          {result ? (
            <div className="mt-2 px-3 py-2 bg-accent/10 border border-accent/30 rounded-lg">
              <span className="text-accent font-display tracking-wide text-sm">🏆 {winner} {result}</span>
            </div>
          ) : (
            target && <div className="mt-2 text-amber-400 text-sm font-display">Target: {target} · Need: {Math.max(0, target - score)}</div>
          )}
        </div>
      </div>

      {/* ── 1ST INNINGS ── */}
      {innings1 && (
        <InningsCard
          label={`1ST INNINGS — ${innings1.battingTeam || teamA}`}
          batting={innings1.batting || []}
          bowling={innings1.bowling || []}
          score={innings1.score}
          wickets={innings1.wickets}
          overs={innings1.overs}
          extras={innings1.extras}
          fow={innings1.fallOfWickets}
          bowlingLabel={`BOWLING — ${innings1.battingTeam === teamA ? teamB : teamA}`}
        />
      )}

      {/* ── 2ND INNINGS (or 1st if still in progress) ── */}
      <InningsCard
        label={`${innings === 2 ? '2ND' : '1ST'} INNINGS — ${battingTeamName}`}
        batting={inn2Batting}
        bowling={inn2Bowling}
        score={score}
        wickets={wickets}
        overs={overStr}
        extras={extras}
        fow={fallOfWickets}
        bowlingLabel={`BOWLING — ${bowlingTeamName}`}
        currentStriker={striker?.name}
        target={target}
      />

      {/* Navigation */}
      <div className="flex gap-2">
        {status !== 'completed' && (
          <button onClick={() => navigate('/live')}
            className="flex-1 bg-pitch-950 border border-pitch-700 text-pitch-300 font-display tracking-wider rounded-xl py-3 text-sm hover:bg-pitch-900 transition-all">
            ← Back to Live
          </button>
        )}
        <button onClick={handleExportPDF}
          className="flex-1 bg-blue-900/40 border border-blue-800 text-blue-400 font-display tracking-wider rounded-xl py-3 text-sm hover:bg-blue-900/60 transition-all">
          Export PDF
        </button>
        {status === 'completed' && (
          <button
            onClick={() => navigate('/', {
              state: { teamA, teamB, totalOvers, playersA, playersB },
            })}
            className="flex-1 bg-surface-3 border border-surface-4 text-gray-300 font-display tracking-wider rounded-xl py-3 text-sm hover:border-accent hover:text-accent transition-all">
            New Match
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Shared innings card: batting + bowling + extras + FOW ──
function InningsCard({ label, batting, bowling, score, wickets, overs, extras, fow, bowlingLabel, currentStriker, target }) {
  const extrasTotal = Object.values(extras || {}).reduce((a, v) => a + (v || 0), 0);
  const batted = (batting || []).filter((b) => b.balls > 0 || b.out);
  const dnb    = (batting || []).filter((b) => !b.balls && !b.out);
  const bowled = (bowling || []).filter((b) => b.overs > 0 || b.balls > 0);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Batting ── */}
      <div className="cricket-card">
        <div className="cricket-card-header">
          BATTING — {label.replace(/^.*?—\s*/, '')}
          {target && <span className="ml-2 text-amber-500 font-normal">TARGET {target}</span>}
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-4">
              {['Batter','R','B','4s','6s','SR'].map((h, i) => (
                <th key={h} className={`py-2 px-3 text-gray-500 font-display text-[11px] tracking-wider ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batted.map((b) => (
              <tr key={b.name} className="border-b border-surface-4/40 last:border-0">
                <td className="py-2 px-3">
                  <div className="font-medium text-white">
                    {b.name}
                    {!b.out && b.name === currentStriker && <span className="text-accent ml-1">*</span>}
                    {!b.out && <span className="ml-1 text-[10px] text-accent/60">†</span>}
                  </div>
                  <div className="text-[10px] text-gray-600">{b.out ? b.dismissal : <span className="text-accent/70">not out</span>}</div>
                </td>
                <td className="py-2 px-3 text-right text-gray-200 font-display">{b.runs}</td>
                <td className="py-2 px-3 text-right text-gray-400">{b.balls}</td>
                <td className="py-2 px-3 text-right text-gray-400">{b.fours || 0}</td>
                <td className="py-2 px-3 text-right text-gray-400">{b.sixes || 0}</td>
                <td className="py-2 px-3 text-right text-gray-500">{calcStrikeRate(b.runs, b.balls)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {dnb.length > 0 && (
          <div className="px-3 py-1.5 border-t border-surface-4 text-[10px] text-gray-600">
            DNB: {dnb.map((b) => b.name).join(', ')}
          </div>
        )}
        <div className="flex justify-between items-center px-3 py-1.5 border-t border-surface-4 text-xs text-gray-400">
          <span>Extras: {extrasTotal} (W:{extras?.wide||0} NB:{extras?.noball||0} B:{extras?.bye||0} LB:{extras?.legbye||0})</span>
        </div>
        <div className="flex justify-between items-center px-3 py-2.5 bg-surface-3 text-sm font-display">
          <span className="text-gray-300">TOTAL</span>
          <span className="text-white">{score}/{wickets} ({overs} ov)</span>
        </div>
        {fow?.length > 0 && (
          <div className="px-3 py-2 border-t border-surface-4 text-[10px] text-gray-500 leading-loose">
            <span className="text-gray-600 font-display tracking-wider">FOW: </span>
            {fow.map((f, i) => (
              <span key={i}>
                <span className="text-gray-300">{f.wicket}-{f.score}</span>
                {' '}({f.batsman}, {f.over}ov)
                {i < fow.length - 1 && <span className="text-gray-700"> · </span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Bowling ── */}
      {bowled.length > 0 && (
        <div className="cricket-card">
          <div className="cricket-card-header">{bowlingLabel || 'BOWLING'}</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-4">
                {['Bowler','O','M','R','W','Eco'].map((h, i) => (
                  <th key={h} className={`py-2 px-3 text-gray-500 font-display text-[11px] tracking-wider ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bowled.map((b) => (
                <tr key={b.name} className="border-b border-surface-4/40 last:border-0">
                  <td className="py-2 px-3 font-medium text-white">{b.name}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{b.overs}{b.balls ? '.' + b.balls : ''}</td>
                  <td className="py-2 px-3 text-right text-gray-500">{b.maidens || 0}</td>
                  <td className="py-2 px-3 text-right text-gray-300">{b.runs}</td>
                  <td className="py-2 px-3 text-right text-accent font-display">{b.wickets}</td>
                  <td className="py-2 px-3 text-right text-gray-500">{calcEconomy(b.runs, b.overs, b.balls || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
