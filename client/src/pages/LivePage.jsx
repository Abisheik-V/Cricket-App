import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  recordRun, recordExtra, recordWicket, setNewBatsman, setNewBowler,
  setInningsOpeners, undoLastBall, switchInnings, endMatch,
  selectMatch, selectCRR, selectRRR, selectOverString,
} from '../redux/slices/matchSlice';
import { ballClass, ballLabel, generateCommentary, winProbability } from '../utils/cricket';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

export default function LivePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const match = useSelector(selectMatch);
  const crr = useSelector(selectCRR);
  const rrr = useSelector(selectRRR);
  const overStr = useSelector(selectOverString);

  const [wicketFlow, setWicketFlow] = useState(null);
  // null | { step: 'runout_who'|'fielder'|'batsman', mode, fielder, runOutOf, outPos }
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showOpenerModal, setShowOpenerModal] = useState(false);
  const [openerStriker, setOpenerStriker] = useState(0);
  const [openerNonStriker, setOpenerNonStriker] = useState(1);
  const [openerBowler, setOpenerBowler] = useState(0);
  const [showCommentary, setShowCommentary] = useState('');
  const [scoreAnim, setScoreAnim] = useState(false);

  const { status, score, wickets, striker, nonStriker, bowler,
    innings, teamA, teamB, totalOvers, currentOver, currentBall,
    battingLineup, bowlingLineup, target, innings1, allBalls, partnership } = match;

  const battingTeamName = match.battingTeam === 'A' ? teamA : teamB;
  const bowlingTeamName = match.battingTeam === 'A' ? teamB : teamA;
  const currentOverBalls = allBalls.filter((b) => b.over === currentOver);
  const need = target ? Math.max(0, target - score) : null;
  const winProb = target ? winProbability(score, target, totalOvers, currentOver, currentBall, wickets) : null;

  const flash = useCallback((commentary) => {
    setScoreAnim(true);
    setShowCommentary(commentary);
    setTimeout(() => setScoreAnim(false), 350);
    setTimeout(() => setShowCommentary(''), 3000);
  }, []);

  const checkInningsEnd = useCallback((newScore, newWickets, newOver) => {
    // 2nd innings: check if target reached at any point
    if (innings === 2 && target && newScore >= target) {
      dispatch(endMatch({ winner: battingTeamName, result: `won by ${10 - newWickets} wickets` }));
      navigate('/scorecard');
      return true;
    }

    const inningsOver = newWickets >= 10 || newOver >= totalOvers;
    if (!inningsOver) return false;

    if (innings === 1) {
      dispatch(switchInnings());
      setOpenerStriker(0); setOpenerNonStriker(1); setOpenerBowler(0);
      setShowOpenerModal(true);
      toast.success(`Innings break! Team 2 needs ${newScore + 1} to win.`, { duration: 4000 });
    } else {
      const diff = newScore - (target - 1);
      if (diff === -1) {
        dispatch(endMatch({ winner: 'Match', result: 'ended in a Tie' }));
      } else {
        dispatch(endMatch({ winner: bowlingTeamName, result: `won by ${Math.abs(diff)} runs` }));
      }
      navigate('/scorecard');
    }
    return true;
  }, [innings, target, totalOvers, battingTeamName, bowlingTeamName, dispatch, navigate]);

  const handleRun = useCallback((runs) => {
    dispatch(recordRun({ runs }));
    flash(generateCommentary({ batsman: striker?.name, bowler: bowler?.name, runs, extra: null, wicket: false }));
    const newBall = currentBall + 1;
    const newOver = newBall >= 6 ? currentOver + 1 : currentOver;
    if (newBall >= 6) setShowBowlerModal(true);
    checkInningsEnd(score + runs, wickets, newOver);
  }, [dispatch, flash, striker, bowler, currentBall, currentOver, score, wickets, checkInningsEnd]);

  const [extraFlow, setExtraFlow] = useState(null); // null | { type }

  const handleExtraClick = (type) => setExtraFlow({ type });

  const handleExtraConfirm = useCallback((additionalRuns) => {
    const type = extraFlow.type;
    dispatch(recordExtra({ type, additionalRuns }));
    const isNoBallOrWide = type === 'wide' || type === 'noball';
    const total = isNoBallOrWide ? 1 + additionalRuns : additionalRuns;
    flash(generateCommentary({ batsman: striker?.name, bowler: bowler?.name, runs: total, extra: type, wicket: false }));
    setExtraFlow(null);
  }, [dispatch, flash, striker, bowler, extraFlow]);

  // --- wicket flow ---
  const needsFielder = (mode) => mode === 'Caught' || mode === 'Stumped';

  const dispatchWicket = useCallback(({ mode, fielder, runOutOf }) => {
    const outPos = (mode === 'Run Out' && runOutOf === 'nonStriker') ? 'nonStriker' : 'striker';
    dispatch(recordWicket({ mode, fielder, runOutOf }));
    flash(generateCommentary({ batsman: striker?.name, bowler: bowler?.name, runs: 0, extra: null, wicket: true, wicketType: mode }));
    const newWickets = wickets + 1;
    const newBall = currentBall + 1;
    const newOver = newBall >= 6 ? currentOver + 1 : currentOver;
    const ended = checkInningsEnd(score, newWickets, newOver);
    if (newBall >= 6 && !ended) setShowBowlerModal(true);
    if (!ended && newWickets < 10) {
      setWicketFlow({ step: 'batsman', mode, fielder, runOutOf, outPos });
    } else {
      setWicketFlow(null);
    }
  }, [dispatch, flash, striker, bowler, wickets, currentBall, currentOver, score, checkInningsEnd]);

  const handleWicketClick = useCallback((mode) => {
    if (mode === 'Run Out') {
      setWicketFlow({ step: 'runout_who', mode, fielder: null, runOutOf: null, outPos: null });
    } else if (needsFielder(mode)) {
      setWicketFlow({ step: 'fielder', mode, fielder: null, runOutOf: 'striker', outPos: 'striker' });
    } else {
      dispatchWicket({ mode, fielder: null, runOutOf: 'striker' });
    }
  }, [dispatchWicket]);

  const handleRunOutWho = (runOutOf) =>
    setWicketFlow(prev => ({ ...prev, step: 'fielder', runOutOf }));

  const handleFielderSelect = (fielder) => {
    dispatchWicket({ mode: wicketFlow.mode, fielder, runOutOf: wicketFlow.runOutOf });
  };

  const handleNewBatsman = (name) => {
    dispatch(setNewBatsman({ name, position: wicketFlow?.outPos || 'striker' }));
    setWicketFlow(null);
  };

  useKeyboardShortcuts({ onWicket: handleWicketClick, active: !wicketFlow && !showBowlerModal });


  const availableBatsmen = battingLineup.filter(
    (b) => !b.out && b.name !== striker?.name && b.name !== nonStriker?.name
  );
  const availableFielders = bowlingLineup;

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
        <span className="text-4xl">🏏</span>
        <p className="font-display tracking-wider">No match in progress</p>
        <button onClick={() => navigate('/')} className="text-accent text-sm underline">Set up a match</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Scoreboard */}
      <div className="bg-gradient-to-br from-[#061209] via-surface-2 to-surface-2 p-4 border-b border-surface-4 relative overflow-hidden">
        {/* Neon grid lines bg decoration */}
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:'linear-gradient(rgba(0,255,136,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.3) 1px,transparent 1px)',backgroundSize:'24px 24px'}} />
        <div className="relative">
          <div className="text-[10px] font-display tracking-widest mb-1 neon-text opacity-70">
            {innings === 1 ? '1ST INNINGS' : '2ND INNINGS'} · {battingTeamName.toUpperCase()}
          </div>
          <div className="flex items-end gap-3 mb-2">
            <motion.span
              animate={scoreAnim ? { scale: 1.18 } : { scale: 1 }}
              className="neon-score text-6xl leading-none"
            >
              {score}
            </motion.span>
            <span className="font-display text-2xl text-surface-5 mb-1">/</span>
            <span className="font-display text-4xl text-gray-400 mb-0.5">{wickets}</span>
            <div className="ml-1 flex flex-col mb-1">
              <span className="font-mono text-base text-pitch-300">{overStr}</span>
              <span className="text-[9px] text-gray-600 tracking-widest">OVERS</span>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <div className="text-[9px] text-gray-600 font-display tracking-widest uppercase">CRR</div>
              <div className="font-mono text-pitch-300">{crr}</div>
            </div>
          {rrr && (
            <>
              <div>
                <div className="text-[9px] text-gray-600 font-display tracking-widest uppercase">RRR</div>
                <div className={`font-mono ${parseFloat(rrr) > parseFloat(crr) ? 'neon-red-text' : 'neon-text'}`}>{rrr}</div>
              </div>
              <div>
                <div className="text-[9px] text-gray-600 font-display tracking-widest uppercase">Target</div>
                <div className="font-mono neon-amber-text">{target}</div>
              </div>
              <div>
                <div className="text-[9px] text-gray-600 font-display tracking-widest uppercase">Need</div>
                <div className="font-mono neon-amber-text">{need}</div>
              </div>
            </>
          )}
        </div>
        {target && (
          <div className="mt-2">
            <div className="h-0.5 bg-surface-4 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{background:'linear-gradient(90deg,#00ff88,#00e5ff)'}}
                animate={{ width: `${Math.min(100, (score / target) * 100).toFixed(1)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {winProb !== null && (
              <div className="text-[9px] text-gray-600 mt-1 font-display tracking-widest">
                WIN PROBABILITY: <span className="neon-text">{winProb}%</span>
              </div>
            )}
          </div>
        )}
        </div>{/* /relative */}
      </div>

      {/* Players strip */}
      <div className="bg-surface-2 border-b border-surface-4 px-4 py-2 flex gap-4 overflow-x-auto hide-scrollbar">
        <PlayerChip label="BAT*" labelClass="bg-pitch-950 border border-pitch-800 neon-text text-[10px]" name={striker?.name} stat={`${striker?.runs}(${striker?.balls})`} />
        <div className="w-px bg-surface-4 flex-shrink-0" />
        <PlayerChip label="BAT" labelClass="bg-surface-3 border border-surface-4 text-gray-500 text-[10px]" name={nonStriker?.name} stat={`${nonStriker?.runs}(${nonStriker?.balls})`} />
        <div className="w-px bg-surface-4 flex-shrink-0" />
        <PlayerChip label="BOWL" labelClass="bg-[#050d18] border border-[#0a1e38] neon-cyan-text text-[10px]" name={bowler?.name}
          stat={`${bowler?.wickets}-${bowler?.runs} (${bowler?.overs}${bowler?.balls ? '.' + bowler.balls : ''})`} />
      </div>

      {/* Partnership strip */}
      <div className="bg-surface-2 border-b border-surface-4 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-display tracking-widest text-gray-600 uppercase">Partnership</span>
          <motion.span
            key={partnership?.runs}
            initial={{ scale: 1.3, color: '#4ade80' }}
            animate={{ scale: 1, color: '#d1fae5' }}
            transition={{ duration: 0.3 }}
            className="font-display text-lg leading-none"
          >
            {partnership?.runs ?? 0}
          </motion.span>
          <span className="text-gray-600 text-xs font-display">({partnership?.balls ?? 0}b)</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span>
            <span className="text-gray-400 font-medium">{striker?.name?.split(' ').pop()}</span>
            <span className="text-gray-600 ml-1">{striker?.runs}*</span>
          </span>
          <span className="text-gray-700">×</span>
          <span>
            <span className="text-gray-400 font-medium">{nonStriker?.name?.split(' ').pop()}</span>
            <span className="text-gray-600 ml-1">{nonStriker?.runs}</span>
          </span>
        </div>
      </div>

      {/* Ball history */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto hide-scrollbar border-b border-surface-4">
        <span className="text-[10px] text-gray-600 font-display tracking-wider flex-shrink-0">THIS OVER</span>
        {currentOverBalls.length === 0 && <span className="text-[11px] text-gray-700">—</span>}
        {currentOverBalls.map((b, i) => (
          <div key={i} className={`ball-dot ${ballClass(b)}`}>{ballLabel(b)}</div>
        ))}
      </div>

      {/* Commentary */}
      <AnimatePresence>
        {showCommentary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-pitch-950 border-b border-pitch-900 px-4 py-2 text-xs text-pitch-400 italic"
          >
            {showCommentary}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scoring panel */}
      <div className="p-4 flex flex-col gap-4 flex-1">
        {/* Runs */}
        <div>
          <div className="text-[10px] text-gray-600 font-display tracking-wider uppercase mb-2">
            Runs &nbsp;<Key>D</Key><Key>1</Key><Key>2</Key><Key>3</Key><Key>4</Key><Key>6</Key>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {[0,1,2,3,4,6].map((r) => (
              <button
                key={r}
                onClick={() => handleRun(r)}
                className={`score-btn ${
                  r === 4 ? 'bg-pitch-950 border-pitch-600 text-pitch-300 hover:bg-pitch-900' :
                  r === 6 ? 'bg-lime-950 border-lime-700 text-lime-300 hover:bg-lime-900' :
                  'bg-surface-3 border-surface-4 text-gray-200 hover:bg-pitch-900 hover:border-pitch-700 hover:text-accent'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Extras */}
        <div>
          <div className="text-[10px] text-gray-600 font-display tracking-wider uppercase mb-2">
            Extras &nbsp;<Key>X</Key><Key>N</Key>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[['wide','Wide'],['noball','No Ball'],['bye','Bye'],['legbye','Leg Bye']].map(([type, label]) => (
              <button
                key={type}
                onClick={() => handleExtraClick(type)}
                className="score-btn bg-surface-3 border-surface-4 text-amber-400 hover:bg-amber-950 hover:border-amber-700 text-sm"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Wickets */}
        <div>
          <div className="text-[10px] text-gray-600 font-display tracking-wider uppercase mb-2">
            Wicket &nbsp;<Key>W</Key>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[['Bowled'],['Caught'],['Run Out'],['LBW'],['Stumped'],['Hit Wicket']].map(([mode]) => (
              <button
                key={mode}
                onClick={() => handleWicketClick(mode)}
                className="score-btn bg-red-950 border-red-900 text-red-400 hover:bg-red-900 hover:border-red-700 text-sm"
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => { dispatch(undoLastBall()); toast('Last ball undone', { icon: '↩' }); }}
            className="flex-1 bg-surface-3 border border-surface-4 text-gray-400 hover:border-gray-500 hover:text-gray-200 rounded-xl py-3 text-sm font-display tracking-wide transition-all"
          >
            ↩ Undo
          </button>
          <button
            onClick={() => navigate('/scorecard')}
            className="flex-1 bg-surface-3 border border-surface-4 text-gray-400 hover:border-gray-500 hover:text-gray-200 rounded-xl py-3 text-sm font-display tracking-wide transition-all"
          >
            Full Card
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-700 font-display tracking-widest">
          KEYBOARD SHORTCUTS ACTIVE — D · 1–6 · W · X · N
        </p>
      </div>

      {/* 2nd Innings Opener Selection */}
      <AnimatePresence>
        {showOpenerModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
            <motion.div initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
              className="bg-surface-2 rounded-t-2xl p-5 w-full max-w-md">
              <div className="font-display text-sm text-accent tracking-widest mb-1">2ND INNINGS</div>
              <div className="text-gray-400 text-xs mb-4">Choose your opening pair and bowler</div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-display tracking-wider mb-1 block">STRIKER</label>
                  <select className="cricket-input" value={openerStriker} onChange={(e) => setOpenerStriker(+e.target.value)}>
                    {battingLineup.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-display tracking-wider mb-1 block">NON-STRIKER</label>
                  <select className="cricket-input" value={openerNonStriker} onChange={(e) => setOpenerNonStriker(+e.target.value)}>
                    {battingLineup.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-display tracking-wider mb-1 block">OPENING BOWLER</label>
                  <select className="cricket-input" value={openerBowler} onChange={(e) => setOpenerBowler(+e.target.value)}>
                    {bowlingLineup.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (openerStriker === openerNonStriker) { toast.error('Striker and non-striker must be different'); return; }
                    dispatch(setInningsOpeners({
                      strikerName: battingLineup[openerStriker]?.name,
                      nonStrikerName: battingLineup[openerNonStriker]?.name,
                      bowlerName: bowlingLineup[openerBowler]?.name,
                    }));
                    setShowOpenerModal(false);
                  }}
                  className="bg-accent/20 border border-accent/50 text-accent font-display tracking-widest rounded-xl py-3 text-sm hover:bg-accent/30 transition-all mt-1"
                >
                  START 2ND INNINGS ▶
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extras runs picker */}
      <AnimatePresence>
        {extraFlow && (() => {
          const isNoBallOrWide = extraFlow.type === 'wide' || extraFlow.type === 'noball';
          const typeLabel = { wide: 'WIDE', noball: 'NO BALL', bye: 'BYE', legbye: 'LEG BYE' }[extraFlow.type];
          const runOptions = isNoBallOrWide
            ? [0, 1, 2, 3, 4, 6]   // additional runs on top of 1-run penalty
            : [1, 2, 3, 4];         // actual runs scored (bye/legbye)
          return (
            <Modal title={`${typeLabel} — HOW MANY RUNS?`} onClose={() => setExtraFlow(null)}>
              {isNoBallOrWide && (
                <p className="text-[11px] text-gray-500 mb-1">
                  1 penalty + additional runs (e.g. boundary = +4)
                </p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {runOptions.map((r) => (
                  <button key={r} onClick={() => handleExtraConfirm(r)}
                    className="score-btn bg-surface-3 border-surface-4 text-amber-300 hover:bg-amber-950 hover:border-amber-600 font-display text-lg">
                    {isNoBallOrWide ? (r === 0 ? '1' : `1+${r}`) : r}
                  </button>
                ))}
              </div>
            </Modal>
          );
        })()}
      </AnimatePresence>

      {/* Run Out — who got out? */}
      <AnimatePresence>
        {wicketFlow?.step === 'runout_who' && (
          <Modal title="RUN OUT — WHO GOT OUT?" onClose={() => setWicketFlow(null)}>
            <button onClick={() => handleRunOutWho('striker')}
              className="w-full text-left bg-surface-3 border border-surface-4 hover:border-red-600 hover:text-red-300 text-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
              <span className="font-medium">🏏 {striker?.name}</span>
              <span className="ml-2 text-[11px] text-gray-500">Striker</span>
            </button>
            <button onClick={() => handleRunOutWho('nonStriker')}
              className="w-full text-left bg-surface-3 border border-surface-4 hover:border-red-600 hover:text-red-300 text-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
              <span className="font-medium">{nonStriker?.name}</span>
              <span className="ml-2 text-[11px] text-gray-500">Non-Striker</span>
            </button>
          </Modal>
        )}
      </AnimatePresence>

      {/* Caught/Stumped/Run Out — select fielder */}
      <AnimatePresence>
        {wicketFlow?.step === 'fielder' && (
          <Modal title={`${wicketFlow.mode.toUpperCase()} — SELECT FIELDER`} onClose={() => setWicketFlow(null)}>
            {availableFielders.map((f) => (
              <button key={f.name} onClick={() => handleFielderSelect(f.name)}
                className="w-full text-left bg-surface-3 border border-surface-4 hover:border-red-600 hover:text-red-300 text-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
                <span className="font-medium">{f.name}</span>
                <span className="ml-3 text-[11px] text-gray-500">{f.overs}ov {f.wickets}w</span>
              </button>
            ))}
          </Modal>
        )}
      </AnimatePresence>

      {/* New Batsman */}
      <AnimatePresence>
        {wicketFlow?.step === 'batsman' && (
          <Modal title="SELECT NEW BATSMAN" onClose={null}>
            {availableBatsmen.length === 0
              ? <p className="text-gray-500 text-sm text-center py-4">No more batsmen available</p>
              : availableBatsmen.map((b) => (
                <button key={b.name} onClick={() => handleNewBatsman(b.name)}
                  className="w-full text-left bg-surface-3 border border-surface-4 hover:border-pitch-600 hover:text-accent text-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
                  {b.name}
                </button>
              ))
            }
          </Modal>
        )}
      </AnimatePresence>

      {/* New Bowler */}
      <AnimatePresence>
        {showBowlerModal && (
          <Modal title="OVER COMPLETE — SELECT BOWLER" onClose={null}>
            {bowlingLineup.map((b) => (
              <button key={b.name} onClick={() => {
                dispatch(setNewBowler({ name: b.name }));
                setShowBowlerModal(false);
              }} className="w-full text-left bg-surface-3 border border-surface-4 hover:border-blue-600 hover:text-blue-400 text-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
                <span className="font-medium">{b.name}</span>
                <span className="ml-3 text-[11px] text-gray-500">{b.overs}ov {b.runs}r {b.wickets}w</span>
              </button>
            ))}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayerChip({ label, labelClass, name, stat }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[90px]">
      <span className={`stat-badge w-fit ${labelClass}`}>{label}</span>
      <span className="text-xs font-medium text-white whitespace-nowrap">{name || '—'}</span>
      <span className="text-[11px] text-gray-500">{stat}</span>
    </div>
  );
}

function Key({ children }) {
  return (
    <span className="inline-block bg-surface-3 border border-surface-4 rounded text-[9px] font-display px-1 py-0.5 text-gray-500">
      {children}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50"
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="bg-surface-2 rounded-t-2xl p-5 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4 border-b border-surface-4 pb-3">
          <span className="font-display text-sm text-gray-300 tracking-widest">{title}</span>
          {onClose && (
            <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xl leading-none">×</button>
          )}
        </div>
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">{children}</div>
      </motion.div>
    </motion.div>
  );
}
