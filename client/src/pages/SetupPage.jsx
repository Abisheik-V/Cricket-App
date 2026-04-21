import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { setupMatch } from '../redux/slices/matchSlice';

const OVER_OPTIONS = [5, 10, 20, 'Custom'];

const defaultPlayersA = ['Rohit Sharma','Ishan Kishan','Suryakumar Yadav','Tilak Varma','Hardik Pandya','Kieron Pollard','Tim David','Krunal Pandya','Jasprit Bumrah','Piyush Chawla','Jofra Archer'];
const defaultPlayersB = ['Ruturaj Gaikwad','Devon Conway','Ajinkya Rahane','Ambati Rayudu','Ravindra Jadeja','MS Dhoni','Deepak Chahar','Tushar Deshpande','Mitchell Santner','Simarjeet Singh','Matheesha Pathirana'];

export default function SetupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const prev = location.state; // populated when coming from "New Match" on scorecard

  const [teamA, setTeamA] = useState(prev?.teamA || 'Mumbai Indians');
  const [teamB, setTeamB] = useState(prev?.teamB || 'Chennai SC');
  const [selectedOvers, setSelectedOvers] = useState(prev?.totalOvers || 10);
  const [customOvers, setCustomOvers] = useState('');
  const [playersA, setPlayersA] = useState(prev?.playersA?.length ? [...prev.playersA] : [...defaultPlayersA]);
  const [playersB, setPlayersB] = useState(prev?.playersB?.length ? [...prev.playersB] : [...defaultPlayersB]);
  const [strikerIdx, setStrikerIdx] = useState(0);
  const [nonStrikerIdx, setNonStrikerIdx] = useState(1);
  const [bowlerIdx, setBowlerIdx] = useState(0);
  const [tossWinner, setTossWinner] = useState('A');
  const [tossChoice, setTossChoice] = useState('batting');

  // Which team bats first based on toss
  const battingTeamIsA = (tossWinner === 'A' && tossChoice === 'batting') ||
                         (tossWinner === 'B' && tossChoice === 'fielding');
  const battingPlayers = battingTeamIsA ? playersA : playersB;
  const bowlingPlayers = battingTeamIsA ? playersB : playersA;
  const tossBattingTeamName = battingTeamIsA ? (teamA || 'Team A') : (teamB || 'Team B');
  const tossWinnerName = tossWinner === 'A' ? (teamA || 'Team A') : (teamB || 'Team B');
  const tossBowlingTeamName = battingTeamIsA ? (teamB || 'Team B') : (teamA || 'Team A');

  const updatePlayerA = useCallback((i, val) => {
    setPlayersA((prev) => { const next = [...prev]; next[i] = val; return next; });
  }, []);
  const updatePlayerB = useCallback((i, val) => {
    setPlayersB((prev) => { const next = [...prev]; next[i] = val; return next; });
  }, []);

  const handleStart = () => {
    const overs = selectedOvers === 'Custom' ? parseInt(customOvers) : selectedOvers;
    if (!overs || overs < 1) return toast.error('Select valid number of overs');
    if (playersA.length < 11) return toast.error('Team A needs at least 11 players');
    if (playersB.length < 11) return toast.error('Team B needs at least 11 players');
    if (strikerIdx === nonStrikerIdx) return toast.error('Striker and non-striker must be different');

    dispatch(setupMatch({
      teamA, teamB, totalOvers: overs,
      tossWonBy: tossWinnerName,
      tossChoice,
      battingFirst: battingTeamIsA ? 'A' : 'B',
      playersA: playersA.filter(Boolean),
      playersB: playersB.filter(Boolean),
      strikerName: battingPlayers[strikerIdx],
      nonStrikerName: battingPlayers[nonStrikerIdx],
      bowlerName: bowlingPlayers[bowlerIdx],
    }));

    toast.success('Match started!');
    navigate('/live');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 flex flex-col gap-5 max-w-lg mx-auto pb-10"
    >
      <div>
        <h1 className="font-display text-2xl text-accent">MATCH SETUP</h1>
        <p className="text-gray-500 text-sm mt-1">Configure teams and start scoring</p>
      </div>

      {prev && (
        <div className="bg-amber-950/40 border border-amber-700/40 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-amber-400 text-lg">🔁</span>
          <div>
            <div className="text-amber-300 text-xs font-display tracking-wide">REMATCH</div>
            <div className="text-gray-400 text-[11px]">Pre-filled with {prev.teamA} vs {prev.teamB} — edit as needed</div>
          </div>
        </div>
      )}

      {/* Teams */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 font-display tracking-widest uppercase block mb-1.5">Team A</label>
          <input className="cricket-input" value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="Team A name" />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-display tracking-widest uppercase block mb-1.5">Team B</label>
          <input className="cricket-input" value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="Team B name" />
        </div>
      </div>

      {/* Overs */}
      <div>
        <label className="text-xs text-gray-400 font-display tracking-widest uppercase block mb-2">Overs</label>
        <div className="flex gap-2 flex-wrap">
          {OVER_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => setSelectedOvers(o)}
              className={`px-4 py-2 rounded-lg text-sm font-display tracking-wide border transition-all ${
                selectedOvers === o
                  ? 'bg-pitch-900 border-pitch-500 text-pitch-400'
                  : 'bg-surface-3 border-surface-4 text-gray-400 hover:border-pitch-700'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        {selectedOvers === 'Custom' && (
          <input
            className="cricket-input mt-2"
            type="number"
            min="1" max="50"
            value={customOvers}
            onChange={(e) => setCustomOvers(e.target.value)}
            placeholder="Enter overs (1–50)"
          />
        )}
      </div>

      {/* Toss */}
      <div>
        <label className="text-xs text-gray-400 font-display tracking-widest uppercase block mb-2">Toss</label>
        <div className="bg-surface-2 border border-surface-4 rounded-xl p-4 flex flex-col gap-3">
          <div>
            <div className="text-[10px] text-gray-500 font-display tracking-wider mb-2">WHO WON THE TOSS?</div>
            <div className="grid grid-cols-2 gap-2">
              {(['A', 'B']).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTossWinner(t); setStrikerIdx(0); setNonStrikerIdx(1); setBowlerIdx(0); }}
                  className={`py-2 rounded-lg text-sm font-display tracking-wide border transition-all ${
                    tossWinner === t
                      ? 'bg-amber-950 border-amber-600 text-amber-300'
                      : 'bg-surface-3 border-surface-4 text-gray-400 hover:border-amber-800'
                  }`}
                >
                  {t === 'A' ? (teamA || 'Team A') : (teamB || 'Team B')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-display tracking-wider mb-2">ELECTED TO</div>
            <div className="grid grid-cols-2 gap-2">
              {[['batting', '🏏 Bat'], ['fielding', '🏟 Field']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setTossChoice(val); setStrikerIdx(0); setNonStrikerIdx(1); setBowlerIdx(0); }}
                  className={`py-2 rounded-lg text-sm font-display tracking-wide border transition-all ${
                    tossChoice === val
                      ? 'bg-pitch-950 border-pitch-500 text-pitch-300'
                      : 'bg-surface-3 border-surface-4 text-gray-400 hover:border-pitch-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Toss result banner */}
          <div className="bg-amber-950/40 border border-amber-700/40 rounded-lg px-3 py-2.5">
            <div className="text-xs text-amber-300 font-display tracking-wide">
              🪙 <span className="font-semibold">{tossWinnerName}</span> won the toss and elected to{' '}
              <span className="font-semibold">{tossChoice}</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              ➜ <span className="text-accent font-medium">{tossBattingTeamName}</span> will bat first
            </div>
          </div>
        </div>
      </div>

      {/* Players A */}
      <PlayerList label={`${teamA} Players`} players={playersA} setPlayers={setPlayersA} updatePlayer={updatePlayerA} />

      {/* Players B */}
      <PlayerList label={`${teamB} Players`} players={playersB} setPlayers={setPlayersB} updatePlayer={updatePlayerB} />

      {/* Opening selections */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-xs text-gray-400 font-display tracking-widest uppercase block mb-1.5">
            Striker <span className="text-gray-600 normal-case tracking-normal">({tossBattingTeamName})</span>
          </label>
          <select className="cricket-input" value={strikerIdx} onChange={(e) => setStrikerIdx(+e.target.value)}>
            {battingPlayers.map((p, i) => <option key={i} value={i}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-display tracking-widest uppercase block mb-1.5">
            Non-Striker <span className="text-gray-600 normal-case tracking-normal">({tossBattingTeamName})</span>
          </label>
          <select className="cricket-input" value={nonStrikerIdx} onChange={(e) => setNonStrikerIdx(+e.target.value)}>
            {battingPlayers.map((p, i) => <option key={i} value={i}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-display tracking-widest uppercase block mb-1.5">
            Opening Bowler <span className="text-gray-600 normal-case tracking-normal">({tossBowlingTeamName})</span>
          </label>
          <select className="cricket-input" value={bowlerIdx} onChange={(e) => setBowlerIdx(+e.target.value)}>
            {bowlingPlayers.map((p, i) => <option key={i} value={i}>{p}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={handleStart}
        className="bg-pitch-700 hover:bg-pitch-600 text-white font-display tracking-widest text-base py-4 rounded-xl transition-all active:scale-98 mt-2"
      >
        START MATCH
      </button>
    </motion.div>
  );
}

function PlayerList({ label, players, setPlayers, updatePlayer }) {
  return (
    <div>
      <div className="text-xs text-gray-400 font-display tracking-widest uppercase mb-2 pb-1.5 border-b border-surface-4">
        {label} ({players.length})
      </div>
      <div className="flex flex-col gap-2">
        {players.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="cricket-input flex-1"
              value={p}
              onChange={(e) => updatePlayer(i, e.target.value)}
              placeholder={`Player ${i + 1}`}
            />
            {players.length > 11 && (
              <button
                onClick={() => setPlayers((prev) => prev.filter((_, j) => j !== i))}
                className="text-gray-600 hover:text-red-400 text-xl px-2 transition-colors"
              >×</button>
            )}
          </div>
        ))}
        <button
          onClick={() => setPlayers((prev) => [...prev, ''])}
          className="border border-dashed border-surface-4 text-gray-500 hover:border-pitch-700 hover:text-pitch-400 rounded-lg py-2 text-sm transition-all"
        >
          + Add Player
        </button>
      </div>
    </div>
  );
}
